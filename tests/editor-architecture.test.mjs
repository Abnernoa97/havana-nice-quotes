import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const read=p=>readFileSync(new URL('../src/'+p,import.meta.url),'utf8');
const canvasSource=()=>["TemplateCanvasEditor.tsx","components/CanvasPageToolbar.tsx","components/CanvasPageContent.tsx","interactions/createCanvasTextInteraction.ts","media/canvasPhotoUrl.ts","media/createCanvasPhotoActions.ts","components/CanvasPagePager.tsx","hooks/useCanvasPageActions.ts"].map(p=>read('features/editor/canvas/'+p)).join('\n');
test('Editor tiene una sola arquitectura activa y ningún archivo antiguo',()=>{
  const main=canvasSource();
  const workspace=read('features/editor/photos/PhotoEditingWorkspace.tsx');
  const dock=read('features/editor/photos/PhotoStyleDock.tsx');
  const layers=read('features/editor/photos/PhotoLayersPanel.tsx');
  const picker=read('features/editor/photos/PhotoSourcePicker.tsx');
  const text=read('features/editor/texts/TextStyleDock.tsx');
  const node=read('features/templates/CarolinaPhotoNode.tsx');
  const gesture=read('features/templates/useCarolinaGesture.ts');
  for(const old of ['TemplateCanvasEditor.tsx','PhotoStyleDock.tsx','PhotoEditingWorkspace.tsx',
      'TextStyleDock.tsx','ElegantFontBank.tsx','template-canvas.css','photo-style-dock.css'])
    assert.equal(existsSync(new URL('../src/features/editor/'+old,import.meta.url)),false,old);
  assert.match(main,/<PhotoEditingWorkspace photoId=\{selectedPhotoId\}/);
  assert.match(main,/<PhotoLayersPanel layers=\{photoLayers\}/);
  assert.match(main,/<PhotoSourcePicker target=\{target\}/);
  assert.match(main,/<TextStyleDock textId=\{lastTextId\}/);
  assert.match(workspace,/<PhotoStyleDock photoId=\{photoId\}/);
  assert.match(dock,/Colorizar/);
  assert.match(layers,/> Capas <strong>/);
  assert.match(picker,/Banco de fotos/);
  assert.match(text,/Tipografía/);
  assert.doesNotMatch(main,/imageEdit:/);
  assert.doesNotMatch(node,/effectMoved|effectMode/);
  assert.doesNotMatch(gesture,/imageEdit\?:/);
});

test('Navegación inferior única y gesto de desplazamiento vertical seguro',()=>{
 const canvas=canvasSource();
 const css=read('features/editor/canvas/template-canvas.css');
 const dock=read('features/editor/photos/PhotoStyleDock.tsx');
 assert.doesNotMatch(canvas,/hn-canvas-pages/);
 assert.match(canvas,/className="hn-canvas-pager"/);
 assert.doesNotMatch(css,/\.hn-canvas-pages/);
 assert.match(css,/touch-action:pan-y/);
 assert.match(dock,/pointerIntent/);
});
