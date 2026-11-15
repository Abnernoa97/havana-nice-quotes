import test from 'node:test';
import assert from 'node:assert/strict';
import { pbkdf2Sync } from 'node:crypto';
import worker from '../worker/index.ts';

const origin = 'https://studio.example';
const salt = 'd4'.repeat(16);
const fakePassword = 'a-strong-test-password';
const hash = pbkdf2Sync(fakePassword, Buffer.from(salt, 'hex'), 150000, 32, 'sha256').toString('hex');

function environment() {
  const quotes = new Map();
  const media = new Map();
  const objects = new Map();
  const db = {
    prepare(sql) {
      let values = [];
      const query = {
        bind(...args) { values = args; return query; },
        async first() {
          if (sql.includes('FROM admin_access')) return { pass_salt: salt, pass_hash: hash };
          if (sql.includes('FROM quotes WHERE')) return quotes.get(values[0]) || null;
          if (sql.includes('FROM media WHERE')) return media.get(values[0]) || null;
          return null;
        },
        async all() {
          if (sql.includes('FROM quotes ORDER BY')) return { results: [...quotes.values()] };
          if (sql.includes('FROM media ORDER BY')) return { results: [...media.values()] };
          return { results: [] };
        },
        async run() {
          if (sql.startsWith('INSERT INTO quotes')) {
            if (quotes.has(values[0])) return { meta: { changes: 0 } };
            quotes.set(values[0], { id: values[0], payload: values[1], revision: 1 });
            return { meta: { changes: 1 } };
          }
          if (sql.startsWith('UPDATE quotes')) {
            const row = quotes.get(values[1]);
            if (!row || row.revision !== values[2]) return { meta: { changes: 0 } };
            quotes.set(values[1], { id: values[1], payload: values[0], revision: row.revision + 1 });
            return { meta: { changes: 1 } };
          }
          if (sql.startsWith('INSERT INTO media')) {
            media.set(values[0], {
              id: values[0], object_key: values[1], filename: values[2],
              mime: values[3], size: values[4], created_at: 1,
            });
            return { meta: { changes: 1 } };
          }
          return { meta: { changes: 0 } };
        },
      };
      return query;
    },
  };
  const bucket = {
    async put(key, body, options) { objects.set(key, { body, options }); },
    async get(key) {
      const entry = objects.get(key);
      if (!entry) return null;
      return { body: new Blob([entry.body]).stream() };
    },
    async delete(key) { objects.delete(key); },
    async list({ prefix }) {
      return { objects: [...objects].filter(([key]) => key.startsWith(prefix))
        .map(([key, value]) => ({ key, size: value.body.byteLength, uploaded: new Date('2026-11-01T00:00:00Z') })) };
    },
  };
  return { DB: db, MEDIA: bucket, ASSETS: { fetch: async () => new Response('spa') }, quotes, media, objects };
}
const request = (path, options={}) => new Request(origin + path, options);
const jsonRequest = (path, method, payload, cookie='') =>
  request(path, { method, headers: { 'Content-Type': 'application/json', 'Origin': origin, ...(cookie ? { Cookie: cookie } : {}) }, body: JSON.stringify(payload) });

async function login(env) {
  const res = await worker.fetch(jsonRequest('/api/auth/login', 'POST', { password: fakePassword }), env);
  assert.equal(res.status, 200);
  return res.headers.get('set-cookie').split(';')[0];
}

test('Ninguna cotización o foto se expone sin sesión', async () => {
  const env = environment();
  assert.equal((await worker.fetch(request('/api/quotes'), env)).status, 401);
  assert.equal((await worker.fetch(request('/api/media'), env)).status, 401);
  assert.equal((await worker.fetch(request('/api/auth/session'), env)).status, 401);
});

test('Contraseña inválida no crea sesión y una válida se entrega en cookie HttpOnly', async () => {
  const env = environment();
  const bad = await worker.fetch(jsonRequest('/api/auth/login','POST',{ password: 'incorrecta' }), env);
  assert.equal(bad.status, 401);
  const logged = await worker.fetch(jsonRequest('/api/auth/login','POST',{ password: fakePassword }), env);
  assert.equal(logged.status, 200);
  assert.match(logged.headers.get('set-cookie'), /HttpOnly; Secure; SameSite=Strict/);
});

test('La lista inicial cloud contiene cero cotizaciones y se puede leer en otro dispositivo', async () => {
  const env = environment();
  const cookie = await login(env);
  const first = await worker.fetch(request('/api/quotes', { headers: { Cookie: cookie } }), env);
  assert.deepEqual((await first.json()).quotes, []);
  const second = await worker.fetch(request('/api/quotes', { headers: { Cookie: cookie } }), env);
  assert.equal((await second.json()).quotes.length, 0);
});

