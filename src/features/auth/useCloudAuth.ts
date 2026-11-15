import { useCallback, useEffect, useState } from 'react';

export type AuthState = 'checking' | 'locked' | 'authenticated';
export function useCloudAuth() {
  const [status, setStatus] = useState<AuthState>('checking');
  const [error, setError] = useState('');

  useEffect(() => {
    let live = true;
    fetch('/api/auth/session', { credentials: 'same-origin', cache: 'no-store' })
      .then(res => { if (live) setStatus(res.ok ? 'authenticated' : 'locked'); })
      .catch(() => {
        if (live) { setStatus('locked'); setError('No se pudo conectar con Cloudflare. Revisa tu conexión.'); }
      });
    return () => { live = false; };
  }, []);

  const login = useCallback(async (password: string): Promise<boolean> => {
    setError('');
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST', credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (!response.ok) {
        const result = await response.json().catch(() => ({})) as { error?: string };
        setError(result.error || 'No fue posible iniciar sesión.');
        return false;
      }
      setStatus('authenticated');
      return true;
    } catch {
      setError('Sin conexión con Cloudflare. Inténtalo de nuevo.');
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    try { await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' }); }
    finally { setStatus('locked'); }
  }, []);
  return { status, error, login, logout };
}
