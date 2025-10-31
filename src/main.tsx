// src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './App.css'
import { authStorage } from './lib/authStorage.ts';

// Validate storage before rendering app
authStorage.validateOnStartup();

// 🔥 AGGRESSIVE SERVICE WORKER CLEANUP
// Problem: Service workers cache everything and prevent online reconnection
// Solution: Unregister ALL service workers + clear ALL caches + FORCE RELOAD
(async () => {
  let needsReload = false;

  // Step 1: Unregister ALL service workers (BLOCKING)
  if ('serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      if (registrations.length > 0) {
        console.log(`🔥 Found ${registrations.length} service worker(s) - unregistering...`);
        await Promise.all(registrations.map(reg => reg.unregister()));
        console.log('✅ All service workers unregistered');
        needsReload = true;
      }
    } catch (error) {
      console.error('Error unregistering service workers:', error);
    }
  }

  // Step 2: Delete ALL caches (BLOCKING)
  if ('caches' in window) {
    try {
      const cacheNames = await caches.keys();
      if (cacheNames.length > 0) {
        console.log(`🔥 Found ${cacheNames.length} cache(s) - deleting...`);
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        console.log('✅ All caches deleted');
        needsReload = true;
      }
    } catch (error) {
      console.error('Error deleting caches:', error);
    }
  }

  // Step 3: FORCE RELOAD if cleanup happened (only once)
  if (needsReload && !sessionStorage.getItem('sw_cleaned')) {
    console.log('🔄 Service worker cleaned - reloading to ensure fresh start...');
    sessionStorage.setItem('sw_cleaned', 'true');
    window.location.reload();
    return; // Stop here, reload will start fresh
  }

  // Step 4: Clear the reload flag if we made it here
  sessionStorage.removeItem('sw_cleaned');

  console.log('🌐 Running as pure web app (no PWA/offline features)');

  // Step 5: Render app
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
})();