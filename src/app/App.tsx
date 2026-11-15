import { useEffect, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { useAppHistory } from './useAppHistory';
import type { AppSection, EditorTab, ReadingView } from './native-navigation';
import type { ChangeEvent } from 'react';
import type { Quote } from '../features/quotes/types';
import FlipMagazine from '../features/magazine/FlipMagazine';
import { editorialStyles } from '../features/editor/styles/EditorialStyles';
import { createSampleDraft, editSampleQuote, statusClass } from '../features/quotes/model';
import { useQuoteStore } from '../features/quotes/useQuoteStore';
import { useCloudAuth } from '../features/auth/useCloudAuth';
import CloudLogin from '../features/auth/CloudLogin';
import { useMediaLibrary } from '../features/photos/useMediaLibrary';
import PhotoBank from '../features/photos/PhotoBank';
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
  Images,
  Plus,
  X,
  ChevronLeft,
} from 'lucide-react';

const pages = [
  { id: 'home', label: 'Inicio', icon: LayoutDashboard },
  { id: 'quotes', label: 'Cotizaciones', icon: FileText },
  { id: 'editor', label: 'Diseñador', icon: Palette },
  { id: 'messages', label: 'Mensajes', icon: MessageCircle },
  { id: 'photos', label: 'Fotos', icon: Images },
];
function App() {
  const auth = useCloudAuth();
  const enabled = auth.status === 'authenticated';
  const { quotes, setQuotes, storageError, syncStatus, flush } = useQuoteStore(enabled);
  const { photos, brandPhotos, bytesUsed, uploadPhoto, uploading, refreshPhotos, error: mediaError } = useMediaLibrary(enabled);
  const { view, routeTo, goBack } = useAppHistory(quotes[0]?.id || 'empty');
  const { section, active, tab, mobileMenu, preview, previewMode, mobilePreview, installGuide } = view;
  const setTab: Dispatch<SetStateAction<string>> = change => {
    const next = typeof change === 'function' ? change(tab) : change;
    if (['details', 'styles', 'design', 'pricing'].includes(next)) routeTo({ tab: next as EditorTab });
  };
  const setMobilePreview: Dispatch<SetStateAction<boolean>> = change => {
    const next = typeof change === 'function' ? change(mobilePreview) : change;
    routeTo({ mobilePreview: next });
  };
  const setPreviewMode: Dispatch<SetStateAction<string>> = change => {
    const next = typeof change === 'function' ? change(previewMode) : change;
    if (next === 'flip' || next === 'scroll') routeTo({ previewMode: next as ReadingView }, 'replace');
  };
  const setMobileMenu: Dispatch<SetStateAction<boolean>> = change => {
    const next = typeof change === 'function' ? change(mobileMenu) : change;
    if (next && !mobileMenu) routeTo({ mobileMenu: true });
    else if (!next && mobileMenu) goBack();
  };
  const [toast, setToast] = useState('');
  const [filter, setFilter] = useState('Todas');
  const [search, setSearch] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [clientMessage, setClientMessage] = useState('');
  const { standalone, installApplication } = useInstallPrompt(() => routeTo({ installGuide: true }));
  const installationGuide = installGuide ? (
    <InstallGuide onClose={goBack} />
  ) : null;

  const item = quotes.find(q => q.id === active) || quotes[0];
  const styleName = item?.style && editorialStyles.some(s => s.id === item.style) ? item.style : 'libre';
  useEffect(() => {
    if (enabled && syncStatus !== 'loading' && quotes.length && !quotes.some(q => q.id === active)) {
      routeTo({ active: quotes[0].id }, 'replace');
    }
  }, [enabled, syncStatus, quotes, active, routeTo]);
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(''), 3600);
      return () => clearTimeout(t);
    }
  }, [toast]);
  const edit = (key: keyof Quote, value: Quote[keyof Quote]) =>
    setQuotes(list => editSampleQuote(list, active, key, value));
  const openClientPreview = () => {
    routeTo({
      previewMode: item?.readingMode === 'scroll' ? 'scroll' : 'flip',
      preview: true,
      mobileMenu: false,
    });
  };
  const navigate = (x: string) => {
    const target = (pages.some(page => page.id === x) ? x : 'home') as AppSection;
    const next = { section: target, preview: false, mobileMenu: false, installGuide: false };
    if (mobileMenu) {
      // Replace drawer entry so native Back goes to the preceding section, not an open drawer.
      if (section === target && !preview) goBack();
      else routeTo(next, 'replace');
    } else routeTo(next);
  };
  // No arrastrar mensajes sin enviar de una pareja a otra.
  const activateQuote = (id: string) => {
    if (id === active) return;
    setNewMessage('');
    setClientMessage('');
    routeTo({ active: id });
  };
  const addQuote = () => {
    const id = 'hn-' + crypto.randomUUID();
    const q = createSampleDraft(id);
    setQuotes(list => [q, ...list]);
    setNewMessage('');
    setClientMessage('');
    routeTo({ active: id, tab: 'details', section: 'editor', preview: false, mobileMenu: false });
    setToast('Cotización creada. Guardando en Cloudflare...');
  };
  const selectQuote = (id: string, target = 'editor') => {
    if (id !== active) {
      setNewMessage('');
      setClientMessage('');
    }
    routeTo({
      active: id,
      section: (pages.some(page => page.id === target) ? target : 'editor') as AppSection,
      preview: false,
      mobileMenu: false,
    });
  };

  const save = () => {
    void flush().then(ok => setToast(ok
      ? 'Cotización guardada y sincronizada en Cloudflare'
      : 'No se pudo guardar ahora. Tus cambios siguen abiertos; comprueba la conexión.'));
  };
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
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    void uploadPhoto(file).then(photo => {
      edit('cover', photo.url);
      setToast('Fotografía subida a R2 y seleccionada como portada.');
    }).catch(error => setToast(error instanceof Error ? error.message : 'Error al subir la foto.'));
  };
  const btnQuote = (
    <button className="btn primary" onClick={addQuote}>
      <Plus size={16} /> Nueva cotización
    </button>
  );
  const sidebar = (
    <Sidebar pages={pages} quotes={quotes} navigate={navigate} section={section} onLogout={() => void auth.logout()} />
  );
  const topbar = (
    <Topbar section={section} standalone={standalone} installApplication={installApplication} setMobileMenu={setMobileMenu} syncStatus={syncStatus} />
  );
  const home = (
    <HomeScreen
      quotes={quotes}
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
  const editor = item ? (
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
      cloudPhotos={[...photos, ...brandPhotos]}
      onOpenBank={() => navigate('photos')}
    />
  ) : (
    <div className="page hn-cloud-empty">
      <h1>Tus cotizaciones empiezan aquí.</h1>
      <p>Todavía no hay propuestas guardadas en la nube.</p>
      <button className="btn primary" onClick={addQuote}><Plus size={17}/> Nueva cotización</button>
    </div>
  );
  const messagesView = item ? (
    <MessagesScreen
      quotes={quotes}
      item={item}
      active={active}
      setActive={activateQuote}
      newMessage={newMessage}
      setNewMessage={setNewMessage}
      sendAdmin={sendAdmin}
    />
  ) : (
    <div className="page hn-cloud-empty"><h1>Mensajes</h1><p>Aún no hay cotizaciones ni conversaciones.</p></div>
  );
  const clientPage = item ? (
    <ClientPage
      item={item}
      styleName={styleName}
      clientMessage={clientMessage}
      setClientMessage={setClientMessage}
      sendClient={sendClient}
      updateStatus={updateStatus}
    />
  ) : null;
  const photoView = (
    <PhotoBank photos={photos} brandPhotos={brandPhotos} bytesUsed={bytesUsed} uploading={uploading}
      error={mediaError} uploadPhoto={uploadPhoto} refreshPhotos={refreshPhotos}
      canUsePhoto={!!item} onUsePhoto={url => {
        if (!item) return;
        edit('cover', url);
        routeTo({ section: 'editor', tab: 'design' });
        setToast('Fotografía de HAVANA NICE v2 aplicada como portada.');
      }}/>
  );
  useEffect(() => {
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && (installGuide || mobileMenu || preview)) {
        event.preventDefault();
        goBack();
      }
    };
    window.addEventListener('keydown', onEscape);
    return () => window.removeEventListener('keydown', onEscape);
  }, [installGuide, mobileMenu, preview, goBack]);

  if (!enabled) return (
    <CloudLogin checking={auth.status === 'checking'} error={auth.error} login={auth.login} />
  );
  if (syncStatus === 'loading') return (
    <div className="hn-cloud-loading" role="status">Conectando tus cotizaciones con Cloudflare...</div>
  );
  if (preview && item)
    return (
      <>
        <header className="hn-demo-switch">
          <button type="button" className="hn-demo-back" onClick={goBack}>
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
        {section === 'photos' && photoView}
        <div className="footer-demo">
          <span>HAVANA NICE Quotes Studio · Cloudflare D1 + R2</span>
          <span>{storageError ? 'Sincronización pendiente · Comprueba la conexión' : 'Datos protegidos y sincronizados en la nube'}</span>
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
