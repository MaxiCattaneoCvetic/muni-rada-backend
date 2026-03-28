import { ConfigService } from '@nestjs/config';
export declare class ArchivosService {
    private configService;
    private supabase;
    private bucket;
    constructor(configService: ConfigService);
    private upload;
    uploadFirma(file: Express.Multer.File, userId: string): Promise<{
        url: string;
        path: string;
    }>;
    uploadPresupuesto(file: Express.Multer.File, pedidoId: string): Promise<{
        url: string;
        path: string;
    }>;
    uploadComprobanteSellado(file: Express.Multer.File, pedidoId: string): Promise<{
        url: string;
        path: string;
    }>;
    uploadFactura(file: Express.Multer.File, pedidoId: string): Promise<{
        url: string;
        path: string;
    }>;
    deleteFile(path: string): Promise<void>;
    private validatePdf;
    private validateImage;
}
export declare class ArchivosModule {
}
