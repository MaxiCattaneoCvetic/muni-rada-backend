import {
  Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, IsNull } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { Pedido, PedidoStage } from './pedido.entity';
import { PedidoComentario } from './pedido-comentario.entity';
import { PedidoAuditLog, PedidoAuditEvento } from './pedido-audit-log.entity';
import {
  CreatePedidoDto, AprobarPedidoDto, RechazarPedidoDto,
  FirmarPresupuestoDto, ConfirmarRecepcionDto, PedidoFilterDto,
} from './pedidos.dto';
import { User, UserRole } from '../users/user.entity';
import { Presupuesto } from '../presupuestos/presupuesto.entity';
import { PresupuestosService } from '../presupuestos/presupuestos.service';
import { ConfigSystemService } from '../config/config.service';
import { ArchivosService } from '../archivos/archivos.service';
import { UsersService } from '../users/users.service';
import { OrdenCompraService } from '../orden-compra/orden-compra.service';
import { AreaMunicipal, userMayRequestPedidoForArea } from '../common/enums/area-municipal.enum';
import * as crypto from 'crypto';

@Injectable()
export class PedidosService {
  private readonly logger = new Logger(PedidosService.name);

  constructor(
    @InjectRepository(Pedido)
    private pedidosRepo: Repository<Pedido>,
    @InjectRepository(PedidoComentario)
    private comentariosRepo: Repository<PedidoComentario>,
    @InjectRepository(PedidoAuditLog)
    private auditLogRepo: Repository<PedidoAuditLog>,
    private presupuestosService: PresupuestosService,
    private configService: ConfigSystemService,
    private archivosService: ArchivosService,
    private usersService: UsersService,
    private ordenCompraService: OrdenCompraService,
  ) {}

  // ── AUDIT LOG ─────────────────────────────────────────────────────────

  private async insertAuditLog(opts: {
    pedidoId: string;
    evento: PedidoAuditEvento;
    usuario?: User | null;
    area?: string | null;
    nota?: string | null;
    stageAnterior?: PedidoStage | null;
    stageNuevo?: PedidoStage | null;
    metadata?: Record<string, unknown> | null;
  }): Promise<void> {
    try {
      const entry = this.auditLogRepo.create({
        pedidoId: opts.pedidoId,
        evento: opts.evento,
        usuario: opts.usuario ?? null,
        area: opts.area ?? null,
        nota: opts.nota ?? null,
        stageAnterior: opts.stageAnterior ?? null,
        stageNuevo: opts.stageNuevo ?? null,
        metadata: opts.metadata ?? null,
      });
      await this.auditLogRepo.save(entry);
    } catch (err) {
      this.logger.error(`Error al registrar audit log para pedido ${opts.pedidoId}: ${(err as Error).message}`);
    }
  }

  async getAuditLog(pedidoId: string): Promise<PedidoAuditLog[]> {
    await this.findById(pedidoId);
    return this.auditLogRepo.find({
      where: { pedidoId },
      order: { createdAt: 'ASC' },
    });
  }

  // ── HELPERS ──────────────────────────────────────────────────────────

  private async generateNumero(): Promise<string> {
    const count = await this.pedidosRepo.count();
    return `P-${String(count + 1).padStart(3, '0')}`;
  }

  private assertStage(pedido: Pedido, expected: PedidoStage, msg?: string) {
    if (pedido.stage !== expected)
      throw new BadRequestException(msg || `El pedido no está en la etapa correcta para esta acción`);
  }

  private assertNotRechazado(pedido: Pedido) {
    if (pedido.stage === PedidoStage.RECHAZADO) {
      throw new BadRequestException(
        'Este pedido figura como rechazado y no puede avanzar ni modificarse en el circuito de suministros.',
      );
    }
  }

  private canDeletePedido(pedido: Pedido, user: User): boolean {
    const isOwner = pedido.creadoPor?.id === user.id;
    const isSecretaria = user.rol === UserRole.SECRETARIA;
    const isAdmin = user.rol === UserRole.ADMIN;
    const isSistemas = user.areaAsignada === AreaMunicipal.SISTEMAS;
    return isOwner || isSecretaria || isAdmin || isSistemas;
  }

  // ── QUERIES ──────────────────────────────────────────────────────────

