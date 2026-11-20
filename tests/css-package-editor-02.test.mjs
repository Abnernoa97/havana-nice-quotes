import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=p=>readFileSync(new URL('../src/'+p,import.meta.url),'utf8');
const rules=(s,sel)=>[...s.replace(/\/\*[\s\S]*?\*\//g,'').matchAll(/([^{}]+)\{([^{}]*)\}/g)].filter(m=>m[1].trim()===sel).map(m=>m[2]);
const css={
 studio:src('shared/styles/studio-experience.css'),
 magazine:src('features/magazine/flip-magazine.css'),
 styles:src('features/editor/styles/editorial-styles.css'),
 carolina:src('features/templates/carolina-template.css'),
 canvas:src('features/editor/canvas/template-canvas.css'),
 picker:src('features/editor/photos/photo-source-picker.css'),
 text:src('features/editor/texts/text-style-dock.css'),
 save:src('features/editor/quote-save-dialog.css'),
 price:src('features/editor/quote-pricing.css'),
};

test('Studio editor panel has one canonical border, shadow and white background',()=>{
 const x=rules(css.studio,'.editor-page .edit-panel');
 assert.equal(x.length,1);
 for(const prop of ['border: 1px solid var(--studio-line)','box-shadow: 0 12px 42px #233e3210','background: #fff'])assert.ok(x[0].includes(prop),prop);
});
test('3D magazine stage preserves geometry and vertical touch gestures in one rule',()=>{
 const x=rules(css.magazine,'.hn-magazine-stage');
 assert.equal(x.length,1);
 assert.match(x[0],/position:relative/);
 assert.match(x[0],/overflow:visible/);
 assert.match(css.magazine,/\.hn-magazine-stage,\.hn-magazine-stage \*\{touch-action:pan-y pinch-zoom!important\}/);
});
test('Recoverable personal template uses one rule for long-hold and selection',()=>{
 const x=rules(css.styles,'.hn-own-template');
 assert.equal(x.length,1);
 for(const prop of ['position:relative','touch-action:pan-y','user-select:none','-webkit-user-select:none'])assert.ok(x[0].includes(prop),prop);
 assert.match(css.styles,/\.hn-own-template\.is-armed\{/);
});
test('Carolina photo overlay keeps content display and preserves media pointer exceptions',()=>{
 const x=rules(css.carolina,'.hn-carolina-photo-overlay');
 assert.equal(x.length,1);
 assert.match(x[0],/display:contents/);
 assert.match(x[0],/pointer-events:none/);
 for(const prop of ['position:','inset:','z-index:'])assert.equal(x[0].includes(prop),false,prop);
 assert.match(css.carolina,/\.hn-carolina-photo-overlay \.hn-carolina-floating-photo\{[^}]*pointer-events:auto/);
});
test('Thirteen UI buttons inherit pointer cursor globally; disabled pager remains explicit',()=>{
 assert.match(src('shared/styles/index.css'),/button \{\s*cursor: pointer;/);
 const arr=[
 ['canvas','.hn-canvas-pager button'],['canvas','.hn-canvas-toolbar button'],
 ['canvas','.hn-canvas-toolbar .hn-page-kind-menu button'],
 ['picker','.hn-canvas-picker header button'],['picker','.hn-canvas-bank button:not(.hn-canvas-remove)'],
 ['picker','.hn-canvas-cloud-categories button'],
 ['text','.hn-text-dock-title>button'],['text','.hn-text-dock-switches button'],
 ['text','.hn-text-color-swatches button'],['text','.hn-text-scale-presets button'],
 ['save','.hn-save-dialog header button'],['save','.hn-save-options button'],
 ['price','.hn-deposit-options button']
 ];
 for(const [file,sel] of arr){
  const r=rules(css[file],sel);
  assert.ok(r.length>=1,sel);
  for(const block of r)assert.doesNotMatch(block,/cursor:\s*pointer/,sel);
 }
 assert.match(css.canvas,/\.hn-canvas-pager button:disabled\{opacity:\.35;cursor:default\}/);
});
