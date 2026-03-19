import {
  Controller, Get, Post, Put, Patch, Body, Param, Query,
  UseGuards, Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PedidosService } from './pedidos.service';
import {
  CreatePedidoDto, AprobarPedidoDto, RechazarPedidoDto,
  FirmarPresupuestoDto, ConfirmarRecepcionDto, PedidoFilterDto,
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
  @ApiOperation({ summary: 'Crear nuevo pedido' })
  create(@Body() dto: CreatePedidoDto, @Request() req) {
    return this.service.create(dto, req.user);
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

  // ── ETAPA 3→2: RECHAZAR PRESUPUESTO ──
  @Patch(':id/rechazar-presupuesto')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SECRETARIA, UserRole.ADMIN)
  @ApiOperation({ summary: 'Rechazar presupuesto, vuelve a Compras' })
  rechazarPresupuesto(@Param('id') id: string, @Body() dto: RechazarPedidoDto, @Request() req) {
    return this.service.rechazarPresupuesto(id, dto, req.user);
  }

  // ── ETAPA 5→6: CONFIRMAR RECEPCIÓN ──
  @Patch(':id/confirmar-recepcion')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Confirmar recepción de suministros (Admin)' })
  confirmarRecepcion(@Param('id') id: string, @Body() dto: ConfirmarRecepcionDto, @Request() req) {
    return this.service.confirmarRecepcion(id, dto, req.user);
  }
}
