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
  assert.match(app, /uploadPhoto\(file\)/);
  assert.match(app, /edit\('cover', photo\.url\)/);
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
  assert.match(photos, /uploadPhoto\(file\)/);
});


test('Las imágenes existentes de Book v2 se reutilizan solo como lectura privada', () => {
  const app = src('app/App.tsx');
  const media = src('features/photos/useMediaLibrary.ts');
  const bank = src('features/photos/PhotoBank.tsx');
  assert.match(app, /cloudPhotos=\{\[\.\.\.photos, \.\.\.brandPhotos\]\}/);
  assert.match(media, /fetch\('\/api\/media\/brand'/);
  assert.match(bank, /brandPhotos\.map\(photo =>/);
});
