import test from 'node:test';
import assert from 'node:assert/strict';
import {ownerShareAnalytics,publicShareVisit} from '../worker/share-analytics.ts';
import {readFileSync} from 'node:fs';
const id='hn-aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',token='a'.repeat(64);
const uuid=()=>crypto.randomUUID();
const req=(path,method='GET',body)=>new Request('https://quotes.example'+path,{
 method,...(body?{headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{})
});
function mock(){
 const quote={id,status:'Listo para enviar'},events=new Map(),visits=new Map();
 const link={token,quote_id:id,created_at:1,expires_at:null,revoked_at:null};
 const DB={prepare(sql){let args=[];return {
  bind(...v){args=v;return this;},
  async first(){
   if(sql.includes('FROM quote_links WHERE token'))return args[0]===token?link:null;
   if(sql.includes('FROM quotes WHERE id'))return args[0]===id?{id,payload:JSON.stringify(quote),revision:1}:null;
   return null;
  },
  async all(){
   if(sql.includes('FROM quote_share_events'))return {results:events.size?[{quote_id:id,n:events.size}]:[]};
   if(sql.includes('FROM quote_share_visits')){
    const hashes=new Set([...visits.values()].map(x=>x.hash));
    return {results:visits.size?[{quote_id:id,opens:visits.size,devices:hashes.size}]:[]};
   }
   return {results:[]};
  },
  async run(){
   if(sql.includes('INSERT OR IGNORE INTO quote_share_events')){
    if(events.has(args[0]))return {meta:{changes:0}};
    events.set(args[0],args[3]);return {meta:{changes:1}};
   }
   if(sql.includes('INSERT OR IGNORE INTO quote_share_visits')){
    if([...visits.values()].some(x=>x.token===args[2]&&x.visitId===args[4]))return {meta:{changes:0}};
    visits.set(args[0],{token:args[2],hash:args[3],visitId:args[4]});
    return {meta:{changes:1}};
   }
   if(sql.includes('UPDATE quotes SET payload'))quote.status='Enviada';
   return {meta:{changes:1}};
  }
 }}};
 return {store:{DB},quote,events,visits,link};
}
test('Compartir por WhatsApp pasa la cotización a Enviadas sin afirmar recepción de WhatsApp',async()=>{
 const m=mock(),requestId=uuid(),route='/api/share-analytics/'+token+'/handoff';
 const first=await ownerShareAnalytics(req(route,'POST',{channel:'whatsapp',requestId}),m.store);
 assert.equal(first.status,200);assert.equal(m.quote.status,'Enviada');assert.equal(m.events.size,1);
 const repeated=await ownerShareAnalytics(req(route,'POST',{channel:'whatsapp',requestId}),m.store);
 assert.equal(repeated.status,200);assert.equal(m.events.size,1);
 const manual=await ownerShareAnalytics(req(route,'POST',{channel:'manual',requestId:uuid()}),m.store);
 assert.equal(manual.status,200);assert.equal(m.events.size,1);
});
test('Aperturas: una por visita, dispositivos distintos aproximados y sin contar duplicados',async()=>{
 const m=mock(),route='/api/shared/'+token+'/visit';
 const visitor1=uuid(),visitor2=uuid(),visit1=uuid();
 let r=await publicShareVisit(req(route,'POST',{visitorId:visitor1,visitId:visit1}),m.store);
 assert.equal(r.status,200);assert.equal((await r.json()).counted,true);
 assert.equal(m.quote.status,'Enviada');
 r=await publicShareVisit(req(route,'POST',{visitorId:visitor1,visitId:visit1}),m.store);
 assert.equal((await r.json()).counted,false);
 await publicShareVisit(req(route,'POST',{visitorId:visitor1,visitId:uuid()}),m.store);
 await publicShareVisit(req(route,'POST',{visitorId:visitor2,visitId:uuid()}),m.store);
 const data=await (await ownerShareAnalytics(req('/api/share-analytics'),m.store)).json();
 assert.equal(data.quotes[id].shares,0);
 assert.equal(data.quotes[id].opens,3);
 assert.equal(data.quotes[id].devices,2);
});
test('Token vencido o revocado impide nuevas aperturas',async()=>{
 const m=mock();m.link.expires_at=100;
 assert.equal((await publicShareVisit(req('/api/shared/'+token+'/visit','POST',{
  visitorId:uuid(),visitId:uuid()}),m.store)).status,404);
 m.link.expires_at=null;m.link.revoked_at=42;
 assert.equal((await publicShareVisit(req('/api/shared/'+token+'/visit','POST',{
  visitorId:uuid(),visitId:uuid()}),m.store)).status,404);
});
test('Los contadores solo son privados y una visita no entrega datos personales',()=>{
 const src=readFileSync(new URL('../worker/index.ts',import.meta.url),'utf8');
 const gateway=src.split('// The only unauthenticated API')[1];
 assert.ok(gateway.indexOf('publicShareVisit(request,env)')<gateway.indexOf('if (!await authorized(request, env))'));
 assert.ok(gateway.indexOf('ownerShareAnalytics(request,env)')>gateway.indexOf('if (!await authorized(request, env))'));
});
