import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=p=>readFileSync(new URL('../src/'+p,import.meta.url),'utf8');
const canvasCss=read('features/editor/canvas/template-canvas.css');
const pickerCss=read('features/editor/photos/photo-source-picker.css');
const canvas=read('features/editor/canvas/components/CanvasEditorPanels.tsx');
const picker=read('features/editor/photos/PhotoSourcePicker.tsx');

test('Canvas and photo picker have independent error colors and scopes',()=>{
 assert.match(canvasCss,/\.hn-canvas > \.hn-canvas-error\{color:#a14b43\}/);
 assert.match(pickerCss,/\.hn-canvas-picker \.hn-canvas-message,\.hn-canvas-picker \.hn-canvas-error\{text-align:center;font-size:12px;color:#31583e\}/);
 assert.doesNotMatch(canvasCss,/^\.hn-canvas-error\{/m);
 assert.doesNotMatch(pickerCss,/^\.hn-canvas-error\{/m);
 assert.match(canvas,/<p className="hn-canvas-error" role="alert">/);
 assert.match(picker,/<p className="hn-canvas-error" role="alert">/);
});
test('Upload progress uses separate picker status styling and the same dialog',()=>{
 assert.match(picker,/<p className="hn-canvas-message" role="status">/);
 assert.match(picker,/<div className="hn-canvas-picker" role="dialog" aria-modal="true"/);
 assert.match(pickerCss,/\.hn-canvas-picker \.hn-canvas-message/);
});
