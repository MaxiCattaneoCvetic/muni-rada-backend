import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request, UseInterceptors, UploadedFile, Module } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PresupuestosService, CreatePresupuestoDto } from './presupuestos.service';
import { Presupuesto } from './presupuesto.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/user.entity';
import { ArchivosModule } from '../archivos/archivos.module';
import { ArchivosService } from '../archivos/archivos.service';
import { ConfigSystemModule } from '../config/config.module';

@ApiTags('Presupuestos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('pedidos/:pedidoId/presupuestos')
export class PresupuestosController {
  constructor(
    private readonly service: PresupuestosService,
    private readonly archivosService: ArchivosService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar presupuestos de un pedido' })
  findAll(@Param('pedidoId') pedidoId: string) {
    return this.service.findByPedido(pedidoId);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.COMPRAS, UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('archivo'))
  @ApiOperation({ summary: 'Cargar presupuesto (con PDF opcional)' })
  async create(
    @Param('pedidoId') pedidoId: string,
    @Body() dto: CreatePresupuestoDto,
    @Request() req,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    let archivoUrl: string | undefined;
    let archivoPath: string | undefined;
    if (file) {
      if (this.archivosService.isStorageAvailable()) {
        const result = await this.archivosService.uploadPresupuesto(file, pedidoId);
        archivoUrl = result.url;
        archivoPath = result.path;
      } else {
        console.warn(
          `[presupuestos] Adjunto omitido para pedido ${pedidoId}: configurá SUPABASE_URL y SUPABASE_SERVICE_KEY para guardar PDFs.`,
        );
      }
    }
    return this.service.create(pedidoId, dto, req.user, archivoUrl, archivoPath);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.COMPRAS, UserRole.ADMIN)
  @ApiOperation({ summary: 'Eliminar presupuesto' })
  delete(@Param('id') id: string, @Request() req) {
    return this.service.delete(id, req.user);
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([Presupuesto]), ArchivosModule, ConfigSystemModule],
  providers: [PresupuestosService],
  controllers: [PresupuestosController],
  exports: [PresupuestosService],
})
export class PresupuestosModule {}
