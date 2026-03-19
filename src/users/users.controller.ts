import {
  Controller, Get, Post, Put, Patch, Delete, Body, Param,
  UseGuards, Request, UploadedFile, UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { ArchivosService } from '../archivos/archivos.service';
import { CreateUserDto, UpdateUserDto, ResetPasswordDto, ChangePasswordDto } from './users.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from './user.entity';

@ApiTags('Usuarios')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly archivosService: ArchivosService,
  ) {}

  // GET /api/users — solo admin
  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Listar todos los usuarios (Admin)' })
  findAll() {
    return this.usersService.findAll();
  }

  // GET /api/users/me — perfil propio
  @Get('me')
  @ApiOperation({ summary: 'Obtener perfil propio' })
  getMe(@Request() req) {
    return this.usersService.findById(req.user.id);
  }

  // GET /api/users/:id
  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  // POST /api/users — crear usuario (solo admin)
  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Crear usuario nuevo (Admin)' })
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  // PUT /api/users/:id — actualizar usuario (solo admin)
  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Actualizar usuario (Admin)' })
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  // POST /api/users/:id/reset-password — blanquear contraseña (solo admin)
  @Post(':id/reset-password')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Blanquear contraseña (Admin)' })
  async resetPassword(@Param('id') id: string, @Body() dto: ResetPasswordDto) {
    await this.usersService.resetPassword(id, dto);
    return { message: 'Contraseña blanqueada. El usuario deberá cambiarla al próximo login.' };
  }

  // POST /api/users/me/change-password — cambiar propia contraseña
  @Post('me/change-password')
  @ApiOperation({ summary: 'Cambiar propia contraseña' })
  async changePassword(@Request() req, @Body() dto: ChangePasswordDto) {
    await this.usersService.changePassword(req.user.id, dto);
    return { message: 'Contraseña actualizada correctamente.' };
  }

  // POST /api/users/me/firma — subir firma escaneada
  @Post('me/firma')
  @UseInterceptors(FileInterceptor('firma'))
  @ApiOperation({ summary: 'Subir firma escaneada (Secretaría)' })
  async uploadFirma(@Request() req, @UploadedFile() file: Express.Multer.File) {
    const { url, path } = await this.archivosService.uploadFirma(file, req.user.id);
    await this.usersService.updateFirma(req.user.id, url, path);
    return { firmaUrl: url, message: 'Firma guardada correctamente.' };
  }

  // PATCH /api/users/:id/activate
  @Patch(':id/activate')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  activate(@Param('id') id: string) {
    return this.usersService.activate(id);
  }

  // PATCH /api/users/:id/deactivate
  @Patch(':id/deactivate')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  deactivate(@Param('id') id: string) {
    return this.usersService.deactivate(id);
  }
}
