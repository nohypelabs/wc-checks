// src/main.tsx - NO PWA (just a normal web app)
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './App.css'
import { authStorage } from './lib/authStorage.ts';

// 🚨 VERSION CHECK: Force hard reload if version changed
const APP_VERSION = '3.0.0'; // NO MORE PWA! Just normal web app
const STORAGE_KEY = 'app_version';

const checkVersionAndClearCache = async () => {
  const storedVersion = localStorage.getItem(STORAGE_KEY);

  if (storedVersion !== APP_VERSION) {
    console.log(`🔄 Version changed: ${storedVersion} → ${APP_VERSION}`);
    console.log('🗑️ Clearing all caches and forcing reload...');

    // ✅ Preserve ALL Supabase auth keys (DON'T DELETE AUTH!)
    const authKeys = Object.keys(localStorage).filter(key =>
      key.startsWith('supabase.auth') ||
      key.startsWith('sb-')
    );
    const authBackup = new Map<string, string>();
    authKeys.forEach(key => {
      const value = localStorage.getItem(key);
      if (value) authBackup.set(key, value);
    });

    console.log(`💾 Backed up ${authBackup.size} auth keys:`, Array.from(authBackup.keys()));

    // Clear localStorage
    localStorage.clear();

    // ✅ Restore auth keys
    authBackup.forEach((value, key) => {
      localStorage.setItem(key, value);
    });

    console.log('✅ Auth keys restored');

    // Clear sessionStorage
    sessionStorage.clear();

    // Unregister all service workers
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
        console.log('  ✅ Unregistered old service worker');
      }
    }

    // Clear all caches
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      console.log('  ✅ Cleared all caches');
    }

    // Update version
    localStorage.setItem(STORAGE_KEY, APP_VERSION);

    // Force hard reload (bypasses cache)
    console.log('🔄 Forcing hard reload...');
    window.location.reload();
    return true; // Prevent further execution
  }

  return false; // Continue normal startup
};

// Run version check and app initialization
(async () => {
  const shouldReload = await checkVersionAndClearCache();
  if (shouldReload) {
    // Stop here, page will reload
    return;
  }

  // Validate storage before rendering app
  authStorage.validateOnStartup();

  // ❌ NO MORE PWA/SERVICE WORKER!
  // Just a normal web app that requires internet
  console.log('🌐 Running as normal web app (no PWA/offline features)');

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
})();