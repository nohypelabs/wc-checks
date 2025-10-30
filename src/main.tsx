// src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './App.css'
import { authStorage } from './lib/authStorage.ts';
import { registerServiceWorker, initInstallPrompt } from './lib/pwa.ts';

// 🚨 VERSION CHECK: Force hard reload if version changed
const APP_VERSION = '2.3.0'; // Increment this to force cache clear
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

  // Register PWA service worker - WITH EMERGENCY DISABLE
  // Add ?disable-sw to URL to disable service worker
  const urlParams = new URLSearchParams(window.location.search);
  const disableSW = urlParams.get('disable-sw') === 'true';

  if (disableSW) {
    console.log('🛑 Service worker disabled via URL parameter');
    // Unregister all service workers
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => registration.unregister());
      });
    }
    sessionStorage.clear(); // Clear any stuck states
  } else if (import.meta.env.PROD) {
    registerServiceWorker();
    initInstallPrompt();
    console.log('🚀 PWA features enabled (honest messaging)');
  } else {
    console.log('⚠️ PWA features disabled in development mode');
  }

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
})();