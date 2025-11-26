// src/hooks/usePWAInstall.ts
import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const usePWAInstall = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [hasShownPrompt, setHasShownPrompt] = useState(false);

  useEffect(() => {
    // Check if already installed (running as PWA)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInWebAppiOS = (window.navigator as any).standalone === true;
    const isInstalled = isStandalone || isInWebAppiOS;

    if (isInstalled) {
      // App is already installed, don't show prompt
      setIsInstallable(false);
      setHasShownPrompt(true);
      localStorage.setItem('pwa-install-prompt-shown', 'true');
      localStorage.setItem('pwa-installed', 'true');
      return;
    }

    // Check if prompt was already shown or app was installed
    const promptShown = localStorage.getItem('pwa-install-prompt-shown');
    const wasInstalled = localStorage.getItem('pwa-installed');

    if (promptShown === 'true' || wasInstalled === 'true') {
      setHasShownPrompt(true);
      setIsInstallable(false);
      return;
    }

    // Listen for beforeinstallprompt event
    const handler = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();

      // Stash the event so it can be triggered later
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    // Listen for app installed event
    const appInstalledHandler = () => {
      setIsInstallable(false);
      setHasShownPrompt(true);
      localStorage.setItem('pwa-install-prompt-shown', 'true');
      localStorage.setItem('pwa-installed', 'true');
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', appInstalledHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', appInstalledHandler);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) {
      return false;
    }

    // Show the install prompt
    await deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;

    // Clear the deferredPrompt for next time
    setDeferredPrompt(null);
    setIsInstallable(false);

    // Mark prompt as shown
    localStorage.setItem('pwa-install-prompt-shown', 'true');
    setHasShownPrompt(true);

    return outcome === 'accepted';
  };

  const dismiss = () => {
    // Mark prompt as shown so it doesn't appear again
    localStorage.setItem('pwa-install-prompt-shown', 'true');
    setHasShownPrompt(true);
    setIsInstallable(false);
  };

  return {
    isInstallable,
    hasShownPrompt,
    install,
    dismiss,
  };
};
