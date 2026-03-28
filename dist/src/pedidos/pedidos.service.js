"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PedidosService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const pedido_entity_1 = require("./pedido.entity");
const user_entity_1 = require("../users/user.entity");
const presupuestos_service_1 = require("../presupuestos/presupuestos.service");
const config_service_1 = require("../config/config.service");
const crypto = __importStar(require("crypto"));
let PedidosService = class PedidosService {
    constructor(pedidosRepo, presupuestosService, configService) {
        this.pedidosRepo = pedidosRepo;
        this.presupuestosService = presupuestosService;
        this.configService = configService;
    }
    async generateNumero() {
        const count = await this.pedidosRepo.count();
        return `P-${String(count + 1).padStart(3, '0')}`;
    }
    assertStage(pedido, expected, msg) {
        if (pedido.stage !== expected)
            throw new common_1.BadRequestException(msg || `El pedido no está en la etapa correcta para esta acción`);
    }
    async findAll(filter = {}) {
        const where = {};
        if (filter.stage !== undefined)
            where.stage = filter.stage;
        if (filter.area)
            where.area = filter.area;
        if (filter.urgente !== undefined)
            where.urgente = filter.urgente;
        const options = {
            where,
            order: { urgente: 'DESC', createdAt: 'DESC' },
            relations: ['creadoPor', 'aprobadoPor', 'firmadoPor'],
        };
        return this.pedidosRepo.find(options);
    }
    async findById(id) {
        const p = await this.pedidosRepo.findOne({
            where: { id },
            relations: ['creadoPor', 'aprobadoPor', 'firmadoPor', 'recepcionConfirmadaPor'],
        });
        if (!p)
            throw new common_1.NotFoundException(`Pedido ${id} no encontrado`);
        return p;
    }
    async findByNumero(numero) {
        const p = await this.pedidosRepo.findOne({ where: { numero } });
        if (!p)
            throw new common_1.NotFoundException(`Pedido ${numero} no encontrado`);
        return p;
    }
    async findForRole(user, filter = {}) {
        const stagesByRole = {
            [user_entity_1.UserRole.SECRETARIA]: [pedido_entity_1.PedidoStage.APROBACION, pedido_entity_1.PedidoStage.FIRMA],
            [user_entity_1.UserRole.COMPRAS]: [pedido_entity_1.PedidoStage.PRESUPUESTOS],
            [user_entity_1.UserRole.TESORERIA]: [pedido_entity_1.PedidoStage.GESTION_PAGOS],
            [user_entity_1.UserRole.ADMIN]: [
                pedido_entity_1.PedidoStage.APROBACION, pedido_entity_1.PedidoStage.PRESUPUESTOS, pedido_entity_1.PedidoStage.FIRMA,
                pedido_entity_1.PedidoStage.GESTION_PAGOS, pedido_entity_1.PedidoStage.ESPERANDO_SUMINISTROS, pedido_entity_1.PedidoStage.SUMINISTROS_LISTOS,
            ],
        };
        const stages = stagesByRole[user.rol] || [];
        if (filter.stage !== undefined) {
            if (!stages.includes(filter.stage))
                throw new common_1.ForbiddenException('No tenés acceso a esa etapa');
            return this.findAll(filter);
        }
        const all = await Promise.all(stages.map(s => this.findAll({ ...filter, stage: s })));
        return all.flat().sort((a, b) => {
            if (a.urgente && !b.urgente)
                return -1;
            if (!a.urgente && b.urgente)
                return 1;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
    }
    async getStats() {
        const total = await this.pedidosRepo.count();
        const stages = await this.pedidosRepo
            .createQueryBuilder('p')
            .select('p.stage', 'stage')
            .addSelect('COUNT(*)', 'count')
            .groupBy('p.stage')
            .getRawMany();
        const urgentes = await this.pedidosRepo.count({ where: { urgente: true } });
        const bloqueados = await this.pedidosRepo.count({ where: { bloqueado: true } });
        return { total, stages, urgentes, bloqueados };
    }
    async create(dto, user) {
        const numero = await this.generateNumero();
        const pedido = this.pedidosRepo.create({
            ...dto,
            numero,
            stage: pedido_entity_1.PedidoStage.APROBACION,
            creadoPor: user,
        });
        return this.pedidosRepo.save(pedido);
    }
    async aprobar(id, dto, user) {
        const pedido = await this.findById(id);
        this.assertStage(pedido, pedido_entity_1.PedidoStage.APROBACION, 'Solo se pueden aprobar pedidos en etapa de Aprobación');
        pedido.stage = pedido_entity_1.PedidoStage.PRESUPUESTOS;
        pedido.aprobadoPor = user;
        pedido.notaAprobacion = dto.nota;
        return this.pedidosRepo.save(pedido);
    }
    async rechazar(id, dto, user) {
        const pedido = await this.findById(id);
        if (pedido.stage !== pedido_entity_1.PedidoStage.APROBACION && pedido.stage !== pedido_entity_1.PedidoStage.FIRMA)
            throw new common_1.BadRequestException('Solo se pueden rechazar pedidos en etapa Aprobación o Firma');
        pedido.stage = pedido_entity_1.PedidoStage.RECHAZADO;
        pedido.aprobadoPor = user;
        pedido.notaRechazo = dto.motivo;
        return this.pedidosRepo.save(pedido);
    }
    async enviarAFirma(id, user) {
        const pedido = await this.findById(id);
        this.assertStage(pedido, pedido_entity_1.PedidoStage.PRESUPUESTOS, 'El pedido debe estar en etapa de Presupuestos');
        const presupuestos = await this.presupuestosService.findByPedido(id);
        const minPresup = await this.configService.getMinPresupuestos();
        if (presupuestos.length < minPresup)
            throw new common_1.BadRequestException(`Se necesitan al menos ${minPresup} presupuestos`);
        const mejor = presupuestos.reduce((a, b) => a.monto < b.monto ? a : b);
        pedido.proveedorSeleccionado = mejor.proveedor;
        pedido.monto = mejor.monto;
        pedido.stage = pedido_entity_1.PedidoStage.FIRMA;
        return this.pedidosRepo.save(pedido);
    }
    async seleccionarPresupuesto(id, presupuestoId, user) {
        const pedido = await this.findById(id);
        this.assertStage(pedido, pedido_entity_1.PedidoStage.PRESUPUESTOS);
        const presup = await this.presupuestosService.findById(presupuestoId);
        pedido.proveedorSeleccionado = presup.proveedor;
        pedido.monto = presup.monto;
        pedido.stage = pedido_entity_1.PedidoStage.FIRMA;
        return this.pedidosRepo.save(pedido);
    }
    async firmar(id, dto, user) {
        const pedido = await this.findById(id);
        this.assertStage(pedido, pedido_entity_1.PedidoStage.FIRMA, 'El pedido debe estar en etapa de Firma');
        if (!user.firmaUrl)
            throw new common_1.BadRequestException('No tenés una firma configurada en tu perfil. Subí tu firma escaneada primero.');
        const umbral = await this.configService.getUmbralSellado();
        const requiereSellado = (pedido.monto || 0) >= umbral;
        pedido.stage = pedido_entity_1.PedidoStage.GESTION_PAGOS;
        pedido.firmadoPor = user;
        pedido.firmaUrlUsada = user.firmaUrl;
        pedido.firmadoEn = new Date();
        pedido.bloqueado = requiereSellado;
        pedido.firmaHash = crypto.randomBytes(8).toString('hex').toUpperCase();
        return this.pedidosRepo.save(pedido);
    }
    async rechazarPresupuesto(id, dto, user) {
        const pedido = await this.findById(id);
        this.assertStage(pedido, pedido_entity_1.PedidoStage.FIRMA);
        pedido.stage = pedido_entity_1.PedidoStage.PRESUPUESTOS;
        pedido.notaRechazo = dto.motivo;
        return this.pedidosRepo.save(pedido);
    }
    async marcarPagado(id, user) {
        const pedido = await this.findById(id);
        this.assertStage(pedido, pedido_entity_1.PedidoStage.GESTION_PAGOS);
        if (pedido.bloqueado)
            throw new common_1.BadRequestException('El pedido está bloqueado. Registrá el sellado provincial primero.');
        pedido.stage = pedido_entity_1.PedidoStage.ESPERANDO_SUMINISTROS;
        return this.pedidosRepo.save(pedido);
    }
    async desbloquear(id) {
        const pedido = await this.findById(id);
        pedido.bloqueado = false;
        return this.pedidosRepo.save(pedido);
    }
    async confirmarRecepcion(id, dto, user) {
        const pedido = await this.findById(id);
        this.assertStage(pedido, pedido_entity_1.PedidoStage.ESPERANDO_SUMINISTROS, 'El pedido debe estar en Esperando suministros');
        pedido.stage = pedido_entity_1.PedidoStage.SUMINISTROS_LISTOS;
        pedido.recepcionConfirmadaPor = user;
        pedido.recepcionEn = new Date();
        return this.pedidosRepo.save(pedido);
    }
};
exports.PedidosService = PedidosService;
exports.PedidosService = PedidosService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(pedido_entity_1.Pedido)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        presupuestos_service_1.PresupuestosService,
        config_service_1.ConfigSystemService])
], PedidosService);
//# sourceMappingURL=pedidos.service.js.map