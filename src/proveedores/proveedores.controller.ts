import {
  Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, ParseUUIDPipe, Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { User, UserRole } from '../users/user.entity';
import { ProveedoresService } from './proveedores.service';
import {
  CreateProveedorDto, CreateProveedorComentarioDto, UpdateProveedorDto,
} from './proveedores.dto';

const PANEL_ROLES = [UserRole.COMPRAS, UserRole.SECRETARIA, UserRole.ADMIN] as const;

@ApiTags('Proveedores')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('proveedores')
export class ProveedoresController {
  constructor(private readonly service: ProveedoresService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles(...PANEL_ROLES)
  @ApiOperation({ summary: 'Listar proveedores (panel)' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(...PANEL_ROLES)
  @ApiOperation({ summary: 'Detalle de proveedor' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findById(id);
  }

  @Get(':id/facturas')
  @UseGuards(RolesGuard)
  @Roles(...PANEL_ROLES)
  @ApiOperation({ summary: 'Facturas y cotizaciones PDF asociadas al proveedor' })
  facturas(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.getFacturasAsociadas(id);
  }

  @Get(':id/comentarios')
  @UseGuards(RolesGuard)
  @Roles(...PANEL_ROLES)
  @ApiOperation({ summary: 'Comentarios del expediente del proveedor' })
  comentarios(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.listComentarios(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(...PANEL_ROLES)
  @ApiOperation({ summary: 'Alta de proveedor en catálogo (datos básicos y fiscales)' })
  create(@Body() dto: CreateProveedorDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(...PANEL_ROLES)
  @ApiOperation({ summary: 'Actualizar datos del proveedor' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateProveedorDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.COMPRAS, UserRole.ADMIN)
  @ApiOperation({ summary: 'Eliminar proveedor del catálogo' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }

  @Post(':id/comentarios')
  @UseGuards(RolesGuard)
  @Roles(...PANEL_ROLES)
  @ApiOperation({ summary: 'Agregar comentario' })
  addComentario(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateProveedorComentarioDto,
    @Req() req: { user: User },
  ) {
    return this.service.addComentario(id, dto.texto, req.user);
  }
}
