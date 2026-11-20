import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../src/features/editor/canvas/'+p,import.meta.url),'utf8');
test('Transient selections live in one hook and reset when quote or template changes',()=>{
 const main=read('TemplateCanvasEditor.tsx'),selection=read('hooks/useCanvasSelectionState.ts');
 assert.match(main,/useCanvasSelectionState\(item,setPage\)/);
 assert.equal((main.match(/useState</g)||[]).length,1);
 assert.match(selection,/\[item\.id, item\.style\]/);
 for(const reset of ['setTarget(null)','setEditingId(null)','setTransformingId(null)',
   'setSelectedPhotoId(null)','setDraftText(null)','setPhotoLayersOpen(false)',
   'setShowPageMenu(false)'])assert.ok(selection.includes(reset),reset);
});
test('Clearing selection closes mutually exclusive tools without modifying quote data',()=>{
 const selection=read('hooks/useCanvasSelectionState.ts');
 assert.match(selection,/const clearSelection=\(\)=>/);
 assert.match(selection,/setActiveTextTool\(null\)/);
 assert.match(selection,/setPhotoTool\(null\)/);
 assert.match(selection,/setLastTextId\(null\)/);
 assert.doesNotMatch(selection,/edit\('designLayout'|fetch\(|localStorage/);
});

test('Changing quotation also clears any unsaved confirmed text, old errors and gesture timing',()=>{
 const source=read('hooks/useCanvasSelectionState.ts');
 const reset=source.split('useEffect(() => {')[1].split('}, [item.id, item.style]);')[0];
 assert.match(reset,/clearSelection\(\)/);
 assert.match(reset,/setError\(''\)/);
 assert.match(reset,/newlyConfirmedText\.current=null/);
 assert.match(reset,/justMoved\.current=false/);
 assert.match(reset,/lastGestureMoveAt\.current=0/);
 assert.match(reset,/setShowPageMenu\(false\)/);
});
