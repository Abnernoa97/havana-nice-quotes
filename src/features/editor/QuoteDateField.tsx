import { useEffect, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { displayWeddingDate, parseWeddingDate, weddingWeekday } from '../../shared/lib/wedding-date';
import './quote-date.css';

type Props = { quoteId: string; value: string; onChange: (iso: string) => void };

/** Direct mobile keyboard entry. No native calendar modal or browser date picker. */
export default function QuoteDateField({ quoteId, value, onChange }: Props) {
  const [draft, setDraft] = useState(() => displayWeddingDate(value));
  const [touched, setTouched] = useState(false);
  useEffect(() => {
    setDraft(displayWeddingDate(value));
    setTouched(false);
  }, [quoteId]); // New quote: discard partial input from the previous quote.
  const iso = parseWeddingDate(draft);
  const invalid = touched && draft.trim() !== '' && !iso;
  const update = (text: string) => {
    setDraft(text);
    setTouched(false);
    const parsed = parseWeddingDate(text);
    if (parsed && parsed !== value) onChange(parsed);
    if (text === '' && value) onChange('');
  };
  const blur = () => {
    setTouched(true);
    if (draft.trim() && !iso) {
      // Avoid leaving an older valid date saved when the user replaces it with invalid input.
      if (value) onChange('');
    }
  };
  return (
    <div className="hn-date-editor">
      <label htmlFor="hn-celebration-date">Fecha de la celebración</label>
      <div className={'hn-date-box' + (invalid ? ' invalid' : '')}>
        <CalendarDays size={20} aria-hidden="true"/>
        <input id="hn-celebration-date" type="text" inputMode="text"
          autoComplete="off" spellCheck={false} value={draft}
          placeholder="15/11/2027" aria-invalid={invalid} aria-describedby="hn-date-feedback"
          onChange={event => update(event.target.value)} onBlur={blur}/>
      </div>
      <p id="hn-date-feedback" className={'hn-date-feedback' + (invalid ? ' invalid' : '')}
        aria-live="polite">
        {iso ? weddingWeekday(iso) : invalid
          ? 'Fecha no válida. Escribe 15/11/2027 o 15 de noviembre de 2027.'
          : 'Escribe la fecha directamente. El día de la semana aparecerá aquí.'}
      </p>
    </div>
  );
}
