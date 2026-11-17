import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = (file) => readFileSync(new URL('../src/' + file, import.meta.url), 'utf8');

test('Fotografías decorativas no repiten los nombres junto al texto de pareja', () => {
  for (const file of ['features/home/HomeScreen.tsx', 'features/quotes/QuotesScreen.tsx']) {
    assert.match(source(file), /q\.cover \? <img src=\{q\.cover\} alt=""\s*\/>/);
    assert.match(source(file), /className="quote-cover-empty"/);
  }
});

test('Navegación móvil y envío demo tienen nombres accesibles', () => {
  assert.match(source('app/WorkspaceChrome.tsx'), /aria-label="Abrir menú"/);
  assert.match(source('app/App.tsx'), /aria-label="Cerrar menú"/);
  assert.match(source('features/messages/MessagesScreen.tsx'), /aria-label="Enviar respuesta de prueba"/);
  assert.match(source('features/quotes/QuotesScreen.tsx'), /aria-label="Buscar cotizaciones"/);
});

test('Pestañas de edición y modo de lectura exponen sus estados a lectores de pantalla', () => {
  const editor = source('features/editor/QuoteEditorScreen.tsx');
  const publish = source('features/editor/QuotePublishPanel.tsx');
  assert.match(editor, /role="tablist"/);
  assert.match(editor, /aria-selected=\{tab === 'details'\}/);
  assert.match(editor, /aria-selected=\{tab === 'publish'\}/);
  assert.match(publish, /aria-pressed=\{mode === 'flip'\}/);
  assert.match(publish, /aria-pressed=\{mode === 'scroll'\}/);
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
  assert.match(app, /useAppHistory\('empty'\)/);
  assert.doesNotMatch(app,/clientQuotes\[0\] \|\| ownTemplates\[0\]/);
  assert.match(app, /const id='hn-'\+crypto\.randomUUID\(\)/);
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


test('Inicio muestra una sola acción para crear cotización, dentro de la tarjeta', () => {
  const home = source('features/home/HomeScreen.tsx');
  const app = source('app/App.tsx');
  assert.equal((home.match(/onClick=\{addQuote\}/g) || []).length, 1);
  assert.match(home, /<Plus size=\{17\} \/> Nueva cotización/);
  assert.doesNotMatch(home, /btnQuote|Crear nueva propuesta|Todo lo que necesitas para crear propuestas/);
  const homeWiring = app.split('const home = (')[1].split('const quotesView = (')[0];
  assert.doesNotMatch(homeWiring, /btnQuote/);
  assert.match(app, /<QuotesScreen[\s\S]*?btnQuote=\{btnQuote\}/);
});

test('Se preservan las dimensiones existentes de la tarjeta principal en escritorio y móvil', () => {
  const css = readFileSync(new URL('../src/shared/styles/index.css', import.meta.url), 'utf8');
  assert.match(css, /\.welcome-hero\s*\{\s*height: 340px;/);
  assert.match(css, /@media \(max-width: 1250px\)[\s\S]*?\.welcome-hero\s*\{\s*height: 320px;/);
  assert.match(css, /@media \(max-width: 600px\)[\s\S]*?\.welcome-hero\s*\{\s*height: 330px;/);
  assert.match(css, /\.dashboard \.intro-line\s*\{\s*margin-bottom: 18px;/);
});
