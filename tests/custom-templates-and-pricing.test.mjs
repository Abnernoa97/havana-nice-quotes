import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createQuoteDraft,duplicateQuote,createOwnTemplate} from '../src/features/quotes/model.ts';
const src=p=>readFileSync(new URL('../src/'+p,import.meta.url),'utf8');
test('Duplicar cotización crea otro registro independiente',()=>{
 const source={...createQuoteDraft('hn-source'),name:'Anna & Tim',price:25000,
 designLayout:{extras:[{id:'x',page:0,text:'Text'}],photoStyles:{'photo:cover':{opacity:80}}}};
 const copy=duplicateQuote(source,'hn-new');
 assert.notEqual(copy.id,source.id);assert.equal(copy.name,source.name);
 assert.equal(copy.price,source.price);copy.designLayout.extras[0].text='Changed';
 assert.equal(source.designLayout.extras[0].text,'Text');
});
test('Plantilla propia y su reutilización no arrastran datos personales',()=>{
 const source={...createQuoteDraft('hn-a'),name:'Client',client:'mail',price:45000,
 designLayout:{pageOrder:[0,2]}};
 const tpl=createOwnTemplate('hn-tpl',source);
 assert.equal(tpl.isTemplate,true);assert.equal(tpl.name,'');assert.equal(tpl.price,0);
 assert.deepEqual(tpl.designLayout.pageOrder,[0,2]);
 const quote=duplicateQuote(tpl,'hn-quote',true);
 assert.equal(quote.isTemplate,undefined);assert.equal(quote.templateName,undefined);
});
test('Pestañas y anticipo scroll en flujo',()=>{
 const editor=src('features/editor/QuoteEditorScreen.tsx');
 assert.ok(editor.indexOf('<BookOpen size={16}/> Estilos')<editor.indexOf('<PenLine size={16}/> Datos'));
 const nav=src('app/native-navigation.ts');
 assert.ok(nav.includes("tab: 'styles', preview: false"));
 const css=src('features/editor/quote-pricing.css');
 assert.ok(css.includes('position:static; width:100%; margin-top:9px;'));
 assert.ok(!css.includes('position:absolute; top:calc(100% + 6px)'));
});
test('Mis plantillas y cotizaciones existentes se copian desde Estilos',()=>{
 const styles=src('features/editor/styles/EditorialStyles.tsx');
 for(const label of ['Crear plantilla','Utilizar cotización existente','Mis plantillas'])assert.ok(styles.includes(label));
 const app=src('app/App.tsx');
 assert.ok(app.includes('const clientQuotes = quotes.filter(quote => !quote.isTemplate)'));
});
test('Los cuatro estilos editoriales tienen composiciones internas originales',()=>{
 const css=src('features/templates/editorial-template.css');
 for(const key of ['vogue','lane','junebug','nyt']){
  assert.ok(css.includes('.hn-style-'+key+'.hn-editorial-cover .hn-editorial-hero'));
  assert.ok(css.includes('.hn-style-'+key+'.hn-editorial-collage .hn-carolina-collage'));
 }
});
