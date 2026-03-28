"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SelladosModule = exports.SelladosController = exports.SelladosService = exports.RegistrarSelladoDto = exports.Sellado = void 0;
const typeorm_1 = require("typeorm");
const pedido_entity_1 = require("../pedidos/pedido.entity");
const user_entity_1 = require("../users/user.entity");
const common_1 = require("@nestjs/common");
const typeorm_2 = require("@nestjs/typeorm");
const typeorm_3 = require("typeorm");
const typeorm_4 = require("@nestjs/typeorm");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const user_entity_2 = require("../users/user.entity");
const pedidos_module_1 = require("../pedidos/pedidos.module");
const pedidos_service_1 = require("../pedidos/pedidos.service");
let Sellado = class Sellado {
};
exports.Sellado = Sellado;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Sellado.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => pedido_entity_1.Pedido, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'pedido_id' }),
    __metadata("design:type", pedido_entity_1.Pedido)
], Sellado.prototype, "pedido", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'pedido_id' }),
    __metadata("design:type", String)
], Sellado.prototype, "pedidoId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'numero_sellado' }),
    __metadata("design:type", String)
], Sellado.prototype, "numeroSellado", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', name: 'fecha_sellado' }),
    __metadata("design:type", String)
], Sellado.prototype, "fechaSellado", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, name: 'monto_sellado' }),
    __metadata("design:type", Number)
], Sellado.prototype, "montoSellado", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, name: 'comprobante_url' }),
    __metadata("design:type", String)
], Sellado.prototype, "comprobanteUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, name: 'comprobante_path' }),
    __metadata("design:type", String)
], Sellado.prototype, "comprobantePath", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'registrado_por_id' }),
    __metadata("design:type", user_entity_1.User)
], Sellado.prototype, "registradoPor", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Sellado.prototype, "createdAt", void 0);
exports.Sellado = Sellado = __decorate([
    (0, typeorm_1.Entity)('sellados')
], Sellado);
class RegistrarSelladoDto {
}
exports.RegistrarSelladoDto = RegistrarSelladoDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'SELL-2026-082' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], RegistrarSelladoDto.prototype, "numeroSellado", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-03-15' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], RegistrarSelladoDto.prototype, "fechaSellado", void 0);
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, swagger_1.ApiProperty)({ example: 15000 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], RegistrarSelladoDto.prototype, "montoSellado", void 0);
let SelladosService = class SelladosService {
    constructor(repo, pedidosService) {
        this.repo = repo;
        this.pedidosService = pedidosService;
    }
    async findByPedido(pedidoId) {
        return this.repo.findOne({ where: { pedidoId }, relations: ['registradoPor'] });
    }
    async registrar(pedidoId, dto, user, url, path) {
        const existing = await this.findByPedido(pedidoId);
        if (existing)
            throw new common_1.BadRequestException('Ya existe un sellado para este pedido');
        const sellado = this.repo.create({
            ...dto,
            pedidoId,
            registradoPor: user,
            comprobanteUrl: url,
            comprobantePath: path,
        });
        const saved = await this.repo.save(sellado);
        await this.pedidosService.desbloquear(pedidoId);
        return saved;
    }
};
exports.SelladosService = SelladosService;
exports.SelladosService = SelladosService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_2.InjectRepository)(Sellado)),
    __metadata("design:paramtypes", [typeorm_3.Repository,
        pedidos_service_1.PedidosService])
], SelladosService);
let SelladosController = class SelladosController {
    constructor(service) {
        this.service = service;
    }
    findOne(pedidoId) {
        return this.service.findByPedido(pedidoId);
    }
    registrar(pedidoId, dto, req) {
        return this.service.registrar(pedidoId, dto, req.user);
    }
};
exports.SelladosController = SelladosController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener sellado de un pedido' }),
    __param(0, (0, common_1.Param)('pedidoId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SelladosController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_entity_2.UserRole.TESORERIA, user_entity_2.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Registrar sellado provincial' }),
    __param(0, (0, common_1.Param)('pedidoId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, RegistrarSelladoDto, Object]),
    __metadata("design:returntype", void 0)
], SelladosController.prototype, "registrar", null);
exports.SelladosController = SelladosController = __decorate([
    (0, swagger_1.ApiTags)('Sellados'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('pedidos/:pedidoId/sellado'),
    __metadata("design:paramtypes", [SelladosService])
], SelladosController);
let SelladosModule = class SelladosModule {
};
exports.SelladosModule = SelladosModule;
exports.SelladosModule = SelladosModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_4.TypeOrmModule.forFeature([Sellado]), pedidos_module_1.PedidosModule],
        providers: [SelladosService],
        controllers: [SelladosController],
        exports: [SelladosService],
    })
], SelladosModule);
//# sourceMappingURL=sellados.module.js.map