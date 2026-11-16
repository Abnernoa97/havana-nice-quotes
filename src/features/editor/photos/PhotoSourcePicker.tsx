import { Check, Images, Smartphone, X } from 'lucide-react';
import type { Quote } from '../../quotes/types';
import type { CloudPhoto } from '../../photos/useMediaLibrary';
import type { PhotoTarget } from '../shared/editor-types';
import './photo-source-picker.css';

type Props = {
  target:PhotoTarget;item:Quote;photos:CloudPhoto[];busy:boolean;bank:boolean;error:string;
  onClose:()=>void;onToggleBank:()=>void;
  onPhoneFile:(file?:File)=>void;onChoose:(url:string)=>void;
};
export default function PhotoSourcePicker({
  target,item,photos,busy,bank,error,onClose,onToggleBank,onPhoneFile,onChoose,
}:Props){
  return <div className="hn-canvas-shade" onClick={event=>{
      if(event.target===event.currentTarget)onClose();
    }}>
    <div className="hn-canvas-picker" role="dialog" aria-modal="true"
      aria-label={target==='cover'?'Foto de portada':typeof target==='string'?'Foto adicional':'Foto '+(target+1)}>
      <header><strong>{target==='cover'?'Foto de portada':typeof target==='string'?'Foto adicional':'Foto '+(target+1)}</strong>
        <button type="button" disabled={busy} aria-label="Cerrar" onClick={onClose}><X size={19}/></button>
      </header>
      <div className="hn-canvas-sources">
        <label className="hn-canvas-source"><Smartphone size={21}/> Mi teléfono
          <input type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif"
            disabled={busy} onChange={e=>{
              const file=e.target.files?.[0];e.target.value='';onPhoneFile(file);
            }}/>
        </label>
        <button type="button" className={bank?'hn-canvas-source selected':'hn-canvas-source'}
          disabled={busy} onClick={onToggleBank}><Images size={21}/> Banco de fotos</button>
      </div>
      {bank && <div className="hn-canvas-bank">
        {photos.map(photo=><button type="button" key={photo.id} disabled={busy}
          aria-label={'Elegir '+photo.name} onClick={()=>onChoose(photo.url)}>
          <img src={photo.url} alt="" loading="lazy"/>
          {(target==='cover'?item.cover===photo.url:
            typeof target==='string'?item.carolinaLayout?.extraPhotos?.some(extra=>
              extra.id===target.slice(6)&&extra.url===photo.url):
            (item.gallery||[])[target]===photo.url)&&<Check size={16}/>}
        </button>)}
        {!photos.length&&<p>Tu banco está vacío.</p>}
        <button type="button" className="hn-canvas-remove" disabled={busy}
          onClick={()=>onChoose('')}>Quitar fotografía</button>
      </div>}
      {busy&&<p className="hn-canvas-message" role="status">Subiendo fotografía...</p>}
      {error&&<p className="hn-canvas-error" role="alert">{error}</p>}
    </div>
  </div>;
}
