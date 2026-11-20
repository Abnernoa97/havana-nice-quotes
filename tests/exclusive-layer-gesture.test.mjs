import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../src/'+p,import.meta.url),'utf8');
const gesture=read('features/templates/useCarolinaGesture.ts');
const text=read('features/templates/CarolinaTextNode.tsx');
const photo=read('features/templates/CarolinaPhotoNode.tsx');
const tap=read('features/editor/canvas/hooks/useCanvasTapConfirmation.ts');
const actions=read('features/editor/canvas/interactions/createCanvasTextInteraction.ts');
const css=read('features/editor/canvas/template-canvas.css');
test('Pointer streams never originate from another element or the full page',()=>{
 assert.doesNotMatch(gesture,/page\.addEventListener\('pointer(?:down|move|up|cancel)'/);
 assert.doesNotMatch(gesture,/beginEditDrag|pendingPageEdit|finishEditTap/);
 assert.match(gesture,/const owner=interaction\.transformingId \|\| interaction\.editingId/);
 assert.match(gesture,/if\(owner && owner!==id\)return/);
 assert.match(photo,/onPointerDown=\{gesture\.onPointerDown\}/);
});
test('A tap on selected text enters native caret mode directly',()=>{
 assert.match(actions,/onDeselectTransform: id => \{/);
 assert.match(actions,/setTransformingId\(null\);setEditingId\(id\);setLastTextId\(id\)/);
 assert.match(tap,/if\(layer && transformingId && \(/);
 assert.match(text,/if\(gesture\.selected\)initialCaretPoint\.current=/);
 assert.match(text,/placeCaretAtPoint\(event\.currentTarget,event\.clientX,event\.clientY\)/);
});
test('Text editing and transforming each have their own touch behaviors',()=>{
 assert.match(css,/\.hn-canvas \.hn-carolina-text-node\.transforming:not\(\.editing\)::after/);
 assert.match(css,/\.hn-canvas \.hn-carolina-page \.hn-carolina-added-text:has\(\.hn-carolina-text-node\.editing\)/);
 assert.match(css,/user-select:text;-webkit-user-select:text;-webkit-touch-callout:default;touch-action:auto/);
 assert.match(gesture,/!pinchUsed\.current/);
});
