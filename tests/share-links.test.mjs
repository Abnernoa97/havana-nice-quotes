import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ownerSharing,publicSharing} from '../worker/quote-sharing.ts';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const id='hn-aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';
const photoId='11111111-1111-4111-8111-111111111111';
const otherId='22222222-2222-4222-8222-222222222222';
const quote={
 id,quoteTitle:'Isabella Daniel',name:'Isabella & Daniel',client:'PRIVATE CLIENT',
 email:'secret@example.com',messages:[{from:'client',text:'Secret',time:'today'}],
 location:'Mexico',date:'2027-10-01',price:150000,deposit:40,currency:'MX',
 cover:'/api/media/'+photoId,coverVideo:'',gallery:[],
 designLayout:{pageOrder:[0,3]},status:'Listo para enviar',
 font:'editorial',color:'#18342f',note:'Hello',package:'Quintet',
 desc:'Live music',style:'libre',readingMode:'flip',
};
function mock(){
 const links=new Map(),q={...quote};
 const DB={prepare(sql){
  let args=[];
  return {
   bind(...values){args=values;return this;},
   async first(){
    if(sql.includes('FROM quote_links WHERE token ='))return links.get(args[0])||null;
    if(sql.includes('FROM quote_links WHERE quote_id ='))return [...links.values()].find(v=>v.quote_id===args[0]&&v.revoked_at===null)||null;
    if(sql.includes('FROM quotes WHERE id =')){
     if(args[0]!==id)return null;
     return {id,payload:JSON.stringify(q),revision:3};
    }
    if(sql.includes('FROM media WHERE id =')){
     if(args[0]!==photoId)return null;
     return {object_key:'quotes-studio/photos/'+photoId,mime:'image/jpeg',size:3};
    }
    return null;
   },
   async run(){
    if(sql.includes('UPDATE quote_links SET revoked_at')){
     for(const v of links.values())if(v.revoked_at===null&&(sql.includes('quote_id =')?v.quote_id===args[0]:v.token===args[0]))v.revoked_at=Math.floor(Date.now()/1000);
    }else if(sql.includes('INSERT INTO quote_links')){
     links.set(args[0],{token:args[0],quote_id:args[1],expires_at:args[2],created_at:Math.floor(Date.now()/1000),revoked_at:null});
    }else if(sql.includes('UPDATE quote_links SET expires_at = NULL')){
     const x=links.get(args[0]);if(x)x.expires_at=null;
    }
    return {meta:{changes:1}};
   }
  };
 }};
 const MEDIA={async get(key){if(key!=='quotes-studio/photos/'+photoId)return null;
  return {body:new Blob(['abc']).stream(),size:3};
 }};
 return {store:{DB,MEDIA},quote:q,links};
}
const req=(path,method='GET',body)=>new Request('https://example.com'+path,{
 method,...(body?{headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{})
});
test('Enlace solo se puede crear desde una cotización guardada y lista',async()=>{
 const m=mock();m.quote.status='Borrador';
 const denied=await ownerSharing(req('/api/share-links','POST',{quoteId:id,days:7}),m.store);
 assert.equal(denied.status,409);
 m.quote.status='Listo para enviar';
 const response=await ownerSharing(req('/api/share-links','POST',{quoteId:id,days:7}),m.store);
 assert.equal(response.status,201);
 const json=await response.json();
 assert.match(json.link.url,/https:\/\/example\.com\/q\/[a-f0-9]{64}$/);
 const existing=await (await ownerSharing(req('/api/share-links?quoteId='+id),m.store)).json();
 assert.equal(existing.link.url,json.link.url);
});
test('El cliente ve cambios guardados, nunca datos privados ni medios de otra propuesta',async()=>{
 const m=mock();
 const created=await (await ownerSharing(req('/api/share-links','POST',{quoteId:id,days:30}),m.store)).json();
 const token=created.link.url.split('/').pop();
 const route='/api/shared/'+token;
 const data=await (await publicSharing(req(route),m.store)).json();
 assert.equal(data.quote.name,'Isabella & Daniel');
 assert.equal(data.quote.email,'');
 assert.equal(data.quote.client,'');
 assert.deepEqual(data.quote.messages,[]);
 assert.equal(data.quote.cover,route+'/media/photo/'+photoId);
 assert.equal(data.quote.price,150000);
 m.quote.name='Isabella & Daniel — updated';
 const updated=await (await publicSharing(req(route),m.store)).json();
 assert.equal(updated.quote.name,'Isabella & Daniel — updated');
 const media=await publicSharing(req(route+'/media/photo/'+photoId),m.store);
 assert.equal(media.status,200);
 assert.equal(media.headers.get('Cache-Control'),'private, no-store');
 const notTheirs=await publicSharing(req(route+'/media/photo/'+otherId),m.store);
 assert.equal(notTheirs.status,404);
});
test('Enlaces vencidos o desactivados no exponen ni la cotización ni su imagen',async()=>{
 const m=mock();
 const json=await (await ownerSharing(req('/api/share-links','POST',{quoteId:id,days:1}),m.store)).json();
 const token=json.link.url.split('/').pop();
 const route='/api/shared/'+token;
 m.links.get(token).expires_at=Math.floor(Date.now()/1000)-1;
 assert.equal((await publicSharing(req(route),m.store)).status,404);
 m.links.get(token).expires_at=null;
 assert.equal((await publicSharing(req(route),m.store)).status,200);
 await ownerSharing(req('/api/share-links/'+token,'DELETE'),m.store);
 assert.equal((await publicSharing(req(route),m.store)).status,404);
 assert.equal((await publicSharing(req(route+'/media/photo/'+photoId),m.store)).status,404);
});
test('Los enlaces públicos no pueden abrir el API privada ni registrar dispositivos',()=>{
 const main=read('worker/index.ts'),shared=read('worker/quote-sharing.ts'),entry=read('src/main.tsx');
 const gateway=main.split('// The only unauthenticated API')[1];
 assert.ok(gateway.indexOf('publicSharing(request, env)')<gateway.indexOf('if (!await authorized(request, env))'));
 assert.ok(gateway.indexOf('ownerSharing(request, env)')>gateway.indexOf('if (!await authorized(request, env))'));
 assert.match(shared,/if\(!mediaReferences\(read\.q\)\.has\(realRef\)\)return noAccess\(\)/);
 assert.match(entry,/<PublicQuotePage token=\{publicMatch\[1\]\}/);
 assert.match(read('index.html'),/meta name="referrer" content="no-referrer"/);
});
