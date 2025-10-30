// vite.config.ts - FIXED: Proper env handling
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // OPTIMIZED: Aggressive caching for static assets, network-first for API
      workbox: {
        // Cache all static assets (JS, CSS)
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],

        runtimeCaching: [
          // 1. Static JS/CSS files - CacheFirst (long cache, save bandwidth)
          {
            urlPattern: /\.(?:js|css)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'static-assets',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },

          // 2. Google Fonts - CacheFirst (1 year)
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
            },
          },

          // 3. Font files - CacheFirst (1 year)
          {
            urlPattern: /\.(?:woff|woff2|ttf|otf|eot)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'fonts-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
            },
          },

          // 4. Images (local) - CacheFirst (30 days)
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },

          // 5. Cloudinary images - StaleWhileRevalidate (show cached, update in background)
          {
            urlPattern: /^https:\/\/res\.cloudinary\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'cloudinary-images',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },

          // 6. Supabase API - NetworkFirst (always try fresh, fallback to cache)
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 5,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 5, // 5 minutes
              },
            },
          },

          // 7. Everything else - NetworkFirst (minimal cache)
          {
            urlPattern: /.*/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'runtime-cache',
              networkTimeoutSeconds: 3,
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 2, // 2 minutes
              },
            },
          },
        ],
      },
      // Keep manifest for PWA installability
      manifest: {
        name: 'WC Check - Toilet Monitoring System',
        short_name: 'WC Check',
        description: 'Professional toilet monitoring and inspection system',
        theme_color: '#2563eb',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],

  build: {
    // Increased limit: React is inherently large, 782KB is acceptable for main vendor
    chunkSizeWarningLimit: 1000,
    
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // React ecosystem
          if (id.includes('react') || id.includes('react-dom')) {
            return 'react-vendor';
          }
          if (id.includes('react-router')) {
            return 'router-vendor';
          }
          
          // Supabase
          if (id.includes('@supabase') || id.includes('gotrue')) {
            return 'supabase-vendor';
          }
          
          // React Query
          if (id.includes('@tanstack/react-query')) {
            return 'query-vendor';
          }
          
          // UI Libraries
          if (id.includes('lucide-react')) {
            return 'icons-vendor';
          }
          if (id.includes('sonner') || id.includes('react-hot-toast')) {
            return 'toast-vendor';
          }
          if (id.includes('framer-motion')) {
            return 'animation-vendor';
          }
          
          // Date & Time
          if (id.includes('date-fns')) {
            return 'date-vendor';
          }
          
          // QR Code
          if (id.includes('html5-qrcode') || id.includes('qrcode')) {
            return 'qr-vendor';
          }
          
          // Admin pages
          if (id.includes('pages/admin')) {
            return 'admin';
          }
          
          // Reports & Analytics
          if (id.includes('pages/ReportsPage') || id.includes('pages/AnalyticsPage')) {
            return 'reports';
          }
          
          // Inspection form
          if (id.includes('pages/InspectionPage') || id.includes('ComprehensiveInspectionForm')) {
            return 'inspection';
          }
          
          // Other vendors
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
        
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: mode === 'production', // FIXED: Use mode parameter
        drop_debugger: true,
      },
    },
    
    sourcemap: false,
  },

  server: {
    port: 5174,
    host: true,
  },

  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      'date-fns',
      'lucide-react',
      '@supabase/supabase-js',
    ],
  },
}));