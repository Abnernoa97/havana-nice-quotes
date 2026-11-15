import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const src = file => readFileSync(new URL('../src/' + file, import.meta.url), 'utf8');

test('Los cinco estilos y ambos modos están conectados al borrador activo y a la vista cliente', () => {
  const editor = src('features/editor/QuoteEditorScreen.tsx');
  const app = src('app/App.tsx');
  const styles = src('features/editor/styles/EditorialStyles.tsx');
  for (const id of ['libre', 'vogue', 'lane', 'junebug', 'nyt']) {
    assert.ok(styles.includes("id:'" + id + "'"));
  }
  assert.match(editor, /onChange=\{style => edit\('style', style\)\}/);
  assert.match(editor, /onReadingChange=\{mode => \{ edit\('readingMode', mode\); setPreviewMode\(mode\); \}\}/);
  assert.match(app, /previewMode === 'flip' \?/);
  assert.match(app, /<FlipMagazine item=\{item\}/);
});

test('Portada de galería y foto subida siguen conectadas al campo cover', () => {
  const design = src('features/editor/QuoteDesignPanel.tsx');
  const app = src('app/App.tsx');
  assert.match(design, /onClick=\{\(\) => edit\('cover', ph\)\}/);
  assert.match(design, /accept="image\/\*"/);
  assert.match(app, /reader\.readAsDataURL\(f\)/);
  assert.match(app, /edit\('cover', reader\.result\)/);
});

test('El guardado local usa la misma clave en lectura y escritura sin almacenar borradores en el Service Worker', () => {
  const store = src('features/quotes/useQuoteStore.ts');
  const sw = readFileSync(new URL('../public/sw.js', import.meta.url), 'utf8');
  assert.match(store, /parseStoredQuotes\(localStorage\.getItem\(QUOTES_STORAGE_KEY\), seed\)/);
  assert.match(store, /localStorage\.setItem\(QUOTES_STORAGE_KEY, JSON\.stringify\(quotes\)\)/);
  assert.doesNotMatch(sw, /hn_quotes_visual_v1|localStorage/);
  assert.match(sw, /req\.mode === 'navigate'/);
});


test('La vista previa Scroll comparte el mismo documento editorial que la lectura de la pareja', () => {
  const editor = src('features/editor/QuoteEditorScreen.tsx');
  const client = src('features/client/ClientPage.tsx');
  assert.match(editor, /<Proposal item=\{item\} styleName=\{styleName\} embedded/);
  assert.match(client, /<Proposal item=\{item\} styleName=\{styleName\}/);
  assert.match(editor, /item\.readingMode === 'scroll'/);
  assert.match(client, /<details className="client-preview-testing">/);
});

test('La revista incluye mensaje personalizado, tipografía y color sin alterar sus parámetros de plegado', () => {
  const magazine = src('features/magazine/FlipMagazine.tsx');
  assert.match(magazine, /<p>\{item\.note\}<\/p>/);
  assert.match(magazine, /hn-font-/);
  assert.match(magazine, /'--paper-accent': item\.color/);
  assert.match(magazine, /flippingTime: 1080/);
  assert.match(magazine, /maxShadowOpacity: 0\.72/);
});
