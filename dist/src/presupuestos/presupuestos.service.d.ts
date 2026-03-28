import { Repository } from 'typeorm';
import { Presupuesto } from './presupuesto.entity';
import { User } from '../users/user.entity';
export declare class CreatePresupuestoDto {
    proveedor: string;
    cuit?: string;
    monto: number;
    plazoEntrega?: string;
    contacto?: string;
    notas?: string;
}
export declare class PresupuestosService {
    private repo;
    constructor(repo: Repository<Presupuesto>);
    findByPedido(pedidoId: string): Promise<Presupuesto[]>;
    findById(id: string): Promise<Presupuesto>;
    create(pedidoId: string, dto: CreatePresupuestoDto, user: User, archivoUrl?: string, archivoPath?: string): Promise<Presupuesto>;
    delete(id: string, user: User): Promise<void>;
    updateArchivo(id: string, url: string, path: string): Promise<Presupuesto>;
}
