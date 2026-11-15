import { useCallback, useEffect, useRef, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { Quote } from './types';

export type CloudSyncStatus = 'loading' | 'synced' | 'saving' | 'offline' | 'conflict';
type RemoteQuote = { quote: Quote; revision: number };
const SYNC_INTERVAL = 15000;

/** No imports from the demo storage or demo seed: the cloud begins with zero quotes. */
export function useQuoteStore(enabled: boolean) {
  const [quotes, renderQuotes] = useState<Quote[]>([]);
  const [syncStatus, setSyncStatus] = useState<CloudSyncStatus>('loading');
  const local = useRef<Quote[]>([]);
  const revisions = useRef(new Map<string, number>());
  const pending = useRef(new Map<string, Quote>());
  const enabledRef = useRef(enabled);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saving = useRef<Promise<boolean> | null>(null);
  enabledRef.current = enabled;

  const flush = useCallback((): Promise<boolean> => {
    if (saving.current) return saving.current;
    if (!enabledRef.current) return Promise.resolve(false);
    if (pending.current.size === 0) {
      setSyncStatus('synced');
      return Promise.resolve(true);
    }
    const work = (async () => {
      setSyncStatus('saving');
      for (const [id, record] of [...pending.current]) {
        try {
          const expectedRevision = revisions.current.get(id) || 0;
          const response = await fetch('/api/quotes/' + encodeURIComponent(id), {
            method: 'PUT', credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quote: record, expectedRevision }),
          });
          if (response.status === 409) {
            setSyncStatus('conflict');
            return false; // Never silently overwrite another device.
          }
          if (!response.ok) throw new Error('Cloud sync failed: ' + response.status);
          const result = await response.json() as { revision: number };
          revisions.current.set(id, result.revision);
          // Another edit arrived while this request was in flight.
          if (pending.current.get(id) === record) pending.current.delete(id);
        } catch (error) {
          console.warn('Cloud save unavailable', error);
          setSyncStatus('offline');
          return false; // The edited record remains in memory for retry.
        }
      }
      setSyncStatus(pending.current.size ? 'saving' : 'synced');
      return pending.current.size === 0;
    })();
    saving.current = work;
    void work.finally(() => {
      saving.current = null;
      if (pending.current.size && enabledRef.current && timer.current === null) {
        timer.current = setTimeout(() => { timer.current = null; void flush(); }, 900);
      }
    });
    return work;
  }, []);

  const queueSave = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => { timer.current = null; void flush(); }, 850);
  }, [flush]);

  const setQuotes: Dispatch<SetStateAction<Quote[]>> = useCallback(update => {
    if (!enabledRef.current) return;
    const before = local.current;
    const after = typeof update === 'function' ? update(before) : update;
    local.current = after;
    const existing = new Map(before.map(q => [q.id, q]));
    for (const quote of after) {
      const old = existing.get(quote.id);
      if (!old || JSON.stringify(old) !== JSON.stringify(quote)) {
        pending.current.set(quote.id, quote);
      }
    }
    renderQuotes(after);
    if (pending.current.size) {
      setSyncStatus('saving');
      queueSave();
    }
  }, [queueSave]);

  const refresh = useCallback(async () => {
    if (!enabledRef.current) return;
    try {
      const response = await fetch('/api/quotes', {
        credentials: 'same-origin', cache: 'no-store',
      });
      if (!response.ok) throw new Error('Cloud reads failed: ' + response.status);
      const payload = await response.json() as { quotes: RemoteQuote[] };
      if (!Array.isArray(payload.quotes)) throw new Error('Invalid cloud response');
      const incoming = new Map(payload.quotes.map(row => [row.quote.id, row]));
      for (const row of payload.quotes) {
        if (!pending.current.has(row.quote.id)) revisions.current.set(row.quote.id, row.revision);
      }
      // In-progress edits remain visible and are never lost to a background refresh.
      const merged = payload.quotes.map(row => pending.current.get(row.quote.id) || row.quote);
      for (const [id, quote] of pending.current) {
        if (!incoming.has(id)) merged.unshift(quote);
      }
      if (JSON.stringify(merged) !== JSON.stringify(local.current)) {
        local.current = merged;
        renderQuotes(merged);
      }
      if (!pending.current.size) setSyncStatus('synced');
    } catch (error) {
      console.warn('Cloud refresh unavailable', error);
      setSyncStatus('offline');
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      local.current = [];
      revisions.current.clear();
      pending.current.clear();
      renderQuotes([]);
      setSyncStatus('loading');
      return;
    }
    void refresh();
    const interval = setInterval(() => { void refresh(); }, SYNC_INTERVAL);
    return () => {
      clearInterval(interval);
      if (timer.current) clearTimeout(timer.current);
      timer.current = null;
    };
  }, [enabled, refresh]);

  return {
    quotes, setQuotes, syncStatus,
    storageError: syncStatus === 'offline' || syncStatus === 'conflict',
    flush, refresh,
  };
}
