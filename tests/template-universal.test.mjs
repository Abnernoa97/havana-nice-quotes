import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {TEMPLATE_IDS,isTemplateStyle,templateFamily} from '../src/features/templates/template-registry.ts';
import {getDesignLayout,withDesignLayout} from '../src/features/templates/design-layout.ts';
import {validCarolinaLayout} from '../src/features/templates/carolina-layout.ts';
const src=p=>readFileSync(new URL('../src/'+p,import.meta.url),'utf8');
const mockQuote=(changes={})=>({
 id:'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',name:'Test',client:'',email:'',location:'',
 date:'',price:15000,deposit:40,status:'Borrador',cover:'',font:'editorial',
 color:'#18342f',note:'',package:'',desc:'',...changes
});
test('Todos los estilos registrados comparten editor; la lista única admite futuras plantillas',()=>{
 assert.deepEqual(TEMPLATE_IDS,['carolina','libre','vogue','lane','junebug','nyt']);
 for(const id of TEMPLATE_IDS){
   assert.equal(isTemplateStyle(id),true);
   assert.equal(templateFamily(id),id==='carolina'?'carolina':'editorial');
 }
 assert.equal(isTemplateStyle('__proto__'),false);
 assert.equal(isTemplateStyle('prototype'),false);
 assert.equal(isTemplateStyle('unknown'),false);
 const cards=src('features/editor/styles/EditorialStyles.tsx');
 const api=readFileSync(new URL('../worker/index.ts',import.meta.url),'utf8');
 assert.match(cards,/TEMPLATE_IDS\.map/);
 assert.match(api,/isTemplateStyle\(q\.style\)/);
});
test('Datos Carolina antiguos se preservan y primer cambio no los sobreescribe',()=>{
 const old={fixed:{brand:'MY BRAND'},textStyles:{'field:name':{color:'#FFFFFF'}},
   photoStyles:{'photo:cover':{cropRotation:20,opacity:35}},pageOrder:[2,0]};
 assert.equal(validCarolinaLayout(old),true);
 const legacy=mockQuote({carolinaLayout:old});
 assert.equal(getDesignLayout(legacy),old);
 assert.equal(withDesignLayout(legacy),legacy);
 const universal={...old,textStyles:{...old.textStyles,'field:name':{color:'#BDA577'}}};
 const edited={...legacy,designLayout:universal};
 assert.equal(getDesignLayout(edited),universal);
 assert.equal(edited.carolinaLayout,old);
 assert.equal(withDesignLayout(edited).carolinaLayout,universal);
 assert.deepEqual(getDesignLayout(edited).pageOrder,[2,0]);
});
test('Todos los estilos comparten tres páginas reales, controles y componentes',()=>{
 const canvas=src('features/editor/canvas/TemplateCanvasEditor.tsx');
 const doc=src('features/templates/EditorialTemplate.tsx');
 const old=src('features/templates/CarolinaTemplate.tsx');
 const scroll=src('features/client/Proposal.tsx');
 const book=src('features/magazine/FlipMagazine.tsx');
 const worker=readFileSync(new URL('../worker/index.ts',import.meta.url),'utf8');
 assert.match(canvas,/templateFamily\(item\.style\)==='editorial'/);
 assert.match(canvas,/edit\('designLayout',/);
 assert.match(canvas,/<EditorialCover item=\{item\} interaction=\{textInteraction\}/);
 assert.match(canvas,/<EditorialCollage item=\{item\} interaction=\{textInteraction\}/);
 assert.match(canvas,/<EditorialTerms item=\{item\} interaction=\{textInteraction\}/);
 assert.match(canvas,/<PhotoEditingWorkspace photoId=\{selectedPhotoId\}/);
 assert.match(canvas,/<TextStyleDock textId=\{lastTextId\}/);
 assert.match(canvas,/<PhotoLayersPanel layers=\{photoLayers\}/);
 assert.match(doc,/CarolinaPhotoNode/);
 assert.match(doc,/CarolinaTextNode/);
 assert.match(doc,/CarolinaCollage/);
 assert.match(doc,/ExtraPhotos/);
 assert.match(doc,/ExtraTexts/);
 assert.match(doc,/carolinaPageOrder\(item\.carolinaLayout\)/);
 assert.match(old,/export function CarolinaCover/);
 assert.match(scroll,/withDesignLayout\(raw\)/);
 assert.match(book,/withDesignLayout\(rawItem\)/);
 assert.match(book,/const total = selectedPages\.length/);
 assert.match(book,/<EditorialCover item=\{item\}/);
 assert.match(book,/<EditorialCollage item=\{item\}/);
 assert.match(book,/<EditorialTerms item=\{item\}/);
 assert.match(worker,/validCarolinaLayout\(q\.designLayout\)/);
});
