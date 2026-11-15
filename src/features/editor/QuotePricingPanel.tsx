import { Send } from 'lucide-react';
import { usd } from '../../shared/lib/formatters';
import { safeQuotePrice, safeQuoteDeposit } from '../quotes/model';

type PricingQuote = {
  package: string;
  price: number;
  deposit: number;
};

type Props = {
  item: PricingQuote;
  edit: (key: 'package' | 'price' | 'deposit', value: string | number) => void;
  share: () => void;
};

/**
 * QN-00.07: panel independiente. Mantiene el mismo HTML/CSS y lógica de
 * cálculo de la demo; no modifica almacenamiento, envío ni contratos.
 */
export default function QuotePricingPanel({ item, edit, share }: Props) {
  return (
    <div className="edit-body">
              <span className="eyebrow">THE INVESTMENT</span>
              <h3>Servicios e inversión</h3>
              <label>
                Nombre del paquete
                <input
                  value={item.package}
                  onChange={e => edit('package', e.target.value)}
                />
              </label>
              <label>
                Precio total (USD)
                <input
                  type="number"
                  min="0"
                  value={item.price}
                  onChange={e => edit('price', safeQuotePrice(e.target.value))}
                />
              </label>
              <label>
                Anticipo (%)
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={item.deposit}
                  onChange={e =>
                    edit(
                      'deposit',
                      safeQuoteDeposit(e.target.value)
                    )
                  }
                />
              </label>
              <div className="investment-box">
                <small>ANTICIPO CALCULADO</small>
                <strong>{usd((item.price * item.deposit) / 100)}</strong>
              </div>
              <div className="edit-separator" />
              <button className="btn primary full" onClick={share}>
                <Send size={16} /> Preparar envío
              </button>
              <p className="helper">
                El envío y las firmas reales se activarán después de configurar
                seguridad y sincronización.
              </p>
            </div>
  );
}
