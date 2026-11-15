import test from 'node:test';
import assert from 'node:assert/strict';
import { filterQuotes, statusClass } from '../src/features/quotes/model.ts';
import { usd, dDate } from '../src/shared/lib/formatters.ts';

const sample = [
  { id: 'hn1', name: 'Olivia & James', location: 'San Miguel de Allende', status: 'En revisión' },
  { id: 'hn2', name: 'Sophie & Daniel', location: 'Los Cabos', status: 'Enviada' },
  { id: 'hn3', name: 'Emma & Lucas', location: 'Mexico City', status: 'Aceptada' },
];

test('La búsqueda de cotizaciones conserva filtros de estado y destino', () => {
  assert.equal(filterQuotes(sample, 'Todas', '').length, 3);
  assert.deepEqual(filterQuotes(sample, 'Enviada', '').map(q => q.id), ['hn2']);
  assert.deepEqual(filterQuotes(sample, 'Todas', 'LOS CABOS').map(q => q.id), ['hn2']);
  assert.deepEqual(filterQuotes(sample, 'En revisión', 'olivia').map(q => q.id), ['hn1']);
  assert.deepEqual(filterQuotes(sample, 'Aceptada', 'nueva york'), []);
});

test('Las clases de estado mantienen los cuatro resultados de la demo', () => {
  assert.equal(statusClass('Aceptada'), 'green');
  assert.equal(statusClass('En revisión'), 'gold');
  assert.equal(statusClass('Enviada'), 'blue');
  assert.equal(statusClass('Borrador'), 'gray');
});

test('Formato USD compartido entre editor y revista', () => {
  assert.equal(usd(6500), '$6,500');
  assert.equal(usd(1950), '$1,950');
  assert.equal(usd(0), '$0');
  assert.equal(usd(null), '$0');
});

test('Fecha estadounidense de la propuesta y valor vacío', () => {
  assert.equal(dDate('2027-05-22'), 'May 22, 2027');
  assert.equal(dDate(''), 'Date to be confirmed');
});

import { createSampleDraft, editSampleQuote } from '../src/features/quotes/model.ts';
import { seed } from '../src/features/quotes/demo-data.ts';
import { parseStoredQuotes, QUOTES_STORAGE_KEY } from '../src/features/quotes/storage.ts';

test('Datos ficticios: nunca se inicia con una lista vacía o corrupta', () => {
  assert.equal(QUOTES_STORAGE_KEY, 'hn_quotes_visual_v1');
  for (const raw of [null, '', '[]', '{', '{}', '[null]', '[{}]', '[1,2,3]']) {
    assert.equal(parseStoredQuotes(raw, seed), seed);
  }
});

test('Los borradores válidos se recuperan sin modificar su contenido ni su orden', () => {
  const drafts = [createSampleDraft('hn-custom'), ...seed];
  const result = parseStoredQuotes(JSON.stringify(drafts), seed);
  assert.deepEqual(result, drafts);
  assert.equal(result[0].style, 'libre');
  assert.equal(result[0].readingMode, 'flip');
});

test('Se rechazan importes no numéricos y registros incompletos sin bloquear la interfaz', () => {
  const badPrice = { ...seed[0], price: 'abc' };
  const badName = { ...seed[0], name: null };
  assert.equal(parseStoredQuotes(JSON.stringify([badPrice]), seed), seed);
  assert.equal(parseStoredQuotes(JSON.stringify([badName]), seed), seed);
});

test('Crear y editar no cambia otras cotizaciones ficticias', () => {
  const draft = createSampleDraft('hn-new');
  assert.equal(draft.price, 5900);
  assert.equal(draft.status, 'Borrador');
  assert.equal(draft.deposit, seed[0].deposit);
  assert.equal(draft.cover, seed[0].cover);
  const list = [draft, ...seed];
  const changed = editSampleQuote(list, 'hn-new', 'price', 7200);
  assert.equal(changed[0].price, 7200);
  assert.equal(list[0].price, 5900);
  assert.equal(changed[1], seed[0]);
  assert.equal(editSampleQuote(list, 'missing', 'price', 12)[0], draft);
});

test('Depósitos 0% y 100% se conservan; se rechazan importes fuera de rango', () => {
  const valid = [0, 100].map((deposit, index) => ({ ...seed[index], deposit }));
  assert.deepEqual(parseStoredQuotes(JSON.stringify(valid), seed), valid);
  for (const deposit of [-1, 100.1, 101, Infinity]) {
    const sample = { ...seed[0], deposit };
    assert.equal(parseStoredQuotes(JSON.stringify([sample]), seed), seed);
  }
});

test('Estados y mensajes corruptos no bloquean la cotización activa', () => {
  for (const change of [
    { status: 'Aprobada externamente' },
    { messages: [null] },
    { messages: [{ from: 'client', text: 123, time: '' }] },
    { price: -10 },
  ]) {
    assert.equal(parseStoredQuotes(JSON.stringify([{ ...seed[0], ...change }]), seed), seed);
  }
});

