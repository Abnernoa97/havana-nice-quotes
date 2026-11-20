import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../src/features/editor/canvas/'+p,import.meta.url),'utf8');
test('Picker and immersive editor share one photo URL resolver',()=>{
 const editor=read('TemplateCanvasEditor.tsx'),resolver=read('media/canvasPhotoUrl.ts');
 assert.match(editor,/const url = canvasPhotoUrl\(item,id\)/);
 assert.match(editor,/url=\{canvasPhotoUrl\(item,selectedPhotoId\)\}/);
 assert.match(resolver,/if\(id==='photo:cover'\)/);
 assert.match(resolver,/id\.startsWith\('photo-extra:'\)/);
 assert.doesNotMatch(editor,/coverVideo \|\| item\.cover/);
});
