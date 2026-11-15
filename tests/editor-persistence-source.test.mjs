import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const src = file => readFileSync(new URL('../src/' + file, import.meta.url), 'utf8');

test('Cinco estilos y ambos modos mantienen el mismo documento en editor y cliente', () => {
  const editor = src('features/editor/QuoteEditorScreen.tsx');
  const app = src('app/App.tsx');
  const styles = src('features/editor/styles/EditorialStyles.tsx');
  for (const id of ['libre', 'vogue', 'lane', 'junebug', 'nyt']) assert.ok(styles.includes("id:'" + id + "'"));
  assert.match(editor, /onChange=\{style => edit\('style', style\)\}/);
  assert.match(editor, /onReadingChange=\{mode => \{ edit\('readingMode', mode\); setPreviewMode\(mode\); \}\}/);
  assert.match(app, /previewMode === 'flip' \?/);
  assert.match(app, /<FlipMagazine item=\{item\}/);
});

test('La biblioteca R2 y las fotos subidas alimentan la portada', () => {
  const design = src('features/editor/QuoteDesignPanel.tsx');
  const app = src('app/App.tsx');
  assert.match(design, /cloudPhotos\.map\(ph =>/);
  assert.match(design, /edit\('cover', ph\.url\)/);
  assert.match(app, /uploadPhotos\(selected\)/);
  assert.match(app, /edit\('cover', result\.uploaded\[0\]\.url\)/);
  assert.doesNotMatch(app, /readAsDataURL|localStorage/);
});

test('El guardado entre dispositivos usa Cloudflare D1 y no localStorage', () => {
  const store = src('features/quotes/useQuoteStore.ts');
  const sw = readFileSync(new URL('../public/sw.js', import.meta.url), 'utf8');
  assert.match(store, /fetch\('\/api\/quotes'/);
  assert.match(store, /method: 'PUT'/);
  assert.match(store, /response\.status === 409/);
  assert.doesNotMatch(store, /localStorage|demo-data/);
  assert.doesNotMatch(sw, /hn_quotes_visual_v1|localStorage/);
});

test('La vista previa Scroll reutiliza la propuesta editorial de la pareja', () => {
  const editor = src('features/editor/QuoteEditorScreen.tsx');
  const client = src('features/client/ClientPage.tsx');
  assert.match(editor, /<Proposal item=\{item\} styleName=\{styleName\} embedded/);
  assert.match(client, /<Proposal item=\{item\} styleName=\{styleName\}/);
  assert.match(client, /<details className="client-preview-testing">/);
});

test('La revista mantiene intactos los parámetros de plegado 3D', () => {
  const magazine = src('features/magazine/FlipMagazine.tsx');
  assert.match(magazine, /flippingTime: 1080/);
  assert.match(magazine, /maxShadowOpacity: 0\.72/);
  assert.match(magazine, /<p>\{item\.note\}<\/p>/);
});

test('El acceso a la nube es por dispositivo autorizado, sin formulario de contraseña', () => {
  const gate = src('features/auth/DeviceGate.tsx');
  const auth = src('features/auth/useDeviceAccess.ts');
  const app = src('app/App.tsx');
  const photos = src('features/photos/PhotoBank.tsx');
  assert.doesNotMatch(gate, /type="password"|Contraseña del estudio|password/i);
  assert.match(auth, /\/api\/device\/activate/);
  assert.match(auth, /\/api\/device\/status/);
  assert.match(auth, /#activate=/);
  assert.match(app, /<DeviceGate checking=\{auth\.status === 'checking'\}/);
  assert.match(app, /onInvite=\{\(\) => void invitePhone\(\)\}/);
  assert.match(photos, /bytesUsed/);
  assert.match(photos, /uploadPhotos\(files\)/);
});


test('La biblioteca de Quotes Studio solo muestra fotos cargadas en su propia aplicación', () => {
  const app = src('app/App.tsx');
  const media = src('features/photos/useMediaLibrary.ts');
  const bank = src('features/photos/PhotoBank.tsx');
  const css = readFileSync(new URL('../src/features/photos/photo-bank.css', import.meta.url), 'utf8');
  const styles = readFileSync(new URL('../src/shared/styles/index.css', import.meta.url), 'utf8');
  const worker = readFileSync(new URL('../worker/index.ts', import.meta.url), 'utf8');
  assert.match(app, /cloudPhotos=\{photos\}/);
  assert.match(bank, /photos\.map\(photo =>/);
  assert.match(bank, /type="file"/);
  assert.match(bank, /multiple hidden disabled=\{uploading \|\| deleting\}/);
  assert.match(bank, /Actualizar biblioteca/);
  assert.match(bank, /Una biblioteca lista para tus fotografías/);
  assert.match(css, /grid-template-columns: repeat\(2, minmax\(0,1fr\)\)/);
  for (const file of [app, media, bank, worker, css]) {
    assert.doesNotMatch(file, /brandPhotos|refreshBrandPhotos|BRAND_PREFIX|\/api\/media\/brand|book\/v2\/optimized\/|hn-photo-existing/);
  }
  assert.doesNotMatch(app, /footer-demo|Cloudflare D1 \+ R2|Datos protegidos y sincronizados en la nube/);
  assert.doesNotMatch(styles, /\.footer-demo/);
});


test('Fotos y Diseño admiten diez archivos por selección, sin limitar el total de la biblioteca', () => {
  const bank = src('features/photos/PhotoBank.tsx');
  const design = src('features/editor/QuoteDesignPanel.tsx');
  const hook = src('features/photos/useMediaLibrary.ts');
  const batch = src('features/photos/photo-batch.ts');
  const app = src('app/App.tsx');
  assert.match(bank, /multiple hidden disabled=\{uploading \|\| deleting\}/);
  assert.match(design, /type="file"\s+multiple/);
  assert.match(batch, /MAX_PHOTOS_PER_UPLOAD = 10/);
  assert.match(hook, /await processPhotoBatch\(files,/);
  assert.match(hook, /if \(result\.uploaded\.length\) await refreshPhotos\(\)/);
  assert.match(app, /uploadPhotos\(selected\)/);
  assert.doesNotMatch(hook, /uploadPhoto\(/);
});


test('La galería presenta fotos solas; pulsación prolongada selecciona y el visor es reversible', () => {
  const gallery = src('features/photos/PhotoBank.tsx');
  const nav = src('app/native-navigation.ts');
  const css = readFileSync(new URL('../src/features/photos/photo-bank.css', import.meta.url), 'utf8');
  assert.match(gallery, /photos\.map\(photo =>/);
  assert.match(gallery, /onPointerDown=\{event => beginHold\(event, photo\.id\)\}/);
  assert.match(gallery, /onContextMenu=\{event => longPressContext\(event, photo\.id\)\}/);
  assert.match(gallery, /window\.confirm/);
  assert.match(gallery, /role="dialog" aria-modal="true" aria-label="Visor de fotografías"/);
  assert.match(gallery, /onTouchStart=\{onSwipeStart\} onTouchEnd=\{onSwipeEnd\}/);
  assert.doesNotMatch(gallery, /<figcaption>|<strong title=\{p\.name\}|photoSize\(p\.size\)/);
  assert.doesNotMatch(css, /\.hn-photo-bank-item figcaption/);
  assert.match(nav, /photoViewerId: string \| null/);
  assert.match(nav, /photoSelecting: boolean/);
});

test('La selección puede borrar archivos reales y actualizar cotizaciones que usan la portada', () => {
  const gallery = src('features/photos/PhotoBank.tsx');
  const media = src('features/photos/useMediaLibrary.ts');
  const app = src('app/App.tsx');
  const worker = readFileSync(new URL('../worker/index.ts', import.meta.url), 'utf8');
  assert.match(gallery, /trashPhotos\(ids\)/);
  assert.match(gallery, /await refreshQuotes\(\)/);
  assert.match(media, /method: 'DELETE'/);
  assert.match(worker, /SET deleted_at = unixepoch\(\)/);
  assert.match(worker, /json_set\(payload, '\$\.cover', ''\)/);
  assert.match(app, /trashPhotos=\{trashPhotos\} refreshQuotes=\{refreshQuotes\}/);
});


test('Papelera visible desde el menú, sin sexta pestaña móvil', () => {
  const app = src('app/App.tsx');
  const trash = src('features/trash/TrashScreen.tsx');
  const worker = readFileSync(new URL('../worker/index.ts', import.meta.url), 'utf8');
  assert.match(app, /id: 'trash', label: 'Papelera'/);
  assert.match(app, /pages\.filter\(p => p\.id !== 'trash'\)/);
  assert.match(trash, /Restaurar/);
  assert.match(trash, /Eliminar/);
  assert.match(trash, /Archivos/);
  assert.match(worker, /deleted_at IS NOT NULL/);
  assert.match(worker, /await env\.MEDIA\.delete\(photo\.object_key\)/);
});
