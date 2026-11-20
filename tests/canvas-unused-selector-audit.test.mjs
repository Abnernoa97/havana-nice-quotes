import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read=p=>readFileSync(new URL('../src/'+p,import.meta.url),'utf8');
const canvasCSS=read('features/editor/canvas/template-canvas.css');

test('Dead canvas editorial and old text hotspot selectors are absent',()=>{
 for(const old of ['hn-canvas-editorial','hn-canvas-inline-text','hn-canvas-cover-button'])
   assert.equal(canvasCSS.includes('.'+old),false,old);
});

test('Live photo, text, pager and trash styling remain present',()=>{
 const photo=read('features/templates/CarolinaPhotoNode.tsx');
 const sheet=read('features/editor/canvas/components/CanvasSheetSurface.tsx');
 const toolbar=read('features/editor/canvas/components/CanvasPageToolbar.tsx');
 for(const cls of ['hn-carolina-editable-photo','hn-carolina-empty-photo','hn-carolina-photo-index']){
   assert.ok(photo.includes(cls),cls);
   assert.ok(canvasCSS.includes('.'+cls),cls);
 }
 assert.match(sheet,/data-hn-text-trash/);
 assert.match(canvasCSS,/\.hn-canvas-trash\{/);
 assert.match(toolbar,/hn-canvas-toolbar/);
 assert.match(canvasCSS,/\.hn-canvas-pager\{/);
 assert.match(canvasCSS,/\.hn-canvas \.hn-carolina-text-node\.editing\{/);
});
