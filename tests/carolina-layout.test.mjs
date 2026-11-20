import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  CAROLINA_FIXED, ZERO_TRANSFORM, fixedText, validCarolinaLayout, clampTransform,
} from '../src/features/templates/carolina-layout.ts';

const canvasSource=()=>["TemplateCanvasEditor.tsx","components/CanvasPageToolbar.tsx","components/CanvasPageContent.tsx","interactions/createCanvasTextInteraction.ts","media/canvasPhotoUrl.ts","components/CanvasPagePager.tsx","hooks/useCanvasPageActions.ts"].map(p=>readFileSync(new URL('../src/features/editor/canvas/'+p,import.meta.url),'utf8')).join('\n');

test('Textos originales de Carolina son editables y se conserva la plantilla sin cambios', () => {
  assert.equal(Object.keys(CAROLINA_FIXED).length, 18);
  assert.equal(fixedText(undefined, 'brand'), 'HAVANA NICE');
  assert.equal(fixedText({fixed:{brand:'A different title'}}, 'brand'), 'A different title');
  assert.equal(fixedText({fixed:{brand:''}}, 'brand'), '');
  assert.deepEqual(ZERO_TRANSFORM, {x:0,y:0,scale:1,rotation:0});
});

test('Transformaciones son proporcionales a la página y tienen límites', () => {
  assert.deepEqual(clampTransform({x:400,y:-500,scale:9,rotation:250}),
    {x:180,y:-180,scale:4,rotation:180});
  assert.deepEqual(clampTransform({x:2.1234,y:-.7777,scale:.51,rotation:90}),
    {x:2.12,y:-.78,scale:.51,rotation:90});
});

test('Diseño nuevo puede serializarse y validarse sin alterar otros campos', () => {
  const uuid='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const value={fixed:{production:'Technical details'},extras:[{id:uuid,page:2,text:'Free text'}],
    transforms:{['extra:'+uuid]:{x:4,y:-5,scale:1.4,rotation:-30}}};
  assert.equal(validCarolinaLayout(value),true);
  assert.deepEqual(JSON.parse(JSON.stringify(value)),value);
  assert.equal(validCarolinaLayout({fixed:{test:'Not allowed'}}),false);
  assert.equal(validCarolinaLayout({fixed:{constructor:'Not allowed'}}),false);
  assert.equal(validCarolinaLayout({transforms:{'field:date':{x:0,y:0,scale:0,rotation:0}}}),false);
  assert.equal(validCarolinaLayout({extras:[{id:uuid,page:5,text:'Invalid'}]}),false);
});

