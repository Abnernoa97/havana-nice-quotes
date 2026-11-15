import test from 'node:test';
import assert from 'node:assert/strict';
import { filterQuotes, statusClass, createSampleDraft, editSampleQuote, safeQuotePrice, safeQuoteDeposit, findClientActivity } from '../src/features/quotes/model.ts';
import { usd, dDate } from '../src/shared/lib/formatters.ts';
import { seed } from '../src/features/quotes/demo-data.ts';
import { formatHomeDate, homeGreeting } from '../src/features/home/greeting.ts';
import { readFileSync } from 'node:fs';

test('La nube empieza en cero y no importa los datos ficticios del almacenamiento antiguo', () => {
  const store = readFileSync(new URL('../src/features/quotes/useQuoteStore.ts', import.meta.url), 'utf8');
  assert.match(store, /useState<Quote\[\]>\(\[\]\)/);
  assert.doesNotMatch(store, /localStorage|hn_quotes_visual_v1|from '\.\/demo-data'/);
});

test('Búsqueda de cotizaciones por pareja, destino y estado', () => {
  assert.equal(filterQuotes(seed, 'Todas', '').length, 3);
  assert.equal(filterQuotes(seed, 'Enviada', '')[0].name, 'Sophie & Daniel');
  assert.equal(filterQuotes(seed, 'Todas', 'LOS CABOS').length, 1);
  assert.equal(filterQuotes(seed, 'Todas', 'nueva york').length, 0);
});

test('Los cuatro estados conservan sus colores', () => {
  assert.equal(statusClass('Aceptada'), 'green');
  assert.equal(statusClass('En revisión'), 'gold');
  assert.equal(statusClass('Enviada'), 'blue');
  assert.equal(statusClass('Borrador'), 'gray');
});

test('USD, anticipos y fechas estadounidenses siguen siendo precisos', () => {
  assert.equal(usd(6500), '$6,500');
  assert.equal(usd(0), '$0');
  assert.equal(dDate('2027-05-22'), 'May 22, 2027');
  assert.equal(dDate(''), 'Date to be confirmed');
});

test('El nuevo borrador es independiente de otras cotizaciones', () => {
  const quote = createSampleDraft('hn-custom-1');
  assert.equal(quote.status, 'Borrador');
  assert.equal(quote.readingMode, 'flip');
  const other = seed[1];
  const next = editSampleQuote([quote, other], quote.id, 'price', 10000);
  assert.equal(next[0].price, 10000);
  assert.equal(next[1], other);
  assert.equal(quote.price, 5900);
});

test('Los cambios a una pareja no alteran la cotización de otra', () => {
  const a = createSampleDraft('hn-a');
  const b = createSampleDraft('hn-b');
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

test('Un borrador preserva los cinco estilos y los dos modos al serializarse', () => {
  for (const style of ['libre', 'vogue', 'lane', 'junebug', 'nyt']) {
    for (const readingMode of ['flip', 'scroll']) {
      const quote = { ...createSampleDraft('hn-custom-2'), style, readingMode, cover: '/api/media/a1234567-1234-1234-1234-123456789abc' };
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
  const a = createSampleDraft('hn-custom-3');
  const b = seed[1];
  const updated = editSampleQuote([a, b], a.id, 'status', 'Aceptada');
  assert.equal(updated[0].status, 'Aceptada');
  assert.equal(updated[1].status, b.status);
});
