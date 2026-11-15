/**
 * HAVANA NICE Quotes Studio · Cloudflare Worker
 * Private D1 quotes + media index; private R2 objects in quotes-studio/.
 * No browser credentials, public media URLs, or client-data migration.
 */
interface D1Row { [key: string]: unknown }
interface D1Statement {
  bind(...values: (string | number)[]): D1Statement;
  first<T extends D1Row>(): Promise<T | null>;
  all<T extends D1Row>(): Promise<{ results: T[] }>;
  run(): Promise<{ meta: { changes: number } }>;
}
interface D1Binding { prepare(sql: string): D1Statement }
interface R2Object { body: ReadableStream; httpMetadata?: { contentType?: string }; etag?: string }
interface R2ListingItem { key: string; size: number; uploaded: Date }
interface R2Binding {
  list(options: { prefix: string; limit: number }): Promise<{ objects: R2ListingItem[] }>;
  get(key: string): Promise<R2Object | null>;
  put(key: string, body: ArrayBuffer, opts: { httpMetadata: { contentType: string }; customMetadata: Record<string, string> }): Promise<unknown>;
  delete(key: string): Promise<void>;
}
interface Env {
  DB: D1Binding;
  MEDIA: R2Binding;
  ASSETS: { fetch(request: Request): Promise<Response> };
}
interface AccessRow extends D1Row { pass_salt: string; pass_hash: string }
interface QuoteRow extends D1Row { id: string; payload: string; revision: number }
interface MediaRow extends D1Row { id: string; filename: string; mime: string; size: number; created_at: number; object_key: string }
const PHOTOS_PREFIX = 'quotes-studio/photos/';
const BRAND_PREFIX = 'book/v2/optimized/';
const MAX_IMAGE = 12 * 1024 * 1024;
const COOKIE = 'hn_quotes_session';
const SESSION_LIFETIME = 14 * 24 * 60 * 60;
const VALID_MIMES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/heic': 'heic',
  'image/heif': 'heif',
};
const REQUIRED_FIELDS = [
  'id', 'name', 'client', 'email', 'location', 'date',
  'cover', 'font', 'color', 'note', 'package', 'desc',
];
const VALID_STATES = new Set(['Borrador', 'Enviada', 'En revisión', 'Aceptada']);
const validId = (s: string) => /^hn-[a-f0-9-]{20,64}$/.test(s);
const hexToBytes = (hex: string): Uint8Array => new Uint8Array(
  (hex.match(/.{1,2}/g) || []).map(s => parseInt(s, 16))
);
const bytesToHex = (bytes: Uint8Array): string =>
  Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
const equalHex = (a: string, b: string): boolean => {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
};
const textBytes = (s: string): Uint8Array => new TextEncoder().encode(s);
const b64 = (value: Uint8Array): string =>
  btoa(Array.from(value, x => String.fromCharCode(x)).join(''))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