  async findAll(filter: PedidoFilterDto = {}): Promise<Pedido[]> {
    const where: any = {};
    if (filter.stage !== undefined) where.stage = filter.stage;
    if (filter.area) where.area = filter.area;
    if (filter.urgente !== undefined) where.urgente = filter.urgente;
    // Exclude archived pedidos by default; pass includeArchived=true to see them
    if (!filter.includeArchived) where.archivedAt = IsNull();

    const options: FindManyOptions<Pedido> = {
      where,
      order: { urgente: 'DESC', createdAt: 'DESC' },
      relations: ['creadoPor', 'aprobadoPor', 'firmadoPor', 'facturaSubidaPor'],
    };
    const list = await this.pedidosRepo.find(options);
    await this.attachPresupuestosCargados(list);
    return list;
  }

  // ── ARCHIVAL ─────────────────────────────────────────────────────────

  /** Archiva pedidos en stage 7 u 8 cuyo updated_at supere los 3 días. Corre diariamente a las 03:00. */
  @Cron('0 3 * * *')
  async archivarAntiguos(): Promise<void> {
    const cutoff = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const result = await this.pedidosRepo
      .createQueryBuilder()
      .update(Pedido)
      .set({ archivedAt: () => 'NOW()' })
      .where('stage IN (:...stages)', { stages: [PedidoStage.SUMINISTROS_LISTOS, PedidoStage.RECHAZADO] })
      .andWhere('archived_at IS NULL')
      .andWhere('updated_at < :cutoff', { cutoff })
      .execute();
    if (result.affected) {
      this.logger.log(`Archivados ${result.affected} pedido(s) en etapa terminal (> 3 días).`);
    }
  }

  async archivar(id: string, user?: User): Promise<Pedido> {
    const pedido = await this.findById(id);
    if (pedido.archivedAt) throw new BadRequestException('El pedido ya está archivado.');
    pedido.archivedAt = new Date();
    const saved = await this.pedidosRepo.save(pedido);
    await this.insertAuditLog({
      pedidoId: id,
      evento: PedidoAuditEvento.ARCHIVADO,
      usuario: user ?? null,
      area: pedido.area,
      stageAnterior: pedido.stage,
      stageNuevo: pedido.stage,
    });
    return saved;
  }

  async desarchivar(id: string): Promise<Pedido> {
    const pedido = await this.pedidosRepo.findOne({ where: { id } });
    if (!pedido) throw new NotFoundException(`Pedido ${id} no encontrado`);
    pedido.archivedAt = null;
    return this.pedidosRepo.save(pedido);
  }

  /** Cantidad de presupuestos por pedido (para UI / Kanban). No persiste en DB. */
  private async attachPresupuestosCargados(pedidos: Pedido[]): Promise<void> {
    if (pedidos.length === 0) return;
    const ids = [...new Set(pedidos.map((p) => p.id))];
    const rows = await this.pedidosRepo.manager
      .createQueryBuilder()
      .select('pr.pedido_id', 'pedidoId')
      .addSelect('COUNT(*)', 'cnt')
      .from('presupuestos', 'pr')
      .where('pr.pedido_id IN (:...ids)', { ids })
      .groupBy('pr.pedido_id')
      .getRawMany();
    const map = new Map<string, number>(
      rows.map((r: { pedidoId: string; cnt: string }) => [r.pedidoId, parseInt(r.cnt, 10)]),
    );
    for (const p of pedidos) {
      (p as Pedido & { presupuestosCargados: number }).presupuestosCargados = map.get(p.id) ?? 0;
    }
  }

  async findById(id: string): Promise<Pedido> {
    const p = await this.pedidosRepo.findOne({
      where: { id },
      relations: ['creadoPor', 'aprobadoPor', 'firmadoPor', 'facturaSubidaPor', 'recepcionConfirmadaPor'],
    });
    if (!p) throw new NotFoundException(`Pedido ${id} no encontrado`);
    return p;
  }

  async findByNumero(numero: string): Promise<Pedido> {
    const p = await this.pedidosRepo.findOne({ where: { numero } });
    if (!p) throw new NotFoundException(`Pedido ${numero} no encontrado`);
    return p;
  }

  // Pedidos que le corresponden según rol
  async findForRole(user: User, filter: PedidoFilterDto = {}): Promise<Pedido[]> {
    // Todos los roles ven todos los pedidos activos — la restricción de edición
    // se aplica a nivel de acción en cada endpoint de mutación, no en el listado.
    return this.findAll(filter);
  }

