import test from 'node:test';
import assert from 'node:assert/strict';
import {createQuoteDraft,createOwnTemplate,duplicateQuote} from '../src/features/quotes/model.ts';
import {carolinaPageOrder,validCarolinaLayout} from '../src/features/templates/carolina-layout.ts';
import {insertBlankPage,removeDesignPage} from '../src/features/templates/blank-pages.ts';

const PHOTO='/api/media/11111111-1111-1111-1111-111111111111';
const IMAGE='/api/videos/22222222-2222-2222-2222-222222222222';
const EXTRA='33333333-3333-3333-3333-333333333333';

test('Historical quotation without designLayout keeps original cover, collage and terms',()=>{
 const old={...createQuoteDraft('old'),style:'carolina',
  name:'Historic quote',cover:PHOTO,gallery:[PHOTO],coverVideo:IMAGE,
  carolinaCopy:{service:'Live Band'},designLayout:undefined};
 const saved=JSON.stringify(old);
 const template=createOwnTemplate('template-old',old);
 assert.deepEqual(carolinaPageOrder(old.designLayout),[0,1,2]);
 assert.deepEqual(carolinaPageOrder(template.designLayout),[0,1,2]);
 assert.equal(template.designLayout,undefined);
 assert.equal(template.cover,PHOTO);
 assert.equal(template.coverVideo,IMAGE);
 assert.deepEqual(template.gallery,[PHOTO]);
 assert.deepEqual(template.carolinaCopy,{service:'Live Band'});
 assert.equal(template.style,'carolina');
 assert.equal(template.name,'');
 assert.equal(template.isTemplate,true);
 assert.equal(JSON.stringify(old),saved);
});

test('Sourced template has independent nested design, text, styles and media references',()=>{
 const source={...createQuoteDraft('original'),style:'carolina',name:'Couple',
  designLayout:{pageOrder:[0,1,2,3],
   extras:[{id:EXTRA,page:3,text:'Original'}],
   textStyles:{['extra:'+EXTRA]:{color:'#123456',size:110}},
   photoStyles:{'photo:cover':{opacity:45}},
   extraPhotos:[{id:EXTRA,page:3,url:PHOTO}]}};
 assert.equal(validCarolinaLayout(source.designLayout),true);
 const pristine=JSON.stringify(source);
 const template=createOwnTemplate('own-template',source);
 assert.deepEqual(template.designLayout,source.designLayout);
 assert.notEqual(template.designLayout,source.designLayout);
 assert.notEqual(template.designLayout.extras,source.designLayout.extras);
 assert.notEqual(template.designLayout.textStyles,source.designLayout.textStyles);
 template.designLayout.extras[0].text='Edited template text';
 template.designLayout.textStyles['extra:'+EXTRA].color='#abcdef';
 template.designLayout.extraPhotos[0].url=IMAGE;
 const added=insertBlankPage(template.designLayout,3);
 assert.equal(validCarolinaLayout(added.layout),true);
 const removed=removeDesignPage(added.layout,added.page);
 assert.equal(validCarolinaLayout(removed.layout),true);
 assert.equal(JSON.stringify(source),pristine,'Editing a derived template must never touch its source quote');
});

test('New blank template still starts with one independent empty sheet',()=>{
 const a=createOwnTemplate('a'),b=createOwnTemplate('b');
 assert.deepEqual(carolinaPageOrder(a.designLayout),[3]);
 assert.equal(validCarolinaLayout(a.designLayout),true);
 a.designLayout.pageOrder.push(4);
 assert.deepEqual(b.designLayout.pageOrder,[3]);
 assert.deepEqual(duplicateQuote(a,'copy').designLayout.pageOrder,[3,4]);
});
