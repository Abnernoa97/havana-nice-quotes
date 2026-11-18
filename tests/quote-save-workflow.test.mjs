import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createOwnTemplate,createQuoteDraft,duplicateQuote,filterQuotes,QUOTE_FILTERS} from '../src/features/quotes/model.ts';
const source=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('Una plantilla no es una cotización ni aparece en sus filtros',()=>{
 const template=createOwnTemplate('hn-template');
 assert.equal(template.isTemplate,true);
 assert.equal(template.designLayout.pageOrder[0],3);
 assert.deepEqual(filterQuotes([template],'Todas',''),[]);
 const fromTemplate=duplicateQuote(template,'hn-quote',true);
 assert.equal(fromTemplate.isTemplate,undefined);
 assert.equal(fromTemplate.templateName,undefined);
 assert.equal(fromTemplate.quoteTitle,undefined);
 assert.equal(fromTemplate.status,'Borrador');
 assert.equal(template.isTemplate,true);
});

test('Ninguna cotización nueva se guarda automáticamente antes del diálogo',()=>{
 const app=source('src/app/App.tsx');
 const store=source('src/features/quotes/useQuoteStore.ts');
 const begin=app.split('const addQuote = () => {')[1].split('const createTemplate =')[0];
 const duplicate=app.split('const reuseQuote =')[1].split('const editOwnTemplate =')[0];
 assert.match(begin,/setWorkingQuote\(createQuoteDraft\(id\)\)/);
 assert.doesNotMatch(begin,/setQuotes\(/);
 assert.match(duplicate,/setWorkingQuote\(clone\)/);
 assert.doesNotMatch(duplicate,/setQuotes\(/);
 assert.match(app,/if\(item\.isTemplate\)\{/);
 assert.match(app,/setSaveDialogOpen\(true\)/);
 assert.match(app,/if\(workingQuote\?\.id===saved\.id\)\{/);
 assert.match(app,/setQuotes\(list=>\[saved,\.\.\.list\.filter/);
 assert.match(app,/quoteTitle:cleanTitle,status/);
 assert.match(app,/const ok=await flush\(\)/);
 assert.match(store,/pending\.current\.set\(quote\.id, quote\)/);
 assert.doesNotMatch(store,/localStorage/);
});

test('Guardar exige nombre y diferencia borrador de lista para enviar sin enviar correo',()=>{
 const modal=source('src/features/editor/QuoteSaveDialog.tsx');
 const app=source('src/app/App.tsx');
 const api=source('worker/index.ts');
 assert.match(modal,/Escribe el nombre de esta cotización/);
 assert.match(modal,/Guardar como borrador/);
 assert.match(modal,/Guardar como listo para enviar/);
 assert.match(modal,/save\('Borrador'\)/);
 assert.match(modal,/save\('Listo para enviar'\)/);
 assert.doesNotMatch(modal,/hn-save-hint|hn-save-note|autoFocus/);
 assert.match(app,/if\(!cleanTitle\|\|cleanTitle\.length>150\)return/);
 assert.match(api,/q\.quoteTitle === undefined/);
 assert.match(api,/Listo para enviar/);
 assert.deepEqual(QUOTE_FILTERS,['Todas','Borrador','Listo para enviar','Enviadas']);
 assert.doesNotMatch(app,/window\.location\.href=['"]mailto:/);
});

test('El listado usa título del archivo, preserva nombre de pareja y estados históricos',()=>{
 const list=source('src/features/quotes/QuotesScreen.tsx');
 const home=source('src/features/home/HomeScreen.tsx');
 const types=source('src/features/quotes/types.ts');
 assert.match(list,/quoteDisplayName\(q\)/);
 assert.match(list,/quoteDisplayStatus\(q\.status\)/);
 assert.match(home,/quoteDisplayName\(q\)/);
 assert.match(types,/quoteTitle\?: string/);
 const q={...createQuoteDraft('hn-test'),name:'Ellie & Liam',quoteTitle:'Cotización Ellie y Liam 2027',status:'Listo para enviar'};
 assert.equal(filterQuotes([q],'Listo para enviar','Ellie y Liam').length,1);
 assert.equal(filterQuotes([q],'Enviadas','Ellie').length,0);
 const historic={...q,id:'hn-sent',status:'Aceptada'};
 assert.equal(filterQuotes([historic],'Enviadas','').length,1);
});

test('Revista 3D y Scroll no se rediseñan en este cambio',()=>{
 const magazine=source('src/features/magazine/FlipMagazine.tsx');
 const publish=source('src/features/editor/QuotePublishPanel.tsx');
 assert.match(publish,/<FlipMagazine item=\{item\}\/>/);
 assert.match(publish,/<Proposal item=\{item\}/);
 assert.match(magazine,/carolinaPageOrder/);
});

test('Solo un botón Guardar y diálogo centrado con fondo desenfocado y dos destinos',()=>{
 const editor=source('src/features/editor/QuoteEditorScreen.tsx');
 const modal=source('src/features/editor/QuoteSaveDialog.tsx');
 const app=source('src/app/App.tsx');
 const css=source('src/features/editor/quote-save-dialog.css');
 assert.equal((editor.match(/<Save size=\{16\}\/> Guardar/g)||[]).length,1);
 assert.doesNotMatch(editor,/Guardar plantilla/);
 assert.equal((modal.match(/className="hn-save-(draft|ready)"/g)||[]).length,2);
 assert.doesNotMatch(modal,/onSaveTemplate|hn-save-template|Guardar plantilla/);
 assert.match(app,/setSaveDialogOpen\(true\)/);
 assert.match(app,/\{saveDialogOpen && item && \(/);
 assert.match(css,/backdrop-filter:blur\(8px\)/);
 assert.match(css,/place-items:center/);
 assert.doesNotMatch(css,/align-items:end/);
});

test('Guardar cotización desde plantilla no sustituye ni altera el diseño original',()=>{
 const app=source('src/app/App.tsx');
 const model=source('src/features/quotes/model.ts');
 assert.match(app,/if\(item\.isTemplate\)\{/);
 assert.match(app,/duplicateQuote\(item,ids\.quoteId,true\)/);
 assert.match(app,/templateQuoteSave\.current=ids/);
 assert.match(app,/setQuotes\(list=>\[saved,\.\.\.list\.filter\(q=>q\.id!==saved\.id\)\]\)/);
 assert.match(app,/routeTo\(\{active:'empty',section:'editor'/);
 assert.match(app,/closedAfterSave\.current\.add\(item\.id\)/);
 assert.match(model,/delete next\.isTemplate/);
 assert.match(model,/delete next\.templateName/);
});

test('Mantener pulsada una plantilla revela un bote rojo y permite restauración',()=>{
 const styles=source('src/features/editor/styles/EditorialStyles.tsx');
 const css=source('src/features/editor/styles/editorial-styles.css');
 const editor=source('src/features/editor/QuoteEditorScreen.tsx');
 const app=source('src/app/App.tsx');
 const worker=source('worker/index.ts');
 assert.match(styles,/onPointerDown=\{event=>beginHold\(template\.id,event\)\}/);
 assert.match(styles,/setTimeout\(\(\)=>\{/);
 assert.match(styles,/onPointerCancel=\{cancelHold\}/);
 assert.match(styles,/className="hn-own-template-delete"/);
 assert.match(styles,/<Trash2 size=\{20\}\/>/);
 assert.match(styles,/onDeleteOwnTemplate\(template\.id\)/);
 assert.match(editor,/onDeleteOwnTemplate=\{onDeleteOwnTemplate\}/);
 assert.match(app,/onDeleteOwnTemplate=\{id=>void moveQuoteToTrash\(id\)\}/);
 assert.match(app,/window\.confirm\('¿Enviar a Papelera la '/);
 assert.match(app,/method:'DELETE',credentials:'same-origin'/);
 assert.match(css,/\.hn-own-template \.hn-own-template-delete/);
 assert.match(worker,/isTemplate:q\.isTemplate===true/);
 assert.match(worker,/kind:'quote'/);
});

test('Guardar es minimalista: sin párrafos ni teclado automático, y limpia el editor solo tras éxito',()=>{
 const app=source('src/app/App.tsx');
 const dialog=source('src/features/editor/QuoteSaveDialog.tsx');
 const css=source('src/features/editor/quote-save-dialog.css');
 assert.match(dialog,/<label htmlFor="hn-quote-file-name">Nombre de la cotización<\/label>/);
 assert.doesNotMatch(dialog,/autoFocus|hn-save-hint|hn-save-note|hn-save-template/);
 assert.match(dialog,/Guardar como borrador/);
 assert.match(dialog,/Guardar como listo para enviar/);
 assert.match(css,/backdrop-filter:blur\(8px\)/);
 assert.match(app,/if\(ok\)\{/);
 assert.match(app,/routeTo\(\{active:'empty',section:'editor'/);
 assert.match(app,/closedAfterSave\.current\.add\(saved\.id\)/);
 assert.match(app,/closedAfterSave\.current\.delete\(id\)/);
 assert.match(app,/useAppHistory\('empty'\)/);
 assert.doesNotMatch(app,/\|\| clientQuotes\[0\] \|\| ownTemplates\[0\]/);
 assert.match(app,/setWorkingQuote\(current=>current\?\.id===active/);
});
test('Google Translate y la selección solo se inhiben en zonas de lectura no editables',()=>{
 const main=source('src/main.tsx');
 const canvas=source('src/features/editor/canvas/template-canvas.css');
 const global=source('src/shared/styles/index.css');
 const text=source('src/features/templates/CarolinaTextNode.tsx');
 assert.match(main,/addEventListener\('selectstart'/);
 assert.match(main,/addEventListener\('contextmenu'/);
 assert.match(main,/nativeEditable\(event\.target\)/);
 assert.match(global,/#root input,#root textarea/);
 assert.match(canvas,/-webkit-touch-callout:none/);
 assert.match(text,/onContextMenu=\{event => event\.preventDefault\(\)\}/);
});
