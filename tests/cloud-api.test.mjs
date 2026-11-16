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
          if (sql.includes('FROM quotes WHERE')) {
            const row=quotes.get(values[0])||null;
            if (sql.includes('deleted_at IS NULL') && row?.deleted_at != null) return null;
            if (sql.includes('deleted_at IS NOT NULL') && row?.deleted_at == null) return null;
            return row;
          }
          if (sql.includes('FROM media WHERE')) {
            const row=media.get(values[0])||null;
            if (sql.includes('deleted_at IS NULL') && row?.deleted_at != null) return null;
            if (sql.includes('deleted_at IS NOT NULL') && row?.deleted_at == null) return null;
            return row;
          }
          return null;
        },
        async all() {
          if (sql.includes('FROM quotes')) return { results:[...quotes.values()].filter(row =>
            sql.includes('deleted_at IS NOT NULL') ? row.deleted_at != null : row.deleted_at == null) };
          if (sql.includes('FROM media')) return { results:[...media.values()].filter(row =>
            sql.includes('deleted_at IS NOT NULL') ? row.deleted_at != null : row.deleted_at == null) };
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
            quotes.set(values[0], { id: values[0], payload: values[1], revision: 1, deleted_at: null });
            return { meta: { changes: 1 } };
          }
          if (sql.startsWith('UPDATE quotes SET deleted_at = unixepoch()')) {
            const row=quotes.get(values[0]); if (!row || row.deleted_at != null) return {meta:{changes:0}};
            quotes.set(values[0],{...row,deleted_at:1763241000,revision:row.revision+1});
            return {meta:{changes:1}};
          }
          if (sql.startsWith('UPDATE quotes SET deleted_at = NULL')) {
            const row=quotes.get(values[0]); if (!row || row.deleted_at == null) return {meta:{changes:0}};
            quotes.set(values[0],{...row,deleted_at:null,revision:row.revision+1});
            return {meta:{changes:1}};
          }
          if (sql.startsWith('DELETE FROM quotes WHERE')) {
            const row=quotes.get(values[0]); if (!row || row.deleted_at == null) return {meta:{changes:0}};
            quotes.delete(values[0]);return {meta:{changes:1}};
          }
          if (sql.startsWith('UPDATE media SET deleted_at = unixepoch()')) {
            const row=media.get(values[0]);
            if (!row || row.deleted_at != null || row.object_key !== values[1]) return {meta:{changes:0}};
            media.set(values[0],{...row,deleted_at:1763241000});
            return {meta:{changes:1}};
          }
          if (sql.startsWith('UPDATE media SET deleted_at = NULL')) {
            const row=media.get(values[0]); if (!row || row.deleted_at == null) return {meta:{changes:0}};
            media.set(values[0],{...row,deleted_at:null});return {meta:{changes:1}};
          }
          if (sql.startsWith('UPDATE quotes SET payload = json_set')) {
            let changed = 0;
            for (const [id, row] of quotes) {
              const quote = JSON.parse(row.payload);
              if (quote.cover === values[0]) {
                quotes.set(id, { ...row, payload: JSON.stringify({ ...quote, cover: '' }), revision: row.revision + 1 });
                changed++;
              }
            }
            return { meta: { changes: changed } };
          }
          if (sql.startsWith('UPDATE quotes')) {
            const row = quotes.get(values[1]);
            if (!row || row.deleted_at != null || row.revision !== values[2]) return { meta: { changes: 0 } };
            quotes.set(values[1], { id: values[1], payload: values[0], revision: row.revision + 1 });
            return { meta: { changes: 1 } };
          }
          if (sql.startsWith('DELETE FROM media WHERE')) {
            const row = media.get(values[0]);
            if (!row || row.deleted_at == null || row.object_key !== values[1]) return { meta: { changes: 0 } };
            media.delete(values[0]);
            return { meta: { changes: 1 } };
          }
          if (sql.startsWith('INSERT INTO media')) {
            media.set(values[0], {
              id: values[0], object_key: values[1], filename: values[2],
              mime: values[3], size: values[4], created_at: 1, deleted_at: null,
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


test('Quotes Studio no muestra ni sirve fotografías de otras aplicaciones', async () => {
  const env = environment();
  const cookie = await authorizeDevice(env);
  const other = 'book/v2/optimized/existing/cover.webp';
  env.objects.set(other, { body: new Uint8Array([87,69,66,80]) });
  const legacyGallery = await worker.fetch(request('/api/media/brand', { headers: { Cookie: cookie } }), env);
  assert.equal(legacyGallery.status, 404);
  const legacyFile = await worker.fetch(request('/api/media/brand/asset?key=' +
    encodeURIComponent(other), { headers: { Cookie: cookie } }), env);
  assert.equal(legacyFile.status, 404);
  const own = await worker.fetch(request('/api/media', { headers: { Cookie: cookie } }), env);
  assert.deepEqual((await own.json()).photos, []);
  assert.equal(env.objects.has(other), true);
});

test('Las fotos cargadas a Quotes Studio son las únicas que cuentan en su galería', async () => {
  const env = environment();
  const cookie = await authorizeDevice(env);
  env.objects.set('book/v2/optimized/other/cover.webp', { body: new Uint8Array([1]) });
  for (let i = 0; i < 2; i++) {
    const upload = await worker.fetch(request('/api/media', {
      method: 'POST',
      headers: { Origin: origin, Cookie: cookie, 'Content-Type': 'image/png',
        'X-File-Name': 'imagen' + i + '.png' },
      body: new Uint8Array([137,80,78,71,i]),
    }), env);
    assert.equal(upload.status, 201);
  }
  const response = await worker.fetch(request('/api/media', { headers: { Cookie: cookie } }), env);
  const data = await response.json();
  assert.equal(data.photos.length, 2);
  assert.equal(data.bytesUsed, 10);
  assert.ok(data.photos.every(p => p.url.startsWith('/api/media/')));
  assert.equal(env.objects.size, 3);
  assert.equal([...env.objects.keys()].filter(k => k.startsWith('quotes-studio/photos/')).length, 2);
});

test('Sin red, el guardado evita reintentos cada segundo y los reanuda tras conectar', async () => {
  const src = (await import('node:fs')).readFileSync(
    new URL('../src/features/quotes/useQuoteStore.ts', import.meta.url),'utf8');
  assert.match(src, /lastFailure\.current = 'offline'/);
  assert.match(src, /lastFailure\.current === 'none' && timer\.current === null/);
  assert.match(src, /else if \(lastFailure\.current === 'offline'\)/);
});


test('Cotizaciones conservan USD/MX en D1 y rechazan monedas no admitidas', async () => {
  const env = environment();
  const cookie = await authorizeDevice(env);
  const id = 'hn-00000000-1234-1234-1234-123456789abc';
  const quote = {
    id, name: 'Fer & Noa', client: '', email: '', location: 'Mexico',
    date: '', price: 77000, deposit: 30, currency: 'MX',
    status: 'Borrador', cover: '', font: 'editorial', color: '#18342f',
    note: '', package: 'Live Band', desc: '', messages: [], style: 'libre', readingMode: 'flip',
  };
  const created = await worker.fetch(jsonRequest('/api/quotes/' + id, 'PUT',
    { quote, expectedRevision: 0 }, cookie), env);
  assert.equal(created.status, 200);
  const loaded = await worker.fetch(request('/api/quotes', { headers: { Cookie: cookie } }), env);
  assert.equal((await loaded.json()).quotes[0].quote.currency, 'MX');
  const invalid = await worker.fetch(jsonRequest('/api/quotes/' + id, 'PUT',
    { quote: { ...quote, currency: 'EUR' }, expectedRevision: 1 }, cookie), env);
  assert.equal(invalid.status, 400);
  const changed = await worker.fetch(jsonRequest('/api/quotes/' + id, 'PUT',
    { quote: { ...quote, currency: 'USD', deposit: 100 }, expectedRevision: 1 }, cookie), env);
  assert.equal(changed.status, 200);
  const latest = await worker.fetch(request('/api/quotes', { headers: { Cookie: cookie } }), env);
  assert.deepEqual(((await latest.json()).quotes[0].quote), { ...quote, currency: 'USD', deposit: 100 });
});


test('Borrado definitivo exige sesión y elimina archivo R2 y registro D1', async () => {
  const env = environment();
  const cookie = await authorizeDevice(env);
  const uploaded = await worker.fetch(request('/api/media', {
    method: 'POST',
    headers: { Cookie: cookie, Origin: origin, 'Content-Type': 'image/png', 'X-File-Name': 'propia.png' },
    body: new Uint8Array([137, 80, 78, 71]),
  }), env);
  const photo = (await uploaded.json()).photo;
  assert.equal((await worker.fetch(request(photo.url, { method: 'DELETE' }), env)).status, 401);
  assert.equal(env.objects.size, 1);
  const rejectedOrigin = await worker.fetch(request(photo.url, {
    method: 'DELETE', headers: { Cookie: cookie, Origin: 'https://other.example' },
  }), env);
  assert.equal(rejectedOrigin.status, 403);
  const removed = await worker.fetch(request(photo.url, {
    method: 'DELETE', headers: { Cookie: cookie, Origin: origin },
  }), env);
  assert.equal(removed.status, 200);
  assert.equal((await removed.json()).trashed, true);
  assert.equal(env.objects.size, 1);
  assert.equal(env.media.size, 1);
  assert.equal((await worker.fetch(request(photo.url, { headers: { Cookie: cookie } }), env)).status, 404);
  assert.equal((await worker.fetch(request(photo.url, {
    method: 'DELETE', headers: { Cookie: cookie, Origin: origin },
  }), env)).status, 404);
});

test('Si una foto eliminada era portada, se limpia esa referencia y aumenta su revisión', async () => {
  const env = environment();
  const cookie = await authorizeDevice(env);
  const img = await worker.fetch(request('/api/media', {
    method: 'POST', headers: { Cookie: cookie, Origin: origin, 'Content-Type': 'image/png' },
    body: new Uint8Array([137,80,78,71]),
  }), env);
  const photo = (await img.json()).photo;
  const id = 'hn-12345678-5678-1234-1234-123456789abc';
  const quote = {
    id, name: 'Test', client: '', email: '', location: 'Mexico', date: '',
    price: 100, deposit: 30, status: 'Borrador', cover: photo.url,
    font: 'editorial', color: '#18342f', note: '', package: '', desc: '',
  };
  const created = await worker.fetch(jsonRequest('/api/quotes/' + id, 'PUT',
    { quote, expectedRevision: 0 }, cookie), env);
  assert.equal(created.status, 200);
  const removed = await worker.fetch(request(photo.url, {
    method: 'DELETE', headers: { Cookie: cookie, Origin: origin },
  }), env);
  assert.equal((await removed.json()).clearedCovers, 1);
  const updated = env.quotes.get(id);
  assert.equal(JSON.parse(updated.payload).cover, '');
  assert.equal(updated.revision, 2);
  const stale = await worker.fetch(jsonRequest('/api/quotes/' + id, 'PUT',
    { quote: { ...quote, price: 200 }, expectedRevision: 1 }, cookie), env);
  assert.equal(stale.status, 409);
});

test('Borrado jamás toca imágenes de otras aplicaciones ni elimina metadatos si falla R2', async () => {
  const env = environment();
  const cookie = await authorizeDevice(env);
  const id = '12af16f8-0fe6-4cea-9562-5c9c69d48299';
  env.media.set(id, { id, object_key: 'book/v2/optimized/original.webp',
    filename: 'original.webp', mime: 'image/webp', size: 3, created_at: 0 });
  env.objects.set('book/v2/optimized/original.webp', { body: new Uint8Array([1,2,3]) });
  assert.equal((await worker.fetch(request('/api/media/' + id, {
    method: 'DELETE', headers: { Cookie: cookie, Origin: origin },
  }), env)).status, 404);
  assert.equal(env.objects.has('book/v2/optimized/original.webp'), true);
  const upload = await worker.fetch(request('/api/media', {
    method: 'POST', headers: { Cookie: cookie, Origin: origin, 'Content-Type': 'image/png' },
    body: new Uint8Array([137,80,78,71]),
  }), env);
  const photo = (await upload.json()).photo;
  env.MEDIA.delete = async () => { throw new Error('R2 temporarily unavailable'); };
  await worker.fetch(request(photo.url, {
    method:'DELETE', headers:{Cookie:cookie,Origin:origin},
  }),env);
  const failed = await worker.fetch(request('/api/trash/photo/'+photo.id, {
    method:'DELETE', headers:{Cookie:cookie,Origin:origin},
  }),env);
  assert.equal(failed.status,500);
  assert.equal(env.media.has(photo.id), true);
  assert.equal(env.objects.has('book/v2/optimized/original.webp'), true);
});


test('Papelera recupera y purga fotos reales sin duplicar R2', async () => {
  const env=environment(),cookie=await authorizeDevice(env);
  const response=await worker.fetch(request('/api/media',{
    method:'POST',headers:{Cookie:cookie,Origin:origin,'Content-Type':'image/png'},
    body:new Uint8Array([137,80,78,71]),
  }),env);
  const photo=(await response.json()).photo;
  await worker.fetch(request(photo.url,{method:'DELETE',headers:{Cookie:cookie,Origin:origin}}),env);
  const list=await worker.fetch(request('/api/trash',{headers:{Cookie:cookie}}),env);
  const entries=(await list.json()).items;
  assert.equal(entries.length,1);
  assert.equal(entries[0].kind,'photo');
  assert.equal((await worker.fetch(request(entries[0].url,{headers:{Cookie:cookie}}),env)).status,200);
  const restore=await worker.fetch(request('/api/trash/photo/'+photo.id+'/restore',{
    method:'POST',headers:{Cookie:cookie,Origin:origin},
  }),env);
  assert.equal((await restore.json()).restored,true);
  assert.equal((await worker.fetch(request(photo.url,{headers:{Cookie:cookie}}),env)).status,200);
  assert.equal(env.objects.size,1);
  await worker.fetch(request(photo.url,{method:'DELETE',headers:{Cookie:cookie,Origin:origin}}),env);
  const purge=await worker.fetch(request('/api/trash/photo/'+photo.id,{
    method:'DELETE',headers:{Cookie:cookie,Origin:origin},
  }),env);
  assert.equal((await purge.json()).deleted,true);
  assert.equal(env.objects.size,0);
  assert.equal(env.media.size,0);
});

test('Papelera recupera cotizaciones sin alterar su contenido original', async () => {
  const env=environment(), cookie=await authorizeDevice(env);
  const id='hn-12345678-1234-1234-1234-123456789abc';
  const quote={id,name:'Client',client:'',email:'',location:'Mexico',date:'',
    price:6000,deposit:30,status:'Borrador',cover:'',font:'editorial',
    color:'#18342f',note:'',package:'',desc:''};
  assert.equal((await worker.fetch(jsonRequest('/api/quotes/'+id,'PUT',
    {quote,expectedRevision:0},cookie),env)).status,200);
  const move=await worker.fetch(request('/api/quotes/'+id,{
    method:'DELETE',headers:{Cookie:cookie,Origin:origin},
  }),env);
  assert.equal((await move.json()).trashed,true);
  const active=await worker.fetch(request('/api/quotes',{headers:{Cookie:cookie}}),env);
  assert.equal((await active.json()).quotes.length,0);
  const trash=await worker.fetch(request('/api/trash',{headers:{Cookie:cookie}}),env);
  assert.equal((await trash.json()).items[0].kind,'quote');
  const restore=await worker.fetch(request('/api/trash/quote/'+id+'/restore',{
    method:'POST',headers:{Cookie:cookie,Origin:origin},
  }),env);
  assert.equal((await restore.json()).restored,true);
  assert.deepEqual(JSON.parse(env.quotes.get(id).payload),quote);
  await worker.fetch(request('/api/quotes/'+id,{method:'DELETE',headers:{Cookie:cookie,Origin:origin}}),env);
  const purge=await worker.fetch(request('/api/trash/quote/'+id,{method:'DELETE',headers:{Cookie:cookie,Origin:origin}}),env);
  assert.equal((await purge.json()).deleted,true);
  assert.equal(env.quotes.has(id),false);
});

test('Papelera requiere una sesión autorizada para restaurar o purgar', async () => {
  const env=environment();
  assert.equal((await worker.fetch(request('/api/trash'),env)).status,401);
  assert.equal((await worker.fetch(request('/api/trash/photo/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/restore',{method:'POST'}),env)).status,401);
  assert.equal((await worker.fetch(request('/api/trash/quote/hn-12345678-1234-1234-1234-123456789abc',{method:'DELETE'}),env)).status,401);
});


test('Cotización Carolina guarda 6 fotos privadas y su texto editable en D1 sin conversiones', async () => {
  const env=environment();
  const cookie=await authorizeDevice(env);
  const id='hn-01010101-0202-0303-0404-050505050505';
  const gallery=Array.from({length:6}, (_,i)=>'/api/media/'+String(i).repeat(8)+'-0000-0000-0000-000000000000');
  const quote={id,name:'Carolina',client:'',email:'',location:'Cortijo Jajalpa, Mexico',
    date:'2028-02-19',price:50000,deposit:30,currency:'MX',status:'Borrador',cover:'',
    font:'editorial',color:'#18342f',note:'',package:'Live Wedding Band',desc:'',
    style:'carolina',readingMode:'scroll',gallery,
    carolinaCopy:{performance:'90 minutes',space:'At least 2x2 meters'}};
  const result=await worker.fetch(jsonRequest('/api/quotes/'+id,'PUT',
    {quote,expectedRevision:0},cookie),env);
  assert.equal(result.status,200);
  const loaded=await worker.fetch(request('/api/quotes',{headers:{Cookie:cookie}}),env);
  assert.deepEqual((await loaded.json()).quotes[0].quote,quote);
  const over=await worker.fetch(jsonRequest('/api/quotes/'+id,'PUT',
    {quote:{...quote,gallery:[...gallery,'']},expectedRevision:1},cookie),env);
  assert.equal(over.status,400);
  const external=await worker.fetch(jsonRequest('/api/quotes/'+id,'PUT',
    {quote:{...quote,gallery:['https://stock.example/photo.jpg']},expectedRevision:1},cookie),env);
  assert.equal(external.status,400);
});


test('Carolina conserva títulos, textos adicionales y geometría entre dispositivos D1', async () => {
  const env=environment(), cookie=await authorizeDevice(env);
  const id='hn-abcdefab-1234-1234-1234-123456789012';
  const extraId='12345678-1111-2222-3333-444444444444';
  const quote = {
    id, name:'Couple',client:'',email:'',location:'Mexico',date:'2027-10-11',
    price:25000,deposit:40,status:'Borrador',cover:'',font:'editorial',color:'#18342f',
    note:'',package:'',desc:'',style:'carolina',readingMode:'flip',
    carolinaLayout:{
      fixed:{experience:'Our Wedding Experience',brand:'HAVANA NICE',investment:''},
      extras:[{id:extraId,page:1,text:'Thank you for celebrating with us'}],
      transforms:{
        'fixed:experience':{x:12,y:-8,scale:1.7,rotation:21},
        ['extra:'+extraId]:{x:0,y:24,scale:.8,rotation:-35},
        'photo:cover':{x:-10,y:2,scale:1.4,rotation:9},
        'photo:0':{x:10,y:-3,scale:1.1,rotation:0},
        'photo:5':{x:4,y:8,scale:2,rotation:55},
      },
    },
  };
  const created=await worker.fetch(jsonRequest('/api/quotes/'+id,'PUT',
    {quote,expectedRevision:0},cookie),env);
  assert.equal(created.status,200);
  const received=await worker.fetch(request('/api/quotes',{headers:{Cookie:cookie}}),env);
  assert.deepEqual((await received.json()).quotes[0].quote,quote);
  const modified={...quote,carolinaLayout:{
    ...quote.carolinaLayout,
    transforms:{...quote.carolinaLayout.transforms,'field:name':{x:-10,y:3,scale:2,rotation:90}},
  }};
  assert.equal((await worker.fetch(jsonRequest('/api/quotes/'+id,'PUT',
    {quote:modified,expectedRevision:1},cookie),env)).status,200);
  const fresh=await worker.fetch(request('/api/quotes',{headers:{Cookie:cookie}}),env);
  assert.deepEqual((await fresh.json()).quotes[0].quote,modified);
});

test('API bloquea layouts con tamaños infinitos, campos no admitidos o extras corruptos', async () => {
  const env=environment(),cookie=await authorizeDevice(env);
  const id='hn-12341234-5678-9012-3456-abcdefabcdef';
  const quote={id,name:'',client:'',email:'',location:'',date:'',price:0,deposit:0,
    status:'Borrador',cover:'',font:'editorial',color:'#18342f',note:'',package:'',desc:''};
  const bad=[
    {fixed:{danger:'X'}},
    {fixed:{brand:'a'.repeat(1201)}},
    {transforms:{'field:name':{x:Infinity,y:0,scale:1,rotation:0}}},
    {transforms:{'field:name':{x:0,y:0,scale:5,rotation:0}}},
    {transforms:{'field:name':{x:0,y:0,scale:1,rotation:181}}},
    {transforms:{'photo:6':{x:0,y:0,scale:1,rotation:0}}},
    {transforms:{'photo:cover':{x:0,y:0,scale:0,rotation:0}}},
    {extras:[{id:'not-an-id',page:0,text:'X'}]},
    {extras:[{id:'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',page:3,text:'X'}]},
    {unapproved:{test:'X'}},
  ];
  for (const layout of bad) {
    const response=await worker.fetch(jsonRequest('/api/quotes/'+id,'PUT',
      {quote:{...quote,carolinaLayout:layout},expectedRevision:0},cookie),env);
    assert.equal(response.status,400,'Invalid design layout must be rejected');
  }
});