const signed = async (text: string, hash: string) => {
  const key = await crypto.subtle.importKey(
    'raw', hexToBytes(hash), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  return b64(new Uint8Array(await crypto.subtle.sign('HMAC', key, textBytes(text))));
};
const authRow = async (env: Env): Promise<AccessRow | null> =>
  env.DB.prepare('SELECT pass_salt, pass_hash FROM admin_access WHERE id = 1')
    .first<AccessRow>();
const cookieValue = (request: Request): string | undefined => {
  const cookies = request.headers.get('cookie') || '';
  const found = cookies.split(';').map(x => x.trim()).find(x => x.startsWith(COOKIE + '='));
  return found?.slice(COOKIE.length + 1);
};
async function authorized(request: Request, env: Env): Promise<boolean> {
  const token = cookieValue(request);
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 3 || !/^\d+$/.test(parts[0]) || !/^[\w-]{30,80}$/.test(parts[1])) return false;
  const expiry = Number(parts[0]);
  if (!Number.isFinite(expiry) || expiry < Date.now() / 1000) return false;
  const access = await authRow(env);
  if (!access) return false;
  const expected = await signed(parts[0] + '.' + parts[1], access.pass_hash);
  return equalHex(parts[2], expected);
}
function json(value: unknown, status = 200, extra?: HeadersInit): Response {
  return new Response(JSON.stringify(value), {
    status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...(extra || {}) },
  });
}
const unauthorized = () => json({ error: 'Acceso privado. Inicia sesión.' }, 401);
const bad = (message: string, status = 400) => json({ error: message }, status);
async function readJSON(request: Request, maxLength = 50000): Promise<Record<string, unknown> | null> {
  const text = await request.text();
  if (text.length > maxLength) return null;
  try {
    const obj: unknown = JSON.parse(text);
    return obj && typeof obj === 'object' && !Array.isArray(obj)
      ? obj as Record<string, unknown> : null;
  } catch { return null; }
}
function validQuote(input: unknown, id: string): input is Record<string, unknown> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return false;
  const q = input as Record<string, unknown>;
  return q.id === id && validId(id) &&
    REQUIRED_FIELDS.every(field => typeof q[field] === 'string') &&
    typeof q.price === 'number' && Number.isFinite(q.price) && q.price >= 0 &&
    typeof q.deposit === 'number' && Number.isFinite(q.deposit) && q.deposit >= 0 && q.deposit <= 100 &&
    VALID_STATES.has(String(q.status)) &&
    (q.style === undefined || ['libre', 'vogue', 'lane', 'junebug', 'nyt'].includes(String(q.style))) &&
    (q.readingMode === undefined || ['flip', 'scroll'].includes(String(q.readingMode))) &&
    (q.messages === undefined || Array.isArray(q.messages) && q.messages.length < 500 &&
      q.messages.every((m: unknown) => !!m && typeof m === 'object' &&
        ['from', 'text', 'time'].every(k => typeof (m as Record<string, unknown>)[k] === 'string')));
}
function mediaPublic(row: MediaRow) {
  return { id: row.id, name: row.filename, mime: row.mime, size: row.size,
    createdAt: row.created_at, url: '/api/media/' + row.id };
}
async function api(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method.toUpperCase();
  if (!['GET', 'HEAD', 'POST', 'PUT', 'DELETE'].includes(method)) return bad('Método no permitido.', 405);
  if (method !== 'GET' && method !== 'HEAD') {
    const origin = request.headers.get('Origin');
    if (origin && origin !== url.origin) return bad('Origen no permitido.', 403);
  }
  if (path === '/api/auth/login' && method === 'POST') {
    const data = await readJSON(request, 1000);
    const password = data?.password;
    if (typeof password !== 'string' || password.length > 256) return bad('Credenciales inválidas.', 401);
    const access = await authRow(env);
    if (!access) return bad('El acceso no está configurado.', 503);
    const source = await crypto.subtle.importKey('raw', textBytes(password), 'PBKDF2', false, ['deriveBits']);
    const bytes = new Uint8Array(await crypto.subtle.deriveBits({
      name: 'PBKDF2', salt: hexToBytes(access.pass_salt), iterations: 150000, hash: 'SHA-256',
    }, source, 256));
    if (!equalHex(bytesToHex(bytes), access.pass_hash)) return bad('Contraseña incorrecta.', 401);
    const expiry = Math.floor(Date.now() / 1000) + SESSION_LIFETIME;
    const body = expiry + '.' + crypto.randomUUID().replace(/-/g, '');
    const token = body + '.' + await signed(body, access.pass_hash);
    return json({ authenticated: true }, 200, {
      'Set-Cookie': COOKIE + '=' + token + '; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=' + SESSION_LIFETIME,
    });
  }
  if (path === '/api/auth/session' && method === 'GET') {
    return await authorized(request, env) ? json({ authenticated: true }) : unauthorized();
  }
  if (path === '/api/auth/logout' && method === 'POST') {
    return json({ authenticated: false }, 200, {
      'Set-Cookie': COOKIE + '=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0',
    });
  }
  if (!await authorized(request, env)) return unauthorized();

  if (path === '/api/quotes' && method === 'GET') {
    const rows = await env.DB.prepare('SELECT id, payload, revision FROM quotes ORDER BY updated_at DESC, id DESC')
      .all<QuoteRow>();
    return json({ quotes: rows.results.map(row => ({ quote: JSON.parse(row.payload), revision: row.revision })) });
  }
  if (path.startsWith('/api/quotes/') && method === 'PUT') {
    const id = path.slice('/api/quotes/'.length);
    const data = await readJSON(request);
    const quote = data?.quote;
    const expected = data?.expectedRevision;
    if (!validQuote(quote, id) || !Number.isSafeInteger(expected) || typeof expected !== 'number' || expected < 0) {
      return bad('Cotización inválida.');
    }
    const payload = JSON.stringify(quote);
    if (payload.length > 45000) return bad('Cotización demasiado grande.');
    const result = expected === 0 ?
      await env.DB.prepare(
        'INSERT INTO quotes (id, payload, revision, updated_at) VALUES (?, ?, 1, unixepoch()) ON CONFLICT(id) DO NOTHING'
      ).bind(id, payload).run()
      : await env.DB.prepare(
        'UPDATE quotes SET payload = ?, revision = revision + 1, updated_at = unixepoch() WHERE id = ? AND revision = ?'
      ).bind(payload, id, expected).run();
    if (result.meta.changes) {
      return json({ quote, revision: expected + 1 });
    }
    const current = await env.DB.prepare('SELECT id, payload, revision FROM quotes WHERE id = ?')
      .bind(id).first<QuoteRow>();
    return json({ error: 'conflict', remote: current ? JSON.parse(current.payload) : null,
      revision: current?.revision || 0 }, 409);
  }
  if (path === '/api/media' && method === 'GET') {
    const rows = await env.DB.prepare('SELECT id, object_key, filename, mime, size, created_at FROM media ORDER BY created_at DESC, id DESC')
      .all<MediaRow>();
    return json({
      photos: rows.results.map(mediaPublic),
      bytesUsed: rows.results.reduce((sum, r) => sum + r.size, 0),
    });
  }
  if (path === '/api/media/brand' && method === 'GET') {
    // Reuse the existing optimized HAVANA NICE v2 images as a read-only gallery.
    // Never modify, import or enumerate unrelated Book originals or Calendar objects.
    const listing = await env.MEDIA.list({ prefix: BRAND_PREFIX, limit: 180 });
    const originals = listing.objects.filter(obj => obj.key.endsWith('.webp'));
    return json({ photos: originals.map((obj, index) => ({
      id: obj.key, name: 'HAVANA NICE v2 · ' + String(index + 1).padStart(2, '0'),
      mime: 'image/webp', size: obj.size,
      createdAt: Math.floor(obj.uploaded.getTime() / 1000),
      url: '/api/media/brand/asset?key=' + encodeURIComponent(obj.key),
    })) });
  }
  if (path === '/api/media/brand/asset' && (method === 'GET' || method === 'HEAD')) {
    const key = url.searchParams.get('key') || '';
    if (!key.startsWith(BRAND_PREFIX) || !key.endsWith('.webp') || key.includes('..')) {
      return bad('Fotografía no autorizada.', 404);
    }
    const object = await env.MEDIA.get(key);
    if (!object) return bad('Fotografía no encontrada.', 404);
    return new Response(method === 'HEAD' ? null : object.body, {
      headers: {
        'Content-Type': 'image/webp',
        'Cache-Control': 'private, max-age=120',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  }
  if (path === '/api/media' && method === 'POST') {
    const mime = (request.headers.get('content-type') || '').split(';')[0].toLowerCase();
    const ext = VALID_MIMES[mime];
    if (!ext) return bad('Formato no compatible. Usa JPG, PNG o WebP.');
    const sizeHeader = Number(request.headers.get('content-length') || 0);
    if (sizeHeader > MAX_IMAGE) return bad('La imagen supera 12 MB.', 413);
    const content = await request.arrayBuffer();
    if (content.byteLength === 0 || content.byteLength > MAX_IMAGE) return bad('La foto debe pesar menos de 12 MB.', 413);
    const rawName = request.headers.get('X-File-Name') || 'fotografia.' + ext;
    let filename: string;
    try { filename = decodeURIComponent(rawName).slice(0, 150).replace(/[<>]/g, ''); }
    catch { filename = 'fotografia.' + ext; }
    const id = crypto.randomUUID();
    const objectKey = PHOTOS_PREFIX + id + '.' + ext;
    await env.MEDIA.put(objectKey, content, {
      httpMetadata: { contentType: mime }, customMetadata: { module: 'havana-nice-quotes' },
    });
    try {
      await env.DB.prepare('INSERT INTO media (id, object_key, filename, mime, size, created_at) VALUES (?, ?, ?, ?, ?, unixepoch())')
        .bind(id, objectKey, filename, mime, content.byteLength).run();
    } catch (error) {
      await env.MEDIA.delete(objectKey);
      throw error;
    }
    const row = await env.DB.prepare('SELECT id, object_key, filename, mime, size, created_at FROM media WHERE id = ?')
      .bind(id).first<MediaRow>();
    return json({ photo: mediaPublic(row!) }, 201);
  }
  if (/^\/api\/media\/[a-f0-9-]{36}$/.test(path) && (method === 'GET' || method === 'HEAD')) {
    const id = path.slice('/api/media/'.length);
    const row = await env.DB.prepare('SELECT id, object_key, filename, mime, size, created_at FROM media WHERE id = ?')
      .bind(id).first<MediaRow>();
    if (!row || !row.object_key.startsWith(PHOTOS_PREFIX)) return bad('Foto no encontrada.', 404);
    const object = await env.MEDIA.get(row.object_key);
    if (!object) return bad('Foto no encontrada.', 404);
    return new Response(method === 'HEAD' ? null : object.body, {
      headers: {
        'Content-Type': row.mime, 'Cache-Control': 'private, max-age=120',
        'Content-Length': String(row.size), 'X-Content-Type-Options': 'nosniff',
      },
    });
  }
  return bad('Ruta no encontrada.', 404);
}
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (!new URL(request.url).pathname.startsWith('/api/')) return env.ASSETS.fetch(request);
    try { return await api(request, env); }
    catch (error) {
      console.error('Quotes Studio API failure', error);
      return bad('No fue posible completar la operación en la nube.', 500);
    }
  },
};
