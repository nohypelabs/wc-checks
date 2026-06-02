import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, Check, CreditCard, MessageCircle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'react-hot-toast';

const WHATSAPP_NUMBER = '6281221575053';
const WHATSAPP_TEXT = 'saya sudah bayar, silahkan cek saldo untuk memeriksa/verifikasi';

export const PaymentMethodPage = () => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText('1988595892');
      setCopied(true);
      toast.success('Nomor rekening disalin!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Gagal menyalin');
    }
  };

  const handleWhatsApp = () => {
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_TEXT)}`;
    window.open(url, '_blank');
  };

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
          <h1 className="font-bold text-lg text-white">Metode Pembayaran</h1>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Plan Summary */}
        <div className="bg-white/10 border border-white/15 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/60 text-sm">Paket</p>
              <p className="text-white font-bold text-lg">Paket Max — Unlimited</p>
            </div>
            <div className="text-right">
              <p className="text-white/60 text-sm">Total</p>
              <p className="text-sm text-white/40 line-through">Rp 5.000.000</p>
              <p className="text-white font-extrabold text-xl">Rp 2.999.000</p>
            </div>
          </div>
        </div>

        {/* Bank Account */}
        <div className="bg-white/10 border-2 border-blue-500/30 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="w-5 h-5 text-blue-400" />
            <h2 className="font-bold text-white">Transfer Bank</h2>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-white/50 text-xs mb-1">Bank</p>
              <p className="text-white font-bold text-lg">BNI</p>
            </div>

            <div>
              <p className="text-white/50 text-xs mb-1">Atas Nama</p>
              <p className="text-white font-bold text-lg">Abdul Gofur</p>
            </div>

            <div>
              <p className="text-white/50 text-xs mb-1">Nomor Rekening</p>
              <div className="flex items-center gap-3">
                <p className="text-white font-mono font-extrabold text-2xl tracking-wider">
                  1988595892
                </p>
                <button
                  onClick={handleCopy}
                  className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
                >
                  {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <p className="text-white/70 text-sm leading-relaxed">
            1. Transfer <span className="font-bold text-white">Rp 2.999.000</span> ke rekening di atas
            <br />
            2. Klik tombol <span className="font-bold text-white">"Sudah Bayar"</span> di bawah
            <br />
            3. Admin akan verifikasi pembayaran kamu via WhatsApp
            <br />
            4. Setelah diverifikasi, fitur unlimited aktif otomatis
          </p>
        </div>

        {/* Sudah Bayar Button */}
        <button
          onClick={handleWhatsApp}
          className="w-full py-4 rounded-xl font-bold text-white bg-green-600 hover:bg-green-700 transition-all shadow-lg shadow-green-500/20"
        >
          <div className="flex items-center justify-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Sudah Bayar
          </div>
        </button>

        <p className="text-center text-white/40 text-xs">
          Kamu akan diarahkan ke WhatsApp admin untuk konfirmasi
        </p>
      </div>
    </div>
  );
};
