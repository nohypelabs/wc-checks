// src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './App.css'
import { authStorage } from './lib/authStorage.ts';

// Validate storage before rendering app
authStorage.validateOnStartup();

// 🔥 PWA REMOVED: No service worker, no offline mode, no caching
// Pure web app - requires internet connection
console.log('🌐 Running as normal web app (no PWA/offline features)');

// Clean up any existing service workers from previous versions
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => {
      registration.unregister();
      console.log('🗑️ Unregistered old service worker');
    });
  });
}

// Clear any old caches
if ('caches' in window) {
  caches.keys().then((cacheNames) => {
    cacheNames.forEach((cacheName) => {
      caches.delete(cacheName);
      console.log(`🗑️ Deleted cache: ${cacheName}`);
    });
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);