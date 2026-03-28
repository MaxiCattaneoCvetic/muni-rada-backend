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
exports.Pedido = exports.AreaMunicipal = exports.PedidoStage = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../users/user.entity");
var PedidoStage;
(function (PedidoStage) {
    PedidoStage[PedidoStage["APROBACION"] = 1] = "APROBACION";
    PedidoStage[PedidoStage["PRESUPUESTOS"] = 2] = "PRESUPUESTOS";
    PedidoStage[PedidoStage["FIRMA"] = 3] = "FIRMA";
    PedidoStage[PedidoStage["GESTION_PAGOS"] = 4] = "GESTION_PAGOS";
    PedidoStage[PedidoStage["ESPERANDO_SUMINISTROS"] = 5] = "ESPERANDO_SUMINISTROS";
    PedidoStage[PedidoStage["SUMINISTROS_LISTOS"] = 6] = "SUMINISTROS_LISTOS";
    PedidoStage[PedidoStage["RECHAZADO"] = 7] = "RECHAZADO";
})(PedidoStage || (exports.PedidoStage = PedidoStage = {}));
var AreaMunicipal;
(function (AreaMunicipal) {
    AreaMunicipal["ADMINISTRACION"] = "Administraci\u00F3n";
    AreaMunicipal["OBRAS_PUBLICAS"] = "Obras P\u00FAblicas";
    AreaMunicipal["SISTEMAS"] = "Sistemas";
    AreaMunicipal["RRHH"] = "RRHH";
    AreaMunicipal["CATASTRO"] = "Catastro";
    AreaMunicipal["INTENDENCIA"] = "Intendencia";
    AreaMunicipal["TURISMO"] = "Turismo";
    AreaMunicipal["TESORERIA_AREA"] = "Tesorer\u00EDa";
    AreaMunicipal["SECRETARIA_AREA"] = "Secretar\u00EDa";
})(AreaMunicipal || (exports.AreaMunicipal = AreaMunicipal = {}));
let Pedido = class Pedido {
};
exports.Pedido = Pedido;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Pedido.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Pedido.prototype, "numero", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], Pedido.prototype, "descripcion", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Pedido.prototype, "cantidad", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'text' }),
    __metadata("design:type", String)
], Pedido.prototype, "detalle", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: AreaMunicipal }),
    __metadata("design:type", String)
], Pedido.prototype, "area", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Pedido.prototype, "urgente", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: PedidoStage.APROBACION }),
    __metadata("design:type", Number)
], Pedido.prototype, "stage", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], Pedido.prototype, "monto", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, name: 'proveedor_seleccionado' }),
    __metadata("design:type", String)
], Pedido.prototype, "proveedorSeleccionado", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Pedido.prototype, "bloqueado", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'text', name: 'nota_aprobacion' }),
    __metadata("design:type", String)
], Pedido.prototype, "notaAprobacion", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'text', name: 'nota_rechazo' }),
    __metadata("design:type", String)
], Pedido.prototype, "notaRechazo", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { eager: true, nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'creado_por_id' }),
    __metadata("design:type", user_entity_1.User)
], Pedido.prototype, "creadoPor", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'aprobado_por_id' }),
    __metadata("design:type", user_entity_1.User)
], Pedido.prototype, "aprobadoPor", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'firmado_por_id' }),
    __metadata("design:type", user_entity_1.User)
], Pedido.prototype, "firmadoPor", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, name: 'firma_url_usada' }),
    __metadata("design:type", String)
], Pedido.prototype, "firmaUrlUsada", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, name: 'firma_hash' }),
    __metadata("design:type", String)
], Pedido.prototype, "firmaHash", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, name: 'firmado_en', type: 'timestamp' }),
    __metadata("design:type", Date)
], Pedido.prototype, "firmadoEn", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'recepcion_confirmada_por_id' }),
    __metadata("design:type", user_entity_1.User)
], Pedido.prototype, "recepcionConfirmadaPor", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, name: 'recepcion_en', type: 'timestamp' }),
    __metadata("design:type", Date)
], Pedido.prototype, "recepcionEn", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Pedido.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], Pedido.prototype, "updatedAt", void 0);
exports.Pedido = Pedido = __decorate([
    (0, typeorm_1.Entity)('pedidos')
], Pedido);
//# sourceMappingURL=pedido.entity.js.map