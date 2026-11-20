import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const book=readFileSync(new URL('../src/features/magazine/FlipMagazine.tsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/features/magazine/flip-magazine.css',import.meta.url),'utf8');

test('Physical book uses PageFlip bounds and real page count',()=>{
  assert.match(book,/getBlockElement\(\)/);
  assert.match(book,/getBoundingClientRect\(\)/);
  assert.match(book,/pageBlockResize=new ResizeObserver/);
  assert.match(book,/pageBlockResize\.observe\(flip\.getBlockElement\(\)\)/);
  assert.match(book,/window\.addEventListener\('resize',schedulePhysicalPageBlock\)/);
  assert.match(book,/cleanupPhysicalPageBlock\(\)/);
  assert.match(book,/schedulePhysicalPageBlock\(\)/);
  assert.match(book,/--hn-page-stack-depth/);
  assert.match(book,/data-book-orientation=\{orientation\}/);
  assert.match(book,/total>1&&<div className="hn-magazine-page-block"/);
  assert.match(book,/flip\.loadFromHTML\(host\.querySelectorAll<HTMLElement>\('\.hn-leaf'\)\)/);
  assert.match(book,/const pages = Array\.from\(source\.children\)\.map\(node => node\.cloneNode\(true\)\)/);
});
test('Premium magazine binding is tapered and has an upper notch connected with bottom fore-edge',()=>{
  for(const part of ['hn-magazine-page-block-bottom','hn-magazine-page-block-side','hn-magazine-page-block-spine']){
    assert.match(book,new RegExp(part));
    assert.match(css,new RegExp('\\.'+part+' \\{'));
  }
  assert.match(css,/\.hn-magazine-page-block \{[\s\S]*?z-index: 0/);
  assert.match(css,/\.hn-magazine-stage-bound \.hn-magazine-surface \{z-index: 1\}/);
  assert.match(css,/clip-path: polygon\(0 0,100% 0,100% 64%/);
  assert.match(css,/skewY\(-0\.27deg\)/);
  assert.match(css,/repeating-linear-gradient\(to bottom/);
  assert.match(css,/\.hn-magazine-page-block-spine::before/);
  assert.match(css,/\.hn-v2-book-paper \.hn-leaf::before/);
  assert.match(css,/\.hn-v2-book-paper \.hn-leaf\.hn-leaf-cover::before/);
  assert.match(css,/data-book-orientation="landscape"/);
  assert.match(css,/pointer-events:none!important/);
  assert.match(css,/margin-bottom: calc\(var\(--hn-page-stack-depth\) \+ 9px\)/);
  assert.doesNotMatch(css,/\.hn-magazine-stage-bound::after/);
  assert.doesNotMatch(css,/\.stf__wrapper::before/);
});
test('No standalone cinematic labs or fabricated pages',()=>{
  for(const name of ['paper-experience-lab','paper-motion-studio','paper-video-lab']){
    assert.equal(existsSync(new URL('../public/'+name+'.html',import.meta.url)),false);
    assert.equal(existsSync(new URL('./'+name+'.test.mjs',import.meta.url)),false);
  }
  assert.doesNotMatch(book,/paper-experience-lab|paper-motion-studio|paper-video-lab/);
});