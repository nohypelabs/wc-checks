// src/pages/ResetPasswordPage.tsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const [checking, setChecking] = useState(true);
  const initDone = useRef(false);

  useEffect(() => {
    if (initDone.current) return;
    initDone.current = true;

    const initSession = async () => {
      // Get code from URL query or hash
      const url = new URL(window.location.href);
      let code = url.searchParams.get('code');

      if (!code) {
        const hashParams = new URLSearchParams(url.hash.substring(1));
        code = hashParams.get('code');
      }

      console.log('[ResetPassword] code found:', !!code, code?.substring(0, 8));

      if (code) {
        // Exchange code for session (one-time, no retry) with timeout
        console.log('[ResetPassword] exchanging code...');
        const exchangePromise = supabase.auth.exchangeCodeForSession(code);
        const exchangeTimeout = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('exchange timeout')), 10000)
        );

        let data, exchangeError;
        try {
          const result = await Promise.race([exchangePromise, exchangeTimeout]);
          data = result.data;
          exchangeError = result.error;
        } catch (timeoutErr) {
          console.warn('[ResetPassword] exchange timed out, checking existing session');
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            setIsValidSession(true);
          } else {
            setError('Server lambat, silakan refresh halaman ini.');
          }
          setChecking(false);
          return;
        }
        console.log('[ResetPassword] exchange result:', JSON.stringify({
          hasSession: !!data.session,
          error: exchangeError?.message,
          status: exchangeError?.status,
        }));

        if (exchangeError) {
          console.error('[ResetPassword] full error:', JSON.stringify(exchangeError));
          // Code might already be consumed — check if we have a session anyway
          const { data: { session: existingSession } } = await supabase.auth.getSession();
          if (existingSession) {
            console.log('[ResetPassword] code consumed but session exists');
            setIsValidSession(true);
          } else {
            setError(`Gagal verifikasi link: ${exchangeError.message}`);
          }
          setChecking(false);
          return;
        }

        // Exchange succeeded — show form regardless of session object
        console.log('[ResetPassword] exchange succeeded');
        setIsValidSession(true);
        setChecking(false);
        return;
      }

      // No code — check existing session (e.g. user refreshed after exchange)
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        console.log('[ResetPassword] existing session found');
        setIsValidSession(true);
      } else {
        setError('Link reset tidak valid atau sudah kedaluwarsa. Silakan minta link baru.');
      }
      setChecking(false);
    };

    initSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('Kata sandi minimal 6 karakter');
      return;
    }

    if (password !== confirmPassword) {
      setError('Kata sandi tidak cocok');
      return;
    }

    setIsLoading(true);

    try {
      console.log('[ResetPassword] updating password...');

      // Add timeout — don't hang forever
      const updatePromise = supabase.auth.updateUser({ password });
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout: server tidak merespons dalam 15 detik')), 15000)
      );

      const { error: updateError } = await Promise.race([updatePromise, timeoutPromise]) as Awaited<ReturnType<typeof supabase.auth.updateUser>>;
      console.log('[ResetPassword] update result:', updateError?.message || 'success');

      if (updateError) throw updateError;

      // Sign out the recovery session so user must login with new password
      await supabase.auth.signOut();

      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: unknown) {
      console.error('[ResetPassword] update error:', err);
      const message = err instanceof Error ? err.message : 'Gagal mengubah kata sandi';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Reset Kata Sandi</h1>
          <p className="text-white/50 text-sm">Masukkan kata sandi baru Anda</p>
        </div>

        <div className="bg-white/8 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {checking ? (
            <div className="text-center py-8">
              <Loader2 className="w-12 h-12 text-blue-400 mx-auto mb-4 animate-spin" />
              <p className="text-white/60 text-sm">Memverifikasi link reset...</p>
            </div>
          ) : success ? (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">Berhasil!</h2>
              <p className="text-white/60 text-sm mb-4">
                Kata sandi Anda telah diubah. Anda akan dialihkan ke halaman login.
              </p>
              <button
                onClick={() => navigate('/login')}
                className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors"
              >
                Ke Login
              </button>
            </div>
          ) : !isValidSession ? (
            <div className="text-center py-8">
              <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">Link Tidak Valid</h2>
              <p className="text-white/60 text-sm mb-4">
                Link reset kata sandi tidak valid atau sudah kedaluwarsa.
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
                  Kata Sandi Baru
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="w-full pl-10 pr-10 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-1.5">
                  Konfirmasi Kata Sandi
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ulangi kata sandi"
                    className="w-full pl-10 pr-10 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
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
                    Mengubah...
                  </>
                ) : (
                  'Ubah Kata Sandi'
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
