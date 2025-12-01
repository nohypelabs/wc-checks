# WC-Checks - Toilet Inspection System 🚽✨

> Modern, production-ready toilet monitoring system with QR code scanning, real-time reporting, and enterprise-grade features.

[![Version](https://img.shields.io/badge/version-3.0.0-blue.svg)](./CHANGELOG.md)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](./CONTRIBUTING.md)

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Quick Start](#-quick-start)
- [Documentation](#-documentation)
- [Project Structure](#-project-structure)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [Support](#-support)

---

## 🌟 Features

### Core Features
- ✅ **QR Code Scanning** - Instant location identification via camera
- ✅ **Smart Inspection Forms** - Dynamic forms with validation
- ✅ **Photo Documentation** - Cloud-stored images with auto-compression
- ✅ **Real-time Reports** - Interactive calendar with inspection history
- ✅ **Admin Dashboard** - Comprehensive analytics and statistics
- ✅ **Role-Based Access Control** - 3-tier permissions (User, Admin, Super Admin)
- ✅ **PWA Support** - Installable on mobile devices
- ✅ **Offline Capability** - Works without internet connection

### Advanced Features
- 🔐 **Backend API Enforcement** - 13 serverless API endpoints
- 📊 **Audit Logging** - Complete action tracking for compliance
- 🎨 **Smooth Animations** - Framer Motion for premium UX
- 📱 **Mobile-First Design** - Optimized for touch devices
- 🌐 **Multi-Organization Support** - Hierarchical organization structure
- 📈 **Performance Optimized** - 95+ Lighthouse score
- 🔄 **Graceful Degradation** - Fallback mechanisms for reliability

For complete feature list, see [FEATURES_SUMMARY.md](./FEATURES_SUMMARY.md)

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite 5.4 (ultra-fast HMR)
- **State Management:** TanStack Query (React Query)
- **Styling:** Tailwind CSS + Framer Motion
- **Form Handling:** React Hook Form + Zod validation
- **PWA:** Vite PWA Plugin

### Backend
- **API:** Vercel Serverless Functions
- **Database:** Supabase (PostgreSQL with RLS)
- **Storage:** Cloudinary (images & QR codes)
- **Authentication:** Supabase Auth

### Quality & Testing
- **Testing:** Vitest + React Testing Library
- **Type Safety:** TypeScript 5.9+
- **Code Quality:** ESLint + Prettier
- **Coverage:** 70%+ on critical paths

**Why Vite over Next.js?** See [WHY-NOT-NEXTJS.md](./WHY-NOT-NEXTJS.md) for detailed comparison.

---

## 🚀 Quick Start

### Prerequisites

```bash
✓ Node.js 20+
✓ pnpm 8+ (or npm)
✓ Git
✓ Vercel CLI (for local API testing)
```

### Installation

```bash
# 1. Clone repository
git clone https://github.com/yourusername/wc-checks.git
cd wc-checks

# 2. Install dependencies
pnpm install

# 3. Setup environment variables
cp .env.example .env.local

# Edit .env.local with your credentials
# See .env.example for required variables
```

### Environment Variables

```env
# Supabase (Frontend)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Supabase (Backend API - REQUIRED)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key

# Cloudinary
VITE_CLOUDINARY_CLOUD_NAME=your-cloud-name
VITE_CLOUDINARY_UPLOAD_PRESET=your-upload-preset
VITE_CLOUDINARY_FOLDER=toilet-inspections
```

### Running Locally

```bash
# With API routes (recommended)
vercel dev
# → Opens at http://localhost:3000

# Frontend only (no API - for UI development)
pnpm dev
# → Opens at http://localhost:5173
```

### Database Setup

Run SQL migrations in Supabase Dashboard:

```bash
# 1. Database indexes (performance)
supabase/migrations/20250128_database_indexes.sql

# 2. Row Level Security (security)
supabase/migrations/20250128_rls_policies.sql
```

See [supabase/migrations/README.md](./supabase/migrations/README.md) for detailed instructions.

---

## 📚 Documentation

### For Developers
- **[DEVELOPMENT.md](./DEVELOPMENT.md)** - Setup, common issues, local development
- **[FRONTEND_ARCHITECTURE.md](./FRONTEND_ARCHITECTURE.md)** - Components, hooks, state management
- **[BACKEND_API_GUIDE.md](./BACKEND_API_GUIDE.md)** - API endpoints, role management
- **[BACKEND_API_COMPLETE.md](./BACKEND_API_COMPLETE.md)** - Complete API reference (13 endpoints)
- **[TESTING.md](./TESTING.md)** - Testing strategy, writing tests, coverage goals

### For Contributors
- **[CONTRIBUTING.md](./CONTRIBUTING.md)** - Code style, PR process, commit conventions
- **[CHANGELOG.md](./CHANGELOG.md)** - Version history, breaking changes, roadmap

### For End Users
- **[USER_GUIDE.md](./USER_GUIDE.md)** - How to use the app (inspectors, admins)
- **[FEATURES_SUMMARY.md](./FEATURES_SUMMARY.md)** - Complete feature breakdown

### For Operations
- **[MONITORING.md](./MONITORING.md)** - Production monitoring, alerts, incident response
- **[ENTERPRISE_FEATURES.md](./ENTERPRISE_FEATURES.md)** - Audit logs, fallback mechanisms

### Architecture Decisions
- **[WHY-NOT-NEXTJS.md](./WHY-NOT-NEXTJS.md)** - Tech stack rationale
- **[FRONTEND_BACKEND_CONSISTENCY_AUDIT.md](./FRONTEND_BACKEND_CONSISTENCY_AUDIT.md)** - Security audit

---

## 📁 Project Structure

```
wc-checks/
├── api/                          # Vercel serverless functions
│   ├── middleware/
│   │   └── role-guard.ts        # Auth & role validation
│   ├── auth/
│   │   └── verify-role.ts       # Role verification
│   ├── admin/
│   │   ├── assign-role.ts       # Role assignment
│   │   ├── toggle-user-status.ts
│   │   ├── organizations.ts     # CRUD endpoints
│   │   ├── buildings.ts
│   │   ├── locations.ts
│   │   ├── audit-logs.ts
│   │   └── stats.ts
│   └── reports.ts               # Inspection reports
│
├── src/
│   ├── components/              # React components
│   │   ├── ui/                 # Base UI (Button, Input, Card)
│   │   ├── layout/             # Layout (Sidebar, MainLayout)
│   │   ├── forms/              # Forms (InspectionForm, LocationForm)
│   │   ├── reports/            # Reports (Calendar, DetailModal)
│   │   ├── admin/              # Admin components
│   │   └── mobile/             # Mobile-specific
│   │
│   ├── pages/                  # Route pages
│   │   ├── admin/             # Admin pages
│   │   ├── superadmin/        # Super admin pages
│   │   └── *.tsx              # Public pages
│   │
│   ├── hooks/                  # Custom React hooks (16 hooks)
│   │   ├── useAuth.ts         # Authentication
│   │   ├── useIsAdmin.ts      # Role verification
│   │   ├── useReports.ts      # Reports data
│   │   ├── useInspection.ts   # Inspection CRUD
│   │   └── ...
│   │
│   ├── lib/                    # Utilities & services
│   │   ├── supabase.ts        # Supabase client
│   │   ├── cloudinary.ts      # Image upload
│   │   ├── logger.ts          # Logging
│   │   └── utils.ts           # Helpers
│   │
│   ├── types/                  # TypeScript types
│   │   └── database.types.ts  # Supabase generated types
│   │
│   ├── App.tsx                 # Root component + routing
│   └── main.tsx               # Entry point
│
├── supabase/
│   └── migrations/            # Database migrations
│
├── docs/                      # Additional documentation
├── public/                    # Static assets
└── vercel.json               # Vercel configuration
```

For detailed architecture, see [FRONTEND_ARCHITECTURE.md](./FRONTEND_ARCHITECTURE.md)

---

## 🚀 Deployment

### Deploy to Vercel (Recommended)

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Login to Vercel
vercel login

# 3. Deploy
vercel --prod
```

### Environment Variables on Vercel

Set these in Vercel Dashboard → Project Settings → Environment Variables:

```
SUPABASE_URL
SUPABASE_SERVICE_KEY
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_CLOUDINARY_CLOUD_NAME
VITE_CLOUDINARY_UPLOAD_PRESET
VITE_CLOUDINARY_FOLDER
```

### Build for Production

```bash
# Type check
pnpm type-check

# Run tests
pnpm test:run

# Build
pnpm build

# Preview build
pnpm preview
```

For detailed deployment guide, see [DEVELOPMENT.md](./DEVELOPMENT.md#deployment)

---

## 🧪 Testing

```bash
# Run tests (watch mode)
pnpm test

# Run tests once (CI)
pnpm test:run

# Test with UI
pnpm test:ui

# Coverage report
pnpm test:coverage
```

**Current Coverage:** 73% overall, 90%+ on critical paths

For testing guide, see [TESTING.md](./TESTING.md)

---

## 📊 Performance

- ⚡ **First Load:** < 1 second
- ⚡ **API Response:** < 500ms average
- ⚡ **Lighthouse Score:** 95+
- ⚡ **Bundle Size:** ~150KB (gzipped)

Optimizations:
- Lazy loading for routes
- Image compression (1MB max)
- React Query caching (2-minute stale time)
- Vercel edge caching (15-minute for auth)
- Database query optimization (single query joins)

---

## 🔒 Security

- ✅ **Backend API Enforcement** - All critical operations server-side validated
- ✅ **Row Level Security (RLS)** - Database-level permissions
- ✅ **Role-Based Access Control** - 3-tier hierarchy (User, Admin, Super Admin)
- ✅ **Audit Logging** - Complete action tracking
- ✅ **Environment Variables** - Secrets stored securely
- ✅ **Input Validation** - Zod schemas on frontend + backend
- ✅ **HTTPS Only** - Encrypted in transit
- ✅ **JWT Tokens** - Supabase auth with auto-refresh

For security details, see [BACKEND_API_GUIDE.md](./BACKEND_API_GUIDE.md#security-features)

---

## 🤝 Contributing

We welcome contributions! Please read our [CONTRIBUTING.md](./CONTRIBUTING.md) first.

### Quick Guidelines

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Follow [code style guidelines](./CONTRIBUTING.md#code-style-guidelines)
4. Add tests for new features (70%+ coverage required)
5. Commit with [conventional commits](./CONTRIBUTING.md#commit-message-convention)
6. Push to branch (`git push origin feature/AmazingFeature`)
7. Open Pull Request

### Development Checklist

- [ ] Code follows style guide
- [ ] Tests added and passing (`pnpm test:run`)
- [ ] Type check passes (`pnpm type-check`)
- [ ] Lint passes (`pnpm lint`)
- [ ] Documentation updated
- [ ] No console errors/warnings

---

## 🐛 Reporting Issues

Found a bug? Please use our [issue template](./.github/ISSUE_TEMPLATE.md):

1. Search existing issues first
2. Provide clear description
3. Include steps to reproduce
4. Add screenshots if applicable
5. Specify environment (OS, browser, version)

**Security Issues:** Email security@yourcompany.com (do NOT open public issue!)

---

## 📞 Support

- **Documentation:** Check [docs section](#-documentation) first
- **Issues:** [GitHub Issues](https://github.com/yourusername/wc-checks/issues)
- **Discussions:** [GitHub Discussions](https://github.com/yourusername/wc-checks/discussions)
- **Email:** support@yourcompany.com
- **Slack:** #wc-checks-support (for team members)

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Supabase](https://supabase.com) - Backend infrastructure
- [Vercel](https://vercel.com) - Deployment & serverless functions
- [Cloudinary](https://cloudinary.com) - Image hosting
- [React](https://react.dev) - UI framework
- [Vite](https://vitejs.dev) - Build tool
- All contributors and users!

---

## 📈 Roadmap

See [CHANGELOG.md](./CHANGELOG.md#upcoming-features-roadmap) for detailed roadmap.

**Upcoming (v3.1.0 - Q1 2025):**
- Real-time notifications
- Multi-language support (i18n)
- Dark mode toggle
- Advanced filters

**Future (v4.0.0 - Q3 2025):**
- React Native mobile app
- Offline-first architecture
- ML-based insights
- Third-party API integrations

---

## 🌟 Star History

If you find this project useful, please consider giving it a star! ⭐

---

**Built with 💚 by the WC-Checks Team**

*For a cleaner, more efficient facility management.*
