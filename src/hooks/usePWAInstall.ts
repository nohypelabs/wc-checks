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
    // Check if prompt was already shown
    const promptShown = localStorage.getItem('pwa-install-prompt-shown');
    if (promptShown === 'true') {
      setHasShownPrompt(true);
    }

    // Listen for beforeinstallprompt event
    const handler = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();

      // Stash the event so it can be triggered later
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstallable(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
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
