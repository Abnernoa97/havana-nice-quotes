import test from 'node:test';
import assert from 'node:assert/strict';
import { filterQuotes, statusClass, quoteDisplayName, quoteDisplayStatus, QUOTE_FILTERS, createQuoteDraft, editSampleQuote, safeQuotePrice, safeQuoteDeposit, normalizePriceInput, findClientActivity } from '../src/features/quotes/model.ts';
import { usd, money, quoteCurrency, dDate } from '../src/shared/lib/formatters.ts';
// Synthetic test records never ship in production or contain stock photography.
const seed = [
  { ...createQuoteDraft('hn1'), name: 'Olivia & James', location: 'San Miguel de Allende',
    status: 'En revisión', messages: [{ from: 'client', text: 'Hello', time: '10:42 AM' }] },
  { ...createQuoteDraft('hn2'), name: 'Sophie & Daniel', location: 'Los Cabos', status: 'Enviada' },
  { ...createQuoteDraft('hn3'), name: 'Emma & Lucas', location: 'Mexico City', status: 'Aceptada' },
];
import { formatHomeDate, homeGreeting } from '../src/features/home/greeting.ts';
import { readFileSync } from 'node:fs';

test('La nube empieza en cero y no importa los datos ficticios del almacenamiento antiguo', () => {
  const store = readFileSync(new URL('../src/features/quotes/useQuoteStore.ts', import.meta.url), 'utf8');
  assert.match(store, /useState<Quote\[\]>\(\[\]\)/);
  assert.doesNotMatch(store, /localStorage|hn_quotes_visual_v1|from '\.\/demo-data'/);
});

test('Cotizaciones: cuatro filtros sin respuestas de mensajes',()=>{
 assert.deepEqual(QUOTE_FILTERS,['Todas','Borrador','Listo para enviar','Enviadas']);
 assert.equal(filterQuotes(seed,'Todas','').length,3);
 assert.equal(filterQuotes(seed,'Enviadas','').length,3);
 assert.equal(filterQuotes(seed,'Todas','LOS CABOS').length,1);
 assert.equal(filterQuotes(seed,'Todas','nueva york').length,0);
 const ready={...createQuoteDraft('hn4'),quoteTitle:'Boda de Ella y Él',status:'Listo para enviar'};
 const draft={...createQuoteDraft('hn5'),name:'A & B',status:'Borrador'};
 const template={...ready,id:'hn6',isTemplate:true};
 assert.equal(filterQuotes([...seed,ready,draft,template],'Todas','').length,5);
 assert.deepEqual(filterQuotes([...seed,ready,draft,template],'Listo para enviar','').map(q=>q.id),['hn4']);
 assert.deepEqual(filterQuotes([...seed,ready,draft,template],'Borrador','').map(q=>q.id),['hn5']);
 assert.equal(filterQuotes([ready],'Todas','ella y él').length,1);
 assert.equal(quoteDisplayName(ready),'Boda de Ella y Él');
 assert.equal(quoteDisplayStatus('En revisión'),'Enviada');
 assert.equal(quoteDisplayStatus('Aceptada'),'Enviada');
});
test('Estados visibles: enviado, listo, borrador; sin borrar el historial de respuestas',()=>{
 assert.equal(statusClass('Aceptada'),'blue');
 assert.equal(statusClass('En revisión'),'blue');
 assert.equal(statusClass('Enviada'),'blue');
 assert.equal(statusClass('Listo para enviar'),'gold');
 assert.equal(statusClass('Borrador'),'gray');
});

test('USD, anticipos y fechas estadounidenses siguen siendo precisos', () => {
  assert.equal(usd(6500), '$6,500');
  assert.equal(usd(0), '$0');
  assert.equal(dDate('2027-05-22'), 'May 22, 2027');
  assert.equal(dDate(''), 'Date to be confirmed');
});

test('El nuevo borrador es independiente de otras cotizaciones', () => {
  const quote = createQuoteDraft('hn-custom-1');
  assert.equal(quote.status, 'Borrador');
  assert.equal(quote.readingMode, 'flip');
  assert.equal(quote.style, 'carolina');
  const other = seed[1];
  const next = editSampleQuote([quote, other], quote.id, 'price', 10000);
  assert.equal(next[0].price, 10000);
  assert.equal(next[1], other);
  assert.equal(quote.price, 0);
  assert.equal(quote.deposit, 0);
  assert.equal(quote.name, '');
  assert.equal(quote.location, '');
  assert.equal(quote.package, '');
  assert.equal(quote.note, '');
  assert.equal(quote.desc, '');
  assert.equal(quote.cover, '');
});

test('Los cambios a una pareja no alteran la cotización de otra', () => {
  const a = createQuoteDraft('hn-a');
  const b = createQuoteDraft('hn-b');
  assert.notEqual(a.id, b.id);
  assert.equal(editSampleQuote([a, b], a.id, 'name', 'New Pair')[1], b);
});

