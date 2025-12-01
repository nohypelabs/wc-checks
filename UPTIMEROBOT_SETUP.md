# UptimeRobot Monitoring Setup

**Last Updated:** 2025-12-01

This guide walks you through setting up UptimeRobot for 24/7 uptime monitoring of WC-Checks in production.

---

## 📋 Why UptimeRobot?

UptimeRobot provides:
- ✅ **24/7 Uptime Monitoring** - Checks your site every 5 minutes
- ✅ **Instant Alerts** - Email, SMS, Slack notifications when down
- ✅ **Public Status Page** - Share uptime with users
- ✅ **Incident History** - Track downtime events
- ✅ **Multi-Region Checks** - Test from different locations
- ✅ **Free Tier** - 50 monitors, 5-minute intervals
- ✅ **API Access** - Integrate with CI/CD

---

## 🚀 Quick Setup (10 minutes)

### Step 1: Create UptimeRobot Account

```bash
1. Go to https://uptimerobot.com/
2. Click "Sign Up for Free"
3. Create account (email or Google login)
4. Verify email address
```

**Free Tier Includes:**
- 50 monitors
- 5-minute check intervals
- Email alerts (unlimited)
- SMS alerts (limited)
- Public status pages (1)

---

## 📊 Setting Up Monitors

### Monitor 1: Frontend (HTTPS Monitor)

**Purpose:** Ensure main website is accessible

```bash
1. Dashboard → Add New Monitor
2. Monitor Type: HTTPS (or HTTP)
3. Friendly Name: WC-Checks Frontend
4. URL: https://wc-checks.vercel.app
5. Monitoring Interval: 5 minutes
6. Monitor Timeout: 30 seconds
7. Alert Contacts: Your email
8. Click "Create Monitor"
```

**Advanced Settings:**
- **Expected Status Code:** 200 OK
- **Keyword Exists:** (optional) "WC-Checks" - checks for specific text
- **Regions:** Select multiple (US, EU, Asia) for global checks

---

### Monitor 2: Health Check API (Keyword Monitor)

**Purpose:** Verify backend API is functioning

```bash
1. Dashboard → Add New Monitor
2. Monitor Type: Keyword
3. Friendly Name: WC-Checks API Health
4. URL: https://wc-checks.vercel.app/api/health
5. Keyword: "API is healthy"
6. Keyword Check Type: Keyword Exists
7. Monitoring Interval: 5 minutes
8. Alert Contacts: Your email
9. Click "Create Monitor"
```

**Why Keyword Monitor?**
- Not just checking if endpoint responds (200 OK)
- Verifies actual JSON response contains expected data
- Catches cases where API returns 200 but with error message

---

### Monitor 3: Authentication Endpoint (Optional)

**Purpose:** Check critical auth functionality

```bash
1. Monitor Type: Keyword
2. Friendly Name: WC-Checks Auth
3. URL: https://wc-checks.vercel.app/api/auth/verify-role
4. Method: POST
5. Request Headers:
   Content-Type: application/json
6. Request Body:
   {
     "expectedRole": "user"
   }
7. Keyword: "success"
8. Create Monitor
```

**Note:** This requires valid authentication. Consider creating a test endpoint instead:
```typescript
// api/health-auth.ts
export default async function handler(req, res) {
  // Simple endpoint that checks if Supabase connection works
  const { data, error } = await supabase.from('users').select('count').single();

  if (error) {
    return res.status(500).json({ success: false, message: 'DB connection failed' });
  }

  return res.status(200).json({ success: true, message: 'Auth system healthy' });
}
```

---

### Monitor 4: Database Connection (Recommended)

**Purpose:** Verify Supabase database connectivity

**Create Test Endpoint First:**

```typescript
// api/health-db.ts
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );

    // Simple query to verify DB connection
    const { data, error } = await supabase
      .from('locations')
      .select('count')
      .limit(1);

    if (error) throw error;

    return res.status(200).json({
      success: true,
      message: 'Database connection healthy',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: error.message,
    });
  }
}
```

**Then Add Monitor:**

```bash
1. Monitor Type: Keyword
2. Friendly Name: WC-Checks Database
3. URL: https://wc-checks.vercel.app/api/health-db
4. Keyword: "Database connection healthy"
5. Monitoring Interval: 5 minutes
6. Create Monitor
```

---

## 🔔 Setting Up Alerts

### Email Alerts (Free)

**Already configured when creating monitors!**

```bash
1. Dashboard → Settings → Alert Contacts
2. Default email is already added
3. Click "Test" to verify emails arrive
```

