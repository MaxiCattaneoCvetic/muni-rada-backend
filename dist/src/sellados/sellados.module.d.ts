import { Pedido } from '../pedidos/pedido.entity';
import { User } from '../users/user.entity';
import { Repository } from 'typeorm';
import { PedidosService } from '../pedidos/pedidos.service';
export declare class Sellado {
    id: string;
    pedido: Pedido;
    pedidoId: string;
    numeroSellado: string;
    fechaSellado: string;
    montoSellado: number;
    comprobanteUrl: string;
    comprobantePath: string;
    registradoPor: User;
    createdAt: Date;
}
export declare class RegistrarSelladoDto {
    numeroSellado: string;
    fechaSellado: string;
    montoSellado: number;
}
export declare class SelladosService {
    private repo;
    private pedidosService;
    constructor(repo: Repository<Sellado>, pedidosService: PedidosService);
    findByPedido(pedidoId: string): Promise<Sellado | null>;
    registrar(pedidoId: string, dto: RegistrarSelladoDto, user: User, url?: string, path?: string): Promise<Sellado>;
}
export declare class SelladosController {
    private readonly service;
    constructor(service: SelladosService);
    findOne(pedidoId: string): Promise<Sellado>;
    registrar(pedidoId: string, dto: RegistrarSelladoDto, req: any): Promise<Sellado>;
}
export declare class SelladosModule {
}
