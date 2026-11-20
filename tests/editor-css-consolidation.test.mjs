import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../src/features/editor/'+p,import.meta.url),'utf8');
const blocks=(css,selector)=>(css.replace(/\/\*[\s\S]*?\*\//g,'').match(/[^{}]+\{[^{}]*\}/g)||[])
 .filter(block=>block.slice(0,block.indexOf('{')).trim()===selector);

test('Photo editor retains one base rule per scrolling and gesture surface',()=>{
 const css=read('photos/photo-style-dock.css'),base=css.split('@media(')[0];
 for(const selector of ['.hn-photo-workspace-stage','.hn-photo-workspace-frame.editing-effect',
   '.hn-photo-workspace .hn-photo-expanded','.hn-photo-workspace .hn-photo-tools-rail',
   '.hn-photo-workspace .hn-photo-switches'])
   assert.equal(blocks(base,selector).length,1,selector);
 assert.match(blocks(base,'.hn-photo-workspace-stage')[0],/overflow:hidden;overflow-y:auto/);
 assert.match(blocks(base,'.hn-photo-workspace-frame')[0],/touch-action:none/);
 assert.doesNotMatch(blocks(base,'.hn-photo-workspace-frame.editing-effect')[0],/touch-action:/);
 assert.match(blocks(base,'.hn-photo-workspace .hn-photo-switches')[0],/touch-action:pan-x/);
 assert.match(css,/@media\(max-height:590px\)/);
});
test('Text panel has one base expanded rule without a redundant border override',()=>{
 const css=read('texts/text-style-dock.css');
 assert.equal(blocks(css,'.hn-text-dock-expanded').length,1);
 assert.match(blocks(css,'.hn-text-dock-expanded')[0],/border-top:0/);
 assert.match(css,/@media\(max-width:410px\)/);
});
test('Media selector stays above the photo workspace without repeated z-index declarations',()=>{
 const picker=read('photos/photo-source-picker.css');
 const photo=read('photos/photo-style-dock.css');
 // The second .hn-canvas-shade rule is the intentional mobile @media override.
 // Count only canonical base rules; the mobile override is checked separately.
 const base=picker.split('@media(')[0];
 assert.equal(blocks(base,'.hn-canvas-shade').length,1);
 assert.match(blocks(base,'.hn-canvas-shade')[0],/z-index:1100/);
 assert.match(picker,/@media\(max-width:550px\)\{\.hn-canvas-shade\{padding:7px\}/);
 assert.match(blocks(photo,'.hn-photo-workspace')[0],/z-index:1000/);
});
