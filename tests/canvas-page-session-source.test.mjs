import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=p=>readFileSync(new URL('../src/features/editor/canvas/'+p,import.meta.url),'utf8');

test('Page navigation closes draft, editing, photo and picker through one shared session reset',()=>{
 const hook=src('hooks/useCanvasPageActions.ts');
 const block=hook.slice(hook.indexOf('const changePage ='),hook.indexOf('return {togglePageMenu'));
 assert.match(block,/clearSelection\(\)/);
 assert.match(block,/setTarget\(null\)/);
 assert.match(block,/setBank\(false\)/);
 assert.match(block,/setShowPageMenu\(false\)/);
 assert.match(block,/setError\(''\)/);
 assert.match(block,/setPage\(current =>/);
 for(const state of ['setPhotoLayersOpen','setTransformingId','setEditingId','setLastTextId','setSelectedPhotoId','setPhotoTool','setTrashHovered'])
   assert.doesNotMatch(block,new RegExp(state+'\\('),state+' must be reset by clearSelection');
 const selection=src('hooks/useCanvasSelectionState.ts');
 for(const state of ['setDraftText(null)','setEditingId(null)','setLastTextId(null)',
   'setActiveTextTool(null)','setSelectedPhotoId(null)','setTransformingId(null)'])
   assert.match(selection,new RegExp(state.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
});
test('Page switching only touches transient UI; all actual page writes use designLayout',()=>{
 const hook=src('hooks/useCanvasPageActions.ts');
 const block=hook.slice(hook.indexOf('const changePage ='),hook.indexOf('return {togglePageMenu'));
 assert.doesNotMatch(block,/edit\(|updateLayout\(|localStorage|fetch\(/);
 assert.match(hook,/edit\('designLayout',result\.layout\)/);
 assert.match(hook,/edit\('designLayout',next\.layout\)/);
});
