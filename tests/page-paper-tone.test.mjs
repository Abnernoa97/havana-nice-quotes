import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createQuoteDraft,duplicateQuote} from '../src/features/quotes/model.ts';
import {validCarolinaLayout} from '../src/features/templates/carolina-layout.ts';
import {duplicateBlankPage,removeDesignPage,shiftPage} from '../src/features/templates/blank-pages.ts';
import {pagePaperTone,pagePaperStyle,setPagePaperTone,setAllPagePaperTones,PAGE_PAPER_COLORS} from '../src/features/templates/page-paper.ts';
const source=path=>readFileSync(new URL('../src/'+path,import.meta.url),'utf8');
test('Legacy pages remain unchanged until an explicit background choice',()=>{
 const old=createQuoteDraft('old');
 assert.equal(pagePaperTone(old.designLayout,0),undefined);
 assert.equal(pagePaperStyle(old.designLayout,0),undefined);
 assert.equal(PAGE_PAPER_COLORS.white,'#ffffff');
 assert.equal(PAGE_PAPER_COLORS.beige,'#f1ebdf');
 const colored=setPagePaperTone(old.designLayout,1,'beige');
 assert.deepEqual(pagePaperStyle(colored,1),{backgroundColor:'#f1ebdf'});
 assert.equal(pagePaperStyle(colored,0),undefined);
 assert.equal(validCarolinaLayout(colored),true);
 assert.equal(old.designLayout.pagePapers,undefined);
});
test('Applying one shade to all preserves page order, originals and other options',()=>{
 const q=createQuoteDraft('a');
 const one=setPagePaperTone(q.designLayout,0,'beige');
 const two=setPagePaperTone(one,2,'white');
 assert.equal(pagePaperTone(two,0),'beige');
 assert.equal(pagePaperTone(two,2),'white');
 const all=setAllPagePaperTones(two,'beige');
 assert.deepEqual(all.pagePapers,{'0':'beige','1':'beige','2':'beige'});
 assert.deepEqual(all.pageOrder,[0,1,2]);
 assert.equal(validCarolinaLayout(all),true);
 assert.equal(one.pagePapers['2'],undefined);
});
test('Duplicating, moving and deleting a page preserves correct paper identity',()=>{
 const uuid='11111111-1111-1111-1111-111111111111';
 const original={pageOrder:[3,4],extras:[{id:uuid,page:3,text:'Hola'}]};
 const color=setPagePaperTone(original,3,'beige');
 const copy=duplicateBlankPage(color,3);
 assert.ok(copy);
 assert.equal(pagePaperTone(copy.layout,copy.page),'beige');
 assert.equal(validCarolinaLayout(copy.layout),true);
 const reordered=shiftPage(copy.layout,copy.page,1);
 assert.ok(reordered);
 assert.equal(pagePaperTone(reordered,copy.page),'beige');
 const removed=removeDesignPage(reordered,copy.page);
 assert.ok(removed);
 assert.equal(removed.layout.pagePapers[String(copy.page)],undefined);
 assert.equal(validCarolinaLayout(removed.layout),true);
});
test('D1 rejects unsupported tones or missing page references',()=>{
 for(const pagePapers of [{'0':'green'},{'0':'#f1ebdf'},{'8':'beige'},{'-1':'white'},{'00':'beige'}]){
  assert.equal(validCarolinaLayout({pageOrder:[0,1,2],pagePapers}),false,JSON.stringify(pagePapers));
 }
});
test('Reused quotations do not share editable paper maps',()=>{
 const q={...createQuoteDraft('old'),designLayout:setPagePaperTone(createQuoteDraft('old').designLayout,1,'beige')};
 const copy=duplicateQuote(q,'new');
 copy.designLayout.pagePapers['1']='white';
 assert.equal(q.designLayout.pagePapers['1'],'beige');
});
test('Designer, reader and magazine use one paper background helper',()=>{
 for(const path of ['features/templates/CarolinaTemplate.tsx',
  'features/templates/EditorialTemplate.tsx','features/magazine/FlipMagazine.tsx'])
   assert.ok(source(path).includes('pagePaperStyle('),path);
 const editor=source('features/editor/canvas/TemplateCanvasEditor.tsx');
 assert.match(editor,/setPagePaperTone\(item\.designLayout,page,tone\)/);
 assert.match(editor,/setAllPagePaperTones\(item\.designLayout,tone\)/);
 const pager=source('features/editor/canvas/components/CanvasPagePager.tsx');
 assert.match(pager,/Cambiar fondo de esta hoja/);
 assert.match(pager,/Aplicar a todas las hojas/);
});