test('Edición directa, presión larga y gesto de dos dedos mantienen un solo guardado', () => {
  const gesture=readFileSync(new URL('../src/features/templates/useCarolinaGesture.ts',import.meta.url),'utf8');
  const node=readFileSync(new URL('../src/features/templates/CarolinaTextNode.tsx',import.meta.url),'utf8');
  const canvas=canvasSource();
  const worker=readFileSync(new URL('../worker/index.ts',import.meta.url),'utf8');
  assert.match(gesture,/LONG_PRESS_MS = 550/);
  assert.match(node,/contentEditable=\{editing \? 'plaintext-only' : undefined\}/);
  assert.match(node,/onPointerDown=\{gesture\.onPointerDown\} onPointerMove=\{gesture\.onPointerMove\}/);
  assert.match(node,/onBlur=\{\(\) =>/);
  assert.match(gesture,/Math\.hypot/);
  assert.match(gesture,/page\.addEventListener\('pointerdown',down\)/);
  assert.match(gesture,/pointers\.current\.size/);
  assert.match(gesture,/onCommitTransform\(id, current\.current\)/);
  assert.match(canvas,/onCommitTransform: \(id: string, transform: CarolinaTransform\)/);
  assert.match(canvas,/setTransformingId\(null\)/);
  assert.match(worker,/validCarolinaLayout\(q\.designLayout\)/);
});


test('Fotografías de portada y collage comparten gestos, posiciones y escala persistente', () => {
  const layout=readFileSync(new URL('../src/features/templates/carolina-layout.ts',import.meta.url),'utf8');
  const template=readFileSync(new URL('../src/features/templates/CarolinaTemplate.tsx',import.meta.url),'utf8');
  const photo=readFileSync(new URL('../src/features/templates/CarolinaPhotoNode.tsx',import.meta.url),'utf8');
  const gestures=readFileSync(new URL('../src/features/templates/useCarolinaGesture.ts',import.meta.url),'utf8');
  const canvas=canvasSource();
  assert.match(photo,/useCarolinaGesture\(id, element, transform, interaction\)/);
  assert.match(photo,/onPointerDown=\{gesture\.onPointerDown\}/);
  assert.match(photo,/onPointerMove=\{gesture\.onPointerMove\}/);
  assert.match(photo,/if \(!gesture\.suppressTap\(\)\) onSelect\(\)/);
  assert.doesNotMatch(photo,/effectMoved\.current|imageEdit/);
  const cover=readFileSync(new URL('../src/features/templates/CoverMediaNode.tsx',import.meta.url),'utf8');
  assert.match(cover,/id="photo:cover"/);
  assert.equal((template.match(/id=\{'photo:' \+ slot\}/g)||[]).length,2);
  assert.match(cover,/transform=\{item\.designLayout\?\.transforms\?\.\['photo:cover'\]\}/);
  assert.match(canvas,/onSelectCover=\{\(\)=>selectPhoto\('photo:cover'\)\}/);
  assert.match(canvas,/closest\('\[data-hn-photo-id\], \[data-carolina-text\]'\)/);
  assert.match(layout,/photo:\(\?:cover\|1\[01\]\|\[0-9\]\)/);
  assert.match(gestures,/page\.addEventListener\('pointerdown',down\)/);
  for(const id of ['photo:cover','photo:0','photo:1','photo:2','photo:3','photo:4','photo:5']) {
    assert.ok(validCarolinaLayout({transforms:{[id]:{x:-15,y:7,scale:1.8,rotation:18}}}),id);
  }
  assert.equal(validCarolinaLayout({transforms:{'photo:11':{x:0,y:0,scale:1,rotation:0}}}),true);
  assert.equal(validCarolinaLayout({transforms:{'photo:12':{x:0,y:0,scale:1,rotation:0}}}),false);
  assert.equal(validCarolinaLayout({transforms:{'photo:outside':{x:0,y:0,scale:1,rotation:0}}}),false);
  assert.equal(validCarolinaLayout({transforms:{'photo:cover':{x:0,y:0,scale:50,rotation:0}}}),false);
});


test('Collage variable conserva los seis originales y admite 1 a 12 recuadros con orden estable', async () => {
  const {
    CAROLINA_DEFAULT_ORDER, CAROLINA_MAX_SLOTS, carolinaPhotoOrder,
    photoSlotToAdd,
  } = await import('../src/features/templates/carolina-layout.ts');
  assert.deepEqual(CAROLINA_DEFAULT_ORDER,[0,1,2,3,4,5]);
  assert.equal(CAROLINA_MAX_SLOTS,12);
  assert.deepEqual(carolinaPhotoOrder(undefined),[0,1,2,3,4,5]);
  assert.equal(photoSlotToAdd([0,1,2,3,4,5],Array(12).fill('')),6);
  assert.equal(validCarolinaLayout({photoOrder:[0,1,2]}),true);
  assert.equal(validCarolinaLayout({photoOrder:[0,1,2,3,4,5,6,7,8,9,10,11]}),true);
  assert.equal(validCarolinaLayout({photoOrder:[0,0,1]}),false);
  assert.equal(validCarolinaLayout({photoOrder:[12]}),false);
  assert.equal(validCarolinaLayout({photoOrder:[]}),false);
  assert.equal(validCarolinaLayout({photoOrder:[0.5]}),false);
});

test('El diseñador usa una sola barra de fotos sin acciones antiguas ni duplicación', () => {
  const canvas=canvasSource();
  const template=readFileSync(new URL('../src/features/templates/CarolinaTemplate.tsx',import.meta.url),'utf8');
  const worker=readFileSync(new URL('../worker/index.ts',import.meta.url),'utf8');
  const css=readFileSync(new URL('../src/features/editor/canvas/template-canvas.css',import.meta.url),'utf8');
  assert.match(canvas,/const addPhotoBlock = \(\) =>/);
  assert.match(canvas,/const selectPhoto = \(id:string\) =>/);
  assert.match(canvas,/<PhotoEditingWorkspace photoId=\{selectedPhotoId\}/);
  assert.match(canvas,/const replacePhoto = \(\) =>/);
  assert.doesNotMatch(canvas,/hn-canvas-photo-actions|reorderPhotoBlock|duplicatePhotoBlock|clearPhotoBlock/);
  assert.doesNotMatch(css,/hn-canvas-photo-actions/);
  assert.match(template,/carolinaPhotoOrder\(item\.designLayout\)/);
  assert.match(worker,/q\.gallery\.length <= 12/);
});

test('Banco de 42 familias elegantes: incluye Cinzel y organiza los estilos de la boda', async () => {
  const {ELEGANT_FONTS,ELEGANT_FONT_GROUPS,isElegantFontId,elegantFontFamily} =
    await import('../src/features/templates/elegant-fonts.ts');
  assert.equal(ELEGANT_FONTS.length,42);
  assert.equal(new Set(ELEGANT_FONTS.map(font=>font.id)).size,42);
  assert.deepEqual(ELEGANT_FONT_GROUPS.map(group=>group.id),
    ['editorial','clasica','firma','moderna']);
  assert.ok(isElegantFontId('cinzel'));
  assert.ok(isElegantFontId('cinzel-decorative'));
  assert.ok(isElegantFontId('cormorant-garamond'));
  assert.ok(isElegantFontId('allura'));
  assert.ok(isElegantFontId('jost'));
  assert.ok(!isElegantFontId('font; color:red'));
  assert.ok(!isElegantFontId('not-a-font'));
  assert.match(elegantFontFamily('cinzel'), /"Cinzel", serif/);
  assert.match(elegantFontFamily('allura'), /cursive/);
});

test('Las tipografías se guardan por texto o globalmente y son validadas en D1', () => {
  const uuid='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const valid = {defaultFont:'cinzel',fonts:{
    'fixed:brand':'cinzel-decorative','field:name':'bodoni-moda',
    ['extra:'+uuid]:'allura',
  }};
  assert.equal(validCarolinaLayout(valid),true);
  assert.deepEqual(JSON.parse(JSON.stringify(valid)),valid);
  assert.equal(validCarolinaLayout({defaultFont:'Arial; font-size:999px'}),false);
  assert.equal(validCarolinaLayout({defaultFont:'___invalid'}),false);
  assert.equal(validCarolinaLayout({fonts:{'photo:cover':'cinzel'}}),false);
  assert.equal(validCarolinaLayout({fonts:{'field:name':'unknown-font'}}),false);
  assert.equal(validCarolinaLayout({fonts:{'field:name':42}}),false);
  assert.equal(validCarolinaLayout({fonts:null}),false);
  assert.equal(validCarolinaLayout({fonts:{'fixed:brand':'cinzel'},danger:true}),false);
});


