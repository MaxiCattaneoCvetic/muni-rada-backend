import { UserRole } from './user.entity';
export declare class CreateUserDto {
    email: string;
    nombre: string;
    apellido: string;
    rol: UserRole;
    password: string;
}
export declare class UpdateUserDto {
    nombre?: string;
    apellido?: string;
    rol?: UserRole;
    isActive?: boolean;
}
export declare class ChangePasswordDto {
    currentPassword: string;
    newPassword: string;
}
export declare class ResetPasswordDto {
    newPassword: string;
}
