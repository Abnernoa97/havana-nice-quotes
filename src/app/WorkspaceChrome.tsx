import type { LucideIcon } from 'lucide-react';
import { Sparkles, Link2, Menu, Download, Cloud, CloudOff } from 'lucide-react';

export type NavItem = { id: string; label: string; icon: LucideIcon };
type SidebarProps = {
  pages: NavItem[];
  navigate: (section: string) => void;
  section: string;
  onInvite: () => void;
  unreadCount: number;
};
type TopbarProps = {
  section: string;
  standalone: boolean;
  installApplication: () => void;
  setMobileMenu: (open: boolean) => void;
  syncStatus: string;
};

function Logo() {
  return (
    <div className="brand">
      <div>HAVANA NICE</div>
      <span>Q U O T E S &nbsp; S T U D I O</span>
    </div>
  );
}

export function Sidebar({ pages, navigate, section, onInvite, unreadCount }: SidebarProps) {
  return (
    <aside className="sidebar">
      <Logo />
      <div className="brand-divider"></div>
      <div className="sidebar-caption">WORKSPACE</div>
      <nav>
        {pages.map(p => (
          <button
            key={p.id}
            onClick={() => navigate(p.id)}
            className={section === p.id ? 'navitem selected' : 'navitem'}
          >
            <p.icon size={18} />
            <span>{p.label}</span>
            {p.id === 'messages' && unreadCount>0 && (
              <span className="hn-nav-unread" aria-label={unreadCount+' mensajes nuevos'}>
                {unreadCount>99?'99+':unreadCount}</span>
            )}
          </button>
        ))}
      </nav>
      <div className="side-bottom">
        <div className="private-note">
          <Sparkles size={17} />
          <span>
            Made for Fer & Noa
            <br />
            <small>Cloudflare · Private Studio</small>
          </span>
        </div>
        <div className="identity">
          <div className="avatar">F&N</div>
          <span>
            Fer & Noa<small>HAVANA NICE Studio</small>
          </span>
          <button type="button" className="hn-device-link-action" onClick={onInvite}
            title="Vincular otro teléfono" aria-label="Vincular otro teléfono"><Link2 size={18}/></button>
        </div>
      </div>
    </aside>
  );
}

export function Topbar({ section, standalone, installApplication, setMobileMenu, syncStatus }: TopbarProps) {
  return (
    <header className="topbar">
      <button type="button" className="menubtn" aria-label="Abrir menú" onClick={() => setMobileMenu(true)}>
        <Menu size={22} />
      </button>
      <div className="breadcrumb">
        HAVANA NICE <span>/</span>{' '}
        {section === 'home'
          ? 'Inicio'
          : section === 'quotes'
            ? 'Cotizaciones'
            : section === 'editor'
              ? 'Diseñador'
              : section === 'photos'
                ? 'Fotos'
                : section === 'trash' ? 'Papelera'
                : 'Mensajes'}
      </div>
      <div className="topright">
        {!standalone && (
          <button type="button" className="hn-install-button" onClick={installApplication}>
            <Download size={16} />
            <span>Instalar app</span>
          </button>
        )}
        <span className={'demo-tag hn-cloud-indicator ' + syncStatus} role="status">
          {syncStatus === 'synced' ? <Cloud size={14}/> : <CloudOff size={14}/>}
          <span>{syncStatus === 'synced' ? 'EN LA NUBE' : syncStatus === 'saving' ? 'GUARDANDO' : syncStatus === 'conflict' ? 'REVISAR CAMBIOS' : 'SIN CONEXIÓN'}</span>
        </span>
        <div className="avatar topavatar">F&N</div>
      </div>
    </header>
  );
}
