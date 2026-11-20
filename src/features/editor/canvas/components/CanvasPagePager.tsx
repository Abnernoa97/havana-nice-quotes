import { ChevronLeft, ChevronRight, Copy, Trash2, Palette, Check, Layers } from 'lucide-react';
import type {PagePaperTone} from '../../../templates/carolina-layout';
type Props={
 pageIndex:number;totalPages:number;canDuplicate:boolean;
 onChangePage:(direction:-1|1)=>void;onDuplicatePage:()=>void;onDeletePage:()=>void;
 paperTone:PagePaperTone|undefined;paperMenuOpen:boolean;
 onTogglePaper:()=>void;onChoosePaper:(tone:PagePaperTone)=>void;onApplyPaperAll:()=>void;
};
/** The compact Fondo menu belongs to a page, not to a separate editor. */
export default function CanvasPagePager({pageIndex,totalPages,canDuplicate,
 onChangePage,onDuplicatePage,onDeletePage,paperTone,paperMenuOpen,
 onTogglePaper,onChoosePaper,onApplyPaperAll}:Props){
 return <div className="hn-canvas-pager" role="group" aria-label="Navegación y acciones de páginas">
   <button type="button" disabled={pageIndex<=0} aria-label="Página anterior"
     onClick={()=>onChangePage(-1)}><ChevronLeft size={18}/></button>
   <span>{pageIndex+1} / {totalPages}</span>
   <button type="button" disabled={pageIndex>=totalPages-1} aria-label="Página siguiente"
     onClick={()=>onChangePage(1)}><ChevronRight size={18}/></button>
   <div className="hn-canvas-paper-wrap">
     <button type="button" className="hn-canvas-paper-toggle" onClick={onTogglePaper}
       aria-expanded={paperMenuOpen} aria-controls="hn-canvas-paper-menu"
       aria-label="Cambiar fondo de esta hoja"><Palette size={16}/> Fondo</button>
     {paperMenuOpen&&<div className="hn-canvas-paper-menu" id="hn-canvas-paper-menu"
       role="group" aria-label="Fondo de la hoja">
       <small>Fondo de esta hoja</small>
       <div className="hn-canvas-paper-choices">
         {(['white','beige'] as const).map(tone=>
           <button key={tone} type="button" className="hn-canvas-paper-choice"
             aria-pressed={paperTone===tone}
             onClick={()=>onChoosePaper(tone)}>
             <span className={'hn-canvas-paper-swatch '+tone}/>
             {tone==='white'?'Blanco':'Beige'}
             {paperTone===tone&&<Check size={14}/>}
           </button>)}
       </div>
       <button type="button" className="hn-canvas-paper-all"
         disabled={!paperTone||totalPages<=1} onClick={onApplyPaperAll}>
         <Layers size={15}/> Aplicar a todas las hojas
       </button>
     </div>}
   </div>
   <button type="button" onClick={onDuplicatePage} disabled={!canDuplicate}
     title={canDuplicate?'Duplicar página':'Solo se duplican páginas propias'}
     aria-label="Duplicar página"><Copy size={17}/></button>
   <button type="button" onClick={onDeletePage} disabled={totalPages<=1}
     title="Eliminar página" aria-label="Eliminar página"><Trash2 size={17}/></button>
 </div>;
}
