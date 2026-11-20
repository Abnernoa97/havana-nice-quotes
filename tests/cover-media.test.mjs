import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=path=>readFileSync(new URL('../src/'+path,import.meta.url),'utf8');
const worker=()=>readFileSync(new URL('../worker/index.ts',import.meta.url),'utf8');
test('Portada: el mismo botón + permite elegir o cambiar foto/video sin duplicar herramientas',()=>{
 const prompt=src('features/templates/CoverAddPrompt.tsx');
 const css=src('features/templates/cover-add-prompt.css');
 const carolina=src('features/templates/CarolinaTemplate.tsx');
 const editorial=src('features/templates/EditorialTemplate.tsx');
 assert.match(prompt,/occupied\?'Cambiar archivo':'Añadir archivo'/);
 assert.match(prompt,/onClick=\{event=>\{event\.stopPropagation\(\);onAdd\(\);\}\}/);
 assert.match(css,/hn-template-cover-add\.is-occupied/);
 for(const s of [carolina,editorial]){
  assert.match(s,/CoverAddPrompt onAdd=\{onSelectCover\} occupied=\{Boolean\(item\.cover \|\| item\.coverVideo\)\}/);
  assert.match(s,/<CoverMediaNode item=\{item\}/);
 }
});
test('Selector reutiliza fotos y videos privados en portada y páginas libres',()=>{
 const picker=src('features/editor/photos/PhotoSourcePicker.tsx');
 const hook=src('features/videos/useCloudVideoOptions.ts');
 const canvas=src('features/editor/canvas/TemplateCanvasEditor.tsx')+'\n'+src('features/editor/canvas/media/createCanvasPhotoActions.ts');
 const app=src('app/App.tsx');
 assert.match(picker,/const canPickVideo=cover\|\|/);
 assert.match(picker,/canPickVideo&&bank&&kind==='videos'/);
 assert.match(picker,/Fotografías/);
 assert.match(picker,/<Clapperboard size=\{16\}\/> Videos/);
 assert.match(picker,/onChooseVideo\?\.\(video\.url\)/);
 assert.match(hook,/fetch\('\/api\/videos',\{credentials:'same-origin'/);
 assert.match(canvas,/const chooseVideo=\(url:string\)=>applyMedia\(url,true\)/);
 assert.match(canvas,/edit\('coverVideo',video\?url:''\)/);
 assert.match(canvas,/edit\('cover',video\?'':url\)/);
 assert.match(canvas,/onChoose=\{choose\} onChooseVideo=\{chooseVideo\}/);
 assert.match(app,/return saved\.url/);
});
test('Foto y video de portada comparten edición, efectos y reproducción con pausa fuera de pantalla',()=>{
 const cover=src('features/templates/CoverMediaNode.tsx');
 const shared=src('features/templates/CarolinaPhotoNode.tsx');
 const mag=src('features/magazine/FlipMagazine.tsx');
 assert.match(cover,/url=\{item\.coverVideo\|\|item\.cover\}/);
 assert.match(cover,/photoStyle=\{item\.designLayout\?\.photoStyles\?\.\['photo:cover'\]\}/);
 assert.match(cover,/interaction=\{interaction\} onSelect=\{onSelect\}/);
 assert.match(shared,/data-hn-video-src=\{url\} poster=\{posterSrc\} muted loop playsInline disablePictureInPicture[\s\S]*preload="none"/);
 assert.match(shared,/src=\{posterSrc\} alt="" draggable=\{false\}/);
 assert.match(shared,/fetchPriority=\{cover\|\|pageBackground\?'high':'auto'\}/);
 assert.match(shared,/onError=\{recoverMissingPoster\}/);
 assert.doesNotMatch(shared,/src=\{url\} autoPlay/);
 assert.match(shared,/IntersectionObserver/);
 assert.match(shared,/media\.pause\(\)/);
 assert.match(shared,/photoStyle\?\.opacity/);
 assert.match(mag,/item\.coverVideo/);
 assert.match(mag,/const syncCoverVideos=/);
 assert.match(mag,/syncCoverVideos\(next\)/);
 assert.match(mag,/syncCoverVideos\(0\)/);
 assert.match(mag,/media\.controls=false/);
 assert.match(mag,/querySelectorAll\('video'\)\.forEach\(media=>media\.pause\(\)\)/);
 assert.match(worker(),/q\.coverVideo === undefined/);
 assert.match(worker(),/coverVideo/);
});
