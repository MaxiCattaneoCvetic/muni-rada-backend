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
exports.ConfigSystemModule = exports.ConfigController = exports.ConfigSystemService = exports.UpdateConfigDto = exports.SistemaConfig = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../users/user.entity");
const common_1 = require("@nestjs/common");
const typeorm_2 = require("@nestjs/typeorm");
const typeorm_3 = require("typeorm");
const typeorm_4 = require("@nestjs/typeorm");
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const user_entity_2 = require("../users/user.entity");
let SistemaConfig = class SistemaConfig {
};
exports.SistemaConfig = SistemaConfig;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], SistemaConfig.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, name: 'umbral_sellado', default: 350000 }),
    __metadata("design:type", Number)
], SistemaConfig.prototype, "umbralSellado", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'min_presupuestos', default: 3 }),
    __metadata("design:type", Number)
], SistemaConfig.prototype, "minPresupuestos", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'bloquear_pago_sin_sellado', default: true }),
    __metadata("design:type", Boolean)
], SistemaConfig.prototype, "bloquearPagoSinSellado", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'nombre_municipalidad', default: 'Municipalidad de Rada Tilly' }),
    __metadata("design:type", String)
], SistemaConfig.prototype, "nombreMunicipalidad", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, name: 'cuit_institucional' }),
    __metadata("design:type", String)
], SistemaConfig.prototype, "cuitInstitucional", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'modificado_por_id' }),
    __metadata("design:type", user_entity_1.User)
], SistemaConfig.prototype, "modificadoPor", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], SistemaConfig.prototype, "updatedAt", void 0);
exports.SistemaConfig = SistemaConfig = __decorate([
    (0, typeorm_1.Entity)('sistema_config')
], SistemaConfig);
class UpdateConfigDto {
}
exports.UpdateConfigDto = UpdateConfigDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 350000 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdateConfigDto.prototype, "umbralSellado", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 3 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdateConfigDto.prototype, "minPresupuestos", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpdateConfigDto.prototype, "bloquearPagoSinSellado", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateConfigDto.prototype, "nombreMunicipalidad", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateConfigDto.prototype, "cuitInstitucional", void 0);
let ConfigSystemService = class ConfigSystemService {
    constructor(repo) {
        this.repo = repo;
        this.config = null;
    }
    async getConfig() {
        if (this.config)
            return this.config;
        let cfg = await this.repo.findOne({ where: {}, order: { updatedAt: 'DESC' } });
        if (!cfg) {
            cfg = this.repo.create({});
            cfg = await this.repo.save(cfg);
        }
        this.config = cfg;
        return cfg;
    }
    async getUmbralSellado() {
        const cfg = await this.getConfig();
        return Number(cfg.umbralSellado);
    }
    async getMinPresupuestos() {
        const cfg = await this.getConfig();
        return cfg.minPresupuestos;
    }
    async update(dto, user) {
        const cfg = await this.getConfig();
        Object.assign(cfg, dto);
        cfg.modificadoPor = user;
        this.config = null;
        return this.repo.save(cfg);
    }
};
exports.ConfigSystemService = ConfigSystemService;
exports.ConfigSystemService = ConfigSystemService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_2.InjectRepository)(SistemaConfig)),
    __metadata("design:paramtypes", [typeorm_3.Repository])
], ConfigSystemService);
let ConfigController = class ConfigController {
    constructor(service) {
        this.service = service;
    }
    getConfig() {
        return this.service.getConfig();
    }
    update(dto, req) {
        return this.service.update(dto, req.user);
    }
};
exports.ConfigController = ConfigController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener configuración del sistema' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ConfigController.prototype, "getConfig", null);
__decorate([
    (0, common_1.Put)(),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_entity_2.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Actualizar configuración (Admin)' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [UpdateConfigDto, Object]),
    __metadata("design:returntype", void 0)
], ConfigController.prototype, "update", null);
exports.ConfigController = ConfigController = __decorate([
    (0, swagger_1.ApiTags)('Configuración'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('config'),
    __metadata("design:paramtypes", [ConfigSystemService])
], ConfigController);
let ConfigSystemModule = class ConfigSystemModule {
};
exports.ConfigSystemModule = ConfigSystemModule;
exports.ConfigSystemModule = ConfigSystemModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_4.TypeOrmModule.forFeature([SistemaConfig])],
        providers: [ConfigSystemService],
        controllers: [ConfigController],
        exports: [ConfigSystemService],
    })
], ConfigSystemModule);
//# sourceMappingURL=config.module.js.map