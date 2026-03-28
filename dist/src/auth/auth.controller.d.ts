import { AuthService } from './auth.service';
import { UserRole } from '../users/user.entity';
export declare class LoginDto {
    email: string;
    password: string;
}
export declare class DemoLoginDto {
    rol: UserRole;
}
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    login(dto: LoginDto): Promise<{
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
    demo(dto: DemoLoginDto): Promise<{
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