test('Los estilos y modos de lectura válidos sobreviven al guardado local', () => {
  const styles = ['libre', 'vogue', 'lane', 'junebug', 'nyt'];
  for (const style of styles) {
    const draft = { ...createSampleDraft('hn-test'), style, readingMode: 'scroll' };
    assert.deepEqual(parseStoredQuotes(JSON.stringify([draft]), seed), [draft]);
  }
  const original = createSampleDraft('hn-test');
  const changed = editSampleQuote([original], original.id, 'readingMode', 'scroll');
  assert.equal(changed[0].readingMode, 'scroll');
  assert.equal(original.readingMode, 'flip');
});

import { formatHomeDate, homeGreeting } from '../src/features/home/greeting.ts';

test('Inicio usa la fecha real y no una fecha ficticia fija', () => {
  const date = new Date(2026, 10, 15, 9, 30);
  assert.equal(formatHomeDate(date), 'SUNDAY, NOVEMBER 15, 2026');
  assert.equal(formatHomeDate(new Date(2027, 0, 1)), 'FRIDAY, JANUARY 1, 2027');
});

test('Inicio adapta saludo a mañana, tarde y noche del dispositivo', () => {
  assert.equal(homeGreeting(new Date(2026, 10, 15, 9, 59)), 'Good morning');
  assert.equal(homeGreeting(new Date(2026, 10, 15, 12, 0)), 'Good afternoon');
  assert.equal(homeGreeting(new Date(2026, 10, 15, 17, 59)), 'Good afternoon');
  assert.equal(homeGreeting(new Date(2026, 10, 15, 18, 0)), 'Good evening');
});

import { safeQuotePrice, safeQuoteDeposit } from '../src/features/quotes/model.ts';

test('Los campos de Precios no generan importes negativos, Infinity ni NaN', () => {
  assert.equal(safeQuotePrice('5900'), 5900);
  assert.equal(safeQuotePrice('100.25'), 100.25);
  assert.equal(safeQuotePrice('-5'), 0);
  assert.equal(safeQuotePrice(''), 0);
  assert.equal(safeQuotePrice('Infinity'), 0);
  assert.equal(safeQuotePrice('not-a-number'), 0);
  assert.equal(safeQuoteDeposit('-1'), 0);
  assert.equal(safeQuoteDeposit('0'), 0);
  assert.equal(safeQuoteDeposit('40'), 40);
  assert.equal(safeQuoteDeposit('100'), 100);
  assert.equal(safeQuoteDeposit('101'), 100);
  assert.equal(safeQuoteDeposit('NaN'), 0);
});

import { findClientActivity } from '../src/features/quotes/model.ts';

test('Inicio presenta una conversación ficticia existente, nunca una pareja fija', () => {
  const activity = findClientActivity(seed);
  assert.equal(activity?.quote.id, 'hn1');
  assert.equal(activity?.quote.name, 'Olivia & James');
  assert.equal(activity?.message.from, 'client');
  assert.equal(findClientActivity(seed.map(q => ({ ...q, messages: [] }))), null);

  const custom = { ...seed[1], id: 'hn-custom', name: 'New Pair', messages: [
    { from: 'admin', text: 'A', time: '1:00 PM' },
    { from: 'client', text: 'Can we add a welcome party?', time: '1:01 PM' },
  ] };
  const next = findClientActivity([custom, ...seed]);
  assert.equal(next?.quote.id, 'hn-custom');
  assert.equal(next?.message.text, 'Can we add a welcome party?');
  assert.equal(custom.messages[1].text, 'Can we add a welcome party?');
});

test('La aceptación simulada pertenece al estado de cada cotización, no a otra pareja', () => {
  const initial = [createSampleDraft('hn-new'), ...seed];
  const changed = editSampleQuote(initial, 'hn-new', 'status', 'Aceptada');
  assert.equal(changed[0].status, 'Aceptada');
  assert.equal(initial[0].status, 'Borrador');
  assert.equal(changed[1].status, seed[0].status);
  const restored = parseStoredQuotes(JSON.stringify(changed), seed);
  assert.equal(restored[0].status, 'Aceptada');
  assert.equal(restored[1].status, seed[0].status);
});

test('La carga de cotizaciones rechaza IDs duplicados y campos ausentes del editor', () => {
  const preserved = [createSampleDraft('hn-test'), ...seed];
  assert.deepEqual(parseStoredQuotes(JSON.stringify(preserved), seed), preserved);
  for (const missing of ['client', 'email', 'date', 'font', 'color']) {
    const incomplete = { ...seed[0] };
    delete incomplete[missing];
    assert.equal(parseStoredQuotes(JSON.stringify([incomplete]), seed), seed);
  }
  assert.equal(parseStoredQuotes(JSON.stringify([{ ...seed[0], id: '' }]), seed), seed);
  assert.equal(parseStoredQuotes(JSON.stringify([seed[0], { ...seed[1], id: seed[0].id }]), seed), seed);
  assert.equal(parseStoredQuotes(JSON.stringify([{ ...seed[0], readingMode: null }]), seed), seed);
  assert.equal(parseStoredQuotes(JSON.stringify([{ ...seed[0], style: 12 }]), seed), seed);
});
