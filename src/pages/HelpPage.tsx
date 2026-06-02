import { useState } from 'react';
// src/pages/HelpPage.tsx
import { Menu, HelpCircle, MessageCircle, Mail, Phone } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { BottomNav } from '../components/mobile/BottomNav';
import { Sidebar } from '../components/mobile/Sidebar';

export const HelpPage = () => {
 const [sidebarOpen, setSidebarOpen] = useState(false);

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
 <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pb-24 lg:pb-6">
 <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
 {/* Header */}
 <div className="bg-white/8 backdrop-blur-xl px-3 py-5 shadow-xl border-b border-white/10 lg:py-5 lg:px-4">
 <div className="flex items-center gap-3">
 <button
 onClick={() => setSidebarOpen(true)}
 className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
 >
 <Menu className="w-5 h-5 text-white/60" />
 </button>
 <div>
 <h1 className="text-xl font-bold text-white">Bantuan & FAQ</h1>
 <p className="text-sm text-white/50">Panduan penggunaan aplikasi</p>
 </div>
 </div>
 </div>

 {/* Main Content */}
 <main className="p-5 space-y-4">
 {/* FAQ Section */}
 <Card>
 <h2 className="font-bold text-white mb-3 flex items-center gap-2">
 <HelpCircle className="w-5 h-5 text-blue-300" />
 Pertanyaan Umum
 </h2>
 <div className="space-y-4">
 {faqs.map((faq, index) => (
 <div key={index} className="border-b border-white/10 last:border-0 pb-4 last:pb-0">
 <h3 className="font-medium text-white mb-2">{faq.question}</h3>
 <p className="text-sm text-white/60">{faq.answer}</p>
 </div>
 ))}
 </div>
 </Card>

 {/* Quick Tips */}
 <Card>
 <h2 className="font-bold text-white mb-3">💡 Tips Cepat</h2>
 <ul className="space-y-2 text-sm text-white/60">
 <li className="flex items-start gap-2">
 <span className="text-blue-300 mt-1">•</span>
 <span>Pastikan koneksi internet stabil untuk pengalaman terbaik</span>
 </li>
 <li className="flex items-start gap-2">
 <span className="text-blue-300 mt-1">•</span>
 <span>Periksa halaman Analytics untuk melihat performa inspeksi Anda</span>
 </li>
 <li className="flex items-start gap-2">
 <span className="text-blue-300 mt-1">•</span>
 <span>Ekspor laporan dalam format CSV untuk analisis lebih lanjut</span>
 </li>
 </ul>
 </Card>

 {/* Contact Support */}
 <Card>
 <h2 className="font-bold text-white mb-3">Hubungi Kami</h2>
 <div className="space-y-3">
 <a
 href="mailto:abdulgofur100persen@gmail.com"
 className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/8 transition-colors"
 >
 <Mail className="w-5 h-5 text-blue-300" />
 <div>
 <p className="font-medium text-white">Email Support</p>
 <p className="text-xs text-white/50">abdulgofur100persen@gmail.com</p>
 </div>
 </a>

 <a
 href="https://wa.me/6287874415491"
 target="_blank"
 rel="noopener noreferrer"
 className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/8 transition-colors"
 >
 <Phone className="w-5 h-5 text-blue-300" />
 <div>
 <p className="font-medium text-white">WhatsApp Support</p>
 <p className="text-xs text-white/50">+62 878-7441-5491</p>
 </div>
 </a>

 <a
 href="https://github.com/agds-alt/wc-checks"
 target="_blank"
 rel="noopener noreferrer"
 className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/8 transition-colors"
 >
 <MessageCircle className="w-5 h-5 text-blue-300" />
 <div>
 <p className="font-medium text-white">GitHub Repository</p>
 <p className="text-xs text-white/50">Report bugs & request features</p>
 </div>
 </a>
 </div>
 </Card>
 </main>

 <div className="lg:hidden"><div className="lg:hidden"><BottomNav /></div></div>
 </div>
 );
};
