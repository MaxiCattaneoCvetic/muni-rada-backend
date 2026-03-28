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
exports.PresupuestosModule = exports.PresupuestosController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const typeorm_1 = require("@nestjs/typeorm");
const swagger_1 = require("@nestjs/swagger");
const presupuestos_service_1 = require("./presupuestos.service");
const presupuesto_entity_1 = require("./presupuesto.entity");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const user_entity_1 = require("../users/user.entity");
const archivos_module_1 = require("../archivos/archivos.module");
const archivos_service_1 = require("../archivos/archivos.service");
let PresupuestosController = class PresupuestosController {
    constructor(service, archivosService) {
        this.service = service;
        this.archivosService = archivosService;
    }
    findAll(pedidoId) {
        return this.service.findByPedido(pedidoId);
    }
    async create(pedidoId, dto, req, file) {
        let url, path;
        if (file) {
            const result = await this.archivosService.uploadPresupuesto(file, pedidoId);
            url = result.url;
            path = result.path;
        }
        return this.service.create(pedidoId, dto, req.user, url, path);
    }
    delete(id, req) {
        return this.service.delete(id, req.user);
    }
};
exports.PresupuestosController = PresupuestosController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Listar presupuestos de un pedido' }),
    __param(0, (0, common_1.Param)('pedidoId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PresupuestosController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.COMPRAS, user_entity_1.UserRole.ADMIN),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('archivo')),
    (0, swagger_1.ApiOperation)({ summary: 'Cargar presupuesto (con PDF opcional)' }),
    __param(0, (0, common_1.Param)('pedidoId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __param(3, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, presupuestos_service_1.CreatePresupuestoDto, Object, Object]),
    __metadata("design:returntype", Promise)
], PresupuestosController.prototype, "create", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.COMPRAS, user_entity_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Eliminar presupuesto' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PresupuestosController.prototype, "delete", null);
exports.PresupuestosController = PresupuestosController = __decorate([
    (0, swagger_1.ApiTags)('Presupuestos'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('pedidos/:pedidoId/presupuestos'),
    __metadata("design:paramtypes", [presupuestos_service_1.PresupuestosService,
        archivos_service_1.ArchivosService])
], PresupuestosController);
let PresupuestosModule = class PresupuestosModule {
};
exports.PresupuestosModule = PresupuestosModule;
exports.PresupuestosModule = PresupuestosModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([presupuesto_entity_1.Presupuesto]), archivos_module_1.ArchivosModule],
        providers: [presupuestos_service_1.PresupuestosService],
        controllers: [PresupuestosController],
        exports: [presupuestos_service_1.PresupuestosService],
    })
], PresupuestosModule);
//# sourceMappingURL=presupuestos.module.js.map