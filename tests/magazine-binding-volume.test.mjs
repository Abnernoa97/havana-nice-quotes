import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const book=readFileSync(new URL('../src/features/magazine/FlipMagazine.tsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/features/magazine/flip-magazine.css',import.meta.url),'utf8');
test('Physical binding uses only real page count and active leaf, without extra PageFlip pages',()=>{
 assert.match(book,/total>1\?' hn-magazine-stage-bound'/);
 assert.match(book,/--hn-page-stack-depth/);
 assert.match(book,/--hn-page-stack-left/);
 assert.match(book,/--hn-page-stack-right/);
 assert.match(book,/const pages = Array\.from\(source\.children\)\.map\(node => node\.cloneNode\(true\)\)/);
 assert.match(book,/flip\.loadFromHTML\(host\.querySelectorAll<HTMLElement>\('\.hn-leaf'\)\)/);
 assert.doesNotMatch(book,/paper-experience-lab|paper-motion-studio|paper-video-lab/);
});
test('Under-page stack and spine are static, below the live leaf and never block touch',()=>{
 assert.match(css,/\.hn-magazine-stage-bound \.hn-flip-host\.stf__parent \.stf__wrapper::before/);
 assert.match(css,/\.hn-magazine-stage-bound \.hn-flip-host\.stf__parent \.stf__wrapper::after/);
 assert.match(css,/repeating-linear-gradient\(to bottom/);
 assert.match(css,/pointer-events:none/);
 assert.match(css,/z-index:-1/);
 assert.match(css,/@media\(max-width:700px\)/);
});
test('No standalone paper or video experiments remain in the source tree',()=>{
 for(const name of ['paper-experience-lab','paper-motion-studio','paper-video-lab']){
   assert.equal(existsSync(new URL('../public/'+name+'.html',import.meta.url)),false);
   assert.equal(existsSync(new URL('./'+name+'.test.mjs',import.meta.url)),false);
 }
});
