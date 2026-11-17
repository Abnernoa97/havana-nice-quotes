import {Film, Images, HardDrive, RotateCw} from 'lucide-react';
import {formatMediaBytes} from '../media/formatMediaBytes';

type Props={photoCount:number;videoCount:number;photoBytes:number;videoBytes:number;refresh:()=>void;busy:boolean};
/** One summary for both tabs; figures come only from existing media indexes. */
export default function MediaLibraryStats({photoCount,videoCount,photoBytes,videoBytes,refresh,busy}:Props){
 const total=photoBytes+videoBytes;
 const capacity=5*1024*1024*1024;
 const percent=Math.min(100,Math.max(0,total/capacity*100));
 return <section id="hn-media-stats" className="hn-media-stats" aria-label="Uso de biblioteca">
  <div className="hn-media-stats-line"><Images size={18}/><strong>{photoCount}</strong><span>Fotografías</span><small>{formatMediaBytes(photoBytes)}</small></div>
  <div className="hn-media-stats-line"><Film size={18}/><strong>{videoCount}</strong><span>Videos</span><small>{formatMediaBytes(videoBytes)}</small></div>
  <div className="hn-media-stats-capacity">
   <div><HardDrive size={17}/><strong>Total: {formatMediaBytes(total)}</strong><span>de 5 GB</span></div>
   <div className="hn-media-stats-track" role="progressbar" aria-label="Uso del almacenamiento de referencia"
      aria-valuenow={Math.min(capacity,total)} aria-valuemin={0} aria-valuemax={capacity}>
    <span style={{width:percent+'%'}}/>
   </div>
   <small>Fotos y videos guardados en esta biblioteca</small>
  </div>
  <button type="button" className="hn-media-stats-update" onClick={refresh} disabled={busy}><RotateCw size={15}/> Actualizar</button>
 </section>;
}