**Alert Email Example:**
```
Subject: [UptimeRobot Alert] WC-Checks Frontend is DOWN

Your monitor "WC-Checks Frontend" is down!

URL: https://wc-checks.vercel.app
Reason: Connection timeout
Duration: 2 minutes
Time: 2025-12-01 10:30 AM UTC

This is the first notification for this incident.
```

---

### Slack Alerts (Recommended)

**Step 1: Create Slack Webhook**

```bash
1. Go to Slack workspace
2. Click workspace name → Settings & administration → Manage apps
3. Search "Incoming Webhooks"
4. Click "Add to Slack"
5. Choose channel: #alerts or #monitoring
6. Copy Webhook URL: https://hooks.slack.com/services/T00/B00/xxx
```

**Step 2: Add to UptimeRobot**

```bash
1. Dashboard → Settings → Alert Contacts
2. Click "Add Alert Contact"
3. Type: Webhook
4. Friendly Name: Slack - Alerts Channel
5. URL: [Your Slack Webhook URL]
6. POST Value (JSON):
   {
     "text": "*monitorFriendlyName* is *monitorAlertType*!\nReason: *alertDetails*\nDuration: *alertDuration*"
   }
7. Click "Create Alert Contact"
```

**Step 3: Assign to Monitors**

```bash
1. Dashboard → Monitors
2. Click each monitor → Edit
3. Scroll to "Alert Contacts to Notify"
4. Check "Slack - Alerts Channel"
5. Save Changes
```

**Slack Alert Example:**
```
WC-Checks Frontend is DOWN!
Reason: HTTP 503 Service Unavailable
Duration: 5 minutes
```

---

### SMS Alerts (Limited Free)

**Free tier includes limited SMS credits**

```bash
1. Dashboard → Settings → Alert Contacts
2. Click "Add Alert Contact"
3. Type: SMS
4. Phone Number: +1234567890
5. Save

Note: Only use for CRITICAL monitors (Frontend, API Health)
```

---

### Discord Alerts (Alternative)

```bash
1. Discord Server → Server Settings → Integrations → Webhooks
2. Create Webhook for #alerts channel
3. Copy Webhook URL
4. UptimeRobot → Add Alert Contact → Webhook
5. URL: [Discord Webhook URL]
6. POST Value:
   {
     "content": "🚨 **monitorFriendlyName** is **monitorAlertType**!\n\n**Reason:** *alertDetails*\n**Duration:** *alertDuration*"
   }
```

---

## 📈 Public Status Page

**Create a public page to share uptime with users**

### Step 1: Create Status Page

```bash
1. Dashboard → Status Pages
2. Click "Add New Status Page"
3. Friendly Name: WC-Checks Status
4. Type: Public (anyone can view)
5. Monitors to Show:
   ✅ WC-Checks Frontend
   ✅ WC-Checks API Health
   ✅ WC-Checks Database
6. Custom Domain: (optional) status.yourcompany.com
7. Custom Logo: Upload company logo
8. Create Status Page
```

### Step 2: Customize Status Page

```bash
Settings:
- Show Uptime %: ✅ Yes
- Show Response Times: ✅ Yes
- Show Incident History: ✅ Yes (last 30 days)
- Custom CSS: (optional) Match your brand colors
```

**Example Status Page:**
```
┌─────────────────────────────────────────┐
│         WC-Checks Status                │
│  All Systems Operational ✅             │
└─────────────────────────────────────────┘

Frontend               🟢 99.98% uptime
API Health             🟢 99.99% uptime
Database               🟢 99.97% uptime

Last 30 Days Uptime: 99.98%
Average Response Time: 245ms

─────────────────────────────────────────
Incident History (Last 30 Days)

Dec 1, 2025 - 10:30 AM (Resolved)
Frontend - Connection timeout (2 min)

Nov 25, 2025 - 3:15 PM (Resolved)
Database - Slow response (5 min)
```

### Step 3: Share Status Page

**Public URL:**
```
https://stats.uptimerobot.com/ABC123XYZ
```

**Add to Website Footer:**
```typescript
<footer>
  <a href="https://stats.uptimerobot.com/ABC123XYZ" target="_blank">
    System Status
  </a>
</footer>
```

**Add to README.md:**
```markdown
[![Uptime](https://img.shields.io/uptimerobot/status/m12345678-abc?label=status)](https://stats.uptimerobot.com/ABC123XYZ)
```

---

## 🔧 Advanced Configuration

### Multi-Region Monitoring

