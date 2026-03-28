import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';
import { IsEmail, IsIn, IsString, MinLength } from 'class-validator';
import { AuthService } from './auth.service';
import { UserRole } from '../users/user.entity';

export class LoginDto {
  @IsEmail() email: string;
  @IsString() @MinLength(1) password: string;
}

const DEMO_ROLES = ['secretaria', 'compras', 'tesoreria', 'admin'] as const;

export class DemoLoginDto {
  @ApiProperty({ enum: DEMO_ROLES, example: 'admin' })
  @IsIn(DEMO_ROLES)
  rol: UserRole;
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Login — devuelve JWT token' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @Post('demo')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Demo — entrar como rol sin contraseña (requiere DEMO_MODE=true)',
  })
  demo(@Body() dto: DemoLoginDto) {
    return this.authService.demoLogin(dto.rol);
  }
}
