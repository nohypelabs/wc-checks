// src/pages/HelpPage.tsx
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, HelpCircle, MessageCircle, Mail, Phone } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { BottomNav } from '../components/mobile/BottomNav';

export const HelpPage = () => {
  const navigate = useNavigate();

  const faqs = [
    {
      question: 'Bagaimana cara memulai inspeksi?',
      answer: 'Tap tombol "Pindai Kode QR" di dashboard, arahkan kamera ke QR code lokasi toilet, dan mulai inspeksi.',
    },
    {
      question: 'Apakah saya bisa inspeksi tanpa internet?',
      answer: 'Ya, aplikasi dapat bekerja offline. Data akan otomatis tersinkronisasi saat terhubung internet.',
    },
    {
      question: 'Bagaimana cara melihat riwayat inspeksi?',
      answer: 'Buka menu "Riwayat" di bottom navigation atau "Laporan" di sidebar untuk melihat semua inspeksi Anda.',
    },
    {
      question: 'Apa yang harus dilakukan jika QR code tidak terbaca?',
      answer: 'Pastikan QR code bersih dan pencahayaan cukup. Anda juga bisa memilih lokasi manual dari menu Lokasi.',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-shadow border border-gray-100"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Bantuan & FAQ</h1>
            <p className="text-sm text-gray-500">Panduan penggunaan aplikasi</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="p-5 space-y-4">
        {/* FAQ Section */}
        <Card>
          <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-blue-600" />
            Pertanyaan Umum
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                <h3 className="font-medium text-gray-900 mb-2">{faq.question}</h3>
                <p className="text-sm text-gray-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Quick Tips */}
        <Card>
          <h2 className="font-bold text-gray-900 mb-3">💡 Tips Cepat</h2>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>Gunakan mode PWA untuk akses lebih cepat dan offline capability</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>Periksa halaman Analytics untuk melihat performa inspeksi Anda</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>Ekspor laporan dalam format CSV untuk analisis lebih lanjut</span>
            </li>
          </ul>
        </Card>

        {/* Contact Support */}
        <Card>
          <h2 className="font-bold text-gray-900 mb-3">Hubungi Kami</h2>
          <div className="space-y-3">
            <a
              href="mailto:support@wccheck.com"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Mail className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium text-gray-900">Email Support</p>
                <p className="text-xs text-gray-500">support@wccheck.com</p>
              </div>
            </a>

            <a
              href="tel:+6281234567890"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Phone className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium text-gray-900">WhatsApp Support</p>
                <p className="text-xs text-gray-500">+62 812-3456-7890</p>
              </div>
            </a>

            <a
              href="#"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <MessageCircle className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium text-gray-900">Live Chat</p>
                <p className="text-xs text-gray-500">Senin - Jumat, 09:00 - 17:00</p>
              </div>
            </a>
          </div>
        </Card>
      </main>

      <BottomNav />
    </div>
  );
};
