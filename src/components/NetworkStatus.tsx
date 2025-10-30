// src/components/NetworkStatus.tsx - MOBILE OPTIMIZED
import { useState, useEffect, useRef } from 'react';
import { WifiOff, RefreshCw, AlertTriangle } from 'lucide-react';

/**
 * Network Status Component - MOBILE OPTIMIZED
 * Only shows when TRULY offline (actual network test, not navigator.onLine)
 * navigator.onLine is unreliable on mobile
 */
export const NetworkStatus = () => {
  const [isActuallyOffline, setIsActuallyOffline] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Test actual network connectivity (more reliable than navigator.onLine)
  const testNetworkConnectivity = async (): Promise<boolean> => {
    try {
      // Try to fetch a tiny resource with short timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout

      const response = await fetch('/favicon.ico', {
        method: 'HEAD',
        cache: 'no-cache',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch {
      // Network error or timeout
      return false;
    }
  };

  // Check connectivity periodically ONLY when suspected offline
  useEffect(() => {
    let mounted = true;

    const checkAndUpdate = async () => {
      if (!mounted) return;

      setIsChecking(true);
      const isOnline = await testNetworkConnectivity();

      if (!mounted) return;

      if (isOnline) {
        // We're online, stop checking
        setIsActuallyOffline(false);
        if (checkIntervalRef.current) {
          clearInterval(checkIntervalRef.current);
          checkIntervalRef.current = null;
        }
      } else {
        // We're offline, keep checking
        setIsActuallyOffline(true);
      }

      setIsChecking(false);
    };

    // Listen to browser events (less reliable but instant)
    const handleOffline = () => {
      console.log('⚠️ Browser says offline, verifying...');
      checkAndUpdate();

      // Start periodic checks
      if (!checkIntervalRef.current) {
        checkIntervalRef.current = setInterval(checkAndUpdate, 5000); // Check every 5s
      }
    };

    const handleOnline = () => {
      console.log('✅ Browser says online');
      setIsActuallyOffline(false);

      // Stop periodic checks
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    // Initial check only if browser reports offline
    if (!navigator.onLine) {
      checkAndUpdate();
    }

    return () => {
      mounted = false;
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, []);

  // Don't render if online
  if (!isActuallyOffline) return null;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 to-gray-800 z-[99999] flex items-center justify-center p-6">
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
            Can't reach the server. Check your connection and we'll reconnect automatically.
          </p>

          {/* Checking Indicator */}
          {isChecking && (
            <div className="flex items-center justify-center gap-2 text-blue-400 mb-6">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span className="text-sm font-medium">Checking connection...</span>
            </div>
          )}

          {/* Connection Details */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6">
            <div className="flex items-start gap-3 text-left">
              <div className="bg-yellow-500/20 rounded-lg p-2 flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-semibold mb-2">
                  Mobile Network Issues?
                </h3>
                <ul className="text-gray-300 text-sm space-y-1.5">
                  <li>• Try toggling airplane mode on/off</li>
                  <li>• Switch between WiFi and mobile data</li>
                  <li>• Move to area with better signal</li>
                  <li>• Refresh will happen automatically</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Auto-reconnect hint */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 mb-4">
            <p className="text-blue-300 text-sm">
              🔄 Checking connection every 5 seconds...
            </p>
          </div>

          {/* Manual reload button */}
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl font-medium border border-white/20 transition-colors"
          >
            Try Reload Now
          </button>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-gray-500 text-xs">
            App requires stable internet connection
          </p>
        </div>
      </div>
    </div>
  );
};
