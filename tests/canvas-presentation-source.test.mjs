import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=p=>readFileSync(new URL('../src/features/editor/canvas/'+p,import.meta.url),'utf8');
test('Canvas sheet owns its drag-safe DOM without duplicating quote state',()=>{
  const editor=src('TemplateCanvasEditor.tsx'),sheet=src('components/CanvasSheetSurface.tsx');
  assert.match(editor,/<CanvasSheetSurface page=\{page\}/);
  assert.match(sheet,/className="hn-canvas-stage"/);
  assert.match(sheet,/className="hn-canvas-sheet"/);
  assert.match(sheet,/onClickCapture=\{event=>/);
  assert.match(sheet,/data-hn-text-trash/);
  assert.doesNotMatch(sheet,/useState|edit\('designLayout'/);
});
test('Text, photo, and media picker panels retain one shared canvas session',()=>{
  const editor=src('TemplateCanvasEditor.tsx'),panels=src('components/CanvasEditorPanels.tsx');
  assert.match(editor,/selection=\{selection\} mediaActions=\{mediaActions\} textActions=\{textActions\}/);
  assert.match(panels,/<TextStyleDock textId=\{lastTextId\}/);
  assert.match(panels,/<PhotoEditingWorkspace photoId=\{selectedPhotoId\}/);
  assert.match(panels,/<PhotoSourcePicker target=\{target\}/);
  assert.match(panels,/onChoose=\{choose\} onChooseVideo=\{chooseVideo\}/);
  assert.doesNotMatch(panels,/useState|edit\('designLayout'/);
});
