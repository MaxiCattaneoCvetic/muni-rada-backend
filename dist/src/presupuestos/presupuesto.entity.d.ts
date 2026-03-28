import { Pedido } from '../pedidos/pedido.entity';
import { User } from '../users/user.entity';
export declare class Presupuesto {
    id: string;
    pedido: Pedido;
    pedidoId: string;
    proveedor: string;
    cuit: string;
    monto: number;
    plazoEntrega: string;
    contacto: string;
    notas: string;
    archivoUrl: string;
    archivoPath: string;
    cargadoPor: User;
    createdAt: Date;
}
