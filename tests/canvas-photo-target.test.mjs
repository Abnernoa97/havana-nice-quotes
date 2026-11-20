import test from 'node:test';
import assert from 'node:assert/strict';
import { canvasPhotoTarget } from '../src/features/editor/canvas/media/canvasPhotoTarget.ts';
import { readFileSync } from 'node:fs';
const awaitSource=()=>readFileSync(new URL('../src/features/editor/canvas/media/createCanvasPhotoActions.ts',import.meta.url),'utf8');

test('One picker-target mapping covers the cover, original collage and independent photos',()=>{
  assert.equal(canvasPhotoTarget('photo:cover'),'cover');
  for(let slot=0;slot<12;slot++)
    assert.equal(canvasPhotoTarget('photo:'+slot),slot);
  assert.equal(canvasPhotoTarget('photo-extra:11111111-1111-1111-1111-111111111111'),
    'extra:11111111-1111-1111-1111-111111111111');
});
test('Malformed photo IDs never open an invalid slot or empty media picker target',()=>{
  for(const value of ['', 'photo:', 'photo:12', 'photo:-1', 'photo:01', 'photo:NaN',
    'photo:999', 'photo-extra:', 'extra:123', 'text:cover'])
    assert.equal(canvasPhotoTarget(value),null,value);
});
test('Selection and replacement share the same parser instead of duplicated ID conversion',()=>{
 const source=awaitSource();
 assert.match(source,/const nextTarget=canvasPhotoTarget\(id\)/);
 assert.match(source,/const nextTarget=canvasPhotoTarget\(selectedPhotoId\)/);
 assert.equal((source.match(/if\(nextTarget!==null\)open\(nextTarget\)/g)||[]).length,2);
});
