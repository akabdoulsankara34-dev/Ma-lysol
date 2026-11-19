import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';
import './hooks/usePWAInstall';

// Enregistre le Service Worker PWA en production (Workbox) et purge tout ancien dev-sw.js en développement
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  if (import.meta.env.PROD) {
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
  } else {
    window.addEventListener('load', async () => {
      try {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(
          regs
            .filter((r) => {
              const scriptUrl = r.active?.scriptURL || r.waiting?.scriptURL || r.installing?.scriptURL || '';
              return scriptUrl.includes('dev-sw.js');
            })
            .map((r) => r.unregister())
        );
        if ('caches' in window) {
          const keys = await caches.keys();
          await Promise.all(
            keys.filter((k) => k.includes('workbox-precache')).map((k) => caches.delete(k))
          );
        }
        await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      } catch {
        // Non-blocking in restricted iframe contexts
      }
    });
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
