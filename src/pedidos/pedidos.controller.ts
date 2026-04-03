import {
  Controller, Get, Post, Put, Patch, Body, Param, Query,
  UseGuards, Request, UseInterceptors, UploadedFile, UploadedFiles, ParseUUIDPipe,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PedidosService } from './pedidos.service';
import {
  CreatePedidoDto, AprobarPedidoDto, RechazarPedidoDto,
  FirmarPresupuestoDto, ConfirmarRecepcionDto, PedidoFilterDto, SubirFacturaDto,
  CreatePedidoComentarioDto,
} from './pedidos.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/user.entity';

@ApiTags('Pedidos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('pedidos')
export class PedidosController {
  constructor(private readonly service: PedidosService) {}

  @Get()
  @ApiOperation({ summary: 'Listar pedidos (filtrado por rol automáticamente)' })
  findAll(@Request() req, @Query() filter: PedidoFilterDto) {
    return this.service.findForRole(req.user, filter);
  }

  @Get('todos')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Todos los pedidos sin filtro — solo Admin' })
  findAllAdmin(@Query() filter: PedidoFilterDto) {
    return this.service.findAll(filter);
  }

  @Get('stats')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SECRETARIA)
  @ApiOperation({ summary: 'Estadísticas generales' })
  getStats() {
    return this.service.getStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de un pedido' })
  findOne(@Param('id') id: string) {
    return this.service.findById(id);
  }

  // ── CREAR ──
  @Post()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('referencias', 8))
  @ApiOperation({ summary: 'Crear nuevo pedido (campos de formulario + imágenes de referencia opcionales)' })
  create(
    @Body() dto: CreatePedidoDto,
    @Request() req,
    @UploadedFiles() referencias?: Express.Multer.File[],
  ) {
    return this.service.create(dto, req.user, referencias ?? []);
  }

  // ── ETAPA 1→2: APROBAR ──
  @Patch(':id/aprobar')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SECRETARIA, UserRole.ADMIN)
  @ApiOperation({ summary: 'Aprobar pedido (Secretaría)' })
  aprobar(@Param('id') id: string, @Body() dto: AprobarPedidoDto, @Request() req) {
    return this.service.aprobar(id, dto, req.user);
  }

  // ── RECHAZAR ──
  @Patch(':id/rechazar')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SECRETARIA, UserRole.ADMIN)
  @ApiOperation({ summary: 'Rechazar pedido' })
  rechazar(@Param('id') id: string, @Body() dto: RechazarPedidoDto, @Request() req) {
    return this.service.rechazar(id, dto, req.user);
  }

  // ── ETAPA 2→3: ENVIAR A FIRMA ──
  @Patch(':id/enviar-firma')
  @UseGuards(RolesGuard)
  @Roles(UserRole.COMPRAS, UserRole.ADMIN)
  @ApiOperation({ summary: 'Enviar a Secretaría para firma (Compras)' })
  enviarAFirma(@Param('id') id: string, @Request() req) {
    return this.service.enviarAFirma(id, req.user);
  }

  // ── ETAPA 2→3: ELEGIR PRESUPUESTO ──
  @Patch(':id/seleccionar-presupuesto/:presupuestoId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.COMPRAS, UserRole.ADMIN)
  @ApiOperation({ summary: 'Seleccionar presupuesto ganador' })
  seleccionarPresupuesto(
    @Param('id') id: string,
    @Param('presupuestoId') presupuestoId: string,
    @Request() req,
  ) {
    return this.service.seleccionarPresupuesto(id, presupuestoId, req.user);
  }

  // ── ETAPA 3→4: FIRMAR ──
  @Patch(':id/firmar')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SECRETARIA, UserRole.ADMIN)
  @ApiOperation({ summary: 'Firmar presupuesto (Secretaría)' })
  firmar(@Param('id') id: string, @Body() dto: FirmarPresupuestoDto, @Request() req) {
    return this.service.firmar(id, dto, req.user);
  }

  // ── ETAPA 4→5: SUBIR FACTURA (Compras) ──
  @Patch(':id/subir-factura')
  @UseGuards(RolesGuard)
  @Roles(UserRole.COMPRAS, UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('factura'))
  @ApiOperation({ summary: 'Subir factura del proveedor y enviar a Tesorería (Compras)' })
  subirFactura(
    @Param('id') id: string,
    @Body() dto: SubirFacturaDto,
    @Request() req,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.service.subirFactura(id, file, req.user, dto.fechaLimitePago);
  }

  // ── ETAPA 3→2: RECHAZAR PRESUPUESTO ──
  @Patch(':id/rechazar-presupuesto')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SECRETARIA, UserRole.ADMIN)
  @ApiOperation({ summary: 'Rechazar presupuesto, vuelve a Compras' })
  rechazarPresupuesto(@Param('id') id: string, @Body() dto: RechazarPedidoDto, @Request() req) {
    return this.service.rechazarPresupuesto(id, dto, req.user);
  }

  // ── ETAPA 6→7: CONFIRMAR RECEPCIÓN ──
  @Patch(':id/confirmar-recepcion')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Confirmar recepción de suministros (Admin)' })
  confirmarRecepcion(@Param('id') id: string, @Body() dto: ConfirmarRecepcionDto, @Request() req) {
    return this.service.confirmarRecepcion(id, dto, req.user);
  }

  // ── ARCHIVAL (Admin) ──
  @Patch(':id/archivar')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Archivar manualmente un pedido (Admin)' })
  archivar(@Param('id') id: string) {
    return this.service.archivar(id);
  }

  @Patch(':id/desarchivar')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Desarchivar un pedido (Admin)' })
  desarchivar(@Param('id') id: string) {
    return this.service.desarchivar(id);
  }

  // ── COMENTARIOS ──
  @Get(':id/comentarios')
  @ApiOperation({ summary: 'Listar comentarios del pedido' })
  listComentarios(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.listComentarios(id);
  }

  @Post(':id/comentarios')
  @ApiOperation({ summary: 'Agregar comentario al pedido' })
  addComentario(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreatePedidoComentarioDto,
    @Request() req,
  ) {
    return this.service.addComentario(id, dto.texto, req.user);
  }

  // ── ORDEN DE COMPRA PDF ──
  @Get(':id/orden-compra')
  @ApiOperation({ summary: 'Obtener URL de la Orden de Compra PDF' })
  async getOrdenCompra(@Param('id') id: string) {
    const pedido = await this.service.findById(id);
    return {
      numero: pedido.ordenCompraNumero,
      url: pedido.ordenCompraUrl,
      available: !!pedido.ordenCompraUrl,
    };
  }
}
