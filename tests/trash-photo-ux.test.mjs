import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=path=>readFileSync(new URL('../src/'+path,import.meta.url),'utf8');
const canvasSource=()=>['TemplateCanvasEditor.tsx','components/CanvasPageToolbar.tsx','components/CanvasPageContent.tsx','interactions/createCanvasTextInteraction.ts','media/canvasPhotoUrl.ts','hooks/useCanvasTapConfirmation.ts'].map(p=>src('features/editor/canvas/'+p)).join('\n');

test('Papelera: un solo filtro compacto, opciones aparecen al lado y se cierran al elegir',()=>{
 const trash=src('features/trash/TrashScreen.tsx');
 const menu=src('features/trash/TrashFilterMenu.tsx');
 const css=src('features/trash/trash.css');
 assert.match(trash,/<TrashFilterMenu filter=\{filter\}/);
 assert.doesNotMatch(trash,/hn-trash-filters|tabs\.map\(/);
 assert.match(menu,/onFilter\(option\.id\);setOpen\(false\)/);
 assert.match(menu,/aria-expanded=\{open\}/);
 assert.match(menu,/Cotizaciones/);
 assert.match(menu,/Fotos/);
 assert.match(menu,/Archivos/);
 assert.match(css,/\.hn-trash-filter-menu\{display:flex/);
 assert.match(css,/\.hn-trash-filter-options\{display:flex/);
 assert.match(css,/overflow-x:auto/);
});
test('Papelera: Marcar todo, selección individual y acordeón plegable, purga confirmada',()=>{
 const trash=src('features/trash/TrashScreen.tsx');
 assert.match(trash,/Marcar todo/);
 assert.match(trash,/setMarkedOpen\(true\)/);
 assert.match(trash,/onClick=\{markAll\}/);
 assert.match(trash,/selected\.length>0&&<section className="hn-trash-selected"/);
 assert.match(trash,/aria-expanded=\{markedOpen\}/);
 assert.match(trash,/checked=\{marked\.has\(keyOf\(item\)\)\}/);
 assert.match(trash,/onChange=\{event=>select\(item,event\.target\.checked\)\}/);
 assert.match(trash,/remaining=visible\.filter\(item=>!marked\.has\(keyOf\(item\)\)\)/);
 assert.match(trash,/bulk\('restore'\)/);
 assert.match(trash,/bulk\('purge'\)/);
 assert.match(trash,/window\.confirm\('¿Eliminar definitivamente '/);
 assert.match(trash,/setWorking\(true\)/);
});
test('Fotos y Videos comparten engranaje superior fijo con métricas combinadas',()=>{
 const screen=src('features/videos/MediaLibraryScreen.tsx');
 const stats=src('features/videos/MediaLibraryStats.tsx');
 const css=src('features/videos/media-library-screen.css');
 const photo=src('features/photos/PhotoBank.tsx');
 const video=src('features/videos/VideoBank.tsx');
 assert.match(screen,/hn-media-library-toolbar/);
 assert.match(screen,/aria-expanded=\{showStats\}/);
 assert.match(screen,/photoCount=\{photoProps\.photos\.length\}/);
 assert.match(screen,/videoCount=\{videos\.videos\.length\}/);
 assert.match(stats,/formatMediaBytes\(total\)/);
 assert.match(stats,/formatMediaBytes\(videoBytes\)/);
 assert.match(stats,/formatMediaBytes\(photoBytes\)/);
 assert.match(stats,/role="progressbar"/);
 assert.match(css,/position:sticky/);
 assert.doesNotMatch(photo,/libraryDetailsOpen/);
 assert.doesNotMatch(video,/hn-video-summary/);
});

test('Añadir fotografía es botón real tanto en Carolina como en todas las editoriales',()=>{
 const carolina=src('features/templates/CarolinaTemplate.tsx');
 const editorial=src('features/templates/EditorialTemplate.tsx');
 const prompt=src('features/templates/CoverAddPrompt.tsx');
 const photo=src('features/templates/CarolinaPhotoNode.tsx');
 const canvas=canvasSource();
 const css=src('features/templates/cover-add-prompt.css');
 for(const view of [carolina,editorial]){
   assert.match(view,/<CoverAddPrompt onAdd=\{onSelectCover\} occupied=\{Boolean\(item\.cover \|\| item\.coverVideo\)\}/);
 }
 assert.match(prompt,/<button type="button" className=\{'hn-template-cover-add'/);
 assert.match(prompt,/onClick=\{event=>\{event\.stopPropagation\(\);onAdd\(\);\}\}/);
 assert.match(prompt,/Añadir archivo/);
 assert.match(canvas,/onSelectCover=\{\(\)=>selectPhoto\('photo:cover'\)\}/);
 assert.match(canvas,/if \(!url\)/);
 assert.match(canvas,/if \(id==='photo:cover'\) open\('cover'\)/);
 assert.match(canvas,/if\(target==='cover'\)\{/);
 assert.match(canvas,/edit\('coverVideo',video\?url:''\)/);
 assert.match(css,/z-index:10/);
 assert.doesNotMatch(photo,/hn-carolina-cover-invite/);
});
