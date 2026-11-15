import { useState } from 'react';
import type { FormEvent } from 'react';
import { Cloud, LockKeyhole, ArrowRight, LoaderCircle } from 'lucide-react';

type Props = {
  checking: boolean;
  error: string;
  login: (password: string) => Promise<boolean>;
};

export default function CloudLogin({ checking, error, login }: Props) {
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!password || busy) return;
    setBusy(true);
    try {
      if (await login(password)) setPassword('');
    } finally {
      setBusy(false);
    }
  };
  return (
    <main className="hn-cloud-login">
      <div className="hn-cloud-login-top">
        <div className="hn-cloud-login-brand">HAVANA NICE</div>
        <span>QUOTES STUDIO</span>
      </div>
      <form className="hn-cloud-login-card" onSubmit={submit}>
        <span className="hn-cloud-login-kicker"><Cloud size={15} /> CLOUD STUDIO · PRIVATE</span>
        <h1>Bienvenidos,<br/><em>Fer & Noa.</em></h1>
        <p>Sus cotizaciones y fotografías, sincronizadas y protegidas en Cloudflare.</p>
        <label htmlFor="hn-access-code">Contraseña del estudio</label>
        <div className="hn-cloud-login-input">
          <LockKeyhole size={19}/>
          <input id="hn-access-code" type="password" autoComplete="current-password" autoCapitalize="none"
            placeholder="Contraseña privada" value={password} onChange={e => setPassword(e.target.value)}
            disabled={busy || checking} required />
        </div>
        {error && <p className="hn-cloud-login-error" role="alert">{error}</p>}
        <button className="btn primary full" type="submit" disabled={busy || checking || !password}>
          {busy || checking ? <LoaderCircle size={17}/> : <ArrowRight size={17}/>}
          {checking ? 'Conectando con la nube...' : busy ? 'Verificando...' : 'Entrar al estudio'}
        </button>
        <small>Acceso exclusivo de HAVANA NICE. Los datos no se guardan en este formulario.</small>
      </form>
    </main>
  );
}
