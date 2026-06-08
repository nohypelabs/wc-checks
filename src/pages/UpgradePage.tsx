import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Crown, Zap, Shield, Star } from 'lucide-react';

export const UpgradePage = () => {
  const navigate = useNavigate();

  const benefits = [
    'Inspection unlimited — sepuasnya',
    'Semua fitur tanpa batas',
    'Foto & laporan unlimited',
    'Priority support',
    'Export PDF & analytics lengkap',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-white/8 backdrop-blur-xl px-3 py-5 shadow-xl border-b border-white/10 lg:py-5 lg:px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white/60" />
            </button>
            <h1 className="text-xl font-bold text-white">Upgrade Plan</h1>
          </div>
        </div>
      </div>

      {/* Content */}
              <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Alert */}
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-5 h-5 text-yellow-400" />
            <span className="font-bold text-yellow-400">Limit Tercapai</span>
          </div>
          <p className="text-sm text-yellow-300/80">
            Kamu udah mencapai batas inspection. Upgrade ke paket unlimited buat lanjut!
          </p>
        </div>

        {/* Plan Card */}
        <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 border-2 border-blue-500/50 rounded-2xl p-6 relative overflow-hidden">
          {/* Badge */}
          <div className="absolute top-4 right-4 bg-yellow-500 text-black text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
            <Crown className="w-3 h-3" />
            MAX
          </div>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 bg-blue-500/20 rounded-2xl flex items-center justify-center">
              <Star className="w-7 h-7 text-blue-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Paket Max</h2>
              <p className="text-white/60 text-sm">Unlimited everything</p>
            </div>
          </div>

          <div className="mb-6">
            <span className="text-4xl font-extrabold text-white">Rp 700.000</span>
            <span className="text-white/50 text-sm"> /bulan</span>
          </div>

          {/* Benefits */}
          <div className="space-y-3">
            {benefits.map((benefit, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-green-400" />
                </div>
                <span className="text-white/90 text-sm">{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={() => navigate('/payment-method')}
          className="w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg shadow-blue-500/20"
        >
          <div className="flex items-center justify-center gap-2">
            <Shield className="w-5 h-5" />
            Upgrade Sekarang
          </div>
        </button>

        <p className="text-center text-white/40 text-xs">
          Pembayaran via transfer bank • Aktivasi manual oleh admin
        </p>
      </div>
    </div>
  );
};
