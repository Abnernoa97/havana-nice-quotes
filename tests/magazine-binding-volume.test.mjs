import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const book=readFileSync(new URL('../src/features/magazine/FlipMagazine.tsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/features/magazine/flip-magazine.css',import.meta.url),'utf8');
test('Physical binding follows the real PageFlip block',()=>{
 assert.match(book,/getBlockElement\(\)/);
 assert.match(book,/getBoundingClientRect\(\)/);
 assert.match(book,/pageBlockResize=new ResizeObserver/);
 assert.match(book,/pageBlockResize\.observe\(flip\.getBlockElement\(\)\)/);
 assert.match(book,/window\.addEventListener\('resize',schedulePhysicalPageBlock\)/);
 assert.match(book,/cleanupPhysicalPageBlock\(\)/);
 assert.match(book,/hn-magazine-page-block-spine/);
 assert.match(book,/flip\.loadFromHTML\(host\.querySelectorAll<HTMLElement>\('\.hn-leaf'\)\)/);
 assert.doesNotMatch(book,/bindingRef|hn-magazine-binding/);
});
test('The outside spine is below the page, not a thick rail over its content',()=>{
 assert.match(css,/\.hn-magazine-stage-bound\[data-book-orientation="portrait"\]\{/);
 assert.match(css,/padding-inline:18px/);
 assert.match(css,/\.hn-magazine-page-block-spine\{/);
 assert.match(css,/left:-16px/);
 assert.match(css,/width:20px/);
 assert.match(css,/clip-path:polygon\(/);
 assert.match(css,/\.hn-magazine-page-block-spine::before/);
 assert.match(css,/\.hn-magazine-page-block-spine::after/);
 assert.match(css,/\.hn-magazine-stage-bound \.hn-magazine-surface \{z-index: 1\}/);
 assert.match(css,/\.hn-magazine-page-block \{[\s\S]*?z-index: 0/);
 assert.match(css,/pointer-events:none!important/);
 assert.doesNotMatch(css,/\.hn-magazine-binding\s*\{/);
 assert.doesNotMatch(css,/width:26px/);
});
test('Existing paper stack, gestures and one PageFlip motor remain',()=>{
 assert.match(css,/\.hn-magazine-page-block-bottom/);
 assert.match(css,/repeating-linear-gradient\(to bottom/);
 assert.match(book,/const pages = Array\.from\(source\.children\)\.map\(node => node\.cloneNode\(true\)\)/);
 assert.match(book,/flipOnClick: 'never'/);
 for(const name of ['paper-experience-lab','paper-motion-studio','paper-video-lab']){
  assert.equal(existsSync(new URL('../public/'+name+'.html',import.meta.url)),false);
  assert.equal(existsSync(new URL('./'+name+'.test.mjs',import.meta.url)),false);
 }
});