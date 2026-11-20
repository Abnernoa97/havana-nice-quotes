import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root=new URL('../src/features/magazine/',import.meta.url);
const css=readFileSync(new URL('flip-magazine.css',root),'utf8');
const code=readFileSync(new URL('FlipMagazine.tsx',root),'utf8');
test('V2-like metallic/satin leaf has subtle inset highlights and bound spine',()=>{
 assert.match(css,/\.hn-leaf\{[^}]*border:1px solid #d7d1c3;box-shadow:inset 0 1px 0 #fff9,inset 2px 0 7px #342c201c/);
 assert.match(css,/\.hn-leaf::before\{[^}]*linear-gradient\(90deg,#493e2e3b,#fff8ee36 55%,transparent\)/);
 assert.match(css,/\.hn-leaf::after\{[^}]*border:1px solid #8d765326/);
 assert.match(css,/\.hn-magazine-stage::before\{[^}]*radial-gradient\(ellipse,#2b302e4a/);
});
test('Paper finish is static and never steals touches from PageFlip',()=>{
 assert.match(css,/\.hn-leaf::before\{[^}]*pointer-events:none/);
 assert.match(css,/\.hn-leaf::after\{[^}]*pointer-events:none/);
 assert.match(css,/\.hn-magazine-stage::before\{[^}]*pointer-events:none/);
 assert.match(code,/drawShadow: true/);
 assert.match(code,/maxShadowOpacity: 0\.72/);
 assert.match(code,/flippingTime: 1080/);
 assert.match(code,/const pages = Array\.from\(source\.children\)\.map\(node => node\.cloneNode\(true\)\)/);
 assert.match(css,/\.hn-magazine-stage,\.hn-magazine-stage \*\{touch-action:pan-y pinch-zoom!important\}/);
});