test('Estilos independientes de letras con dimensiones y colores validados', () => {
  const valid={textStyles:{
    'fixed:brand':{color:'#BDA577',size:160,stretchX:125,stretchY:85},
    'field:name':{color:'#244A37',size:110},
    'extra:aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa':{stretchX:200,stretchY:50},
  }};
  assert.equal(validCarolinaLayout(valid),true);
  assert.deepEqual(JSON.parse(JSON.stringify(valid)),valid);
  assert.equal(validCarolinaLayout({textStyles:{'field:name':{color:'red'}}}),false);
  assert.equal(validCarolinaLayout({textStyles:{'field:name':{color:'#fff'}}}),false);
  assert.equal(validCarolinaLayout({textStyles:{'field:name':{size:0}}}),false);
  assert.equal(validCarolinaLayout({textStyles:{'field:name':{size:500}}}),false);
  assert.equal(validCarolinaLayout({textStyles:{'field:name':{stretchX:300}}}),false);
  assert.equal(validCarolinaLayout({textStyles:{'field:name':{stretchY:49}}}),false);
  assert.equal(validCarolinaLayout({textStyles:{'photo:cover':{size:150}}}),false);
  assert.equal(validCarolinaLayout({textStyles:{'field:name':{fontFamily:'Arial'}}}),false);
  assert.equal(validCarolinaLayout({textStyles:{'field:name':{size:Infinity}}}),false);
  assert.equal(validCarolinaLayout({textStyles:{'field:name':[]}}),false);
});


