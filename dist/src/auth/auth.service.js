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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const users_service_1 = require("../users/users.service");
const demo_constants_1 = require("./demo.constants");
let AuthService = class AuthService {
    constructor(usersService, jwtService, configService) {
        this.usersService = usersService;
        this.jwtService = jwtService;
        this.configService = configService;
    }
    async validateUser(email, password) {
        const user = await this.usersService.findByEmail(email);
        if (!user)
            throw new common_1.UnauthorizedException('Credenciales inválidas');
        if (!user.isActive)
            throw new common_1.UnauthorizedException('Usuario inactivo. Contactá a Sistemas.');
        const valid = await this.usersService.validatePassword(user, password);
        if (!valid)
            throw new common_1.UnauthorizedException('Credenciales inválidas');
        return user;
    }
    toAuthResponse(user) {
        const payload = {
            sub: user.id,
            email: user.email,
            rol: user.rol,
            nombre: user.nombre,
        };
        return {
            accessToken: this.jwtService.sign(payload),
            user: {
                id: user.id,
                email: user.email,
                nombre: user.nombre,
                apellido: user.apellido,
                nombreCompleto: `${user.nombre} ${user.apellido}`,
                rol: user.rol,
                mustChangePassword: user.mustChangePassword,
                firmaUrl: user.firmaUrl,
            },
        };
    }
    async login(email, password) {
        const user = await this.validateUser(email, password);
        return this.toAuthResponse(user);
    }
    async demoLogin(rol) {
        if (this.configService.get('DEMO_MODE') !== 'true') {
            throw new common_1.ForbiddenException('El modo demo no está habilitado en el servidor.');
        }
        const email = demo_constants_1.DEMO_EMAIL_BY_ROLE[rol];
        const user = await this.usersService.findByEmail(email);
        if (!user) {
            throw new common_1.UnauthorizedException('Usuario demo no encontrado. Ejecutá npm run seed en el backend.');
        }
        if (!user.isActive) {
            throw new common_1.UnauthorizedException('Usuario demo inactivo.');
        }
        return this.toAuthResponse(user);
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map