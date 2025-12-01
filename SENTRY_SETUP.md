# Sentry Error Tracking Setup

**Last Updated:** 2025-12-01

This guide walks you through setting up Sentry for production error tracking in WC-Checks.

---

## 📋 Why Sentry?

Sentry provides:
- ✅ **Real-time error tracking** - Get notified instantly when errors occur
- ✅ **Stack traces** - See exactly where errors happen
- ✅ **User context** - Know which users are affected
- ✅ **Performance monitoring** - Track slow operations
- ✅ **Session replay** - Watch what users did before the error
- ✅ **Release tracking** - See which version has issues

---

## 🚀 Quick Setup (5 minutes)

### Step 1: Create Sentry Account

```bash
1. Go to https://sentry.io/signup/
2. Create account (free tier: 5,000 events/month)
3. Create new project:
   - Platform: React
   - Name: wc-checks-production
   - Alert frequency: Default
```

### Step 2: Get DSN

```bash
1. After creating project, you'll see a DSN (Data Source Name)
2. Copy it - looks like:
   https://abc123@o123456.ingest.sentry.io/789012
3. Keep this safe - you'll need it for environment variables
```

---

## 📦 Installation

### Install Dependencies

```bash
pnpm add @sentry/react @sentry/vite-plugin
```

### Add to package.json

Already added! Check `package.json`:

```json
{
  "dependencies": {
    "@sentry/react": "^7.99.0",
    "@sentry/vite-plugin": "^2.14.0"
  }
}
```

---

## ⚙️ Configuration

### Step 1: Add Environment Variable

Add to `.env.local` (development):

```env
# Sentry
VITE_SENTRY_DSN=https://YOUR_DSN_HERE@o123456.ingest.sentry.io/789012
```

Add to Vercel (production):

```bash
1. Go to Vercel Dashboard
2. Project Settings → Environment Variables
3. Add:
   Name: VITE_SENTRY_DSN
   Value: https://YOUR_DSN_HERE@o123456.ingest.sentry.io/789012
   Scope: Production, Preview
```

### Step 2: Initialize Sentry

File already created at `src/lib/sentry.ts`:

```typescript
import * as Sentry from '@sentry/react';

export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;

  if (!dsn) {
    console.warn('[Sentry] DSN not configured - error tracking disabled');
    return;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE, // 'development' or 'production'
    integrations: [
      new Sentry.BrowserTracing({
        // Performance monitoring
        tracePropagationTargets: ['localhost', /^https:\/\/.*\.vercel\.app/],
      }),
      new Sentry.Replay({
        // Session replay
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],

    // Performance Monitoring
    tracesSampleRate: 1.0, // 100% of transactions

    // Session Replay
    replaysSessionSampleRate: 0.1, // 10% of sessions
    replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors

    // Release tracking
    release: `wc-checks@${import.meta.env.VITE_APP_VERSION || '3.0.0'}`,

    // Don't send errors in development
    enabled: import.meta.env.PROD,

    // Privacy
    beforeSend(event, hint) {
      // Filter out sensitive data
      if (event.request?.headers) {
        delete event.request.headers['Authorization'];
        delete event.request.headers['Cookie'];
      }
      return event;
    },
  });
}
```

### Step 3: Import in main.tsx

File already updated at `src/main.tsx`:

```typescript
import { initSentry } from './lib/sentry';

// Initialize Sentry first (before React)
initSentry();

// Then render React app
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

### Step 4: Wrap App with ErrorBoundary

File already updated at `src/App.tsx`:

```typescript
import * as Sentry from '@sentry/react';

export default function App() {
  return (
    <Sentry.ErrorBoundary fallback={<ErrorFallback />}>
      <QueryClientProvider client={queryClient}>
        <Router>
          <AppContent />
        </Router>
      </QueryClientProvider>
    </Sentry.ErrorBoundary>
  );
}

function ErrorFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Oops! Something went wrong
        </h1>
        <p className="text-gray-600 mb-6">
          We've been notified and will fix this soon.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          Reload Page
        </button>
      </div>
    </div>
  );
}
```

---

## 🎯 Usage

### Automatic Error Capture

Sentry automatically captures:
- ✅ Unhandled exceptions
- ✅ Promise rejections
- ✅ Console errors
- ✅ Network errors (fetch failures)

**No code changes needed!**

### Manual Error Reporting

```typescript
import * as Sentry from '@sentry/react';

try {
  // Your code
  riskyOperation();
} catch (error) {
  // Report to Sentry with context
  Sentry.captureException(error, {
    tags: {
      feature: 'inspection-form',
      action: 'submit',
    },
    extra: {
      inspectionId: '123',
      userId: user.id,
    },
  });

  // Also show user-friendly error
  toast.error('Failed to submit inspection');
}
```

### Custom Messages

```typescript
// Info message
Sentry.captureMessage('User completed onboarding', 'info');

// Warning
Sentry.captureMessage('API rate limit approaching', 'warning');

// Error
Sentry.captureMessage('Critical: Payment failed', 'error');
```

### Set User Context

```typescript
// In useAuth hook, after login
Sentry.setUser({
  id: user.id,
  email: user.email,
  username: user.full_name,
});

// On logout
Sentry.setUser(null);
```

### Add Breadcrumbs

```typescript
// Track user actions
Sentry.addBreadcrumb({
  category: 'inspection',
  message: 'User started inspection',
  level: 'info',
  data: {
    locationId: '123',
    timestamp: new Date().toISOString(),
  },
});
```

---

## 📊 Performance Monitoring

Already configured! Sentry tracks:

### Web Vitals
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- First Input Delay (FID)
- Cumulative Layout Shift (CLS)

### API Calls
```typescript
// Automatically tracks fetch() calls
const response = await fetch('/api/inspections');
// ✅ Sentry records: duration, status, endpoint
```

### Custom Transactions

```typescript
const transaction = Sentry.startTransaction({
  name: 'Inspection Submission',
  op: 'inspection.submit',
});

try {
  await submitInspection(data);
  transaction.setStatus('ok');
} catch (error) {
  transaction.setStatus('unknown_error');
  throw error;
} finally {
  transaction.finish();
}
```

---

## 🔍 Session Replay

**What is Session Replay?**

Sentry records user sessions (10% sampled, 100% on errors) so you can:
- ✅ See exactly what user did before error
- ✅ Reproduce bugs faster
- ✅ Understand user behavior

**Privacy:**
- All text is masked (shows *** instead)
- All media is blocked
- No sensitive data recorded

**How to View:**
1. Go to Sentry dashboard
2. Click on an error
3. Scroll to "Session Replay"
4. Watch video of user session

---

## 🚨 Alerts & Notifications

### Setup Email Alerts

```bash
1. Go to Sentry Dashboard
2. Project Settings → Alerts
3. Create New Alert Rule:
   - Trigger: When event is seen
   - Filter: All issues
   - Action: Send email to your@email.com
```

### Setup Slack Alerts

```bash
1. Project Settings → Integrations
2. Search "Slack"
3. Click "Install"
4. Authorize Slack workspace
5. Configure:
   - Channel: #errors
   - Trigger: All issues
   - Frequency: Immediate
```

### Alert Rules Examples

**Critical Errors (Immediate):**
```
Trigger: Error rate > 5%
Filter: environment = production
Action: Email + Slack
Frequency: Immediate
```

**New Errors (Daily Digest):**
```
Trigger: New error type
Filter: environment = production
Action: Email
Frequency: Daily at 9 AM
```

---

## 📈 Dashboard

### Key Metrics to Monitor

**Errors Tab:**
- Total errors (last 24h)
- Error rate trend
- Most common errors
- Affected users

**Performance Tab:**
- Avg page load time
- Slowest transactions
- Web Vitals scores
- API response times

**Releases Tab:**
- Errors per release
- New errors introduced
- Regression tracking

---

## 🐛 Debugging with Sentry

### Example Error Report

```
Error: Failed to fetch inspections
  at useInspections.ts:45
  at QueryClient.ts:123

