import type { Quote } from '../quotes/types';
import { CAROLINA_COPY, carolinaCopy } from '../templates/CarolinaTemplate';
import type { CarolinaCopy } from '../templates/CarolinaTemplate';
import '../templates/carolina-editor.css';

type Props = {
  item: Quote;
  edit: (key: keyof Quote, value: Quote[keyof Quote]) => void;
};

const copyLabels: Record<keyof CarolinaCopy, string> = {
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

export default function QuoteDetailsPanel({ item, edit }: Props) {
  return (
    <div className="edit-body">
              <span className="eyebrow">PROPOSAL DETAILS</span>
              <h3>Personaliza cada detalle</h3>
              <label>
                Nombres de la pareja
                <input
                  value={item.name}
                  onChange={e => edit('name', e.target.value)}
                  placeholder="Olivia & James"
                />
              </label>
              <label>
                Destino / Venue
                <input
                  value={item.location}
                  onChange={e => edit('location', e.target.value)}
                />
              </label>
              <label>
                Fecha de la celebración
                <input
                  type="date"
                  value={item.date}
                  onChange={e => edit('date', e.target.value)}
                />
              </label>
              <label>
                Mensaje en la portada
                <textarea
                  rows={3}
                  value={item.note}
                  onChange={e => edit('note', e.target.value)}
                />
              </label>
              <label>
                Nombre del servicio
                <input
                  value={item.package}
                  onChange={e => edit('package', e.target.value)}
                />
              </label>
              <label>
                Descripción
                <textarea
                  rows={4}
                  value={item.desc}
                  onChange={e => edit('desc', e.target.value)}
                />
              </label>
              {item.style === 'carolina' && (
                <details className="hn-carolina-copy-editor">
                  <summary>Textos de la plantilla Carolina · Editar condiciones</summary>
                  <div className="hn-carolina-copy-fields">
                    {(Object.keys(CAROLINA_COPY) as (keyof CarolinaCopy)[]).map(key => (
                      <label key={key}>
                        {copyLabels[key]}
                        <textarea rows={2} value={carolinaCopy(item)[key]}
                          onChange={event => edit('carolinaCopy', {
                            ...item.carolinaCopy,
                            [key]: event.target.value,
                          })}/>
                      </label>
                    ))}
                  </div>
                </details>
              )
            </div>
  );
}
