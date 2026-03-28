import { PresupuestosService, CreatePresupuestoDto } from './presupuestos.service';
import { Presupuesto } from './presupuesto.entity';
import { ArchivosService } from '../archivos/archivos.service';
export declare class PresupuestosController {
    private readonly service;
    private readonly archivosService;
    constructor(service: PresupuestosService, archivosService: ArchivosService);
    findAll(pedidoId: string): Promise<Presupuesto[]>;
    create(pedidoId: string, dto: CreatePresupuestoDto, req: any, file?: Express.Multer.File): Promise<Presupuesto>;
    delete(id: string, req: any): Promise<void>;
}
export declare class PresupuestosModule {
}
