import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const lab=readFileSync(new URL('../public/paper-video-lab.html',import.meta.url),'utf8');
test('LAB 5 uses user-selected video and video progress to transition to preview cover',()=>{
for(const s of ['id="video"','id="file"','id="cut"','id="play"','id="again"','id="skip"','video.currentTime','video.addEventListener(\'timeupdate\'','video.addEventListener(\'ended\'','URL.createObjectURL(selected)'])assert.ok(lab.includes(s),s);
assert.match(lab,/webkit-playsinline muted preload="metadata"/);
assert.match(lab,/data-done="false"/);
});
test('Video is local and detached from production Quotes or network writes',()=>{
assert.doesNotMatch(lab,/fetch\(|XMLHttpRequest|\/api\/|localStorage|indexedDB|new PageFlip/);
assert.match(lab,/URL.revokeObjectURL/);
const production=readFileSync(new URL('../src/features/magazine/FlipMagazine.tsx',import.meta.url),'utf8');
assert.doesNotMatch(production,/paper-video-lab/);
});

test('LAB video inline script parses as valid JavaScript',()=>{const script=lab.match(/<script>([\s\S]*?)<\/script>/)?.[1];assert.ok(script);assert.doesNotThrow(()=>new Function(script));});
