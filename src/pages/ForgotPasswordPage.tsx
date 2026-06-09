// src/pages/ForgotPasswordPage.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Mail, AlertCircle, CheckCircle, Loader2, ArrowLeft } from 'lucide-react';

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email) {
      setError('Harap masukkan alamat email Anda');
      return;
    }

    setIsLoading(true);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) throw resetError;

      setSent(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal mengirim email reset';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Lupa Kata Sandi</h1>
          <p className="text-white/50 text-sm">Masukkan email Anda untuk menerima link reset</p>
        </div>

        <div className="bg-white/8 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {sent ? (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">Email Terkirim!</h2>
              <p className="text-white/60 text-sm mb-2">
                Link reset kata sandi telah dikirim ke:
              </p>
              <p className="text-white font-medium mb-6">{email}</p>
              <p className="text-white/40 text-xs mb-6">
                Periksa inbox dan folder spam Anda. Link akan kedaluwarsa dalam 1 jam.
              </p>
              <button
                onClick={() => navigate('/login')}
                className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors"
              >
                Kembali ke Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1.5">
                  Alamat Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@anda.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Mengirim...
                  </>
                ) : (
                  'Kirim Link Reset'
                )}
              </button>

              <button
                type="button"
                onClick={() => navigate('/login')}
                className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-white/70 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Kembali ke Login
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