  // Estadísticas para dashboard
  async getStats() {
    const total   = await this.pedidosRepo.count();
    const stages  = await this.pedidosRepo
      .createQueryBuilder('p')
      .select('p.stage', 'stage')
      .addSelect('COUNT(*)', 'count')
      .groupBy('p.stage')
      .getRawMany();
    const urgentes = await this.pedidosRepo.count({ where: { urgente: true } });
    const bloqueados = await this.pedidosRepo.count({ where: { bloqueado: true } });

    return { total, stages, urgentes, bloqueados };
  }

  // ── FLOW ACTIONS ─────────────────────────────────────────────────────

  // Etapa 0 → 1: crear pedido
  async create(
    dto: CreatePedidoDto,
    user: User,
    archivosReferencia: Express.Multer.File[] = [],
  ): Promise<Pedido> {
    const fullUser = await this.usersService.findById(user.id);
    if (!userMayRequestPedidoForArea(fullUser.areasPedidoPermitidas, dto.area)) {
      throw new ForbiddenException(
        'No tenés permiso para crear pedidos para el área seleccionada. Consultá con administración.',
      );
    }
    const numero = await this.generateNumero();
    const pedido = this.pedidosRepo.create({
      ...dto,
      urgente: dto.urgente === true,
      numero,
      stage: PedidoStage.APROBACION,
      creadoPor: user,
    });
    const saved = await this.pedidosRepo.save(pedido);

    await this.insertAuditLog({
      pedidoId: saved.id,
      evento: PedidoAuditEvento.CREACION,
      usuario: user,
      area: dto.area,
      nota: dto.detalle ?? null,
      stageAnterior: null,
      stageNuevo: PedidoStage.APROBACION,
      metadata: { urgente: dto.urgente ?? false },
    });

    if (archivosReferencia.length > 0) {
      if (!this.archivosService.isStorageAvailable()) {
        throw new BadRequestException(
          'Storage no configurado. No se pueden adjuntar imágenes hasta configurar SUPABASE_URL y SUPABASE_SERVICE_KEY.',
        );
      }
      const refs: { url: string; path: string }[] = [];
      for (let i = 0; i < archivosReferencia.length; i++) {
        const file = archivosReferencia[i];
        const suffix = `${Date.now()}_${i}_${crypto.randomBytes(4).toString('hex')}`;
        const { url, path: storagePath } = await this.archivosService.uploadReferenciaPedido(
          file,
          saved.id,
          suffix,
        );
        refs.push({ url, path: storagePath });
      }
      saved.referenciasImagenes = refs;
      return this.pedidosRepo.save(saved);
    }

    return saved;
  }

  // Etapa 1 → 2: Secretaría aprueba
  async aprobar(id: string, dto: AprobarPedidoDto, user: User): Promise<Pedido> {
    const pedido = await this.findById(id);
    this.assertNotRechazado(pedido);
    this.assertStage(pedido, PedidoStage.APROBACION, 'Solo se pueden aprobar pedidos en etapa de Aprobación');
    const stageAnterior = pedido.stage;
    pedido.stage = PedidoStage.PRESUPUESTOS;
    pedido.aprobadoPor = user;
    pedido.notaAprobacion = dto.nota;
    const saved = await this.pedidosRepo.save(pedido);
    await this.insertAuditLog({
      pedidoId: id,
      evento: PedidoAuditEvento.APROBACION,
      usuario: user,
      area: pedido.area,
      nota: dto.nota ?? null,
      stageAnterior,
      stageNuevo: saved.stage,
    });
    return saved;
  }

  // Etapa 1 → 7: Secretaría rechaza
  async rechazar(id: string, dto: RechazarPedidoDto, user: User): Promise<Pedido> {
    const pedido = await this.findById(id);
    if (pedido.stage !== PedidoStage.APROBACION && pedido.stage !== PedidoStage.FIRMA)
      throw new BadRequestException('Solo se pueden rechazar pedidos en etapa Aprobación o Firma');
    const stageAnterior = pedido.stage;
    pedido.rechazadoDesdeStage = pedido.stage;
    pedido.stage = PedidoStage.RECHAZADO;
    pedido.aprobadoPor = user;
    pedido.notaRechazo = dto.motivo;
    const saved = await this.pedidosRepo.save(pedido);
    await this.insertAuditLog({
      pedidoId: id,
      evento: PedidoAuditEvento.RECHAZO,
      usuario: user,
      area: pedido.area,
      nota: dto.motivo,
      stageAnterior,
      stageNuevo: PedidoStage.RECHAZADO,
    });
    return saved;
  }

