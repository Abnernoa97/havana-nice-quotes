import { useEffect, useState } from 'react';
import type { ChangeEvent } from 'react';
import type { Quote } from '../features/quotes/types';
import FlipMagazine from '../features/magazine/FlipMagazine';
import { editorialStyles } from '../features/editor/styles/EditorialStyles';
import { createSampleDraft, editSampleQuote, statusClass } from '../features/quotes/model';
import { useQuoteStore } from '../features/quotes/useQuoteStore';
import HomeScreen from '../features/home/HomeScreen';
import MessagesScreen from '../features/messages/MessagesScreen';
import ClientPage from '../features/client/ClientPage';
import QuoteEditorScreen from '../features/editor/QuoteEditorScreen';
import { Sidebar, Topbar } from './WorkspaceChrome';
import { useInstallPrompt } from '../features/pwa/useInstallPrompt';
import InstallGuide from '../features/pwa/InstallGuide';
import QuotesScreen from '../features/quotes/QuotesScreen';
import {
  LayoutDashboard,
  FileText,
  BookOpen,
  Palette,
  MessageCircle,
  Plus,
  X,
  ChevronLeft,
} from 'lucide-react';

const pages = [
  { id: 'home', label: 'Inicio', icon: LayoutDashboard },
  { id: 'quotes', label: 'Cotizaciones', icon: FileText },
  { id: 'editor', label: 'Diseñador', icon: Palette },
  { id: 'messages', label: 'Mensajes', icon: MessageCircle },
];
function App() {
  const { quotes, setQuotes, storageError } = useQuoteStore();
  const [section, setSection] = useState('home');
  const [active, setActive] = useState('hn1');
  const [tab, setTab] = useState('styles');
  const [mobileMenu, setMobileMenu] = useState(false);
  const [preview, setPreview] = useState(false);
  const [previewMode, setPreviewMode] = useState('flip');
  const [mobilePreview, setMobilePreview] = useState(false);
  const [toast, setToast] = useState('');
  const [filter, setFilter] = useState('Todas');
  const [search, setSearch] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [clientMessage, setClientMessage] = useState('');
  const [viewAccept, setViewAccept] = useState(false);
  const { standalone, installApplication, showInstallGuide, setShowInstallGuide } = useInstallPrompt();
  const installationGuide = showInstallGuide ? (
    <InstallGuide onClose={() => setShowInstallGuide(false)} />
  ) : null;

  const item = quotes.find(q => q.id === active) || quotes[0];
  const styleName = item.style && editorialStyles.some(s => s.id === item.style) ? item.style : 'libre';
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(''), 3600);
      return () => clearTimeout(t);
    }
  }, [toast]);
  const edit = (key: keyof Quote, value: Quote[keyof Quote]) =>
    setQuotes(list => editSampleQuote(list, active, key, value));
  const openClientPreview = () => {
    setPreviewMode(item.readingMode === 'scroll' ? 'scroll' : 'flip');
    setPreview(true);
  };
  const navigate = (x: string) => {
    setSection(x);
    setPreview(false);
    setMobileMenu(false);
  };
  const addQuote = () => {
    const id = 'hn' + Date.now();
    const q = createSampleDraft(id);
    setQuotes(list => [q, ...list]);
    setActive(id);
    setTab('details');
    navigate('editor');
    setToast('Nuevo borrador creado en este dispositivo');
  };
  const selectQuote = (id: string, target = 'editor') => {
    setActive(id);
    navigate(target);
  };

  const save = () => setToast(storageError
    ? 'No se pudo guardar en este navegador. Revisa el almacenamiento disponible.'
    : 'Borrador visual guardado en este navegador');
  const share = () =>
    setToast(
      'Demo visual: el envío real se activará cuando conectemos la nube.'
    );
  const updateStatus = (status: string) => {
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
  const filePicked = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) {
      setToast('Selecciona una fotografía');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') return;
      edit('cover', reader.result);
      setToast('Foto aplicada. Esta carga es solo visual.');
    };
    reader.readAsDataURL(f);
  };
  const btnQuote = (
    <button className="btn primary" onClick={addQuote}>
      <Plus size={16} /> Nueva cotización
    </button>
  );
  const sidebar = (
    <Sidebar pages={pages} quotes={quotes} navigate={navigate} section={section} />
  );
  const topbar = (
    <Topbar section={section} standalone={standalone} installApplication={installApplication} setMobileMenu={setMobileMenu} />
  );
  const home = (
    <HomeScreen
      quotes={quotes}
      btnQuote={btnQuote}
      addQuote={addQuote}
      navigate={navigate}
      selectQuote={selectQuote}
      statusClass={statusClass}
    />
  );
  const quotesView = (
    <QuotesScreen
      quotes={quotes}
      btnQuote={btnQuote}
      search={search}
      setSearch={setSearch}
      filter={filter}
      setFilter={setFilter}
      selectQuote={selectQuote}
      statusClass={statusClass}
    />
  );
  const editor = (
    <QuoteEditorScreen
      item={item}
      tab={tab}
      setTab={setTab}
      styleName={styleName}
      edit={edit}
      setPreviewMode={setPreviewMode}
      openClientPreview={openClientPreview}
      save={save}
      filePicked={filePicked}
      mobilePreview={mobilePreview}
      setMobilePreview={setMobilePreview}
      share={share}
    />
  );
  const messagesView = (
    <MessagesScreen
      quotes={quotes}
      item={item}
      active={active}
      setActive={setActive}
      newMessage={newMessage}
      setNewMessage={setNewMessage}
      sendAdmin={sendAdmin}
    />
  );
  const clientPage = (
    <ClientPage
      item={item}
      styleName={styleName}
      setPreview={setPreview}
      clientMessage={clientMessage}
      setClientMessage={setClientMessage}
      sendClient={sendClient}
      viewAccept={viewAccept}
      setViewAccept={setViewAccept}
      updateStatus={updateStatus}
    />
  );
  if (preview)
    return (
      <>
        <header className="hn-demo-switch">
          <button type="button" className="hn-demo-back" onClick={() => setPreview(false)}>
            <ChevronLeft size={18} /> Volver al diseñador
          </button>
          <div className="hn-demo-switcher" role="group" aria-label="Modo de lectura de la cotización">
            <button type="button" className={previewMode === 'flip' ? 'active' : ''} onClick={() => setPreviewMode('flip')}>
              <BookOpen size={15} /> Revista 3D
            </button>
            <button type="button" className={previewMode === 'scroll' ? 'active' : ''} onClick={() => setPreviewMode('scroll')}>
              <FileText size={15} /> Scroll
            </button>
          </div>
        </header>
        {previewMode === 'flip' ? <div className={'hn-style-' + styleName}><FlipMagazine item={item} /></div> : clientPage}
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
            <button type="button" className="menu-close" aria-label="Cerrar menú" onClick={() => setMobileMenu(false)}>
              <X />
            </button>
          </div>
          <button
            className="overlay-close"
            aria-label="Cerrar menú"
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
      {installationGuide}
    </div>
  );
}
export default App;
