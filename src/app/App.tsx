import { useEffect, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { useAppHistory } from './useAppHistory';
import type { AppSection, EditorTab, ReadingView } from './native-navigation';
import type { Quote } from '../features/quotes/types';
import FlipMagazine from '../features/magazine/FlipMagazine';
import { editorialStyles } from '../features/editor/styles/EditorialStyles';
import { createQuoteDraft, editSampleQuote, statusClass } from '../features/quotes/model';
import { useQuoteStore } from '../features/quotes/useQuoteStore';
import { useDeviceAccess } from '../features/auth/useDeviceAccess';
import DeviceGate from '../features/auth/DeviceGate';
import { useMediaLibrary } from '../features/photos/useMediaLibrary';
import MediaLibraryScreen from '../features/videos/MediaLibraryScreen';
import { useTrash } from '../features/trash/useTrash';
import TrashScreen from '../features/trash/TrashScreen';
import HomeScreen from '../features/home/HomeScreen';
import MessagesScreen from '../features/messages/MessagesScreen';
import ClientPage from '../features/client/ClientPage';
import QuoteEditorScreen from '../features/editor/QuoteEditorScreen';
import type { PhotoTarget } from '../features/editor/shared/editor-types';
import { CAROLINA_MAX_SLOTS } from '../features/templates/carolina-layout';
import { getDesignLayout } from '../features/templates/design-layout';
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
  Copy,
  Share2,
  Trash2,
} from 'lucide-react';

