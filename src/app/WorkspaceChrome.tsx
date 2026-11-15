import type { LucideIcon } from 'lucide-react';
import { Sparkles, Settings2, Menu, Download } from 'lucide-react';
import type { Quote } from '../features/quotes/types';

export type NavItem = { id: string; label: string; icon: LucideIcon };
type SidebarProps = {
  pages: NavItem[];
  quotes: Quote[];
  navigate: (section: string) => void;
  section: string;
};
type TopbarProps = {
  section: string;
  standalone: boolean;
  installApplication: () => void;
  setMobileMenu: (open: boolean) => void;
};

function Logo() {
  return (
    <div className="brand">
      <div>HAVANA NICE</div>
      <span>Q U O T E S &nbsp; S T U D I O</span>
    </div>
  );
}

export function Sidebar({ pages, quotes, navigate, section }: SidebarProps) {
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
            {p.id === 'messages' &&
              quotes.some(q => q.messages?.some(m => m.from === 'client')) && (
                <i className="navdot" />
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
            <small>Visual prototype · v0.1</small>
          </span>
        </div>
        <div className="identity">
          <div className="avatar">F&N</div>
          <span>
            Fer & Noa<small>HAVANA NICE Studio</small>
          </span>
          <Settings2 size={16} />
        </div>
      </div>
    </aside>
  );
}

export function Topbar({ section, standalone, installApplication, setMobileMenu }: TopbarProps) {
  return (
    <header className="topbar">
      <button className="menubtn" onClick={() => setMobileMenu(true)}>
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
              : 'Mensajes'}
      </div>
      <div className="topright">
        {!standalone && (
          <button type="button" className="hn-install-button" onClick={installApplication}>
            <Download size={16} />
            <span>Instalar app</span>
          </button>
        )}
        <span className="demo-tag">DEMO VISUAL</span>
        <div className="avatar topavatar">F&N</div>
      </div>
    </header>
  );
}
