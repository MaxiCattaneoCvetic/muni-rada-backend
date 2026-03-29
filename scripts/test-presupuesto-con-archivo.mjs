/**
 * Crea un presupuesto con campo archivo (multipart). Sin Supabase, el API debe
 * guardar igual los datos y omitir el PDF (201 + presupuesto sin archivoUrl).
 *
 * Requiere: backend en ejecución, DEMO_MODE + seed (pedido en etapa presupuestos).
 *
 *   node scripts/test-presupuesto-con-archivo.mjs
 *   node scripts/test-presupuesto-con-archivo.mjs http://localhost:3000
 */
const base = (process.argv[2] || 'http://localhost:3000').replace(/\/$/, '') + '/api';

const login = await fetch(`${base}/auth/demo`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ rol: 'compras' }),
});
if (!login.ok) {
  console.error('Login demo falló', login.status, await login.text());
  process.exit(1);
}
const { accessToken } = await login.json();

const pedidos = await fetch(`${base}/pedidos`, {
  headers: { Authorization: `Bearer ${accessToken}` },
}).then((r) => r.json());

const p2 = pedidos.find((p) => p.stage === 2);
if (!p2) {
  console.error('No hay pedidos en etapa 2 (presupuestos). Ejecutá seed.');
  process.exit(1);
}

const boundary = '----testBoundary' + Date.now();
const body =
  `--${boundary}\r\n` +
  `Content-Disposition: form-data; name="proveedor"\r\n\r\n` +
  `Proveedor script test\r\n` +
  `--${boundary}\r\n` +
  `Content-Disposition: form-data; name="monto"\r\n\r\n` +
  `999.99\r\n` +
  `--${boundary}\r\n` +
  `Content-Disposition: form-data; name="archivo"; filename="dummy.pdf"\r\n` +
  `Content-Type: application/pdf\r\n\r\n` +
  `%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\r\n` +
  `--${boundary}--\r\n`;

const res = await fetch(`${base}/pedidos/${p2.id}/presupuestos`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': `multipart/form-data; boundary=${boundary}`,
  },
  body,
});

const text = await res.text();
let data;
try {
  data = JSON.parse(text);
} catch {
  data = text;
}

if (!res.ok) {
  console.error('FAIL HTTP', res.status, data);
  process.exit(1);
}

const tieneAdjunto = !!(data.archivoUrl || data.archivo_url);
console.log('OK 201 presupuesto creado:', data.id || data, tieneAdjunto ? '(con URL archivo)' : '(sin URL — esperado sin Supabase)');