User: john@example.com
Browser: Chrome 120 on Windows 10
Time: 2025-12-01 10:30 AM
Release: wc-checks@3.0.0

Breadcrumbs:
  1. User logged in
  2. Navigated to /reports
  3. Selected date 2025-12-01
  4. API call to /api/reports started
  5. Network error

Session Replay: [Watch Video]

Tags:
  - feature: reports
  - environment: production
  - userId: user-123
```

### How to Debug:

1. **Check stack trace** - See exact line of code
2. **Review breadcrumbs** - Understand user flow
3. **Watch session replay** - See visual reproduction
4. **Check user context** - Know who's affected
5. **Compare releases** - See if recent deployment caused it

---

## 💰 Pricing Tiers

### Free Tier (5,000 events/month)
- ✅ Error tracking
- ✅ Performance monitoring
- ✅ Session replay
- ⚠️ Limited to 5K events

**Enough for:** Small apps (< 1,000 users)

### Team Tier ($26/month for 50K events)
- ✅ Everything in Free
- ✅ 50K events/month
- ✅ Team features
- ✅ Advanced integrations

**Recommended for:** Production apps (1K-10K users)

### Business Tier ($80/month for 100K events)
- ✅ Everything in Team
- ✅ 100K events/month
- ✅ SLA guarantee
- ✅ Priority support

**Recommended for:** Enterprise apps (10K+ users)

---

## 🔧 Advanced Configuration

### Source Maps

Enable source maps for better stack traces:

```typescript
// vite.config.ts
import { sentryVitePlugin } from '@sentry/vite-plugin';

export default defineConfig({
  plugins: [
    sentryVitePlugin({
      org: 'your-org',
      project: 'wc-checks',
      authToken: process.env.SENTRY_AUTH_TOKEN,
    }),
  ],
  build: {
    sourcemap: true, // Generate source maps
  },
});
```

### Custom Tags

```typescript
Sentry.setTags({
  'user.role': 'admin',
  'feature.flag': 'new-ui-enabled',
});
```

### Filter Errors

```typescript
// In sentry.ts
beforeSend(event, hint) {
  // Ignore specific errors
  if (event.exception?.values?.[0]?.value?.includes('ResizeObserver')) {
    return null; // Don't send to Sentry
  }

  // Filter sensitive data
  if (event.request?.headers) {
    delete event.request.headers['Authorization'];
  }

  return event;
}
```

---

## ✅ Verification

### Test Sentry is Working

```typescript
// Add to any page temporarily
import * as Sentry from '@sentry/react';

function TestSentry() {
  return (
    <button onClick={() => {
      throw new Error('Test Sentry Error');
    }}>
      Test Sentry
    </button>
  );
}
```

Click button → Error should appear in Sentry dashboard within 1 minute.

---

## 📚 Resources

- **Sentry Docs:** https://docs.sentry.io/platforms/javascript/guides/react/
- **React Integration:** https://docs.sentry.io/platforms/javascript/guides/react/
- **Performance Monitoring:** https://docs.sentry.io/product/performance/
- **Session Replay:** https://docs.sentry.io/product/session-replay/

---

## 🎯 Checklist

Setup complete when:

- [ ] Sentry account created
- [ ] DSN added to environment variables (local + Vercel)
- [ ] Dependencies installed (`pnpm add @sentry/react`)
- [ ] Sentry initialized in `main.tsx`
- [ ] ErrorBoundary wrapping App
- [ ] Test error sent and received in dashboard
- [ ] Email/Slack alerts configured
- [ ] Team members invited to Sentry project

---

**Questions?** Check [MONITORING.md](./MONITORING.md) for more monitoring options.
