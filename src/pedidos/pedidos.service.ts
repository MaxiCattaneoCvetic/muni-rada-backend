import {
  Injectable, NotFoundException, BadRequestException, ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindManyOptions } from 'typeorm';
import { Pedido, PedidoStage } from './pedido.entity';
import {
  CreatePedidoDto, AprobarPedidoDto, RechazarPedidoDto,
  FirmarPresupuestoDto, ConfirmarRecepcionDto, PedidoFilterDto,
} from './pedidos.dto';
import { User, UserRole } from '../users/user.entity';
import { PresupuestosService } from '../presupuestos/presupuestos.service';
import { ConfigSystemService } from '../config/config.service';
import * as crypto from 'crypto';

@Injectable()
export class PedidosService {
  constructor(
    @InjectRepository(Pedido)
    private pedidosRepo: Repository<Pedido>,
    private presupuestosService: PresupuestosService,
    private configService: ConfigSystemService,
  ) {}

  // ── HELPERS ──────────────────────────────────────────────────────────

  private async generateNumero(): Promise<string> {
    const count = await this.pedidosRepo.count();
    return `P-${String(count + 1).padStart(3, '0')}`;
  }

  private assertStage(pedido: Pedido, expected: PedidoStage, msg?: string) {
    if (pedido.stage !== expected)
      throw new BadRequestException(msg || `El pedido no está en la etapa correcta para esta acción`);
  }

  // ── QUERIES ──────────────────────────────────────────────────────────

  async findAll(filter: PedidoFilterDto = {}): Promise<Pedido[]> {
    const where: any = {};
    if (filter.stage !== undefined) where.stage = filter.stage;
    if (filter.area) where.area = filter.area;
    if (filter.urgente !== undefined) where.urgente = filter.urgente;

    const options: FindManyOptions<Pedido> = {
      where,
      order: { urgente: 'DESC', createdAt: 'DESC' },
      relations: ['creadoPor', 'aprobadoPor', 'firmadoPor'],
    };
    return this.pedidosRepo.find(options);
  }

