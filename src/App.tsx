// @ts-nocheck
import { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  FileText,
  Palette,
  MessageCircle,
  Plus,
  Search,
  ArrowUpRight,
  ArrowRight,
  Eye,
  Save,
  SlidersHorizontal,
  UploadCloud,
  Image as ImageIcon,
  Type,
  DollarSign,
  CalendarDays,
  Clock3,
  Check,
  Send,
  X,
  Menu,
  ChevronLeft,
  Copy,
  ChevronDown,
  MessageSquareText,
  Sparkles,
  Archive,
  PenLine,
  ExternalLink,
  Monitor,
  Smartphone,
  CheckCircle2,
  Bell,
  Settings2,
  Heart,
  Download,
  Link as LinkIcon,
  FileCheck2,
  WandSparkles,
} from 'lucide-react';

const photos = [
  'https://images.unsplash.com/photo-1519741497674-611481863552?w=1500&q=85&fit=crop',
  'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1500&q=85&fit=crop',
  'https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=1500&q=85&fit=crop',
  'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=1500&q=85&fit=crop',
];
const seed = [
  {
    id: 'hn1',
    name: 'Olivia & James',
    client: 'Olivia',
    email: '',
    location: 'San Miguel de Allende',
    date: '2027-05-22',
    price: 6500,
    deposit: 30,
    status: 'En revisión',
    cover: photos[0],
    font: 'editorial',
    color: '#18342f',
    note: 'Live music for a day that feels completely yours.',
    package: 'Signature Live Band',
    desc: 'An intimate welcome, a beautiful cocktail hour, and a reception filled with your favorite songs.',
    messages: [
      {
        from: 'client',
        text: 'Can we add music for our welcome party too?',
        time: '10:42 AM',
      },
    ],
  },
  {
    id: 'hn2',
    name: 'Sophie & Daniel',
    client: 'Sophie',
    email: '',
    location: 'Los Cabos',
    date: '2027-06-12',
    price: 7900,
    deposit: 30,
    status: 'Enviada',
    cover: photos[1],
    font: 'editorial',
    color: '#18342f',
    note: 'A little more music. A lot more love.',
    package: 'Full Wedding Experience',
    desc: 'Live music thoughtfully planned around the moments that matter most.',
    messages: [],
  },
  {
    id: 'hn3',
    name: 'Emma & Lucas',
    client: 'Emma',
    email: '',
    location: 'Mexico City',
    date: '2027-09-18',
    price: 5400,
    deposit: 30,
    status: 'Aceptada',
    cover: photos[2],
    font: 'modern',
    color: '#18342f',
    note: 'Together, every step of the way.',
    package: 'Cocktail & Reception',
    desc: 'Real instruments, real musicians, and songs everyone loves.',
    messages: [],
  },
];
const pages = [
  { id: 'home', label: 'Inicio', icon: LayoutDashboard },
  { id: 'quotes', label: 'Cotizaciones', icon: FileText },
  { id: 'editor', label: 'Diseñador', icon: Palette },
  { id: 'messages', label: 'Mensajes', icon: MessageCircle },
];
const usd = n =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Number(n || 0));
const dDate = str =>
  str
    ? new Date(str + 'T12:00:00').toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Date to be confirmed';

