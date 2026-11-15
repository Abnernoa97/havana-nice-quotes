type DetailsQuote = {
  name: string;
  location: string;
  date: string;
  note: string;
  package: string;
  desc: string;
};

type DetailsField = keyof DetailsQuote;

type Props = {
  item: DetailsQuote;
  edit: (key: DetailsField, value: string) => void;
};

/** QN-00.07: Datos. Conserva el JSX y clases existentes de la demo. */
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
            </div>
  );
}
