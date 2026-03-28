import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, ManyToOne, CreateDateColumn } from 'typeorm';
import { Pedido } from '../pedidos/pedido.entity';
import { User } from '../users/user.entity';
 import { Injectable, NotFoundException, BadRequestException, Module, Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IsString, IsNotEmpty, IsOptional, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/user.entity';
 import { PedidosModule } from '../pedidos/pedidos.module';
 import { PedidosService } from '../pedidos/pedidos.service';

// ── ENTITY ──────────────────────────────────────────────────────────
@Entity('sellados')
export class Sellado {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => Pedido, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pedido_id' })
  pedido: Pedido;

  @Column({ name: 'pedido_id' })
  pedidoId: string;

  @Column({ name: 'numero_sellado' })
  numeroSellado: string;

  @Column({ type: 'date', name: 'fecha_sellado' })
  fechaSellado: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'monto_sellado' })
  montoSellado: number;

  @Column({ nullable: true, name: 'comprobante_url' })
  comprobanteUrl: string;

  @Column({ nullable: true, name: 'comprobante_path' })
  comprobantePath: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'registrado_por_id' })
  registradoPor: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

// ── DTO ──────────────────────────────────────────────────────────────
export class RegistrarSelladoDto {
  @ApiProperty({ example: 'SELL-2026-082' }) @IsString() @IsNotEmpty() numeroSellado: string;
  @ApiProperty({ example: '2026-03-15' }) @IsString() @IsNotEmpty() fechaSellado: string;
  @Type(() => Number)
  @ApiProperty({ example: 15000 }) @IsNumber() @Min(0) montoSellado: number;
}

// ── SERVICE ──────────────────────────────────────────────────────────
@Injectable()
export class SelladosService {
  constructor(
    @InjectRepository(Sellado)
    private repo: Repository<Sellado>,
    private pedidosService: PedidosService,
  ) {}

  async findByPedido(pedidoId: string): Promise<Sellado | null> {
    return this.repo.findOne({ where: { pedidoId }, relations: ['registradoPor'] });
  }

  async registrar(pedidoId: string, dto: RegistrarSelladoDto, user: User, url?: string, path?: string): Promise<Sellado> {
    const existing = await this.findByPedido(pedidoId);
    if (existing) throw new BadRequestException('Ya existe un sellado para este pedido');

    const sellado = this.repo.create({
      ...dto,
      pedidoId,
      registradoPor: user,
      comprobanteUrl: url,
      comprobantePath: path,
    });
    const saved = await this.repo.save(sellado);

    // Desbloquear pedido
    await this.pedidosService.desbloquear(pedidoId);
    return saved;
  }
}

// ── CONTROLLER ───────────────────────────────────────────────────────
@ApiTags('Sellados')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('pedidos/:pedidoId/sellado')
export class SelladosController {
  constructor(private readonly service: SelladosService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener sellado de un pedido' })
  findOne(@Param('pedidoId') pedidoId: string) {
    return this.service.findByPedido(pedidoId);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.TESORERIA, UserRole.ADMIN)
  @ApiOperation({ summary: 'Registrar sellado provincial' })
  registrar(@Param('pedidoId') pedidoId: string, @Body() dto: RegistrarSelladoDto, @Request() req) {
    return this.service.registrar(pedidoId, dto, req.user);
  }
}

// ── MODULE ───────────────────────────────────────────────────────────
@Module({
  imports: [TypeOrmModule.forFeature([Sellado]), PedidosModule],
  providers: [SelladosService],
  controllers: [SelladosController],
  exports: [SelladosService],
})
export class SelladosModule {}
