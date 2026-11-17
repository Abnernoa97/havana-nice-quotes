export function formatMediaBytes(bytes:number):string{
 const safe=Math.max(0,bytes);
 if(safe>=1024*1024*1024)return (safe/(1024*1024*1024)).toFixed(2)+' GB';
 if(safe>=1024*1024)return (safe/(1024*1024)).toFixed(1)+' MB';
 if(safe>=1024)return (safe/1024).toFixed(0)+' KB';
 return safe+' B';
}
