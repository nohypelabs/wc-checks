# WC Check - Toilet Monitoring System

Sistem monitoring kebersihan toilet yang efektif, efisien, dan mudah digunakan dengan teknologi QR Code scanning dan pelaporan real-time.

## 🌟 Features

### Core Features
- **QR Code Scanning** - Scan QR code lokasi toilet untuk memulai inspeksi
- **Auto-Generated QR Codes** - Generate QR code otomatis untuk setiap lokasi toilet
- **Smart Checklist** - UI checklist yang user-friendly dengan swipeable cards
- **Photo Documentation** - Upload foto dengan timestamp otomatis (max 3 foto, min 1 foto)
- **Real-time Calendar** - Lihat hasil inspeksi dalam tampilan kalender interaktif
- **Location Management** - CRUD lokasi toilet dengan auto-generate QR
- **User Management** - Multi-role system (Super Admin, Admin, User)
- **PWA Support** - Installable sebagai aplikasi mobile
- **Offline Capability** - Bekerja offline dengan service worker

### UI/UX Features
- Mobile-first responsive design seperti Livin Mandiri
- Warna tema hijau muda yang menenangkan
- Bottom navigation dengan QR scanner di tengah
- Swipeable cards untuk checklist
- Haptic feedback pada interaksi
- Smooth animations dengan Framer Motion

## 🚀 Tech Stack

- **Frontend Framework:** React 18 + Vite (chose Vite over Next.js for faster HMR, see WHY-NOT-NEXTJS.md)
- **Language:** TypeScript
- **Backend:** Vercel Serverless Functions (13 API endpoints)
- **Database:** Supabase (PostgreSQL) with Row-Level Security
- **Storage:** Cloudinary (untuk foto dan QR codes)
- **Styling:** Tailwind CSS
- **State Management:** Zustand + React Query
- **Form Handling:** React Hook Form + Zod validation
- **QR Scanner:** html5-qrcode
- **QR Generator:** qrcode
- **Date Handling:** date-fns
- **Animation:** Framer Motion
- **PWA:** Vite PWA Plugin

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/toilet-monitoring-app.git
   cd toilet-monitoring-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` dengan kredensial Anda:
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

   # Cloudinary
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
   NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret

   # App
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Run development server**

   **IMPORTANT:** This project uses Vercel serverless functions for the API. You must use `vercel dev` to run both the frontend AND backend:

   ```bash
   # Install Vercel CLI globally (first time only)
   npm install -g vercel

   # Run with Vercel dev server (starts both frontend + API)
   vercel dev
   ```

   **OR** if you only want to run the frontend (API calls will fail):
   ```bash
   npm run dev
   ```

   Buka [http://localhost:3000](http://localhost:3000) (Vercel Dev)

   atau [http://localhost:5174](http://localhost:5174) (Vite only, no API)

## 🗄️ Database Setup

### Supabase Tables Required:

1. **users** - User management
2. **roles** - Role definitions
3. **user_roles** - User-role mapping
4. **locations** - Toilet locations
5. **inspection_templates** - Checklist templates
6. **inspection_records** - Inspection results
7. **photos** - Photo storage records

### Initial Roles Setup:
```sql
INSERT INTO roles (name, level, display_name) VALUES
('super_admin', 'super_admin', 'Super Admin'),
('admin', 'admin', 'Admin'),
('user', 'user', 'User');
```

### Default Template:
```sql
INSERT INTO inspection_templates (id, name, fields, is_default) VALUES
('default-template-001', 'Template Standar Toilet', '{}', true);
```

## 📱 User Flow

1. **Login/Register** → User masuk atau mendaftar
2. **Dashboard** → Melihat statistik dan lokasi yang perlu inspeksi
3. **Scan QR** → Scan QR code di lokasi toilet
4. **Checklist** → Isi checklist dengan swipe cards UI
5. **Upload Foto** → Ambil minimal 1 foto (max 3) dengan timestamp
6. **Submit** → Data tersimpan ke database
7. **Report** → Lihat hasil dalam kalender atau list view

## 🎨 Project Structure

```
src/
├── app/                    # Next.js pages (App Router)
│   ├── page.tsx           # Dashboard
│   ├── login/             # Auth pages
│   ├── scan/              # QR Scanner
│   ├── toilets/           # Inspection pages
│   ├── locations/         # Location management
│   ├── history/           # Calendar & history
│   └── profile/           # User profile
│
├── features/              # Feature modules (Clean Architecture)
│   ├── toilets/          # Toilet inspection feature
│   │   ├── api.ts        # API functions
│   │   ├── types.ts      # TypeScript types
│   │   ├── hooks.ts      # React hooks
│   │   └── components/   # Feature components
│   ├── locations/        # Location management
│   ├── templates/        # Template management
│   └── users/            # User management
│
├── components/           # Shared UI components
│   ├── BottomNavigation.tsx
│   └── ui/              # Reusable UI components
│
├── lib/                 # Core utilities
│   ├── supabaseClient.ts
│   └── utils.ts
│
├── config/              # App configuration
│   └── constants.ts
│
└── types/               # Global TypeScript types
    └── database.types.ts
```

## 🔑 Key Components

### Toilet Checklist Items (11 items)
1. Kebersihan Lantai
2. Kebersihan Dinding
3. Kebersihan Toilet/Kloset
4. Kebersihan Wastafel
5. Ketersediaan Tissue
6. Ketersediaan Sabun
7. Ketersediaan Hand Sanitizer
8. Kondisi Cermin
9. Bau Ruangan
10. Kondisi Pencahayaan
11. Kondisi Pintu & Kunci

### Scoring System
- **90-100%**: Sangat Baik 🌟
- **75-89%**: Baik 😊
- **60-74%**: Cukup 😐
- **40-59%**: Buruk 😟
- **0-39%**: Kritis 🚨

## 🚀 Deployment

### Build for production:
```bash
npm run build
npm run start
```

### Deploy to Vercel:
```bash
vercel
```

### Environment Variables on Production:
Pastikan semua environment variables di-set di platform deployment Anda.

## 📈 Performance Optimizations

- Image compression sebelum upload
- Lazy loading untuk komponen berat
- PWA dengan service worker untuk offline support
- Optimized bundle dengan Next.js automatic code splitting
- CDN untuk static assets via Cloudinary

## 🔒 Security

- Supabase Row Level Security (RLS)
- Environment variables untuk sensitive data
- Input validation dan sanitization
- Secure image upload dengan Cloudinary signed uploads

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Developer

Developed with 💚 for effective toilet monitoring system.

## 📞 Support

Untuk pertanyaan atau dukungan, silakan buka issue di GitHub repository.

---

**Note:** Pastikan Anda telah setup Supabase dan Cloudinary sebelum menjalankan aplikasi. Demo account tersedia di halaman login untuk testing.