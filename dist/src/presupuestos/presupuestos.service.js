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
exports.PresupuestosService = exports.CreatePresupuestoDto = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const presupuesto_entity_1 = require("./presupuesto.entity");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
class CreatePresupuestoDto {
}
exports.CreatePresupuestoDto = CreatePresupuestoDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreatePresupuestoDto.prototype, "proveedor", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreatePresupuestoDto.prototype, "cuit", void 0);
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreatePresupuestoDto.prototype, "monto", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreatePresupuestoDto.prototype, "plazoEntrega", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreatePresupuestoDto.prototype, "contacto", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreatePresupuestoDto.prototype, "notas", void 0);
let PresupuestosService = class PresupuestosService {
    constructor(repo) {
        this.repo = repo;
    }
    async findByPedido(pedidoId) {
        return this.repo.find({
            where: { pedidoId },
            order: { monto: 'ASC' },
            relations: ['cargadoPor'],
        });
    }
    async findById(id) {
        const p = await this.repo.findOne({ where: { id } });
        if (!p)
            throw new common_1.NotFoundException('Presupuesto no encontrado');
        return p;
    }
    async create(pedidoId, dto, user, archivoUrl, archivoPath) {
        const presup = this.repo.create({
            ...dto,
            pedidoId,
            cargadoPor: user,
            archivoUrl,
            archivoPath,
        });
        return this.repo.save(presup);
    }
    async delete(id, user) {
        const presup = await this.findById(id);
        await this.repo.remove(presup);
    }
    async updateArchivo(id, url, path) {
        const p = await this.findById(id);
        p.archivoUrl = url;
        p.archivoPath = path;
        return this.repo.save(p);
    }
};
exports.PresupuestosService = PresupuestosService;
exports.PresupuestosService = PresupuestosService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(presupuesto_entity_1.Presupuesto)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], PresupuestosService);
//# sourceMappingURL=presupuestos.service.js.map