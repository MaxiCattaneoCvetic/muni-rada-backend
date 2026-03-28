import { AreaMunicipal } from './pedido.entity';
export declare class CreatePedidoDto {
    descripcion: string;
    cantidad?: string;
    detalle?: string;
    area: AreaMunicipal;
    urgente?: boolean;
}
export declare class AprobarPedidoDto {
    nota?: string;
}
export declare class RechazarPedidoDto {
    motivo: string;
}
export declare class FirmarPresupuestoDto {
    nota?: string;
}
export declare class ConfirmarRecepcionDto {
    nota?: string;
}
export declare class PedidoFilterDto {
    stage?: number;
    area?: string;
    urgente?: boolean;
    search?: string;
}
