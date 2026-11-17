import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=p=>readFileSync(new URL('../src/'+p,import.meta.url),'utf8');
const worker=p=>readFileSync(new URL('../worker/'+p,import.meta.url),'utf8');

test('Un solo engranaje fijo compartido y un panel de estadísticas para las dos pestañas',()=>{
 const screen=src('features/videos/MediaLibraryScreen.tsx');
 const stats=src('features/videos/MediaLibraryStats.tsx');
 const css=src('features/videos/media-library-screen.css');
 assert.match(screen,/useVideoLibrary\(enabled\)/);
 assert.match(screen,/aria-expanded=\{showStats\}/);
 assert.match(screen,/<PhotoBank \{\.\.\.photoProps\}/);
 assert.match(screen,/<VideoBank library=\{videos\}/);
 assert.match(stats,/photoCount:number;videoCount:number;photoBytes:number;videoBytes:number/);
 assert.match(stats,/const total=photoBytes\+videoBytes/);
 assert.match(stats,/5\*1024\*1024\*1024/);
 assert.match(stats,/role="progressbar"/);
 assert.match(css,/\.hn-media-library-toolbar\{[^}]*position:sticky/);
});

test('Galería video utiliza solo JPEG y dos columnas, sin reproductores ni etiquetas en las tarjetas',()=>{
 const video=src('features/videos/VideoBank.tsx');
 const poster=src('features/videos/VideoPoster.tsx');
 const css=src('features/videos/video-bank.css');
 assert.match(video,/videos\.map\(\(video,index\)=>/);
 assert.match(video,/<VideoPoster video=\{video\} priority=\{index<4\}/);
 assert.match(video,/hn-photo-bank-grid hn-video-grid/);
 assert.match(video,/setViewer\(id\)/);
 assert.match(video,/window\.confirm/);
 assert.match(video,/src=\{active\.url\} playsInline controls autoPlay/);
 assert.doesNotMatch(video,/<video[^>]*src=\{item\.url\}/);
 assert.doesNotMatch(video,/hn-video-card-details|hn-video-summary|hn-video-note|<strong>\{video\.name\}/);
 assert.match(poster,/<img src=/);
 assert.match(poster,/schedulePosterBackfill/);
 assert.match(css,/grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
});

test('Fotos y selector de Diseño muestran miniaturas, no decodifican originales salvo fallback',()=>{
 const photos=src('features/photos/PhotoBank.tsx');
 const tile=src('features/photos/PhotoThumbnail.tsx');
 const picker=src('features/editor/photos/PhotoSourcePicker.tsx');
 const library=src('features/photos/useMediaLibrary.ts');
 const helper=src('features/photos/photo-thumbnails.ts');
 assert.match(photos,/<PhotoThumbnail photo=\{photo\}/);
 assert.match(tile,/photo\.thumbnailUrl\?photo\.thumbnailUrl:photo\.url/);
 assert.match(tile,/loading=\{priority\?'eager':'lazy'\}/);
 assert.match(tile,/decoding="async"/);
 assert.match(tile,/queuePhotoThumbnail/);
 assert.match(picker,/<PhotoThumbnail photo=\{photo\}/);
 assert.match(picker,/<VideoPoster video=\{video\}/);
 assert.doesNotMatch(picker,/<video src=\{video\.url\}/);
 assert.match(library,/await thumbnailFromFile\(file\)/);
 assert.match(library,/savePhotoThumbnail\(data\.photo\.id/);
 assert.match(library,/120000/);
 assert.match(helper,/canvas\.toBlob/);
});

test('Miniaturas privadas de foto y video no alteran archivos originales ni las cotizaciones',()=>{
 const photos=worker('index.ts');
 const videos=worker('videos.ts');
 assert.match(photos,/photoThumbKey/);
 assert.match(photos,/kind:'photo-thumbnail'/);
 assert.match(photos,/photoThumbKey\(id\)/);
 assert.match(videos,/videoPosterKey/);
 assert.match(videos,/kind:'video-poster'/);
 assert.match(videos,/posterUrl:'\/api\/videos\/'/);
 assert.match(photos,/private, max-age=86400/);
 assert.match(videos,/private, max-age=86400/);
});
