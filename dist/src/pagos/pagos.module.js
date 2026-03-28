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
exports.PagosModule = exports.PagosListController = exports.PagosController = exports.PagosService = exports.RegistrarPagoDto = exports.Pago = void 0;
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
const common_2 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const archivos_service_1 = require("../archivos/archivos.service");
const archivos_module_1 = require("../archivos/archivos.module");
let Pago = class Pago {
};
exports.Pago = Pago;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Pago.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => pedido_entity_1.Pedido, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'pedido_id' }),
    __metadata("design:type", pedido_entity_1.Pedido)
], Pago.prototype, "pedido", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'pedido_id' }),
    __metadata("design:type", String)
], Pago.prototype, "pedidoId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'numero_transferencia' }),
    __metadata("design:type", String)
], Pago.prototype, "numeroTransferencia", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', name: 'fecha_pago' }),
    __metadata("design:type", String)
], Pago.prototype, "fechaPago", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, name: 'monto_pagado' }),
    __metadata("design:type", Number)
], Pago.prototype, "montoPagado", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, name: 'factura_url' }),
    __metadata("design:type", String)
], Pago.prototype, "facturaUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, name: 'factura_path' }),
    __metadata("design:type", String)
], Pago.prototype, "facturaPath", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'registrado_por_id' }),
    __metadata("design:type", user_entity_1.User)
], Pago.prototype, "registradoPor", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Pago.prototype, "createdAt", void 0);
exports.Pago = Pago = __decorate([
    (0, typeorm_1.Entity)('pagos')
], Pago);
class RegistrarPagoDto {
}
exports.RegistrarPagoDto = RegistrarPagoDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'TRF-00234581' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], RegistrarPagoDto.prototype, "numeroTransferencia", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-03-15' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], RegistrarPagoDto.prototype, "fechaPago", void 0);
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, swagger_1.ApiProperty)({ example: 420000 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], RegistrarPagoDto.prototype, "montoPagado", void 0);
let PagosService = class PagosService {
    constructor(repo, pedidosService) {
        this.repo = repo;
        this.pedidosService = pedidosService;
    }
    async findByPedido(pedidoId) {
        return this.repo.findOne({ where: { pedidoId }, relations: ['registradoPor'] });
    }
    async registrar(pedidoId, dto, user, facturaUrl, facturaPath) {
        const pedido = await this.pedidosService.findById(pedidoId);
        if (pedido.bloqueado)
            throw new common_1.BadRequestException('El pedido está bloqueado. Registrá el sellado primero.');
        const existing = await this.findByPedido(pedidoId);
        if (existing)
            throw new common_1.BadRequestException('Ya existe un pago registrado para este pedido');
        const pago = this.repo.create({ ...dto, pedidoId, registradoPor: user, facturaUrl, facturaPath });
        const saved = await this.repo.save(pago);
        await this.pedidosService.marcarPagado(pedidoId, user);
        return saved;
    }
    async findAll() {
        return this.repo.find({ relations: ['pedido', 'registradoPor'], order: { createdAt: 'DESC' } });
    }
};
exports.PagosService = PagosService;
exports.PagosService = PagosService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_2.InjectRepository)(Pago)),
    __metadata("design:paramtypes", [typeorm_3.Repository,
        pedidos_service_1.PedidosService])
], PagosService);
let PagosController = class PagosController {
    constructor(service, archivosService) {
        this.service = service;
        this.archivosService = archivosService;
    }
    findOne(pedidoId) {
        return this.service.findByPedido(pedidoId);
    }
    async registrar(pedidoId, dto, req, file) {
        let url, path;
        if (file) {
            const r = await this.archivosService.uploadFactura(file, pedidoId);
            url = r.url;
            path = r.path;
        }
        return this.service.registrar(pedidoId, dto, req.user, url, path);
    }
};
exports.PagosController = PagosController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Param)('pedidoId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PagosController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_entity_2.UserRole.TESORERIA, user_entity_2.UserRole.ADMIN),
    (0, common_2.UseInterceptors)((0, platform_express_1.FileInterceptor)('factura')),
    (0, swagger_1.ApiOperation)({ summary: 'Registrar pago y adjuntar factura' }),
    __param(0, (0, common_1.Param)('pedidoId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __param(3, (0, common_2.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, RegistrarPagoDto, Object, Object]),
    __metadata("design:returntype", Promise)
], PagosController.prototype, "registrar", null);
exports.PagosController = PagosController = __decorate([
    (0, swagger_1.ApiTags)('Pagos'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('pedidos/:pedidoId/pago'),
    __metadata("design:paramtypes", [PagosService,
        archivos_service_1.ArchivosService])
], PagosController);
let PagosListController = class PagosListController {
    constructor(service) {
        this.service = service;
    }
    findAll() {
        return this.service.findAll();
    }
};
exports.PagosListController = PagosListController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Listar todos los pagos (Tesorería)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PagosListController.prototype, "findAll", null);
exports.PagosListController = PagosListController = __decorate([
    (0, swagger_1.ApiTags)('Pagos'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_entity_2.UserRole.TESORERIA, user_entity_2.UserRole.ADMIN),
    (0, common_1.Controller)('pagos'),
    __metadata("design:paramtypes", [PagosService])
], PagosListController);
let PagosModule = class PagosModule {
};
exports.PagosModule = PagosModule;
exports.PagosModule = PagosModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_4.TypeOrmModule.forFeature([Pago]), archivos_module_1.ArchivosModule, pedidos_module_1.PedidosModule],
        providers: [PagosService],
        controllers: [PagosController, PagosListController],
        exports: [PagosService],
    })
], PagosModule);
//# sourceMappingURL=pagos.module.js.map