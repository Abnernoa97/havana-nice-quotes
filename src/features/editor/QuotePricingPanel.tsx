import { useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { money, quoteCurrency } from '../../shared/lib/formatters';
import type { QuoteCurrency } from '../../shared/lib/formatters';
import { safeQuotePrice, safeQuoteDeposit, normalizePriceInput } from '../quotes/model';
import './quote-pricing.css';

const DEPOSIT_OPTIONS = [20, 30, 40, 50, 60, 70, 80, 90, 100] as const;

type PricingQuote = {
  price: number;
  deposit: number;
  currency?: QuoteCurrency;
};

type Props = {
  item: PricingQuote;
  edit: (key: 'price' | 'deposit' | 'currency', value: string | number) => void;
};

/** Currency only labels amounts; it never converts exchange rates. */
export default function QuotePricingPanel({ item, edit }: Props) {
  const depositPicker = useRef<HTMLDetailsElement>(null);
  const currency = quoteCurrency(item.currency);

  return (
    <section className="hn-pricing">
      <h4>Inversión</h4>

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
        value={item.price === 0 ? '' : String(item.price)}
        onFocus={event => event.currentTarget.select()}
        onChange={event => edit('price', safeQuotePrice(normalizePriceInput(event.target.value)))}
      />

      <div className="hn-deposit-row">
        <span className="hn-deposit-label">Anticipo</span>
        <details className="hn-deposit-picker" ref={depositPicker}>
          <summary aria-label="Elegir porcentaje de anticipo">
            <span className={'hn-deposit-picker-selected' + (item.deposit ? ' chosen' : '')}>
              {item.deposit ? item.deposit + '%' : 'Elegir'}
            </span>
            <ChevronDown size={17}/>
          </summary>
          <div className="hn-deposit-options" role="group" aria-label="Porcentajes de anticipo">
            {DEPOSIT_OPTIONS.map(percent => (
              <button key={percent} type="button"
                className={item.deposit === percent ? 'selected' : ''}
                aria-pressed={item.deposit === percent}
                onClick={() => {
                  edit('deposit', percent);
                  if (depositPicker.current) depositPicker.current.open = false;
                }}>
                {percent}%
              </button>
            ))}
          </div>
        </details>
      </div>

      {item.price > 0 && item.deposit > 0 && (
        <div className="investment-box">
          <small>ANTICIPO CALCULADO · {currency}</small>
          <strong>{money(item.price * item.deposit / 100, currency)}</strong>
        </div>
      )}
    </section>
  );
}
