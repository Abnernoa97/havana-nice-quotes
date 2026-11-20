import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const canvas=["TemplateCanvasEditor.tsx","components/CanvasPageToolbar.tsx","components/CanvasPageContent.tsx","interactions/createCanvasTextInteraction.ts","media/canvasPhotoUrl.ts","media/createCanvasPhotoActions.ts","interactions/createCanvasRemovalActions.ts","interactions/createCanvasTextStyleActions.ts","hooks/useCanvasSelectionState.ts","components/CanvasPagePager.tsx","components/CanvasSheetSurface.tsx","components/CanvasEditorPanels.tsx","hooks/useCanvasPageActions.ts"].map(p=>readFileSync(new URL('../src/features/editor/canvas/'+p,import.meta.url),'utf8')).join('\n');
const block=(start,end)=>{
  const a=canvas.indexOf(start);
  const b=canvas.indexOf(end,a+start.length);
  assert.ok(a>=0&&b>a,'Missing editor section: '+start);
  return canvas.slice(a,b);
};

test('Page menu and photo picker never appear together',()=>{
  assert.match(canvas,/const pageMenuVisible=showPageMenu&&target===null&&!lastTextId&&!selectedPhotoId&&!transformingId&&!editingId/);
  assert.match(canvas,/\{pageMenuVisible&&<div className="hn-page-kind-menu"/);
  assert.match(canvas,/\{target !== null && createPortal\(/);
  const addPhoto=block('const addPhotoAnywhere=','const addPhotoBlock');
  assert.match(addPhoto,/setShowPageMenu\(false\)/);
  assert.match(addPhoto,/clearSelection\(\)/);
  assert.match(addPhoto,/setTarget\(`extra:\$\{crypto.randomUUID\(\)\}`\)/);
});

test('Switching to text or another media source dismisses previous tool',()=>{
  const addText=block('const addFreeText =','const isPhotoId =');
  assert.match(addText,/setShowPageMenu\(false\)/);
  assert.match(addText,/setTarget\(null\);setBank\(false\)/);
  const selectPhoto=block('const selectPhoto =','const movePhotoLayer');
  assert.match(selectPhoto,/setShowPageMenu\(false\)/);
  const picker=block('const open =','const close =');
  assert.match(picker,/setShowPageMenu\(false\)/);
  const photoBlock=block('const addPhotoBlock','const open =');
  assert.match(photoBlock,/setShowPageMenu\(false\)/);
});

test('Opening pages closes photo/text tools; outside tap and Escape dismiss menu',()=>{
  const toggle=block('const togglePageMenu=','const addPage=');
  assert.match(toggle,/if\(busy\)return/);
  assert.match(toggle,/clearSelection\(\);setTarget\(null\);setBank\(false\)/);
  assert.match(toggle,/setShowPageMenu\(true\)/);
  assert.match(toggle,/!event\.target\.closest\('\.hn-page-kind-wrap'\)/);
  assert.match(toggle,/event\.key==='Escape'/);
  assert.match(canvas,/onTogglePageMenu=\{togglePageMenu\}/);
  assert.match(canvas,/onClick=\{onTogglePageMenu\}/);
  assert.match(canvas,/aria-expanded=\{pageMenuVisible\}/);
});

test('Different quotations reset their transient menu and editing state',()=>{
  const reset=readFileSync(new URL('../src/features/editor/canvas/hooks/useCanvasSelectionState.ts',import.meta.url),'utf8');
  assert.match(reset,/setTarget\(null\)/);
  assert.match(reset,/setDraftText\(null\)/);
  assert.match(reset,/setShowPageMenu\(false\)/);
});
