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
  const isHmrDisabled = process.env.DISABLE_HMR === 'true';
  return {
    name: 'bizpilot-dev-pwa-fallback',
    apply: 'serve',
    transformIndexHtml(html) {
      if (!isHmrDisabled || html.includes('manifest.webmanifest')) return html;
      return html.replace('</head>', '  <link rel="manifest" href="/manifest.webmanifest" />\n  </head>');
    },
    configureServer(server) {
      if (!isHmrDisabled) return;
      server.middlewares.use((req, res, next) => {
        const cleanUrl = (req.url || '').split('?')[0];
        if (cleanUrl === '/manifest.webmanifest') {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
          res.end(JSON.stringify(pwaManifest));
          return;
        }
        if (cleanUrl === '/sw.js') {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
          res.setHeader('Service-Worker-Allowed', '/');
          res.end(`
            self.addEventListener('install', () => self.skipWaiting());
            self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
            self.addEventListener('fetch', () => {});
          `);
          return;
        }
        next();
      });
    },
  };
}

export default defineConfig(() => {
  const isHmrDisabled = process.env.DISABLE_HMR === 'true';
  return {
    plugins: [
      react(),
      tailwindcss(),
      devPwaFallbackPlugin(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: [
          'icon.svg',
          'apple-touch-icon.png',
          'pwa-192x192.png',
          'pwa-512x512.png',
          'pwa-maskable-512x512.png',
        ],
        manifest: pwaManifest,
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
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
          // Disable VitePWA's HMR-dependent dev script when DISABLE_HMR=true to prevent @vite/client ws.send(undefined) crash
          enabled: !isHmrDisabled,
          type: 'module',
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
