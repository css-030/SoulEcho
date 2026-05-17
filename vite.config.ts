import { fileURLToPath, URL } from 'node:url'

import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'icons/icon.svg',
        'icons/icon-maskable.svg',
        'icons/icon-192.png',
        'icons/icon-512.png',
        'icons/icon-maskable-512.png'
      ],
      devOptions: {
        enabled: true
      },
      manifest: {
        name: 'SoulEcho',
        short_name: 'SoulEcho',
        description: 'AI emotion companion and healing music PWA',
        theme_color: '#f9a8d4',
        background_color: '#fef3f8',
        display: 'standalone',
        start_url: '/',
        launch_handler: {
          client_mode: 'navigate-existing'
        },
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === 'image' || request.destination === 'font',
            handler: 'CacheFirst',
            options: {
              cacheName: 'static-assets',
              expiration: {
                maxEntries: 80,
                maxAgeSeconds: 60 * 60 * 24 * 30
              }
            }
          },
          {
            urlPattern: ({ url }) => url.hostname.includes('api.openai.com'),
            handler: 'NetworkOnly'
          },
          {
            urlPattern: ({ url }) => url.hostname === 'localhost' && url.port === '3000',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'netease-api',
              networkTimeoutSeconds: 4,
              expiration: {
                maxEntries: 40,
                maxAgeSeconds: 60 * 5
              }
            }
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  test: {
    environment: 'jsdom'
  }
})
