import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const pkg=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8'));
const lock=readFileSync(new URL('../bun.lock',import.meta.url),'utf8');
const book=readFileSync(new URL('../src/features/magazine/FlipMagazine.tsx',import.meta.url),'utf8');
const gesture=readFileSync(new URL('../src/features/magazine/useMagazinePaperGesture.ts',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/features/magazine/flip-magazine.css',import.meta.url),'utf8');

test('Portrait return uses maintained curl engine, not the sliding legacy engine',()=>{
 assert.equal(pkg.dependencies['@gullabs/flipbook-core'],'3.2.2');
 assert.equal(pkg.dependencies['page-flip'],undefined);
 assert.match(lock,/"@gullabs\/flipbook-core": \["@gullabs\/flipbook-core@3\.2\.2"/);
 assert.doesNotMatch(lock,/"page-flip": \["page-flip@2\.0\.7"/);
 assert.match(book,/import \{ PageFlip \} from '@gullabs\/flipbook-core'/);
 assert.match(book,/flip\.flipPrev\('bottom'\)/);
 assert.doesNotMatch(book,/getFlipController|getPageCollection/);
});
test('Portrait back navigation uses public canTurn and keeps single engine',()=>{
 assert.match(book,/if\(direction==='next'&&flip\.canTurn\('next'\)\)/);
 assert.match(book,/else if\(direction==='prev'&&flip\.canTurn\('prev'\)\)/);
 assert.equal((book.match(/new PageFlip\(/g)||[]).length,1);
 assert.match(book,/flip\.loadFromHTML\(/);
 assert.match(book,/const next=e\.data\.page/);
 assert.match(book,/setOrientation\(e\.data\.orientation\)/);
 assert.match(book,/const busy=e\.data\.state==='flipping'/);
});
test('Custom corner drag and satin styles survive core engine migration',()=>{
 assert.match(book,/pointerInput: \['mouse'\]/);
 assert.match(book,/flipOnClick: 'never'/);
 assert.match(book,/allowTouchScroll: true/);
 assert.match(book,/pageBackground: '#f8f6f0'/);
 assert.match(gesture,/flip\.getBlockElement\(\)\.getBoundingClientRect\(\)/);
 assert.match(gesture,/flip\.startUserTouch\(/);
 assert.match(gesture,/flip\.userMove\(/);
 assert.match(gesture,/flip\.userStop\(/);
 assert.match(css,/\.hn-leaf::before/);
 assert.match(css,/\.hn-leaf::after/);
});
