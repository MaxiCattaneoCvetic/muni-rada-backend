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
exports.Presupuesto = void 0;
const typeorm_1 = require("typeorm");
const pedido_entity_1 = require("../pedidos/pedido.entity");
const user_entity_1 = require("../users/user.entity");
let Presupuesto = class Presupuesto {
};
exports.Presupuesto = Presupuesto;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Presupuesto.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => pedido_entity_1.Pedido, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'pedido_id' }),
    __metadata("design:type", pedido_entity_1.Pedido)
], Presupuesto.prototype, "pedido", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'pedido_id' }),
    __metadata("design:type", String)
], Presupuesto.prototype, "pedidoId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Presupuesto.prototype, "proveedor", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Presupuesto.prototype, "cuit", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2 }),
    __metadata("design:type", Number)
], Presupuesto.prototype, "monto", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, name: 'plazo_entrega' }),
    __metadata("design:type", String)
], Presupuesto.prototype, "plazoEntrega", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Presupuesto.prototype, "contacto", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'text' }),
    __metadata("design:type", String)
], Presupuesto.prototype, "notas", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, name: 'archivo_url' }),
    __metadata("design:type", String)
], Presupuesto.prototype, "archivoUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, name: 'archivo_path' }),
    __metadata("design:type", String)
], Presupuesto.prototype, "archivoPath", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'cargado_por_id' }),
    __metadata("design:type", user_entity_1.User)
], Presupuesto.prototype, "cargadoPor", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Presupuesto.prototype, "createdAt", void 0);
exports.Presupuesto = Presupuesto = __decorate([
    (0, typeorm_1.Entity)('presupuestos')
], Presupuesto);
//# sourceMappingURL=presupuesto.entity.js.map