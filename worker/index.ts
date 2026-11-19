import { validCarolinaLayout } from '../src/features/templates/carolina-layout.ts';
import { isTemplateStyle } from '../src/features/templates/template-registry.ts';
import { handleVideoApi, videoPrefix, videoPosterKey } from './videos.ts';
import { ownerSharing, publicSharing } from './quote-sharing.ts';
import { ownerShareAnalytics, publicShareVisit } from './share-analytics.ts';
import { quoteChatApi } from './quote-chat.ts';
import { ownerInboxApi } from './quote-inbox.ts';
import {syncCalendarQuote,reconcileCalendarQuotes} from './calendar-bridge.ts';
import type {CalendarDatabase,CalendarQuote} from './calendar-bridge.ts';
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
interface R2Object { body: ReadableStream; size: number; httpMetadata?: { contentType?: string }; etag?: string }
interface R2Binding {
  get(key: string, options?: {range: {offset: number; length: number}}): Promise<R2Object | null>;
  createMultipartUpload(key: string, options: { httpMetadata: {contentType: string}; customMetadata: Record<string,string>}): Promise<{
    uploadId: string;
    uploadPart(number:number,bytes:ArrayBuffer):Promise<{partNumber:number;etag:string}>;
    complete(parts:{partNumber:number;etag:string}[]):Promise<{size:number}>;
    abort():Promise<void>;
  }>;
  resumeMultipartUpload(key:string,uploadId:string):{
    uploadId: string;
    uploadPart(number:number,bytes:ArrayBuffer):Promise<{partNumber:number;etag:string}>;
    complete(parts:{partNumber:number;etag:string}[]):Promise<{size:number}>;
    abort():Promise<void>;
  };
  put(key: string, body: ArrayBuffer, opts: { httpMetadata: { contentType: string }; customMetadata: Record<string, string> }): Promise<unknown>;
  delete(key: string): Promise<void>;
}
interface Env {
  DB: D1Binding;
  CALENDAR_DB?: CalendarDatabase;
  MEDIA: R2Binding;
  ASSETS: { fetch(request: Request): Promise<Response> };
}
interface SessionRow extends D1Row { token_hash: string; expires_at: number; revoked_at: number | null }
interface QuoteRow extends D1Row { id: string; payload: string; revision: number; deleted_at?: number | null }
interface MediaRow extends D1Row { id: string; filename: string; mime: string; size: number; created_at: number; object_key: string; deleted_at?: number | null }
const PHOTOS_PREFIX = 'quotes-studio/photos/';
const PHOTO_THUMBS_PREFIX = 'quotes-studio/photo-thumbnails/';
const photoThumbKey = (id: string) => PHOTO_THUMBS_PREFIX + id + '.jpg';
const MAX_THUMB = 256 * 1024;
const MAX_IMAGE = 12 * 1024 * 1024;
const COOKIE = 'hn_quotes_device';
const SESSION_LIFETIME = 365 * 24 * 60 * 60;
const INVITE_LIFETIME = 20 * 60;
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
const VALID_STATES = new Set(['Borrador', 'Listo para enviar', 'Enviada', 'En revisión', 'Aceptada']);
const validId = (s: string) => /^hn-[a-f0-9-]{20,64}$/.test(s);
const bytesToHex = (bytes: Uint8Array): string =>
  Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
const randomToken = (): string => bytesToHex(crypto.getRandomValues(new Uint8Array(32)));
const hashToken = async (token: string): Promise<string> =>
  bytesToHex(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token))));
const equalHex = (a: string, b: string): boolean => {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
};
const cookieValue = (request: Request): string | undefined => {
  const cookies = request.headers.get('cookie') || '';
  return cookies.split(';').map(x => x.trim()).find(x => x.startsWith(COOKIE + '='))?.slice(COOKIE.length + 1);
};
const sessionId = (request: Request): string | null => {
  const match = cookieValue(request)?.match(/^([a-f0-9-]{36})\.([a-f0-9]{64})$/);
  return match ? match[1] : null;
};
async function authorized(request: Request, env: Env): Promise<boolean> {
  const token = cookieValue(request);
  if (!token) return false;
  const match = token.match(/^([a-f0-9-]{36})\.([a-f0-9]{64})$/);
  if (!match) return false;
  const row = await env.DB.prepare(
    'SELECT token_hash, expires_at, revoked_at FROM device_sessions WHERE id = ?'
  ).bind(match[1]).first<SessionRow>();
  if (!row || row.revoked_at !== null || row.expires_at < Math.floor(Date.now() / 1000)) return false;
  return equalHex(await hashToken(match[2]), row.token_hash);
}
const deviceCookie = (id: string, token: string): string =>
  COOKIE + '=' + id + '.' + token +
  '; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=' + SESSION_LIFETIME;
