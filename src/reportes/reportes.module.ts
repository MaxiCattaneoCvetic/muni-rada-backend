import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import {
  Injectable,
  Module,
  Controller,
  Post,
  Patch,
  Get,
  Body,
  Param,
  Request,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ForbiddenException,
  NotFoundException,
  ValidationPipe,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/user.entity';
import { ArchivosService } from '../archivos/archivos.service';
import { ArchivosModule } from '../archivos/archivos.module';

// ── ENUMS ────────────────────────────────────────────────────────────
export enum TipoReporte {
  ERROR_SISTEMA     = 'error_sistema',
  DATOS_INCORRECTOS = 'datos_incorrectos',
  ACCESO            = 'acceso',
  LENTITUD          = 'lentitud',
  INTERFAZ          = 'interfaz',
  OTRO              = 'otro',
}

export enum PrioridadReporte {
  BAJA  = 'baja',
  MEDIA = 'media',
  ALTA  = 'alta',
}

export enum EstadoReporte {
  PENDIENTE   = 'pendiente',
  EN_PROCESO  = 'en_proceso',
  SOLUCIONADO = 'solucionado',
  CERRADO     = 'cerrado',
  // valores legacy (compatibilidad con registros anteriores)
  ABIERTO  = 'abierto',
  RESUELTO = 'resuelto',
}

// ── ENTITY: Reporte ──────────────────────────────────────────────────
@Entity('reportes')
export class Reporte {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: TipoReporte })
  tipo: TipoReporte;

  @Column({ type: 'text' })
  descripcion: string;

  @Column({ type: 'enum', enum: PrioridadReporte, default: PrioridadReporte.MEDIA })
  prioridad: PrioridadReporte;

  @Column({ nullable: true, name: 'screenshot_url' })
  screenshotUrl: string;

  @Column({ nullable: true, name: 'screenshot_path' })
  screenshotPath: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'reportado_por_id' })
  reportadoPor: User;

  @Column({ nullable: true, name: 'reportado_por_id' })
  reportadoPorId: string;

  @Column({ type: 'enum', enum: EstadoReporte, default: EstadoReporte.PENDIENTE })
  estado: EstadoReporte;

  @Column({ type: 'text', nullable: true, name: 'nota_admin' })
  notaAdmin: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

// ── ENTITY: ReporteMensaje ───────────────────────────────────────────
@Entity('reporte_mensajes')
export class ReporteMensaje {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'reporte_id' })
  reporteId: string;

  @ManyToOne(() => Reporte, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reporte_id' })
  reporte: Reporte;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'autor_id' })
  autor: User;

  @Column({ nullable: true, name: 'autor_id' })
  autorId: string;

  @Column({ type: 'text' })
  contenido: string;

  /** true = enviado por alguien con rol admin */
  @Column({ default: false, name: 'es_admin' })
  esAdmin: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

// ── DTOS ─────────────────────────────────────────────────────────────
export class UpdateEstadoDto {
  @ApiProperty({ enum: EstadoReporte })
  @IsEnum(EstadoReporte)
  estado: EstadoReporte;

  @ApiPropertyOptional({ example: 'Revisado, se corregirá en la próxima versión.' })
  @IsOptional()
  @IsString()
  notaAdmin?: string;
}

export class CreateReporteDto {
  @ApiProperty({ enum: TipoReporte, example: TipoReporte.ERROR_SISTEMA })
  @IsEnum(TipoReporte)
  tipo: TipoReporte;

  @ApiProperty({ example: 'Al hacer click en Aprobar aparece error 500.' })
  @IsString()
  @IsNotEmpty()
  descripcion: string;

  @ApiPropertyOptional({ enum: PrioridadReporte, example: PrioridadReporte.MEDIA })
  @IsOptional()
  @IsEnum(PrioridadReporte)
  prioridad?: PrioridadReporte;
}

export class CreateMensajeDto {
  @ApiProperty({ example: '¿Podrían darme más detalles del error?' })
  @IsString()
  @IsNotEmpty()
  contenido: string;
}

// ── SERVICE ──────────────────────────────────────────────────────────
@Injectable()
export class ReportesService {
  constructor(
    @InjectRepository(Reporte)
    private repo: Repository<Reporte>,
    @InjectRepository(ReporteMensaje)
    private mensajesRepo: Repository<ReporteMensaje>,
  ) {}

  async create(
    dto: CreateReporteDto,
    userId: string,
    screenshotUrl?: string,
    screenshotPath?: string,
  ): Promise<Reporte> {
    const reporte = this.repo.create({
      tipo: dto.tipo,
      descripcion: dto.descripcion,
      prioridad: dto.prioridad ?? PrioridadReporte.MEDIA,
      reportadoPorId: userId,
      screenshotUrl,
      screenshotPath,
    });
    return this.repo.save(reporte);
  }

