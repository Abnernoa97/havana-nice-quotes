/* Minimal app shell, no quote data or personal content is cached by this worker. */
const CACHE = 'hn-quotes-app-shell-v2';
const SHELL = ['/', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('hn-quotes-app-shell-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;
  // Client links are private: never cache a quote URL or its personalized HTML.
  if (url.pathname.startsWith('/q/') || url.pathname.startsWith('/api/shared/')) return;
  if (req.mode === 'navigate') {
    event.respondWith(fetch(req).then(response => {
      if (response.ok) {
        const copy = response.clone();
        event.waitUntil(caches.open(CACHE).then(cache => cache.put('/', copy)));
      }
      return response;
    }).catch(() => caches.match('/')));
    return;
  }
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.open(CACHE).then(async cache => {
        const cached = await cache.match(req);
        if (cached) return cached;
        const response = await fetch(req);
        if (response.ok) event.waitUntil(cache.put(req, response.clone()));
        return response;
      })
    );
  }
});

/** Notification clicks focus the private studio and select the correct quote.
 * No data or message text is cached in the service worker. */
self.addEventListener('notificationclick',event=>{
  event.notification.close();
  const quoteId=event.notification.data?.quoteId;
  if(typeof quoteId!=='string'||!/^hn-[a-f0-9-]{20,64}$/.test(quoteId))return;
  event.waitUntil((async()=>{
    const tabs=await self.clients.matchAll({type:'window',includeUncontrolled:true});
    const existing=tabs.find(client=>{
      const uri=new URL(client.url);
      return uri.origin===self.location.origin&&!uri.pathname.startsWith('/q/');
    });
    if(existing){
      await existing.focus();
      existing.postMessage({type:'hn-quotes-open-messages',quoteId});
    }else{
      await self.clients.openWindow('/#inbox='+quoteId);
    }
  })());
});
