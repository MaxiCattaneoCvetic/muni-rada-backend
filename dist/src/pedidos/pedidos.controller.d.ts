import { PedidosService } from './pedidos.service';
import { CreatePedidoDto, AprobarPedidoDto, RechazarPedidoDto, FirmarPresupuestoDto, ConfirmarRecepcionDto, PedidoFilterDto } from './pedidos.dto';
export declare class PedidosController {
    private readonly service;
    constructor(service: PedidosService);
    findAll(req: any, filter: PedidoFilterDto): Promise<import("./pedido.entity").Pedido[]>;
    findAllAdmin(filter: PedidoFilterDto): Promise<import("./pedido.entity").Pedido[]>;
    getStats(): Promise<{
        total: number;
        stages: any[];
        urgentes: number;
        bloqueados: number;
    }>;
    findOne(id: string): Promise<import("./pedido.entity").Pedido>;
    create(dto: CreatePedidoDto, req: any): Promise<import("./pedido.entity").Pedido>;
    aprobar(id: string, dto: AprobarPedidoDto, req: any): Promise<import("./pedido.entity").Pedido>;
    rechazar(id: string, dto: RechazarPedidoDto, req: any): Promise<import("./pedido.entity").Pedido>;
    enviarAFirma(id: string, req: any): Promise<import("./pedido.entity").Pedido>;
    seleccionarPresupuesto(id: string, presupuestoId: string, req: any): Promise<import("./pedido.entity").Pedido>;
    firmar(id: string, dto: FirmarPresupuestoDto, req: any): Promise<import("./pedido.entity").Pedido>;
    rechazarPresupuesto(id: string, dto: RechazarPedidoDto, req: any): Promise<import("./pedido.entity").Pedido>;
    confirmarRecepcion(id: string, dto: ConfirmarRecepcionDto, req: any): Promise<import("./pedido.entity").Pedido>;
}