  findAll(): Promise<Reporte[]> {
    return this.repo.find({
      relations: ['reportadoPor'],
      order: { createdAt: 'DESC' },
    });
  }

  findByUser(userId: string): Promise<Reporte[]> {
    return this.repo.find({
      where: { reportadoPorId: userId },
      order: { createdAt: 'DESC' },
    });
  }

  findById(id: string): Promise<Reporte | null> {
    return this.repo.findOne({ where: { id } });
  }

  async updateEstado(id: string, dto: UpdateEstadoDto): Promise<Reporte> {
    const reporte = await this.repo.findOne({ where: { id }, relations: ['reportadoPor'] });
    if (!reporte) throw new NotFoundException('Reporte no encontrado');
    reporte.estado = dto.estado;
    if (dto.notaAdmin !== undefined) reporte.notaAdmin = dto.notaAdmin;
    return this.repo.save(reporte);
  }

  getMensajes(reporteId: string): Promise<ReporteMensaje[]> {
    return this.mensajesRepo.find({
      where: { reporteId },
      relations: ['autor'],
      order: { createdAt: 'ASC' },
    });
  }

  async addMensaje(
    reporteId: string,
    autorId: string,
    contenido: string,
    esAdmin: boolean,
  ): Promise<ReporteMensaje> {
    const msg = this.mensajesRepo.create({ reporteId, autorId, contenido, esAdmin });
    const saved = await this.mensajesRepo.save(msg);
    return this.mensajesRepo.findOne({ where: { id: saved.id }, relations: ['autor'] });
  }
}

// ── CONTROLLER ───────────────────────────────────────────────────────
@ApiTags('Reportes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reportes')
export class ReportesController {
  constructor(
    private readonly service: ReportesService,
    private readonly archivosService: ArchivosService,
  ) {}

  @Post()
  @UseInterceptors(FileInterceptor('screenshot', { storage: memoryStorage() }))
  @ApiOperation({ summary: 'Crear reporte de problema' })
  async create(
    @Body(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: false, transformOptions: { enableImplicitConversion: true } })) dto: CreateReporteDto,
    @Request() req,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    let screenshotUrl: string | undefined;
    let screenshotPath: string | undefined;

    if (file && this.archivosService.isStorageAvailable()) {
      const result = await this.archivosService.uploadBuffer(
        file.buffer,
        'reportes',
        `reporte_${req.user.id}_${Date.now()}.${file.originalname.split('.').pop()}`,
        file.mimetype,
      );
      screenshotUrl = result.url;
      screenshotPath = result.path;
    }

    return this.service.create(dto, req.user.id, screenshotUrl, screenshotPath);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Listar todos los reportes (solo admin)' })
  findAll() {
    return this.service.findAll();
  }

  @Get('mis-reportes')
  @ApiOperation({ summary: 'Mis reportes — reportes del usuario autenticado' })
  findMios(@Request() req) {
    return this.service.findByUser(req.user.id);
  }

  @Patch(':id/estado')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Actualizar estado de un reporte (solo admin)' })
  updateEstado(@Param('id') id: string, @Body() dto: UpdateEstadoDto) {
    return this.service.updateEstado(id, dto);
  }

  @Get(':id/mensajes')
  @ApiOperation({ summary: 'Mensajes de un reporte (dueño o admin)' })
  async getMensajes(@Param('id') id: string, @Request() req) {
    const reporte = await this.service.findById(id);
    if (!reporte) throw new NotFoundException('Reporte no encontrado');
    const isAdmin = req.user.rol === UserRole.ADMIN;
    if (!isAdmin && reporte.reportadoPorId !== req.user.id) {
      throw new ForbiddenException('Sin acceso a este reporte');
    }
    return this.service.getMensajes(id);
  }

  @Post(':id/mensajes')
  @ApiOperation({ summary: 'Agregar mensaje a un reporte' })
  async addMensaje(
    @Param('id') id: string,
    @Body() dto: CreateMensajeDto,
    @Request() req,
  ) {
    const reporte = await this.service.findById(id);
    if (!reporte) throw new NotFoundException('Reporte no encontrado');
    const isAdmin = req.user.rol === UserRole.ADMIN;
    if (!isAdmin && reporte.reportadoPorId !== req.user.id) {
      throw new ForbiddenException('Sin acceso a este reporte');
    }
    return this.service.addMensaje(id, req.user.id, dto.contenido, isAdmin);
  }
}

// ── MODULE ───────────────────────────────────────────────────────────
@Module({
  imports: [TypeOrmModule.forFeature([Reporte, ReporteMensaje]), ArchivosModule],
  providers: [ReportesService],
  controllers: [ReportesController],
  exports: [ReportesService],
})
export class ReportesModule {}