  // Etapa 2 → 3: Compras envía a Secretaría para firma
  async enviarAFirma(id: string, user: User): Promise<Pedido> {
    const pedido = await this.findById(id);
    this.assertNotRechazado(pedido);
    this.assertStage(pedido, PedidoStage.PRESUPUESTOS, 'El pedido debe estar en etapa de Presupuestos');

    const presupuestos = await this.presupuestosService.findByPedido(id);
    if (presupuestos.length < 1)
      throw new BadRequestException('Se necesita al menos 1 presupuesto');

    // Asignar proveedor de menor monto automáticamente
    const mejor = presupuestos.reduce((a, b) => a.monto < b.monto ? a : b);
    pedido.proveedorSeleccionado = mejor.proveedor;
    pedido.monto = mejor.monto;
    const stageAnterior = pedido.stage;
    pedido.stage = PedidoStage.FIRMA;
    const saved = await this.pedidosRepo.save(pedido);
    await this.insertAuditLog({
      pedidoId: id,
      evento: PedidoAuditEvento.PRESUPUESTO_ENVIADO,
      usuario: user,
      area: pedido.area,
      stageAnterior,
      stageNuevo: PedidoStage.FIRMA,
      metadata: { proveedor: mejor.proveedor, monto: mejor.monto },
    });
    return saved;
  }

  // Etapa 2 → 3: También puede ser manual (Compras elige proveedor)
  async seleccionarPresupuesto(id: string, presupuestoId: string, user: User): Promise<Pedido> {
    const pedido = await this.findById(id);
    this.assertNotRechazado(pedido);
    this.assertStage(pedido, PedidoStage.PRESUPUESTOS);
    const presup = await this.presupuestosService.findById(presupuestoId);
    pedido.proveedorSeleccionado = presup.proveedor;
    pedido.monto = presup.monto;
    const stageAnterior = pedido.stage;
    pedido.stage = PedidoStage.FIRMA;
    const saved = await this.pedidosRepo.save(pedido);
    await this.insertAuditLog({
      pedidoId: id,
      evento: PedidoAuditEvento.PRESUPUESTO_ENVIADO,
      usuario: user,
      area: pedido.area,
      stageAnterior,
      stageNuevo: PedidoStage.FIRMA,
      metadata: { proveedor: presup.proveedor, monto: presup.monto },
    });
    return saved;
  }

  // Etapa 3 → 4: Secretaría firma presupuesto (usa firma del perfil)
  async firmar(
    id: string,
    dto: FirmarPresupuestoDto,
    user: User,
    presupuestoFirmado?: Express.Multer.File,
  ): Promise<Pedido> {
    if (!dto.presupuestoId?.trim()) {
      throw new BadRequestException('Debés seleccionar un presupuesto para firmar.');
    }
    const pedido = await this.findById(id);
    this.assertNotRechazado(pedido);
    this.assertStage(pedido, PedidoStage.FIRMA, 'El pedido debe estar en etapa de Firma');

    const presup = await this.presupuestosService.findById(dto.presupuestoId);
    if (presup.pedidoId !== id)
      throw new BadRequestException('El presupuesto no pertenece a este pedido');

    const modoFirma = dto.modoFirma === 'escaneado' ? 'escaneado' : 'digital';

    if (modoFirma === 'digital' && !user.firmaUrl)
      throw new BadRequestException('No tenés una firma configurada en tu perfil. Subí tu firma escaneada primero.');
    if (modoFirma === 'escaneado' && !presupuestoFirmado)
      throw new BadRequestException('Debés adjuntar el presupuesto escaneado y firmado en PDF.');

    if (modoFirma === 'escaneado' && presupuestoFirmado) {
      const firmado = await this.archivosService.uploadPresupuestoFirmado(presupuestoFirmado, id, presup.id);
      await this.presupuestosService.updateArchivoFirmado(presup.id, firmado.url, firmado.path);
      presup.archivoFirmadoUrl = firmado.url;
      presup.archivoFirmadoPath = firmado.path;
    }

    pedido.proveedorSeleccionado = presup.proveedor;
    pedido.monto = presup.monto;

    const umbral = await this.configService.getUmbralSellado();
    const requiereSellado = (Number(pedido.monto) || 0) >= umbral;

    pedido.stage = PedidoStage.CARGA_FACTURA;
    pedido.firmadoPor = user;
    pedido.firmaUrlUsada = modoFirma === 'digital' ? user.firmaUrl : null;
    pedido.firmadoEn = new Date();
    pedido.bloqueado = requiereSellado;
    pedido.firmaHash = crypto.randomBytes(8).toString('hex').toUpperCase();

    const saved = await this.pedidosRepo.save(pedido);

    await this.insertAuditLog({
      pedidoId: id,
      evento: PedidoAuditEvento.FIRMA,
      usuario: user,
      area: pedido.area,
      nota: dto.nota ?? null,
      stageAnterior: PedidoStage.FIRMA,
      stageNuevo: PedidoStage.CARGA_FACTURA,
      metadata: {
        proveedor: presup.proveedor,
        monto: presup.monto,
        modoFirma,
        firmaHash: saved.firmaHash ?? null,
        requiereSellado: requiereSellado,
      },
    });

    // Generate Orden de Compra PDF asynchronously (non-blocking for the response)
    this.generateOrdenCompra(saved, presup, user).catch((err) =>
      this.logger.error(`Error generando OC para pedido ${id}: ${err.message}`),
    );

    return saved;
  }

