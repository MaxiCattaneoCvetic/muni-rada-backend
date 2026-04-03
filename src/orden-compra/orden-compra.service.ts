import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pedido } from '../pedidos/pedido.entity';
import { Presupuesto } from '../presupuestos/presupuesto.entity';
import { Proveedor } from '../proveedores/proveedor.entity';
import { User } from '../users/user.entity';
import { ArchivosService } from '../archivos/archivos.service';
import { ConfigSystemService } from '../config/config.service';
import PDFDocument = require('pdfkit');
import * as path from 'path';
import * as fs from 'fs';
import * as https from 'https';
import * as http from 'http';

export interface OrdenCompraData {
  pedido: Pedido;
  presupuesto: Presupuesto;
  firmante: User;
  proveedor?: Proveedor | null;
}

const MESES_ES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

const LEGAL_TEXT = [
  'LA PRESENTE ORDEN DE COMPRA DEBERÁ SER DEVUELTA A LA OFICINA DE COMPRAS DENTRO DE LOS CINCO DÍAS HÁBILES DE RECIBIDA DEBIDAMENTE SELLADA POR LA DIRECCIÓN GRAL. DE RENTAS, CONJUNTAMENTE CON LA COPIA DEL COMPROBANTE DE PAGO DEL IMPUESTO A LOS SELLOS.',
  'EL PLAZO DE PAGO DE LA FACTURA SE EMPEZARÁ A CONTAR A PARTIR DE LA FECHA DE RECEPCIÓN DE LA DOCUMENTACIÓN REFERIDA EN EL PÁRRAFO ANTERIOR.',
  'CUALQUIER OBJECIÓN A LA PRESENTE DEBERÁ FORMULARSE POR ESCRITO DENTRO DE LAS 48 HORAS DE RECIBIDO.',
  'ESTA ORDEN DEBERÁ SER CUMPLIDA INTEGRAMENTE DENTRO DEL TÉRMINO ESTABLECIDO.',
].join('\n');

@Injectable()
export class OrdenCompraService {
  private readonly logger = new Logger(OrdenCompraService.name);

  constructor(
    @InjectRepository(Pedido)
    private pedidosRepo: Repository<Pedido>,
    @InjectRepository(Proveedor)
    private proveedoresRepo: Repository<Proveedor>,
    private archivosService: ArchivosService,
    private configService: ConfigSystemService,
  ) {}

  async generateAndUpload(data: OrdenCompraData): Promise<{ url: string; path: string; numero: string }> {
    const ocNumero = await this.generateOcNumero();
    const config = await this.configService.getConfig();

    let proveedorData = data.proveedor;
    if (!proveedorData && data.presupuesto.cuit) {
      proveedorData = await this.proveedoresRepo.findOne({
        where: { cuit: data.presupuesto.cuit },
      });
    }

    const pdfBuffer = await this.buildPdf({
      ...data,
      proveedor: proveedorData,
      ocNumero,
      nombreMunicipalidad: config.nombreMunicipalidad,
      cuitInstitucional: config.cuitInstitucional || '',
    });

    if (!this.archivosService.isStorageAvailable()) {
      this.logger.warn('Storage no disponible — OC generada pero no subida');
      return { url: '', path: '', numero: ocNumero };
    }

    const result = await this.archivosService.uploadOrdenCompra(pdfBuffer, data.pedido.id, ocNumero);
    return { ...result, numero: ocNumero };
  }

  private async generateOcNumero(): Promise<string> {
    const year = new Date().getFullYear();
    const countThisYear = await this.pedidosRepo
      .createQueryBuilder('p')
      .where('p.orden_compra_numero IS NOT NULL')
      .andWhere("p.orden_compra_numero LIKE :pattern", { pattern: `%-${year}` })
      .getCount();
    const seq = countThisYear + 1;
    return `OC-${String(seq).padStart(5, '0')}-${year}`;
  }

  // ═══════════════════════════════════════════════════════════════════
  //  PDF BUILDER — replica exacta del formato de referencia
  // ═══════════════════════════════════════════════════════════════════

