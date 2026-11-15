import { useCallback, useEffect, useState } from 'react';

export type DeviceStatus = 'checking' | 'unlinked' | 'authorized';

/**
 * No password or identity provider. The first phone opens its private,
 * one-time activation link. Subsequent phones are invited from the studio.
 * Authentication is via a long-lived, HttpOnly device cookie.
 */
export function useDeviceAccess() {
  const [status, setStatus] = useState<DeviceStatus>('checking');
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    const activate = async () => {
      const fragment = window.location.hash;
      const code = fragment.startsWith('#activate=') ? fragment.slice('#activate='.length) : '';
      if (code) {
        // Never retain the secret in browser history or share/referrer URLs.
        window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search);
        try {
          const response = await fetch('/api/device/activate', {
            method: 'POST', credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code }),
          });
          if (!mounted) return;
          if (response.ok) {
            setStatus('authorized');
            return;
          }
          setError('Este enlace de vinculación ya se utilizó o caducó.');
        } catch {
          if (mounted) setError('No fue posible conectar este dispositivo. Revisa Internet.');
        }
      }
      try {
        const response = await fetch('/api/device/status', {
          credentials: 'same-origin', cache: 'no-store',
        });
        if (mounted) setStatus(response.ok ? 'authorized' : 'unlinked');
      } catch {
        if (mounted) {
          setStatus('unlinked');
          setError('No fue posible conectar con Cloudflare. Revisa Internet.');
        }
      }
    };
    void activate();
    return () => { mounted = false; };
  }, []);

  const invite = useCallback(async (): Promise<string> => {
    const response = await fetch('/api/device/invite', {
      method: 'POST', credentials: 'same-origin',
    });
    const data = await response.json() as { url?: string; error?: string };
    if (!response.ok || !data.url) throw new Error(data.error || 'No se pudo generar el enlace.');
    return data.url;
  }, []);
  return { status, error, invite };
}