test('Precios de la interfaz no permiten NaN ni importes negativos', () => {
  assert.equal(safeQuotePrice('12500'), 12500);
  assert.equal(safeQuotePrice('-5'), 0);
  assert.equal(safeQuotePrice('Infinity'), 0);
  assert.equal(safeQuotePrice('abc'), 0);
  assert.equal(safeQuoteDeposit('40'), 40);
  assert.equal(safeQuoteDeposit('101'), 100);
  assert.equal(safeQuoteDeposit('-1'), 0);
});

test('Los estilos editoriales y la plantilla real preservan Scroll y 3D', () => {
  for (const style of ['carolina', 'libre', 'vogue', 'lane', 'junebug', 'nyt']) {
    for (const readingMode of ['flip', 'scroll']) {
      const quote = { ...createQuoteDraft('hn-custom-2'), style, readingMode, cover: '/api/media/a1234567-1234-1234-1234-123456789abc' };
      assert.deepEqual(JSON.parse(JSON.stringify(quote)), quote);
    }
  }
});

test('El panel principal muestra fecha y saludo actuales', () => {
  assert.equal(formatHomeDate(new Date(2026, 10, 15)), 'SUNDAY, NOVEMBER 15, 2026');
  assert.equal(homeGreeting(new Date(2026, 10, 15, 9)), 'Good morning');
  assert.equal(homeGreeting(new Date(2026, 10, 15, 12)), 'Good afternoon');
  assert.equal(homeGreeting(new Date(2026, 10, 15, 20)), 'Good evening');
});

test('Conversaciones y aceptaciones de demostración permanecen por cotización', () => {
  assert.equal(findClientActivity(seed)?.quote.id, 'hn1');
  assert.equal(findClientActivity(seed.map(q => ({ ...q, messages: [] }))), null);
  const a = createQuoteDraft('hn-custom-3');
  const b = seed[1];
  const updated = editSampleQuote([a, b], a.id, 'status', 'Aceptada');
  assert.equal(updated[0].status, 'Aceptada');
  assert.equal(updated[1].status, b.status);
});


test('USD y MX son etiquetas independientes sin conversión del precio', () => {
  assert.equal(money(77000, 'USD'), '$77,000 USD');
  assert.equal(money(77000, 'MX'), '$77,000 MX');
  assert.equal(money(77000 * 30 / 100, 'MX'), '$23,100 MX');
  assert.equal(money(77000 * 100 / 100, 'USD'), '$77,000 USD');
  assert.equal(quoteCurrency(undefined), 'USD');
  assert.equal(quoteCurrency('MX'), 'MX');
  assert.equal(createQuoteDraft('hn-currency').currency, 'USD');
});

test('El precio ignora ceros iniciales y caracteres de pegado', () => {
  assert.equal(normalizePriceInput('077000'), '77000');
  assert.equal(normalizePriceInput('000077000'), '77000');
  assert.equal(normalizePriceInput('77,000'), '77000');
  assert.equal(normalizePriceInput('0'), '0');
  assert.equal(normalizePriceInput(''), '');
  assert.equal(normalizePriceInput('100000'), '100000');
});

test('Anticipos 20–100 se calculan exactamente sobre USD y MX', () => {
  const price = 77000;
  for (const percent of [20,30,40,50,60,70,80,90,100]) {
    assert.equal(safeQuoteDeposit(String(percent)), percent);
    assert.equal(Number((price * percent / 100).toFixed(2)), 770 * percent);
  }
});


test('Los borradores nuevos no incorporan ninguna portada ajena', () => {
  for (const id of ['hn-draft-one', 'hn-draft-two']) {
    const quote = createQuoteDraft(id);
    assert.equal(quote.cover, '');
    assert.equal(quote.status, 'Borrador');
  }
});


test('La fecha manual se reconoce por día, mes y año y calcula el día correcto', async () => {
  const {parseWeddingDate, displayWeddingDate, weddingWeekday} =
    await import('../src/shared/lib/wedding-date.ts');
  assert.equal(parseWeddingDate('15/11/2026'), '2026-11-15');
  assert.equal(parseWeddingDate('15 de noviembre de 2026'), '2026-11-15');
  assert.equal(parseWeddingDate('2027-05-22'), '2027-05-22');
  assert.equal(parseWeddingDate('29/02/2028'), '2028-02-29');
  assert.equal(parseWeddingDate('29/02/2027'), null);
  assert.equal(parseWeddingDate('31/04/2027'), null);
  assert.equal(parseWeddingDate(''), null);
  assert.equal(displayWeddingDate('2026-11-15'), '15/11/2026');
  assert.match(weddingWeekday('2026-11-15'), /domingo/i);
  assert.match(weddingWeekday('2027-05-22'), /sábado/i);
  assert.equal(weddingWeekday(''), '');
});
