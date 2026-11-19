import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('Video: muestra JPEG ligero y de alta prioridad antes de descargar el stream',()=>{
 const node=source('src/features/templates/CarolinaPhotoNode.tsx');
 assert.match(node,/const posterUrl=isVideo\?url\+'\/poster':undefined/);
 assert.match(node,/className="hn-carolina-image-fill hn-carolina-video-poster"/);
 assert.match(node,/fetchPriority=\{cover\?'high':'auto'\}/);
 assert.match(node,/loading=\{cover\|\|pageBackground\?'eager':'lazy'\}/);
 assert.ok(node.indexOf('hn-carolina-video-poster')<node.indexOf('hn-carolina-video-fill'));
 assert.match(node,/src=\{url\} poster=\{posterSrc\} muted loop playsInline disablePictureInPicture[\s\S]*preload=\{cover\|\|pageBackground\?'metadata':'none'\}/);
 assert.doesNotMatch(node,/src=\{url\} autoPlay/);
 assert.match(node,/IntersectionObserver/);
 assert.match(node,/media\.pause\(\)/);
 const css=source('src/features/templates/carolina-template.css');
 assert.match(css,/\.hn-carolina-video-poster\{object-fit:cover;background:#1a2d25/);
});

test('Vista cliente: 3D, Scroll y Diseñador usan el mismo fotograma previo',()=>{
 const node=source('src/features/templates/CarolinaPhotoNode.tsx');
 const cover=source('src/features/templates/CoverMediaNode.tsx');
 const carolina=source('src/features/templates/CarolinaTemplate.tsx');
 const editorial=source('src/features/templates/EditorialTemplate.tsx');
 const flip=source('src/features/magazine/FlipMagazine.tsx');
 const proposal=source('src/features/client/Proposal.tsx');
 assert.match(cover,/<CarolinaPhotoNode cover/);
 assert.match(carolina,/<CoverMediaNode item=\{item\}/);
 assert.match(editorial,/<CoverMediaNode item=\{item\}/);
 assert.match(carolina,/<CarolinaPhotoNode/);
 assert.match(proposal,/<CarolinaDocument item=\{item\}/);
 assert.match(flip,/const pages = Array\.from\(source\.children\)\.map\(node => node\.cloneNode\(true\)\)/);
 assert.match(flip,/syncCoverVideos\(next\)/);
 assert.match(node,/poster=\{posterSrc\}/);
});

test('El JPEG ya está servido desde R2 sin tener que volver a convertir los videos',()=>{
 const api=source('worker/videos.ts');
 const uploader=source('src/features/videos/useVideoLibrary.ts');
 const poster=source('src/features/videos/video-posters.ts');
 assert.match(api,/videoPosterKey/);
 assert.match(api,/action==='poster'&&\(method==='PUT'\|\|method==='GET'\|\|method==='HEAD'\)/);
 assert.match(api,/'Cache-Control':'private, max-age=86400'/);
 assert.match(api,/const object=await store\.MEDIA\.get\(poster\)/);
 assert.match(uploader,/saveVideoPoster\(session\.id,converted\.poster\)/);
 assert.match(poster,/const posterPending=new Map<string,Promise<boolean>>\(\)/);
 assert.match(poster,/if\(ongoing\)return ongoing/);
 assert.match(source('src/features/templates/CarolinaPhotoNode.tsx'),/if\(!isVideo \|\| !interaction \|\| posterAttempt\.current===url\)return/);
});
