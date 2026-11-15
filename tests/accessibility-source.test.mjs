import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = (file) => readFileSync(new URL('../src/' + file, import.meta.url), 'utf8');

test('Fotografías decorativas no repiten los nombres junto al texto de pareja', () => {
  for (const file of ['features/home/HomeScreen.tsx', 'features/quotes/QuotesScreen.tsx']) {
    assert.match(source(file), /<img src=\{q\.cover\} alt=""\s*\/>/);
  }
});

test('Navegación móvil y envío demo tienen nombres accesibles', () => {
  assert.match(source('app/WorkspaceChrome.tsx'), /aria-label="Abrir menú"/);
  assert.match(source('app/App.tsx'), /aria-label="Cerrar menú"/);
  assert.match(source('features/messages/MessagesScreen.tsx'), /aria-label="Enviar respuesta de prueba"/);
  assert.match(source('features/quotes/QuotesScreen.tsx'), /aria-label="Buscar cotizaciones"/);
});

test('Conmutador escritorio/móvil expone su estado a lectores de pantalla', () => {
  const editor = source('features/editor/QuoteEditorScreen.tsx');
  assert.match(editor, /aria-pressed=\{!mobilePreview\}/);
  assert.match(editor, /aria-pressed=\{mobilePreview\}/);
});

test('Cambiar de pareja limpia borradores sin enviar y registra la selección en el historial', () => {
  const app = source('app/App.tsx');
  const messages = source('features/messages/MessagesScreen.tsx');
  assert.match(app, /const activateQuote = \(id: string\) => \{\s*if \(id === active\) return;\s*setNewMessage\(''\);\s*setClientMessage\(''\);\s*routeTo\(\{ active: id \}\);/);
  assert.match(app, /setActive=\{activateQuote\}/);
  assert.match(messages, /setActive: \(id: string\) => void;/);
});

test('La selección inicial utiliza la primera cotización y no un ID fijo', () => {
  const app = source('app/App.tsx');
  assert.match(app, /useAppHistory\(quotes\[0\]\.id\)/);
  assert.match(app, /const id = 'hn-' \+ crypto\.randomUUID\(\)/);
  assert.doesNotMatch(app, /useState\('hn1'\)/);
});

test('Todos los accesos al historial nativo comparten el mismo navegador y diálogo', () => {
  const app = source('app/App.tsx');
  assert.match(app, /<InstallGuide onClose=\{goBack\}/);
  assert.match(app, /onClick=\{goBack\}/);
  assert.match(app, /const setTab: Dispatch<SetStateAction<string>>/);
  assert.match(app, /routeTo\(\{ mobileMenu: true \}\)/);
  assert.match(app, /routeTo\(\{ previewMode: next as ReadingView \}, 'replace'\)/);
});
