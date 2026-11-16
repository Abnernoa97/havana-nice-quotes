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
test('Selector de portada: fotos y videos ya convertidos en nube, solo en portada',()=>{
 const picker=src('features/editor/photos/PhotoSourcePicker.tsx');
 const hook=src('features/videos/useCloudVideoOptions.ts');
 const canvas=src('features/editor/canvas/TemplateCanvasEditor.tsx');
 const app=src('app/App.tsx');
 assert.match(picker,/cover&&bank&&kind==='videos'/);
 assert.match(picker,/Fotografías/);
 assert.match(picker,/<Clapperboard size=\{16\}\/> Videos/);
 assert.match(picker,/onChooseVideo\?\.\(video\.url\)/);
 assert.match(hook,/fetch\('\/api\/videos',\{credentials:'same-origin'/);
 assert.match(canvas,/const chooseVideo = \(url:string\) =>/);
 assert.match(canvas,/edit\('coverVideo',url\)/);
 assert.match(canvas,/edit\('cover',''\)/);
 assert.match(canvas,/if \(target==='cover'\) \{ edit\('cover',url\); edit\('coverVideo',''\); \}/);
 assert.match(app,/cover: saved\.url, coverVideo: ''/);
 assert.match(canvas,/onChoose=\{choose\} onChooseVideo=\{chooseVideo\}/);
});
test('Video seleccionado funciona en plantillas y lector 3D como medio, no como imagen rota',()=>{
 const node=src('features/templates/CoverMediaNode.tsx');
 const mag=src('features/magazine/FlipMagazine.tsx');
 assert.match(node,/if\(video\)/);
 assert.match(node,/<video ref=\{player\} className="hn-cover-video" src=\{video\}/);
 assert.match(node,/autoPlay muted loop playsInline disablePictureInPicture/);
 assert.doesNotMatch(node,/<video[^>]*\scontrols(?:\s|\/>)/);
 assert.match(node,/IntersectionObserver/);
 assert.match(node,/media\.pause\(\)/);
 assert.match(node,/return <CarolinaPhotoNode cover id="photo:cover"/);
 assert.match(mag,/item\.coverVideo/);
 assert.match(mag,/const syncCoverVideos=/);
 assert.match(mag,/syncCoverVideos\(next\)/);
 assert.match(mag,/syncCoverVideos\(0\)/);
 assert.match(mag,/media\.controls=false/);
 assert.match(mag,/querySelectorAll\('video'\)\.forEach\(media=>media\.pause\(\)\)/);
 assert.match(worker(),/q\.coverVideo === undefined/);
 assert.match(worker(),/coverVideo/);
});
