import test from 'node:test';
import assert from 'node:assert/strict';
import {buildCalendarRecord,calendarQuoteId,isCompleteCalendarQuote,sourceValues,
 syncCalendarQuote,reconcileCalendarQuotes} from '../worker/calendar-bridge.ts';
const id='hn-aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';
const quote=(more={})=>({id,name:'Anna & Alex',date:'2027-05-17',location:'Flora Farms',
 price:150000,currency:'MX',package:'Cocktail',desc:'Live band',note:'',...more});
function fakeCalendar(){
 const rows=new Map();let reads=0,writes=0;
 const db={prepare(sql){let values=[];
  return {bind(...args){values=args;return this},
   async first(){
    reads++;
    if(sql.startsWith('SELECT id,payload,modified_at,deleted FROM records WHERE id='))return rows.get(values[0])||null;
    throw Error('Unexpected first '+sql);
   },
   async all(){
    reads++;
    if(sql.includes("FROM records WHERE id LIKE 'hnq:hn-%'"))
     return {results:[...rows.values()].filter(x=>x.id.startsWith('hnq:hn-')).map(({id,payload,deleted})=>({id,payload,deleted}))};
    throw Error('Unexpected all '+sql);
   },
   async run(){
    writes++;
    if(sql.startsWith('INSERT OR IGNORE INTO records')){
     if(rows.has(values[0]))return {meta:{changes:0}};
     rows.set(values[0],{id:values[0],payload:values[1],modified_at:values[2],deleted:0});
     return {meta:{changes:1}};
    }
    if(sql.startsWith('UPDATE records SET payload=')){
     const old=rows.get(values[2]);
     if(!old||old.deleted||old.payload!==values[3])return {meta:{changes:0}};
     rows.set(values[2],{...old,payload:values[0],modified_at:values[1]});
     return {meta:{changes:1}};
    }
    throw Error('Unexpected run '+sql);
   }
  };
 }};
 return {db,rows,get reads(){return reads},get writes(){return writes},
  record:()=>JSON.parse(rows.get(calendarQuoteId(id)).payload)};
}
test('Una cotización solo se sincroniza con nombre y fecha real, nunca plantillas',()=>{
 assert.equal(isCompleteCalendarQuote(quote()),true);
 assert.equal(isCompleteCalendarQuote(quote({date:''})),false);
 assert.equal(isCompleteCalendarQuote(quote({name:' '})),false);
 assert.equal(isCompleteCalendarQuote(quote({date:'2027-02-31'})),false);
 assert.equal(isCompleteCalendarQuote(quote({isTemplate:true})),false);
 assert.equal(calendarQuoteId(id),'hnq:'+id);
 assert.equal(sourceValues(quote()).currency,'MXN');
 assert.equal(sourceValues(quote({currency:'USD'})).currency,'USD');
});
test('ID determinista, reintentos idempotentes y una ficha para varias revisiones',async()=>{
 const f=fakeCalendar();
 assert.equal(await syncCalendarQuote(f.db,quote(),1),'synced');
 assert.equal(f.rows.size,1);assert.equal(f.record().status,'pending');
 assert.equal(f.record().importSource,'havana-quotes');
 assert.equal(f.record().sourceQuoteId,id);
 assert.equal(f.record().sourceQuoteRevision,1);
 assert.equal(f.record().amount,150000);
 assert.equal(await syncCalendarQuote(f.db,quote(),1),'skipped');
 assert.equal(f.rows.size,1);
 assert.equal(await syncCalendarQuote(f.db,quote({date:'2027-06-01',price:175000}),2),'synced');
 assert.equal(f.record().date,'2027-06-01');
 assert.equal(f.record().amount,175000);
 assert.equal(f.rows.size,1);
});
test('Ediciones manuales de Calendario sobreviven a cambios nuevos en Quotes',async()=>{
 const f=fakeCalendar();await syncCalendarQuote(f.db,quote(),1);
 const old=f.rows.get(calendarQuoteId(id)),manual={...f.record(),
  status:'confirmed',weddingPlanner:'Planner Manual',venue:'Venue escrito en Calendario',
  amount:190000};
 f.rows.set(calendarQuoteId(id),{...old,payload:JSON.stringify(manual)});
 await syncCalendarQuote(f.db,quote({date:'2027-07-10',location:'Another venue',price:220000}),2);
 const latest=f.record();
 assert.equal(latest.status,'confirmed');
 assert.equal(latest.weddingPlanner,'Planner Manual');
 assert.equal(latest.venue,'Venue escrito en Calendario');
 assert.equal(latest.amount,190000);
 assert.equal(latest.date,'2027-07-10');
});
test('Papelera reversible para pendientes; eventos confirmados se conservan',async()=>{
 const f=fakeCalendar();await syncCalendarQuote(f.db,quote(),1);
 await syncCalendarQuote(f.db,quote(),2,true);
 const archived=f.record();assert.ok(archived.trashedAt);
 assert.equal(archived.trashedAt,archived.quotesBridgeArchivedAt);
 await syncCalendarQuote(f.db,quote(),3,false);
 assert.equal(f.record().trashedAt,undefined);
 const old=f.rows.get(calendarQuoteId(id));
 f.rows.set(calendarQuoteId(id),{...old,payload:JSON.stringify({...f.record(),status:'done'})});
 await syncCalendarQuote(f.db,quote(),4,true);
 assert.equal(f.record().status,'done');assert.equal(f.record().trashedAt,undefined);
});
test('No recupera fichas borradas definitivamente en Calendario ni invade IDs ajenos',async()=>{
 const f=fakeCalendar(),rid=calendarQuoteId(id);
 f.rows.set(rid,{id:rid,payload:'',modified_at:1,deleted:1});
 assert.equal(await syncCalendarQuote(f.db,quote(),1),'skipped');
 assert.equal(f.rows.get(rid).deleted,1);
 const another=fakeCalendar();
 another.rows.set(rid,{id:rid,payload:JSON.stringify({id:rid,name:'Independiente',
  date:'2027-05-17',status:'pending'}),modified_at:1,deleted:0});
 await assert.rejects(()=>syncCalendarQuote(another.db,quote(),1),/calendar_record_collision/);
});
test('Reconciliación reintenta versiones omitidas y evita lecturas individuales innecesarias',async()=>{
 const f=fakeCalendar();
 const source={id,payload:JSON.stringify(quote()),revision:1,deleted_at:null};
 const first=await reconcileCalendarQuotes(f.db,[source]);
 assert.equal(first.synced,1);
 const count=f.reads;
 const second=await reconcileCalendarQuotes(f.db,[source]);
 assert.equal(second.synced,0);
 assert.equal(f.reads,count+1); // only one indexed group read
 const revised={...source,payload:JSON.stringify(quote({price:170000})),revision:2};
 const third=await reconcileCalendarQuotes(f.db,[revised]);
 assert.equal(third.synced,1);
 assert.equal(f.record().amount,170000);
});
test('No escribe fichas sin fecha, ni plantillas, ni registros ajenos',async()=>{
 const f=fakeCalendar();
 assert.equal(await syncCalendarQuote(f.db,quote({date:''}),1),'skipped');
 assert.equal(await syncCalendarQuote(f.db,quote({isTemplate:true}),2),'skipped');
 assert.equal(f.rows.size,0);
 const incomplete=buildCalendarRecord(quote({name:''}),1,null,false);
 assert.equal(incomplete,null);
 assert.equal(await syncCalendarQuote(undefined,quote(),1),'unavailable');
});

