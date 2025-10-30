// vite.config.ts - FIXED: Proper env handling
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // DISABLED: Offline mode - app needs to be online for login, upload, database
      workbox: {
        // Only cache fonts, not the app itself
        globPatterns: [],
        // Network-first strategy: Always try online, only cache fonts
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
            },
          },
          // Network-first for everything else (always online)
          {
            urlPattern: /.*/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'runtime-cache',
              networkTimeoutSeconds: 3,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 5, // 5 minutes only
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