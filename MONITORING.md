# Production Monitoring Guide - WC-Checks

**Version:** 3.0.0
**Last Updated:** 2025-12-01

This guide covers monitoring, observability, and incident response for WC-Checks in production.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Health Check Endpoints](#health-check-endpoints)
- [Logging Strategy](#logging-strategy)
- [Error Tracking](#error-tracking)
- [Performance Monitoring](#performance-monitoring)
- [Uptime Monitoring](#uptime-monitoring)
- [Database Monitoring](#database-monitoring)
- [Alerts & Notifications](#alerts--notifications)
- [Incident Response](#incident-response)
- [Metrics Dashboard](#metrics-dashboard)

---

## 🎯 Overview

### Monitoring Philosophy

```
┌────────────────────────────────────────┐
│    The Four Golden Signals             │
├────────────────────────────────────────┤
│  1. Latency - How fast?                │
│  2. Traffic - How much?                 │
│  3. Errors - How many failures?         │
│  4. Saturation - How full?              │
└────────────────────────────────────────┘
```

### Monitoring Stack

| Component | Tool | Purpose |
|-----------|------|---------|
| **Application Monitoring** | Vercel Analytics | Performance, traffic |
| **Uptime Monitoring** | UptimeRobot / Pingdom | Service availability |
| **Database Monitoring** | Supabase Dashboard | Query performance, connections |
| **Error Tracking** | Sentry / Vercel Logs | Exception tracking |
| **Health Checks** | Custom `/api/health` | Service status |
| **Audit Logs** | Database + UI | User actions, security |

---

## 🏥 Health Check Endpoints

### 1. **Backend Health Check**

```bash
GET /api/health
```

**Response:**
```json
{
  "success": true,
  "message": "API is healthy",
  "timestamp": "2025-12-01T10:30:00Z",
  "env": {
    "hasSupabaseUrl": true,
    "hasServiceKey": true
  }
}
```

**Monitoring Setup:**

```bash
# UptimeRobot Monitor
URL: https://your-app.vercel.app/api/health
Method: GET
Interval: 5 minutes
Expected: HTTP 200 + {"success": true}

# Alert if:
- HTTP status != 200
- Response time > 5 seconds
- Response doesn't contain "success": true
```

---

### 2. **Frontend Health Check**

```bash
GET /
```

**Expected:**
- HTTP 200 status
- HTML page loads (< 2 seconds)
- No JavaScript errors in console

**Monitoring Setup:**

```bash
# Pingdom Monitor
URL: https://your-app.vercel.app
Method: GET
Interval: 5 minutes
Response time: < 2000ms

# Alert if:
- Page doesn't load
- Response time > 5 seconds
- Contains error keywords: "500", "Error", "Failed"
```

---

### 3. **Database Health Check**

```bash
# Manual check via Supabase Dashboard
# Or automated check via custom endpoint
GET /api/admin/db-health
```

**Check:**
- Connection pool status
- Active connections
- Slow query log
- Database size

---

## 📊 Logging Strategy

### Log Levels

```
┌─────────────────────────────────────┐
│  ERROR   - Production issues only   │
│  WARN    - Potential issues          │
│  INFO    - Important events          │
│  DEBUG   - Development only          │
└─────────────────────────────────────┘
```

### Frontend Logging

```typescript
// lib/logger.ts
export const logger = {
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${message}`, error);
    // Send to error tracking service (Sentry)
  },

  warn: (message: string, data?: any) => {
    console.warn(`[WARN] ${message}`, data);
  },

  info: (message: string, data?: any) => {
    if (import.meta.env.DEV) {
      console.log(`[INFO] ${message}`, data);
    }
  },

  debug: (message: string, data?: any) => {
    if (import.meta.env.DEV) {
      console.debug(`[DEBUG] ${message}`, data);
    }
  },
};
```

**Usage:**
```typescript
logger.error('Failed to fetch inspections', error);
logger.warn('User role not found, using default');
logger.info('App initialized', { version: '3.0.0' });
logger.debug('Component rendered', { props });
```

---

### Backend Logging

```typescript
// api/middleware/role-guard.ts
console.log('[validateAuth] User authenticated:', userId);
console.error('[validateAuth] Token expired');
console.warn('[validateAuth] Insufficient permissions');
```

**Viewing Logs:**

```bash
# Vercel Dashboard
1. Go to https://vercel.com/dashboard
2. Select project
3. Click "Logs" tab
4. Filter by:
   - Time range
   - Serverless function
   - Error level
```

**Log Retention:**
- Free plan: 1 day
- Pro plan: 7 days
- Enterprise: 30+ days

---

## 🐛 Error Tracking

### Recommended: Sentry Integration

#### **Setup:**

```bash
pnpm add @sentry/react @sentry/vite-plugin
```

```typescript
// src/main.tsx
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  tracesSampleRate: 1.0, // 100% of transactions
  replaysSessionSampleRate: 0.1, // 10% of sessions
  replaysOnErrorSampleRate: 1.0, // 100% of errors
});
```

---

### Manual Error Tracking

**Frontend Errors:**

```typescript
// components/ErrorBoundary.tsx
export class ErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to backend or Sentry
    fetch('/api/log-error', {
      method: 'POST',
      body: JSON.stringify({
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      }),
    });
  }
}
```

**Backend Errors:**

```typescript
// api/middleware/error-handler.ts
export function handleError(error: Error, req: VercelRequest) {
  console.error('[API Error]', {
    path: req.url,
    method: req.method,
    error: error.message,
    stack: error.stack,
  });

  // Send to error tracking service
  // await sendToSentry(error);
}
```

---

## ⚡ Performance Monitoring

### Vercel Analytics

**Setup:**

```bash
pnpm add @vercel/analytics
```

```typescript
// src/main.tsx
import { Analytics } from '@vercel/analytics/react';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <Analytics />
  </React.StrictMode>
);
```

**Metrics Tracked:**
- ✅ Page load time (FCP, LCP, FID, CLS)
- ✅ API response time
- ✅ Geographic distribution
- ✅ Device types
- ✅ Bounce rate

**Viewing:**
1. Go to Vercel Dashboard
2. Select project
3. Click "Analytics" tab

---

### Custom Performance Monitoring

```typescript
// hooks/usePerformance.ts
export function usePerformance() {
  useEffect(() => {
    // Measure page load time
    const perfData = performance.getEntriesByType('navigation')[0];
    const loadTime = perfData.loadEventEnd - perfData.fetchStart;

    // Log if slow
    if (loadTime > 3000) {
      logger.warn('Slow page load', { loadTime });
    }
  }, []);
}
```

---

### Web Vitals Tracking

```typescript
// src/main.tsx
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function sendToAnalytics(metric: any) {
  // Send to analytics service
  fetch('/api/analytics', {
    method: 'POST',
    body: JSON.stringify(metric),
  });
}

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

**Target Metrics:**
- FCP (First Contentful Paint): < 1.8s
- LCP (Largest Contentful Paint): < 2.5s
- FID (First Input Delay): < 100ms
- CLS (Cumulative Layout Shift): < 0.1

---

## 🔔 Uptime Monitoring

### Recommended Tools

#### **Option 1: UptimeRobot (Free)**

**Setup:**
1. Go to https://uptimerobot.com
2. Add New Monitor:
   - Type: HTTP(s)
   - URL: `https://your-app.vercel.app/api/health`
   - Interval: 5 minutes
3. Add Alert Contacts:
   - Email
   - Slack
   - SMS (paid)

**Monitor:**
- API health endpoint
- Frontend homepage
- Database connectivity

---

#### **Option 2: Pingdom**

**Setup:**
1. Go to https://pingdom.com
2. Create Uptime Check
3. Configure:
   - URL to monitor
   - Check interval: 1-5 minutes
   - Alert channels: Email, SMS, Slack

**Advanced Features:**
- Transaction monitoring (multi-step flows)
- Real browser testing
- Performance tracking

---

### Status Page

**Recommended: Statuspage.io**

**Setup:**
1. Create status page (e.g., `status.yourcompany.com`)
2. Add components:
   - Web Application
   - API Services
   - Database
   - Image Storage (Cloudinary)
3. Connect to monitors
4. Enable subscriber notifications

**Benefits:**
- ✅ Public transparency
- ✅ Automated updates
- ✅ Historical uptime data
- ✅ Incident communication

---

## 🗄️ Database Monitoring

### Supabase Dashboard

**Key Metrics to Monitor:**

1. **Database Load**
   - Active connections (Max: 100 on free tier)
   - Idle connections
   - Connection pool saturation

2. **Query Performance**
   - Slow queries (> 1 second)
   - Most frequent queries
   - Table sizes

3. **API Usage**
   - Requests per minute
   - Data transfer
   - API errors

**Access:**
```
1. Go to https://supabase.com/dashboard
2. Select project
3. Click "Database" → "Database Health"
```

---

### Database Alerts

**Monitor:**

```sql
-- Check connection count
SELECT count(*) FROM pg_stat_activity;
-- Alert if > 80 (80% of max 100)

-- Check long-running queries
SELECT pid, now() - pg_stat_activity.query_start AS duration, query
FROM pg_stat_activity
WHERE state = 'active' AND now() - pg_stat_activity.query_start > interval '5 seconds';

-- Check table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

### Row Level Security (RLS) Monitoring

**Check RLS is enabled:**

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
-- All tables should have rowsecurity = true
```

**Monitor RLS policy effectiveness:**

```sql
-- Check if policies exist
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public';
```

---

## 🚨 Alerts & Notifications

### Alert Channels

| Channel | Use Case | Setup |
|---------|----------|-------|
| **Email** | Non-urgent alerts | Add to UptimeRobot/Pingdom |
| **Slack** | Team notifications | Webhook integration |
| **SMS** | Critical alerts | Paid service (PagerDuty, Twilio) |
| **PagerDuty** | On-call rotation | Incident management |

---

### Alert Rules

**Critical (Immediate Response):**
- 🔴 API health check fails (3 consecutive checks)
- 🔴 Error rate > 10% (last 5 minutes)
- 🔴 Database connections > 90%
- 🔴 Uptime < 99% (monthly)

**Warning (Review within 1 hour):**
- 🟡 API response time > 2 seconds (average)
- 🟡 Error rate > 1% (last 15 minutes)
- 🟡 Database connections > 70%
- 🟡 Large query time > 5 seconds

**Info (Review daily):**
- 🔵 Deployment completed
- 🔵 New user registered
- 🔵 Database backup completed

---

### Slack Integration

```javascript
// api/utils/slack.ts
export async function sendSlackAlert(message: string, severity: 'error' | 'warning' | 'info') {
  const webhook = process.env.SLACK_WEBHOOK_URL;

  const color = {
    error: '#FF0000',
    warning: '#FFA500',
    info: '#0000FF',
  }[severity];

  await fetch(webhook, {
    method: 'POST',
    body: JSON.stringify({
      attachments: [{
        color,
        title: `WC-Checks ${severity.toUpperCase()}`,
        text: message,
        ts: Math.floor(Date.now() / 1000),
      }],
    }),
  });
}
```

**Usage:**
```typescript
// Alert on high error rate
if (errorRate > 0.1) {
  await sendSlackAlert('Error rate above 10%!', 'error');
}
```

---

## 🚑 Incident Response

### Incident Severity Levels

| Level | Description | Response Time | Example |
|-------|-------------|---------------|---------|
| **P0** | Critical - Service down | Immediate | API returning 500s |
| **P1** | High - Major feature broken | < 1 hour | Login not working |
| **P2** | Medium - Minor feature broken | < 4 hours | Reports page slow |
| **P3** | Low - Cosmetic issue | < 1 day | UI alignment issue |

---

### Incident Response Playbook

#### **Step 1: Acknowledge**
```
1. Acknowledge incident in alert system
2. Post in #incidents Slack channel
3. Assign incident commander (on-call engineer)
```

#### **Step 2: Investigate**
```
1. Check health endpoints
   - /api/health
   - Supabase dashboard

2. Check logs
   - Vercel function logs
   - Supabase logs
   - Browser console

3. Check recent changes
   - Recent deployments
   - Database migrations
   - Environment variable changes
```

#### **Step 3: Mitigate**
```
1. Quick fixes:
   - Rollback deployment
   - Restart services
   - Increase resources

2. Workarounds:
   - Enable fallback mode
   - Disable problematic feature
   - Show maintenance page
```

#### **Step 4: Communicate**
```
1. Update status page
2. Notify affected users
3. Provide ETA for resolution
4. Post updates every 30 minutes
```

#### **Step 5: Resolve**
```
1. Implement permanent fix
2. Deploy to production
3. Verify resolution
4. Monitor for 1 hour
```

#### **Step 6: Post-Mortem**
```
1. Write incident report:
   - What happened
   - Why it happened
   - How we fixed it
   - How to prevent it

2. Action items:
   - Preventive measures
   - Monitoring improvements
   - Documentation updates

3. Share with team
```

---

### Common Incidents & Solutions

#### **"API Returns 500 Errors"**

**Investigate:**
```bash
# Check Vercel logs
vercel logs --since 1h

# Check for environment variables
curl https://your-app.vercel.app/api/health
```

**Common Causes:**
- Missing environment variables
- Database connection limit reached
- Supabase SERVICE_KEY expired
- Deployment error

**Fix:**
```bash
# Rollback deployment
vercel rollback

# Or re-deploy with correct env vars
vercel --prod
```

---

#### **"Users Cannot Login"**

**Investigate:**
```bash
# Check Supabase Auth
- Supabase Dashboard → Authentication
- Check recent sign-in attempts
- Check email delivery logs
```

**Common Causes:**
- Supabase service outage
- Email provider issue
- Incorrect auth configuration

**Fix:**
- Check Supabase status page
- Verify environment variables
- Test with different email provider

---

#### **"Database Slow Queries"**

**Investigate:**
```sql
-- Find slow queries
SELECT pid, now() - pg_stat_activity.query_start AS duration, query
FROM pg_stat_activity
WHERE state = 'active'
ORDER BY duration DESC;
```

**Common Causes:**
- Missing indexes
- Large table scans
- Connection pool exhausted

**Fix:**
```sql
-- Add missing indexes
CREATE INDEX idx_inspections_date ON inspection_records(inspection_date);

-- Analyze tables
ANALYZE inspection_records;
```

---

## 📈 Metrics Dashboard

### Recommended: Custom Dashboard

**Tools:**
- Grafana (self-hosted)
- Datadog (paid)
- Vercel Analytics (built-in)

**Key Metrics:**

```
┌────────────────────────────────────────┐
│         WC-Checks Dashboard            │
├────────────────────────────────────────┤
│  Uptime:        99.9% (30 days)        │
│  API Latency:   450ms avg              │
│  Error Rate:    0.12%                  │
│  Active Users:  1,234                  │
│  DB Load:       45/100 connections     │
│  Storage:       12GB / 100GB           │
└────────────────────────────────────────┘
```

---

### Weekly Health Report

**Automated Report (Monday 9AM):**

```
Subject: WC-Checks Weekly Health Report

📊 Performance (Last 7 Days)
- Uptime: 99.95%
- Avg API Response Time: 420ms
- Error Rate: 0.08%
- Total Inspections: 1,245
- Total Users: 156

⚠️ Issues
- 2 incidents (both resolved)
- 12 errors logged (non-critical)

🎯 Action Items
- [ ] Optimize inspections query (slow)
- [ ] Add index to locations table
- [ ] Update Cloudinary integration
```

---

## 🔧 Maintenance Windows

### Scheduled Maintenance

**Process:**
```
1. Announce 48 hours in advance
   - Status page
   - Email users
   - In-app banner

2. Schedule during low usage (Sunday 2-4 AM)

3. Perform maintenance:
   - Database migrations
   - Dependency updates
   - Infrastructure changes

4. Verify after completion

5. Update status page
```

**Emergency Maintenance:**
- Announce ASAP
- Fix critical issue first
- Communicate frequently
- Post-mortem required

---

## 📚 Resources

### Dashboards
- **Vercel**: https://vercel.com/dashboard
- **Supabase**: https://supabase.com/dashboard
- **Cloudinary**: https://cloudinary.com/console
- **UptimeRobot**: https://uptimerobot.com/dashboard

### Documentation
- [Vercel Monitoring](https://vercel.com/docs/analytics)
- [Supabase Monitoring](https://supabase.com/docs/guides/platform/logs)
- [Web Vitals](https://web.dev/vitals/)

---

## 🎯 Monitoring Checklist

**Daily:**
- [ ] Check uptime monitors (UptimeRobot)
- [ ] Review error logs (Vercel)
- [ ] Check database connections (Supabase)

**Weekly:**
- [ ] Review performance metrics
- [ ] Check disk usage
- [ ] Review slow query log
- [ ] Update status page

**Monthly:**
- [ ] Review SLA compliance (99.9% uptime)
- [ ] Analyze error trends
- [ ] Optimize slow queries
- [ ] Review incident reports

---

**Questions?** Contact DevOps team or check internal wiki.
