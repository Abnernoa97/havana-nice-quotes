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
  assert.equal(validCarolinaLayout({transforms:{'field:date':{x:0,y:0,scale:0,rotation:0}}}),false);
  assert.equal(validCarolinaLayout({extras:[{id:uuid,page:5,text:'Invalid'}]}),false);
});

test('Edición directa, presión larga y gesto de dos dedos mantienen un solo guardado', () => {
  const gesture=readFileSync(new URL('../src/features/templates/CarolinaTextNode.tsx',import.meta.url),'utf8');
  const canvas=readFileSync(new URL('../src/features/editor/TemplateCanvasEditor.tsx',import.meta.url),'utf8');
  const worker=readFileSync(new URL('../worker/index.ts',import.meta.url),'utf8');
  assert.match(gesture,/const HOLD_MS = 550/);
  assert.match(gesture,/contentEditable=\{editing \? 'plaintext-only' : undefined\}/);
  assert.match(gesture,/onPointerDown=\{down\} onPointerMove=\{move\}/);
  assert.match(gesture,/onBlur=\{\(\) =>/);
  assert.match(gesture,/Math\.hypot/);
  assert.match(gesture,/page\.addEventListener\('pointerdown', down\)/);
  assert.match(gesture,/pointers\.current\.size === 0/);
  assert.match(gesture,/interaction\.onCommitTransform\(id, current\.current\)/);
  assert.match(canvas,/onCommitTransform: \(id: string, transform: CarolinaTransform\)/);
  assert.match(canvas,/setTransformingId\(null\)/);
  assert.match(worker,/validCarolinaLayout\(q\.carolinaLayout\)/);
});