  private async buildPdf(params: OrdenCompraData & {
    ocNumero: string;
    nombreMunicipalidad: string;
    cuitInstitucional: string;
  }): Promise<Buffer> {
    const { pedido, presupuesto, firmante, proveedor, ocNumero, nombreMunicipalidad, cuitInstitucional } = params;
    const now = new Date();

    return new Promise(async (resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margins: { top: 40, bottom: 40, left: 50, right: 50 },
          info: {
            Title: `Orden de Compra ${ocNumero}`,
            Author: nombreMunicipalidad,
            Subject: `OC para pedido ${pedido.numero}`,
          },
        });

        const chunks: Buffer[] = [];
        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        const pageW = doc.page.width;   // ~595
        const mL = 50;
        const mR = 50;
        const cW = pageW - mL - mR;     // ~495

        // ── 1. LOGO + ENCABEZADO INSTITUCIONAL (centrado) ──────────
        const logoPath = path.join(__dirname, '..', '..', 'assets', 'logo_municipalidad.png');
        let y = 35;
        if (fs.existsSync(logoPath)) {
          const logoW = 160;
          doc.image(logoPath, (pageW - logoW) / 2, y, { width: logoW });
          y += 62;
        }

        doc.fontSize(12).font('Helvetica-Bold').fillColor('#000000')
          .text(nombreMunicipalidad, mL, y, { width: cW, align: 'center' });
        y += 16;

        doc.fontSize(8).font('Helvetica').fillColor('#000000')
          .text('Calle 25 de Mayo 588, Rada Tilly CP 9001 Chubut', mL, y, { width: cW, align: 'center' });
        y += 22;

        // ── 2. FILA DE TÍTULO: OC nro | "Orden de Compra" | Fecha ──
        const fechaLarga = `Fecha: ${now.getDate()} de ${MESES_ES[now.getMonth()]} de ${now.getFullYear()}`;

        doc.fontSize(10).font('Helvetica-Bold').fillColor('#000000')
          .text(ocNumero, mL, y, { width: cW / 3, align: 'left' });
        doc.fontSize(16).font('Helvetica-Bold')
          .text('Orden de Compra', mL, y - 3, { width: cW, align: 'center' });
        doc.fontSize(9).font('Helvetica')
          .text(fechaLarga, mL + (cW * 2 / 3), y + 2, { width: cW / 3, align: 'right' });
        y += 24;

        // ── Línea separadora ────────────────────────────────────────
        doc.moveTo(mL, y).lineTo(pageW - mR, y)
          .lineWidth(0.8).strokeColor('#000000').stroke();
        y += 14;

        // ── 3. INFORMACIÓN GENERAL ──────────────────────────────────
        doc.fontSize(11).font('Helvetica-Bold').fillColor('#000000')
          .text('Información General', mL, y);
        y += 18;

        const cuitText = cuitInstitucional ? `${cuitInstitucional} IVA Exento` : '—';
        doc.fontSize(9.5).font('Helvetica-Bold').text('CUIT Municipalidad: ', mL, y, { continued: true });
        doc.font('Helvetica').text(cuitText);
        y += 15;

        const destino = pedido.areaDestino || pedido.area || '—';
        doc.fontSize(9.5).font('Helvetica-Bold').text('Destino: ', mL, y, { continued: true });
        doc.font('Helvetica').text(String(destino));
        y += 20;

        // ── 4. DATOS DEL PROVEEDOR ──────────────────────────────────
        doc.fontSize(11).font('Helvetica-Bold')
          .text('Datos del Proveedor', mL, y);
        y += 16;

        const provNombre = proveedor?.nombreFantasia || presupuesto.proveedor || pedido.proveedorSeleccionado || '—';
        const provRazonSocial = proveedor?.nombre || presupuesto.proveedor || '—';
        const provCuit = proveedor?.cuit || presupuesto.cuit || '—';
        const provDireccion = proveedor
          ? [proveedor.domicilioCalle, proveedor.localidad, proveedor.provincia].filter(Boolean).join(', ')
          : '—';
        const provTelefono = proveedor?.telefono || presupuesto.contacto || '—';

        const boxX = mL;
        const boxW = cW;
        const labelCol1W = 75;
        const labelCol2W = 65;
        const colMid = boxX + boxW * 0.58;
        const valCol1X = boxX + 6 + labelCol1W;
        const valCol1W = colMid - valCol1X - 4;
        const valCol2X = colMid + labelCol2W;
        const valCol2W = boxX + boxW - valCol2X - 6;

        doc.fontSize(8.5);
        const rsHeight = doc.heightOfString(provRazonSocial, { width: valCol1W });
        const boxRowH = Math.max(16, rsHeight + 4);
        const boxH = boxRowH * 3 + 10;

        doc.rect(boxX, y, boxW, boxH).lineWidth(0.5).strokeColor('#000000').stroke();

        let ry = y + 5;

        doc.font('Helvetica-Bold').text('Nombre:', boxX + 6, ry);
        doc.font('Helvetica').text(provNombre, valCol1X, ry, { width: valCol1W });
        doc.font('Helvetica-Bold').text('Dirección:', colMid, ry);
        doc.font('Helvetica').text(provDireccion, valCol2X, ry, { width: valCol2W });
        ry += boxRowH;

        doc.font('Helvetica-Bold').text('Razón Social:', boxX + 6, ry);
        doc.font('Helvetica').text(provRazonSocial, valCol1X, ry, { width: valCol1W });
        doc.font('Helvetica-Bold').text('Teléfono:', colMid, ry);
        doc.font('Helvetica').text(provTelefono, valCol2X, ry, { width: valCol2W });
        ry += boxRowH;

        doc.font('Helvetica-Bold').text('CUIT:', boxX + 6, ry);
        doc.font('Helvetica').text(provCuit, valCol1X, ry);

        y += boxH + 16;

        // ── 5. TABLA DE ITEMS ───────────────────────────────────────
        const items = this.parseItems(pedido);
        doc.fontSize(11).font('Helvetica-Bold')
          .text(`Items Solicitados (${items.length})`, mL, y);
        y += 18;

        const colItem = mL;
        const colItemW = 45;
        const colDescW = cW - colItemW - 55 - 65;
        const colCantX = mL + colItemW + colDescW;
        const colCantW = 55;
        const colUnidX = colCantX + colCantW;
        const colUnidW = 65;
        const tableW = cW;
        const headerH = 22;
        const rowH = 22;

        // Table header
        doc.rect(colItem, y, tableW, headerH).lineWidth(0.5).strokeColor('#000000').stroke();
        doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#000000');
        doc.text('Item', colItem + 4, y + 6, { width: colItemW - 8, align: 'center' });
        doc.text('Descripción', colItem + colItemW + 4, y + 6, { width: colDescW - 8 });
        doc.text('Cant.', colCantX + 4, y + 6, { width: colCantW - 8, align: 'center' });
        doc.text('Unidad', colUnidX + 4, y + 6, { width: colUnidW - 8, align: 'center' });

        // Column separators in header
        doc.moveTo(colItem + colItemW, y).lineTo(colItem + colItemW, y + headerH).stroke();
        doc.moveTo(colCantX, y).lineTo(colCantX, y + headerH).stroke();
        doc.moveTo(colUnidX, y).lineTo(colUnidX, y + headerH).stroke();
        y += headerH;

        // Table rows
        doc.fontSize(8.5).font('Helvetica');
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          doc.rect(colItem, y, tableW, rowH).lineWidth(0.5).strokeColor('#000000').stroke();
          doc.moveTo(colItem + colItemW, y).lineTo(colItem + colItemW, y + rowH).stroke();
          doc.moveTo(colCantX, y).lineTo(colCantX, y + rowH).stroke();
          doc.moveTo(colUnidX, y).lineTo(colUnidX, y + rowH).stroke();

          doc.text(String(i + 1), colItem + 4, y + 6, { width: colItemW - 8, align: 'center' });
          doc.text(item.descripcion, colItem + colItemW + 4, y + 6, { width: colDescW - 8 });
          doc.text(item.cantidad, colCantX + 4, y + 6, { width: colCantW - 8, align: 'center' });
          doc.text(item.unidad, colUnidX + 4, y + 6, { width: colUnidW - 8, align: 'center' });
          y += rowH;
        }

