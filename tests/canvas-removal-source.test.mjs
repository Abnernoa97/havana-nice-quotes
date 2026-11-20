import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../src/features/editor/canvas/'+p,import.meta.url),'utf8');
test('Shared trash delegates text and photo removal without deleting R2 objects',()=>{
 const main=read('TemplateCanvasEditor.tsx');
 const actions=read('interactions/createCanvasRemovalActions.ts');
 assert.match(main,/createCanvasRemovalActions\(\{/);
 assert.match(actions,/const removeElement\s*=\s*\(id:string\) => isPhotoId\(id\) \? removePhoto\(id\) : removeText\(id\)/);
 assert.match(actions,/edit\('coverVideo',''\)/);
 assert.match(actions,/edit\('gallery',gallery\)/);
 assert.match(actions,/delete transforms\[id\]; delete fonts\[id\]; delete textStyles\[id\]/);
 assert.match(actions,/delete transforms\[id\]; delete photoStyles\[id\]/);
 assert.doesNotMatch(actions,/\.delete\(|\/api\/media\/delete|fetch\(/);
});
test('Text styles use the existing quote design layout without a second state store',()=>{
 const main=read('TemplateCanvasEditor.tsx');
 const style=read('interactions/createCanvasTextStyleActions.ts');
 assert.match(main,/createCanvasTextStyleActions\(\{/);
 assert.match(style,/fonts\[lastTextId\]=font/);
 assert.match(style,/updateLayout\(\{textStyles\}\)/);
 assert.doesNotMatch(style,/useState|localStorage|fetch\(/);
});
