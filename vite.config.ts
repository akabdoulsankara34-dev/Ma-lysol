import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, type Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const pwaManifest = {
  id: '/',
  name: 'BizPilot Burkina - Caisse & Gestion Commerciale',
  short_name: 'BizPilot BF',
  description:
    'Logiciel de gestion de point de vente, stocks, caisse, crédits clients et facturation avec mode hors-ligne pour commerces au Burkina Faso.',
  theme_color: '#163B65',
  background_color: '#0f172a',
  display: 'standalone' as const,
  display_override: ['standalone', 'minimal-ui'] as ('standalone' | 'minimal-ui')[],
  prefer_related_applications: false,
  start_url: '/',
  scope: '/',
  lang: 'fr',
  orientation: 'any' as const,
  categories: ['business', 'finance', 'productivity'],
  icons: [
    {
      src: '/pwa-192x192.png',
      sizes: '192x192',
      type: 'image/png',
      purpose: 'any',
    },
    {
      src: '/pwa-512x512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'any',
    },
    {
      src: '/pwa-maskable-512x512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'maskable',
    },
  ],
};

function devPwaFallbackPlugin(): Plugin {
  return {
    name: 'bizpilot-dev-pwa-fallback',
    apply: 'serve',
    transformIndexHtml(html) {
      if (html.includes('manifest.webmanifest')) return html;
      return html.replace('</head>', '  <link rel="manifest" href="/manifest.webmanifest" />\n  </head>');
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const cleanUrl = (req.url || '').split('?')[0];
        if (cleanUrl === '/manifest.webmanifest') {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
          res.setHeader('Cache-Control', 'no-cache');
          res.end(JSON.stringify(pwaManifest));
          return;
        }
        if (cleanUrl === '/@vite-plugin-pwa/pwa-entry-point-loaded') {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
          res.end('export default function registerDevSW() {}');
          return;
        }
        if (cleanUrl === '/dev-sw.js') {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
          res.setHeader('Service-Worker-Allowed', '/');
          res.setHeader('Cache-Control', 'no-cache');
          res.end(`
            self.addEventListener('install', () => self.skipWaiting());
            self.addEventListener('activate', (event) => {
              event.waitUntil(
                caches.keys()
                  .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
                  .then(() => self.registration.unregister())
                  .then(() => self.clients.claim())
              );
            });
          `);
          return;
        }
        if (cleanUrl === '/sw.js') {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
          res.setHeader('Service-Worker-Allowed', '/');
          res.setHeader('Cache-Control', 'no-cache');
          res.end(`
            const DEV_SHELL_CACHE = 'bizpilot-dev-shell-v1';
            self.addEventListener('install', (event) => {
              event.waitUntil(
                caches.open(DEV_SHELL_CACHE)
                  .then((cache) => cache.add('/').catch(() => null))
                  .then(() => self.skipWaiting())
              );
            });
            self.addEventListener('activate', (event) => {
              event.waitUntil(
                caches.keys()
                  .then((keys) => Promise.all(
                    keys
                      .filter((k) => k.includes('workbox-precache') || (k.startsWith('bizpilot-dev-shell-') && k !== DEV_SHELL_CACHE))
                      .map((k) => caches.delete(k))
                  ))
                  .then(() => self.clients.claim())
              );
            });
            self.addEventListener('fetch', (event) => {
              if (event.request.mode !== 'navigate') return;
              event.respondWith(
                fetch(event.request)
                  .then((response) => {
                    if (response && response.ok) {
                      const copy = response.clone();
                      caches.open(DEV_SHELL_CACHE).then((cache) => cache.put('/', copy)).catch(() => null);
                    }
                    return response;
                  })
                  .catch(() => caches.match('/'))
              );
            });
          `);
          return;
        }
        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      devPwaFallbackPlugin(),
      VitePWA({
        base: '/',
        scope: '/',
        manifestFilename: 'manifest.webmanifest',
        registerType: 'autoUpdate',
        // Les icônes et assets de public/ sont déjà inclus par workbox.globPatterns ; éviter les doublons de précache
        includeAssets: [],
        manifest: pwaManifest,
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
          globIgnores: ['pwa-192x192.png', 'pwa-512x512.png', 'pwa-maskable-512x512.png'],
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true,
          navigateFallback: 'index.html',
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
          navigateFallbackDenylist: [
            /^\/api/,
            /firestore\.googleapis\.com/,
            /identitytoolkit\.googleapis\.com/,
          ],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
        devOptions: {
          // Disabled in dev because devPwaFallbackPlugin serves /manifest.webmanifest and /sw.js cleanly without import.meta.hot.send
          enabled: false,
        },
      }),
    ],
    resolve: {
      dedupe: ['react', 'react-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime'],
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-dom/client',
        'react/jsx-runtime',
        'react/jsx-dev-runtime'
      ],
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
