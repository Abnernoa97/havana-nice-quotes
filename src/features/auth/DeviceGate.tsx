import { Cloud, Smartphone, RefreshCw } from 'lucide-react';

type Props = { checking: boolean; error: string };

/** New devices require a private, one-time invitation. */
export default function DeviceGate({ checking, error }: Props) {
  return (
    <main className="hn-cloud-login">
      <div className="hn-cloud-login-top">
        <div className="hn-cloud-login-brand">HAVANA NICE</div>
        <span>Q U O T E S &nbsp; S T U D I O</span>
      </div>
      <div className="hn-cloud-login-card hn-device-gate">
        <span className="hn-cloud-login-kicker"><Cloud size={15} /> CLOUD STUDIO</span>
        {checking ? (
          <>
            <h1>Conectando <em>tu estudio.</em></h1>
            <p>Estamos comprobando el acceso de este teléfono.</p>
          </>
        ) : (
          <>
            <Smartphone size={31} strokeWidth={1.3} />
            <h1>Vincula <em>este teléfono.</em></h1>
            <p>Por privacidad, la nube solo está disponible en tus dispositivos autorizados. Abre aquí el enlace privado generado desde otro teléfono donde ya uses Quotes Studio.</p>
            {error && <p className="hn-cloud-login-error" role="alert">{error}</p>}
            <button type="button" className="btn subtle full" onClick={() => window.location.reload()}>
              <RefreshCw size={17}/> Volver a comprobar
            </button>
          </>
        )}
        <small>Sin contraseñas ni cuentas adicionales. Tus cotizaciones permanecen privadas en Cloudflare.</small>
      </div>
    </main>
  );
}
