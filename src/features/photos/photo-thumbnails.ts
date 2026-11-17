/** Private, one-time photo thumbnail generation; originals are never replaced. */
const W=480,H=360,QUALITY=.78,MAX_BYTES=256*1024;
const processed=new Set<string>();
let queue=Promise.resolve();

export async function thumbnailFromImage(image:CanvasImageSource,width:number,height:number):Promise<Blob|null>{
 if(!width||!height)return null;
 const canvas=document.createElement('canvas');
 canvas.width=W;canvas.height=H;
 const ctx=canvas.getContext('2d',{alpha:false});
 if(!ctx)return null;
 const ratio=Math.max(W/width,H/height);
 const srcW=W/ratio,srcH=H/ratio;
 try{ctx.drawImage(image,(width-srcW)/2,(height-srcH)/2,srcW,srcH,0,0,W,H);}
 catch{return null;}
 return new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',QUALITY));
}
export async function thumbnailFromFile(file:File):Promise<Blob|null>{
 if(typeof createImageBitmap==='function'){
  try{
   const bitmap=await createImageBitmap(file);
   try{return await thumbnailFromImage(bitmap,bitmap.width,bitmap.height);}
   finally{bitmap.close();}
  }catch{/* fallback to image element for formats supported by the browser */}
 }
 const url=URL.createObjectURL(file);
 const img=new Image();
 try{
  img.src=url;
  await img.decode();
  return thumbnailFromImage(img,img.naturalWidth,img.naturalHeight);
 }catch{return null;}
 finally{URL.revokeObjectURL(url);}
}
export async function savePhotoThumbnail(id:string,blob:Blob):Promise<boolean>{
 if(!/^[a-f0-9-]{36}$/.test(id)||!blob.size||blob.size>MAX_BYTES)return false;
 const response=await fetch('/api/media/'+id+'/thumbnail',{
  method:'PUT',credentials:'same-origin',
  headers:{'Content-Type':'image/jpeg'},body:blob,
 });
 if(response.ok)processed.add(id);
 return response.ok;
}
/** Existing photos are backfilled on the first visible full-image load, sequentially. */
export function queuePhotoThumbnail(id:string,img:HTMLImageElement):void{
 if(processed.has(id))return;
 // Capture the pixels before the React element is recycled by scrolling.
 const task=thumbnailFromImage(img,img.naturalWidth,img.naturalHeight);
 processed.add(id);
 queue=queue.then(async()=>{
  const blob=await task;
  if(!blob||!(await savePhotoThumbnail(id,blob)))processed.delete(id);
 }).catch(()=>{processed.delete(id);});
}
