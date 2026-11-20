import { useEffect, useRef, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { Quote } from '../../../quotes/types';
import type { PhotoTarget } from '../../shared/editor-types';
import type { TextToolTab } from '../../texts/TextStyleDock';
import { carolinaPageOrder } from '../../../templates/carolina-layout';
import type { CarolinaPageId } from '../../../templates/carolina-layout';

/** The single transient UI state for one canvas session; quote data stays in designLayout. */
export function useCanvasSelectionState(
  item: Quote, setPage: Dispatch<SetStateAction<CarolinaPageId>>,
) {
  const [target, setTarget] = useState<PhotoTarget | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  // New text lives only in local React state until the user actually writes it.
  const [draftText, setDraftText] = useState<{id:string;page:CarolinaPageId}|null>(null);
  const newlyConfirmedText=useRef<{id:string;page:CarolinaPageId;text:string;centered:true}|null>(null);
  const lastGestureMoveAt=useRef(0);
  const justMoved=useRef(false);
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  const [photoTool, setPhotoTool] = useState<'crop'|'vignette'|null>(null);
  const [photoAspect, setPhotoAspect] = useState(3/4);
  const [photoLayersOpen, setPhotoLayersOpen] = useState(false);
  const [lastTextId, setLastTextId] = useState<string | null>(null);
  const [activeTextTool,setActiveTextTool]=useState<TextToolTab|null>(null);
  const [showPageMenu,setShowPageMenu]=useState(false);
  const [trashHovered, setTrashHovered] = useState(false);
  const [transformingId, setTransformingId] = useState<string | null>(null);
  const [bank, setBank] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    setPage(carolinaPageOrder(item.designLayout)[0]); setTarget(null); setBank(false); setEditingId(null); setTransformingId(null);
    setLastTextId(null); setActiveTextTool(null); setSelectedPhotoId(null); setPhotoTool(null); setPhotoLayersOpen(false); setTrashHovered(false); setDraftText(null); setShowPageMenu(false);
  }, [item.id, item.style]);
  const clearSelection=()=>{
    setDraftText(null);setPhotoLayersOpen(false);setTransformingId(null);setEditingId(null);
    setLastTextId(null);setActiveTextTool(null);setSelectedPhotoId(null);setPhotoTool(null);setTrashHovered(false);
  };
  return {
    target,setTarget,editingId,setEditingId,draftText,setDraftText,newlyConfirmedText,
    lastGestureMoveAt,justMoved,selectedPhotoId,setSelectedPhotoId,photoTool,setPhotoTool,photoAspect,
    setPhotoAspect,photoLayersOpen,setPhotoLayersOpen,lastTextId,setLastTextId,activeTextTool,setActiveTextTool,
    showPageMenu,setShowPageMenu,trashHovered,setTrashHovered,transformingId,setTransformingId,bank,
    setBank,busy,setBusy,error,setError,clearSelection,
  };
}
