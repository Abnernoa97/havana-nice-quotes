import { Plus, MessageCircle, FileText, MapPin, Images } from 'lucide-react';
import type { PageKind } from '../../../templates/carolina-layout';
type Props={
  onAddText:()=>void;onAddPhoto:()=>void;addPhotoDisabled:boolean;
  onTogglePageMenu:()=>void;pageMenuVisible:boolean;
  onAddPage:(kind?:PageKind)=>void;transformingId:string|null;
};
export default function CanvasPageToolbar({onAddText,onAddPhoto,addPhotoDisabled,onTogglePageMenu,pageMenuVisible,onAddPage,transformingId}:Props){
  return (
      <div className="hn-canvas-toolbar">
        <button type="button" onClick={onAddText}>+ Texto</button>
        <button type="button" onClick={onAddPhoto}
          disabled={addPhotoDisabled}>+ Foto</button>
        <div className="hn-page-kind-wrap">
          <button type="button" onClick={onTogglePageMenu}
            className="hn-canvas-add-page" aria-expanded={pageMenuVisible}
            aria-controls="hn-page-kind-menu"
            aria-label="Elegir tipo de página"><Plus size={17}/> Página</button>
          {pageMenuVisible&&<div className="hn-page-kind-menu" id="hn-page-kind-menu"
            role="group" aria-label="Tipos de página">
            <button type="button" onClick={()=>onAddPage()}>
              <FileText size={18}/> Página en blanco</button>
            <button type="button" onClick={()=>onAddPage('chat')}>
              <MessageCircle size={18}/> Página chat</button>
            <button type="button" disabled title="Próximamente">
              <FileText size={18}/> Información <small>Próximamente</small></button>
            <button type="button" disabled title="Próximamente">
              <MapPin size={18}/> Localización <small>Próximamente</small></button>
            <button type="button" disabled title="Próximamente">
              <Images size={18}/> Álbum <small>Próximamente</small></button>
          </div>}
        </div>
        {transformingId && <span>Un dedo: mover · Dos dedos: ampliar · Giro deliberado</span>}
      </div>
  );
}
