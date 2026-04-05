import { Injectable, BadRequestException, NotFoundException, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseStorageService implements OnModuleInit {
  private readonly logger = new Logger(SupabaseStorageService.name);
  private supabase: SupabaseClient | null = null;
  private bucketName: string;

  constructor(private configService: ConfigService) {
    const supabaseUrl = configService.get<string>('SUPABASE_URL');
    const supabaseKey = configService.get<string>('SUPABASE_SERVICE_KEY');
    this.bucketName = configService.get<string>('SUPABASE_STORAGE_BUCKET', 'suministros');

    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey, {
        auth: {
          persistSession: false,
        },
      });
    }
  }

  async onModuleInit() {
    if (!this.supabase) return;
    await this.ensureBucketExists();
  }

  private async ensureBucketExists(): Promise<void> {
    try {
      const { data: buckets, error: listError } = await this.supabase!.storage.listBuckets();
      if (listError) {
        this.logger.warn(`No se pudo listar buckets de Supabase: ${listError.message}`);
        return;
      }
      const exists = buckets?.some((b) => b.name === this.bucketName);
      if (!exists) {
        const { error: createError } = await this.supabase!.storage.createBucket(this.bucketName, {
          public: true,
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'],
          fileSizeLimit: 10 * 1024 * 1024,
        });
        if (createError) {
          this.logger.error(`Error creando bucket "${this.bucketName}": ${createError.message}`);
        } else {
          this.logger.log(`Bucket "${this.bucketName}" creado exitosamente en Supabase Storage.`);
        }
      } else {
        const bucket = buckets.find((b) => b.name === this.bucketName);
        if (bucket && !bucket.public) {
          const { error: updateError } = await this.supabase!.storage.updateBucket(this.bucketName, {
            public: true,
            allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'],
            fileSizeLimit: 10 * 1024 * 1024,
          });
          if (updateError) {
            this.logger.error(`Error actualizando bucket "${this.bucketName}" a público: ${updateError.message}`);
          } else {
            this.logger.log(`Bucket "${this.bucketName}" actualizado a público en Supabase Storage.`);
          }
        } else {
          this.logger.log(`Bucket "${this.bucketName}" verificado en Supabase Storage.`);
        }
      }
    } catch (err) {
      this.logger.warn(`Error verificando bucket Supabase: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  isStorageAvailable(): boolean {
    return this.supabase !== null;
  }

  async uploadBuffer(
    buffer: Buffer,
    folder: string,
    filename: string,
    contentType: string,
  ): Promise<{ url: string; path: string }> {
    if (!this.supabase) {
      throw new BadRequestException('Supabase Storage no está configurado');
    }

    const filePath = `${folder}/${filename}`;

    const { data, error } = await this.supabase.storage
      .from(this.bucketName)
      .upload(filePath, buffer, {
        contentType,
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      throw new BadRequestException(`Error al subir archivo: ${error.message}`);
    }

    const { data: publicUrlData } = this.supabase.storage
      .from(this.bucketName)
      .getPublicUrl(data.path);

    return {
      url: publicUrlData.publicUrl,
      path: data.path,
    };
  }

  private async uploadFile(
    file: Express.Multer.File,
    folder: string,
    baseName: string,
  ): Promise<{ url: string; path: string }> {
    const ext = file.originalname.split('.').pop() ?? 'bin';
    return this.uploadBuffer(file.buffer, folder, `${baseName}.${ext}`, file.mimetype);
  }

  async uploadFirma(file: Express.Multer.File, userId: string) {
    this.validateImage(file);
    return this.uploadFile(file, 'firmas', `firma_${userId}_${Date.now()}`);
  }

  async uploadPresupuesto(file: Express.Multer.File, pedidoId: string) {
    this.validatePdf(file);
    return this.uploadFile(file, 'presupuestos', `presupuesto_${pedidoId}_${Date.now()}`);
  }

  async uploadPresupuestoFirmado(file: Express.Multer.File, pedidoId: string, presupuestoId: string) {
    this.validatePdf(file);
    return this.uploadFile(file, 'presupuestos_firmados', `presupuesto_firmado_${pedidoId}_${presupuestoId}_${Date.now()}`);
  }

  async uploadComprobanteSellado(file: Express.Multer.File, pedidoId: string) {
    this.validatePdf(file);
    return this.uploadFile(file, 'sellados', `sellado_${pedidoId}_${Date.now()}`);
  }

  async uploadFactura(file: Express.Multer.File, pedidoId: string) {
    this.validatePdf(file);
    return this.uploadFile(file, 'facturas', `factura_${pedidoId}_${Date.now()}`);
  }

  async uploadFacturaCompras(file: Express.Multer.File, pedidoId: string) {
    this.validatePdf(file);
    return this.uploadFile(file, 'facturas_compras', `factura_compras_${pedidoId}_${Date.now()}`);
  }

  async uploadReferenciaPedido(file: Express.Multer.File, pedidoId: string, suffix: string) {
    this.validateReferenciaImagen(file);
    return this.uploadFile(file, 'referencias_pedidos', `ref_${pedidoId}_${suffix}`);
  }

  async uploadOrdenCompra(buffer: Buffer, pedidoId: string, ocNumero: string) {
    const safeNumero = ocNumero.replace(/[^a-zA-Z0-9\-]/g, '_');
    return this.uploadBuffer(
      buffer,
      'ordenes_compra',
      `OC_${safeNumero}_${pedidoId}.pdf`,
      'application/pdf',
    );
  }

  async getFile(relativePath: string): Promise<{ buffer: Buffer; mimetype: string }> {
    if (!this.supabase) {
      throw new BadRequestException('Supabase Storage no está configurado');
    }

    const { data, error } = await this.supabase.storage
      .from(this.bucketName)
      .download(relativePath);

    if (error) {
      throw new NotFoundException('Archivo no encontrado');
    }

    const arrayBuffer = await data.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const ext = relativePath.split('.').pop()?.toLowerCase() ?? '';
    const MIME: Record<string, string> = {
      pdf: 'application/pdf',
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      webp: 'image/webp',
      gif: 'image/gif',
    };

    return {
      buffer,
      mimetype: MIME[ext] ?? 'application/octet-stream',
    };
  }

  async deleteFile(relativePath: string): Promise<void> {
    if (!this.supabase) {
      throw new BadRequestException('Supabase Storage no está configurado');
    }

    const { error } = await this.supabase.storage.from(this.bucketName).remove([relativePath]);

    if (error) {
      console.error('Error al eliminar archivo:', error);
    }
  }

  private validatePdf(file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No se recibió ningún archivo');
    if (!['application/pdf'].includes(file.mimetype))
      throw new BadRequestException('Solo se permiten archivos PDF');
    if (file.size > 10 * 1024 * 1024)
      throw new BadRequestException('El archivo no puede superar 10 MB');
  }

  private validateImage(file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No se recibió ningún archivo');
    if (!['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'].includes(file.mimetype))
      throw new BadRequestException('Solo se permiten imágenes (JPG, PNG) o PDF');
    if (file.size > 5 * 1024 * 1024)
      throw new BadRequestException('El archivo no puede superar 5 MB');
  }

  private validateReferenciaImagen(file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No se recibió ningún archivo');
    if (!['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/gif'].includes(file.mimetype))
      throw new BadRequestException('Las referencias solo pueden ser imágenes (JPG, PNG, WebP o GIF)');
    if (file.size > 5 * 1024 * 1024)
      throw new BadRequestException('Cada imagen no puede superar 5 MB');
  }
}
