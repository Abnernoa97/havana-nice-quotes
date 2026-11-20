import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../src/'+p,import.meta.url),'utf8');
const text=read('features/templates/CarolinaTextNode.tsx');
const gesture=read('features/templates/useCarolinaGesture.ts');
const canvas=read('features/editor/canvas/template-canvas.css');
const tap=read('features/editor/canvas/hooks/useCanvasTapConfirmation.ts');

test('Editing text delegates Android pointer and context menu events to native caret',()=>{
 for(const name of ['onPointerDown','onPointerMove','onPointerCancel'])
  assert.ok(text.includes(name+'={editing ? undefined : gesture.'+name+'}'),name);
 assert.match(text,/if \(!editing\) event\.preventDefault\(\)/);
 assert.match(text,/contentEditable=\{editing \? 'plaintext-only' : undefined\}/);
 assert.match(text,/initialCaretPoint\.current=\{x:event\.clientX,y:event\.clientY\}/);
 assert.match(text,/caretPositionFromPoint/);
 assert.match(text,/caretRangeFromPoint/);
 assert.match(text,/placeCaretAtPoint\(event\.currentTarget,event\.clientX,event\.clientY\)/);
 assert.match(text,/range\.selectNodeContents\(element\)/);
 assert.match(text,/\}, \[editing\]\)/);
});
test('Gesture listener and tap confirmation ignore a live editable text',()=>{
 assert.doesNotMatch(gesture,/page\.addEventListener\('pointerdown'/);
 assert.doesNotMatch(gesture,/if\(disabled && editingHere\)\{/);
 assert.match(gesture,/if\(disabled\)return/);
 assert.match(tap,/if\(el\.closest\('\[data-carolina-text\]\.editing'\)\)return/);
});
test('Native selection is enabled on editable node and canvas ancestors only during editing',()=>{
 assert.match(canvas,/\.hn-canvas \.hn-carolina-text-node\.editing\{[^}]*user-select:text;-webkit-user-select:text;-webkit-touch-callout:default;touch-action:auto/);
 assert.match(canvas,/\.hn-canvas\.hn-text-focus \.hn-canvas-sheet:has\(\.hn-carolina-text-node\.editing\)/);
 assert.match(canvas,/\.hn-canvas \.hn-carolina-page\.hn-layout-grid:has\(\.hn-carolina-text-node\.editing\)/);
 assert.match(canvas,/touch-action:auto;user-select:text;-webkit-user-select:text;-webkit-touch-callout:default/);
 assert.match(canvas,/\.hn-canvas \.hn-carolina-page\.hn-layout-grid,\s*\.hn-canvas\.hn-text-focus \.hn-carolina-page\{touch-action:none\}/);
});
