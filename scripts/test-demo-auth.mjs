/**
 * Prueba POST /api/auth/demo para los 4 roles.
 * Uso: backend corriendo en PORT (default 3000), DEMO_MODE=true y seed ejecutado.
 *
 *   node scripts/test-demo-auth.mjs
 *   node scripts/test-demo-auth.mjs http://localhost:3000
 */
const base = process.argv[2] || 'http://localhost:3000';
const roles = ['secretaria', 'compras', 'tesoreria', 'admin'];
const url = `${base.replace(/\/$/, '')}/api/auth/demo`;

let failed = false;
for (const rol of roles) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rol }),
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  const ok = res.ok && data && typeof data === 'object' && data.accessToken;
  if (ok) {
    console.log(`OK  ${rol} → token ${String(data.accessToken).slice(0, 24)}…`);
  } else {
    failed = true;
    console.error(`FAIL ${rol} HTTP ${res.status}`, data);
  }
}
if (failed) process.exit(1);
console.log('\nTodos los roles respondieron con JWT.');