function App() {
  const [quotes, setQuotes] = useState(() => {
    try {
      const s = localStorage.getItem('hn_quotes_visual_v1');
      return s ? JSON.parse(s) : seed;
    } catch {
      return seed;
    }
  });
  const [section, setSection] = useState('home');
  const [active, setActive] = useState('hn1');
  const [tab, setTab] = useState('design');
  const [mobileMenu, setMobileMenu] = useState(false);
  const [preview, setPreview] = useState(false);
  const [mobilePreview, setMobilePreview] = useState(false);
  const [toast, setToast] = useState('');
  const [filter, setFilter] = useState('Todas');
  const [search, setSearch] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [clientMessage, setClientMessage] = useState('');
  const [viewAccept, setViewAccept] = useState(false);
  const [copied, setCopied] = useState(false);
  const item = quotes.find(q => q.id === active) || quotes[0];
  useEffect(() => {
    localStorage.setItem('hn_quotes_visual_v1', JSON.stringify(quotes));
  }, [quotes]);
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(''), 3600);
      return () => clearTimeout(t);
    }
  }, [toast]);
  const edit = (key, value) =>
    setQuotes(list =>
      list.map(q => (q.id === active ? { ...q, [key]: value } : q))
    );
  const navigate = x => {
    setSection(x);
    setPreview(false);
    setMobileMenu(false);
  };
  const addQuote = () => {
    const id = 'hn' + Date.now();
    const q = {
      ...seed[0],
      id,
      name: 'New Couple',
      client: '',
      email: '',
      location: 'Destination, Mexico',
      date: '',
      price: 5900,
      status: 'Borrador',
      messages: [],
      cover: photos[0],
      note: 'Your celebration, your way.',
      package: 'Signature Live Band',
      desc: 'Live music planned with care for every moment of your celebration.',
    };
    setQuotes(list => [q, ...list]);
    setActive(id);
    setTab('details');
    navigate('editor');
    setToast('Nuevo borrador creado en este dispositivo');
  };
  const selectQuote = (id, target = 'editor') => {
    setActive(id);
    navigate(target);
  };
  const save = () => setToast('Borrador visual guardado en este navegador');
  const share = () =>
    setToast(
      'Demo visual: el envío real se activará cuando conectemos la nube.'
    );
  const updateStatus = status => {
    edit('status', status);
    setToast('Estado de demostración actualizado');
  };
  const sendClient = () => {
    if (!clientMessage.trim()) {
      setToast('Escribe primero tu solicitud');
      return;
    }
    edit('messages', [
      ...(item.messages || []),
      { from: 'client', text: clientMessage.trim(), time: 'Just now' },
    ]);
    setClientMessage('');
    setViewAccept(false);
    setToast('Solicitud añadida a la bandeja de esta demo');
  };
  const sendAdmin = () => {
    if (!newMessage.trim()) {
      setToast('Escribe una respuesta');
      return;
    }
    edit('messages', [
      ...(item.messages || []),
      { from: 'admin', text: newMessage.trim(), time: 'Just now' },
    ]);
    setNewMessage('');
    setToast('Respuesta de prueba guardada');
  };
  const filePicked = e => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) {
      setToast('Selecciona una fotografía');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      edit('cover', reader.result);
      setToast('Foto aplicada. Esta carga es solo visual.');
    };
    reader.readAsDataURL(f);
  };
  const statusClass = s =>
    s === 'Aceptada'
      ? 'green'
      : s === 'En revisión'
        ? 'gold'
        : s === 'Enviada'
          ? 'blue'
          : 'gray';
  const Logo = () => (
    <div className="brand">
      <div>HAVANA NICE</div>
      <span>Q U O T E S &nbsp; S T U D I O</span>
    </div>
  );
  const btnQuote = (
    <button className="btn primary" onClick={addQuote}>
      <Plus size={16} /> Nueva cotización
    </button>
  );
  const sidebar = (
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
  const topbar = (
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
        <span className="demo-tag">DEMO VISUAL</span>
        <div className="avatar topavatar">F&N</div>
      </div>
    </header>
  );
  const Proposal = ({ embedded = false }) => (
    <div className={'proposal ' + (embedded ? 'embedded' : '')}>
      <div className="proposal-top">
        <span>HAVANA NICE</span>
        <small>LIVE MUSIC · MEXICO</small>
      </div>
      <div
        className="proposal-photo"
        style={{
          backgroundImage:
            'linear-gradient(180deg,rgba(10,24,20,.04) 16%,rgba(10,24,20,.33) 60%,rgba(10,24,20,.67)), url(' +
            item.cover +
            ')',
        }}
      >
        <div className="hero-content">
          <div className="eyebrow light">A PERSONAL PROPOSAL FOR</div>
          <h2 className={item.font === 'modern' ? 'modern' : ''}>
            {item.name}
          </h2>
          <div className="little-line" />
          <p>{item.note}</p>
          <small>
            {item.location} · {dDate(item.date)}
          </small>
        </div>
      </div>
      <div className="paper-content">
        <div className="paper-eyebrow">01 / THE EXPERIENCE</div>
        <h3>
          Beautiful moments.
          <br />
          <em>Real live music.</em>
        </h3>
        <p>{item.desc}</p>
        <div className="paper-rule" />
        <div className="package-intro">
          <span>YOUR EXPERIENCE</span>
          <strong>{item.package}</strong>
        </div>
        <div className="packages">
          <div>
            <Check size={16} /> Live musicians, playing together
          </div>
          <div>
            <Check size={16} /> Curated music for your celebration
          </div>
          <div>
            <Check size={16} /> Personal planning with Fer & Noa
          </div>
        </div>
        <div className="paper-rule" />
        <div className="price-row">
          <div>
            <small>TOTAL PROPOSAL</small>
            <strong>{usd(item.price)}</strong>
          </div>
          <div>
            <small>TO RESERVE · {item.deposit}%</small>
            <strong>{usd((item.price * item.deposit) / 100)}</strong>
          </div>
        </div>
        <div className="paper-end">
          With love & care,<strong>Fer & Noa</strong>
          <small>HAVANA NICE</small>
        </div>
      </div>
    </div>
  );
  const home = (
    <div className="page dashboard">
      <div className="intro-line">
        <div>
          <span className="eyebrow">THURSDAY, OCTOBER 15, 2026</span>
          <h1>
            Good evening, Fer & Noa <span className="handwave">✳</span>
          </h1>
          <p>
            Todo lo que necesitas para crear propuestas que se sientan
            personales.
          </p>
        </div>
        {btnQuote}
      </div>
      <div className="welcome-hero">
        <div className="hero-shade">
          <span className="eyebrow light">HAVANA NICE · QUOTES STUDIO</span>
          <h2>
            Every beautiful
            <br />
            celebration starts
            <br />
            <em>with a conversation.</em>
          </h2>
          <p>Diseña, comparte y conecta con cada pareja desde un solo lugar.</p>
          <button onClick={addQuote} className="btn ivory">
            Crear nueva propuesta <ArrowUpRight size={17} />
          </button>
        </div>
      </div>
      <div className="stats">
        {[
          { num: quotes.length, name: 'Cotizaciones', icon: FileText },
          {
            num: quotes.filter(q => q.status === 'Enviada').length,
            name: 'Enviadas',
            icon: Send,
          },
          {
            num: quotes.filter(q => q.status === 'En revisión').length,
            name: 'En revisión',
            icon: Clock3,
          },
          {
            num: quotes.filter(q => q.status === 'Aceptada').length,
            name: 'Aceptadas',
            icon: CheckCircle2,
          },
        ].map((s, i) => (
          <div className="stat" key={i}>
            <s.icon size={20} />
            <div>
              <strong>{String(s.num).padStart(2, '0')}</strong>
              <span>{s.name}</span>
            </div>
            <ArrowUpRight className="stat-arrow" size={15} />
          </div>
        ))}
      </div>
      <div className="home-bottom">
        <div className="panel">
          <div className="section-header">
            <div>
              <span className="eyebrow">YOUR WORK</span>
              <h3>Propuestas recientes</h3>
            </div>
            <button className="text-btn" onClick={() => navigate('quotes')}>
              Ver todas <ArrowRight size={15} />
            </button>
          </div>
          {quotes.slice(0, 3).map(q => (
            <button
              className="recent-row"
              key={q.id}
              onClick={() => selectQuote(q.id)}
            >
              <img src={q.cover} />
              <div>
                <strong>{q.name}</strong>
                <small>{q.location}</small>
              </div>
              <span className={'pill ' + statusClass(q.status)}>
                {q.status}
              </span>
              <ArrowUpRight size={15} />
            </button>
          ))}
        </div>
        <div className="panel next-panel">
          <div className="section-header">
            <div>
              <span className="eyebrow">CLIENT ACTIVITY</span>
              <h3>En conversación</h3>
            </div>
            <MessageCircle size={19} />
          </div>
          <p className="panel-intro">
            Los mensajes que recibas en el futuro aparecerán aquí en tiempo
            real.
          </p>
          <div className="note-box">
            <div className="note-avatar">O</div>
            <div>
              <strong>Olivia & James</strong>
              <p>“Can we add music for our welcome party too?”</p>
              <button onClick={() => selectQuote('hn1', 'messages')}>
                Abrir conversación <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  const quotesView = (
    <div className="page">
      <div className="intro-line">
        <div>
          <span className="eyebrow">YOUR QUOTES</span>
          <h1>Cotizaciones</h1>
          <p>
            Todas tus propuestas en un mismo lugar, sin perder ningún detalle.
          </p>
        </div>
        {btnQuote}
      </div>
      <div className="panel quotes-panel">
        <div className="list-actions">
          <div className="search-box">
            <Search size={17} />
            <input
              placeholder="Buscar por pareja o destino..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button className="filter-btn">
            <SlidersHorizontal size={16} /> Filtrar
          </button>
        </div>
        <div className="filters">
          {['Todas', 'Borrador', 'Enviada', 'En revisión', 'Aceptada'].map(
            s => (
              <button
                className={filter === s ? 'filter active' : 'filter'}
                onClick={() => setFilter(s)}
                key={s}
              >
                {s}
              </button>
            )
          )}
        </div>
        <div className="table-header">
          <span>PAREJA / DESTINO</span>
          <span>FECHA</span>
          <span>INVERSIÓN</span>
          <span>ESTADO</span>
          <span></span>
        </div>
        {quotes
          .filter(
            q =>
              (filter === 'Todas' || q.status === filter) &&
              [q.name, q.location]
                .join(' ')
                .toLowerCase()
                .includes(search.toLowerCase())
          )
          .map(q => (
            <button
              className="quote-line"
              key={q.id}
              onClick={() => selectQuote(q.id)}
            >
              <div className="table-couple">
                <img src={q.cover} />
                <div>
                  <strong>{q.name}</strong>
                  <small>{q.location}</small>
                </div>
              </div>
              <span className="table-date">{dDate(q.date)}</span>
              <span className="table-price">{usd(q.price)}</span>
              <span>
                <i className={'pill ' + statusClass(q.status)}>{q.status}</i>
              </span>
              <ArrowUpRight size={17} />
            </button>
          ))}
        {quotes.filter(
          q =>
            (filter === 'Todas' || q.status === filter) &&
            [q.name, q.location]
              .join(' ')
              .toLowerCase()
              .includes(search.toLowerCase())
        ).length === 0 && (
          <div className="empty">No hay cotizaciones con esos filtros.</div>
        )}
      </div>
    </div>
  );
  const editor = (
    <div className="page editor-page">
      <div className="editor-head">
        <div>
          <div className="eyebrow">QUOTE DESIGNER / DEMO</div>
          <h1>
            Diseña tu propuesta <span className="italic">a tu manera.</span>
          </h1>
        </div>
        <div className="editor-actions">
          <button className="btn subtle" onClick={() => setPreview(true)}>
            <Eye size={16} /> Vista del cliente
          </button>
          <button className="btn primary" onClick={save}>
            <Save size={16} /> Guardar
          </button>
        </div>
      </div>
      <div className="editor-workspace">
        <div className="edit-panel">
          <div className="edit-tabs">
            <button
              className={tab === 'details' ? 'active' : ''}
              onClick={() => setTab('details')}
            >
              <PenLine size={16} /> Datos
            </button>
            <button
              className={tab === 'design' ? 'active' : ''}
              onClick={() => setTab('design')}
            >
              <Palette size={16} /> Diseño
            </button>
            <button
              className={tab === 'pricing' ? 'active' : ''}
              onClick={() => setTab('pricing')}
            >
              <DollarSign size={16} /> Precios
            </button>
          </div>
          {tab === 'details' && (
            <div className="edit-body">
              <span className="eyebrow">PROPOSAL DETAILS</span>
              <h3>Personaliza cada detalle</h3>
              <label>
                Nombres de la pareja
                <input
                  value={item.name}
                  onChange={e => edit('name', e.target.value)}
                  placeholder="Olivia & James"
                />
              </label>
              <label>
                Destino / Venue
                <input
                  value={item.location}
                  onChange={e => edit('location', e.target.value)}
                />
              </label>
              <label>
                Fecha de la celebración
                <input
                  type="date"
                  value={item.date}
                  onChange={e => edit('date', e.target.value)}
                />
              </label>
              <label>
                Mensaje en la portada
                <textarea
                  rows={3}
                  value={item.note}
                  onChange={e => edit('note', e.target.value)}
                />
              </label>
              <label>
                Nombre del servicio
                <input
                  value={item.package}
                  onChange={e => edit('package', e.target.value)}
                />
              </label>
              <label>
                Descripción
                <textarea
                  rows={4}
                  value={item.desc}
                  onChange={e => edit('desc', e.target.value)}
                />
              </label>
            </div>
          )}
          {tab === 'design' && (
            <div className="edit-body">
              <span className="eyebrow">VISUAL IDENTITY</span>
              <h3>Hazla completamente tuya</h3>
              <label>Fotografía de portada</label>
              <div className="photo-options">
                {photos.map((ph, i) => (
                  <button
                    key={i}
                    className={
                      item.cover === ph ? 'photo-option chosen' : 'photo-option'
                    }
                    onClick={() => edit('cover', ph)}
                    style={{ backgroundImage: 'url(' + ph + ')' }}
                  >
                    {item.cover === ph && <Check size={17} />}
                  </button>
                ))}
              </div>
              <label className="upload-btn">
                <UploadCloud size={18} />
                <span>Subir una fotografía</span>
                <input
                  hidden
                  type="file"
                  accept="image/*"
                  onChange={filePicked}
                />
              </label>
              <div className="edit-separator" />
              <label>Tipografía del título</label>
              <div className="font-options">
                <button
                  className={item.font === 'editorial' ? 'selected' : ''}
                  onClick={() => edit('font', 'editorial')}
                >
                  <span className="font-sample">Aa</span>Editorial Serif
                </button>
                <button
                  className={item.font === 'modern' ? 'selected' : ''}
                  onClick={() => edit('font', 'modern')}
                >
                  <span className="font-sample sans">Aa</span>Modern Clean
                </button>
              </div>
              <label>Color principal</label>
              <div className="swatches">
                {['#18342f', '#3e5240', '#8c735d', '#302d2b', '#92655b'].map(
                  c => (
                    <button
                      aria-label={'Choose ' + c}
                      onClick={() => edit('color', c)}
                      key={c}
                      style={{ backgroundColor: c }}
                      className={item.color === c ? 'swatch on' : 'swatch'}
                    ></button>
                  )
                )}
                <label className="color-circle">
                  <input
                    type="color"
                    value={item.color}
                    onChange={e => edit('color', e.target.value)}
                  />
                </label>
              </div>
              <p className="helper">
                Los cambios se reflejan inmediatamente en la vista previa.
              </p>
            </div>
          )}
          {tab === 'pricing' && (
            <div className="edit-body">
              <span className="eyebrow">THE INVESTMENT</span>
              <h3>Servicios e inversión</h3>
              <label>
                Nombre del paquete
                <input
                  value={item.package}
                  onChange={e => edit('package', e.target.value)}
                />
              </label>
              <label>
                Precio total (USD)
                <input
                  type="number"
                  min="0"
                  value={item.price}
                  onChange={e => edit('price', Number(e.target.value))}
                />
              </label>
              <label>
                Anticipo (%)
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={item.deposit}
                  onChange={e =>
                    edit(
                      'deposit',
                      Math.max(0, Math.min(100, Number(e.target.value)))
                    )
                  }
                />
              </label>
              <div className="investment-box">
                <small>ANTICIPO CALCULADO</small>
                <strong>{usd((item.price * item.deposit) / 100)}</strong>
              </div>
              <div className="edit-separator" />
              <button className="btn primary full" onClick={share}>
                <Send size={16} /> Preparar envío
              </button>
              <p className="helper">
                El envío y las firmas reales se activarán después de configurar
                seguridad y sincronización.
              </p>
            </div>
          )}
        </div>
        <div className="preview-side">
          <div className="preview-heading">
            <div>
              <span className="eyebrow">LIVE PREVIEW</span>
              <h3>Así lo verá la pareja</h3>
            </div>
            <div className="preview-switch">
              <button
                className={!mobilePreview ? 'active' : ''}
                onClick={() => setMobilePreview(false)}
                title="Vista de escritorio"
              >
                <Monitor size={18} />
              </button>
              <button
                className={mobilePreview ? 'active' : ''}
                onClick={() => setMobilePreview(true)}
                title="Vista móvil"
              >
                <Smartphone size={18} />
              </button>
            </div>
          </div>
          <div
            className={
              mobilePreview
                ? 'preview-viewport mobile-frame'
                : 'preview-viewport'
            }
          >
            <div style={{ '--paper-accent': item.color }}>
              <Proposal embedded />
            </div>
          </div>
          <button className="preview-open" onClick={() => setPreview(true)}>
            <ExternalLink size={16} /> Abrir vista completa del cliente
          </button>
        </div>
      </div>
    </div>
  );
  const messagesView = (
    <div className="page">
      <div className="intro-line">
        <div>
          <span className="eyebrow">CONVERSATIONS</span>
          <h1>Mensajes de clientes</h1>
          <p>Conversaciones organizadas por cotización.</p>
        </div>
        <span className="demo-tag">DATOS DE EJEMPLO</span>
      </div>
      <div className="chat-layout panel">
        <div className="chat-list">
          <span className="eyebrow">CLIENT CONVERSATIONS</span>
          <h3>Bandeja</h3>
          {quotes.map(q => (
            <button
              className={
                q.id === active ? 'chat-list-item active' : 'chat-list-item'
              }
              onClick={() => setActive(q.id)}
              key={q.id}
            >
              <span className="chat-avatar">{(q.name || '?')[0]}</span>
              <div>
                <strong>{q.name}</strong>
                <small>
                  {q.messages?.length
                    ? q.messages[q.messages.length - 1].text
                    : 'Sin mensajes todavía'}
                </small>
              </div>
            </button>
          ))}
        </div>
        <div className="chat-content">
          <div className="chat-person">
            <div className="chat-avatar">{(item.name || '?')[0]}</div>
            <div>
              <strong>{item.name}</strong>
              <small>Conversación de prueba</small>
            </div>
          </div>
          <div className="chat-bubbles">
            {!(item.messages || []).length && (
              <div className="chat-empty">
                Todavía no hay mensajes para esta propuesta.
              </div>
            )}
            {(item.messages || []).map((msg, i) => (
              <div
                className={
                  'bubble ' + (msg.from === 'admin' ? 'outgoing' : 'incoming')
                }
                key={i}
              >
                <small>{msg.from === 'admin' ? 'Fer & Noa' : 'CLIENT'}</small>
                <p>{msg.text}</p>
                <time>{msg.time}</time>
              </div>
            ))}
          </div>
          <div className="compose">
            <input
              placeholder="Escribe una respuesta de prueba..."
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') sendAdmin();
              }}
            />
            <button className="btn primary" onClick={sendAdmin}>
              <Send size={17} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
  const clientPage = (
    <div className="client-app">
      <div className="client-navbar">
        <div className="client-brand">
          HAVANA NICE <small>LIVE MUSIC FOR YOUR WEDDING</small>
        </div>
        <button onClick={() => setPreview(false)} className="close-preview">
          <ChevronLeft size={17} /> Volver al editor
        </button>
      </div>
      <div
        className="client-hero"
        style={{
          backgroundImage:
            'linear-gradient(90deg,rgba(19,35,30,.48),rgba(19,35,30,.05)),url(' +
            item.cover +
            ')',
        }}
      >
        <div>
          <span className="eyebrow light">
            CURATED WITH CARE · MADE JUST FOR YOU
          </span>
          <h1>{item.name}</h1>
          <p>{item.note}</p>
        </div>
      </div>
      <div className="client-layout">
        <div className="client-story">
          <span className="eyebrow">HAVANA NICE · YOUR CELEBRATION</span>
          <h2>
            We would love to
            <br />
            <em>be part of your day.</em>
          </h2>
          <p>{item.desc}</p>
          <div className="client-divider" />
          <span className="eyebrow">YOUR LIVE MUSIC EXPERIENCE</span>
          <h3>{item.package}</h3>
          <div className="client-inclusions">
            <p>
              <Check size={17} /> Live musicians, no backing tracks
            </p>
            <p>
              <Check size={17} /> Music selected around your celebration
            </p>
            <p>
              <Check size={17} /> Personal planning with Fer & Noa
            </p>
          </div>
          <div className="client-divider" />
          <div className="client-total">
            <div>
              <small>TOTAL INVESTMENT</small>
              <strong>{usd(item.price)}</strong>
            </div>
            <div>
              <small>{item.deposit}% RESERVATION DEPOSIT</small>
              <strong>{usd((item.price * item.deposit) / 100)}</strong>
            </div>
          </div>
          <small className="tiny">
            Demonstration only. This is not a formal quote, agreement, or
            payment request.
          </small>
        </div>
        <div className="client-actions">
          <div className="client-card">
            <span className="eyebrow">LET'S TALK</span>
            <h3>Have a question?</h3>
            <p>
              Tell us what you're imagining. We can adjust the proposal
              together.
            </p>
            <textarea
              placeholder="Hi Fer & Noa! We'd love to ask..."
              rows={4}
              value={clientMessage}
              onChange={e => setClientMessage(e.target.value)}
            />
            <button className="btn primary full" onClick={sendClient}>
              <MessageCircle size={16} /> Send a sample message
            </button>
          </div>
          <div className="client-card">
            <span className="eyebrow">NEXT STEP</span>
            <h3>Love what you see?</h3>
            <p>
              Accepting this demo only changes the sample status. No electronic
              signature is collected.
            </p>
            {viewAccept ? (
              <div className="demo-success">
                <CheckCircle2 size={25} />
                <strong>Acceptance simulated</strong>
                <small>This is only a visual preview.</small>
              </div>
            ) : (
              <button
                className="btn outline full"
                onClick={() => {
                  setViewAccept(true);
                  updateStatus('Aceptada');
                }}
              >
                <Heart size={16} /> Simulate acceptance
              </button>
            )}
          </div>
        </div>
      </div>
      <footer className="client-footer">
        HAVANA NICE · SERVING LOVE THROUGH LIVE MUSIC{' '}
        <span>VISUAL DEMO ONLY</span>
      </footer>
    </div>
  );
  if (preview)
    return (
      <>
        <div className="preview-label">
          VISTA DEL CLIENTE · SOLO DEMOSTRACIÓN
        </div>
        {clientPage}
        {toast && <div className="toast">{toast}</div>}
      </>
    );
  return (
    <div className="app-shell">
      {sidebar}
      {mobileMenu && (
        <div className="menu-overlay">
          <div className="mobile-sidebar">
            {sidebar}
            <button className="menu-close" onClick={() => setMobileMenu(false)}>
              <X />
            </button>
          </div>
          <button
            className="overlay-close"
            aria-label="Close"
            onClick={() => setMobileMenu(false)}
          ></button>
        </div>
      )}
      <div className="main">
        {topbar}
        {section === 'home' && home}
        {section === 'quotes' && quotesView}
        {section === 'editor' && editor}
        {section === 'messages' && messagesView}
        <div className="footer-demo">
          <span>HAVANA NICE Quotes Studio · Visual prototype v0.1</span>
          <span>No client data is transmitted · Saved only on this device</span>
        </div>
      </div>
      <div className="mobile-bottom">
        {pages.map(p => (
          <button
            key={p.id}
            onClick={() => navigate(p.id)}
            className={section === p.id ? 'active' : ''}
          >
            <p.icon size={19} />
            <span>{p.label}</span>
          </button>
        ))}
      </div>
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
export default App;
