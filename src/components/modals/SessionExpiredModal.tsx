// src/components/modals/SessionExpiredModal.tsx
import { useState, useEffect } from 'react';
import { LogIn, RefreshCw, Wifi, WifiOff, Clock } from 'lucide-react';

interface SessionExpiredModalProps {
  onLogin: () => void;
  onRefresh: () => void;
}

export const SessionExpiredModal = ({ onLogin, onRefresh }: SessionExpiredModalProps) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [countdown, setCountdown] = useState(5);
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-refresh countdown
  useEffect(() => {
    if (countdown > 0 && isOnline) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && isOnline) {
      setIsAutoRefreshing(true);
      onRefresh();
    }
  }, [countdown, isOnline, onRefresh]);

  const handleManualRefresh = () => {
    setIsAutoRefreshing(true);
    onRefresh();
  };

  const handleLogin = () => {
    onLogin();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-2xl p-5 max-w-xs w-full border border-white/10 shadow-2xl">
        <div className="text-center">
          <div className="w-14 h-14 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-3">
            <LogIn className="w-7 h-7 text-yellow-400" />
          </div>
          
          <h3 className="text-base font-bold text-white mb-1">Sesi Berakhir</h3>
          
          <p className="text-white/50 text-xs mb-3">
            Sesi Anda telah berakhir karena tidak aktif.
          </p>

          {/* Connection Status */}
          <div className={`flex items-center justify-center gap-2 mb-4 px-3 py-2 rounded-lg ${
            isOnline ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
          }`}>
            {isOnline ? (
              <>
                <Wifi className="w-4 h-4" />
                <span className="text-xs font-medium">Online</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4" />
                <span className="text-xs font-medium">Offline - Periksa koneksi internet</span>
              </>
            )}
          </div>

          {/* Auto-refresh countdown */}
          {isOnline && !isAutoRefreshing && (
            <div className="flex items-center justify-center gap-2 mb-4 px-3 py-2 bg-blue-500/10 rounded-lg">
              <Clock className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-blue-400">
                Auto-refresh dalam {countdown} detik...
              </span>
            </div>
          )}

          {/* Loading state */}
          {isAutoRefreshing && (
            <div className="flex items-center justify-center gap-2 mb-4 px-3 py-2 bg-blue-500/10 rounded-lg">
              <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />
              <span className="text-xs text-blue-400">
                Menyegarkan sesi...
              </span>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleManualRefresh}
              disabled={!isOnline || isAutoRefreshing}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-white text-sm rounded-xl font-medium transition-colors ${
                isOnline && !isAutoRefreshing
                  ? 'bg-white/10 hover:bg-white/15'
                  : 'bg-white/5 text-white/30 cursor-not-allowed'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${isAutoRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={handleLogin}
              disabled={isAutoRefreshing}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-xl font-medium transition-colors"
            >
              <LogIn className="w-4 h-4" />
              Login Ulang
            </button>
          </div>

          {/* Help text */}
          <p className="text-white/30 text-[10px] mt-3">
            Jika masalah berlanjut, coba login ulang atau hubungi admin.
          </p>
        </div>
      </div>
    </div>
  );
};