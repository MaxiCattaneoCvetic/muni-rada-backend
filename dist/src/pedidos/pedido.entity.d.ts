import { User } from '../users/user.entity';
export declare enum PedidoStage {
    APROBACION = 1,
    PRESUPUESTOS = 2,
    FIRMA = 3,
    GESTION_PAGOS = 4,
    ESPERANDO_SUMINISTROS = 5,
    SUMINISTROS_LISTOS = 6,
    RECHAZADO = 7
}
export declare enum AreaMunicipal {
    ADMINISTRACION = "Administraci\u00F3n",
    OBRAS_PUBLICAS = "Obras P\u00FAblicas",
    SISTEMAS = "Sistemas",
    RRHH = "RRHH",
    CATASTRO = "Catastro",
    INTENDENCIA = "Intendencia",
    TURISMO = "Turismo",
    TESORERIA_AREA = "Tesorer\u00EDa",
    SECRETARIA_AREA = "Secretar\u00EDa"
}
export declare class Pedido {
    id: string;
    numero: string;
    descripcion: string;
    cantidad: string;
    detalle: string;
    area: AreaMunicipal;
    urgente: boolean;
    stage: PedidoStage;
    monto: number;
    proveedorSeleccionado: string;
    bloqueado: boolean;
    notaAprobacion: string;
    notaRechazo: string;
    creadoPor: User;
    aprobadoPor: User;
    firmadoPor: User;
    firmaUrlUsada: string;
    firmaHash: string;
    firmadoEn: Date;
    recepcionConfirmadaPor: User;
    recepcionEn: Date;
    createdAt: Date;
    updatedAt: Date;
}
