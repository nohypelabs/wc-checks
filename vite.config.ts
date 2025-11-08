// vite.config.ts - Pure web app, no PWA
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    // 🔥 PWA REMOVED: No service worker, no offline mode, no caching
    // Pure web app - requires internet connection
  ],

  server: {
    port: 5174,
    host: true,
    // Proxy API calls to Vercel dev server
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },

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

          // PDF Generation
          if (id.includes('jspdf')) {
            return 'pdf-vendor';
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

  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      'date-fns',
      'lucide-react',
      '@supabase/supabase-js',
      'jspdf',
      'jspdf-autotable',
    ],
  },
}));