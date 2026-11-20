import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const lab=readFileSync(new URL('../public/paper-video-lab.html',import.meta.url),'utf8');
test('LAB 5 plays the actual local MP4 with no fabricated cover or visual blur',()=>{
for(const s of ['id="video"','id="file"','id="cut"','id="play"','id="again"','id="skip"',"video.addEventListener('timeupdate'", "video.addEventListener('ended'",'URL.createObjectURL(blob)','URL.revokeObjectURL(url)'])assert.ok(lab.includes(s),s);
assert.match(lab,/muted autoplay playsinline webkit-playsinline preload="auto"/);
assert.match(lab,/object-fit:contain/);
assert.doesNotMatch(lab,/cover-reveal|class="cover"|filter:blur|hn-cover-bottom/);
assert.match(lab,/Abrir HAVANA QUOTES/);
});
test('Lab caches the supplied video only in device IndexedDB, not D1, R2 or network',()=>{
assert.match(lab,/indexedDB.open\('hn-paper-lab5-local'/);
assert.match(lab,/readCachedVideo\(\)/);
assert.match(lab,/cacheVideo\(selected\)/);
assert.doesNotMatch(lab,/fetch\(|XMLHttpRequest|\/api\/|localStorage|new PageFlip/);
const production=readFileSync(new URL('../src/features/magazine/FlipMagazine.tsx',import.meta.url),'utf8');
assert.doesNotMatch(production,/paper-video-lab/);
});
test('LAB 5 video player inline script parses as valid JavaScript',()=>{
const source=lab.match(/<script>([\s\S]*?)<\/script>/)?.[1];assert.ok(source);assert.doesNotThrow(()=>new Function(source));
});