test('Ficha técnica completa: planner, ciudad, venue, moneda, servicio y anticipo sincronizados',async()=>{
 const f=fakeCalendar();
 const full=quote({weddingPlanner:'Luxury Events',venue:'Casa de la Bola',
  city:'Ciudad de México',location:'CDMX',quoteTitle:'Isabella & Daniel 2027',
  deposit:40,note:'Welcome party',desc:'Live wedding band'});
 assert.equal(await syncCalendarQuote(f.db,full,1),'synced');
 const record=f.record();
 assert.equal(record.weddingPlanner,'Luxury Events');
 assert.equal(record.venue,'Casa de la Bola');
 assert.equal(record.city,'Ciudad de México');
 assert.equal(record.amount,150000);
 assert.equal(record.currency,'MXN');
 assert.match(record.quote,/Servicio: Cocktail/);
 assert.match(record.quote,/Descripción: Live wedding band/);
 assert.match(record.quote,/Nota de portada: Welcome party/);
 assert.match(record.quote,/Anticipo: 40%/);
 const previous=f.rows.get(calendarQuoteId(id));
 f.rows.set(calendarQuoteId(id),{...previous,payload:JSON.stringify({...record,city:'Ciudad manual'})});
 await syncCalendarQuote(f.db,{...full,city:'Querétaro',weddingPlanner:'Another Planner'},2);
 assert.equal(f.record().city,'Ciudad manual');
 assert.equal(f.record().weddingPlanner,'Another Planner');
});
test('Campos no informados permanecen vacíos, sin convertir ubicación en ciudad',()=>{
 const entry=sourceValues(quote({location:'Venue simple'}));
 assert.equal(entry.venue,'Venue simple');
 assert.equal(entry.city,undefined);
 assert.equal(entry.weddingPlanner,undefined);
});
