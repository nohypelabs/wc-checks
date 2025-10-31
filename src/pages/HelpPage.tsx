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
      question: 'Apakah aplikasi ini memerlukan internet?',
      answer: 'Ya, aplikasi memerlukan koneksi internet aktif untuk menyimpan dan mengakses data inspeksi secara real-time.',
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
              <span>Pastikan koneksi internet stabil untuk pengalaman terbaik</span>
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
              href="mailto:abdulgofur100persen@gmail.com"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Mail className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium text-gray-900">Email Support</p>
                <p className="text-xs text-gray-500">abdulgofur100persen@gmail.com</p>
              </div>
            </a>

            <a
              href="https://wa.me/6287874415491"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Phone className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium text-gray-900">WhatsApp Support</p>
                <p className="text-xs text-gray-500">+62 878-7441-5491</p>
              </div>
            </a>

            <a
              href="https://github.com/agds-alt/wc-checks"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <MessageCircle className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium text-gray-900">GitHub Repository</p>
                <p className="text-xs text-gray-500">Report bugs & request features</p>
              </div>
            </a>
          </div>
        </Card>
      </main>

      <BottomNav />
    </div>
  );
};
