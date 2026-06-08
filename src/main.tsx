// src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './App.css'
import { authStorage } from './lib/authStorage.ts';

// Validate storage before rendering app
authStorage.validateOnStartup();

// 🔥 SERVICE WORKER CLEANUP - LESS AGGRESSIVE
// Problem: Service workers cache everything and prevent online reconnection
// Solution: Unregister service workers + clear caches, but DON'T force reload
(async () => {
  // Step 1: Unregister ALL service workers (NON-BLOCKING)
  if ('serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      if (registrations.length > 0) {
        console.log(`🔥 Found ${registrations.length} service worker(s) - unregistering...`);
        await Promise.all(registrations.map(reg => reg.unregister()));
        console.log('✅ All service workers unregistered');
      }
    } catch (error) {
      console.error('Error unregistering service workers:', error);
    }
  }

  // Step 2: Delete ALL caches (NON-BLOCKING)
  if ('caches' in window) {
    try {
      const cacheNames = await caches.keys();
      if (cacheNames.length > 0) {
        console.log(`🔥 Found ${cacheNames.length} cache(s) - deleting...`);
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        console.log('✅ All caches deleted');
      }
    } catch (error) {
      console.error('Error deleting caches:', error);
    }
  }

  console.log('🌐 Running as pure web app (no PWA/offline features)');

  // Step 3: Render app
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
})();