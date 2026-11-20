import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const src = file => readFileSync(new URL('../src/' + file, import.meta.url), 'utf8');
const canvasSource=()=>["TemplateCanvasEditor.tsx","components/CanvasPageToolbar.tsx","components/CanvasPageContent.tsx","interactions/createCanvasTextInteraction.ts","media/canvasPhotoUrl.ts","media/createCanvasPhotoActions.ts","interactions/createCanvasRemovalActions.ts","interactions/createCanvasTextStyleActions.ts","components/CanvasPagePager.tsx","hooks/useCanvasPageActions.ts"].map(p=>src('features/editor/canvas/'+p)).join('\n');

test('Plantilla real y cinco estilos mantienen ambos modos editor/cliente', () => {
  const editor = src('features/editor/QuoteEditorScreen.tsx');
  const app = src('app/App.tsx');
  const styles = src('features/editor/styles/EditorialStyles.tsx');
  const registry=src('features/templates/template-registry.ts');
  for (const id of ['carolina','libre','vogue','lane','junebug','nyt'])
    assert.ok(registry.includes(id+':{name:'),id);
  assert.match(styles,/TEMPLATE_IDS\.map/);
  assert.match(editor, /onChange=\{style => edit\('style', style\)\}/);
  const publish = src('features/editor/QuotePublishPanel.tsx');
  assert.match(editor, /<QuotePublishPanel item=\{item\}/);
  assert.match(publish, /onClick=\{\(\) => edit\('readingMode', 'flip'\)\}/);
  assert.match(publish, /onClick=\{\(\) => edit\('readingMode', 'scroll'\)\}/);
  const review=src('features/quotes/QuoteReviewPage.tsx');
  assert.match(app, /<QuoteReviewPage item=\{item\}/);
  assert.match(review, /mode==='flip'\?<FlipMagazine item=\{item\}/);
});

