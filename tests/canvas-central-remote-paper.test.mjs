import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../src/'+path,import.meta.url),'utf8');
const gesture=read('features/templates/useCarolinaGesture.ts');
const editor=read('features/editor/canvas/TemplateCanvasEditor.tsx');
const canvasCss=read('features/editor/canvas/template-canvas.css');
const book=read('features/magazine/FlipMagazine.tsx');
const bookCss=read('features/magazine/flip-magazine.css');

test('Only the selected item delegates otherwise empty-sheet pointer streams',()=>{
  assert.match(gesture,/if \(!selected \|\| disabled \|\| !interaction \|\| !node\.current\) return/);
  assert.match(gesture,/closest<HTMLElement>\('\.hn-canvas-sheet'\)/);
  assert.match(gesture,/const indirect = new Set<number>\(\)/);
  assert.match(gesture,/node\.current\?\.contains\(target\)/);
  assert.match(gesture,/begin\(event\.pointerId, event\.clientX, event\.clientY\)/);
  assert.match(gesture,/finish\(event\.pointerId, event\.clientX, event\.clientY, false\)/);
  assert.match(gesture,/sheet\.removeEventListener\('pointerdown', down\)/);
  assert.doesNotMatch(gesture,/document\.addEventListener\('pointerdown'/);
});

test('Completing an editing session centers the same real page',()=>{
  assert.match(editor,/const wasEditingRef=useRef\(false\)/);
  assert.match(editor,/!wasEditing\|\|hasActiveEdit/);
  assert.match(editor,/requestAnimationFrame/);
  assert.match(editor,/sheet\.scrollIntoView\(\{block:'center',inline:'nearest'/);
  assert.match(editor,/<section ref=\{canvasRef\} className=/);
});

test('Canvas and 3D leaves match V2 static paper edge treatment',()=>{
  assert.match(canvasCss,/\.hn-canvas-sheet::before\{[^}]*#493e2e3b/);
  assert.match(canvasCss,/\.hn-canvas-sheet::after\{[^}]*#8d765326/);
  assert.match(canvasCss,/pointer-events:none/);
  assert.match(book,/selectedPage===selectedPages\[0\]\?' hn-leaf-cover'/);
  assert.match(bookCss,/\.hn-leaf\.hn-leaf-cover::after\{[^}]*#f3e7c57a/);
});
