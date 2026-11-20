import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../public/paper-motion-studio.html',import.meta.url),'utf8');
test('Three working animation studies can be selected and replayed without touching production',()=>{
for(const token of ['data-pick="still"','data-pick="spine"','data-pick="lift"',
'@keyframes real-still','@keyframes spine-glide','@keyframes leaf-sweep',
'id="start"','id="again"','id="skip"','id="duration"'])assert.ok(html.includes(token),token);
assert.match(html,/stage\.addEventListener\('animationend'/);
assert.match(html,/history\.replaceState\(null,'',url\)/);
assert.doesNotMatch(html,/<script[^>]+src=|new PageFlip\(|\/api\/|localStorage/);
});
test('Uploaded real photographs remain on phone; no server upload or persisted customer data',()=>{
assert.match(html,/URL\.createObjectURL\(file\)/);
assert.match(html,/URL\.revokeObjectURL\(localUrl\)/);
assert.doesNotMatch(html,/fetch\(|XMLHttpRequest|FormData|FileReader|designLayout/);
assert.match(html,/prefers-reduced-motion/);
});
test('The separate studio does not get wired into quote production',()=>{
const src=readFileSync(new URL('../src/features/magazine/FlipMagazine.tsx',import.meta.url),'utf8');
assert.match(src,/new PageFlip\(host/);
assert.doesNotMatch(src,/paper-motion-studio/);
});
