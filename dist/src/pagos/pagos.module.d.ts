import { Pedido } from '../pedidos/pedido.entity';
import { User } from '../users/user.entity';
import { Repository } from 'typeorm';
import { PedidosService } from '../pedidos/pedidos.service';
import { ArchivosService } from '../archivos/archivos.service';
export declare class Pago {
    id: string;
    pedido: Pedido;
    pedidoId: string;
    numeroTransferencia: string;
    fechaPago: string;
    montoPagado: number;
    facturaUrl: string;
    facturaPath: string;
    registradoPor: User;
    createdAt: Date;
}
export declare class RegistrarPagoDto {
    numeroTransferencia: string;
    fechaPago: string;
    montoPagado: number;
}
export declare class PagosService {
    private repo;
    private pedidosService;
    constructor(repo: Repository<Pago>, pedidosService: PedidosService);
    findByPedido(pedidoId: string): Promise<Pago | null>;
    registrar(pedidoId: string, dto: RegistrarPagoDto, user: User, facturaUrl?: string, facturaPath?: string): Promise<Pago>;
    findAll(): Promise<Pago[]>;
}
export declare class PagosController {
    private readonly service;
    private readonly archivosService;
    constructor(service: PagosService, archivosService: ArchivosService);
    findOne(pedidoId: string): Promise<Pago>;
    registrar(pedidoId: string, dto: RegistrarPagoDto, req: any, file?: Express.Multer.File): Promise<Pago>;
}
export declare class PagosListController {
    private readonly service;
    constructor(service: PagosService);
    findAll(): Promise<Pago[]>;
}
export declare class PagosModule {
}
