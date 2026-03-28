import { Repository } from 'typeorm';
import { Pedido } from './pedido.entity';
import { CreatePedidoDto, AprobarPedidoDto, RechazarPedidoDto, FirmarPresupuestoDto, ConfirmarRecepcionDto, PedidoFilterDto } from './pedidos.dto';
import { User } from '../users/user.entity';
import { PresupuestosService } from '../presupuestos/presupuestos.service';
import { ConfigSystemService } from '../config/config.service';
export declare class PedidosService {
    private pedidosRepo;
    private presupuestosService;
    private configService;
    constructor(pedidosRepo: Repository<Pedido>, presupuestosService: PresupuestosService, configService: ConfigSystemService);
    private generateNumero;
    private assertStage;
    findAll(filter?: PedidoFilterDto): Promise<Pedido[]>;
    findById(id: string): Promise<Pedido>;
    findByNumero(numero: string): Promise<Pedido>;
    findForRole(user: User, filter?: PedidoFilterDto): Promise<Pedido[]>;
    getStats(): Promise<{
        total: number;
        stages: any[];
        urgentes: number;
        bloqueados: number;
    }>;
    create(dto: CreatePedidoDto, user: User): Promise<Pedido>;
    aprobar(id: string, dto: AprobarPedidoDto, user: User): Promise<Pedido>;
    rechazar(id: string, dto: RechazarPedidoDto, user: User): Promise<Pedido>;
    enviarAFirma(id: string, user: User): Promise<Pedido>;
    seleccionarPresupuesto(id: string, presupuestoId: string, user: User): Promise<Pedido>;
    firmar(id: string, dto: FirmarPresupuestoDto, user: User): Promise<Pedido>;
    rechazarPresupuesto(id: string, dto: RechazarPedidoDto, user: User): Promise<Pedido>;
    marcarPagado(id: string, user: User): Promise<Pedido>;
    desbloquear(id: string): Promise<Pedido>;
    confirmarRecepcion(id: string, dto: ConfirmarRecepcionDto, user: User): Promise<Pedido>;
}
