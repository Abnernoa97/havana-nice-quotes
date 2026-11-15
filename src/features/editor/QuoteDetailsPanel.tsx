import type { Quote } from '../quotes/types';
import QuoteDateField from './QuoteDateField';
import QuotePricingPanel from './QuotePricingPanel';

type Props = {
  item: Quote;
  edit: (key: keyof Quote, value: Quote[keyof Quote]) => void;
};

export default function QuoteDetailsPanel({ item, edit }: Props) {
  return (
    <div className="edit-body">
              <label>
                Nombres de la pareja
                <input
                  value={item.name}
                  onChange={e => edit('name', e.target.value)}
                />
              </label>
              <label>
                Destino / Venue
                <input
                  value={item.location}
                  onChange={e => edit('location', e.target.value)}
                />
              </label>
              <QuoteDateField quoteId={item.id} value={item.date}
                onChange={date => edit('date', date)} />
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
              <QuotePricingPanel item={item} edit={(key, value) => edit(key, value)} />
            </div>
  );
}
