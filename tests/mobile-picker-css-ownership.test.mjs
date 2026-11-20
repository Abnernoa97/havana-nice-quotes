import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../src/features/editor/'+p,import.meta.url),'utf8');
test('Mobile photo picker styles live with the picker, not the canvas',()=>{
 const canvas=read('canvas/template-canvas.css'),picker=read('photos/photo-source-picker.css');
 assert.match(canvas,/@media\(max-width:550px\)\{\.hn-canvas\{padding:12px 6px 22px\}\}/);
 assert.doesNotMatch(canvas,/\.hn-canvas-shade|\.hn-canvas-picker\{/);
 assert.match(picker,/@media\(max-width:550px\)\{\.hn-canvas-shade\{padding:7px\}\.hn-canvas-picker\{padding:14px;border-radius:16px\}\}/);
});
test('Photo picker keeps its overlay and upload/error styling across breakpoints',()=>{
 const picker=read('photos/photo-source-picker.css');
 assert.match(picker,/\.hn-canvas-shade\{position:fixed;inset:0;z-index:1100/);
 assert.match(picker,/\.hn-canvas-picker\{width:min\(100%,570px\)/);
 assert.match(picker,/\.hn-canvas-picker \.hn-canvas-message,\.hn-canvas-picker \.hn-canvas-error\{/);
});
