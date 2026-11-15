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