const pages = [
  { id: 'home', label: 'Inicio', icon: LayoutDashboard },
  { id: 'quotes', label: 'Cotizaciones', icon: FileText },
  { id: 'editor', label: 'Diseñador', icon: Palette },
  { id: 'messages', label: 'Mensajes', icon: MessageCircle },
  { id: 'photos', label: 'Fotos', icon: Images },
  { id: 'trash', label: 'Papelera', icon: Trash2 },
];
function App() {
  const auth = useDeviceAccess();
  const enabled = auth.status === 'authorized';
  const { quotes, setQuotes, syncStatus, flush, refresh: refreshQuotes } = useQuoteStore(enabled);
  const { photos, bytesUsed, uploadPhotos, uploading, uploadProgress, trashing, trashPhotos, refreshPhotos, error: mediaError } = useMediaLibrary(enabled);
  const { view, routeTo, goBack } = useAppHistory(quotes[0]?.id || 'empty');
  const { section, active, tab, mobileMenu, preview, previewMode, installGuide, photoViewerId, photoSelecting } = view;
  const trash = useTrash(enabled && section === 'trash');
  const setTab: Dispatch<SetStateAction<string>> = change => {
    const next = typeof change === 'function' ? change(tab) : change;
    if (['details', 'styles', 'design', 'publish'].includes(next)) routeTo({ tab: next as EditorTab });
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
  const [inviteUrl, setInviteUrl] = useState('');
  const [inviteBusy, setInviteBusy] = useState(false);
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
    const next = { section: target, preview: false, mobileMenu: false, installGuide: false,
      photoViewerId: null, photoSelecting: false };
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
    const q = createQuoteDraft(id);
    setQuotes(list => [q, ...list]);
    setNewMessage('');
    setClientMessage('');
    routeTo({ active: id, tab: 'details', section: 'editor', preview: false, mobileMenu: false });
    setToast('Cotización creada. Guardando en Cloudflare...');
  };
  const moveQuoteToTrash = async (id: string) => {
    const quote = quotes.find(q => q.id === id);
    if (!quote || !window.confirm('¿Enviar a Papelera la cotización de ' + quote.name +
      '?\nPodrás restaurarla después.')) return;
    if (!await flush()) { setToast('No se pudo sincronizar. Comprueba la conexión.'); return; }
    try {
      const response = await fetch('/api/quotes/' + encodeURIComponent(id), {
        method: 'DELETE', credentials: 'same-origin',
      });
      if (!response.ok) throw new Error('No se pudo mover la cotización.');
      await refreshQuotes();
      setToast('Cotización enviada a Papelera.');
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'No se pudo mover la cotización.');
    }
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
  const uploadDesignPhoto = async (file: File, target: PhotoTarget): Promise<void> => {
    const quoteId = item?.id;
    if (!quoteId) throw new Error('Selecciona una cotización.');
    const result = await uploadPhotos([file]);
    const saved = result.uploaded[0];
    if (!saved) throw new Error('No se pudo guardar la fotografía en R2.');
    setQuotes(current => current.map(quote => {
      if (quote.id !== quoteId) return quote;
      if (target === 'cover') return { ...quote, cover: saved.url, coverVideo: '' };
      if (typeof target === 'string' && target.startsWith('extra:')) {
        const id=target.slice(6);
        const previous=getDesignLayout(quote)?.extraPhotos || [];
        if (!previous.some(photo=>photo.id===id)) return quote;
        return { ...quote, designLayout: { ...getDesignLayout(quote),
          extraPhotos: previous.map(photo=>photo.id===id ? {...photo,url:saved.url} : photo),
        } };
      }
      if (typeof target !== 'number') return quote;
      const gallery = Array.from({ length: CAROLINA_MAX_SLOTS }, (_, i) => quote.gallery?.[i] || '');
      gallery[target] = saved.url;
      return { ...quote, gallery };
    }));
    setToast('Fotografía guardada y aplicada a su recuadro.');
  };
  const btnQuote = (
    <button className="btn primary" onClick={addQuote}>
      <Plus size={16} /> Nueva cotización
    </button>
  );
  const invitePhone = async () => {
    if (inviteBusy) return;
    setInviteBusy(true);
    try {
      setInviteUrl(await auth.invite());
      if (mobileMenu) goBack();
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'No se pudo generar la invitación.');
    } finally {
      setInviteBusy(false);
    }
  };
  const copyInvite = () => {
    void navigator.clipboard.writeText(inviteUrl)
      .then(() => setToast('Enlace copiado. Envíalo a tu otro teléfono.'))
      .catch(() => setToast('Selecciona el enlace y cópialo para compartirlo.'));
  };
  const shareInvite = () => {
    if (!navigator.share) { copyInvite(); return; }
    void navigator.share({ title: 'Vincular HAVANA NICE Quotes Studio', url: inviteUrl })
      .catch(() => undefined);
  };
  const sidebar = (
    <Sidebar pages={pages} quotes={quotes} navigate={navigate} section={section}
      onInvite={() => void invitePhone()} />
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
      moveToTrash={id => void moveQuoteToTrash(id)}
    />
  );
  const editor = item ? (
    <QuoteEditorScreen
      item={item}
      tab={tab}
      setTab={setTab}
      styleName={styleName}
      edit={edit}
      openClientPreview={openClientPreview}
      save={save}
      onUploadPhoto={uploadDesignPhoto}
      cloudPhotos={photos}
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
    <MediaLibraryScreen enabled={enabled} photos={photos} bytesUsed={bytesUsed} uploading={uploading} uploadProgress={uploadProgress}
      trashing={trashing} trashPhotos={trashPhotos} refreshQuotes={refreshQuotes}
      error={mediaError} uploadPhotos={uploadPhotos} refreshPhotos={refreshPhotos}
      viewerId={photoViewerId} selectionMode={photoSelecting}
      openViewer={id => routeTo({ photoViewerId: id })}
      changeViewer={id => routeTo({ photoViewerId: id }, 'replace')}
      closeViewer={goBack}
      startSelection={() => routeTo({ photoSelecting: true })}
      exitSelection={goBack} />
  );
  const trashView = (
    <TrashScreen items={trash.items} busy={trash.busy} error={trash.error}
      refresh={trash.refreshTrash} restore={trash.restoreItem} purge={trash.purgeItem}
      refreshQuotes={refreshQuotes} refreshPhotos={refreshPhotos}/>
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
    <DeviceGate checking={auth.status === 'checking'} error={auth.error} />
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
        {section === 'trash' && trashView}
      </div>
      <div className="mobile-bottom">
        {pages.filter(p => p.id !== 'trash').map(p => (
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
      {inviteUrl && (
        <div className="hn-device-modal-backdrop" onClick={() => setInviteUrl('')}>
          <section className="hn-device-modal" role="dialog" aria-modal="true" aria-label="Vincular otro teléfono"
            onClick={event => event.stopPropagation()}>
            <button className="hn-device-modal-close" type="button" aria-label="Cerrar" onClick={() => setInviteUrl('')}>
              <X size={19}/>
            </button>
            <span className="eyebrow">HAVANA NICE · TUS DISPOSITIVOS</span>
            <h2>Vincular otro teléfono</h2>
            <p>Abre este enlace desde el teléfono que quieras agregar. Se autoriza una sola vez y después podrás entrar directamente, sin contraseña.</p>
            <input value={inviteUrl} aria-label="Enlace privado para otro dispositivo" readOnly
              onFocus={event => event.currentTarget.select()}/>
            <div className="hn-device-modal-actions">
              <button className="btn outline" type="button" onClick={copyInvite}><Copy size={16}/> Copiar enlace</button>
              <button className="btn primary" type="button" onClick={shareInvite}><Share2 size={16}/> Compartir</button>
            </div>
            <small>El enlace caduca en 20 minutos, funciona una sola vez y no debe compartirse con otras personas.</small>
          </section>
        </div>
      )}
    </div>
  );
}
export default App;
