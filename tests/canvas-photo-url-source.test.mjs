import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../src/features/editor/canvas/'+p,import.meta.url),'utf8');
test('Picker and immersive editor share one photo URL resolver',()=>{
 const editor=read('TemplateCanvasEditor.tsx'),resolver=read('media/canvasPhotoUrl.ts');
 const actions=read('media/createCanvasPhotoActions.ts');
 assert.match(actions,/const url = canvasPhotoUrl\(item,id\)/);
 assert.match(read('components/CanvasEditorPanels.tsx'),/url=\{canvasPhotoUrl\(item,selectedPhotoId\)\}/);
 assert.match(resolver,/const target=canvasPhotoTarget\(id\)/);
 assert.match(read('media/canvasPhotoTarget.ts'),/if\(id==='photo:cover'\)/);
 assert.match(read('media/canvasPhotoTarget.ts'),/id\.startsWith\('photo-extra:'\)/);
 assert.doesNotMatch(editor,/coverVideo \|\| item\.cover/);
});
