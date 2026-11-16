import { useCallback, useEffect, useState } from 'react';

export type TrashKind = 'quote' | 'photo' | 'video' | 'file';
export type TrashItem = {
  id: string;
  kind: TrashKind;
  label: string;
  deletedAt: number;
  url?: string;
};

async function trashRequest(path: string, method: 'POST' | 'DELETE'): Promise<void> {
  const response = await fetch(path, { method, credentials: 'same-origin' });
  if (!response.ok) {
    const result = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(result.error || 'No se pudo completar la operación.');
  }
}

/** Unified trash, private in D1. The same R2 object remains until final purge. */
export function useTrash(enabled: boolean) {
  const [items, setItems] = useState<TrashItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const refreshTrash = useCallback(async () => {
    if (!enabled) return;
    try {
      const response = await fetch('/api/trash', { credentials: 'same-origin', cache: 'no-store' });
      if (!response.ok) throw new Error('No se pudo consultar la papelera.');
      const result = await response.json() as { items: TrashItem[] };
      setItems(result.items || []);
      setError('');
    } catch {
      setError('No se pudo actualizar la papelera.');
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) { setItems([]); setError(''); return; }
    void refreshTrash();
  }, [enabled, refreshTrash]);

  const operate = useCallback(async (item: TrashItem, method: 'POST' | 'DELETE') => {
    if (!enabled || busy || item.kind === 'file') return;
    setBusy(true);
    setError('');
    try {
      const suffix = method === 'POST' ? '/restore' : '';
      await trashRequest('/api/trash/' + item.kind + '/' + encodeURIComponent(item.id) + suffix, method);
      await refreshTrash();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo modificar la papelera.');
      throw cause;
    } finally { setBusy(false); }
  }, [enabled, busy, refreshTrash]);

  return {
    items, busy, error, refreshTrash,
    restoreItem: (item: TrashItem) => operate(item, 'POST'),
    purgeItem: (item: TrashItem) => operate(item, 'DELETE'),
  };
}
