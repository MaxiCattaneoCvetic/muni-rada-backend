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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PedidoFilterDto = exports.ConfirmarRecepcionDto = exports.FirmarPresupuestoDto = exports.RechazarPedidoDto = exports.AprobarPedidoDto = exports.CreatePedidoDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const pedido_entity_1 = require("./pedido.entity");
class CreatePedidoDto {
}
exports.CreatePedidoDto = CreatePedidoDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Resmas papel A4 x5' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreatePedidoDto.prototype, "descripcion", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '5 resmas' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreatePedidoDto.prototype, "cantidad", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreatePedidoDto.prototype, "detalle", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: pedido_entity_1.AreaMunicipal }),
    (0, class_validator_1.IsEnum)(pedido_entity_1.AreaMunicipal),
    __metadata("design:type", String)
], CreatePedidoDto.prototype, "area", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: false }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreatePedidoDto.prototype, "urgente", void 0);
class AprobarPedidoDto {
}
exports.AprobarPedidoDto = AprobarPedidoDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Aprobado. Priorizar proveedores locales.' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], AprobarPedidoDto.prototype, "nota", void 0);
class RechazarPedidoDto {
}
exports.RechazarPedidoDto = RechazarPedidoDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Monto excede presupuesto disponible.' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], RechazarPedidoDto.prototype, "motivo", void 0);
class FirmarPresupuestoDto {
}
exports.FirmarPresupuestoDto = FirmarPresupuestoDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], FirmarPresupuestoDto.prototype, "nota", void 0);
class ConfirmarRecepcionDto {
}
exports.ConfirmarRecepcionDto = ConfirmarRecepcionDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ConfirmarRecepcionDto.prototype, "nota", void 0);
class PedidoFilterDto {
}
exports.PedidoFilterDto = PedidoFilterDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], PedidoFilterDto.prototype, "stage", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], PedidoFilterDto.prototype, "area", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], PedidoFilterDto.prototype, "urgente", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], PedidoFilterDto.prototype, "search", void 0);
//# sourceMappingURL=pedidos.dto.js.map