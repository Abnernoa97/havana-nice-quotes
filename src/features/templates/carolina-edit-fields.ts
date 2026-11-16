import type { CarolinaCopy } from './CarolinaTemplate';

/** Editable data fields backed by the same Quote as Datos, Scroll and 3D. */
export const CAROLINA_TERMS_FIELDS = [
  'performance', 'musicians', 'crew', 'backline', 'logistics',
  'balance', 'production', 'connections', 'space',
] as const satisfies readonly (keyof CarolinaCopy)[];

export type CarolinaCopyField = typeof CAROLINA_TERMS_FIELDS[number];
export type CarolinaTextField =
  | 'name' | 'location' | 'date' | 'note' | 'package' | 'desc' | 'price' | 'deposit'
  | CarolinaCopyField;

export const CAROLINA_FIELD_LABELS: Record<CarolinaTextField, string> = {
  name: 'Nombres de la pareja',
  location: 'Destino / Venue',
  date: 'Fecha de la celebración',
  note: 'Mensaje en la portada',
  package: 'Nombre del servicio',
  desc: 'Descripción',
  price: 'Precio total',
  deposit: 'Anticipo',
  performance: 'Duración y formato de la presentación',
  musicians: 'Músicos en escenario',
  crew: 'Equipo y personal',
  backline: 'Instrumentos y backline',
  logistics: 'Logística y horas de servicio',
  balance: 'Fecha del pago restante',
  production: 'Producción de audio',
  connections: 'Requerimientos XLR y electricidad',
  space: 'Espacio y escenario',
};

export function isCarolinaCopyField(field: CarolinaTextField): field is CarolinaCopyField {
  return (CAROLINA_TERMS_FIELDS as readonly string[]).includes(field);
}