  private async generateOrdenCompra(pedido: Pedido, presupuesto: Presupuesto, firmante: User): Promise<void> {
    const result = await this.ordenCompraService.generateAndUpload({
      pedido,
      presupuesto,
      firmante,
    });

    pedido.ordenCompraNumero = result.numero;
    pedido.ordenCompraUrl = result.url;
    pedido.ordenCompraPath = result.path;
    await this.pedidosRepo.save(pedido);
    this.logger.log(`Orden de Compra ${result.numero} generada para pedido ${pedido.numero}`);
  }

  // Etapa 3 → 2: Secretaría rechaza presupuesto (vuelve a Compras)
  async rechazarPresupuesto(id: string, dto: RechazarPedidoDto, user: User): Promise<Pedido> {
    const pedido = await this.findById(id);
    this.assertNotRechazado(pedido);
    this.assertStage(pedido, PedidoStage.FIRMA);
    pedido.stage = PedidoStage.PRESUPUESTOS;
    pedido.notaRechazo = dto.motivo;
    const saved = await this.pedidosRepo.save(pedido);
    await this.insertAuditLog({
      pedidoId: id,
      evento: PedidoAuditEvento.PRESUPUESTO_RECHAZADO,
      usuario: user,
      area: pedido.area,
      nota: dto.motivo,
      stageAnterior: PedidoStage.FIRMA,
      stageNuevo: PedidoStage.PRESUPUESTOS,
    });
    return saved;
  }

  // Etapa 4 → 5: Compras sube factura del proveedor → Tesorería
  async subirFactura(
    id: string,
    file: Express.Multer.File | undefined,
    user: User,
    fechaLimitePago?: string,
  ): Promise<Pedido> {
    const pedido = await this.findById(id);
    this.assertNotRechazado(pedido);
    this.assertStage(pedido, PedidoStage.CARGA_FACTURA, 'El pedido debe estar en etapa de carga de factura');
    if (!file)
      throw new BadRequestException('Debés adjuntar la factura en PDF');

    let url: string | null = null;
    let path: string | null = null;

    if (this.archivosService.isStorageAvailable()) {
      const result = await this.archivosService.uploadFacturaCompras(file, id);
      url = result.url;
      path = result.path;
    }
    // If storage is not configured (local dev), skip upload and continue with null URL

    pedido.facturaComprasUrl = url;
    pedido.facturaComprasPath = path;
    pedido.facturaSubidaPor = user;
    pedido.facturaSubidaEn = new Date();
    pedido.fechaLimitePago = fechaLimitePago ? new Date(fechaLimitePago) : null;
    const stageAnteriorFactura = pedido.stage;
    pedido.stage = PedidoStage.GESTION_PAGOS;
    const saved = await this.pedidosRepo.save(pedido);
    await this.insertAuditLog({
      pedidoId: id,
      evento: PedidoAuditEvento.FACTURA_SUBIDA,
      usuario: user,
      area: pedido.area,
      stageAnterior: stageAnteriorFactura,
      stageNuevo: PedidoStage.GESTION_PAGOS,
      metadata: { fechaLimitePago: fechaLimitePago ?? null },
    });
    return saved;
  }

