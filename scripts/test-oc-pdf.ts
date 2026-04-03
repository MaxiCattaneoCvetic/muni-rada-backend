/**
 * Script de prueba — genera un PDF de Orden de Compra idéntico al de referencia.
 *
 * Ejecutar:  npx ts-node scripts/test-oc-pdf.ts
 */
import PDFDocument = require('pdfkit');
import * as fs from 'fs';
import * as path from 'path';

const LOGO_PATH = path.join(__dirname, '..', 'assets', 'logo_municipalidad.png');
const OUTPUT_PATH = path.join(__dirname, '..', 'test-oc.pdf');

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

// ── Mock data (idéntico al PDF de referencia) ──────────────────────
const ocNumero = 'OC-00208-2026';
const nombreMunicipalidad = 'Municipalidad de Rada Tilly';
const cuitInstitucional = '30-99929871-7';
const destino = 'Secretaría Obras Públicas';
const now = new Date(2026, 2, 24); // 24 de marzo de 2026

const provNombre = 'PROVISION SERVICES WORK SHOP';
const provRazonSocial = 'SEGURIDAD E HIGIENE INTEGRAL S.R.L. EN FORMACION';
const provCuit = '30719485300';
const provDireccion = 'MANUELA PEDRAZA Nº 3465';
const provTelefono = '2995964388';

const items = [
  { descripcion: 'BOTA PETROLERA Nº 43', cantidad: '5', unidad: 'UNIDAD' },
  { descripcion: 'BOTA PETROLERA Nº 41', cantidad: '3', unidad: 'UNIDAD' },
  { descripcion: 'BOTA PETROLERA Nº 40', cantidad: '2', unidad: 'UNIDAD' },
  { descripcion: 'BOTA PETROLERA Nº 42', cantidad: '6', unidad: 'UNIDAD' },
];

const montoTotal = 1743637.00;

const firmante = { nombre: 'CECILIA', apellido: 'BAZTAN' };
const cargoFirmante = 'SECRETARIA DE OBRAS\nPUBLICAS';

// ── Build PDF ───────────────────────────────────────────────────────
const doc = new PDFDocument({
  size: 'A4',
  margins: { top: 40, bottom: 40, left: 50, right: 50 },
  info: {
    Title: `Orden de Compra ${ocNumero}`,
    Author: nombreMunicipalidad,
  },
});

const stream = fs.createWriteStream(OUTPUT_PATH);
doc.pipe(stream);

const pageW = doc.page.width;   // ~595
const mL = 50;
const mR = 50;
const cW = pageW - mL - mR;     // ~495

// ── 1. LOGO + ENCABEZADO INSTITUCIONAL (centrado) ──────────────
let y = 35;
if (fs.existsSync(LOGO_PATH)) {
  const logoW = 160;
  doc.image(LOGO_PATH, (pageW - logoW) / 2, y, { width: logoW });
  y += 62;
}

doc.fontSize(12).font('Helvetica-Bold').fillColor('#000000')
  .text(nombreMunicipalidad, mL, y, { width: cW, align: 'center' });
y += 16;

doc.fontSize(8).font('Helvetica').fillColor('#000000')
  .text('Calle 25 de Mayo 588, Rada Tilly CP 9001 Chubut', mL, y, { width: cW, align: 'center' });
y += 22;

// ── 2. FILA DE TÍTULO ──────────────────────────────────────────
const fechaLarga = `Fecha: ${now.getDate()} de ${MESES_ES[now.getMonth()]} de ${now.getFullYear()}`;

doc.fontSize(10).font('Helvetica-Bold').fillColor('#000000')
  .text(ocNumero, mL, y, { width: cW / 3, align: 'left' });
doc.fontSize(16).font('Helvetica-Bold')
  .text('Orden de Compra', mL, y - 3, { width: cW, align: 'center' });
doc.fontSize(9).font('Helvetica')
  .text(fechaLarga, mL + (cW * 2 / 3), y + 2, { width: cW / 3, align: 'right' });
y += 24;

// ── Línea separadora ───────────────────────────────────────────
doc.moveTo(mL, y).lineTo(pageW - mR, y)
  .lineWidth(0.8).strokeColor('#000000').stroke();
y += 14;

// ── 3. INFORMACIÓN GENERAL ─────────────────────────────────────
doc.fontSize(11).font('Helvetica-Bold').fillColor('#000000')
  .text('Información General', mL, y);
y += 18;

doc.fontSize(9.5).font('Helvetica-Bold').text('CUIT Municipalidad: ', mL, y, { continued: true });
doc.font('Helvetica').text(`${cuitInstitucional} IVA Exento`);
y += 15;

doc.fontSize(9.5).font('Helvetica-Bold').text('Destino: ', mL, y, { continued: true });
doc.font('Helvetica').text(destino);
y += 20;

// ── 4. DATOS DEL PROVEEDOR ─────────────────────────────────────
doc.fontSize(11).font('Helvetica-Bold')
  .text('Datos del Proveedor', mL, y);
y += 16;

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

// ── 5. TABLA DE ITEMS ──────────────────────────────────────────
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

// ── 6. MONTO TOTAL ─────────────────────────────────────────────
const montoText = `Monto Total: $${montoTotal.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const totalBoxW = 220;
const totalBoxH = 24;
const totalBoxX = pageW - mR - totalBoxW;

doc.rect(totalBoxX, y, totalBoxW, totalBoxH).lineWidth(0.5).strokeColor('#000000').stroke();
doc.fontSize(10).font('Helvetica-Bold').fillColor('#000000')
  .text(montoText, totalBoxX + 6, y + 6, { width: totalBoxW - 12, align: 'right' });
y += totalBoxH + 16;

// ── 7. TEXTO LEGAL ─────────────────────────────────────────────
doc.fontSize(7);
const legalH = doc.heightOfString(LEGAL_TEXT, { width: cW - 16 }) + 14;
doc.rect(mL, y, cW, legalH).lineWidth(0.5).strokeColor('#000000').stroke();
doc.fontSize(7).font('Helvetica').fillColor('#000000')
  .text(LEGAL_TEXT, mL + 8, y + 7, { width: cW - 16 });
y += legalH + 50;

// ── 8. FIRMA ───────────────────────────────────────────────────
// (no tenemos imagen de firma en el test, solo nombre y cargo)

const firmaNombre = `${firmante.nombre} ${firmante.apellido}`;
doc.fontSize(10).font('Helvetica-Bold').fillColor('#000000')
  .text(firmaNombre, mL, y, { width: cW, align: 'center' });
y += 14;

doc.fontSize(9).font('Helvetica')
  .text(cargoFirmante, mL, y, { width: cW, align: 'center' });

doc.end();

stream.on('finish', () => {
  console.log(`✅ PDF generado: ${OUTPUT_PATH}`);
  console.log(`   Tamaño: ${(fs.statSync(OUTPUT_PATH).size / 1024).toFixed(1)} KB`);
});
