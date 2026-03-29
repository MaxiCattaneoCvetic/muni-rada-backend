import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Presupuesto } from './presupuesto.entity';
import { User } from '../users/user.entity';
import { ConfigSystemService } from '../config/config.module';
import { IsString, IsNotEmpty, IsOptional, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePresupuestoDto {
  @ApiProperty() @IsString() @IsNotEmpty() proveedor: string;
  @ApiPropertyOptional() @IsString() @IsOptional() cuit?: string;
  @Type(() => Number)
  @ApiProperty() @IsNumber() @Min(0) monto: number;
  @ApiPropertyOptional() @IsString() @IsOptional() plazoEntrega?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() contacto?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() notas?: string;
}

@Injectable()
export class PresupuestosService {
  constructor(
    @InjectRepository(Presupuesto)
    private repo: Repository<Presupuesto>,
    private configService: ConfigSystemService,
  ) {}

  async findByPedido(pedidoId: string): Promise<Presupuesto[]> {
    return this.repo.find({
      where: { pedidoId },
      order: { monto: 'ASC' },
      relations: ['cargadoPor'],
    });
  }

  async findById(id: string): Promise<Presupuesto> {
    const p = await this.repo.findOne({ where: { id } });
    if (!p) throw new NotFoundException('Presupuesto no encontrado');
    return p;
  }

  async create(pedidoId: string, dto: CreatePresupuestoDto, user: User, archivoUrl?: string, archivoPath?: string): Promise<Presupuesto> {
    const max = await this.configService.getMaxPresupuestos();
    const actuales = await this.repo.count({ where: { pedidoId } });
    if (actuales >= max) {
      throw new BadRequestException(`Se alcanzó el máximo de ${max} presupuestos por pedido`);
    }
    const presup = this.repo.create({
      ...dto,
      pedidoId,
      cargadoPor: user,
      archivoUrl,
      archivoPath,
    });
    return this.repo.save(presup);
  }

  async delete(id: string, user: User): Promise<void> {
    const presup = await this.findById(id);
    await this.repo.remove(presup);
  }

  async updateArchivo(id: string, url: string, path: string): Promise<Presupuesto> {
    const p = await this.findById(id);
    p.archivoUrl = url;
    p.archivoPath = path;
    return this.repo.save(p);
  }
}