test('Portada y condiciones permiten tipografías independientes al mostrar el mismo dato', () => {
  const value={fonts:{'field:date:cover':'cinzel','field:date':'jost','field:location:cover':'allura'},
    textStyles:{'field:date:cover':{color:'#FFFFFF',size:160},'field:date':{color:'#244A37',size:100}},
    transforms:{'field:location:cover':{x:2,y:0,scale:1.2,rotation:0}}};
  assert.equal(validCarolinaLayout(value),true);
  const template=readFileSync(new URL('../src/features/templates/CarolinaTemplate.tsx',import.meta.url),'utf8');
  const editor=canvasSource();
  assert.match(template,/field="location" instance="cover"/);
  assert.match(template,/field="date" instance="cover"/);
  assert.match(editor,/id\.slice\(6\)\.split\(':'\)\[0\]/);
});


test('Tres hojas reales por defecto; la selección conserva solo las solicitadas',async()=>{
  const {carolinaPageOrder,CAROLINA_DEFAULT_PAGES,validCarolinaLayout}=
    await import('../src/features/templates/carolina-layout.ts');
  assert.deepEqual(CAROLINA_DEFAULT_PAGES,[0,1,2]);
  assert.deepEqual(carolinaPageOrder(undefined),[0,1,2]);
  assert.deepEqual(carolinaPageOrder({pageOrder:[2,0]}),[2,0]);
  assert.deepEqual(carolinaPageOrder({pageOrder:[1]}),[1]);
  assert.equal(validCarolinaLayout({pageOrder:[0,1,2]}),true);
  assert.equal(validCarolinaLayout({pageOrder:[0]}),true);
  assert.equal(validCarolinaLayout({pageOrder:[2,0]}),true);
  assert.equal(validCarolinaLayout({pageOrder:[]}),false);
  assert.equal(validCarolinaLayout({pageOrder:[0,0]}),false);
  assert.equal(validCarolinaLayout({pageOrder:[0,3]}),true);
  assert.equal(validCarolinaLayout({pageOrder:[3]}),true);
  assert.equal(validCarolinaLayout({pageOrder:[0,1025]}),false);
  assert.equal(validCarolinaLayout({pageOrder:Array.from({length:33},(_,i)=>i+3)}),false);
  assert.equal(validCarolinaLayout({pageOrder:[0,1,2,0]}),false);
});

