import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createOwnTemplate,duplicateQuote} from '../src/features/quotes/model.ts';
import {validCarolinaLayout,carolinaPageOrder,MAX_DESIGN_PAGES} from '../src/features/templates/carolina-layout.ts';
import {insertBlankPage,duplicateBlankPage,shiftPage,removeDesignPage} from '../src/features/templates/blank-pages.ts';
const src=p=>readFileSync(new URL('../src/'+p,import.meta.url),'utf8');
const one='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',two='bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
test('Crear plantilla desde cero abre una sola hoja blanca persistente',()=>{
 const tpl=createOwnTemplate('hn-new');
 assert.equal(tpl.isTemplate,true);
 assert.deepEqual(tpl.designLayout.pageOrder,[3]);
 assert.equal(tpl.cover,'');
 assert.deepEqual(carolinaPageOrder(tpl.designLayout),[3]);
 assert.equal(validCarolinaLayout(tpl.designLayout),true);
});
test('Agregar hojas reales y mover páginas conserva IDs y datos',()=>{
 const original={pageOrder:[0,1,2]};
 const added=insertBlankPage(original,1);
 assert.equal(added.page,3);
 assert.deepEqual(added.layout.pageOrder,[0,1,3,2]);
 assert.deepEqual(original.pageOrder,[0,1,2]);
 const second=insertBlankPage(added.layout,3);
 assert.deepEqual(second.layout.pageOrder,[0,1,3,4,2]);
 assert.deepEqual(shiftPage(second.layout,4,-1).pageOrder,[0,1,4,3,2]);
 assert.equal(validCarolinaLayout(second.layout),true);
});
test('Página libre conserva textos y fotos privados para las tres vistas',()=>{
 const l={pageOrder:[3],extras:[{id:one,page:3,text:'Hello!'}],
  extraPhotos:[{id:two,page:3,url:'/api/media/11111111-1111-1111-1111-111111111111'}],
  fonts:{['extra:'+one]:'cinzel'},
  textStyles:{['extra:'+one]:{color:'#123456'}},
  photoStyles:{['photo-extra:'+two]:{opacity:40,behindText:true}},
  transforms:{['extra:'+one]:{x:10,y:0,scale:1,rotation:0}}};
 assert.equal(validCarolinaLayout(l),true);
 const duplicate=duplicateBlankPage(l,3);
 assert.ok(duplicate);
 assert.equal(duplicate.page,4);
 assert.deepEqual(duplicate.layout.pageOrder,[3,4]);
 assert.equal(duplicate.layout.extras.length,2);
 assert.equal(duplicate.layout.extraPhotos.length,2);
 const newText=duplicate.layout.extras.at(-1);
 const newPhoto=duplicate.layout.extraPhotos.at(-1);
 assert.notEqual(newText.id,one);
 assert.notEqual(newPhoto.id,two);
 assert.equal(duplicate.layout.fonts['extra:'+newText.id],'cinzel');
 assert.deepEqual(duplicate.layout.textStyles['extra:'+newText.id],{color:'#123456'});
 assert.deepEqual(duplicate.layout.photoStyles['photo-extra:'+newPhoto.id],{opacity:40,behindText:true});
 assert.deepEqual(duplicate.layout.transforms['extra:'+newText.id],{x:10,y:0,scale:1,rotation:0});
 assert.equal(validCarolinaLayout(duplicate.layout),true);
 const cleaned=removeDesignPage(duplicate.layout,4);
 assert.ok(cleaned);
 assert.deepEqual(cleaned.layout.pageOrder,[3]);
 assert.equal(cleaned.layout.extras.length,1);
 assert.equal(cleaned.layout.extraPhotos.length,1);
 assert.ok(!cleaned.layout.photoStyles['photo-extra:'+newPhoto.id]);
 assert.equal(validCarolinaLayout(cleaned.layout),true);
 assert.equal(l.extras.length,1);
});
test('No permite borrar última página o duplicar las hojas estructurales',()=>{
 assert.equal(removeDesignPage({pageOrder:[3]},3),null);
 assert.equal(duplicateBlankPage({pageOrder:[0,1,2]},0),null);
 let current={pageOrder:[3]};
 for(let i=1;i<MAX_DESIGN_PAGES;i++)current=insertBlankPage(current).layout;
 assert.equal(insertBlankPage(current),null);
 assert.equal(validCarolinaLayout(current),true);
});
test('Scroll y revista 3D pintan hojas blancas con los mismos nodos',()=>{
 const canvas=src('features/editor/canvas/TemplateCanvasEditor.tsx');
 const carolina=src('features/templates/CarolinaTemplate.tsx');
 const editorial=src('features/templates/EditorialTemplate.tsx');
 const flip=src('features/magazine/FlipMagazine.tsx');
 assert.match(canvas,/onClick=\{addPage\}/);
 assert.match(canvas,/isBlankPage\(page\) && <CarolinaBlankPage/);
 assert.match(carolina,/export function CarolinaBlankPage/);
 assert.match(carolina,/<ExtraPhotos item=\{item\} page=\{page\}/);
 assert.match(carolina,/<ExtraTexts item=\{item\} page=\{page\}/);
 assert.match(editorial,/<CarolinaBlankPage key=\{page\}/);
 assert.match(flip,/<CarolinaBlankPage item=\{item\} page=\{selectedPage\}/);
});
test('Las copias de una plantilla de páginas libres son independientes',()=>{
 const tpl=createOwnTemplate('hn-a');
 const first=insertBlankPage(tpl.designLayout,3);
 const quote=duplicateQuote({...tpl,designLayout:first.layout},'hn-b',true);
 assert.deepEqual(quote.designLayout.pageOrder,[3,4]);
 assert.equal(quote.isTemplate,undefined);
 quote.designLayout.pageOrder.push(5);
 assert.deepEqual(first.layout.pageOrder,[3,4]);
});

