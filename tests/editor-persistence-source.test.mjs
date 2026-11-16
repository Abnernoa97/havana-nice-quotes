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
  assert.match(template, /carolinaPageOrder\(item\.carolinaLayout\)\.map\(page=>/);
  assert.match(template, /<CarolinaCover key="cover" item=\{item\}\/>/);
  assert.match(template, /<CarolinaCollage key="collage" item=\{item\}\/>/);
  assert.match(template, /<CarolinaTerms key="terms" item=\{item\}\/>/);
  assert.match(proposal, /styleName === 'carolina'/);
  const canvas = src('features/editor/TemplateCanvasEditor.tsx');
  assert.match(design, /<TemplateCanvasEditor item=\{item\}/);
  assert.match(canvas, /<CarolinaCollage item=\{item\} onSelectPhoto=/);
  assert.match(canvas, /edit\('gallery', gallery\)/);
  assert.doesNotMatch(details, /carolinaCopy|hn-carolina-copy-editor/);
  assert.match(magazine, /item\.style === 'carolina'/);
  assert.doesNotMatch(magazine, /<CarolinaBlankReverse\/>/);
  assert.match(magazine, /selectedPages\.map\(selectedPage =>/);
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
  assert.match(canvas, /<CarolinaCover item=\{item\} interaction=\{textInteraction\}[\s\S]*?onSelectCover=/);
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
  assert.match(template, /export function CarolinaTerms\(\{ item, interaction, onSelectExtraPhoto \}/);
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


test('Fotos editables en el diseño real y visor: los 7 recuadros usan un solo gesto y modelo', () => {
  const template=src('features/templates/CarolinaTemplate.tsx');
  const reader=src('features/client/Proposal.tsx');
  const magazine=src('features/magazine/FlipMagazine.tsx');
  const image=src('features/templates/CarolinaPhotoNode.tsx');
  const gesture=src('features/templates/useCarolinaGesture.ts');
  const worker=readFileSync(new URL('../worker/index.ts',import.meta.url),'utf8');
  assert.match(image,/useCarolinaGesture\(id, element, transform, interaction\)/);
  assert.match(template,/item\.carolinaLayout\?\.transforms\?\.\['photo:cover'\]/);
  assert.equal((template.match(/item\.carolinaLayout\?\.transforms\?\.\['photo:' \+ slot\]/g)||[]).length,2);
  assert.match(template,/<CarolinaPhotoNode cover id="photo:cover"/);
  assert.doesNotMatch(template,/function PhotoCell\(/);
  assert.match(gesture,/const LONG_PRESS_MS = 550/);
  assert.match(gesture,/onCommitTransform\(id, current\.current\)/);
  assert.match(reader,/<CarolinaDocument item=\{item\}\/>/);
  assert.match(magazine,/<CarolinaCover item=\{item\}\/>/);
  assert.match(worker,/validCarolinaLayout\(q\.carolinaLayout\)/);
});


test('Diseño respeta las fotos originales y admite collage de 3, 5, 6 o hasta 12 bloques', () => {
  const template=src('features/templates/CarolinaTemplate.tsx');
  const canvas=src('features/editor/TemplateCanvasEditor.tsx');
  const layout=src('features/templates/carolina-layout.ts');
  const app=src('app/App.tsx');
  assert.match(template,/CAROLINA_SLOTS = 6/);
  assert.match(template,/const leftCount = order\.length === CAROLINA_SLOTS \? 2/);
  assert.match(template,/const left = order\.slice\(0, leftCount\)/);
  assert.match(template,/const right = order\.slice\(leftCount\)/);
  assert.match(canvas,/setPhotoOrder\(movePhotoSlot\(photoOrder, slot, direction\)\)/);
  assert.match(canvas,/setPhotoOrder\(photoOrder\.filter\(index => index !== slot\)\)/);
  assert.match(canvas,/gallery\[next\] = gallery\[slot\] \|\| ''/);
  assert.match(layout,/photoOrder\?: number\[\]/);
  assert.match(app,/Array\.from\(\{ length: CAROLINA_MAX_SLOTS \}/);
});


test('Diseño tiene banco elegante dentro del panel contextual y fuentes por texto', () => {
  const catalog=src('features/templates/elegant-fonts.ts');
  const bank=src('features/editor/ElegantFontBank.tsx');
  const canvas=src('features/editor/TemplateCanvasEditor.tsx');
  const node=src('features/templates/CarolinaTextNode.tsx');
  const template=src('features/templates/CarolinaTemplate.tsx');
  const worker=readFileSync(new URL('../worker/index.ts',import.meta.url),'utf8');
  const magazine=src('features/magazine/FlipMagazine.tsx');
  assert.match(catalog,/fonts\.googleapis\.com\/css2\?family=/);
  assert.match(catalog,/typeof document === 'undefined'/);
  assert.match(bank,/elegantFontFamily\(font\.id\)/);
  assert.match(bank,/ELEGANT_FONT_GROUPS\.map/);
  assert.match(bank,/input type="search"/);
  const dock=src('features/editor/TextStyleDock.tsx');
  assert.match(dock, /<ElegantFontBank inline/);
  assert.match(canvas, /<TextStyleDock textId=\{lastTextId\}/);
  assert.match(canvas, /updateLayout\(\{fonts\}\)/);
  assert.doesNotMatch(canvas, /defaultFont:font \|\| undefined/);
  assert.doesNotMatch(canvas, /Abrir banco de tipografías/);
  assert.match(dock, /Tipografía/);
  assert.match(template,/fontId=\{item\.carolinaLayout\?\.fonts\?\.\[id\] \|\| item\.carolinaLayout\?\.defaultFont\}/);
  assert.match(node,/fontFamily:elegantFontFamily\(fontId\)/);
  assert.match(worker,/validCarolinaLayout\(q\.carolinaLayout\)/);
  assert.match(magazine,/JSON\.stringify\(item\.carolinaLayout\)/);
});


test('Un toque abre cinco switches contextuales para personalizar una sola letra o párrafo', () => {
  const canvas=src('features/editor/TemplateCanvasEditor.tsx');
  const dock=src('features/editor/TextStyleDock.tsx');
  const bank=src('features/editor/ElegantFontBank.tsx');
  const node=src('features/templates/CarolinaTextNode.tsx');
  const template=src('features/templates/CarolinaTemplate.tsx');
  assert.match(canvas, /onTap: id => \{ setTransformingId\(null\); setEditingId\(id\); setLastTextId\(id\)/);
  assert.match(canvas, /<TextStyleDock textId=\{lastTextId\}/);
  assert.match(canvas, /<button type="button" onClick=\{addFreeText\}>\+ Texto<\/button>/);
  assert.doesNotMatch(canvas, /<Type size=\{16\}\/> Tipografías/);
  assert.match(canvas, /onFontChange=\{chooseFont\} onStyleChange=\{changeTextStyle\}/);
  assert.match(canvas, /fonts\[lastTextId\]=font/);
  assert.match(canvas, /updateLayout\(\{textStyles\}\)/);
  for (const label of ['Tipografía','Color','Tamaño','Ancho','Alto']) {
    assert.ok(dock.includes("label:'"+label+"'"),label);
  }
  assert.match(dock, /type="color"/);
  assert.match(dock, /type="range"/);
  assert.match(bank, /inline=false/);
  assert.match(node, /textStyle\?\.stretchX/);
  assert.match(node, /fontSize:textStyle.size \+ '%'/);
  assert.match(template, /textStyle=\{item\.carolinaLayout\?\.textStyles\?\.\[id\]\}/);
});

test('Pulsación larga: papelera compartida para fotos y texto, sin borrar R2', () => {
  const canvas=src('features/editor/TemplateCanvasEditor.tsx');
  const gesture=src('features/templates/useCarolinaGesture.ts');
  assert.match(canvas,/data-hn-text-trash/);
  assert.match(canvas,/onClick=\{\(\)=>removeElement\(transformingId\)\}/);
  assert.match(canvas,/if \(hit\) removeElement\(id\)/);
  assert.match(canvas,/const isPhotoId =/);
  assert.match(canvas,/const removePhoto = \(id:string\) =>/);
  assert.match(canvas,/const removeElement=\(id:string\) => isPhotoId\(id\) \? removePhoto\(id\) : removeText\(id\)/);
  assert.match(canvas,/onDrop: \(id,x,y\) =>/);
  assert.match(canvas,/setTrashHovered\(overTrash\(x,y\)\)/);
  assert.match(canvas,/delete transforms\[id\]; delete fonts\[id\]; delete textStyles\[id\]/);
  assert.match(gesture,/onDrop\?\.\(id,x,y\)/);
  assert.match(gesture,/if \(!dropped && JSON\.stringify\(current\.current\)/);
  assert.match(canvas,/if \(transformingId && !event\.isPrimary\) return/);
});


test('Libro 3D refleja exactamente páginas incluidas y nunca crea contraportada ficticia',()=>{
  const flip=src('features/magazine/FlipMagazine.tsx');
  const document=src('features/templates/CarolinaTemplate.tsx');
  const canvas=src('features/editor/TemplateCanvasEditor.tsx');
  const layout=src('features/templates/carolina-layout.ts');
  assert.match(flip,/const selectedPages = carolinaPageOrder\(item\.carolinaLayout\)/);
  assert.match(flip,/const total = item\.style === 'carolina' \? selectedPages\.length : 6/);
  assert.match(flip,/if \(pages\.length === 1\)/);
  assert.match(flip,/selectedPages\.map\(selectedPage =>/);
  assert.doesNotMatch(flip,/<CarolinaBlankReverse\/>/);
  assert.match(document,/carolinaPageOrder\(item\.carolinaLayout\)\.map\(page=>/);
  assert.match(canvas,/const setPageOrder=\(order:CarolinaPageId\[\]\)=>/);
  assert.match(canvas,/const togglePage=\(id:CarolinaPageId\)=>/);
  assert.match(canvas,/const shiftPage=\(id:CarolinaPageId,delta:-1\|1\)=>/);
  assert.match(canvas,/Páginas seleccionadas para la revista/);
  assert.match(canvas,/setPage\(selectedPages\[pageIndex\+1\]\)/);
  assert.match(layout,/pageOrder\?: CarolinaPageId\[\]/);
});

test('Añadir fotos en las tres hojas y borrar con pulsación larga sin tocar R2',()=>{
  const canvas=src('features/editor/TemplateCanvasEditor.tsx');
  const app=src('app/App.tsx');
  const template=src('features/templates/CarolinaTemplate.tsx');
  const photo=src('features/templates/CarolinaPhotoNode.tsx');
  const layout=src('features/templates/carolina-layout.ts');
  assert.match(canvas,/onClick=\{addPhotoAnywhere\}/);
  assert.match(canvas,/const addPhotoAnywhere=\(\)=>/);
  assert.match(canvas,/if \(page===1\) \{ addPhotoBlock\(\); return; \}/);
  assert.match(canvas,/setTarget\('extra:'\+id\)/);
  assert.match(canvas,/onSelectExtraPhoto=\{id=>open\('extra:'\+id\)\}/);
  assert.match(canvas,/const removePhoto = \(id:string\) =>/);
  assert.match(canvas,/const removeElement=\(id:string\) => isPhotoId\(id\) \? removePhoto\(id\) : removeText\(id\)/);
  assert.match(canvas,/onClick=\{\(\)=>removeElement\(transformingId\)\}/);
  assert.match(canvas,/const hit=overTrash\(x,y\)/);
  assert.doesNotMatch(canvas, /original && transformingId && !transformingId\.startsWith\('photo:'\)/);
  assert.match(template,/function ExtraPhotos/);
  assert.match(template,/page=\{0\} interaction=\{interaction\} onSelectPhoto/);
  assert.match(template,/page=\{1\} interaction=\{interaction\} onSelectPhoto/);
  assert.match(template,/page=\{2\} interaction=\{interaction\} onSelectPhoto/);
  assert.match(photo,/hn-carolina-floating-photo/);
  assert.match(app,/target\.startsWith\('extra:'\)/);
  assert.match(layout,/photo-extra:\[a-f0-9-\]\{36\}/);
});
