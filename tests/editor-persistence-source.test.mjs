import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const src = file => readFileSync(new URL('../src/' + file, import.meta.url), 'utf8');

test('Plantilla real y cinco estilos mantienen ambos modos editor/cliente', () => {
  const editor = src('features/editor/QuoteEditorScreen.tsx');
  const app = src('app/App.tsx');
  const styles = src('features/editor/styles/EditorialStyles.tsx');
  for (const id of ['carolina', 'libre', 'vogue', 'lane', 'junebug', 'nyt']) assert.ok(styles.includes("id:'" + id + "'"));
  assert.match(editor, /onChange=\{style => edit\('style', style\)\}/);
  const publish = src('features/editor/QuotePublishPanel.tsx');
  assert.match(editor, /<QuotePublishPanel item=\{item\}/);
  assert.match(publish, /onClick=\{\(\) => edit\('readingMode', 'flip'\)\}/);
  assert.match(publish, /onClick=\{\(\) => edit\('readingMode', 'scroll'\)\}/);
  assert.match(app, /previewMode === 'flip' \?/);
  assert.match(app, /<FlipMagazine item=\{item\}/);
});

test('La biblioteca R2 y las fotos subidas alimentan la portada', () => {
  const design = src('features/editor/QuoteDesignPanel.tsx');
  const app = src('app/App.tsx');
  const canvas = src('features/editor/TemplateCanvasEditor.tsx');
  assert.match(design, /<TemplateCanvasEditor item=\{item\}/);
  assert.match(canvas, /photos\.map\(photo =>/);
  assert.match(canvas, /edit\('cover', url\)/);
  assert.match(app, /uploadPhotos\(\[file\]\)/);
  assert.match(app, /onUploadPhoto=\{uploadDesignPhoto\}/);
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

test('Publicar reutiliza el documento real Scroll y la revista 3D sin duplicar el lector', () => {
  const editor = src('features/editor/QuoteEditorScreen.tsx');
  const publish = src('features/editor/QuotePublishPanel.tsx');
  const client = src('features/client/ClientPage.tsx');
  assert.match(editor, /<QuotePublishPanel item=\{item\}/);
  assert.match(publish, /<Proposal item=\{item\} styleName=\{styleName\} embedded\/>/);
  assert.match(publish, /<FlipMagazine item=\{item\}\/>/);
  assert.match(client, /<Proposal item=\{item\} styleName=\{styleName\}/);
  assert.doesNotMatch(editor, /preview-side|studio-magazine-preview|<CarolinaCover/);
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
  assert.match(bank, /multiple hidden disabled=\{uploading \|\| trashing\}/);
  assert.match(bank, /Actualizar biblioteca/);
  assert.match(bank, /Una biblioteca lista para tus fotografías/);
  assert.match(css, /grid-template-columns: repeat\(2, minmax\(0,1fr\)\)/);
  for (const file of [app, media, bank, worker, css]) {
    assert.doesNotMatch(file, /brandPhotos|refreshBrandPhotos|BRAND_PREFIX|\/api\/media\/brand|book\/v2\/optimized\/|hn-photo-existing/);
  }
  assert.doesNotMatch(app, /footer-demo|Cloudflare D1 \+ R2|Datos protegidos y sincronizados en la nube/);
  assert.doesNotMatch(styles, /\.footer-demo/);
});


test('Fotos admite diez imágenes por lote y Diseño una imagen dirigida a cada recuadro', () => {
  const bank = src('features/photos/PhotoBank.tsx');
  const design = src('features/editor/QuoteDesignPanel.tsx');
  const hook = src('features/photos/useMediaLibrary.ts');
  const batch = src('features/photos/photo-batch.ts');
  const app = src('app/App.tsx');
  assert.match(bank, /multiple hidden disabled=\{uploading \|\| trashing\}/);
  const canvas = src('features/editor/TemplateCanvasEditor.tsx');
  assert.match(canvas, /type="file" accept="image\/jpeg/);
  assert.match(canvas, /onUploadPhoto\(file, target\)/);
  assert.match(batch, /MAX_PHOTOS_PER_UPLOAD = 10/);
  assert.match(hook, /await processPhotoBatch\(files,/);
  assert.match(hook, /if \(result\.uploaded\.length\) await refreshPhotos\(\)/);
  assert.match(app, /uploadPhotos\(\[file\]\)/);
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


test('Carolina es la plantilla real principal y separada de los estilos editoriales', () => {
  const styles = src('features/editor/styles/EditorialStyles.tsx');
  const types = src('features/quotes/types.ts');
  const editor = src('features/editor/QuoteEditorScreen.tsx');
  assert.match(styles, /name:'HAVANA NICE Original · Carolina'/);
  assert.match(styles, /Plantillas originales/);
  assert.match(styles, /Estilos editoriales especiales/);
  assert.match(types, /'carolina' \| 'libre'/);
  assert.match(editor, /<EditorialStyles value=\{styleName\}/);
});

test('La plantilla Carolina tiene las 3 páginas originales editables, no un PDF incrustado', () => {
  const template = src('features/templates/CarolinaTemplate.tsx');
  const layout = src('features/templates/carolina-layout.ts');
  const design = src('features/editor/QuoteDesignPanel.tsx');
  const details = src('features/editor/QuoteDetailsPanel.tsx');
  const proposal = src('features/client/Proposal.tsx');
  const magazine = src('features/magazine/FlipMagazine.tsx');
  assert.match(template, /CAROLINA_SLOTS = 6/);
  for (const label of ['The Celebration', 'The Experience', 'Production & Tech']) {
    assert.ok(layout.includes(label));
  }
  assert.match(template, /export function CarolinaCover/);
  assert.match(template, /export function CarolinaCollage/);
  assert.match(template, /export function CarolinaTerms/);
  assert.match(template, /<CarolinaCover item=\{item\}\/>[\s\S]*?<CarolinaCollage item=\{item\}\/>[\s\S]*?<CarolinaTerms item=\{item\}\/>/);
  assert.match(proposal, /styleName === 'carolina'/);
  const canvas = src('features/editor/TemplateCanvasEditor.tsx');
  assert.match(design, /<TemplateCanvasEditor item=\{item\}/);
  assert.match(canvas, /<CarolinaCollage item=\{item\} onSelectPhoto=/);
  assert.match(canvas, /edit\('gallery', gallery\)/);
  assert.doesNotMatch(details, /carolinaCopy|hn-carolina-copy-editor/);
  assert.match(magazine, /item\.style === 'carolina'/);
  assert.match(magazine, /<CarolinaBlankReverse\/>/);
  assert.match(magazine, /flippingTime: 1080/);
  assert.doesNotMatch(template, /<iframe|<embed|<object|\.pdf/);
});


test('Datos reúne detalles, inversión, moneda y anticipo sin duplicar el paquete', () => {
  const editor = src('features/editor/QuoteEditorScreen.tsx');
  const details = src('features/editor/QuoteDetailsPanel.tsx');
  const prices = src('features/editor/QuotePricingPanel.tsx');
  assert.match(editor, /tab === 'details' && <QuoteDetailsPanel item=\{item\} edit=\{edit\}/);
  assert.match(details, /<QuotePricingPanel item=\{item\}/);
  assert.match(prices, /data-currency=\{currency\}/);
  assert.match(prices, /DEPOSIT_OPTIONS = \[20, 30, 40, 50, 60, 70, 80, 90, 100\]/);
  assert.equal((details.match(/Nombre del servicio/g) || []).length, 1);
  assert.doesNotMatch(prices, /Nombre del paquete|Preparar envío|<Send|\bshare\b|envío y las firmas/);
  assert.doesNotMatch(editor, /tab === 'pricing'|Precios <\/button>|studio-editor-subtitle/);
});

test('Estilos contiene solamente dos acordeones de plantillas y ningún bloque ajeno', () => {
  const styles = src('features/editor/styles/EditorialStyles.tsx');
  const css = src('features/editor/styles/editorial-styles.css');
  assert.equal((styles.match(/className="hn-style-accordion"/g) || []).length, 2);
  assert.match(styles, /<summary><span>Plantillas originales/);
  assert.match(styles, /<summary><span>Estilos editoriales especiales/);
  assert.doesNotMatch(styles, /LIBERTAD CREATIVA|Libertad creativa|onEditFree|onReadingChange|readingMode|hn-style-customize|hn-style-reading|Primero, nuestras plantillas|Editar diseño/);
  assert.doesNotMatch(css, /\.hn-style-customize|\.hn-style-reading/);
  assert.doesNotMatch(styles, /s\.desc|s\.features|s\.category/);
});

test('Publicar es la cuarta pestaña y no envía mensajes ni propuestas de forma ficticia', () => {
  const editor = src('features/editor/QuoteEditorScreen.tsx');
  const publish = src('features/editor/QuotePublishPanel.tsx');
  const app = src('app/App.tsx');
  const nav = src('app/native-navigation.ts');
  assert.match(editor, /<Send size=\{16\}\/> Publicar/);
  assert.match(editor, /role="tablist"/);
  assert.match(nav, /'details' \| 'styles' \| 'design' \| 'publish'/);
  assert.match(publish, /Ver a pantalla completa/);
  assert.doesNotMatch(publish, /Preparar envío|onClick=\{share\}|enviar|sendClient/);
  assert.doesNotMatch(app, /share=\{share\}|setMobilePreview|mobilePreview/);
});

test('El borrador nuevo no contiene datos ficticios ni importes prellenados', () => {
  const model = src('features/quotes/model.ts');
  const quotes = src('features/editor/QuoteDetailsPanel.tsx');
  assert.match(model, /name: ''/);
  assert.match(model, /location: ''/);
  assert.match(model, /price: 0/);
  assert.match(model, /deposit: 0/);
  assert.match(model, /note: ''/);
  assert.match(model, /package: ''/);
  assert.match(model, /desc: ''/);
  assert.doesNotMatch(quotes, /Olivia & James/);
});


test('Todas las entradas editables empiezan vacías, incluidas las condiciones de Carolina', () => {
  const model = src('features/quotes/model.ts');
  const details = src('features/editor/QuoteDetailsPanel.tsx');
  const template = src('features/templates/CarolinaTemplate.tsx');
  const prices = src('features/editor/QuotePricingPanel.tsx');
  for (const key of ['name', 'location', 'note', 'package', 'desc']) {
    assert.match(model, new RegExp('\\b' + key + ": ''"));
  }
  assert.doesNotMatch(details, /placeholder="Olivia|defaultValue=/);
  const originals = template.split('export const CAROLINA_COPY = {')[1].split('} as const;')[0];
  const keys = ['performance', 'musicians', 'crew', 'backline', 'logistics',
    'balance', 'production', 'connections', 'space'];
  for (const key of keys) assert.match(originals, new RegExp('\\b' + key + ": ''"));
  assert.doesNotMatch(prices, /placeholder="0"/);
});


test('Datos: fecha directa sin calendario nativo, anticipo solo por menú de nueve opciones', () => {
  const details=src('features/editor/QuoteDetailsPanel.tsx');
  const date=src('features/editor/QuoteDateField.tsx');
  const pricing=src('features/editor/QuotePricingPanel.tsx');
  const css=src('features/editor/quote-pricing.css');
  assert.match(details, /<QuoteDateField quoteId=\{item\.id\}/);
  assert.doesNotMatch(details, /type="date"|CAROLINA_COPY|hn-carolina-copy-editor/);
  assert.match(date, /type="text" inputMode="text"/);
  assert.match(date, /weddingWeekday\(iso\)/);
  assert.match(pricing, /DEPOSIT_OPTIONS = \[20, 30, 40, 50, 60, 70, 80, 90, 100\]/);
  assert.doesNotMatch(pricing, /id="hn-quote-deposit"|type="number"|Elegir porcentaje<\/span>/);
  assert.match(pricing, /className="hn-deposit-row"/);
  assert.match(css, /position:absolute; top:calc\(100% \+ 6px\)/);
});


test('Diseño muestra las páginas reales y permite fotos nativas/R2 por recuadro, sin widgets antiguos', () => {
  const design = src('features/editor/QuoteDesignPanel.tsx');
  const canvas = src('features/editor/TemplateCanvasEditor.tsx');
  const template = src('features/templates/CarolinaTemplate.tsx');
  const app = src('app/App.tsx');
  const stylesheet = readFileSync(new URL('../src/shared/styles/index.css', import.meta.url),'utf8');
  assert.match(canvas, /const pages = \['Portada', 'Collage', 'Propuesta'\]/);
  assert.match(canvas, /<CarolinaCover item=\{item\} interaction=\{textInteraction\}\/>/);
  assert.match(canvas, /<CarolinaCollage item=\{item\} onSelectPhoto=/);
  assert.match(canvas, /<CarolinaTerms item=\{item\} interaction=\{textInteraction\}\/>/);
  assert.match(canvas, /Mi teléfono/);
  assert.match(canvas, /Banco de fotos/);
  assert.match(canvas, /photos\.map\(photo =>/);
  assert.match(template, /onSelectPhoto\?: \(index: number\) => void/);
  assert.match(app, /gallery\[target\] = saved\.url/);
  assert.doesNotMatch(design, /font-options|swatches|photo-options|CarolinaGalleryEditor|upload-btn/);
  assert.doesNotMatch(stylesheet, /\.photo-options \{|\.font-options \{|\.swatches \{/);
});


test('Carolina: todos los textos variables se editan tocando la página y llegan al mismo modelo', async () => {
  const model = src('features/quotes/types.ts');
  const editor = src('features/editor/TemplateCanvasEditor.tsx');
  const template = src('features/templates/CarolinaTemplate.tsx');
  const fields = src('features/templates/carolina-edit-fields.ts');
  const client = src('features/client/Proposal.tsx');
  const magazine = src('features/magazine/FlipMagazine.tsx');
  const node = src('features/templates/CarolinaTextNode.tsx');
  const layout = src('features/templates/carolina-layout.ts');
  assert.match(editor, /onCommitText: \(id, raw\) =>/);
  assert.match(editor, /edit\('carolinaCopy', \{ \.\.\.item\.carolinaCopy, \[field\]: value\.slice\(0, 1500\) \}\)/);
  assert.match(editor, /edit\(field, value\)/);
  assert.match(editor, /edit\('date', date\)/);
  assert.match(editor, /edit\('price', safeQuotePrice\(normalizePriceInput\(value\)\)\)/);
  assert.match(editor, /edit\('deposit', value \? percent : 0\)/);
  assert.match(editor, /onCommitTransform: \(id: string, transform: CarolinaTransform\)/);
  assert.match(editor, /edit\('carolinaLayout',/);
  for (const field of ['name', 'date', 'location', 'note', 'package', 'desc', 'price', 'deposit',
    'performance', 'musicians', 'crew', 'backline', 'logistics', 'balance', 'production',
    'connections', 'space']) assert.ok(fields.includes('  ' + field + ':'), 'Falta el campo '+field);
  assert.match(template, /export function CarolinaTerms\(\{ item, interaction \}/);
  assert.match(template, /<CarolinaTextNode id=\{id\} text=\{value\}/);
  assert.match(model, /carolinaCopy\?: Partial<CarolinaCopy>/);
  assert.match(model, /carolinaLayout\?: CarolinaLayout/);
  assert.match(layout, /export function validCarolinaLayout/);
  assert.match(node, /contentEditable=\{editing \? 'plaintext-only' : undefined\}/);
  assert.match(node, /onBlur=\{\(\) =>/);
  assert.match(client, /<CarolinaDocument item=\{item\}\/>/);
  assert.match(magazine, /<CarolinaTerms item=\{item\}\/>/);
});

test('Carolina: los valores editables mantienen el contrato D1 y la validación original', async () => {
  const { CAROLINA_FIELD_LABELS, CAROLINA_TERMS_FIELDS, isCarolinaCopyField } =
    await import('../src/features/templates/carolina-edit-fields.ts');
  assert.equal(Object.keys(CAROLINA_FIELD_LABELS).length, 17);
  assert.equal(CAROLINA_TERMS_FIELDS.length, 9);
  assert.ok(isCarolinaCopyField('production'));
  assert.ok(!isCarolinaCopyField('date'));
  const worker = readFileSync(new URL('../worker/index.ts', import.meta.url), 'utf8');
  for (const field of CAROLINA_TERMS_FIELDS) {
    assert.ok(worker.includes("'" + field + "'"), 'D1 still accepts '+field);
  }
  assert.match(worker, /value\.length <= 1500/);
});
