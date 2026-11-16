import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  CAROLINA_FIXED, ZERO_TRANSFORM, fixedText, validCarolinaLayout, clampTransform,
} from '../src/features/templates/carolina-layout.ts';

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
  const canvas=readFileSync(new URL('../src/features/editor/TemplateCanvasEditor.tsx',import.meta.url),'utf8');
  const worker=readFileSync(new URL('../worker/index.ts',import.meta.url),'utf8');
  assert.match(gesture,/LONG_PRESS_MS = 550/);
  assert.match(node,/contentEditable=\{editing \? 'plaintext-only' : undefined\}/);
  assert.match(node,/onPointerDown=\{gesture\.onPointerDown\} onPointerMove=\{gesture\.onPointerMove\}/);
  assert.match(node,/onBlur=\{\(\) =>/);
  assert.match(gesture,/Math\.hypot/);
  assert.match(gesture,/page\.addEventListener\('pointerdown', down\)/);
  assert.match(gesture,/pointers\.current\.size/);
  assert.match(gesture,/onCommitTransform\(id, current\.current\)/);
  assert.match(canvas,/onCommitTransform: \(id: string, transform: CarolinaTransform\)/);
  assert.match(canvas,/setTransformingId\(null\)/);
  assert.match(worker,/validCarolinaLayout\(q\.carolinaLayout\)/);
});


test('Fotografías de portada y collage comparten gestos, posiciones y escala persistente', () => {
  const layout=readFileSync(new URL('../src/features/templates/carolina-layout.ts',import.meta.url),'utf8');
  const template=readFileSync(new URL('../src/features/templates/CarolinaTemplate.tsx',import.meta.url),'utf8');
  const photo=readFileSync(new URL('../src/features/templates/CarolinaPhotoNode.tsx',import.meta.url),'utf8');
  const gestures=readFileSync(new URL('../src/features/templates/useCarolinaGesture.ts',import.meta.url),'utf8');
  const canvas=readFileSync(new URL('../src/features/editor/TemplateCanvasEditor.tsx',import.meta.url),'utf8');
  assert.match(photo,/useCarolinaGesture\(id, element, transform, interaction\)/);
  assert.match(photo,/onPointerDown=\{gesture\.onPointerDown\}/);
  assert.match(photo,/if \(!gesture\.suppressTap\(\)\) onSelect\(\)/);
  assert.match(template,/id="photo:cover"/);
  assert.equal((template.match(/id=\{'photo:' \+ slot\}/g)||[]).length,2);
  assert.match(template,/transform=\{item\.carolinaLayout\?\.transforms\?\.\['photo:cover'\]\}/);
  assert.match(canvas,/onSelectCover=\{\(\) => open\('cover'\)\}/);
  assert.match(canvas,/\.hn-carolina-photo, \.hn-carolina-cover-photo/);
  assert.match(layout,/photo:\(\?:cover\|1\[01\]\|\[0-9\]\)/);
  assert.match(gestures,/page\.addEventListener\('pointerdown', down\)/);
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
    movePhotoSlot, photoSlotToAdd, emptyPhotoSlotToDuplicate,
  } = await import('../src/features/templates/carolina-layout.ts');
  assert.deepEqual(CAROLINA_DEFAULT_ORDER,[0,1,2,3,4,5]);
  assert.equal(CAROLINA_MAX_SLOTS,12);
  assert.deepEqual(carolinaPhotoOrder(undefined),[0,1,2,3,4,5]);
  assert.deepEqual(movePhotoSlot([0,1,2],1,1),[0,2,1]);
  assert.deepEqual(movePhotoSlot([0,1,2],0,-1),[0,1,2]);
  assert.equal(photoSlotToAdd([0,1,2,3,4,5],Array(12).fill('')),6);
  assert.equal(emptyPhotoSlotToDuplicate([0,1,2,3,4,5],Array(12).fill('')),6);
  assert.equal(validCarolinaLayout({photoOrder:[0,1,2]}),true);
  assert.equal(validCarolinaLayout({photoOrder:[0,1,2,3,4,5,6,7,8,9,10,11]}),true);
  assert.equal(validCarolinaLayout({photoOrder:[0,0,1]}),false);
  assert.equal(validCarolinaLayout({photoOrder:[12]}),false);
  assert.equal(validCarolinaLayout({photoOrder:[]}),false);
  assert.equal(validCarolinaLayout({photoOrder:[0.5]}),false);
});

test('El diseñador añade, quita, duplica y reordena sin duplicar archivos R2', () => {
  const canvas=readFileSync(new URL('../src/features/editor/TemplateCanvasEditor.tsx',import.meta.url),'utf8');
  const template=readFileSync(new URL('../src/features/templates/CarolinaTemplate.tsx',import.meta.url),'utf8');
  const worker=readFileSync(new URL('../worker/index.ts',import.meta.url),'utf8');
  assert.match(canvas,/const addPhotoBlock = \(\) =>/);
  assert.match(canvas,/const hidePhotoBlock = \(slot: number\) =>/);
  assert.match(canvas,/const duplicatePhotoBlock = \(slot: number\) =>/);
  assert.match(canvas,/const reorderPhotoBlock = \(slot: number, direction: -1 \| 1\)/);
  assert.match(canvas,/gallery\[next\] = gallery\[slot\] \|\| ''/);
  assert.match(template,/carolinaPhotoOrder\(item\.carolinaLayout\)/);
  assert.match(worker,/q\.gallery\.length <= 12/);
});
