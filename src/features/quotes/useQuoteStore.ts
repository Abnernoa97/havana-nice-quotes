import { useEffect, useState } from 'react';
import { seed } from './demo-data';
import { parseStoredQuotes, QUOTES_STORAGE_KEY } from './storage';
import type { Quote } from './types';

export function useQuoteStore() {
  const [quotes, setQuotes] = useState<Quote[]>(() => {
    try {
      return parseStoredQuotes(localStorage.getItem(QUOTES_STORAGE_KEY), seed);
    } catch {
      return seed;
    }
  });
  const [storageError, setStorageError] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(QUOTES_STORAGE_KEY, JSON.stringify(quotes));
      setStorageError(false);
    } catch (error) {
      console.warn('Quote demo local storage unavailable', error);
      setStorageError(true);
    }
  }, [quotes]);

  return { quotes, setQuotes, storageError };
}