**Check from multiple locations globally**

```bash
1. Edit Monitor → Advanced Settings
2. Monitoring Locations:
   ✅ US-East
   ✅ US-West
   ✅ Europe
   ✅ Asia
3. Alert When: Down from 2+ locations (prevents false alerts)
```

---

### Maintenance Windows

**Scheduled downtime without alerts**

```bash
1. Dashboard → Monitors
2. Click monitor → Edit
3. Scroll to "Maintenance Windows"
4. Add:
   - Type: Weekly
   - Day: Sunday
   - Time: 2:00 AM - 4:00 AM UTC
   - Reason: Database backup
5. Save
```

**Use Case:** Prevent alerts during planned maintenance or deployments

---

### Response Time Alerts

**Get notified when site is slow**

```bash
1. Edit Monitor → Advanced Settings
2. Enable: Alert if response time > X seconds
3. Set threshold: 3 seconds
4. Save

Now you'll get alerted if:
- Site is down (connection error)
- Site is slow (response > 3 sec)
```

---

### Custom HTTP Headers

**Monitor authenticated endpoints**

```bash
1. Edit Monitor → Advanced Settings
2. Custom HTTP Headers:
   Authorization: Bearer YOUR_API_KEY
   X-Custom-Header: value
3. Save
```

**Use Case:** Monitor private admin endpoints that require authentication

---

## 📊 Dashboard & Reporting

### Understanding Monitor Status

| Status | Meaning | Action |
|--------|---------|--------|
| 🟢 **Up** | Monitor responded successfully | None |
| 🔴 **Down** | Monitor failed to respond | Check alerts |
| 🟡 **Paused** | Monitoring temporarily disabled | Resume when ready |
| 🔵 **Not Checked Yet** | New monitor, first check pending | Wait 5 minutes |

---

### Uptime Calculation

```
Uptime % = (Total Time - Downtime) / Total Time × 100

Example:
Total Time: 30 days = 43,200 minutes
Downtime: 15 minutes
Uptime: (43,200 - 15) / 43,200 × 100 = 99.965%
```

**Industry Standards:**
- **99.9%** (Three Nines): ~43 minutes downtime/month
- **99.95%**: ~21 minutes downtime/month
- **99.99%** (Four Nines): ~4 minutes downtime/month
- **99.999%** (Five Nines): ~26 seconds downtime/month

**Target:** Aim for 99.9%+ uptime

---

### Email Reports

**Get weekly/monthly uptime summaries**

```bash
1. Dashboard → Settings → Alert Contacts
2. Click your email → Edit
3. Enable:
   ✅ Weekly Summary (sent Monday 9 AM)
   ✅ Monthly Summary (sent 1st of month)
4. Save
```

**Example Weekly Report:**
```
Weekly Uptime Report - Dec 1, 2025

WC-Checks Frontend
  Uptime: 99.98%
  Downtime: 1 incident (2 min)
  Avg Response: 245ms

WC-Checks API Health
  Uptime: 100%
  Downtime: None
  Avg Response: 150ms

WC-Checks Database
  Uptime: 99.95%
  Downtime: 1 incident (5 min)
  Avg Response: 180ms
```

---

## 🚨 Incident Response Workflow

### When You Receive Alert

**Step 1: Acknowledge (0-5 minutes)**

```bash
1. Check UptimeRobot alert email/Slack
2. Verify issue:
   - Try accessing URL manually
   - Check from different network (mobile data)
3. Check Vercel dashboard for deployment status
4. Check Supabase dashboard for database status
```

**Step 2: Investigate (5-15 minutes)**

```bash
1. Check Sentry for recent errors
2. Check Vercel logs:
   vercel logs --prod
3. Check API health endpoint response:
   curl https://wc-checks.vercel.app/api/health
4. Identify root cause
```

**Step 3: Fix (15-60 minutes)**

**Common Issues & Fixes:**

| Issue | Likely Cause | Fix |
|-------|--------------|-----|
| **HTTP 503** | Vercel deployment failed | Redeploy from dashboard |
| **Timeout** | Database query too slow | Check slow queries, add indexes |
| **HTTP 500** | API error | Check Sentry, fix code, redeploy |
| **DNS Error** | Domain configuration | Check domain DNS settings |
| **SSL Error** | Certificate expired | Renew SSL cert (Vercel auto-renews) |

**Step 4: Verify Resolution**

```bash
1. Wait for next UptimeRobot check (up to 5 minutes)
2. Verify "Monitor is UP" notification received
3. Check status page shows green
4. Monitor for 30 minutes to ensure stable
```