  async findById(id: string): Promise<Pedido> {
    const p = await this.pedidosRepo.findOne({
      where: { id },
      relations: ['creadoPor', 'aprobadoPor', 'firmadoPor', 'recepcionConfirmadaPor'],
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
    const stagesByRole: Record<UserRole, PedidoStage[]> = {
      [UserRole.SECRETARIA]: [PedidoStage.APROBACION, PedidoStage.FIRMA],
      [UserRole.COMPRAS]: [PedidoStage.PRESUPUESTOS],
      [UserRole.TESORERIA]: [PedidoStage.GESTION_PAGOS],
      [UserRole.ADMIN]: [
        PedidoStage.APROBACION, PedidoStage.PRESUPUESTOS, PedidoStage.FIRMA,
        PedidoStage.GESTION_PAGOS, PedidoStage.ESPERANDO_SUMINISTROS, PedidoStage.SUMINISTROS_LISTOS,
      ],
    };
    const stages = stagesByRole[user.rol] || [];

    if (filter.stage !== undefined) {
      if (!stages.includes(filter.stage as PedidoStage))
        throw new ForbiddenException('No tenés acceso a esa etapa');
      return this.findAll(filter);
    }

    const all = await Promise.all(stages.map(s => this.findAll({ ...filter, stage: s })));
    return all.flat().sort((a, b) => {
      if (a.urgente && !b.urgente) return -1;
      if (!a.urgente && b.urgente) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
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
  async create(dto: CreatePedidoDto, user: User): Promise<Pedido> {
    const numero = await this.generateNumero();
    const pedido = this.pedidosRepo.create({
      ...dto,
      numero,
      stage: PedidoStage.APROBACION,
      creadoPor: user,
    });
    return this.pedidosRepo.save(pedido);
  }

  // Etapa 1 → 2: Secretaría aprueba
  async aprobar(id: string, dto: AprobarPedidoDto, user: User): Promise<Pedido> {
    const pedido = await this.findById(id);
    this.assertStage(pedido, PedidoStage.APROBACION, 'Solo se pueden aprobar pedidos en etapa de Aprobación');
    pedido.stage = PedidoStage.PRESUPUESTOS;
    pedido.aprobadoPor = user;
    pedido.notaAprobacion = dto.nota;
    return this.pedidosRepo.save(pedido);
  }

  // Etapa 1 → 7: Secretaría rechaza
  async rechazar(id: string, dto: RechazarPedidoDto, user: User): Promise<Pedido> {
    const pedido = await this.findById(id);
    if (pedido.stage !== PedidoStage.APROBACION && pedido.stage !== PedidoStage.FIRMA)
      throw new BadRequestException('Solo se pueden rechazar pedidos en etapa Aprobación o Firma');
    pedido.stage = PedidoStage.RECHAZADO;
    pedido.aprobadoPor = user;
    pedido.notaRechazo = dto.motivo;
    return this.pedidosRepo.save(pedido);
  }

  // Etapa 2 → 3: Compras envía a Secretaría para firma
  async enviarAFirma(id: string, user: User): Promise<Pedido> {
    const pedido = await this.findById(id);
    this.assertStage(pedido, PedidoStage.PRESUPUESTOS, 'El pedido debe estar en etapa de Presupuestos');

    const presupuestos = await this.presupuestosService.findByPedido(id);
    const minPresup = await this.configService.getMinPresupuestos();
    if (presupuestos.length < minPresup)
      throw new BadRequestException(`Se necesitan al menos ${minPresup} presupuestos`);

    // Asignar proveedor de menor monto automáticamente
    const mejor = presupuestos.reduce((a, b) => a.monto < b.monto ? a : b);
    pedido.proveedorSeleccionado = mejor.proveedor;
    pedido.monto = mejor.monto;
    pedido.stage = PedidoStage.FIRMA;
    return this.pedidosRepo.save(pedido);
  }

  // Etapa 2 → 3: También puede ser manual (Compras elige proveedor)
  async seleccionarPresupuesto(id: string, presupuestoId: string, user: User): Promise<Pedido> {
    const pedido = await this.findById(id);
    this.assertStage(pedido, PedidoStage.PRESUPUESTOS);
    const presup = await this.presupuestosService.findById(presupuestoId);
    pedido.proveedorSeleccionado = presup.proveedor;
    pedido.monto = presup.monto;
    pedido.stage = PedidoStage.FIRMA;
    return this.pedidosRepo.save(pedido);
  }

  // Etapa 3 → 4: Secretaría firma presupuesto (usa firma del perfil)
  async firmar(id: string, dto: FirmarPresupuestoDto, user: User): Promise<Pedido> {
    const pedido = await this.findById(id);
    this.assertStage(pedido, PedidoStage.FIRMA, 'El pedido debe estar en etapa de Firma');

    if (!user.firmaUrl)
      throw new BadRequestException('No tenés una firma configurada en tu perfil. Subí tu firma escaneada primero.');

    const umbral = await this.configService.getUmbralSellado();
    const requiereSellado = (pedido.monto || 0) >= umbral;

    pedido.stage = PedidoStage.GESTION_PAGOS;
    pedido.firmadoPor = user;
    pedido.firmaUrlUsada = user.firmaUrl;
    pedido.firmadoEn = new Date();
    pedido.bloqueado = requiereSellado;
    // Hash simulado para la demo (en producción usar firma real con cert)
    pedido.firmaHash = crypto.randomBytes(8).toString('hex').toUpperCase();
    return this.pedidosRepo.save(pedido);
  }

  // Etapa 3 → 2: Secretaría rechaza presupuesto (vuelve a Compras)
  async rechazarPresupuesto(id: string, dto: RechazarPedidoDto, user: User): Promise<Pedido> {
    const pedido = await this.findById(id);
    this.assertStage(pedido, PedidoStage.FIRMA);
    pedido.stage = PedidoStage.PRESUPUESTOS;
    pedido.notaRechazo = dto.motivo;
    return this.pedidosRepo.save(pedido);
  }

  // Etapa 4 → 5: Tesorería registra pago → pasa a Esperando suministros
  async marcarPagado(id: string, user: User): Promise<Pedido> {
    const pedido = await this.findById(id);
    this.assertStage(pedido, PedidoStage.GESTION_PAGOS);
    if (pedido.bloqueado)
      throw new BadRequestException('El pedido está bloqueado. Registrá el sellado provincial primero.');
    pedido.stage = PedidoStage.ESPERANDO_SUMINISTROS;
    return this.pedidosRepo.save(pedido);
  }

  // Desbloquear cuando sellado está registrado
  async desbloquear(id: string): Promise<Pedido> {
    const pedido = await this.findById(id);
    pedido.bloqueado = false;
    return this.pedidosRepo.save(pedido);
  }

  // Etapa 5 → 6: Admin confirma recepción de suministros
  async confirmarRecepcion(id: string, dto: ConfirmarRecepcionDto, user: User): Promise<Pedido> {
    const pedido = await this.findById(id);
    this.assertStage(pedido, PedidoStage.ESPERANDO_SUMINISTROS, 'El pedido debe estar en Esperando suministros');
    pedido.stage = PedidoStage.SUMINISTROS_LISTOS;
    pedido.recepcionConfirmadaPor = user;
    pedido.recepcionEn = new Date();
    return this.pedidosRepo.save(pedido);
  }
}
