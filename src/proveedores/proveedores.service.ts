import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Proveedor } from './proveedor.entity';
import { ProveedorComentario } from './proveedor-comentario.entity';
import { Pedido } from '../pedidos/pedido.entity';
import { Pago } from '../pagos/pagos.module';
import { Presupuesto } from '../presupuestos/presupuesto.entity';
import { User } from '../users/user.entity';
import { CreateProveedorDto, UpdateProveedorDto } from './proveedores.dto';

export type FacturaAsociadaTipo = 'factura_compras' | 'factura_pago' | 'cotizacion';

export interface FacturaAsociadaDto {
  tipo: FacturaAsociadaTipo;
  pedidoId: string;
  pedidoNumero: string;
  descripcion: string;
  url: string;
  fecha: string;
  monto?: number;
  etiqueta: string;
}

@Injectable()
export class ProveedoresService {
  constructor(
    @InjectRepository(Proveedor)
    private repo: Repository<Proveedor>,
    @InjectRepository(ProveedorComentario)
    private comentariosRepo: Repository<ProveedorComentario>,
    @InjectRepository(Pedido)
    private pedidosRepo: Repository<Pedido>,
    @InjectRepository(Pago)
    private pagosRepo: Repository<Pago>,
    @InjectRepository(Presupuesto)
    private presupuestosRepo: Repository<Presupuesto>,
  ) {}

  findAll(): Promise<Proveedor[]> {
    return this.repo.find({ order: { nombre: 'ASC' } });
  }

  async findById(id: string): Promise<Proveedor> {
    const p = await this.repo.findOne({ where: { id } });
    if (!p) throw new NotFoundException('Proveedor no encontrado');
    return p;
  }

  async create(dto: CreateProveedorDto): Promise<Proveedor> {
    const trim = (s?: string) => (s?.trim() ? s.trim() : undefined);
    const email = trim(dto.email);
    const row = this.repo.create({
      nombre: dto.nombre.trim(),
      nombreFantasia: trim(dto.nombreFantasia),
      cuit: trim(dto.cuit),
      condicionIva: trim(dto.condicionIva),
      domicilioCalle: trim(dto.domicilioCalle),
      localidad: trim(dto.localidad),
      provincia: trim(dto.provincia),
      codigoPostal: trim(dto.codigoPostal),
      telefono: trim(dto.telefono),
      email: email ? email.toLowerCase() : undefined,
      contacto: trim(dto.contacto),
      notas: trim(dto.notas),
    });
    return this.repo.save(row);
  }

  async update(id: string, dto: UpdateProveedorDto): Promise<Proveedor> {
    const row = await this.findById(id);
    const trim = (s?: string) => (s?.trim() ? s.trim() : undefined);
    if (dto.nombre !== undefined) row.nombre = dto.nombre.trim();
    if (dto.nombreFantasia !== undefined) row.nombreFantasia = trim(dto.nombreFantasia);
    if (dto.cuit !== undefined) row.cuit = trim(dto.cuit);
    if (dto.condicionIva !== undefined) row.condicionIva = trim(dto.condicionIva);
    if (dto.domicilioCalle !== undefined) row.domicilioCalle = trim(dto.domicilioCalle);
    if (dto.localidad !== undefined) row.localidad = trim(dto.localidad);
    if (dto.provincia !== undefined) row.provincia = trim(dto.provincia);
    if (dto.codigoPostal !== undefined) row.codigoPostal = trim(dto.codigoPostal);
    if (dto.telefono !== undefined) row.telefono = trim(dto.telefono);
    if (dto.email !== undefined) {
      const email = trim(dto.email);
      row.email = email ? email.toLowerCase() : undefined;
    }
    if (dto.contacto !== undefined) row.contacto = trim(dto.contacto);
    if (dto.notas !== undefined) row.notas = trim(dto.notas);
    return this.repo.save(row);
  }

  async remove(id: string): Promise<{ deleted: true; id: string }> {
    await this.findById(id);
    await this.repo.delete(id);
    return { deleted: true, id };
  }

  async getFacturasAsociadas(proveedorId: string): Promise<FacturaAsociadaDto[]> {
    const prov = await this.findById(proveedorId);
    const nombre = prov.nombre.trim();
    const items: FacturaAsociadaDto[] = [];

    const pedidos = await this.pedidosRepo.find({
      where: { proveedorSeleccionado: nombre },
      order: { updatedAt: 'DESC' },
    });

    for (const pedido of pedidos) {
      if (pedido.facturaComprasUrl) {
        items.push({
          tipo: 'factura_compras',
          pedidoId: pedido.id,
          pedidoNumero: pedido.numero,
          descripcion: pedido.descripcion,
          url: pedido.facturaComprasUrl,
          fecha: (pedido.facturaSubidaEn || pedido.updatedAt).toISOString(),
          etiqueta: 'Factura (Compras)',
        });
      }
      const pago = await this.pagosRepo.findOne({ where: { pedidoId: pedido.id } });
      if (pago?.facturaUrl) {
        items.push({
          tipo: 'factura_pago',
          pedidoId: pedido.id,
          pedidoNumero: pedido.numero,
          descripcion: pedido.descripcion,
          url: pago.facturaUrl,
          fecha: pago.createdAt.toISOString(),
          monto: Number(pago.montoPagado),
          etiqueta: 'Factura (pago registrado)',
        });
      }
    }

    const presupuestos = await this.presupuestosRepo.find({
      where: { proveedor: nombre },
      relations: ['pedido'],
      order: { createdAt: 'DESC' },
    });

    for (const pr of presupuestos) {
      if (pr.archivoUrl) {
        const ped = pr.pedido;
        items.push({
          tipo: 'cotizacion',
          pedidoId: pr.pedidoId,
          pedidoNumero: ped?.numero || '—',
          descripcion: ped?.descripcion || '',
          url: pr.archivoUrl,
          fecha: pr.createdAt.toISOString(),
          monto: Number(pr.monto),
          etiqueta: 'Cotización (PDF)',
        });
      }
    }

    items.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
    return items;
  }

  async listComentarios(proveedorId: string): Promise<ProveedorComentario[]> {
    await this.findById(proveedorId);
    return this.comentariosRepo.find({
      where: { proveedorId },
      order: { createdAt: 'DESC' },
      relations: ['usuario'],
    });
  }

  async addComentario(proveedorId: string, texto: string, user: User): Promise<ProveedorComentario> {
    await this.findById(proveedorId);
    const row = this.comentariosRepo.create({
      proveedorId,
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
