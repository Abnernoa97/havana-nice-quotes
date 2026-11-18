import { useEffect, useRef, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { useAppHistory } from './useAppHistory';
import type { AppSection, EditorTab, ReadingView } from './native-navigation';
import type { Quote, QuoteStatus } from '../features/quotes/types';
import QuoteReviewPage from '../features/quotes/QuoteReviewPage';
import { editorialStyles } from '../features/editor/styles/EditorialStyles';
import { createQuoteDraft, createOwnTemplate, duplicateQuote, editSampleQuote, quoteDisplayName, statusClass } from '../features/quotes/model';
import { useQuoteStore } from '../features/quotes/useQuoteStore';
import { useDeviceAccess } from '../features/auth/useDeviceAccess';
import DeviceGate from '../features/auth/DeviceGate';
import { useMediaLibrary } from '../features/photos/useMediaLibrary';
import MediaLibraryScreen from '../features/videos/MediaLibraryScreen';
import { useTrash } from '../features/trash/useTrash';
import TrashScreen from '../features/trash/TrashScreen';
import HomeScreen from '../features/home/HomeScreen';
import MessagesScreen from '../features/messages/MessagesScreen';
import {useLiveInbox} from '../features/messages/useLiveInbox';
import ClientPage from '../features/client/ClientPage';
import QuoteEditorScreen from '../features/editor/QuoteEditorScreen';
import QuoteSaveDialog from '../features/editor/QuoteSaveDialog';
import { Sidebar, Topbar } from './WorkspaceChrome';
import { useInstallPrompt } from '../features/pwa/useInstallPrompt';
import InstallGuide from '../features/pwa/InstallGuide';
import QuotesScreen from '../features/quotes/QuotesScreen';
import {useShareAnalytics} from '../features/quotes/useShareAnalytics';
import {
  LayoutDashboard,
  FileText,
  Palette,
  MessageCircle,
  Images,
  Plus,
  X,
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
  const inbox=useLiveInbox(enabled);
  const { photos, bytesUsed, uploadPhotos, uploading, uploadProgress, trashing, trashPhotos, refreshPhotos, error: mediaError } = useMediaLibrary(enabled);
  const { view, routeTo, goBack } = useAppHistory('empty');
  const { section, active, tab, mobileMenu, preview, previewMode, installGuide, photoViewerId, photoSelecting } = view;
  const trash = useTrash(enabled && section === 'trash');
  const shareCounts=useShareAnalytics(enabled&&section==='quotes');
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
  const [messageTarget,setMessageTarget]=useState<string|null>(null);
  useEffect(()=>{const incoming=(e:Event)=>{const d=(e as CustomEvent<{title:string;kind:string}>).detail;
    if(d?.title)setToast((d.kind==='audio'?'Nueva nota de voz: ':'Nuevo mensaje: ')+d.title);};
    window.addEventListener('hn-quotes-incoming-message',incoming);
    return ()=>window.removeEventListener('hn-quotes-incoming-message',incoming);},[]);
  const [inviteUrl, setInviteUrl] = useState(''); const [inviteBusy, setInviteBusy] = useState(false);
  const [filter, setFilter] = useState('Todas');
  // New quotations are private editor work until an explicit named Save.
  // A saved reusable template remains separate from quotations.
  const [workingQuote,setWorkingQuote]=useState<Quote|null>(null);
  const [saveDialogOpen,setSaveDialogOpen]=useState(false);
  const [saveBusy,setSaveBusy]=useState(false);
  // Reuse this ID when a template-derived quote is retried after a sync failure.
  const templateQuoteSave=useRef<{sourceId:string;quoteId:string}|null>(null);
  const closedAfterSave=useRef(new Set<string>());
  const [search, setSearch] = useState(''); const [clientMessage, setClientMessage] = useState('');
  const { standalone, installApplication } = useInstallPrompt(() => routeTo({ installGuide: true }));
  const installationGuide = installGuide ? (
    <InstallGuide onClose={goBack} />
  ) : null;
  const clientQuotes = quotes.filter(quote => !quote.isTemplate);
  const ownTemplates = quotes.filter(quote => quote.isTemplate);
  const item = closedAfterSave.current.has(active) ? undefined :
    ((workingQuote?.id===active ? workingQuote : null) || quotes.find(q => q.id === active));
  const styleName = item?.style && editorialStyles.some(s => s.id === item.style) ? item.style : 'libre';
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(''), 3600);
      return () => clearTimeout(t);
    }
  }, [toast]);
  useEffect(()=>{
    const openInbox=(quoteId:string)=>{
      if(!/^hn-[a-f0-9-]{20,64}$/.test(quoteId))return;
      setMessageTarget(quoteId);
      routeTo({section:'messages',active:quoteId,preview:false,mobileMenu:false});
    };
    const incoming=(event:MessageEvent)=>{
      if(event.data?.type==='hn-quotes-open-messages'&&typeof event.data.quoteId==='string')
        openInbox(event.data.quoteId);
    };
    const fromHash=()=>{
      const match=window.location.hash.match(/^#inbox=(hn-[a-f0-9-]{20,64})$/);
      if(match){
        openInbox(match[1]);
        window.history.replaceState(window.history.state,'',window.location.pathname+window.location.search);
      }
    };
    navigator.serviceWorker?.addEventListener('message',incoming);
    window.addEventListener('hashchange',fromHash);
    fromHash();
    return ()=>{
      navigator.serviceWorker?.removeEventListener('message',incoming);
      window.removeEventListener('hashchange',fromHash);
    };
  },[routeTo]);
  const edit = (key: keyof Quote, value: Quote[keyof Quote]) => {
    if(workingQuote?.id===active){
      setWorkingQuote(current=>current?.id===active?{...current,[key]:value}:current);
      return;
    }
    setQuotes(list=>editSampleQuote(list,active,key,value));
  };
  const openClientPreview = () => {
    routeTo({
      previewMode: item?.readingMode === 'scroll' ? 'scroll' : 'flip',
      preview: true,
      mobileMenu: false,
    });
  };
  const navigate = (x: string) => {
    if(x==='messages')setMessageTarget(null);
    const target = (pages.some(page => page.id === x) ? x : 'home') as AppSection;
    const next = { section: target, preview: false, mobileMenu: false, installGuide: false,
      photoViewerId: null, photoSelecting: false };
    if (mobileMenu) {
      // Replace drawer entry so native Back goes to the preceding section, not an open drawer.
      if (section === target && !preview) goBack();
      else routeTo(next, 'replace');
    } else routeTo(next);
  };
  const addQuote = () => {
    const id='hn-'+crypto.randomUUID();
    templateQuoteSave.current=null;closedAfterSave.current.delete(id);
    setWorkingQuote(createQuoteDraft(id));
    setClientMessage('');setSaveDialogOpen(false);
    routeTo({active:id,tab:'styles',section:'editor',preview:false,mobileMenu:false});
    setToast('Propuesta nueva. Se guardará en Cotizaciones al elegir Guardar.');
  };
  const createTemplate = () => {
    const id='hn-'+crypto.randomUUID();
    templateQuoteSave.current=null;closedAfterSave.current.delete(id);
    setWorkingQuote(null);setSaveDialogOpen(false);
    setQuotes(list=>[createOwnTemplate(id),...list]);
    setClientMessage('');
    routeTo({active:id,tab:'design',section:'editor',preview:false,mobileMenu:false});
    setToast('Plantilla creada. Personalízala y pulsa Guardar.');
  };
  const reuseQuote = (sourceId:string,resetClient=false) => {
    const source=quotes.find(quote=>quote.id===sourceId);
    if(!source)return;
    const id='hn-'+crypto.randomUUID();
    const clone=duplicateQuote(source,id,resetClient);
    templateQuoteSave.current=null;closedAfterSave.current.delete(id);
    setWorkingQuote(clone);setSaveDialogOpen(false);
    setClientMessage('');
    routeTo({active:id,tab:'details',section:'editor',preview:false,mobileMenu:false});
    setToast('Propuesta creada desde el diseño original. No será cotización hasta que la guardes.');
  };
  const editOwnTemplate = (id:string) => {
    if(!ownTemplates.some(template=>template.id===id))return;
    templateQuoteSave.current=null;closedAfterSave.current.delete(id);
    setWorkingQuote(null);setSaveDialogOpen(false);
    routeTo({active:id,tab:'design',section:'editor',preview:false,mobileMenu:false});
  };
  const moveQuoteToTrash = async (id: string) => {
    const quote=quotes.find(q=>q.id===id);
    if(!quote)return;
    const label=quote.isTemplate?'plantilla «'+(quote.templateName?.trim()||'Mi plantilla')+'»':
      'cotización «'+quoteDisplayName(quote)+'»';
    if(!window.confirm('¿Enviar a Papelera la '+label+'?\nPodrás restaurarla después.'))return;
    if(!await flush()){setToast('No se pudo sincronizar. Comprueba la conexión.');return;}
    try {
      const response=await fetch('/api/quotes/'+encodeURIComponent(id),{
        method:'DELETE',credentials:'same-origin',
      });
      if(!response.ok)throw new Error('No se pudo mover el elemento a Papelera.');
      await refreshQuotes();
      if(active===id){setSaveDialogOpen(false);routeTo({section:'editor',tab:'styles',active:'empty'});}
      setToast(quote.isTemplate?'Plantilla enviada a Papelera.':'Cotización enviada a Papelera.');
    }catch(error){
      setToast(error instanceof Error?error.message:'No se pudo enviar a Papelera.');
    }
  };
  const selectQuote = (id: string, target = 'editor') => {
    closedAfterSave.current.delete(id);
    const selected=quotes.find(q=>q.id===id);
    const ready=Boolean(selected&&!selected.isTemplate&&
      ['Listo para enviar','Enviada','En revisión','Aceptada'].includes(selected.status));
    if (id !== active) {
            setClientMessage('');
    }
    routeTo({
      active: id,
      section: (pages.some(page => page.id === target) ? target : 'editor') as AppSection,
      preview: ready,
      previewMode:selected?.readingMode==='scroll'?'scroll':'flip',
      mobileMenu: false,
    });
  };
  const save=()=>{
    if(!item || saveBusy)return;
    // One visible Save action, always the same two-choice dialog.
    setSaveDialogOpen(true);
  };
  const saveNamedQuote=async(title:string,status:Extract<QuoteStatus,'Borrador'|'Listo para enviar'>)=>{
    if(!item||saveBusy)return;
    const cleanTitle=title.trim();
    if(!cleanTitle||cleanTitle.length>150)return;
    setSaveBusy(true);
    try {
      let saved:Quote;
      if(item.isTemplate){
        // Preserve the editable original template; a quotation has its own identity.
        let ids=templateQuoteSave.current;
        if(!ids||ids.sourceId!==item.id){
          ids={sourceId:item.id,quoteId:'hn-'+crypto.randomUUID()};
          templateQuoteSave.current=ids;
        }
        saved={...duplicateQuote(item,ids.quoteId,true),quoteTitle:cleanTitle,status};
        setQuotes(list=>[saved,...list.filter(q=>q.id!==saved.id)]);
      }else{
        saved={...item,quoteTitle:cleanTitle,status};
        if(workingQuote?.id===saved.id){
          // The first cloud write happens only at explicit named Save.
          setQuotes(list=>[saved,...list.filter(q=>q.id!==saved.id)]);
          // Keep the unsaved workspace mounted until Cloudflare confirms success.
        }else{
          setQuotes(list=>list.map(q=>q.id===saved.id?saved:q));
        }
      }
      const ok=await flush();
      if(ok){
        setSaveDialogOpen(false);
        templateQuoteSave.current=null;
        closedAfterSave.current.add(item.id);closedAfterSave.current.add(saved.id);
        setWorkingQuote(null);
        // Do not reopen the latest quotation or the template after a successful save.
        routeTo({active:'empty',section:'editor',tab:'styles',preview:false,mobileMenu:false},'replace');
        setToast(status==='Borrador'
          ? 'Cotización guardada en Borrador.'
          : 'Cotización guardada en Listo para enviar. No se envió al cliente.');
      }else{
        setToast('Sin sincronizar. La cotización sigue pendiente; comprueba la conexión.');
      }
    }finally{setSaveBusy(false);}
  };
  const updateStatus = (status: string) => {
    edit('status', status);
    setToast('Estado de demostración actualizado');
  };
  const sendClient = () => {
    if(!item)return;
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
  // Uploading is separate from inserting a canvas layer: cancellation leaves the sheet unchanged.
  const uploadDesignPhoto = async (file: File): Promise<string> => {
    const result = await uploadPhotos([file]);
    const saved = result.uploaded[0];
    if (!saved) throw new Error('No se pudo guardar la fotografía en R2.');
    setToast('Fotografía guardada en tu biblioteca.');
    return saved.url;
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
    <Sidebar pages={pages} navigate={navigate} section={section} unreadCount={inbox.unreadTotal}
      onInvite={() => void invitePhone()} />
  );
  const topbar = (
    <Topbar section={section} standalone={standalone} installApplication={installApplication} setMobileMenu={setMobileMenu} syncStatus={syncStatus} />
  );
  const home = (
    <HomeScreen
      quotes={clientQuotes}
      addQuote={addQuote}
      navigate={navigate}
      selectQuote={selectQuote}
      statusClass={statusClass}
    />
  );
  const quotesView = (
    <QuotesScreen
      quotes={clientQuotes} shareCounts={shareCounts}
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
      existingQuotes={clientQuotes} ownTemplates={ownTemplates}
      onCreateTemplate={createTemplate} onUseExisting={sourceId=>reuseQuote(sourceId,false)}
      onUseTemplate={sourceId=>reuseQuote(sourceId,true)} onEditOwnTemplate={editOwnTemplate}
      onDeleteOwnTemplate={id=>void moveQuoteToTrash(id)}
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
      <h1>Diseñador</h1>
      <p>Elige cómo empezar tu próxima propuesta.</p>
      <button className="btn primary" onClick={addQuote}><Plus size={17}/> Nueva cotización</button>
      <button className="btn" onClick={createTemplate}><Plus size={17}/> Crear plantilla</button>
    </div>
  );
  const messagesView = (
    <MessagesScreen conversations={inbox.conversations}
      unreadTotal={inbox.unreadTotal} loading={inbox.loading} error={inbox.error}
      permission={inbox.permission} askNotifications={inbox.askNotifications}
      refresh={inbox.refresh} openQuote={id=>selectQuote(id)}
      initialQuoteId={messageTarget||undefined}/>
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
  if(preview && item)return <QuoteReviewPage item={item} styleName={styleName}
    mode={previewMode} onMode={mode=>setPreviewMode(mode)} onBack={goBack}
    draftScroll={clientPage}
    onReadjust={()=>routeTo({active:item.id,section:'editor',tab:'design',preview:false,mobileMenu:false})}
    onMarkedSent={async()=>{await refreshQuotes();
      setToast('Enviada · Compartir registrado.');return true;}} toast={toast}/>;
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
            {p.id==='messages'&&inbox.unreadTotal>0&&
              <span className="hn-nav-unread" aria-label={inbox.unreadTotal+' mensajes nuevos'}>
                {inbox.unreadTotal>99?'99+':inbox.unreadTotal}</span>}
            <span>{p.label}</span>
          </button>
        ))}
      </div>
      {toast && <div className="toast">{toast}</div>}
      {saveDialogOpen && item && (
        <QuoteSaveDialog item={item} busy={saveBusy} onClose={()=>setSaveDialogOpen(false)}
          onSave={(title,status)=>{void saveNamedQuote(title,status);}}/>
      )}
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