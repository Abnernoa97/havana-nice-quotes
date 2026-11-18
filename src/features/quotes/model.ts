import type { Quote } from './types';

/** Templates and unsaved work never appear as quotations. Legacy response
 * states are still retrievable under Sent without deleting their history. */
export const QUOTE_FILTERS=['Todas','Borrador','Listo para enviar','Enviadas'] as const;
export function quoteDisplayStatus(status:Quote['status']):string {
 return status==='En revisión'||status==='Aceptada'?'Enviada':status;
}
export function filterQuotes(quotes: Quote[], filter: string, search: string): Quote[] {
 const query=search.trim().toLocaleLowerCase('es');
 return quotes.filter(q=>{
  if(q.isTemplate)return false;
  const state=quoteDisplayStatus(q.status);
  const matches=filter==='Todas'||
    (filter==='Enviadas'&&state==='Enviada')||
    (filter==='Listo para enviar'&&state==='Listo para enviar')||
    state===filter;
  return matches&&[q.quoteTitle,q.name,q.location].join(' ').toLocaleLowerCase('es').includes(query);
 });
}
export function statusClass(s:string):string {
 return s==='Listo para enviar'?'gold':
   ['Enviada','En revisión','Aceptada'].includes(s)?'blue':'gray';
}
export const quoteDisplayName=(q:Quote):string=>q.quoteTitle?.trim()||q.name.trim()||'Cotización sin nombre';

/** A new quotation has no imported test photos or predefined covers. */
export function createQuoteDraft(id: string): Quote {
  return {
    id,
    name: '',
    client: '',
    email: '',
    location: '',
    date: '',
    price: 0,
    deposit: 0,
    currency: 'USD',
    status: 'Borrador',
    cover: '',
    font: 'editorial',
    color: '#18342f',
    note: '',
    package: '',
    desc: '',
    messages: [],
    style: 'carolina',
    readingMode: 'flip',
  };
}

/** Devuelve una nueva lista y no toca los demás borradores. */
export function editSampleQuote(
  quotes: Quote[], id: string, key: keyof Quote, value: Quote[keyof Quote]
): Quote[] {
  return quotes.map(q => (q.id === id ? { ...q, [key]: value } : q));
}

/** Text input for whole-number quotes: never keeps a default or pasted leading zero. */
export function normalizePriceInput(input: string): string {
  return input.replace(/[^0-9]/g, '').replace(/^0+(?=\d)/, '');
}

/** Los inputs numéricos pueden producir valores negativos, Infinity o NaN durante la edición. */
export function safeQuotePrice(input: string): number {
  const value = Number(input);
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

export function safeQuoteDeposit(input: string): number {
  const value = Number(input);
  return Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0;
}

/** Busca el último mensaje del cliente de la primera propuesta con actividad. */
export function findClientActivity(quotes: Quote[]): { quote: Quote; message: NonNullable<Quote['messages']>[number] } | null {
  for (const quote of quotes) {
    const lastClientMessage = [...(quote.messages || [])]
      .reverse()
      .find(message => message.from === 'client');
    if (lastClientMessage) return { quote, message: lastClientMessage };
  }
  return null;
}

/** Deep copy: changing a reused quotation must not mutate its source layout. */
export function duplicateQuote(source:Quote,id:string,resetClient=false):Quote{
 const copy=JSON.parse(JSON.stringify(source)) as Quote;
 const next:Quote={...copy,id,status:'Borrador',messages:[],quoteTitle:undefined};
 delete next.isTemplate;
 delete next.templateName;
 if(resetClient){
  next.name='';next.client='';next.email='';next.location='';next.date='';
  next.price=0;next.deposit=0;
 }
 return next;
}
/** A template uses the same editor and D1 validation: no second editing engine. */
export function createOwnTemplate(id:string,source?:Quote):Quote{
 const foundation=source?duplicateQuote(source,id,true):createQuoteDraft(id);
 return {...foundation,style:source?.style||'libre',
  // Templates created without a source start with exactly one truly blank page.
  designLayout:source?.designLayout||{pageOrder:[3]},
  isTemplate:true,templateName:source?.templateName?.trim()||'Mi nueva plantilla'};
}
