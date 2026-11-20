import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const css=relative=>readFileSync(new URL('../src/'+relative,import.meta.url),'utf8');
const editor=css('features/editor/styles/editorial-styles.css');
const carolina=css('features/templates/carolina-template.css');
const editorial=css('features/templates/editorial-template.css');
const photo=css('features/editor/photos/photo-style-dock.css');
const selectors=(sheet,selector)=>[...sheet.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
  .filter(match=>match[1].trim()===selector).map(match=>match[2]);

test('Editorial controls and preview captions have one final base style',()=>{
 assert.equal(selectors(editor,'.hn-styles-tab').length,1);
 assert.match(selectors(editor,'.hn-styles-tab')[0],/padding:18px;display:grid;gap:12px/);
 assert.equal(selectors(editor,'.hn-card-caption').length,1);
 assert.match(selectors(editor,'.hn-card-caption')[0],/min-height:48px;justify-content:center/);
 assert.equal(selectors(editor,'.hn-card-caption strong').length,1);
 assert.match(selectors(editor,'.hn-card-caption strong')[0],/font-size:13px/);
});

test('Carolina media and text layering retain the final depth and transforms',()=>{
 assert.equal(selectors(carolina,'.hn-carolina-photo').length,1);
 assert.match(selectors(carolina,'.hn-carolina-photo')[0],/transform-origin:50% 50%/);
 assert.equal(selectors(carolina,'.hn-carolina-extra-layer').length,1);
 assert.match(selectors(carolina,'.hn-carolina-extra-layer')[0],/z-index:16/);
 assert.equal(selectors(carolina,'.hn-blank-page .hn-carolina-extra-layer').length,1);
 assert.match(selectors(carolina,'.hn-blank-page .hn-carolina-extra-layer')[0],/pointer-events:none/);
 assert.match(carolina,/\.hn-blank-page \.hn-carolina-photo-overlay \.hn-page-background\{z-index:0!important\}/);
});

test('Lane and Junebug have one terms-page rule each',()=>{
 assert.equal(selectors(editorial,'.hn-style-lane.hn-editorial-terms').length,1);
 assert.match(selectors(editorial,'.hn-style-lane.hn-editorial-terms')[0],/background:#f4efe6;color:#453d34;padding:11% 9%;gap:6%/);
 assert.equal(selectors(editorial,'.hn-style-junebug.hn-editorial-terms').length,1);
 assert.match(selectors(editorial,'.hn-style-junebug.hn-editorial-terms')[0],/background:#fff4e9;color:#634334;padding:9% 9% 8%/);
});

test('Photo editing retains crop gestures, docked rail and scrolling',()=>{
 const frame=selectors(photo,'.hn-photo-workspace-frame');
 assert.equal(frame.length,1);
 assert.match(frame[0],/touch-action:none/);
 assert.equal(selectors(photo,'.hn-photo-workspace-frame.editing-effect').length,1);
 assert.doesNotMatch(selectors(photo,'.hn-photo-workspace-frame.editing-effect')[0],/touch-action:/);
 assert.match(selectors(photo,'.hn-photo-workspace-frame:not(.editing-effect)')[0],/touch-action:pan-y/);
 assert.match(selectors(photo,'.hn-photo-workspace .hn-photo-expanded')[0],/overscroll-behavior:contain/);
 assert.match(selectors(photo,'.hn-photo-workspace .hn-photo-tools-rail')[0],/flex:0 0 auto/);
 assert.doesNotMatch(selectors(photo,'.hn-photo-workspace .hn-photo-switches')[0],/grid-template-columns/);
 assert.match(photo,/@media\(max-height:590px\)/);
});
