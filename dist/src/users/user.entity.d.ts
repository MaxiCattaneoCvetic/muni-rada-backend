export declare enum UserRole {
    SECRETARIA = "secretaria",
    COMPRAS = "compras",
    TESORERIA = "tesoreria",
    ADMIN = "admin"
}
export declare class User {
    id: string;
    email: string;
    nombre: string;
    apellido: string;
    rol: UserRole;
    password: string;
    mustChangePassword: boolean;
    isActive: boolean;
    firmaUrl: string;
    firmaPath: string;
    createdAt: Date;
    updatedAt: Date;
    get nombreCompleto(): string;
}
