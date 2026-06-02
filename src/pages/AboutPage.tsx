import { useState } from 'react';
// src/pages/AboutPage.tsx
import { Menu, CheckCircle, Github, Globe, Mail, Database, Lock, Server, Smartphone, Code, BarChart3, Shield, Users, QrCode, FileText, TrendingUp } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { BottomNav } from '../components/mobile/BottomNav';
import { Sidebar } from '../components/mobile/Sidebar';

export const AboutPage = () => {
 const [sidebarOpen, setSidebarOpen] = useState(false);

 return (
 <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pb-24 lg:pb-6">
 <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
 {/* Header */}
 <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-6 shadow-lg">
 <div className="flex items-center gap-3 mb-4">
 <button
 onClick={() => setSidebarOpen(true)}
 className="w-10 h-10 bg-white/8 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/10 transition-all border border-white/10"
 >
 <Menu className="w-5 h-5 text-white" />
 </button>
 <div>
 <h1 className="text-xl font-bold text-white">Tentang Aplikasi</h1>
 <p className="text-sm text-blue-100">Dokumentasi Sistem Lengkap</p>
 </div>
 </div>
 </div>

 {/* Main Content */}
 <main className="p-5 space-y-5">
 {/* App Logo & Version */}
 <Card>
 <div className="text-center py-6">
 <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg border-2 border-white/10">
 <img
 src="/logo.png"
 alt="Proservice Indonesia Logo"
 className="h-20 w-auto"
 onError={(e) => {
 // If logo fails to load, show fallback
 const img = e.target as HTMLImageElement;
 img.style.display = 'none';
 const parent = img.parentElement;
 if (parent) {
 parent.innerHTML = '<span class="text-5xl">🚽</span>';
 parent.className = 'w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg';
 }
 }}
 />
 </div>
 <h2 className="text-2xl font-bold text-white mb-2">Proservice Indonesia</h2>
 <p className="text-white/60 mb-4">Sistem Inspeksi & Monitoring Toilet Terintegrasi</p>
 <div className="inline-block px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full shadow-md">
 <span className="text-sm font-bold text-white">Versi 3.0.0</span>
 </div>
 </div>
 </Card>

 {/* Description */}
 <Card>
 <div className="flex items-start gap-3 mb-4">
 <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
 <FileText className="w-5 h-5 text-blue-300" />
 </div>
 <div>
 <h3 className="font-bold text-white mb-2">Tentang Sistem</h3>
 </div>
 </div>
 <p className="text-sm text-white/60 leading-relaxed mb-4">
 <strong>Proservice Indonesia</strong> adalah sistem manajemen inspeksi toilet berbasis web yang dirancang khusus untuk membantu organisasi, perusahaan, dan institusi dalam memantau dan meningkatkan standar kebersihan fasilitas sanitasi mereka secara real-time menggunakan teknologi QR Code dan analytics modern.
 </p>
 <p className="text-sm text-white/60 leading-relaxed mb-4">
 Sistem ini memungkinkan petugas kebersihan melakukan inspeksi dengan mudah melalui smartphone, supervisor dapat memantau kinerja tim secara real-time, dan manajemen fasilitas mendapatkan laporan komprehensif untuk pengambilan keputusan yang lebih baik.
 </p>
 <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
 <p className="text-sm text-blue-800 font-medium">
 <strong>Value Proposition:</strong> Sistem ini meningkatkan efisiensi inspeksi hingga 70%, mengurangi paperwork, dan memberikan data real-time untuk decision making yang lebih cepat dan akurat.
 </p>
 </div>
 </Card>

 {/* Core Features */}
 <Card>
 <div className="flex items-start gap-3 mb-4">
 <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
 <CheckCircle className="w-5 h-5 text-green-300" />
 </div>
 <div>
 <h3 className="font-bold text-white">Fitur Utama Sistem</h3>
 <p className="text-sm text-white/50">16+ Fitur Lengkap untuk Manajemen Inspeksi</p>
 </div>
 </div>

 <div className="space-y-4">
 {/* Inspection Features */}
 <div>
 <h4 className="font-semibold text-white text-sm mb-3 flex items-center gap-2">
 <QrCode className="w-4 h-4 text-blue-300" />
 Fitur Inspeksi
 </h4>
 <div className="space-y-2 ml-6">
 <div className="flex items-start gap-3">
 <CheckCircle className="w-4 h-4 text-green-300 flex-shrink-0 mt-0.5" />
 <div>
 <p className="text-sm font-medium text-white">QR Code Scanner</p>
 <p className="text-xs text-white/60">Scan QR code untuk inspeksi cepat, deteksi otomatis lokasi toilet</p>
 </div>
 </div>
 <div className="flex items-start gap-3">
 <CheckCircle className="w-4 h-4 text-green-300 flex-shrink-0 mt-0.5" />
 <div>
 <p className="text-sm font-medium text-white">Formulir Inspeksi Komprehensif</p>
 <p className="text-xs text-white/60">11 komponen penilaian (Aroma, Lantai, Dinding, Kloset, Wastafel, Urinal, Sabun, Tissue, Pewangi, Cermin, Tempat Sampah) dengan sistem rating 3 pilihan</p>
 </div>
 </div>
 <div className="flex items-start gap-3">
 <CheckCircle className="w-4 h-4 text-green-300 flex-shrink-0 mt-0.5" />
 <div>
 <p className="text-sm font-medium text-white">Sistem Scoring Berbobot</p>
 <p className="text-xs text-white/60">Setiap komponen memiliki bobot berbeda (total 100%), menghasilkan skor objektif 0-100</p>
 </div>
 </div>
 <div className="flex items-start gap-3">
 <CheckCircle className="w-4 h-4 text-green-300 flex-shrink-0 mt-0.5" />
 <div>
 <p className="text-sm font-medium text-white">Dokumentasi Foto</p>
 <p className="text-xs text-white/60">Upload 1-3 foto per inspeksi dengan kompresi otomatis, tersimpan di Cloudinary CDN</p>
 </div>
 </div>
 <div className="flex items-start gap-3">
 <CheckCircle className="w-4 h-4 text-green-300 flex-shrink-0 mt-0.5" />
 <div>
 <p className="text-sm font-medium text-white">Geolocation & Timestamp</p>
 <p className="text-xs text-white/60">Setiap inspeksi tercatat lokasi GPS dan waktu pelaksanaan secara otomatis</p>
 </div>
 </div>
 </div>
 </div>

 {/* Reporting Features */}
 <div>
 <h4 className="font-semibold text-white text-sm mb-3 flex items-center gap-2">
 <BarChart3 className="w-4 h-4 text-purple-300" />
 Fitur Pelaporan & Analytics
 </h4>
 <div className="space-y-2 ml-6">
 <div className="flex items-start gap-3">
 <CheckCircle className="w-4 h-4 text-green-300 flex-shrink-0 mt-0.5" />
 <div>
 <p className="text-sm font-medium text-white">Dashboard Real-time</p>
 <p className="text-xs text-white/60">Statistik inspeksi hari ini, minggu ini, bulan ini dengan visualisasi data</p>
 </div>
 </div>
 <div className="flex items-start gap-3">
 <CheckCircle className="w-4 h-4 text-green-300 flex-shrink-0 mt-0.5" />
 <div>
 <p className="text-sm font-medium text-white">Riwayat Inspeksi Lengkap</p>
 <p className="text-xs text-white/60">Lihat semua inspeksi dengan filter tanggal dan tampilan kalender</p>
 </div>
 </div>
 <div className="flex items-start gap-3">
 <CheckCircle className="w-4 h-4 text-green-300 flex-shrink-0 mt-0.5" />
 <div>
 <p className="text-sm font-medium text-white">Analytics Page</p>
 <p className="text-xs text-white/60">Analisa performa per bulan, trend naik/turun, lokasi terbaik & terburuk</p>
 </div>
 </div>
 <div className="flex items-start gap-3">
 <CheckCircle className="w-4 h-4 text-green-300 flex-shrink-0 mt-0.5" />
 <div>
 <p className="text-sm font-medium text-white">Export ke CSV</p>
 <p className="text-xs text-white/60">Download data inspeksi dalam format CSV untuk analisa lebih lanjut</p>
 </div>
 </div>
 </div>
 </div>

 {/* Management Features */}
 <div>
 <h4 className="font-semibold text-white text-sm mb-3 flex items-center gap-2">
 <Users className="w-4 h-4 text-orange-300" />
 Fitur Manajemen
 </h4>
 <div className="space-y-2 ml-6">
 <div className="flex items-start gap-3">
 <CheckCircle className="w-4 h-4 text-green-300 flex-shrink-0 mt-0.5" />
 <div>
 <p className="text-sm font-medium text-white">Multi-Organisasi & Multi-Gedung</p>
 <p className="text-xs text-white/60">Kelola banyak organisasi, gedung, dan lokasi toilet dalam satu sistem</p>
 </div>
 </div>
 <div className="flex items-start gap-3">
 <CheckCircle className="w-4 h-4 text-green-300 flex-shrink-0 mt-0.5" />
 <div>
 <p className="text-sm font-medium text-white">Manajemen Lokasi</p>
 <p className="text-xs text-white/60">CRUD lokasi toilet dengan detail lengkap (lantai, area, deskripsi, QR code)</p>
 </div>
 </div>
 <div className="flex items-start gap-3">
 <CheckCircle className="w-4 h-4 text-green-300 flex-shrink-0 mt-0.5" />
 <div>
 <p className="text-sm font-medium text-white">QR Code Generator</p>
 <p className="text-xs text-white/60">Generate QR code otomatis untuk setiap lokasi, bisa print atau download</p>
 </div>
 </div>
 <div className="flex items-start gap-3">
 <CheckCircle className="w-4 h-4 text-green-300 flex-shrink-0 mt-0.5" />
 <div>
 <p className="text-sm font-medium text-white">User Management (Super Admin)</p>
 <p className="text-xs text-white/60">Kelola user, assign role, dan monitor aktivitas pengguna</p>
 </div>
 </div>
 <div className="flex items-start gap-3">
 <CheckCircle className="w-4 h-4 text-green-300 flex-shrink-0 mt-0.5" />
 <div>
 <p className="text-sm font-medium text-white">Role-Based Access Control</p>
 <p className="text-xs text-white/60">3 level role: Super Admin (sistem), Admin (organisasi), User (inspector)</p>
 </div>
 </div>
 <div className="flex items-start gap-3">
 <CheckCircle className="w-4 h-4 text-green-300 flex-shrink-0 mt-0.5" />
 <div>
 <p className="text-sm font-medium text-white">Audit Logging</p>
 <p className="text-xs text-white/60">Semua aktivitas tercatat (create, update, delete) untuk compliance & tracking</p>
 </div>
 </div>
 </div>
 </div>
 </div>
 </Card>

 {/* Tech Stack */}
 <Card>
 <div className="flex items-start gap-3 mb-4">
 <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
 <Code className="w-5 h-5 text-purple-300" />
 </div>
 <div>
 <h3 className="font-bold text-white">Stack Teknologi</h3>
 <p className="text-sm text-white/50">Modern Tech Stack untuk Performance & Scalability</p>
 </div>
 </div>

 <div className="space-y-4">
 {/* Frontend Stack */}
 <div>
 <h4 className="font-semibold text-white text-sm mb-3 flex items-center gap-2">
 <Smartphone className="w-4 h-4 text-blue-300" />
 Frontend Technologies
 </h4>
 <div className="grid grid-cols-2 gap-2">
 <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
 <p className="font-semibold text-white text-xs">React 18.2</p>
 <p className="text-xs text-white/60">UI Library</p>
 </div>
 <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
 <p className="font-semibold text-white text-xs">TypeScript 5.9</p>
 <p className="text-xs text-white/60">Type Safety</p>
 </div>
 <div className="p-3 bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-lg border border-cyan-200">
 <p className="font-semibold text-white text-xs">Vite 5.4</p>
 <p className="text-xs text-white/60">Build Tool</p>
 </div>
 <div className="p-3 bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-lg border border-cyan-200">
 <p className="font-semibold text-white text-xs">Tailwind CSS 3.4</p>
 <p className="text-xs text-white/60">Styling</p>
 </div>
 <div className="p-3 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg border border-indigo-200">
 <p className="font-semibold text-white text-xs">React Router 6</p>
 <p className="text-xs text-white/60">Navigation</p>
 </div>
 <div className="p-3 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg border border-indigo-200">
 <p className="font-semibold text-white text-xs">Zustand 5.0</p>
 <p className="text-xs text-white/60">State Management</p>
 </div>
 <div className="p-3 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
 <p className="font-semibold text-white text-xs">React Query 5</p>
 <p className="text-xs text-white/60">Data Fetching</p>
 </div>
 <div className="p-3 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
 <p className="font-semibold text-white text-xs">React Hook Form</p>
 <p className="text-xs text-white/60">Form Handling</p>
 </div>
 </div>
 </div>

 {/* Backend & Database */}
 <div>
 <h4 className="font-semibold text-white text-sm mb-3 flex items-center gap-2">
 <Server className="w-4 h-4 text-green-300" />
 Backend & Database
 </h4>
 <div className="grid grid-cols-2 gap-2">
 <div className="p-3 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
 <p className="font-semibold text-white text-xs">Supabase</p>
 <p className="text-xs text-white/60">Backend Platform</p>
 </div>
 <div className="p-3 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
 <p className="font-semibold text-white text-xs">PostgreSQL</p>
 <p className="text-xs text-white/60">Database</p>
 </div>
 <div className="p-3 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg border border-emerald-200">
 <p className="font-semibold text-white text-xs">Vercel Functions</p>
 <p className="text-xs text-white/60">Serverless API</p>
 </div>
 <div className="p-3 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg border border-emerald-200">
 <p className="font-semibold text-white text-xs">Cloudinary</p>
 <p className="text-xs text-white/60">Image CDN</p>
 </div>
 </div>
 </div>

 {/* Libraries & Tools */}
 <div>
 <h4 className="font-semibold text-white text-sm mb-3">Libraries Khusus</h4>
 <div className="grid grid-cols-2 gap-2">
 <div className="p-2 bg-white/8 rounded border border-white/15">
 <p className="text-xs font-medium text-white">html5-qrcode</p>
 <p className="text-xs text-white/50">QR Scanner</p>
 </div>
 <div className="p-2 bg-white/8 rounded border border-white/15">
 <p className="text-xs font-medium text-white">qrcode.react</p>
 <p className="text-xs text-white/50">QR Generator</p>
 </div>
 <div className="p-2 bg-white/8 rounded border border-white/15">
 <p className="text-xs font-medium text-white">Zod</p>
 <p className="text-xs text-white/50">Validation</p>
 </div>
 <div className="p-2 bg-white/8 rounded border border-white/15">
 <p className="text-xs font-medium text-white">date-fns</p>
 <p className="text-xs text-white/50">Date Utils</p>
 </div>
 <div className="p-2 bg-white/8 rounded border border-white/15">
 <p className="text-xs font-medium text-white">lucide-react</p>
 <p className="text-xs text-white/50">Icons</p>
 </div>
 <div className="p-2 bg-white/8 rounded border border-white/15">
 <p className="text-xs font-medium text-white">react-hot-toast</p>
 <p className="text-xs text-white/50">Notifications</p>
 </div>
 </div>
 </div>
 </div>
 </Card>

 {/* Architecture */}
 <Card>
 <div className="flex items-start gap-3 mb-4">
 <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
 <Database className="w-5 h-5 text-orange-300" />
 </div>
 <div>
 <h3 className="font-bold text-white">Arsitektur Sistem</h3>
 <p className="text-sm text-white/50">Client-Server Architecture dengan Serverless Backend</p>
 </div>
 </div>

 <div className="space-y-4">
 {/* Frontend Architecture */}
 <div>
 <h4 className="font-semibold text-white text-sm mb-2">Frontend Architecture</h4>
 <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
 <ul className="text-xs text-white/80 space-y-1">
 <li><strong>Component-Based:</strong> 34+ reusable React components</li>
 <li><strong>Custom Hooks:</strong> 15 custom hooks untuk logic separation</li>
 <li><strong>Lazy Loading:</strong> Code splitting per page untuk performance</li>
 <li><strong>State Management:</strong> Zustand untuk global state, React Query untuk server state</li>
 <li><strong>Mobile-First:</strong> Responsive design, bottom navigation, haptic feedback</li>
 </ul>
 </div>
 </div>

 {/* Backend Architecture */}
 <div>
 <h4 className="font-semibold text-white text-sm mb-2">Backend Architecture</h4>
 <div className="bg-green-50 border-l-4 border-green-500 p-3 rounded">
 <ul className="text-xs text-white/80 space-y-1">
 <li><strong>Serverless API:</strong> Vercel Functions (Node.js runtime)</li>
 <li><strong>RESTful Endpoints:</strong> /api/inspections, /api/locations, /api/reports, /api/admin/*</li>
 <li><strong>Middleware:</strong> Auth validation & role-based access control</li>
 <li><strong>Database:</strong> Supabase PostgreSQL dengan Row Level Security (RLS)</li>
 <li><strong>File Storage:</strong> Cloudinary CDN untuk foto inspeksi</li>
 </ul>
 </div>
 </div>

 {/* Data Flow */}
 <div>
 <h4 className="font-semibold text-white text-sm mb-2">Data Flow</h4>
 <div className="bg-purple-50 border-l-4 border-purple-500 p-3 rounded text-xs text-white/80 leading-relaxed">
 <p className="mb-2"><strong>Inspection Flow:</strong></p>
 <p className="font-mono text-xs">
 User → Scan QR → Extract Location ID → Load Inspection Form → Fill Form + Upload Photos → POST /api/inspections → Save to PostgreSQL → Update Analytics → Redirect to Dashboard
 </p>
 </div>
 </div>
 </div>
 </Card>

 {/* Database Schema */}
 <Card>
 <div className="flex items-start gap-3 mb-4">
 <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
 <Database className="w-5 h-5 text-red-300" />
 </div>
 <div>
 <h3 className="font-bold text-white">Database Schema</h3>
 <p className="text-sm text-white/50">PostgreSQL Database Structure</p>
 </div>
 </div>

 <div className="space-y-3">
 <div className="bg-white/8 rounded-lg p-3 border border-white/15">
 <h4 className="font-semibold text-white text-xs mb-2 flex items-center gap-2">
 <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
 users
 </h4>
 <p className="text-xs text-white/60">User accounts dengan authentication credentials</p>
 </div>

 <div className="bg-white/8 rounded-lg p-3 border border-white/15">
 <h4 className="font-semibold text-white text-xs mb-2 flex items-center gap-2">
 <div className="w-2 h-2 bg-green-500 rounded-full"></div>
 roles & user_roles
 </h4>
 <p className="text-xs text-white/60">Role definitions (super_admin, admin, user) dan user-role mapping</p>
 </div>

 <div className="bg-white/8 rounded-lg p-3 border border-white/15">
 <h4 className="font-semibold text-white text-xs mb-2 flex items-center gap-2">
 <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
 organizations
 </h4>
 <p className="text-xs text-white/60">Master data organisasi untuk multi-tenant support</p>
 </div>

 <div className="bg-white/8 rounded-lg p-3 border border-white/15">
 <h4 className="font-semibold text-white text-xs mb-2 flex items-center gap-2">
 <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
 buildings
 </h4>
 <p className="text-xs text-white/60">Data gedung/bangunan dalam organisasi</p>
 </div>

 <div className="bg-white/8 rounded-lg p-3 border border-white/15">
 <h4 className="font-semibold text-white text-xs mb-2 flex items-center gap-2">
 <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
 locations
 </h4>
 <p className="text-xs text-white/60">Lokasi toilet (floor, area, QR code, geo-coordinates)</p>
 </div>

 <div className="bg-white/8 rounded-lg p-3 border border-white/15">
 <h4 className="font-semibold text-white text-xs mb-2 flex items-center gap-2">
 <div className="w-2 h-2 bg-red-500 rounded-full"></div>
 inspection_records
 </h4>
 <p className="text-xs text-white/60">Data inspeksi: user_id, location_id, responses (JSON), score, timestamp, photos</p>
 </div>

 <div className="bg-white/8 rounded-lg p-3 border border-white/15">
 <h4 className="font-semibold text-white text-xs mb-2 flex items-center gap-2">
 <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
 inspection_templates
 </h4>
 <p className="text-xs text-white/60">Template checklist inspeksi yang dapat dikustomisasi</p>
 </div>

 <div className="bg-white/8 rounded-lg p-3 border border-white/15">
 <h4 className="font-semibold text-white text-xs mb-2 flex items-center gap-2">
 <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
 photos
 </h4>
 <p className="text-xs text-white/60">Metadata foto: URL Cloudinary, timestamp, geolocation</p>
 </div>

 <div className="bg-white/8 rounded-lg p-3 border border-white/15">
 <h4 className="font-semibold text-white text-xs mb-2 flex items-center gap-2">
 <div className="w-2 h-2 bg-white/80 rounded-full"></div>
 audit_logs
 </h4>
 <p className="text-xs text-white/60">Logging semua aktivitas sistem untuk compliance & tracking</p>
 </div>
 </div>

 <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
 <p className="text-xs text-blue-800">
 <strong>Row Level Security (RLS):</strong> Setiap tabel dilindungi dengan RLS policy untuk memastikan user hanya bisa akses data sesuai role dan organisasi mereka.
 </p>
 </div>
 </Card>

 {/* Authentication & Security */}
 <Card>
 <div className="flex items-start gap-3 mb-4">
 <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
 <Shield className="w-5 h-5 text-indigo-600" />
 </div>
 <div>
 <h3 className="font-bold text-white">Keamanan & Autentikasi</h3>
 <p className="text-sm text-white/50">Enterprise-Grade Security Implementation</p>
 </div>
 </div>

 <div className="space-y-3">
 <div>
 <h4 className="font-semibold text-white text-sm mb-2 flex items-center gap-2">
 <Lock className="w-4 h-4 text-blue-300" />
 Autentikasi
 </h4>
 <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
 <ul className="text-xs text-white/80 space-y-1">
 <li><strong>Provider:</strong> Supabase Authentication (Email/Password)</li>
 <li><strong>Session Management:</strong> JWT-based sessions dengan refresh token</li>
 <li><strong>Persistence:</strong> LocalStorage untuk auth state persistence</li>
 <li><strong>Protected Routes:</strong> Route guards untuk halaman yang memerlukan login</li>
 <li><strong>Auto Logout:</strong> Otomatis logout saat token expired</li>
 </ul>
 </div>
 </div>

 <div>
 <h4 className="font-semibold text-white text-sm mb-2 flex items-center gap-2">
 <Shield className="w-4 h-4 text-green-300" />
 Otorisasi (Role-Based Access Control)
 </h4>
 <div className="space-y-2">
 <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded">
 <p className="font-semibold text-xs text-white mb-1">Super Admin</p>
 <p className="text-xs text-white/60">Full system access, user management, semua organisasi</p>
 </div>
 <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3 rounded">
 <p className="font-semibold text-xs text-white mb-1">Admin</p>
 <p className="text-xs text-white/60">Manage organisasi sendiri, view semua inspeksi, kelola lokasi & user dalam org</p>
 </div>
 <div className="bg-green-50 border-l-4 border-green-500 p-3 rounded">
 <p className="font-semibold text-xs text-white mb-1">User (Inspector)</p>
 <p className="text-xs text-white/60">Lakukan inspeksi, view history sendiri, update profile</p>
 </div>
 </div>
 </div>

 <div>
 <h4 className="font-semibold text-white text-sm mb-2">Security Features</h4>
 <div className="bg-white/8 border border-white/15 rounded-lg p-3">
 <ul className="text-xs text-white/80 space-y-1">
 <li>✓ Row Level Security (RLS) di database level</li>
 <li>✓ API middleware untuk validasi auth token & role checking</li>
 <li>✓ Input validation dengan Zod schema</li>
 <li>✓ XSS protection melalui React's built-in sanitization</li>
 <li>✓ HTTPS-only untuk production</li>
 <li>✓ CORS configuration untuk API endpoints</li>
 <li>✓ Audit logging untuk compliance</li>
 </ul>
 </div>
 </div>
 </div>
 </Card>

 {/* Deployment */}
 <Card>
 <div className="flex items-start gap-3 mb-4">
 <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
 <Globe className="w-5 h-5 text-teal-600" />
 </div>
 <div>
 <h3 className="font-bold text-white">Deployment & Hosting</h3>
 <p className="text-sm text-white/50">Cloud-Based Production Infrastructure</p>
 </div>
 </div>

 <div className="space-y-2">
 <div className="flex items-center justify-between p-3 bg-white/8 rounded-lg border border-white/15">
 <div>
 <p className="font-semibold text-sm text-white">Frontend</p>
 <p className="text-xs text-white/60">Static web hosting</p>
 </div>
 <div className="text-right">
 <p className="text-xs font-medium text-white">Vercel</p>
 <p className="text-xs text-white/50">Global CDN</p>
 </div>
 </div>

 <div className="flex items-center justify-between p-3 bg-white/8 rounded-lg border border-white/15">
 <div>
 <p className="font-semibold text-sm text-white">Backend API</p>
 <p className="text-xs text-white/60">Serverless functions</p>
 </div>
 <div className="text-right">
 <p className="text-xs font-medium text-white">Vercel Functions</p>
 <p className="text-xs text-white/50">Auto-scaling</p>
 </div>
 </div>

 <div className="flex items-center justify-between p-3 bg-white/8 rounded-lg border border-white/15">
 <div>
 <p className="font-semibold text-sm text-white">Database</p>
 <p className="text-xs text-white/60">PostgreSQL managed</p>
 </div>
 <div className="text-right">
 <p className="text-xs font-medium text-white">Supabase</p>
 <p className="text-xs text-white/50">Realtime DB</p>
 </div>
 </div>

 <div className="flex items-center justify-between p-3 bg-white/8 rounded-lg border border-white/15">
 <div>
 <p className="font-semibold text-sm text-white">Image Storage</p>
 <p className="text-xs text-white/60">Media CDN</p>
 </div>
 <div className="text-right">
 <p className="text-xs font-medium text-white">Cloudinary</p>
 <p className="text-xs text-white/50">Global delivery</p>
 </div>
 </div>
 </div>

 <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3">
 <p className="text-xs text-green-800">
 <strong>Production URL:</strong> <a href="https://wc-checks.vercel.app" target="_blank" rel="noopener noreferrer" className="underline">wc-checks.vercel.app</a>
 </p>
 </div>
 </Card>

 {/* Performance & Optimization */}
 <Card>
 <div className="flex items-start gap-3 mb-4">
 <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
 <TrendingUp className="w-5 h-5 text-yellow-600" />
 </div>
 <div>
 <h3 className="font-bold text-white">Performance & Optimization</h3>
 <p className="text-sm text-white/50">Optimized for Speed & Efficiency</p>
 </div>
 </div>

 <div className="space-y-2">
 <div className="flex items-start gap-2">
 <CheckCircle className="w-4 h-4 text-green-300 flex-shrink-0 mt-0.5" />
 <div>
 <p className="text-sm font-medium text-white">Lazy Loading</p>
 <p className="text-xs text-white/60">Code splitting per page, load only what's needed</p>
 </div>
 </div>
 <div className="flex items-start gap-2">
 <CheckCircle className="w-4 h-4 text-green-300 flex-shrink-0 mt-0.5" />
 <div>
 <p className="text-sm font-medium text-white">React Query Caching</p>
 <p className="text-xs text-white/60">Cache data 2-5 menit, reduce API calls</p>
 </div>
 </div>
 <div className="flex items-start gap-2">
 <CheckCircle className="w-4 h-4 text-green-300 flex-shrink-0 mt-0.5" />
 <div>
 <p className="text-sm font-medium text-white">Image Compression</p>
 <p className="text-xs text-white/60">Auto compress foto before upload ke Cloudinary</p>
 </div>
 </div>
 <div className="flex items-start gap-2">
 <CheckCircle className="w-4 h-4 text-green-300 flex-shrink-0 mt-0.5" />
 <div>
 <p className="text-sm font-medium text-white">Optimized Bundle</p>
 <p className="text-xs text-white/60">Tree shaking, minification, terser compression</p>
 </div>
 </div>
 <div className="flex items-start gap-2">
 <CheckCircle className="w-4 h-4 text-green-300 flex-shrink-0 mt-0.5" />
 <div>
 <p className="text-sm font-medium text-white">Mobile Performance</p>
 <p className="text-xs text-white/60">Optimized untuk low-end devices, haptic feedback</p>
 </div>
 </div>
 </div>
 </Card>

 {/* Links */}
 <Card>
 <h3 className="font-bold text-white mb-3">Kontak & Informasi</h3>
 <div className="space-y-2">
 <a
 href="https://wc-checks.vercel.app"
 target="_blank"
 rel="noopener noreferrer"
 className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/8 transition-colors border border-white/15"
 >
 <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
 <Globe className="w-5 h-5 text-blue-300" />
 </div>
 <div>
 <p className="font-medium text-white text-sm">Website</p>
 <p className="text-xs text-white/50">wc-checks.vercel.app</p>
 </div>
 </a>

 <a
 href="mailto:abdulgofur100persen@gmail.com"
 className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/8 transition-colors border border-white/15"
 >
 <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
 <Mail className="w-5 h-5 text-red-300" />
 </div>
 <div>
 <p className="font-medium text-white text-sm">Email</p>
 <p className="text-xs text-white/50">abdulgofur100persen@gmail.com</p>
 </div>
 </a>

 <a
 href="https://github.com/agds-alt"
 target="_blank"
 rel="noopener noreferrer"
 className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/8 transition-colors border border-white/15"
 >
 <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center">
 <Github className="w-5 h-5 text-white" />
 </div>
 <div>
 <p className="font-medium text-white text-sm">GitHub</p>
 <p className="text-xs text-white/50">github.com/agds-alt</p>
 </div>
 </a>
 </div>
 </Card>

 {/* Legal */}
 <Card>
 <div className="text-center text-xs text-white/50 space-y-2">
 <p className="font-medium">© 2025 Proservice Indonesia. All rights reserved.</p>
 <p className="text-xs">Sistem Inspeksi & Monitoring Toilet Terintegrasi - Version 3.0.0</p>
 <div className="flex justify-center gap-4 pt-2">
 <a href="#" className="hover:text-blue-300 transition-colors">Privacy Policy</a>
 <span>•</span>
 <a href="#" className="hover:text-blue-300 transition-colors">Terms of Service</a>
 </div>
 </div>
 </Card>
 </main>

 <div className="lg:hidden"><BottomNav /></div>
 </div>
 );
};
