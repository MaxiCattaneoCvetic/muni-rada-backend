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
exports.ArchivosModule = exports.ArchivosService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const supabase_js_1 = require("@supabase/supabase-js");
let ArchivosService = class ArchivosService {
    constructor(configService) {
        this.configService = configService;
        const url = this.configService.get('SUPABASE_URL');
        const key = this.configService.get('SUPABASE_SERVICE_KEY');
        this.bucket = this.configService.get('SUPABASE_STORAGE_BUCKET', 'suministros');
        if (!url || !key) {
            console.warn('⚠️  Supabase no configurado. Los archivos no se guardarán.');
            return;
        }
        this.supabase = (0, supabase_js_1.createClient)(url, key);
    }
    async upload(file, folder, filename) {
        if (!this.supabase)
            throw new common_1.BadRequestException('Storage no configurado. Configurá SUPABASE_URL y SUPABASE_SERVICE_KEY.');
        const ext = file.originalname.split('.').pop();
        const path = `${folder}/${filename}.${ext}`;
        const { error } = await this.supabase.storage
            .from(this.bucket)
            .upload(path, file.buffer, {
            contentType: file.mimetype,
            upsert: true,
        });
        if (error)
            throw new common_1.BadRequestException(`Error subiendo archivo: ${error.message}`);
        const { data } = this.supabase.storage.from(this.bucket).getPublicUrl(path);
        return { url: data.publicUrl, path };
    }
    async uploadFirma(file, userId) {
        this.validateImage(file);
        return this.upload(file, 'firmas', `firma_${userId}_${Date.now()}`);
    }
    async uploadPresupuesto(file, pedidoId) {
        this.validatePdf(file);
        return this.upload(file, 'presupuestos', `presupuesto_${pedidoId}_${Date.now()}`);
    }
    async uploadComprobanteSellado(file, pedidoId) {
        this.validatePdf(file);
        return this.upload(file, 'sellados', `sellado_${pedidoId}_${Date.now()}`);
    }
    async uploadFactura(file, pedidoId) {
        this.validatePdf(file);
        return this.upload(file, 'facturas', `factura_${pedidoId}_${Date.now()}`);
    }
    async deleteFile(path) {
        if (!this.supabase)
            return;
        await this.supabase.storage.from(this.bucket).remove([path]);
    }
    validatePdf(file) {
        if (!file)
            throw new common_1.BadRequestException('No se recibió ningún archivo');
        const allowed = ['application/pdf'];
        if (!allowed.includes(file.mimetype))
            throw new common_1.BadRequestException('Solo se permiten archivos PDF');
        if (file.size > 10 * 1024 * 1024)
            throw new common_1.BadRequestException('El archivo no puede superar 10MB');
    }
    validateImage(file) {
        if (!file)
            throw new common_1.BadRequestException('No se recibió ningún archivo');
        const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
        if (!allowed.includes(file.mimetype))
            throw new common_1.BadRequestException('Solo se permiten imágenes (JPG, PNG) o PDF');
        if (file.size > 5 * 1024 * 1024)
            throw new common_1.BadRequestException('El archivo no puede superar 5MB');
    }
};
exports.ArchivosService = ArchivosService;
exports.ArchivosService = ArchivosService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], ArchivosService);
let ArchivosModule = class ArchivosModule {
};
exports.ArchivosModule = ArchivosModule;
exports.ArchivosModule = ArchivosModule = __decorate([
    (0, common_1.Module)({
        providers: [ArchivosService],
        exports: [ArchivosService],
    })
], ArchivosModule);
//# sourceMappingURL=archivos.service.js.map