function json(value: unknown, status = 200, extra?: HeadersInit): Response {
  return new Response(JSON.stringify(value), {
    status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...(extra || {}) },
  });
}
const unauthorized = () => json({ error: 'Dispositivo no vinculado.' }, 401);
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
    (q.quoteTitle === undefined || typeof q.quoteTitle === 'string' &&
      q.quoteTitle.trim().length > 0 && q.quoteTitle.length <= 150) &&
    (q.venue === undefined || typeof q.venue === 'string' && q.venue.length <= 120) &&
    (q.city === undefined || typeof q.city === 'string' && q.city.length <= 100) &&
    (q.weddingPlanner === undefined || typeof q.weddingPlanner === 'string' &&
      q.weddingPlanner.length <= 120) &&
    typeof q.price === 'number' && Number.isFinite(q.price) && q.price >= 0 &&
    typeof q.deposit === 'number' && Number.isFinite(q.deposit) && q.deposit >= 0 && q.deposit <= 100 &&
    (q.currency === undefined || q.currency === 'USD' || q.currency === 'MX') &&
    VALID_STATES.has(String(q.status)) &&
    (q.style === undefined || isTemplateStyle(q.style)) &&
    (q.isTemplate === undefined || typeof q.isTemplate === 'boolean') &&
    (q.templateName === undefined || typeof q.templateName === 'string' &&
      q.templateName.length <= 100) &&
    (q.coverVideo === undefined || typeof q.coverVideo === 'string' &&
      (q.coverVideo === '' || /^\/api\/videos\/[a-f0-9-]{36}$/.test(q.coverVideo))) &&
    (q.gallery === undefined || Array.isArray(q.gallery) && q.gallery.length <= 12 &&
      q.gallery.every((photo: unknown) => typeof photo === 'string' && (photo === '' ||
        /^\/api\/media\/[a-f0-9-]{36}$/.test(photo)))) &&
    (q.carolinaCopy === undefined || (!!q.carolinaCopy && typeof q.carolinaCopy === 'object' &&
      !Array.isArray(q.carolinaCopy) && Object.entries(q.carolinaCopy).every(([field, value]) =>
        ['performance', 'musicians', 'crew', 'backline', 'logistics', 'balance', 'production', 'connections', 'space'].includes(field) &&
        typeof value === 'string' && value.length <= 1500))) &&
    (q.designLayout === undefined || validCarolinaLayout(q.designLayout)) &&
    (q.readingMode === undefined || ['flip', 'scroll'].includes(String(q.readingMode))) &&
    (q.messages === undefined || Array.isArray(q.messages) && q.messages.length < 500 &&
      q.messages.every((m: unknown) => !!m && typeof m === 'object' &&
        ['from', 'text', 'time'].every(k => typeof (m as Record<string, unknown>)[k] === 'string')));
}
function mediaPublic(row: MediaRow) {
  return { id: row.id, name: row.filename, mime: row.mime, size: row.size,
    createdAt: row.created_at, url: '/api/media/' + row.id,
    thumbnailUrl: '/api/media/' + row.id + '/thumbnail' };
}
async function api(request: Request, env: Env,
 ctx?:{waitUntil(work:Promise<unknown>):void}): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method.toUpperCase();
  if (!['GET', 'HEAD', 'POST', 'PUT', 'DELETE'].includes(method)) return bad('Método no permitido.', 405);
  if (method !== 'GET' && method !== 'HEAD') {
    const origin = request.headers.get('Origin');
    if (origin && origin !== url.origin) return bad('Origen no permitido.', 403);
  }
  // Passwordless by design: only a one-time, 256-bit device invitation can
  // activate a phone. Neither a password nor an anonymous public token exists.
  if (path === '/api/device/activate' && method === 'POST') {
    const data = await readJSON(request, 256);
    const code = data?.code;
    if (typeof code !== 'string' || !/^[a-f0-9]{64}$/.test(code)) {
      return bad('Enlace de vinculación inválido.', 401);
    }
    const digest = await hashToken(code);
    const claim = await env.DB.prepare(
      'UPDATE device_invites SET used_at = unixepoch() WHERE token_hash = ? AND used_at IS NULL AND expires_at > unixepoch()'
    ).bind(digest).run();
    if (!claim.meta.changes) return bad('El enlace ya se utilizó o caducó.', 401);
    const id = crypto.randomUUID();
    const secret = randomToken();
    await env.DB.prepare(
      'INSERT INTO device_sessions (id, token_hash, expires_at, created_at) VALUES (?, ?, ?, unixepoch())'
    ).bind(id, await hashToken(secret), Math.floor(Date.now() / 1000) + SESSION_LIFETIME).run();
    return json({ authorized: true }, 200, { 'Set-Cookie': deviceCookie(id, secret) });
  }
  if (path === '/api/device/status' && method === 'GET') {
    return await authorized(request, env)
      ? json({ authorized: true }) : unauthorized();
  }
  if (path === '/api/device/revoke' && method === 'POST') {
    if (!await authorized(request, env)) return unauthorized();
    const id = sessionId(request);
    if (id) await env.DB.prepare('UPDATE device_sessions SET revoked_at = unixepoch() WHERE id = ?')
      .bind(id).run();
    return json({ authorized: false }, 200, {
      'Set-Cookie': COOKIE + '=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0',
    });
  }
  // The only unauthenticated API is a scoped read-only client proposal.
  // Its random token never grants access to the editor or the media library.
  if(path.startsWith('/api/shared/')){
    const visit=await publicShareVisit(request,env);
    if(visit)return visit;
    const chat=await quoteChatApi(request,env,true);
    return chat||await publicSharing(request,env)||bad('Ruta no encontrada.',404);
  }
  if (!await authorized(request, env)) return unauthorized();
  if(path.startsWith('/api/share-analytics'))
    return await ownerShareAnalytics(request,env)||bad('Ruta no encontrada.',404);
  if(path.startsWith('/api/quote-inbox'))
    return await ownerInboxApi(request,env)||bad('Ruta no encontrada.',404);
  if(path.startsWith('/api/quote-chat/'))
    return await quoteChatApi(request,env,false)||bad('Ruta no encontrada.',404);
  if (path.startsWith('/api/share-links'))
    return await ownerSharing(request, env) || bad('Ruta no encontrada.',404);
  if (path === '/api/device/invite' && method === 'POST') {
    const code = randomToken();
    await env.DB.prepare(
      'INSERT INTO device_invites (token_hash, expires_at, created_at) VALUES (?, ?, unixepoch())'
    ).bind(await hashToken(code), Math.floor(Date.now() / 1000) + INVITE_LIFETIME).run();
    // The token is returned only to a currently authorized phone. It travels
    // in the URL fragment, so it is not sent in HTTP requests, access logs
    // or Referer headers.
    return json({ url: url.origin + '/#activate=' + code, expiresIn: INVITE_LIFETIME });
  }


  if (path.startsWith('/api/videos')) return handleVideoApi(request, env);
  if (path === '/api/quotes' && method === 'GET') {
    const rows = await env.DB.prepare('SELECT id, payload, revision FROM quotes WHERE deleted_at IS NULL ORDER BY updated_at DESC, id DESC')
      .all<QuoteRow>();
    // No new cron, queue, HTTP endpoint or browser secret: authorized reads trigger
    // bounded, idempotent reconciliation of all Quotes after any outage.
    if(ctx?.waitUntil && env.CALENDAR_DB){
      ctx.waitUntil((async()=>{
        const records=await env.DB.prepare('SELECT id,payload,revision,deleted_at FROM quotes ORDER BY updated_at DESC')
          .all<QuoteRow>();
        await reconcileCalendarQuotes(env.CALENDAR_DB,records.results);
      })().catch(error=>console.warn('Calendar bridge reconciliation pending',String(error))));
    }
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
        'UPDATE quotes SET payload = ?, revision = revision + 1, updated_at = unixepoch() WHERE id = ? AND revision = ? AND deleted_at IS NULL'
      ).bind(payload, id, expected).run();
    if (result.meta.changes) {
      // Save Quotes first. Calendar failure never corrupts a quote; the next
      // authenticated read retries the bridge using the D1 source revision.
      let calendarSync='pending';
      try{
        calendarSync=await syncCalendarQuote(env.CALENDAR_DB,quote as CalendarQuote,expected+1);
      }catch(error){console.warn('Calendar bridge deferred',id,String(error))}
      return json({ quote, revision: expected + 1, calendarSync });
    }
    const current = await env.DB.prepare('SELECT id, payload, revision FROM quotes WHERE id = ?')
      .bind(id).first<QuoteRow>();
    return json({ error: 'conflict', remote: current ? JSON.parse(current.payload) : null,
      revision: current?.revision || 0 }, 409);
  }
  if (path === '/api/media' && method === 'GET') {
    const rows = await env.DB.prepare('SELECT id, object_key, filename, mime, size, created_at FROM media WHERE deleted_at IS NULL ORDER BY created_at DESC, id DESC')
      .all<MediaRow>();
    return json({
      photos: rows.results.filter(row=>row.object_key.startsWith(PHOTOS_PREFIX)).map(mediaPublic),
      bytesUsed: rows.results.filter(row=>row.object_key.startsWith(PHOTOS_PREFIX))
        .reduce((sum, r) => sum + r.size, 0),
    });
  }
  if (/^\/api\/media\/[a-f0-9-]{36}\/thumbnail$/.test(path) && ['GET','HEAD','PUT'].includes(method)) {
    const id = path.split('/')[3];
    const row = await env.DB.prepare(
      'SELECT id, object_key, filename, mime, size, created_at FROM media WHERE id = ? AND deleted_at IS NULL'
    ).bind(id).first<MediaRow>();
    if (!row || !row.object_key.startsWith(PHOTOS_PREFIX)) return bad('Fotografía no encontrada.',404);
    const thumbKey = photoThumbKey(id);
    if (method === 'PUT') {
      if ((request.headers.get('content-type') || '').split(';')[0] !== 'image/jpeg')
        return bad('La miniatura debe ser JPEG.');
      if (Number(request.headers.get('content-length') || 0) > MAX_THUMB)
        return bad('Miniatura demasiado grande.',413);
      const bytes = await request.arrayBuffer();
      const image = new Uint8Array(bytes);
      if (!image.length || image.length > MAX_THUMB || image[0] !== 0xff ||
          image[1] !== 0xd8 || image[2] !== 0xff)
        return bad('Miniatura JPEG inválida.');
      await env.MEDIA.put(thumbKey,bytes,{
        httpMetadata:{contentType:'image/jpeg'},
        customMetadata:{module:'havana-nice-quotes',kind:'photo-thumbnail'},
      });
      return json({thumbnailUrl:'/api/media/'+id+'/thumbnail'});
    }
    const thumb = await env.MEDIA.get(thumbKey);
    if (!thumb) return bad('Miniatura pendiente.',404);
    return new Response(method==='HEAD'?null:thumb.body,{headers:{
      'Content-Type':'image/jpeg','Content-Length':String(thumb.size),
      'Cache-Control':'private, max-age=86400',
      'X-Content-Type-Options':'nosniff',
    }});
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
  if (/^\/api\/quotes\/hn-[a-f0-9-]{20,64}$/.test(path) && method === 'DELETE') {
    const id = path.slice('/api/quotes/'.length);
    const result = await env.DB.prepare(
      'UPDATE quotes SET deleted_at = unixepoch(), revision = revision + 1, updated_at = unixepoch() WHERE id = ? AND deleted_at IS NULL'
    ).bind(id).run();
    if(!result.meta.changes)return bad('Cotización no encontrada.',404);
    const stored=await env.DB.prepare('SELECT id,payload,revision,deleted_at FROM quotes WHERE id=?')
      .bind(id).first<QuoteRow>();
    if(stored){
      try{await syncCalendarQuote(env.CALENDAR_DB,JSON.parse(stored.payload) as CalendarQuote,stored.revision,true)}
      catch(error){console.warn('Calendar bridge trash pending',id,String(error))}
    }
    return json({trashed:true});
  }
  if (path === '/api/trash' && method === 'GET') {
    const [quotes, media] = await Promise.all([
      env.DB.prepare('SELECT id, payload, deleted_at FROM quotes WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC')
        .all<QuoteRow>(),
      env.DB.prepare('SELECT id, object_key, filename, mime, size, deleted_at FROM media WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC')
        .all<MediaRow>(),
    ]);
    return json({ items: [
      ...quotes.results.map(row => {
        const q=JSON.parse(row.payload) as Record<string, unknown>;
        return {id:row.id,kind:'quote',
          label:(q.isTemplate? q.templateName:q.quoteTitle||q.name)||'Cotización',
          isTemplate:q.isTemplate===true,deletedAt:row.deleted_at};
      }),
      ...media.results.filter(row => row.object_key.startsWith(PHOTOS_PREFIX))
        .map(row => ({ id: row.id, kind: 'photo', label: row.filename,
          deletedAt: row.deleted_at, url: '/api/trash/photo/' + row.id })),
      ...media.results.filter(row => row.object_key.startsWith(videoPrefix))
        .map(row => ({id:row.id,kind:'video',label:row.filename,deletedAt:row.deleted_at})),
    ].sort((a, b) => Number(b.deletedAt) - Number(a.deletedAt)) });
  }
  if (/^\/api\/trash\/(photo|video|quote)\/[a-z0-9-]+\/restore$/.test(path) && method === 'POST') {
    const parts = path.split('/');
    const kind = parts[3], id = parts[4];
    if (kind === 'quote') {
      if (!validId(id)) return bad('Cotización no encontrada.', 404);
      const result = await env.DB.prepare(
        'UPDATE quotes SET deleted_at = NULL, revision = revision + 1, updated_at = unixepoch() WHERE id = ? AND deleted_at IS NOT NULL'
      ).bind(id).run();
      if(!result.meta.changes)return bad('Cotización no encontrada.',404);
      const stored=await env.DB.prepare('SELECT id,payload,revision,deleted_at FROM quotes WHERE id=?')
        .bind(id).first<QuoteRow>();
      if(stored){
        try{await syncCalendarQuote(env.CALENDAR_DB,JSON.parse(stored.payload) as CalendarQuote,stored.revision,false)}
        catch(error){console.warn('Calendar bridge restore pending',id,String(error))}
      }
      return json({restored:true});
    }
    const photo = await env.DB.prepare(
      'SELECT id, object_key, filename, mime, size, created_at FROM media WHERE id = ? AND deleted_at IS NOT NULL'
    ).bind(id).first<MediaRow>();
    if (!photo || !photo.object_key.startsWith(kind==='video'?videoPrefix:PHOTOS_PREFIX)) return bad('Archivo no encontrado.', 404);
    if (!await env.MEDIA.get(photo.object_key)) return bad('El archivo no existe en R2.', 404);
    const result = await env.DB.prepare(
      'UPDATE media SET deleted_at = NULL WHERE id = ? AND deleted_at IS NOT NULL'
    ).bind(id).run();
    return result.meta.changes ? json({ restored: true }) : bad('Fotografía no encontrada.', 404);
  }
  if (/^\/api\/trash\/(photo|video|quote)\/[a-z0-9-]+$/.test(path) && method === 'DELETE') {
    const parts = path.split('/');
    const kind = parts[3], id = parts[4];
    if (kind === 'quote') {
      if (!validId(id)) return bad('Cotización no encontrada.', 404);
      // Ensure the linked Calendar record is archived before the source is
      // permanently removed; otherwise a failed bridge would leave an orphan.
      const discarded=await env.DB.prepare('SELECT id,payload,revision,deleted_at FROM quotes WHERE id=? AND deleted_at IS NOT NULL')
        .bind(id).first<QuoteRow>();
      if(!discarded)return bad('Cotización no encontrada.',404);
      if(env.CALENDAR_DB){
        try{await syncCalendarQuote(env.CALENDAR_DB,JSON.parse(discarded.payload) as CalendarQuote,discarded.revision,true)}
        catch{return bad('No se pudo sincronizar la Papelera con Calendario. Intenta de nuevo.',503)}
      }
      const result = await env.DB.prepare(
        'DELETE FROM quotes WHERE id = ? AND deleted_at IS NOT NULL'
      ).bind(id).run();
      return result.meta.changes ? json({ deleted: true }) : bad('Cotización no encontrada.', 404);
    }
    const photo = await env.DB.prepare(
      'SELECT id, object_key, filename, mime, size, created_at FROM media WHERE id = ? AND deleted_at IS NOT NULL'
    ).bind(id).first<MediaRow>();
    if (!photo || !photo.object_key.startsWith(kind==='video'?videoPrefix:PHOTOS_PREFIX)) return bad('Archivo no encontrado.', 404);
    await env.MEDIA.delete(photo.object_key);
    // A permanent deletion also removes its generated tiny poster.
    if(kind==='video')await env.MEDIA.delete(videoPosterKey(id));
    if(kind==='photo')await env.MEDIA.delete(photoThumbKey(id));
    await env.DB.prepare(
      'DELETE FROM media WHERE id = ? AND deleted_at IS NOT NULL AND object_key = ?'
    ).bind(id, photo.object_key).run();
    return json({ deleted: true });
  }
  if (/^\/api\/trash\/photo\/[a-f0-9-]{36}$/.test(path) && (method === 'GET' || method === 'HEAD')) {
    const id = path.slice('/api/trash/photo/'.length);
    const row = await env.DB.prepare(
      'SELECT id, object_key, filename, mime, size FROM media WHERE id = ? AND deleted_at IS NOT NULL'
    ).bind(id).first<MediaRow>();
    if (!row || !row.object_key.startsWith(PHOTOS_PREFIX)) return bad('Fotografía no encontrada.', 404);
    const object = await env.MEDIA.get(row.object_key);
    if (!object) return bad('Fotografía no encontrada.', 404);
    return new Response(method === 'HEAD' ? null : object.body, { headers: {
      'Content-Type': row.mime, 'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    } });
  }
  if (/^\/api\/media\/[a-f0-9-]{36}$/.test(path) && method === 'DELETE') {
    const id = path.slice('/api/media/'.length);
    const row = await env.DB.prepare(
      'SELECT id, object_key, filename, mime, size, created_at FROM media WHERE id = ? AND deleted_at IS NULL'
    ).bind(id).first<MediaRow>();
    if (!row || !row.object_key.startsWith(PHOTOS_PREFIX)) return bad('Fotografía no encontrada.', 404);
    const moved = await env.DB.prepare(
      'UPDATE media SET deleted_at = unixepoch() WHERE id = ? AND deleted_at IS NULL AND object_key = ?'
    ).bind(id, row.object_key).run();
    if (!moved.meta.changes) return bad('Fotografía no encontrada.', 404);
    const cleared = await env.DB.prepare(
      "UPDATE quotes SET payload = json_set(payload, '$.cover', ''), revision = revision + 1, updated_at = unixepoch() WHERE json_extract(payload, '$.cover') = ? AND deleted_at IS NULL"
    ).bind('/api/media/' + id).run();
    return json({ trashed: true, clearedCovers: cleared.meta.changes });
  }
  if (/^\/api\/media\/[a-f0-9-]{36}$/.test(path) && (method === 'GET' || method === 'HEAD')) {
    const id = path.slice('/api/media/'.length);
    const row = await env.DB.prepare('SELECT id, object_key, filename, mime, size, created_at FROM media WHERE id = ? AND deleted_at IS NULL')
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
  async fetch(request: Request, env: Env, ctx?:{waitUntil(work:Promise<unknown>):void}): Promise<Response> {
    if (!new URL(request.url).pathname.startsWith('/api/')) return env.ASSETS.fetch(request);
    try { return await api(request, env, ctx); }
    catch (error) {
      console.error('Quotes Studio API failure', error);
      return bad('No fue posible completar la operación en la nube.', 500);
    }
  },
};
