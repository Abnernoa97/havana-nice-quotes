/**
 * HAVANA QUOTES → HAVANA CALENDARIO
 * Private Cloudflare D1 binding, no endpoint, token, external Worker or new database.
 * Source of truth: Quotes. Calendar owns user edits and event status.
 */
export type CalendarQuote={
 id:string;name:string;date:string;location:string;price:number;currency?:'MX'|'USD';
 isTemplate?:boolean;package?:string;desc?:string;note?:string
};
export type BridgeRow={id:string;payload:string;modified_at:number;deleted:number};
export interface CalendarStatement{
 bind(...params:(number|string)[]):CalendarStatement;
 first<T>():Promise<T|null>;
 all<T>():Promise<{results:T[]}>;
 run():Promise<{meta:{changes:number}}>;
}
export interface CalendarDatabase{prepare(sql:string):CalendarStatement}
const FIELDS=['name','date','amount','currency','venue','quote'] as const;
type SourceField=typeof FIELDS[number];
type SourceValues=Partial<Record<SourceField,string|number>>;
const recordId=(id:string)=>'hnq:'+id;
const str=(v:unknown)=>typeof v==='string'?v:'';
export function calendarQuoteId(quoteId:string){return recordId(quoteId)}
export function isCompleteCalendarQuote(q:CalendarQuote){
 if(q.isTemplate)return false;
 const name=str(q.name).trim(),d=str(q.date);
 if(!/^hn-[a-f0-9-]{20,64}$/.test(q.id)||!name)return false;
 if(!/^\d{4}-\d{2}-\d{2}$/.test(d))return false;
 const day=new Date(d+'T12:00:00.000Z');
 return Number.isFinite(day.valueOf())&&day.toISOString().slice(0,10)===d;
}
export function sourceValues(quote:CalendarQuote):SourceValues{
 const pkg=str(quote.package).trim(),desc=str(quote.desc).trim(),note=str(quote.note).trim();
 const details=[pkg&&'Servicio: '+pkg,desc&&'Descripción: '+desc,note&&'Nota: '+note]
  .filter(Boolean).join('\n').slice(0,12000);
 const values:SourceValues={
  name:str(quote.name).trim().slice(0,100),date:quote.date,
  currency:quote.currency==='MX'?'MXN':'USD'
 };
 const venue=str(quote.location).trim().slice(0,120);
 if(venue)values.venue=venue;
 if(details)values.quote=details;
 if(Number.isFinite(quote.price)&&quote.price>0){
  values.amount=Math.min(999999999.99,Math.round(quote.price*100)/100);
 }
 return values;
}
/** Manual Calendar edits win; unchanged last-synced fields follow Quotes. */
export function buildCalendarRecord(
 quote:CalendarQuote,revision:number,existing:Record<string,unknown>|null,
 deleted:boolean,now=new Date().toISOString()
):Record<string,unknown>|null{
 if(!/^hn-[a-f0-9-]{20,64}$/.test(quote.id))return null;
 if(existing&&(existing.importSource!=='havana-quotes'||existing.sourceQuoteId!==quote.id))
  throw new Error('calendar_record_collision');
 if(existing&&typeof existing.sourceQuoteRevision==='number'&&existing.sourceQuoteRevision>=revision)
  return null;
 const valid=isCompleteCalendarQuote(quote);
 if(!existing&&(!valid||deleted))return null;
 const current=sourceValues(quote);
 const record:Record<string,unknown>={...(existing||{
  id:recordId(quote.id),status:'pending',name:current.name,date:current.date
 })};
 if(valid&&!deleted){
  const previous=(existing?.quotesSourceFields||{}) as SourceValues;
  for(const key of FIELDS){
   // No previous value means this field belonged to the source only if untouched.
   if(!existing||record[key]===previous[key]){
    if(current[key]===undefined)delete record[key];
    else record[key]=current[key];
   }
  }
  if(existing?.quotesBridgeArchivedAt&&record.trashedAt===existing.quotesBridgeArchivedAt)
   delete record.trashedAt;
  delete record.quotesBridgeArchivedAt;
 }else{
  // Never auto-trash a confirmed/completed event. Preserve manually trashed cards.
  if(record.status==='pending'&&!record.trashedAt){
   record.trashedAt=now;
   record.quotesBridgeArchivedAt=now;
  }
 }
 record.importSource='havana-quotes';
 record.sourceQuoteId=quote.id;
 record.sourceQuoteRevision=revision;
 record.quotesSourceFields=valid?current:(existing?.quotesSourceFields||{});
 record.quotesBridgeState=deleted?'deleted':valid?'active':'incomplete';
 return record;
}
/** Version-checked idempotent writes. No global updates or destructive SQL. */
export async function syncCalendarQuote(
 db:CalendarDatabase|undefined,quote:CalendarQuote,revision:number,deleted=false
):Promise<'synced'|'skipped'|'unavailable'>{
 if(!db)return 'unavailable';
 if(quote.isTemplate)return 'skipped';
 const id=recordId(quote.id);
 for(let attempt=0;attempt<4;attempt++){
  const old=await db.prepare('SELECT id,payload,modified_at,deleted FROM records WHERE id=?')
   .bind(id).first<BridgeRow>();
  if(old?.deleted)return 'skipped'; // Calendar user permanently removed the link.
  let previous:Record<string,unknown>|null=null;
  if(old){
   try{previous=JSON.parse(old.payload) as Record<string,unknown>}
   catch{throw new Error('calendar_record_invalid')}
  }
  const record=buildCalendarRecord(quote,revision,previous,deleted);
  if(!record)return 'skipped';
  const stamp=Math.max(Date.now(),(old?.modified_at||0)+1);
  const payload=JSON.stringify(record);
  if(!old){
   const added=await db.prepare(
    'INSERT OR IGNORE INTO records (id,payload,modified_at,deleted) VALUES (?,?,?,0)'
   ).bind(id,payload,stamp).run();
   if(added.meta.changes)return 'synced';
  }else{
   const updated=await db.prepare(
    'UPDATE records SET payload=?,modified_at=? WHERE id=? AND payload=? AND deleted=0'
   ).bind(payload,stamp,id,old.payload).run();
   if(updated.meta.changes)return 'synced';
  }
 }
 throw new Error('calendar_bridge_write_conflict');
}
/** Reconciles previously saved Quotes, including recoverable soft deletions.
 * Triggered only from authorized Quotes GET; can be retried after outages. */
