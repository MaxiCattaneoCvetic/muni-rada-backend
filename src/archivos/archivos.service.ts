import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Module,
  Controller,
  Get,
  Param,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';

// ── SERVICE ───────────────────────────────────────────────────────────

@Injectable()
export class ArchivosService {
  /** Carpeta raíz donde se guardan los archivos. En Railway: montar un Volume aquí. */
  private readonly uploadsDir: string;
  /** URL base del backend, usada para construir las URLs públicas de los archivos. */
  private readonly appUrl: string;

  constructor(private configService: ConfigService) {
    this.uploadsDir = configService.get<string>('UPLOADS_DIR', './uploads');
    this.appUrl = configService.get<string>('APP_URL', 'http://localhost:3000');

    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  /** Siempre disponible — el filesystem siempre está presente. */
  isStorageAvailable(): boolean {
    return true;
  }

  private buildUrl(relativePath: string): string {
    return `${this.appUrl.replace(/\/$/, '')}/api/archivos/${relativePath}`;
  }

  /** Sube un buffer a la carpeta `folder` con el nombre `filename`. */
  async uploadBuffer(
    buffer: Buffer,
    folder: string,
    filename: string,
    _contentType: string,
  ): Promise<{ url: string; path: string }> {
    const folderPath = path.join(this.uploadsDir, folder);
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
    const filePath = path.join(folderPath, filename);
    fs.writeFileSync(filePath, buffer);
    const relativePath = `${folder}/${filename}`;
    return { url: this.buildUrl(relativePath), path: relativePath };
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

  /** Devuelve el buffer y el mimetype de un archivo almacenado. */
  async getFile(relativePath: string): Promise<{ buffer: Buffer; mimetype: string }> {
    const safe = path.normalize(relativePath).replace(/^(\.\.(\/|\\|$))+/, '');
    const filePath = path.join(this.uploadsDir, safe);
    if (!fs.existsSync(filePath)) throw new NotFoundException('Archivo no encontrado');

    const ext = path.extname(filePath).toLowerCase();
    const MIME: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.webp': 'image/webp',
      '.gif': 'image/gif',
    };
    return { buffer: fs.readFileSync(filePath), mimetype: MIME[ext] ?? 'application/octet-stream' };
  }

  async deleteFile(relativePath: string): Promise<void> {
    const safe = path.normalize(relativePath).replace(/^(\.\.(\/|\\|$))+/, '');
    const filePath = path.join(this.uploadsDir, safe);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }

  // ── Validaciones ──────────────────────────────────────────────────

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

// ── CONTROLLER (sirve los archivos públicamente) ──────────────────────

@Controller('archivos')
export class ArchivosController {
  constructor(private readonly archivosService: ArchivosService) {}

  /**
   * GET /api/archivos/firmas/firma_xxx.png
   * Sirve cualquier archivo almacenado en el filesystem.
   * No requiere autenticación para que las URLs embebidas en PDFs y vistas funcionen.
   */
  @Get('*')
  async serveFile(@Param('0') filePath: string, @Res() res: Response) {
    const { buffer, mimetype } = await this.archivosService.getFile(filePath);
    res.setHeader('Content-Type', mimetype);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.send(buffer);
  }
}

// ── MODULE ────────────────────────────────────────────────────────────

@Module({
  providers: [ArchivosService],
  controllers: [ArchivosController],
  exports: [ArchivosService],
})
export class ArchivosModule {}
