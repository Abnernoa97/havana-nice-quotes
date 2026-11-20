import { ChevronLeft, ChevronRight, Copy, Trash2 } from 'lucide-react';
type Props = {
 pageIndex:number;totalPages:number;canDuplicate:boolean;
 onChangePage:(direction:-1|1)=>void;onDuplicatePage:()=>void;onDeletePage:()=>void;
};
/** Only UI controls; navigation and saving are owned by the page actions hook. */
export default function CanvasPagePager({pageIndex,totalPages,canDuplicate,onChangePage,onDuplicatePage,onDeletePage}:Props){
 return (
      <div className="hn-canvas-pager" role="group" aria-label="Navegación y acciones de páginas">
        <button type="button" disabled={pageIndex<=0} aria-label="Página anterior"
          onClick={()=>onChangePage(-1)}><ChevronLeft size={18}/></button>
        <span>{pageIndex+1} / {totalPages}</span>
        <button type="button" disabled={pageIndex>=totalPages-1} aria-label="Página siguiente"
          onClick={()=>onChangePage(1)}><ChevronRight size={18}/></button>
        <button type="button" onClick={onDuplicatePage} disabled={!canDuplicate}
          title={canDuplicate?'Duplicar página':'Solo se duplican páginas propias'}
          aria-label="Duplicar página"><Copy size={17}/></button>
        <button type="button" onClick={onDeletePage} disabled={totalPages<=1}
          title="Eliminar página" aria-label="Eliminar página"><Trash2 size={17}/></button>
      </div>
 );
}
