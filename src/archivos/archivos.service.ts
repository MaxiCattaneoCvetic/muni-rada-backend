import { Injectable, BadRequestException, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class ArchivosService {
  private supabase: SupabaseClient;
  private bucket: string;

  constructor(private configService: ConfigService) {
    const url = this.configService.get<string>('SUPABASE_URL');
    const key = this.configService.get<string>('SUPABASE_SERVICE_KEY');
    this.bucket = this.configService.get<string>('SUPABASE_STORAGE_BUCKET', 'suministros');

    if (!url || !key) {
      console.warn('⚠️  Supabase no configurado. Los archivos no se guardarán.');
      return;
    }
    this.supabase = createClient(url, key);
  }

  private async upload(file: Express.Multer.File, folder: string, filename: string): Promise<{ url: string; path: string }> {
    if (!this.supabase) throw new BadRequestException('Storage no configurado. Configurá SUPABASE_URL y SUPABASE_SERVICE_KEY.');

    const ext = file.originalname.split('.').pop();
    const path = `${folder}/${filename}.${ext}`;

    const { error } = await this.supabase.storage
      .from(this.bucket)
      .upload(path, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (error) throw new BadRequestException(`Error subiendo archivo: ${error.message}`);

    const { data } = this.supabase.storage.from(this.bucket).getPublicUrl(path);
    return { url: data.publicUrl, path };
  }

  async uploadFirma(file: Express.Multer.File, userId: string) {
    this.validateImage(file);
    return this.upload(file, 'firmas', `firma_${userId}_${Date.now()}`);
  }

  async uploadPresupuesto(file: Express.Multer.File, pedidoId: string) {
    this.validatePdf(file);
    return this.upload(file, 'presupuestos', `presupuesto_${pedidoId}_${Date.now()}`);
  }

  async uploadComprobanteSellado(file: Express.Multer.File, pedidoId: string) {
    this.validatePdf(file);
    return this.upload(file, 'sellados', `sellado_${pedidoId}_${Date.now()}`);
  }

  async uploadFactura(file: Express.Multer.File, pedidoId: string) {
    this.validatePdf(file);
    return this.upload(file, 'facturas', `factura_${pedidoId}_${Date.now()}`);
  }

  async deleteFile(path: string): Promise<void> {
    if (!this.supabase) return;
    await this.supabase.storage.from(this.bucket).remove([path]);
  }

  private validatePdf(file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No se recibió ningún archivo');
    const allowed = ['application/pdf'];
    if (!allowed.includes(file.mimetype))
      throw new BadRequestException('Solo se permiten archivos PDF');
    if (file.size > 10 * 1024 * 1024)
      throw new BadRequestException('El archivo no puede superar 10MB');
  }

  private validateImage(file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No se recibió ningún archivo');
    const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowed.includes(file.mimetype))
      throw new BadRequestException('Solo se permiten imágenes (JPG, PNG) o PDF');
    if (file.size > 5 * 1024 * 1024)
      throw new BadRequestException('El archivo no puede superar 5MB');
  }
}

@Module({
  providers: [ArchivosService],
  exports: [ArchivosService],
})
export class ArchivosModule {}
