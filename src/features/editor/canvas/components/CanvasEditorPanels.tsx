import { createPortal } from 'react-dom';
import TextStyleDock from '../../texts/TextStyleDock';
import PhotoLayersPanel from '../../photos/PhotoLayersPanel';
import PhotoSourcePicker from '../../photos/PhotoSourcePicker';
import PhotoEditingWorkspace from '../../photos/PhotoEditingWorkspace';
import { listPhotoLayers } from '../../photos/photo-layers';
import type { Quote } from '../../../quotes/types';
import type { CloudPhoto } from '../../../photos/useMediaLibrary';
import { isBlankPage, CAROLINA_PAGE_TITLES } from '../../../templates/carolina-layout';
import type { CarolinaPageId } from '../../../templates/carolina-layout';
import { pageBackgroundMediaId } from '../../../templates/page-background';
import { canvasPhotoUrl } from '../media/canvasPhotoUrl';
import type { useCanvasSelectionState } from '../hooks/useCanvasSelectionState';
import type { createCanvasPhotoActions } from '../media/createCanvasPhotoActions';
import type { createCanvasTextStyleActions } from '../interactions/createCanvasTextStyleActions';

type Selection=ReturnType<typeof useCanvasSelectionState>;
type MediaActions=ReturnType<typeof createCanvasPhotoActions>;
type TextActions=ReturnType<typeof createCanvasTextStyleActions>;
type Props={
  item:Quote;photos:CloudPhoto[];page:CarolinaPageId;pageIndex:number;
  selection:Selection;mediaActions:MediaActions;textActions:TextActions;
  removePhoto:(id:string)=>void;
};
const pageTitle=(page:number,index:number)=>isBlankPage(page)
  ?'Página '+(index+1):CAROLINA_PAGE_TITLES[page as 0|1|2]||'Página '+(index+1);
/** Only text and media overlays; all controls operate on the parent canvas session. */
export default function CanvasEditorPanels({
  item,photos,page,pageIndex,selection,mediaActions,textActions,removePhoto,
}:Props){
  const {lastTextId,target,selectedPhotoId,editingId,transformingId,
    photoAspect,photoTool,photoLayersOpen,bank,busy,error,clearSelection,
    setActiveTextTool,setEditingId,setTransformingId,setTrashHovered,
    setPhotoLayersOpen,setSelectedPhotoId,setPhotoTool,setBank}=selection;
  const {chooseFont,changeTextStyle}=textActions;
  const {selectPhoto,movePhotoLayer,updatePhotoStyle,replacePhoto,
    close,selectPhone,choose,chooseVideo}=mediaActions;
  const photoLayers=listPhotoLayers(item,page);
  const pageBackgroundId=pageBackgroundMediaId(item.designLayout,page);
  return (
    <>
      {lastTextId && target===null && !selectedPhotoId && (
        <TextStyleDock textId={lastTextId}
          fontId={item.designLayout?.fonts?.[lastTextId] || item.designLayout?.defaultFont}
          style={item.designLayout?.textStyles?.[lastTextId]}
          onFontChange={chooseFont} onStyleChange={changeTextStyle}
          onToolChange={tool=>{
            setActiveTextTool(tool);
            if(tool){
              if(editingId&&document.activeElement instanceof HTMLElement)
                document.activeElement.blur();
              setEditingId(null);setTransformingId(null);setTrashHovered(false);
            }
          }}
          onClose={()=>{
            if (editingId && document.activeElement instanceof HTMLElement) document.activeElement.blur();
            clearSelection();
          }}/>
      )}
      {selectedPhotoId && !transformingId && !editingId && target===null &&
        createPortal(
          <PhotoEditingWorkspace photoId={selectedPhotoId}
            aspect={photoAspect} pageName={pageTitle(page,pageIndex)} activeTool={photoTool}
            url={canvasPhotoUrl(item,selectedPhotoId)}
            style={item.designLayout?.photoStyles?.[selectedPhotoId]}
            isPageBackground={selectedPhotoId==='photo-extra:'+pageBackgroundId}
            layersPanel={<PhotoLayersPanel layers={photoLayers} open={photoLayersOpen}
              onToggle={()=>setPhotoLayersOpen(value=>!value)}
              onEdit={selectPhoto} onMove={movePhotoLayer} onDelete={removePhoto}/>}
            onStyleChange={updatePhotoStyle} onReplace={replacePhoto}
            onToolChange={setPhotoTool}
            onClose={()=>{setSelectedPhotoId(null);setPhotoTool(null);setPhotoLayersOpen(false);}}/>,
          document.body
        )}
      {error && !target && <p className="hn-canvas-error" role="alert">{error}</p>}
      {target !== null && createPortal(
        <PhotoSourcePicker target={target} item={item} photos={photos}
          bank={bank} busy={busy} error={error} onClose={close}
          onToggleBank={()=>setBank(v=>!v)} onPhoneFile={file=>{void selectPhone(file);}}
          onChoose={choose} onChooseVideo={chooseVideo}/>,document.body
      )}
    </>
  );
}
