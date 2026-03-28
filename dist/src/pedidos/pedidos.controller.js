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
exports.PedidosController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const pedidos_service_1 = require("./pedidos.service");
const pedidos_dto_1 = require("./pedidos.dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const user_entity_1 = require("../users/user.entity");
let PedidosController = class PedidosController {
    constructor(service) {
        this.service = service;
    }
    findAll(req, filter) {
        return this.service.findForRole(req.user, filter);
    }
    findAllAdmin(filter) {
        return this.service.findAll(filter);
    }
    getStats() {
        return this.service.getStats();
    }
    findOne(id) {
        return this.service.findById(id);
    }
    create(dto, req) {
        return this.service.create(dto, req.user);
    }
    aprobar(id, dto, req) {
        return this.service.aprobar(id, dto, req.user);
    }
    rechazar(id, dto, req) {
        return this.service.rechazar(id, dto, req.user);
    }
    enviarAFirma(id, req) {
        return this.service.enviarAFirma(id, req.user);
    }
    seleccionarPresupuesto(id, presupuestoId, req) {
        return this.service.seleccionarPresupuesto(id, presupuestoId, req.user);
    }
    firmar(id, dto, req) {
        return this.service.firmar(id, dto, req.user);
    }
    rechazarPresupuesto(id, dto, req) {
        return this.service.rechazarPresupuesto(id, dto, req.user);
    }
    confirmarRecepcion(id, dto, req) {
        return this.service.confirmarRecepcion(id, dto, req.user);
    }
};
exports.PedidosController = PedidosController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Listar pedidos (filtrado por rol automáticamente)' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, pedidos_dto_1.PedidoFilterDto]),
    __metadata("design:returntype", void 0)
], PedidosController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('todos'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Todos los pedidos sin filtro — solo Admin' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [pedidos_dto_1.PedidoFilterDto]),
    __metadata("design:returntype", void 0)
], PedidosController.prototype, "findAllAdmin", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN, user_entity_1.UserRole.SECRETARIA),
    (0, swagger_1.ApiOperation)({ summary: 'Estadísticas generales' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PedidosController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Detalle de un pedido' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PedidosController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Crear nuevo pedido' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [pedidos_dto_1.CreatePedidoDto, Object]),
    __metadata("design:returntype", void 0)
], PedidosController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id/aprobar'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.SECRETARIA, user_entity_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Aprobar pedido (Secretaría)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, pedidos_dto_1.AprobarPedidoDto, Object]),
    __metadata("design:returntype", void 0)
], PedidosController.prototype, "aprobar", null);
__decorate([
    (0, common_1.Patch)(':id/rechazar'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.SECRETARIA, user_entity_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Rechazar pedido' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, pedidos_dto_1.RechazarPedidoDto, Object]),
    __metadata("design:returntype", void 0)
], PedidosController.prototype, "rechazar", null);
__decorate([
    (0, common_1.Patch)(':id/enviar-firma'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.COMPRAS, user_entity_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Enviar a Secretaría para firma (Compras)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PedidosController.prototype, "enviarAFirma", null);
__decorate([
    (0, common_1.Patch)(':id/seleccionar-presupuesto/:presupuestoId'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.COMPRAS, user_entity_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Seleccionar presupuesto ganador' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('presupuestoId')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], PedidosController.prototype, "seleccionarPresupuesto", null);
__decorate([
    (0, common_1.Patch)(':id/firmar'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.SECRETARIA, user_entity_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Firmar presupuesto (Secretaría)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, pedidos_dto_1.FirmarPresupuestoDto, Object]),
    __metadata("design:returntype", void 0)
], PedidosController.prototype, "firmar", null);
__decorate([
    (0, common_1.Patch)(':id/rechazar-presupuesto'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.SECRETARIA, user_entity_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Rechazar presupuesto, vuelve a Compras' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, pedidos_dto_1.RechazarPedidoDto, Object]),
    __metadata("design:returntype", void 0)
], PedidosController.prototype, "rechazarPresupuesto", null);
__decorate([
    (0, common_1.Patch)(':id/confirmar-recepcion'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Confirmar recepción de suministros (Admin)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, pedidos_dto_1.ConfirmarRecepcionDto, Object]),
    __metadata("design:returntype", void 0)
], PedidosController.prototype, "confirmarRecepcion", null);
exports.PedidosController = PedidosController = __decorate([
    (0, swagger_1.ApiTags)('Pedidos'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('pedidos'),
    __metadata("design:paramtypes", [pedidos_service_1.PedidosService])
], PedidosController);
//# sourceMappingURL=pedidos.controller.js.map