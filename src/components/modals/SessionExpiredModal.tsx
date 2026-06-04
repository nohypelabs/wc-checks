// src/components/modals/SessionExpiredModal.tsx
import { LogIn, RefreshCw } from 'lucide-react';

interface SessionExpiredModalProps {
  onLogin: () => void;
  onRefresh: () => void;
}

export const SessionExpiredModal = ({ onLogin, onRefresh }: SessionExpiredModalProps) => {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-2xl p-5 max-w-xs w-full border border-white/10 shadow-2xl">
        <div className="text-center">
          <div className="w-14 h-14 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-3">
            <LogIn className="w-7 h-7 text-yellow-400" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">Sesi Berakhir</h3>
          <p className="text-white/50 text-xs mb-5">
            Sesi Anda telah berakhir karena tidak aktif. Silakan login kembali atau refresh halaman.
          </p>
          <div className="flex gap-2">
            <button
              onClick={onRefresh}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-white/10 hover:bg-white/15 text-white text-sm rounded-xl font-medium transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={onLogin}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-xl font-medium transition-colors"
            >
              <LogIn className="w-4 h-4" />
              Login Ulang
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
