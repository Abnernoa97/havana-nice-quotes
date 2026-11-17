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
 assert.match(modal,/Guardar y enviar/);
 assert.match(modal,/save\('Borrador'\)/);
 assert.match(modal,/save\('Lista para enviar'\)/);
 assert.match(modal,/No la envía al cliente automáticamente/);
 assert.match(app,/if\(!cleanTitle\|\|cleanTitle\.length>150\)return/);
 assert.match(api,/q\.quoteTitle === undefined/);
 assert.match(api,/Lista para enviar/);
 assert.deepEqual(QUOTE_FILTERS,['Todas','Enviadas','Borrador','Listas para enviar']);
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
 const q={...createQuoteDraft('hn-test'),name:'Ellie & Liam',quoteTitle:'Cotización Ellie y Liam 2027',status:'Lista para enviar'};
 assert.equal(filterQuotes([q],'Listas para enviar','Ellie y Liam').length,1);
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
