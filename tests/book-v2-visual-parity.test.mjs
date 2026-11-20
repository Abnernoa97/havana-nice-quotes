import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../src/'+p,import.meta.url),'utf8');
const v2=read('features/magazine/flip-magazine.css');
const book=read('features/magazine/FlipMagazine.tsx');
const container=read('features/editor/quote-publish.css');
test('V2 book is presented at its actual mobile stage scale, not reduced by the editor card',()=>{
 assert.match(v2,/\.hn-magazine-stage\{min-height:0;height:min\(142vw,72svh\)\}/);
 assert.match(v2,/\.hn-magazine-surface\{min-height:0;height:100%;max-width:100%\}/);
 assert.match(container,/\.hn-publish-document \{ position: relative; left: 50%; transform: translateX\(-50%\)/);
 assert.match(container,/width: calc\(100vw - 16px\)/);
});
test('V2 cream, spine, fine print border, metallic details and real page folios are retained',()=>{
 assert.match(v2,/\.hn-magazine\{background:#f3eddf/);
 assert.match(v2,/\.hn-leaf\.hn-leaf-photo\{background:linear-gradient\(90deg,#e5dfd2/);
 assert.match(v2,/\.hn-quote-book-cover-corner\{/);
 assert.match(v2,/\.hn-quote-book-cover-edition\{/);
 assert.match(v2,/\.hn-quote-book-folio\{/);
 assert.match(book,/hn-quote-book-folio/);
 assert.match(book,/String\(index\+1\)\.padStart\(2,'0'\)/);
 assert.doesNotMatch(book,/A proposal for <em>/);
});
test('Same single quote document and PageFlip engine; no media state or geometry mutation',()=>{
 assert.match(book,/const pages = Array\.from\(source\.children\)\.map\(node => node\.cloneNode\(true\)\)/);
 assert.match(book,/new PageFlip\(host/);
 assert.match(book,/pagePaperStyle\(item\.designLayout,selectedPage\)/);
 assert.match(book,/CarolinaBlankPage item=\{item\}/);
 assert.match(v2,/\.hn-magazine-stage,\.hn-magazine-stage \*\{touch-action:pan-y pinch-zoom!important\}/);
});
