import { User } from '../users/user.entity';
import { Repository } from 'typeorm';
export declare class SistemaConfig {
    id: string;
    umbralSellado: number;
    minPresupuestos: number;
    bloquearPagoSinSellado: boolean;
    nombreMunicipalidad: string;
    cuitInstitucional: string;
    modificadoPor: User;
    updatedAt: Date;
}
export declare class UpdateConfigDto {
    umbralSellado?: number;
    minPresupuestos?: number;
    bloquearPagoSinSellado?: boolean;
    nombreMunicipalidad?: string;
    cuitInstitucional?: string;
}
export declare class ConfigSystemService {
    private repo;
    private config;
    constructor(repo: Repository<SistemaConfig>);
    getConfig(): Promise<SistemaConfig>;
    getUmbralSellado(): Promise<number>;
    getMinPresupuestos(): Promise<number>;
    update(dto: UpdateConfigDto, user: User): Promise<SistemaConfig>;
}
export declare class ConfigController {
    private readonly service;
    constructor(service: ConfigSystemService);
    getConfig(): Promise<SistemaConfig>;
    update(dto: UpdateConfigDto, req: any): Promise<SistemaConfig>;
}
export declare class ConfigSystemModule {
}
