import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {inPaperCorner,startsPaperFold,isVerticalReadingScroll,
  completesPaperTurn,isQuickPaperTap} from '../src/features/magazine/magazine-gesture-intent.ts';
const root=new URL('../src/features/magazine/',import.meta.url);
const book=readFileSync(new URL('FlipMagazine.tsx',root),'utf8');
const hook=readFileSync(new URL('useMagazinePaperGesture.ts',root),'utf8');

test('A held corner can move the real leaf in both directions',()=>{
 assert.equal(inPaperCorner(.95,.93),true);
 assert.equal(inPaperCorner(.04,.05),true);
 assert.equal(inPaperCorner(.5,.5),false);
 assert.equal(startsPaperFold(-18,2,true),true);
 assert.equal(startsPaperFold(18,-3,true),true);
 assert.equal(startsPaperFold(-22,1,false),false);
 assert.equal(startsPaperFold(5,1,true),false);
 assert.match(hook,/flip\.startUserTouch\(relativePoint\(start\.x,start\.y\)\)/);
 assert.match(hook,/flip\.userMove\(relativePoint\(event\.clientX,event\.clientY\),true\)/);
 assert.match(hook,/flip\.userStop\(relativePoint\(event\.clientX,event\.clientY\)\)/);
});
test('Vertical screen scroll remains native and never triggers a fold',()=>{
 assert.equal(isVerticalReadingScroll(2,21),true);
 assert.equal(isVerticalReadingScroll(24,3),false);
 assert.match(book,/onTouchStartCapture=\{event=>event\.stopPropagation\(\)\}/);
 assert.match(book,/onTouchMoveCapture=\{event=>event\.stopPropagation\(\)\}/);
 assert.match(book,/onTouchEndCapture=\{event=>event\.stopPropagation\(\)\}/);
});
test('Releasing a short fold returns; releasing a deliberate turn completes',()=>{
 assert.equal(completesPaperTurn(-12,0,390,true),false);
 assert.equal(completesPaperTurn(-55,2,390,true),true);
 assert.equal(completesPaperTurn(-60,2,390,false),false);
 assert.equal(isQuickPaperTap(4,3,200),true);
 assert.equal(isQuickPaperTap(4,9,200),false);
 assert.match(hook,/const over=Math\.max\(14,Math\.min\(30,bounds\.pageWidth\*\.08\)\)/);
 assert.match(hook,/flip\.getBoundsRect\(\)/);
});
test('Exactly one PageFlip motor manages the gesture and V2 option defaults',()=>{
 assert.match(book,/flipOnClick: 'never'/);
 assert.match(book,/autoSize: false/);
 assert.match(book,/flippingTime: 650/);
 assert.match(book,/foldCornerOnHover: window\.matchMedia/);
 assert.match(book,/onPointerDown=\{paperGesture\.onPointerDown\}/);
 assert.match(book,/onPointerCancel=\{paperGesture\.onPointerCancel\}/);
 assert.match(book,/flip\.canTurn\('prev'\)/);
 assert.match(book,/flip\.flipPrev\('bottom'\)/);
 assert.match(book,/drawShadow: true/);
 assert.match(book,/maxShadowOpacity: 0\.72/);
 assert.match(book,/const pages = Array\.from\(source\.children\)\.map\(node => node\.cloneNode\(true\)\)/);
});