**Step 5: Post-Incident**

```bash
1. Document incident:
   - What happened
   - Root cause
   - How fixed
   - How to prevent

2. Update runbook if new issue type

3. Consider:
   - Adding new monitor for this scenario
   - Adjusting alert thresholds
   - Infrastructure improvements
```

---

## 📱 Mobile App

**Monitor on the go**

```bash
1. Download "UptimeRobot" app (iOS/Android)
2. Login with your account
3. Enable push notifications

Features:
- View all monitors
- Acknowledge alerts
- Pause/resume monitors
- View incident history
```

---

## 🔌 API Integration

**Integrate with CI/CD or custom dashboards**

### Get API Key

```bash
1. Dashboard → Settings → API Settings
2. Enable API Access
3. Copy Main API Key: u1234567-abcdef1234567890
```

### Example: Pause Monitor During Deployment

```bash
# In your deployment script
curl -X POST https://api.uptimerobot.com/v2/editMonitor \
  -H "Content-Type: application/json" \
  -d '{
    "api_key": "u1234567-abcdef1234567890",
    "id": "123456789",
    "status": 0
  }'

# Deploy your app
vercel --prod

# Resume monitor after deployment
curl -X POST https://api.uptimerobot.com/v2/editMonitor \
  -H "Content-Type: application/json" \
  -d '{
    "api_key": "u1234567-abcdef1234567890",
    "id": "123456789",
    "status": 1
  }'
```

---

## 💰 Pricing Tiers

### Free Plan (Current)
- ✅ 50 monitors
- ✅ 5-minute intervals
- ✅ Email alerts (unlimited)
- ✅ 1 public status page
- ✅ 90-day history
- ⚠️ Limited SMS alerts

**Perfect for:** Small to medium projects

---

### Pro Plan ($7/month)
- ✅ Everything in Free
- ✅ 50 monitors (10x more vs Free's 5)
- ✅ **1-minute intervals** (5x faster checks)
- ✅ 5 public status pages
- ✅ 180-day history
- ✅ More SMS alerts
- ✅ Advanced notifications

**Upgrade when:**
- Need faster detection (1-min vs 5-min)
- Multiple projects/clients (5 status pages)
- Longer history needed

---

### Business Plan ($26/month)
- ✅ Everything in Pro
- ✅ 200 monitors
- ✅ **30-second intervals**
- ✅ 20 status pages
- ✅ 1-year history
- ✅ Priority support

**Upgrade when:**
- Enterprise-level monitoring needed
- Managing many projects
- Need near-instant alerts

---

## 🆚 Alternatives Comparison

| Feature | UptimeRobot | Pingdom | Better Uptime | StatusCake |
|---------|-------------|---------|---------------|------------|
| **Free Tier** | 50 monitors | 1 monitor | 10 monitors | 10 monitors |
| **Check Interval** | 5 min | 1 min (paid) | 3 min | 5 min |
| **Status Page** | ✅ Free | ❌ Paid only | ✅ Free | ✅ Free |
| **Ease of Use** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Best For** | Startups | Enterprise | Modern teams | Budget |

**Recommendation:** Start with UptimeRobot free tier. Upgrade to Pro ($7/month) when you need 1-minute checks.

---

## ✅ Verification Checklist

Setup complete when:

- [ ] UptimeRobot account created
- [ ] Frontend monitor added (HTTPS)
- [ ] API health monitor added (Keyword)
- [ ] Database monitor added (optional)
- [ ] Email alerts configured
- [ ] Slack alerts configured (recommended)
- [ ] Public status page created
- [ ] Status page link added to website
- [ ] Mobile app installed
- [ ] Test alert sent and received
- [ ] Incident response workflow documented
- [ ] Team members invited to dashboard

---

## 📚 Resources

- **UptimeRobot Docs:** https://uptimerobot.com/api/
- **Status Page Examples:** https://uptimerobot.com/blog/status-page-examples/
- **Best Practices:** https://uptimerobot.com/blog/uptime-monitoring-best-practices/
- **API Documentation:** https://uptimerobot.com/api/

---

## 🔗 Related Documentation

- **[MONITORING.md](./MONITORING.md)** - Complete monitoring strategy
- **[SENTRY_SETUP.md](./SENTRY_SETUP.md)** - Error tracking setup
- **[DEVELOPMENT.md](./DEVELOPMENT.md)** - Health endpoint implementation

---

**Questions?** Check [MONITORING.md](./MONITORING.md) for comprehensive monitoring guide.
