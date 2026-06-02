import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Crown, Zap, Shield, Star, Wifi, Users } from 'lucide-react';

export const UpgradePage = () => {
  const navigate = useNavigate();

  const benefits = [
    'Inspection unlimited — sepuasnya',
    'Semua fitur tanpa batas',
    'Foto & laporan unlimited',
    'Priority support',
    'Export PDF & analytics lengkap',
  ];

  const iotFeatures = [
    {
      icon: Wifi,
      title: 'Integrasi Sensor Aroma',
      description: 'Deteksi kualitas udara toilet secara real-time — notifikasi otomatis saat level bau melewati ambang batas',
    },
    {
      icon: Users,
      title: 'Smart Visitor Counter',
      description: 'Pantau lalu lintas pengunjung dan jadwalkan pembersihan otomatis berdasarkan jumlah kunjungan',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/8 border-b border-white/10 backdrop-blur-xl">
        <div className="p-4 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl bg-white/20 text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-bold text-lg text-white">Upgrade Plan</h1>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
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
            <span className="text-4xl font-extrabold text-white">Rp 3.000.000</span>
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

        {/* IoT Features */}
        <div className="bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border border-emerald-500/30 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">IoT Integration</h3>
              <p className="text-emerald-400 text-xs">Coming Soon — Eksklusif Paket Max</p>
            </div>
          </div>

          <div className="space-y-3">
            {iotFeatures.map((feature, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">{feature.title}</h4>
                  <p className="text-xs text-white/50 leading-relaxed">{feature.description}</p>
                </div>
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
