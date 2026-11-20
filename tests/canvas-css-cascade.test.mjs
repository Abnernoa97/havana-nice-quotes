import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css=readFileSync(new URL('../src/features/editor/canvas/template-canvas.css',import.meta.url),'utf8');
const cssRules=css.replace(/\/\*[\s\S]*?\*\//g,'').match(/[^{}]+\{[^{}]*\}/g)||[];
const exactBlocks=selector=>cssRules.filter(rule=>
  rule.slice(0,rule.indexOf('{')).trim()===selector);

test('The pager keeps its final sizing and spacing in one canonical CSS block',()=>{
 assert.equal(exactBlocks('.hn-canvas-pager').length,1);
 assert.equal(exactBlocks('.hn-canvas-pager button').length,1);
 assert.match(exactBlocks('.hn-canvas-pager')[0],/gap:9px;flex-wrap:nowrap/);
 assert.match(exactBlocks('.hn-canvas-pager button')[0],/flex:0 0 39px/);
 assert.match(css,/.hn-canvas-pager span\{min-width:53px/);
});
test('Editing text stays selectable, legible, and has one canonical rule',()=>{
 const active=exactBlocks('.hn-canvas .hn-carolina-text-node.editing');
 assert.equal(active.length,1);
 assert.match(active[0],/font-size:max\(16px,1em\)/);
 assert.match(active[0],/user-select:text;-webkit-user-select:text/);
 assert.match(active[0],/-webkit-touch-callout:none;touch-action:auto/);
});
test('Long-hold grids and mobile toolbar keep their final gesture rules',()=>{
 assert.doesNotMatch(css,/\.hn-canvas \.hn-carolina-page\.hn-layout-grid\s*\{\s*touch-action:pan-y/);
 assert.match(css,/\.hn-canvas \.hn-carolina-page\.hn-layout-grid,\s*\.hn-canvas\.hn-text-focus \.hn-carolina-page\{touch-action:none\}/);
 assert.match(css,/@media\(max-width:530px\)\{\.hn-canvas-toolbar>button\{flex:1 1 28%/);
});
