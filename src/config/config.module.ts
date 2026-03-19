import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { Injectable, Module, Controller, Get, Put, Body, UseGuards, Request } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IsNumber, IsBoolean, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/user.entity';

// ── ENTITY ──────────────────────────────────────────────────────────
@Entity('sistema_config')
export class SistemaConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'umbral_sellado', default: 350000 })
  umbralSellado: number;

  @Column({ name: 'min_presupuestos', default: 3 })
  minPresupuestos: number;

  @Column({ name: 'bloquear_pago_sin_sellado', default: true })
  bloquearPagoSinSellado: boolean;

  @Column({ name: 'nombre_municipalidad', default: 'Municipalidad de Rada Tilly' })
  nombreMunicipalidad: string;

  @Column({ nullable: true, name: 'cuit_institucional' })
  cuitInstitucional: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'modificado_por_id' })
  modificadoPor: User;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

// ── DTO ──────────────────────────────────────────────────────────────
export class UpdateConfigDto {
  @ApiPropertyOptional({ example: 350000 }) @IsNumber() @Min(0) @IsOptional() umbralSellado?: number;
  @ApiPropertyOptional({ example: 3 }) @IsNumber() @Min(1) @IsOptional() minPresupuestos?: number;
  @ApiPropertyOptional() @IsBoolean() @IsOptional() bloquearPagoSinSellado?: boolean;
  @ApiPropertyOptional() @IsOptional() nombreMunicipalidad?: string;
  @ApiPropertyOptional() @IsOptional() cuitInstitucional?: string;
}

// ── SERVICE ──────────────────────────────────────────────────────────
@Injectable()
export class ConfigSystemService {
  private config: SistemaConfig | null = null;

  constructor(
    @InjectRepository(SistemaConfig)
    private repo: Repository<SistemaConfig>,
  ) {}

  async getConfig(): Promise<SistemaConfig> {
    if (this.config) return this.config;
    let cfg = await this.repo.findOne({ where: {}, order: { updatedAt: 'DESC' } });
    if (!cfg) {
      cfg = this.repo.create({});
      cfg = await this.repo.save(cfg);
    }
    this.config = cfg;
    return cfg;
  }

  async getUmbralSellado(): Promise<number> {
    const cfg = await this.getConfig();
    return Number(cfg.umbralSellado);
  }

  async getMinPresupuestos(): Promise<number> {
    const cfg = await this.getConfig();
    return cfg.minPresupuestos;
  }

  async update(dto: UpdateConfigDto, user: User): Promise<SistemaConfig> {
    const cfg = await this.getConfig();
    Object.assign(cfg, dto);
    cfg.modificadoPor = user;
    this.config = null; // invalidate cache
    return this.repo.save(cfg);
  }
}

// ── CONTROLLER ───────────────────────────────────────────────────────
@ApiTags('Configuración')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('config')
export class ConfigController {
  constructor(private readonly service: ConfigSystemService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener configuración del sistema' })
  getConfig() {
    return this.service.getConfig();
  }

  @Put()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Actualizar configuración (Admin)' })
  update(@Body() dto: UpdateConfigDto, @Request() req) {
    return this.service.update(dto, req.user);
  }
}

// ── MODULE ───────────────────────────────────────────────────────────
@Module({
  imports: [TypeOrmModule.forFeature([SistemaConfig])],
  providers: [ConfigSystemService],
  controllers: [ConfigController],
  exports: [ConfigSystemService],
})
export class ConfigSystemModule {}
