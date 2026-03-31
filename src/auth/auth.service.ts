import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { User, UserRole } from '../users/user.entity';
import { DEMO_EMAIL_BY_ROLE } from './demo.constants';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new UnauthorizedException('Credenciales inválidas');
    if (!user.isActive) throw new UnauthorizedException('Usuario inactivo. Contactá a Sistemas.');

    const valid = await this.usersService.validatePassword(user, password);
    if (!valid) throw new UnauthorizedException('Credenciales inválidas');

    return user;
  }

  private toAuthResponse(user: User) {
    const payload = {
      sub: user.id,
      email: user.email,
      rol: user.rol,
      nombre: user.nombre,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        apellido: user.apellido,
        nombreCompleto: `${user.nombre} ${user.apellido}`,
        rol: user.rol,
        mustChangePassword: user.mustChangePassword,
        firmaUrl: user.firmaUrl,
        areaAsignada: user.areaAsignada ?? null,
        areasPedidoPermitidas: user.areasPedidoPermitidas ?? null,
      },
    };
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);
    return this.toAuthResponse(user);
  }

  /** Sin contraseña; solo si DEMO_MODE está habilitado en el servidor. */
  async demoLogin(rol: UserRole) {
    const demoFlag = (this.configService.get<string>('DEMO_MODE') ?? '').trim().toLowerCase();
    if (!['true', '1', 'yes'].includes(demoFlag)) {
      throw new ForbiddenException('El modo demo no está habilitado en el servidor.');
    }
    const email = DEMO_EMAIL_BY_ROLE[rol];
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException(
        'Usuario demo no encontrado. Ejecutá npm run seed en el backend.',
      );
    }
    if (!user.isActive) {
      throw new UnauthorizedException('Usuario demo inactivo.');
    }
    return this.toAuthResponse(user);
  }
}
