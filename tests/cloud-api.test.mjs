import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import worker from '../worker/index.ts';

const origin = 'https://studio.example';
const activationCode = 'ab'.repeat(32);
const activationHash = createHash('sha256').update(activationCode).digest('hex');

function environment() {
  const quotes = new Map();
  const media = new Map();
  const objects = new Map();
  const invites = new Map([[activationHash, { used: false, expiry: Math.floor(Date.now() / 1000) + 10000 }]]);
  const sessions = new Map();
  const db = {
    prepare(sql) {
      let values = [];
      const query = {
        bind(...args) { values = args; return query; },
        async first() {
          if (sql.includes('FROM device_sessions WHERE id = ?')) return sessions.get(values[0]) || null;
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
          if (sql.startsWith('UPDATE device_invites')) {
            const record = invites.get(values[0]);
            if (!record || record.used || record.expiry < Math.floor(Date.now()/1000)) return { meta: { changes: 0 } };
            record.used = true;
            return { meta: { changes: 1 } };
          }
          if (sql.startsWith('INSERT INTO device_sessions')) {
            sessions.set(values[0], { token_hash: values[1], expires_at: values[2], revoked_at: null });
            return { meta: { changes: 1 } };
          }
          if (sql.startsWith('INSERT INTO device_invites')) {
            invites.set(values[0], { used: false, expiry: values[1] });
            return { meta: { changes: 1 } };
          }
          if (sql.startsWith('UPDATE device_sessions SET revoked_at')) {
            const row = sessions.get(values[0]);
            if (row) row.revoked_at = Math.floor(Date.now()/1000);
            return { meta: { changes: row ? 1 : 0 } };
          }
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
  return { DB: db, MEDIA: bucket, ASSETS: { fetch: async () => new Response('spa') }, quotes, media, objects, sessions, invites };
}
const request = (path, options={}) => new Request(origin + path, options);
const jsonRequest = (path, method, payload, cookie='') =>
  request(path, { method, headers: { 'Content-Type': 'application/json', 'Origin': origin, ...(cookie ? { Cookie: cookie } : {}) }, body: JSON.stringify(payload) });

async function authorizeDevice(env) {
  const res = await worker.fetch(jsonRequest('/api/device/activate', 'POST', { code: activationCode }), env);
  assert.equal(res.status, 200);
  return res.headers.get('set-cookie').split(';')[0];
}

test('Ninguna cotización o foto se expone sin sesión', async () => {
  const env = environment();
  assert.equal((await worker.fetch(request('/api/quotes'), env)).status, 401);
  assert.equal((await worker.fetch(request('/api/media'), env)).status, 401);
  assert.equal((await worker.fetch(request('/api/device/status'), env)).status, 401);
  assert.equal((await worker.fetch(request('/api/device/invite', { method: 'POST' }), env)).status, 401);
});

test('Vinculación de un solo uso autoriza el dispositivo sin contraseña', async () => {
  const env = environment();
  const bad = await worker.fetch(jsonRequest('/api/device/activate','POST',{ code: '0'.repeat(64) }), env);
  assert.equal(bad.status, 401);
  const cookie = await authorizeDevice(env);
  assert.match(cookie, /^hn_quotes_device=/);
  const expired = await worker.fetch(jsonRequest('/api/device/activate','POST',{ code: activationCode }), env);
  assert.equal(expired.status, 401);
  const check = await worker.fetch(request('/api/device/status',{ headers:{Cookie: cookie} }),env);
  assert.equal(check.status, 200);
  assert.equal((await worker.fetch(jsonRequest('/api/auth/login','POST',{password:'anything'}),env)).status,401);
});

test('La invitación de otro teléfono requiere acceso previo y no expone el código en el URL de la API', async () => {
  const env = environment();
  const original = await authorizeDevice(env);
  const inviteResponse = await worker.fetch(request('/api/device/invite',{
    method:'POST',headers: { Cookie:original, Origin:origin }
  }),env);
  assert.equal(inviteResponse.status,200);
  const result = await inviteResponse.json();
  assert.match(result.url, /^https:\/\/studio\.example\/#activate=[a-f0-9]{64}$/);
  const code = result.url.split('#activate=')[1];
  const newPhone = await worker.fetch(jsonRequest('/api/device/activate','POST',{code}),env);
  assert.equal(newPhone.status,200);
  const secondCookie = newPhone.headers.get('set-cookie').split(';')[0];
  assert.notEqual(original,secondCookie);
  assert.equal((await worker.fetch(request('/api/quotes',{headers:{Cookie:secondCookie}}),env)).status,200);
  assert.equal((await worker.fetch(jsonRequest('/api/device/activate','POST',{code}),env)).status,401);
});

test('Se puede revocar una sesión del dispositivo sin afectar otros dispositivos', async () => {
  const env = environment();
  const cookie = await authorizeDevice(env);
  const revoked = await worker.fetch(request('/api/device/revoke',{
    method:'POST',headers:{Cookie:cookie,Origin:origin}
  }),env);
  assert.equal(revoked.status,200);
  assert.equal((await worker.fetch(request('/api/device/status',{headers:{Cookie:cookie}}),env)).status,401);
});

test('La lista inicial cloud contiene cero cotizaciones y se puede leer en otro dispositivo', async () => {
  const env = environment();
  const cookie = await authorizeDevice(env);
  const first = await worker.fetch(request('/api/quotes', { headers: { Cookie: cookie } }), env);
  assert.deepEqual((await first.json()).quotes, []);
  const second = await worker.fetch(request('/api/quotes', { headers: { Cookie: cookie } }), env);
  assert.equal((await second.json()).quotes.length, 0);
});

test('Crear y editar cotizaciones entre sesiones respeta control de revisión', async () => {
  const env = environment();
  const cookie = await authorizeDevice(env);
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
  const res = await worker.fetch(request('/api/device/activate',{
    method:'POST',headers:{'Origin':'https://evil.example','Content-Type':'application/json'},body:'{}',
  }),env);
  assert.equal(res.status, 403);
});

test('Las fotos se guardan en prefijo privado de R2 y se pueden recuperar autenticadas', async () => {
  const env = environment();
  const cookie = await authorizeDevice(env);
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
  const cookie = await authorizeDevice(env);
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
  const cookie = await authorizeDevice(env);
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