test('La biblioteca R2 y las fotos subidas alimentan la portada', () => {
  const design = src('features/editor/QuoteDesignPanel.tsx');
  const app = src('app/App.tsx');
  const canvas = canvasSource();
  assert.match(design, /<TemplateCanvasEditor item=\{item\}/);
  const picker=src('features/editor/photos/PhotoSourcePicker.tsx');
  assert.match(picker, /photos\.map\(photo=>/);
  assert.match(canvas, /edit\('cover',video\?'':url\)/);
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
  const editorial=src('features/templates/EditorialTemplate.tsx');
  assert.match(magazine,/EditorialCover/);
  assert.match(editorial,/id="field:note" value=\{item\.note\}/);
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
  assert.match(bank, /photos\.map\(\(photo,index\) =>/);
  assert.match(bank, /type="file"/);
  assert.match(bank, /multiple hidden disabled=\{uploading \|\| trashing\}/);
  const shared = src('features/videos/MediaLibraryStats.tsx');
  assert.match(shared, /Actualizar/);
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
  const canvas = canvasSource();
  const picker = src('features/editor/photos/PhotoSourcePicker.tsx');
  assert.match(picker, /type="file" accept="image\/jpeg/);
  assert.match(canvas, /onUploadPhoto\(file,target\)/);
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
  assert.match(gallery, /photos\.map\(\(photo,index\) =>/);
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
  const menu = src('features/trash/TrashFilterMenu.tsx');
  assert.match(menu, /Archivos/);
  assert.match(worker, /deleted_at IS NOT NULL/);
  assert.match(worker, /await env\.MEDIA\.delete\(photo\.object_key\)/);
});


test('Carolina es la plantilla real principal y separada de los estilos editoriales', () => {
  const styles = src('features/editor/styles/EditorialStyles.tsx');
  const types = src('features/quotes/types.ts');
  const editor = src('features/editor/QuoteEditorScreen.tsx');
  const registry=src('features/templates/template-registry.ts');
  assert.match(registry,/name:'HAVANA NICE Original · Carolina'/);
  assert.match(styles, /Plantillas originales/);
  assert.match(styles, /Estilos editoriales especiales/);
  assert.match(types, /QuoteStyle = TemplateStyle/);
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
  assert.match(template, /carolinaPageOrder\(item\.designLayout\)\.map\(page=>/);
  assert.match(template, /<CarolinaCover key="cover" item=\{item\}\/>/);
  assert.match(template, /<CarolinaCollage key="collage" item=\{item\}\/>/);
  assert.match(template, /<CarolinaTerms key="terms" item=\{item\}\/>/);
  assert.match(proposal, /templateFamily\(styleName\)==='carolina'/);
  const canvas = canvasSource();
  assert.match(design, /<TemplateCanvasEditor item=\{item\}/);
  assert.match(canvas, /<CarolinaCollage item=\{renderItem\} interaction=\{textInteraction\}/);
  assert.match(canvas, /edit\('gallery',\s*gallery\)/);
  assert.doesNotMatch(details, /carolinaCopy|hn-carolina-copy-editor/);
  assert.match(magazine, /templateFamily\(item\.style\)==='carolina'/);
  assert.doesNotMatch(magazine, /<CarolinaBlankReverse\/>/);
  assert.match(magazine, /selectedPages\.map\(selectedPage=>/);
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
  assert.match(css, /position:static; width:100%; margin-top:9px/);
});


test('Diseño muestra las páginas reales y permite fotos nativas/R2 por recuadro, sin widgets antiguos', () => {
  const design = src('features/editor/QuoteDesignPanel.tsx');
  const canvas = canvasSource();
  const template = src('features/templates/CarolinaTemplate.tsx');
  const app = src('app/App.tsx');
  const stylesheet = readFileSync(new URL('../src/shared/styles/index.css', import.meta.url),'utf8');
  assert.match(canvas, /CAROLINA_PAGE_TITLES\[page as 0\|1\|2\]/);
  assert.match(canvas, /<CarolinaCover item=\{renderItem\} interaction=\{textInteraction\}[\s\S]*?onSelectCover=/);
  assert.match(canvas, /<CarolinaCollage item=\{renderItem\} interaction=\{textInteraction\}/);
  assert.match(canvas, /<CarolinaTerms item=\{renderItem\} interaction=\{textInteraction\}\s+onSelectExtraPhoto=/);
  const picker=src('features/editor/photos/PhotoSourcePicker.tsx');
  assert.match(canvas, /<PhotoSourcePicker target=\{target\}/);
  assert.match(picker, /Mi teléfono/);
  assert.match(picker, /Banco de fotos/);
  assert.match(picker, /photos\.map\(photo=>/);
  assert.match(template, /onSelectPhoto\?: \(index: number\) => void/);
  assert.match(canvas, /gallery\[target\]=url/);
  assert.doesNotMatch(design, /font-options|swatches|photo-options|CarolinaGalleryEditor|upload-btn/);
  assert.doesNotMatch(stylesheet, /\.photo-options \{|\.font-options \{|\.swatches \{/);
});


test('Carolina: todos los textos variables se editan tocando la página y llegan al mismo modelo', async () => {
  const model = src('features/quotes/types.ts');
  const editor = canvasSource();
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
  assert.match(editor, /edit\('designLayout',/);
  for (const field of ['name', 'date', 'location', 'note', 'package', 'desc', 'price', 'deposit',
    'performance', 'musicians', 'crew', 'backline', 'logistics', 'balance', 'production',
    'connections', 'space']) assert.ok(fields.includes('  ' + field + ':'), 'Falta el campo '+field);
  assert.match(template, /export function CarolinaTerms\(\{ item, interaction, onSelectExtraPhoto \}/);
  assert.match(template, /<CarolinaTextNode id=\{id\} text=\{value\}/);
  assert.match(model, /carolinaCopy\?: Partial<CarolinaCopy>/);
  assert.match(model, /designLayout\?: CarolinaLayout/);
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
  const cover=src('features/templates/CoverMediaNode.tsx');
  assert.match(cover,/item\.designLayout\?\.transforms\?\.\['photo:cover'\]/);
  assert.equal((template.match(/item\.designLayout\?\.transforms\?\.\['photo:' \+ slot\]/g)||[]).length,2);
  assert.match(template,/<CoverMediaNode item=\{item\} interaction=\{interaction\}/);
  assert.doesNotMatch(template,/function PhotoCell\(/);
  assert.match(gesture,/const LONG_PRESS_MS = 550/);
  assert.match(gesture,/onCommitTransform\(id, current\.current\)/);
  assert.match(reader,/<CarolinaDocument item=\{item\}\/>/);
  assert.match(magazine,/<CarolinaCover item=\{item\}\/>/);
  assert.match(worker,/validCarolinaLayout\(q\.designLayout\)/);
});


test('Diseño respeta las fotos originales y admite collage de 3, 5, 6 o hasta 12 bloques', () => {
  const template=src('features/templates/CarolinaTemplate.tsx');
  const canvas=canvasSource();
  const layout=src('features/templates/carolina-layout.ts');
  const app=src('app/App.tsx');
  assert.match(template,/CAROLINA_SLOTS = 6/);
  assert.match(template,/const leftCount = order\.length === CAROLINA_SLOTS \? 2/);
  assert.match(template,/const left = order\.slice\(0, leftCount\)/);
  assert.match(template,/const right = order\.slice\(leftCount\)/);
  assert.match(canvas,/const selectPhoto = \(id:string\) =>/);
  assert.match(canvas,/updateLayout\(\{transforms,photoStyles\}\)/);
  assert.doesNotMatch(canvas,/reorderPhotoBlock|duplicatePhotoBlock|setPhotoOrder\(photoOrder\.filter\(/);
  assert.match(layout,/photoOrder\?: number\[\]/);
  assert.match(template,/Array\.from\(\{ length: CAROLINA_MAX_SLOTS \}/);
});


test('Diseño tiene banco elegante dentro del panel contextual y fuentes por texto', () => {
  const catalog=src('features/templates/elegant-fonts.ts');
  const bank=src('features/editor/texts/ElegantFontBank.tsx');
  const canvas=canvasSource();
  const node=src('features/templates/CarolinaTextNode.tsx');
  const template=src('features/templates/CarolinaTemplate.tsx');
  const worker=readFileSync(new URL('../worker/index.ts',import.meta.url),'utf8');
  const magazine=src('features/magazine/FlipMagazine.tsx');
  assert.match(catalog,/fonts\.googleapis\.com\/css2\?family=/);
  assert.match(catalog,/typeof document === 'undefined'/);
  assert.match(bank,/elegantFontFamily\(font\.id\)/);
  assert.match(bank,/ELEGANT_FONT_GROUPS\.map/);
  assert.match(bank,/input type="search"/);
  const dock=src('features/editor/texts/TextStyleDock.tsx');
  assert.match(dock, /<ElegantFontBank inline/);
  assert.match(canvas, /<TextStyleDock textId=\{lastTextId\}/);
  assert.match(canvas, /updateLayout\(\{fonts\}\)/);
  assert.doesNotMatch(canvas, /defaultFont:font \|\| undefined/);
  assert.doesNotMatch(canvas, /Abrir banco de tipografías/);
  assert.match(dock, /Tipografía/);
  assert.match(template,/fontId=\{item\.designLayout\?\.fonts\?\.\[id\] \|\| item\.designLayout\?\.defaultFont\}/);
  assert.match(node,/fontFamily:elegantFontFamily\(fontId\)/);
  assert.match(worker,/validCarolinaLayout\(q\.designLayout\)/);
  assert.match(magazine,/JSON\.stringify\(item\.designLayout\)/);
});


test('Un texto tiene cinco opciones pero muestra solo la herramienta elegida', () => {
  const canvas=canvasSource();
  const dock=src('features/editor/texts/TextStyleDock.tsx');
  const bank=src('features/editor/texts/ElegantFontBank.tsx');
  const node=src('features/templates/CarolinaTextNode.tsx');
  const template=src('features/templates/CarolinaTemplate.tsx');
  assert.match(canvas, /onTap: id => \{ setShowPageMenu\(false\);setActiveTextTool\(null\);setSelectedPhotoId\(null\); setTransformingId\(null\); setEditingId\(id\); setLastTextId\(id\)/);
  assert.match(dock, /\{!tab && <div className="hn-text-dock-switches"/);
  assert.match(canvas, /<TextStyleDock textId=\{lastTextId\}/);
  assert.match(canvas,/onAddText=\{addFreeText\}/);
  assert.match(canvas, /<button type="button" onClick=\{onAddText\}>\+ Texto<\/button>/);
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
  assert.match(template, /textStyle=\{item\.designLayout\?\.textStyles\?\.\[id\]\}/);
});

test('Pulsación larga: papelera compartida para fotos y texto, sin borrar R2', () => {
  const canvas=canvasSource();
  const gesture=src('features/templates/useCarolinaGesture.ts');
  assert.match(canvas,/data-hn-text-trash/);
  assert.match(canvas,/onClick=\{\(\)=>removeElement\(transformingId\)\}/);
  assert.match(canvas,/if \(hit\) removeElement\(id\)/);
  assert.match(canvas,/const isPhotoId =/);
  assert.match(canvas,/const removePhoto = \(id:string\) =>/);
  assert.match(canvas,/const removeElement\s*=\s*\(id:string\) => isPhotoId\(id\) \? removePhoto\(id\) : removeText\(id\)/);
  assert.match(canvas,/onDrop: \(id,x,y\) =>/);
  assert.match(canvas,/setTrashHovered\(overTrash\(x,y\)\)/);
  assert.match(canvas,/delete transforms\[id\]; delete fonts\[id\]; delete textStyles\[id\]/);
  assert.match(gesture,/onDrop\?\.\(id,x,y\)/);
  assert.match(gesture,/if \(!dropped && changed\)/);
  assert.match(gesture,/onDeselectTransform\?\.\(id\)/);
  assert.doesNotMatch(canvas,/if \(transformingId && !event\.isPrimary\) return/);
  assert.match(canvas,/onClickCapture=\{event=>/);
});


test('Libro 3D refleja exactamente páginas incluidas y nunca crea contraportada ficticia',()=>{
  const flip=src('features/magazine/FlipMagazine.tsx');
  const document=src('features/templates/CarolinaTemplate.tsx');
  const canvas=canvasSource();
  const layout=src('features/templates/carolina-layout.ts');
  assert.match(flip,/const selectedPages = carolinaPageOrder\(item\.designLayout\)/);
  assert.match(flip,/const total = selectedPages\.length/);
  assert.match(flip,/if \(pages\.length === 1\)/);
  assert.match(flip,/selectedPages\.map\(selectedPage=>/);
  assert.doesNotMatch(flip,/<CarolinaBlankReverse\/>/);
  assert.match(document,/carolinaPageOrder\(item\.designLayout\)\.map\(page=>/);
  assert.match(canvas,/const duplicatePage=\(\)=>/);
  assert.match(canvas,/const addPage=\(kind\?:PageKind\)=>/);
  assert.match(canvas,/const deletePage=\(\)=>/);
  assert.doesNotMatch(canvas,/hn-canvas-page-actions/);
  assert.match(canvas,/aria-label="Duplicar página"/);
  assert.match(canvas,/aria-label="Eliminar página"/);
  assert.doesNotMatch(canvas,/hn-canvas-pages|Páginas seleccionadas para la revista/);
  assert.match(canvas,/className="hn-canvas-pager"/);
  assert.match(canvas,/onChangePage=\{changePage\}/);
   assert.match(canvas,/onClick=\{\(\)=>onChangePage\(1\)\}/);
  assert.match(canvas,/page===2 && !cleanCarolina && \(editorial/);
  assert.match(layout,/pageOrder\?: CarolinaPageId\[\]/);
});

test('Añadir fotos en las tres hojas y borrar con pulsación larga sin tocar R2',()=>{
  const canvas=canvasSource();
  const app=src('app/App.tsx');
  const template=src('features/templates/CarolinaTemplate.tsx');
  const photo=src('features/templates/CarolinaPhotoNode.tsx');
  const layout=src('features/templates/carolina-layout.ts');
  assert.match(canvas,/onAddPhoto=\{addPhotoAnywhere\}/);
  assert.match(canvas,/onClick=\{onAddPhoto\}/);
  assert.match(canvas,/const addPhotoAnywhere=\(\)=>/);
  assert.match(canvas,/if \(page===1 && !cleanCarolina\) \{ addPhotoBlock\(\); return; \}/);
  assert.match(canvas,/setTarget\(`extra:\$\{crypto\.randomUUID\(\)\}`\)/);
  assert.match(canvas,/onSelectExtraPhoto=\{id=>selectPhoto\('photo-extra:'\+id\)\}/);
  assert.match(canvas,/const removePhoto = \(id:string\) =>/);
  assert.match(canvas,/const removeElement\s*=\s*\(id:string\) => isPhotoId\(id\) \? removePhoto\(id\) : removeText\(id\)/);
  assert.match(canvas,/onClick=\{\(\)=>removeElement\(transformingId\)\}/);
  assert.match(canvas,/const hit=overTrash\(x,y\)/);
  assert.doesNotMatch(canvas, /original && transformingId && !transformingId\.startsWith\('photo:'\)/);
  assert.match(template,/function ExtraPhotos/);
  assert.match(template,/page=\{0\} interaction=\{interaction\} onSelectPhoto/);
  assert.match(template,/page=\{1\} interaction=\{interaction\} onSelectPhoto/);
  assert.match(template,/page=\{2\} interaction=\{interaction\} onSelectPhoto/);
  assert.match(photo,/hn-carolina-floating-photo/);
  assert.match(canvas,/target\.startsWith\('extra:'\)/);
  assert.match(layout,/photo-extra:\[a-f0-9-\]\{36\}/);
});


test('Edición móvil sin selección nativa y 3D con scroll vertical', () => {
  const gesture=src('features/templates/useCarolinaGesture.ts');
  const photo=src('features/templates/CarolinaPhotoNode.tsx');
  const textNode=src('features/templates/CarolinaTextNode.tsx');
  const editCss=readFileSync(new URL('../src/features/editor/canvas/template-canvas.css',import.meta.url),'utf8');
  const magazineCss=readFileSync(new URL('../src/features/magazine/flip-magazine.css',import.meta.url),'utf8');
  assert.match(gesture,/const onPointerCancel =/);
  assert.match(photo,/onPointerCancel=\{gesture\.onPointerCancel\}/);
  assert.match(textNode,/onPointerCancel=\{gesture\.onPointerCancel\}/);
  assert.match(editCss,/-webkit-touch-callout:none/);
  assert.match(magazineCss,/touch-action:pan-y pinch-zoom!important/);
  const magazine=src('features/magazine/FlipMagazine.tsx');
  assert.match(magazine,/mobileScrollSupport: true/);
});


test('Panel único de imágenes: un toque edita y una presión larga mueve o elimina', () => {
  const canvas=canvasSource();
  const dock=src('features/editor/photos/PhotoStyleDock.tsx');
  const photo=src('features/templates/CarolinaPhotoNode.tsx');
  const template=src('features/templates/CarolinaTemplate.tsx');
  const magazine=src('features/magazine/FlipMagazine.tsx');
  const gesture=src('features/templates/useCarolinaGesture.ts');
  const css=readFileSync(new URL('../src/features/editor/canvas/template-canvas.css',import.meta.url),'utf8');
  assert.match(canvas,/selectPhoto\('photo:cover'\)/);
  assert.match(canvas,/onSelectPhoto=\{index=>selectPhoto\('photo:'\+index\)\}/);
  assert.match(canvas,/<PhotoEditingWorkspace photoId=\{selectedPhotoId\}/);
  const workspace=src('features/editor/photos/PhotoEditingWorkspace.tsx');
  assert.match(workspace,/<PhotoStyleDock photoId=\{photoId\}/);
  assert.match(canvas,/onStyleChange=\{updatePhotoStyle\} onReplace=\{replacePhoto\}/);
  assert.match(canvas,/target===null/);
  assert.doesNotMatch(canvas,/hn-canvas-photo-actions|reorderPhotoBlock|duplicatePhotoBlock/);
  assert.doesNotMatch(css,/hn-canvas-photo-actions/);
  for(const label of ['Fondo','Colorizar','Recortar','Opacidad','Reemplazar','Viñeta'])
    assert.match(dock,new RegExp(label));
  assert.match(dock,/onReplace\(\)/);
  assert.match(dock,/onToolChange\(next==='crop'\|\|next==='vignette'/);
  assert.match(workspace,/onStyleChange\(\{vignetteX:Math\.round/);
  assert.match(workspace,/onStyleChange\(next\)/);
  assert.match(gesture,/LONG_PRESS_MS = 550/);
  assert.doesNotMatch(photo,/effectMoved\.current|imageEdit/);
  assert.match(template,/photoStyle=\{item\.designLayout\?\.photoStyles\?\.\[id\]\}/);
  assert.match(magazine,/<CarolinaCollage item=\{item\}/);
});

test('Reemplazar una fotografía mantiene sus efectos previos',()=>{
  const canvas=canvasSource();
  const app=src('app/App.tsx');
  const photo=src('features/templates/CarolinaPhotoNode.tsx');
  assert.match(canvas,/styles\[selectedPhotoId\] = \{ \.\.\.styles\[selectedPhotoId\], \.\.\.patch \}/);
  assert.match(canvas,/const replacePhoto = \(\) =>/);
  assert.match(canvas,/if\(target==='cover'\)\{/);
  assert.match(canvas,/edit\('coverVideo',video\?url:''\)/);
  assert.match(canvas,/gallery\[target\]=url/);
  assert.doesNotMatch(canvas,/delete styles\[selectedPhotoId\]/);
  assert.match(canvas,/gallery\[target\]=url/);
  assert.match(photo,/photoStyle\?\.opacity/);
});


test('Editor inmersivo: giro real, scroll independiente y controles anclados',()=>{
  const workspace=src('features/editor/photos/PhotoEditingWorkspace.tsx');
  const dock=src('features/editor/photos/PhotoStyleDock.tsx');
  const photo=src('features/templates/CarolinaPhotoNode.tsx');
  const model=src('features/templates/carolina-layout.ts');
  const css=readFileSync(new URL('../src/features/editor/photos/photo-style-dock.css',import.meta.url),'utf8');
  assert.doesNotMatch(workspace,/rotateCrop\(/);
  assert.match(workspace,/pinchCrop\(g\.start,g\.distance,distance\(positions\[0\],positions\[1\]\)\)/);
  assert.match(dock,/slider\('Girar izquierda \/ derecha','cropRotation'/);
  assert.match(workspace,/positions\.length>1/);
  assert.doesNotMatch(workspace,/cropRotation:rotation/);
  assert.match(dock,/slider\('Girar izquierda \/ derecha','cropRotation',-180,180,'°'\)/);
  assert.match(photo,/rotate\(' \+ \(photoStyle\?\.cropRotation/);
  assert.match(model,/cropRotation:\[-180,180\]/);
  assert.match(css,/\.hn-photo-workspace-stage\{overflow-y:auto/);
  assert.match(css,/\.hn-photo-workspace \.hn-photo-expanded\{overscroll-behavior-y:contain;touch-action:pan-y;-webkit-overflow-scrolling:touch\}/);
  assert.match(css,/\.hn-photo-workspace \.hn-photo-tools-rail\{flex-shrink:0\}/);
  assert.match(css,/\.hn-photo-workspace \.hn-photo-switches\{touch-action:pan-x\}/);
  assert.match(workspace,/const closeRef=useRef\(onClose\)/);
  assert.match(workspace,/\},\[\]\);/);
});

test('Fotos en fondo se recuperan por capas aunque el texto o una foto las cubra',()=>{
  const editor=canvasSource();
  const css=readFileSync(new URL('../src/features/editor/canvas/template-canvas.css',import.meta.url),'utf8');
  const templateCss=readFileSync(new URL('../src/features/templates/carolina-template.css',import.meta.url),'utf8');
  const gestures=src('features/templates/useCarolinaGesture.ts');
  const layerModel=src('features/editor/photos/photo-layers.ts');
  const layerPanel=src('features/editor/photos/PhotoLayersPanel.tsx');
  assert.match(editor,/const photoLayers=listPhotoLayers\(item,page\)/);
  assert.match(layerModel,/return \[\.\.\.backgroundCover,\.\.\.backgroundCollage,\.\.\.layeredPhotos\]/);
  assert.match(layerPanel,/> Capas <strong>/);
  assert.match(editor,/onEdit=\{selectPhoto\} onMove=\{movePhotoLayer\} onDelete=\{removePhoto\}/);
  assert.match(layerPanel,/onClick=\{\(\)=>onEdit\(layer\.id\)\}/);
  assert.match(layerPanel,/onClick=\{\(\)=>onMove\(layer\.id\)\}/);
  assert.match(layerPanel,/onClick=\{\(\)=>onDelete\(layer\.id\)\}/);
  assert.match(editor,/delete transforms\[id\]; delete photoStyles\[id\]/);
  const layerCss=readFileSync(new URL('../src/features/editor/photos/photo-layers.css',import.meta.url),'utf8');
  assert.match(layerCss,/\.hn-canvas-layers-list\{/);
  assert.match(templateCss,/\.hn-canvas \.hn-carolina-term-group\{pointer-events:none\}/);
  assert.match(templateCss,/\.hn-canvas \.hn-carolina-term-group \.hn-carolina-text-node\{pointer-events:auto\}/);
  assert.match(templateCss,/hn-carolina-floating-photo\.hn-photo-transforming/);
  assert.match(gestures,/interactionRef\.current\?\.transformingId===id/);
});


test('Edición de efectos fotográficos tiene un solo propietario',()=>{
 const canvas=canvasSource();
 const photo=src('features/templates/CarolinaPhotoNode.tsx');
 const gesture=src('features/templates/useCarolinaGesture.ts');
 assert.doesNotMatch(canvas,/imageEdit:/);
 assert.doesNotMatch(photo,/effectMoved|touchStart|effectMode|onDown =|onMove =/);
 assert.doesNotMatch(gesture,/imageEdit\?:/);
 assert.match(canvas,/<PhotoEditingWorkspace photoId=\{selectedPhotoId\}/);
});

test('El bloqueo de scroll ocurre exclusivamente tras pulsación larga',()=>{
  const hook=src('features/templates/useCarolinaGesture.ts');
  assert.match(hook,/addEventListener\('touchmove', preventDragScroll, \{passive:false\}\)/);
  assert.match(hook,/if \(longPressed\.current && event\.cancelable\) event\.preventDefault\(\)/);
});