test('Fotografías libres en portada, collage y propuesta con IDs y URL privada verificados',()=>{
  const valid=validCarolinaLayout({
    extraPhotos:[
      {id:'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',page:0,url:'/api/media/11111111-1111-1111-1111-111111111111'},
      {id:'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',page:1,url:''},
      {id:'cccccccc-cccc-cccc-cccc-cccccccccccc',page:2,url:'/api/media/22222222-2222-2222-2222-222222222222'},
    ],
    transforms:{'photo-extra:cccccccc-cccc-cccc-cccc-cccccccccccc':
      {x:10,y:5,scale:1.5,rotation:14}},
  });
  assert.equal(valid,true);
  assert.equal(validCarolinaLayout({extraPhotos:[
    {id:'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',page:2,url:'https://evil.example/photo.jpg'}]}),false);
  assert.equal(validCarolinaLayout({extraPhotos:[
    {id:'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',page:3,url:''}]}),false);
  assert.equal(validCarolinaLayout({extraPhotos:[
    {id:'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',page:0,url:''},
    {id:'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',page:1,url:''}]}),false);
  assert.equal(validCarolinaLayout({transforms:{
    'photo-extra:garbage':{x:0,y:0,scale:1,rotation:0}}}),false);
});


test('Los seis efectos se guardan por recuadro y se validan en la nube', () => {
  const valid={
    photoStyles:{
      'photo:cover':{behindText:true,opacity:11,brightness:140,contrast:90,saturate:160,
        hue:-35,grayscale:0,sepia:12,tint:'#ACCED0',tintAmount:25,cropZoom:180,
        cropX:42,cropY:75,vignetteShape:'round',vignetteColor:'white',
        vignetteStrength:66,vignetteSize:73,vignetteX:41,vignetteY:39},
      'photo-extra:cccccccc-cccc-cccc-cccc-cccccccccccc':
        {vignetteShape:'square',vignetteColor:'black'}
    }
  };
  assert.equal(validCarolinaLayout(valid),true);
  assert.equal(validCarolinaLayout({photoStyles:{'photo:12':{opacity:50}}}),false);
  assert.equal(validCarolinaLayout({photoStyles:{'photo:0':{opacity:-1}}}),false);
  assert.equal(validCarolinaLayout({photoStyles:{'photo:0':{cropZoom:500}}}),false);
  assert.equal(validCarolinaLayout({photoStyles:{'photo:0':{vignetteShape:'triangle'}}}),false);
  assert.equal(validCarolinaLayout({photoStyles:{'photo:0':{tint:'red'}}}),false);
  assert.equal(validCarolinaLayout({photoStyles:{'photo:0':{weirdKey:10}}}),false);
  assert.equal(validCarolinaLayout({photoStyles:{'photo:0':{opacity:Infinity}}}),false);
});

test('Validación de relaciones de recorte dentro de un recuadro estable',()=>{
  for(const a of ['frame','1:1','4:5','9:16','16:9'])assert.equal(validCarolinaLayout({photoStyles:{'photo:0':{cropAspect:a,cropZoom:135}}}),true);
  assert.equal(validCarolinaLayout({photoStyles:{'photo:0':{cropAspect:'4:3'}}}),false);
});


test('Giro fotográfico persistente: horizontal, vertical y giro con dos dedos',async()=>{
  const {rotateCrop,normalizeCropRotation}=await import('../src/features/templates/photo-crop.ts');
  assert.equal(rotateCrop(0,0,Math.PI/2),90);
  assert.equal(rotateCrop(170,0,Math.PI/2),-100);
  assert.equal(normalizeCropRotation(-270),90);
  assert.equal(normalizeCropRotation(360),0);
  assert.equal(validCarolinaLayout({photoStyles:{'photo:cover':{cropRotation:90}}}),true);
  assert.equal(validCarolinaLayout({photoStyles:{'photo:0':{cropRotation:-180}}}),true);
  assert.equal(validCarolinaLayout({photoStyles:{'photo:0':{cropRotation:181}}}),false);
  assert.equal(validCarolinaLayout({photoStyles:{'photo:0':{cropRotation:45.5}}}),false);
});
