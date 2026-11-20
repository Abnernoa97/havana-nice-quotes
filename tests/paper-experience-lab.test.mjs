import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../public/paper-experience-lab.html',import.meta.url),'utf8');
test('Paper Experience LAB is a standalone static page with its own state and no production imports',()=>{
 assert.match(html,/The Paper Experience/);
 assert.match(html,/id="stage" data-state="idle"/);
 assert.match(html,/@keyframes camera-move/);
 assert.match(html,/@keyframes fold-left/);
 assert.match(html,/@keyframes fold-right/);
 assert.match(html,/animationend/);
 assert.match(html,/prefers-reduced-motion/);
 assert.match(html,/id="skip"/);
 assert.match(html,/id="reset"/);
 assert.doesNotMatch(html,/\/api\/|fetch\s*\(|localStorage|sessionStorage|designLayout|QuoteShareDialog/);
});
test('The separate intro never changes the existing 3D book or quotation data',()=>{
 const src=readFileSync(new URL('../src/features/magazine/FlipMagazine.tsx',import.meta.url),'utf8');
 assert.match(src,/new PageFlip\(host/);
 assert.doesNotMatch(src,/paper-experience-lab/);
});
