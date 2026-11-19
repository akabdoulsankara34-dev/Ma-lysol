import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';
import './hooks/usePWAInstall';

// Enregistre le Service Worker PWA (Workbox via vite-plugin-pwa) en production et en aperçu
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  registerSW({
    immediate: true,
    onRegisteredSW(_swUrl, registration) {
      if (registration) {
        registration.update().catch(() => null);
      }
    },
    onRegisterError(error) {
      console.warn('[PWA] Enregistrement Service Worker :', error);
    },
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