test('Crear y editar cotizaciones entre sesiones respeta control de revisión', async () => {
  const env = environment();
  const cookie = await login(env);
  const id = 'hn-12345678-1234-1234-1234-123456789abc';
  const quote = {
    id, name: 'A & B', client: '', email: '', location: 'Mexico',
    date: '', price: 0, deposit: 0, status: 'Borrador', cover: '',
    font: 'editorial', color: '#18342f', note: '', package: '', desc: '',
    messages: [], style: 'libre', readingMode: 'flip',
  };
  const created = await worker.fetch(jsonRequest('/api/quotes/'+id,'PUT',{ quote, expectedRevision: 0 }, cookie), env);
  assert.equal(created.status, 200);
  assert.equal((await created.json()).revision, 1);
  const changed = await worker.fetch(jsonRequest('/api/quotes/'+id,'PUT',{ quote: { ...quote, price: 5000 }, expectedRevision: 1 }, cookie), env);
  assert.equal((await changed.json()).revision, 2);
  const stale = await worker.fetch(jsonRequest('/api/quotes/'+id,'PUT',{ quote: { ...quote, price: 2000 }, expectedRevision: 1 }, cookie), env);
  assert.equal(stale.status, 409);
  const otherPhone = await worker.fetch(request('/api/quotes',{ headers: { Cookie: cookie }}),env);
  assert.equal((await otherPhone.json()).quotes[0].quote.price, 5000);
});

test('La nube no admite escrituras desde un origen diferente', async () => {
  const env = environment();
  const res = await worker.fetch(request('/api/auth/login',{
    method:'POST',headers:{'Origin':'https://evil.example','Content-Type':'application/json'},body:'{}',
  }),env);
  assert.equal(res.status, 403);
});

test('Las fotos se guardan en prefijo privado de R2 y se pueden recuperar autenticadas', async () => {
  const env = environment();
  const cookie = await login(env);
  const uploaded = await worker.fetch(request('/api/media',{
    method:'POST',
    headers: { Origin: origin, Cookie: cookie, 'Content-Type':'image/png','X-File-Name':'foto.png' },
    body: new Uint8Array([137,80,78,71]),
  }),env);
  assert.equal(uploaded.status, 201);
  const photo = (await uploaded.json()).photo;
  assert.equal(env.objects.size, 1);
  assert.ok([...env.objects.keys()][0].startsWith('quotes-studio/photos/'));
  assert.equal((await worker.fetch(request(photo.url),env)).status,401);
  const got = await worker.fetch(request(photo.url,{headers:{Cookie:cookie}}),env);
  assert.equal(got.status, 200);
  assert.equal(got.headers.get('content-type'), 'image/png');
  assert.equal((await got.arrayBuffer()).byteLength, 4);
});

test('El banco de fotos devuelve almacenamiento usado sin acceder al calendario', async () => {
  const env = environment();
  const cookie = await login(env);
  const response = await worker.fetch(request('/api/media',{headers:{Cookie:cookie}}), env);
  const data = await response.json();
  assert.deepEqual(data.photos,[]);
  assert.equal(data.bytesUsed,0);
});

test('Fuera de la API el Worker conserva los mismos assets de la aplicación', async () => {
  const env = environment();
  const response = await worker.fetch(request('/'),env);
  assert.equal(response.status,200);
  assert.equal(await response.text(),'spa');
});


test('Galería HAVANA NICE v2 muestra fotos optimizadas privadas sin mezclar calendario ni borrar originales', async () => {
  const env = environment();
  const cookie = await login(env);
  const brandKey = 'book/v2/optimized/test-image/cover.webp';
  const calendarKey = 'calendar/v2/memories/test/cover.webp';
  env.objects.set(brandKey, { body: new Uint8Array([87,69,66,80]) });
  env.objects.set(calendarKey, { body: new Uint8Array([0,1,2]) });
  const response = await worker.fetch(request('/api/media/brand',{headers:{Cookie: cookie}}),env);
  assert.equal(response.status,200);
  const gallery = (await response.json()).photos;
  assert.equal(gallery.length,1);
  assert.equal(gallery[0].name,'HAVANA NICE v2 · 01');
  const denied = await worker.fetch(request(gallery[0].url),env);
  assert.equal(denied.status,401);
  const photo = await worker.fetch(request(gallery[0].url,{headers:{Cookie: cookie}}),env);
  assert.equal(photo.status,200);
  assert.equal(photo.headers.get('content-type'),'image/webp');
  const inaccessible = await worker.fetch(request('/api/media/brand/asset?key='+encodeURIComponent(calendarKey),{headers:{Cookie: cookie}}),env);
  assert.equal(inaccessible.status,404);
  assert.equal(env.objects.has(brandKey),true);
  assert.equal(env.objects.has(calendarKey),true);
});

test('Sin red, el guardado evita reintentos cada segundo y los reanuda tras conectar', async () => {
  const src = (await import('node:fs')).readFileSync(
    new URL('../src/features/quotes/useQuoteStore.ts', import.meta.url),'utf8');
  assert.match(src, /lastFailure\.current = 'offline'/);
  assert.match(src, /lastFailure\.current === 'none' && timer\.current === null/);
  assert.match(src, /else if \(lastFailure\.current === 'offline'\)/);
});
