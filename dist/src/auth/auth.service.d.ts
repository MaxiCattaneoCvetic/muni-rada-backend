import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { User, UserRole } from '../users/user.entity';
export declare class AuthService {
    private usersService;
    private jwtService;
    private configService;
    constructor(usersService: UsersService, jwtService: JwtService, configService: ConfigService);
    validateUser(email: string, password: string): Promise<User>;
    private toAuthResponse;
    login(email: string, password: string): Promise<{
        accessToken: string;
        user: {
            id: string;
            email: string;
            nombre: string;
            apellido: string;
            nombreCompleto: string;
            rol: UserRole;
            mustChangePassword: boolean;
            firmaUrl: string;
        };
    }>;
    demoLogin(rol: UserRole): Promise<{
        accessToken: string;
        user: {
            id: string;
            email: string;
            nombre: string;
            apellido: string;
            nombreCompleto: string;
            rol: UserRole;
            mustChangePassword: boolean;
            firmaUrl: string;
        };
    }>;
}
