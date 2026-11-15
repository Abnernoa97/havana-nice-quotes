/** Pure date parsing: ISO is the single value saved in D1, regardless of display format. */
const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

function realDate(day: number, month: number, year: number): string | null {
  if (!Number.isInteger(day) || !Number.isInteger(month) || !Number.isInteger(year) ||
    year < 1900 || year > 2200 || month < 1 || month > 12 || day < 1 || day > 31) return null;
  const date = new Date(Date.UTC(year, month - 1, day, 12));
  if (date.getUTCDate() !== day || date.getUTCMonth() !== month - 1 ||
    date.getUTCFullYear() !== year) return null;
  return String(year).padStart(4, '0') + '-' + String(month).padStart(2, '0') +
    '-' + String(day).padStart(2, '0');
}

/** Accept DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY, ISO, or "15 de noviembre de 2027". */
export function parseWeddingDate(input: string): string | null {
  const text = input.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  let match = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(text);
  if (match) return realDate(Number(match[3]), Number(match[2]), Number(match[1]));
  match = /^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})$/.exec(text);
  if (match) return realDate(Number(match[1]), Number(match[2]), Number(match[3]));
  match = /^(\d{1,2})\s+(?:de\s+)?([a-z]+)\s+(?:de\s+)?(\d{4})$/.exec(text);
  if (!match) return null;
  const month = match[2] === 'setiembre' ? 9 : MONTHS.indexOf(match[2]) + 1;
  return realDate(Number(match[1]), month, Number(match[3]));
}

export function displayWeddingDate(iso: string): string {
  const date = parseWeddingDate(iso);
  if (!date) return '';
  const [year, month, day] = date.split('-');
  return day + '/' + month + '/' + year;
}

export function weddingWeekday(iso: string): string {
  const valid = parseWeddingDate(iso);
  if (!valid) return '';
  const [year, month, day] = valid.split('-').map(Number);
  return new Intl.DateTimeFormat('es-MX', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, day, 12)));
}
