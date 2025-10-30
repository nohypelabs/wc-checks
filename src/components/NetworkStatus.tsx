// src/components/NetworkStatus.tsx
import { useState, useEffect } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';

/**
 * Network Status Component
 * Shows a blocking overlay when user is offline
 * App REQUIRES network for auth, upload, and database
 */
export const NetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      console.log('✅ Network: ONLINE');
      setIsOnline(true);

      // If was offline, reload page to clear any stale state
      if (wasOffline) {
        console.log('🔄 Was offline, reloading page...');
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    };

    const handleOffline = () => {
      console.log('❌ Network: OFFLINE');
      setIsOnline(false);
      setWasOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check immediately on mount
    if (!navigator.onLine) {
      handleOffline();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [wasOffline]);

  // Don't render anything if online
  if (isOnline) return null;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 to-gray-800 z-[9999] flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        {/* Offline Icon */}
        <div className="bg-red-500/20 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
          <WifiOff className="w-12 h-12 text-red-500" strokeWidth={2} />
        </div>

        {/* Message */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-3">
            No Internet Connection
          </h1>
          <p className="text-gray-300 text-lg mb-6 leading-relaxed">
            This app requires an internet connection to function.
            Please check your connection and try again.
          </p>

          {/* Connection Details */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6">
            <div className="flex items-start gap-3 text-left">
              <div className="bg-red-500/20 rounded-lg p-2 flex-shrink-0">
                <WifiOff className="w-5 h-5 text-red-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-semibold mb-2">
                  Why do I need internet?
                </h3>
                <ul className="text-gray-300 text-sm space-y-1.5">
                  <li>• Authentication & login</li>
                  <li>• Photo uploads to cloud</li>
                  <li>• Database synchronization</li>
                  <li>• Real-time inspection data</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Troubleshooting */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 mb-6 text-left">
            <p className="text-gray-300 text-sm font-medium mb-2">
              💡 Troubleshooting:
            </p>
            <ul className="text-gray-400 text-xs space-y-1">
              <li>• Check if WiFi or mobile data is enabled</li>
              <li>• Try toggling airplane mode off</li>
              <li>• Move to an area with better signal</li>
              <li>• Restart your device if issue persists</li>
            </ul>
          </div>

          {/* Auto-retry indicator */}
          {wasOffline && (
            <div className="flex items-center justify-center gap-2 text-green-400">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span className="text-sm font-medium">
                Connection restored! Reloading...
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-gray-500 text-xs">
            WC Check requires network access at all times
          </p>
        </div>
      </div>
    </div>
  );
};
