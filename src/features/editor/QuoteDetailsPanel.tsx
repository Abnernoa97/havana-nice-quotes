import type { Quote } from '../quotes/types';
import type { EditQuoteField } from './shared/editor-types';
import QuoteDateField from './QuoteDateField';
import QuotePricingPanel from './QuotePricingPanel';

type Props = {
  item: Quote;
  edit: EditQuoteField;
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
                Destino / ubicación
                <input
                  value={item.location}
                  onChange={e => edit('location', e.target.value)}
                />
              </label>
              <label>
                Venue
                <input value={item.venue||''} maxLength={120}
                  onChange={e=>edit('venue',e.target.value)}/>
              </label>
              <label>
                Ciudad
                <input value={item.city||''} maxLength={100}
                  onChange={e=>edit('city',e.target.value)}/>
              </label>
              <label>
                Wedding planner
                <input value={item.weddingPlanner||''} maxLength={120}
                  onChange={e=>edit('weddingPlanner',e.target.value)}/>
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