        y += 12;

        // ── 6. MONTO TOTAL ──────────────────────────────────────────
        const monto = Number(presupuesto.monto) || 0;
        const montoText = `Monto Total: $${monto.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        const totalBoxW = 220;
        const totalBoxH = 24;
        const totalBoxX = pageW - mR - totalBoxW;

        doc.rect(totalBoxX, y, totalBoxW, totalBoxH).lineWidth(0.5).strokeColor('#000000').stroke();
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#000000')
          .text(montoText, totalBoxX + 6, y + 6, { width: totalBoxW - 12, align: 'right' });
        y += totalBoxH + 16;

        // ── 7. TEXTO LEGAL ──────────────────────────────────────────
        doc.fontSize(7);
        const legalH = doc.heightOfString(LEGAL_TEXT, { width: cW - 16 }) + 14;
        doc.rect(mL, y, cW, legalH).lineWidth(0.5).strokeColor('#000000').stroke();
        doc.fontSize(7).font('Helvetica').fillColor('#000000')
          .text(LEGAL_TEXT, mL + 8, y + 7, { width: cW - 16 });
        y += legalH + 30;

        // ── 8. FIRMA ────────────────────────────────────────────────
        if (firmante.firmaUrl) {
          try {
            const firmaBuffer = await this.fetchImage(firmante.firmaUrl);
            if (firmaBuffer) {
              const firmaImgW = 120;
              const firmaImgH = 60;
              doc.image(firmaBuffer, (pageW - firmaImgW) / 2, y, {
                fit: [firmaImgW, firmaImgH],
              });
              y += firmaImgH + 6;
            }
          } catch {
            this.logger.warn('No se pudo descargar la firma para el PDF');
          }
        }

        const firmaNombre = `${firmante.nombre} ${firmante.apellido}`.toUpperCase();
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#000000')
          .text(firmaNombre, mL, y, { width: cW, align: 'center' });
        y += 14;

        const destArea = pedido.areaDestino || pedido.area || '';
        const cargoText = destArea ? `SECRETARIA DE ${String(destArea).toUpperCase()}` : 'SECRETARIA';
        doc.fontSize(9).font('Helvetica')
          .text(cargoText, mL, y, { width: cW, align: 'center' });

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Parsea los items del pedido. Si el detalle tiene varias líneas,
   * cada línea se convierte en un item separado.
   */
  private parseItems(pedido: Pedido): { descripcion: string; cantidad: string; unidad: string }[] {
    if (pedido.detalle) {
      const lines = pedido.detalle.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length > 1) {
        return lines.map(line => {
          const match = line.match(/^(.+?)\s*[xX×]\s*(\d+)\s*(.*)$/);
          if (match) {
            return { descripcion: match[1].trim(), cantidad: match[2], unidad: match[3].trim() || 'UNIDAD' };
          }
          return { descripcion: line, cantidad: pedido.cantidad || '1', unidad: 'UNIDAD' };
        });
      }
    }

    return [{
      descripcion: pedido.descripcion + (pedido.detalle ? ` - ${pedido.detalle}` : ''),
      cantidad: pedido.cantidad || '1',
      unidad: 'UNIDAD',
    }];
  }

  private fetchImage(url: string): Promise<Buffer | null> {
    return new Promise((resolve) => {
      const client = url.startsWith('https') ? https : http;
      const req = client.get(url, { timeout: 8000 }, (res) => {
        if (res.statusCode !== 200) { resolve(null); return; }
        const chunks: Buffer[] = [];
        res.on('data', (c: Buffer) => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks)));
        res.on('error', () => resolve(null));
      });
      req.on('error', () => resolve(null));
      req.on('timeout', () => { req.destroy(); resolve(null); });
    });
  }
}