  // Etapa 5 → 6: Tesorería registra pago → pasa a Esperando suministros
  async marcarPagado(id: string, user: User): Promise<Pedido> {
    const pedido = await this.findById(id);
    this.assertNotRechazado(pedido);
    this.assertStage(pedido, PedidoStage.GESTION_PAGOS);
    if (pedido.bloqueado)
      throw new BadRequestException('El pedido está bloqueado. Registrá el sellado provincial primero.');
    pedido.stage = PedidoStage.ESPERANDO_SUMINISTROS;
    const saved = await this.pedidosRepo.save(pedido);
    await this.insertAuditLog({
      pedidoId: id,
      evento: PedidoAuditEvento.PAGO,
      usuario: user,
      area: pedido.area,
      stageAnterior: PedidoStage.GESTION_PAGOS,
      stageNuevo: PedidoStage.ESPERANDO_SUMINISTROS,
      metadata: { monto: pedido.monto ?? null, proveedor: pedido.proveedorSeleccionado ?? null },
    });
    return saved;
  }

  // Desbloquear cuando sellado está registrado
  async desbloquear(id: string): Promise<Pedido> {
    const pedido = await this.findById(id);
    this.assertNotRechazado(pedido);
    pedido.bloqueado = false;
    return this.pedidosRepo.save(pedido);
  }

  // Etapa 6 → 7: Admin confirma recepción de suministros
  async confirmarRecepcion(id: string, dto: ConfirmarRecepcionDto, user: User): Promise<Pedido> {
    const pedido = await this.findById(id);
    this.assertNotRechazado(pedido);
    this.assertStage(pedido, PedidoStage.ESPERANDO_SUMINISTROS, 'El pedido debe estar en Esperando suministros');
    pedido.stage = PedidoStage.SUMINISTROS_LISTOS;
    pedido.recepcionConfirmadaPor = user;
    pedido.recepcionEn = new Date();
    pedido.notaRecepcion = dto.nota ?? null;
    pedido.areaRecepcion = dto.areaRecepcion ?? null;
    const saved = await this.pedidosRepo.save(pedido);
    await this.insertAuditLog({
      pedidoId: id,
      evento: PedidoAuditEvento.RECEPCION_CONFIRMADA,
      usuario: user,
      area: dto.areaRecepcion ?? pedido.area,
      nota: dto.nota ?? null,
      stageAnterior: PedidoStage.ESPERANDO_SUMINISTROS,
      stageNuevo: PedidoStage.SUMINISTROS_LISTOS,
      metadata: { areaRecepcion: dto.areaRecepcion ?? null },
    });
    return saved;
  }

  async remove(id: string, user: User): Promise<{ deleted: true; id: string }> {
    const pedido = await this.findById(id);

    if (pedido.stage !== PedidoStage.APROBACION) {
      throw new BadRequestException(
        'Solo se pueden eliminar pedidos que sigan en la etapa Aprobación de suministros.',
      );
    }

    if (!this.canDeletePedido(pedido, user)) {
      throw new ForbiddenException(
        'No tenés permiso para eliminar este pedido. Solo puede hacerlo quien lo creó, Secretaría o Sistemas.',
      );
    }

    await this.pedidosRepo.remove(pedido);

    if (pedido.referenciasImagenes?.length) {
      for (const referencia of pedido.referenciasImagenes) {
        if (!referencia?.path) continue;
        try {
          await this.archivosService.deleteFile(referencia.path);
        } catch (err) {
          this.logger.warn(
            `No se pudo eliminar la referencia ${referencia.path} del pedido ${id}: ${(err as Error).message}`,
          );
        }
      }
    }

    try {
      await this.auditLogRepo.delete({ pedidoId: id });
    } catch (err) {
      this.logger.warn(
        `No se pudo limpiar el audit log del pedido ${id}: ${(err as Error).message}`,
      );
    }

    return { deleted: true, id };
  }

  // ── COMENTARIOS ──────────────────────────────────────────────────────

  async listComentarios(pedidoId: string): Promise<PedidoComentario[]> {
    await this.findById(pedidoId);
    return this.comentariosRepo.find({
      where: { pedidoId },
      order: { createdAt: 'ASC' },
      relations: ['usuario'],
    });
  }

  async addComentario(pedidoId: string, texto: string, user: User): Promise<PedidoComentario> {
    await this.findById(pedidoId);
    const row = this.comentariosRepo.create({
      pedidoId,
      usuarioId: user.id,
      texto: texto.trim(),
    });
    const saved = await this.comentariosRepo.save(row);
    return this.comentariosRepo.findOneOrFail({
      where: { id: saved.id },
      relations: ['usuario'],
    });
  }
}
