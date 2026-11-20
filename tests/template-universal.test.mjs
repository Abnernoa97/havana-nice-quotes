import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {TEMPLATE_IDS,isTemplateStyle,templateFamily} from '../src/features/templates/template-registry.ts';
import {validCarolinaLayout} from '../src/features/templates/carolina-layout.ts';
const src=p=>readFileSync(new URL('../src/'+p,import.meta.url),'utf8');
const canvasSource=()=>["TemplateCanvasEditor.tsx","components/CanvasPageToolbar.tsx","components/CanvasPageContent.tsx","interactions/createCanvasTextInteraction.ts","media/canvasPhotoUrl.ts","media/createCanvasPhotoActions.ts","interactions/createCanvasRemovalActions.ts","interactions/createCanvasTextStyleActions.ts","components/CanvasPagePager.tsx","hooks/useCanvasPageActions.ts"].map(p=>src('features/editor/canvas/'+p)).join('\n');
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
test('Un único modelo universal; el diseño anterior no se lee ni mezcla',()=>{
 const layout={fixed:{brand:'MY BRAND'},textStyles:{'field:name':{color:'#FFFFFF'}},
  photoStyles:{'photo:cover':{cropRotation:20,opacity:35}},pageOrder:[2,0]};
 assert.equal(validCarolinaLayout(layout),true);
 const draft=mockQuote({designLayout:layout});
 assert.deepEqual(draft.designLayout,layout);
 const types=src('features/quotes/types.ts');
 const canvas=canvasSource();
 const proposal=src('features/client/Proposal.tsx');
 const magazine=src('features/magazine/FlipMagazine.tsx');
 assert.match(types,/designLayout\?: CarolinaLayout/);
 for(const file of [types,canvas,proposal,magazine]){
  assert.doesNotMatch(file,/carolinaLayout|withDesignLayout|getDesignLayout/);
 }
 assert.match(canvas,/export default function TemplateCanvasEditor\(\{ item, edit, photos, onUploadPhoto \}/);
 assert.match(proposal,/export default function Proposal\(\{item,styleName,embedded=false\}/);
 assert.match(magazine,/export default function FlipMagazine\(\{ item, clientView=false \}/);
});
test('Todos los estilos comparten el motor universal, con páginas originales y hojas libres',()=>{
 const canvas=canvasSource();
 const doc=src('features/templates/EditorialTemplate.tsx');
 const carolina=src('features/templates/CarolinaTemplate.tsx');
 const scroll=src('features/client/Proposal.tsx');
 const book=src('features/magazine/FlipMagazine.tsx');
 const worker=readFileSync(new URL('../worker/index.ts',import.meta.url),'utf8');
 assert.match(canvas,/templateFamily\(item\.style\)==='editorial'/);
 assert.match(canvas,/edit\('designLayout',/);
 assert.match(canvas,/<EditorialCover item=\{renderItem\} interaction=\{textInteraction\}/);
 assert.match(canvas,/<EditorialCollage item=\{renderItem\} interaction=\{textInteraction\}/);
 assert.match(canvas,/<EditorialTerms item=\{renderItem\} interaction=\{textInteraction\}/);
 assert.match(canvas,/<PhotoEditingWorkspace photoId=\{selectedPhotoId\}/);
 assert.match(canvas,/<TextStyleDock textId=\{lastTextId\}/);
 assert.match(canvas,/<PhotoLayersPanel layers=\{photoLayers\}/);
 assert.match(doc,/CoverMediaNode/);
 assert.match(doc,/CarolinaTextNode/);
 assert.match(doc,/CarolinaCollage/);
 assert.match(doc,/ExtraPhotos/);
 assert.match(doc,/ExtraTexts/);
 assert.match(doc,/carolinaPageOrder\(item\.designLayout\)/);
 assert.match(carolina,/export function CarolinaCover/);
 assert.match(carolina,/export function CarolinaBlankPage/);
 assert.match(doc,/<CarolinaBlankPage key=\{page\}/);
 assert.match(book,/<CarolinaBlankPage item=\{item\} page=\{selectedPage\} staticChat/);
 assert.doesNotMatch(scroll,/withDesignLayout/);
 assert.doesNotMatch(book,/withDesignLayout/);
 assert.match(book,/const total = selectedPages\.length/);
 assert.match(book,/<EditorialCover item=\{item\}/);
 assert.match(book,/<EditorialCollage item=\{item\}/);
 assert.match(book,/<EditorialTerms item=\{item\}/);
 assert.match(worker,/validCarolinaLayout\(q\.designLayout\)/);
});