export async function reconcileCalendarQuotes(
 db:CalendarDatabase|undefined,
 rows:Array<{id:string;payload:string;revision:number;deleted_at?:number|null}>
):Promise<{synced:number;skipped:number;unavailable:boolean}>{
 if(!db)return {synced:0,skipped:0,unavailable:true};
 // One indexed lookup rather than one read per quote on every client refresh.
 const current=await db.prepare(
  "SELECT id,payload,deleted FROM records WHERE id LIKE 'hnq:hn-%'"
 ).all<{id:string;payload:string;deleted:number}>();
 const byId=new Map(current.results.map(row=>[row.id,row]));
 let synced=0,skipped=0;
 for(const row of rows){
  const present=byId.get(recordId(row.id));
  if(present?.deleted){skipped++;continue}
  if(present){
   try{
    const recorded=JSON.parse(present.payload) as {sourceQuoteRevision?:number};
    if(recorded.sourceQuoteRevision!==undefined&&recorded.sourceQuoteRevision>=row.revision){
     skipped++;continue;
    }
   }catch{skipped++;continue}
  }
  let quote:CalendarQuote;
  try{quote=JSON.parse(row.payload) as CalendarQuote}catch{skipped++;continue}
  if(quote.isTemplate){skipped++;continue}
  try{
   const result=await syncCalendarQuote(db,quote,row.revision,row.deleted_at!=null);
   if(result==='synced')synced++;else skipped++;
  }catch(error){
   console.warn('Calendar bridge retry pending',row.id,String(error));
   skipped++;
  }
 }
 return {synced,skipped,unavailable:false};
}
