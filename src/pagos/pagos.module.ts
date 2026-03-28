import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, ManyToOne, CreateDateColumn } from 'typeorm';
import { Pedido } from '../pedidos/pedido.entity';
import { User } from '../users/user.entity';
import { Injectable, BadRequestException, NotFoundException, Module, Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IsString, IsNotEmpty, IsNumber, Min, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/user.entity';
 import { PedidosModule } from '../pedidos/pedidos.module';
 import { PedidosService } from '../pedidos/pedidos.service';
import { UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ArchivosService } from '../archivos/archivos.service';
import { ArchivosModule } from '../archivos/archivos.module';

// ── ENTITY ──────────────────────────────────────────────────────────
@Entity('pagos')
export class Pago {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => Pedido, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pedido_id' })
  pedido: Pedido;

  @Column({ name: 'pedido_id' })
  pedidoId: string;

  @Column({ name: 'numero_transferencia' })
  numeroTransferencia: string;

  @Column({ type: 'date', name: 'fecha_pago' })
  fechaPago: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'monto_pagado' })
  montoPagado: number;

  @Column({ nullable: true, name: 'factura_url' })
  facturaUrl: string;

  @Column({ nullable: true, name: 'factura_path' })
  facturaPath: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'registrado_por_id' })
  registradoPor: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

// ── DTO ──────────────────────────────────────────────────────────────
export class RegistrarPagoDto {
  @ApiProperty({ example: 'TRF-00234581' }) @IsString() @IsNotEmpty() numeroTransferencia: string;
  @ApiProperty({ example: '2026-03-15' }) @IsString() @IsNotEmpty() fechaPago: string;
  @Type(() => Number)
  @ApiProperty({ example: 420000 }) @IsNumber() @Min(0) montoPagado: number;
}

// ── SERVICE ──────────────────────────────────────────────────────────
@Injectable()
export class PagosService {
  constructor(
    @InjectRepository(Pago)
    private repo: Repository<Pago>,
    private pedidosService: PedidosService,
  ) {}

  async findByPedido(pedidoId: string): Promise<Pago | null> {
    return this.repo.findOne({ where: { pedidoId }, relations: ['registradoPor'] });
  }

  async registrar(pedidoId: string, dto: RegistrarPagoDto, user: User, facturaUrl?: string, facturaPath?: string): Promise<Pago> {
    const pedido = await this.pedidosService.findById(pedidoId);
    if (pedido.bloqueado) throw new BadRequestException('El pedido está bloqueado. Registrá el sellado primero.');

    const existing = await this.findByPedido(pedidoId);
    if (existing) throw new BadRequestException('Ya existe un pago registrado para este pedido');

    const pago = this.repo.create({ ...dto, pedidoId, registradoPor: user, facturaUrl, facturaPath });
    const saved = await this.repo.save(pago);

    // Avanzar pedido a stage 5 (Esperando suministros)
    await this.pedidosService.marcarPagado(pedidoId, user);
    return saved;
  }

  async findAll(): Promise<Pago[]> {
    return this.repo.find({ relations: ['pedido', 'registradoPor'], order: { createdAt: 'DESC' } });
  }
}

// ── CONTROLLER ───────────────────────────────────────────────────────
@ApiTags('Pagos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('pedidos/:pedidoId/pago')
export class PagosController {
  constructor(
    private readonly service: PagosService,
    private readonly archivosService: ArchivosService,
  ) {}

  @Get()
  findOne(@Param('pedidoId') pedidoId: string) {
    return this.service.findByPedido(pedidoId);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.TESORERIA, UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('factura'))
  @ApiOperation({ summary: 'Registrar pago y adjuntar factura' })
  async registrar(
    @Param('pedidoId') pedidoId: string,
    @Body() dto: RegistrarPagoDto,
    @Request() req,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    let url: string, path: string;
    if (file) {
      const r = await this.archivosService.uploadFactura(file, pedidoId);
      url = r.url; path = r.path;
    }
    return this.service.registrar(pedidoId, dto, req.user, url, path);
  }
}

@ApiTags('Pagos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.TESORERIA, UserRole.ADMIN)
@Controller('pagos')
export class PagosListController {
  constructor(private readonly service: PagosService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todos los pagos (Tesorería)' })
  findAll() {
    return this.service.findAll();
  }
}

// ── MODULE ───────────────────────────────────────────────────────────
@Module({
  imports: [TypeOrmModule.forFeature([Pago]), ArchivosModule, PedidosModule],
  providers: [PagosService],
  controllers: [PagosController, PagosListController],
  exports: [PagosService],
})
export class PagosModule {}
