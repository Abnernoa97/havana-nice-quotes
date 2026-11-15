import { useRef } from 'react';
import { ChevronDown, Send } from 'lucide-react';
import { money, quoteCurrency } from '../../shared/lib/formatters';
import type { QuoteCurrency } from '../../shared/lib/formatters';
import { safeQuotePrice, safeQuoteDeposit, normalizePriceInput } from '../quotes/model';
import './quote-pricing.css';

const DEPOSIT_OPTIONS = [20, 30, 40, 50, 60, 70, 80, 90, 100] as const;

type PricingQuote = {
  package: string;
  price: number;
  deposit: number;
  currency?: QuoteCurrency;
};

type Props = {
  item: PricingQuote;
  edit: (key: 'package' | 'price' | 'deposit' | 'currency', value: string | number) => void;
  share: () => void;
};

/** Currency only labels amounts; it never converts exchange rates. */
export default function QuotePricingPanel({ item, edit, share }: Props) {
  const depositPicker = useRef<HTMLDetailsElement>(null);
  const currency = quoteCurrency(item.currency);

  return (
    <div className="edit-body hn-pricing">
      <span className="eyebrow">THE INVESTMENT</span>
      <h3>Servicios e inversión</h3>

      <label htmlFor="hn-quote-package">Nombre del paquete</label>
      <input
        id="hn-quote-package"
        value={item.package}
        onChange={event => edit('package', event.target.value)}
      />

      <div className="hn-pricing-heading">
        <label htmlFor="hn-quote-price">Precio total</label>
        <div className="hn-currency-switch" role="group" aria-label="Moneda de la cotización" data-currency={currency}>
          <button type="button" className={currency === 'USD' ? 'selected' : ''}
            aria-pressed={currency === 'USD'} onClick={() => edit('currency', 'USD')}>USD</button>
          <button type="button" className={currency === 'MX' ? 'selected' : ''}
            aria-pressed={currency === 'MX'} onClick={() => edit('currency', 'MX')}>MX</button>
        </div>
      </div>
      <input
        id="hn-quote-price"
        type="text"
        inputMode="numeric"
        autoComplete="off"
        className="hn-price-input"
        placeholder="0"
        value={item.price === 0 ? '' : String(item.price)}
        onFocus={event => event.currentTarget.select()}
        onChange={event => edit('price', safeQuotePrice(normalizePriceInput(event.target.value)))}
      />

      <label htmlFor="hn-quote-deposit">Anticipo (%)</label>
      <input
        id="hn-quote-deposit"
        type="number"
        inputMode="numeric"
        min="0"
        max="100"
        step="1"
        value={item.deposit}
        onChange={event => edit('deposit', safeQuoteDeposit(event.target.value))}
      />
      <details className="hn-deposit-picker" ref={depositPicker}>
        <summary>
          <span>Elegir porcentaje</span>
          <span className="hn-deposit-picker-selected">{item.deposit}% <ChevronDown size={17}/></span>
        </summary>
        <div className="hn-deposit-options" role="group" aria-label="Porcentajes de anticipo">
          {DEPOSIT_OPTIONS.map(percent => (
            <button
              key={percent}
              type="button"
              className={item.deposit === percent ? 'selected' : ''}
              aria-pressed={item.deposit === percent}
              onClick={() => {
                edit('deposit', percent);
                if (depositPicker.current) depositPicker.current.open = false;
              }}
            >
              {percent}%
            </button>
          ))}
        </div>
      </details>

      <div className="investment-box">
        <small>ANTICIPO CALCULADO · {currency}</small>
        <strong>{money(item.price * item.deposit / 100, currency)}</strong>
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
