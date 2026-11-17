import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './app/App';
import './shared/styles/index.css';
import './shared/styles/studio-experience.css';
import './features/auth/device-access.css';
import './features/photos/photo-bank.css';

// Android's contextual Translate/Copy popup must not attach to non-editable
// design/3D text. Native text fields keep their normal caret and keyboard.
const appRoot=document.getElementById('root');
const nativeEditable=(target:EventTarget|null):boolean=>
  target instanceof Element && Boolean(target.closest(
    'input,textarea,[contenteditable="true"],[contenteditable="plaintext-only"]'));
appRoot?.addEventListener('selectstart',event=>{
  if(!nativeEditable(event.target))event.preventDefault();
},true);
appRoot?.addEventListener('contextmenu',event=>{
  if(!nativeEditable(event.target) ||
    event.target instanceof Element && event.target.closest('.hn-carolina-text-node.editing'))
    event.preventDefault();
},true);
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(error => {
      console.warn('PWA service worker registration was not available', error);
    });
  });
}