test('Videos privados convertidos son medios válidos de hojas libres',()=>{
 const video={pageOrder:[3],extraPhotos:[{id:two,page:3,
  url:'/api/videos/11111111-1111-1111-1111-111111111111'}]};
 assert.equal(validCarolinaLayout(video),true);
 assert.equal(validCarolinaLayout({...video,extraPhotos:[{...video.extraPhotos[0],
  url:'https://example.com/external.mp4'}]}),false);
 const duplicate=duplicateBlankPage(video,3);
 assert.deepEqual(duplicate.layout.extraPhotos.map(p=>p.url),
  [video.extraPhotos[0].url,video.extraPhotos[0].url]);
});
test('Selección de archivo es requisito para persistir un nuevo recuadro',()=>{
 const canvas=src('features/editor/canvas/TemplateCanvasEditor.tsx');
 const picker=src('features/editor/photos/PhotoSourcePicker.tsx');
 const node=src('features/templates/CarolinaPhotoNode.tsx');
 const start=canvas.split('const addPhotoAnywhere=()=>{')[1].split('const addPhotoBlock')[0];
 const collage=canvas.split('const addPhotoBlock = () => {')[1].split('const open = ')[0];
 assert.doesNotMatch(start,/updateLayout\(/);
 assert.doesNotMatch(collage,/setPhotoOrder\(/);
 assert.match(canvas,/const savedUrl=await onUploadPhoto\(file,target\)/);
 assert.match(canvas,/onChooseVideo=\{chooseVideo\}/);
 assert.match(picker,/canPickVideo&&kind==='videos'/);
 assert.match(node,/<video className="hn-carolina-image-fill hn-carolina-video-fill"/);
 const sheet=canvas.split('<div className="hn-canvas-sheet"')[1].split('<div className="hn-canvas-pager">')[0];
 assert.match(sheet,/data-hn-text-trash/);
 assert.doesNotMatch(sheet,/Eliminar foto · Arrastra aquí/);
});
