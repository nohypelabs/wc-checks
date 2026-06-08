import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, Check, CreditCard, MessageCircle, Download } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { generateInvoice } from '../lib/invoiceGenerator';

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

  const handleDownloadInvoice = () => {
    try {
      generateInvoice();
      toast.success('Invoice berhasil diunduh!');
    } catch {
      toast.error('Gagal mengunduh invoice');
    }
  };

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
            <h1 className="text-xl font-bold text-white">Metode Pembayaran</h1>
          </div>
        </div>
      </div>

      {/* Content */}
              <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Plan Summary */}
        <div className="bg-white/10 border border-white/15 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/60 text-sm">Paket</p>
              <p className="text-white font-bold text-lg">Paket Max — Unlimited</p>
            </div>
            <div className="text-right">
              <p className="text-white/60 text-sm">Total</p>
              <p className="text-white font-extrabold text-xl">Rp 700.000</p>
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
            1. Transfer <span className="font-bold text-white">Rp 700.000</span> ke rekening di atas
            <br />
            2. Klik tombol <span className="font-bold text-white">"Sudah Bayar"</span> di bawah
            <br />
            3. Admin akan verifikasi pembayaran kamu via WhatsApp
            <br />
            4. Setelah diverifikasi, fitur unlimited aktif otomatis
          </p>
        </div>

        {/* Download Invoice Button */}
        <button
          onClick={handleDownloadInvoice}
          className="w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg shadow-blue-500/20"
        >
          <div className="flex items-center justify-center gap-2">
            <Download className="w-5 h-5" />
            Download Invoice
          </div>
        </button>

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
