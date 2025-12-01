# Status Page Setup Guide

**Last Updated:** 2025-12-01

This guide covers creating a public status page to communicate system health, uptime, and incidents to your users.

---

## 📋 Table of Contents

- [Why Status Pages?](#why-status-pages)
- [Option 1: UptimeRobot Status Page](#option-1-uptimerobot-status-page-free)
- [Option 2: Atlassian Statuspage](#option-2-atlassian-statuspage-paid)
- [Option 3: Custom Status Page](#option-3-custom-status-page-diy)
- [Option 4: GitHub Status Page](#option-4-github-status-page-free)
- [Best Practices](#best-practices)
- [Incident Communication](#incident-communication)

---

## 🤔 Why Status Pages?

### Benefits

- ✅ **Transparency:** Users see real-time system health
- ✅ **Reduce Support Load:** Users check status before contacting support
- ✅ **Build Trust:** Proactive communication during incidents
- ✅ **Historical Data:** Show uptime track record (99.9%+)
- ✅ **Incident Updates:** Keep users informed during outages

### What to Include

**Typical Status Page Shows:**
- Current status (All Systems Operational / Partial Outage / Major Outage)
- Component status (Frontend, API, Database, Authentication)
- Uptime percentage (last 90 days)
- Response time graphs
- Incident history (past 30-90 days)
- Subscribe for updates (email, SMS, Slack, webhook)

---

## 🆓 Option 1: UptimeRobot Status Page (Free)

**Best For:** Startups, small teams, simple needs

### Pros & Cons

✅ **Pros:**
- Completely free
- Quick setup (5 minutes)
- Auto-updates from monitors
- Public or private
- Custom domain support
- Incident history

❌ **Cons:**
- Basic design (limited customization)
- No manual incident posting
- No maintenance schedules
- Limited branding

---

### Quick Setup

**Step 1: Create Status Page**

```bash
1. Login to UptimeRobot → Status Pages
2. Click "Add New Status Page"
3. Friendly Name: WC-Checks Status
4. Type: Public
5. Select Monitors to Display:
   ✅ WC-Checks Frontend
   ✅ WC-Checks API Health
   ✅ WC-Checks Database
6. Custom URL Slug: wc-checks (optional)
7. Click "Create Status Page"
```

**Step 2: Customize Appearance**

```bash
Settings → Customize:
- Logo: Upload company logo (recommended 200x50px)
- Favicon: Upload favicon.ico
- Page Title: WC-Checks System Status
- Custom Header: "Real-time status and uptime monitoring"
- Color Scheme: Match brand colors
- Show Uptime: ✅ Yes (Last 90 days)
- Show Response Times: ✅ Yes
- Show Incident History: ✅ Yes
```

**Step 3: Custom Domain (Optional)**

```bash
1. Status Page Settings → Custom Domain
2. Enter: status.yourcompany.com
3. Add CNAME record to your DNS:
   Type: CNAME
   Name: status
   Value: stats.uptimerobot.com
   TTL: 3600
4. Wait for DNS propagation (up to 48 hours)
5. Verify in UptimeRobot settings
```

**Step 4: Embed Badge in App**

```html
<!-- In your website footer or navbar -->
<a href="https://status.yourcompany.com" target="_blank">
  <img
    src="https://img.shields.io/uptimerobot/status/m12345678-abc?label=status&style=flat-square"
    alt="System Status"
  />
</a>
```

**Result:** status.yourcompany.com now shows live system health!

---

### What It Looks Like

```
┌────────────────────────────────────────────┐
│         WC-Checks System Status            │
│  [Logo]                                    │
└────────────────────────────────────────────┘

🟢 All Systems Operational

─────────────────────────────────────────────
Component Status

Frontend                    🟢  99.98%
API Health                  🟢  99.99%
Database                    🟢  99.95%

─────────────────────────────────────────────
Uptime (Last 90 Days)

Overall: 99.97%

[Bar Chart showing daily uptime]

─────────────────────────────────────────────
Response Times (Last 24h)

Frontend:  245ms avg
API:       150ms avg
Database:  180ms avg

[Line Graph showing response times]

─────────────────────────────────────────────
Incident History (Last 30 Days)

Dec 1, 2025 - 10:30 AM (Resolved)
🟠 Partial Outage - Frontend
Duration: 2 minutes
Details: Connection timeout due to Vercel deployment

Nov 25, 2025 - 3:15 PM (Resolved)
🟡 Degraded Performance - Database
Duration: 5 minutes
Details: Slow query performance, resolved with index optimization

─────────────────────────────────────────────
Subscribe to Updates

[Email input] [Subscribe Button]

Get notified via email, SMS, or Slack when status changes
```

---

## 💰 Option 2: Atlassian Statuspage (Paid)

**Best For:** Enterprise, advanced needs, custom branding

### Pricing

- **Starter:** $29/month - 1 status page, email support
- **Business:** $99/month - 3 pages, phone support, advanced features
- **Enterprise:** $299/month - Unlimited pages, SLA, dedicated support

### Pros & Cons

✅ **Pros:**
- Professional design
- Full customization
- Manual incident posting
- Scheduled maintenance
- Component grouping
- Third-party integrations (Datadog, PagerDuty, Slack)
- Private pages (password-protected)
- Subscriber management
- Email/SMS notifications
- Historical uptime metrics
- API access

❌ **Cons:**
- Expensive ($29-299/month)
- Overkill for small projects
- Setup more complex

---

### Quick Setup

**Step 1: Create Account**

```bash
1. Go to https://www.atlassian.com/software/statuspage
2. Start free trial (14 days)
3. Create status page:
   - Name: WC-Checks
   - URL: wc-checks.statuspage.io
```

**Step 2: Add Components**

```bash
1. Dashboard → Components → Add Component
2. Create components:

Component: Frontend
  Description: Main web application
  Status: Operational
  Show Uptime: Yes

Component: API
  Description: Backend API endpoints
  Status: Operational
  Show Uptime: Yes

Component: Database
  Description: Supabase PostgreSQL
  Status: Operational
  Show Uptime: Yes

Component: Authentication
  Description: User login and session management
  Status: Operational
  Show Uptime: Yes

Component: File Storage
  Description: Cloudinary image hosting
  Status: Operational
  Show Uptime: Yes
```

**Step 3: Connect Monitoring**

```bash
Option A: Connect UptimeRobot
1. Components → Select Component → Automation
2. Connect to UptimeRobot
3. Enter UptimeRobot API key
4. Map monitor to component

Option B: Connect Datadog
1. Integrations → Datadog
2. Enter Datadog API key
3. Select metrics to monitor
4. Set thresholds for auto-incidents

Option C: Manual Updates
1. Use Statuspage API
2. POST incident updates from your monitoring scripts
```

**Step 4: Customize Design**

```bash
1. Settings → Design
2. Upload logo (recommended 200x50px)
3. Upload favicon
4. Choose color scheme
5. Custom CSS (optional):
   - Match brand colors
   - Custom fonts
   - Layout adjustments
```

**Step 5: Setup Notifications**

```bash
1. Settings → Subscribers
2. Enable notification channels:
   ✅ Email
   ✅ SMS (paid)
   ✅ Slack (via webhook)
   ✅ Webhook (custom integrations)
   ✅ RSS
```

**Step 6: Custom Domain**

```bash
1. Settings → Domain
2. Enter: status.yourcompany.com
3. Add DNS record:
   Type: CNAME
   Name: status
   Value: wc-checks.statuspage.io
4. Verify SSL certificate
```

---

### Advanced Features

**Scheduled Maintenance:**

```bash
1. Incidents → Schedule Maintenance
2. Title: Database Backup Window
3. Components Affected: Database
4. Scheduled Time: Every Sunday, 2:00 AM - 4:00 AM UTC
5. Auto-status: Maintenance → Operational
6. Notify Subscribers: Yes
```

**Incident Templates:**

```markdown
Template: Database Outage

Title: Database Connectivity Issues
Components: Database, API
Status: Investigating

We are currently investigating database connectivity issues affecting the API.
New inspections and reports may be temporarily unavailable.

We will provide updates every 15 minutes.
```

**Private Components:**

```bash
1. Components → Add Component → Private
2. Use for internal systems (Admin Dashboard, Internal API)
3. Only visible to logged-in team members
```

---

## 🛠️ Option 3: Custom Status Page (DIY)

**Best For:** Full control, developers comfortable coding

### Tech Stack

**Simple Static Page:**
- HTML/CSS/JavaScript
- Hosted on Vercel/Netlify
- Updates via GitHub Actions

**Dynamic Page:**
- Next.js / React
- API endpoint: `/api/status`
- Real-time updates via polling

---

### Implementation Example

**Create Status API Endpoint:**

```typescript
// api/status.ts
import { createClient } from '@supabase/supabase-js';

interface StatusResponse {
  status: 'operational' | 'degraded' | 'outage';
  components: Component[];
  uptime: UptimeStats;
  incidents: Incident[];
}

interface Component {
  name: string;
  status: 'operational' | 'degraded' | 'outage';
  responseTime?: number;
  uptime?: number;
}

export default async function handler(req, res) {
  try {
    // Check database
    const dbStatus = await checkDatabase();

    // Check API
    const apiStatus = await checkAPI();

    // Check frontend (via HEAD request)
    const frontendStatus = await checkFrontend();

    // Calculate overall status
    const overallStatus = calculateOverallStatus([
      dbStatus,
      apiStatus,
      frontendStatus,
    ]);

    const response: StatusResponse = {
      status: overallStatus,
      components: [
        {
          name: 'Frontend',
          status: frontendStatus.status,
          responseTime: frontendStatus.responseTime,
          uptime: 99.98,
        },
        {
          name: 'API',
          status: apiStatus.status,
          responseTime: apiStatus.responseTime,
          uptime: 99.99,
        },
        {
          name: 'Database',
          status: dbStatus.status,
          responseTime: dbStatus.responseTime,
          uptime: 99.95,
        },
      ],
      uptime: {
        last24h: 100,
        last7d: 99.98,
        last30d: 99.97,
        last90d: 99.96,
      },
      incidents: await getRecentIncidents(),
    };

    return res.status(200).json(response);
  } catch (error) {
    return res.status(500).json({
      status: 'outage',
      error: 'Status check failed',
    });
  }
}

async function checkDatabase() {
  const start = Date.now();
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );

    await supabase.from('locations').select('count').limit(1);

    const responseTime = Date.now() - start;

    return {
      status: responseTime < 500 ? 'operational' : 'degraded',
      responseTime,
    };
  } catch (error) {
    return { status: 'outage', responseTime: null };
  }
}

async function checkAPI() {
  const start = Date.now();
  try {
    const response = await fetch(`${process.env.VITE_APP_URL}/api/health`);

    if (!response.ok) throw new Error('API health check failed');

    const responseTime = Date.now() - start;

    return {
      status: responseTime < 1000 ? 'operational' : 'degraded',
      responseTime,
    };
  } catch (error) {
    return { status: 'outage', responseTime: null };
  }
}

async function checkFrontend() {
  const start = Date.now();
  try {
    const response = await fetch(process.env.VITE_APP_URL!, {
      method: 'HEAD',
    });

    if (!response.ok) throw new Error('Frontend unavailable');

    const responseTime = Date.now() - start;

    return {
      status: responseTime < 2000 ? 'operational' : 'degraded',
      responseTime,
    };
  } catch (error) {
    return { status: 'outage', responseTime: null };
  }
}
```

**Create Status Page UI:**

```typescript
// pages/status.tsx
import { useState, useEffect } from 'react';

export default function StatusPage() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  async function fetchStatus() {
    const response = await fetch('/api/status');
    const data = await response.json();
    setStatus(data);
    setLoading(false);
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto p-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">WC-Checks System Status</h1>
        <StatusBadge status={status.status} />
      </div>

      {/* Components */}
      <div className="space-y-4 mb-12">
        <h2 className="text-2xl font-semibold mb-4">Components</h2>
        {status.components.map((component) => (
          <ComponentCard key={component.name} component={component} />
        ))}
      </div>

      {/* Uptime Stats */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Uptime</h2>
        <UptimeChart uptime={status.uptime} />
      </div>

      {/* Incident History */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Recent Incidents</h2>
        <IncidentList incidents={status.incidents} />
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const config = {
    operational: {
      color: 'bg-green-100 text-green-800',
      icon: '✅',
      text: 'All Systems Operational',
    },
    degraded: {
      color: 'bg-yellow-100 text-yellow-800',
      icon: '⚠️',
      text: 'Degraded Performance',
    },
    outage: {
      color: 'bg-red-100 text-red-800',
      icon: '🔴',
      text: 'Service Outage',
    },
  };

  const { color, icon, text } = config[status];

  return (
    <div className={`inline-flex items-center px-6 py-3 rounded-lg ${color}`}>
      <span className="text-2xl mr-2">{icon}</span>
      <span className="text-lg font-semibold">{text}</span>
    </div>
  );
}

function ComponentCard({ component }) {
  const statusColor = {
    operational: 'text-green-600',
    degraded: 'text-yellow-600',
    outage: 'text-red-600',
  }[component.status];

  return (
    <div className="border rounded-lg p-4 flex justify-between items-center">
      <div>
        <h3 className="font-semibold">{component.name}</h3>
        <p className={`text-sm ${statusColor}`}>
          {component.status.charAt(0).toUpperCase() + component.status.slice(1)}
        </p>
      </div>
      <div className="text-right text-sm text-gray-600">
        {component.responseTime && (
          <div>{component.responseTime}ms</div>
        )}
        {component.uptime && (
          <div>{component.uptime}% uptime</div>
        )}
      </div>
    </div>
  );
}
```

**Deploy:**

```bash
1. Add status page to your existing Vercel app
2. Route: /status
3. Or deploy separate subdomain: status.yourcompany.com
```

---

## 🆓 Option 4: GitHub Status Page (Free)

**Best For:** Open source projects, GitHub users

### Using GitHub Pages

**Create Status Page Repository:**

```bash
1. Create new repo: yourcompany/status
2. Enable GitHub Pages (Settings → Pages)
3. Use static site generator:
   - Upptime (recommended, auto-updates)
   - cState
   - Statusfy
```

---

### Using Upptime (Recommended)

**Setup:**

```bash
1. Click "Use this template" on https://github.com/upptime/upptime
2. Name repo: status
3. Enable GitHub Actions
4. Edit .upptimerc.yml:

owner: yourcompany
repo: status
sites:
  - name: Frontend
    url: https://wc-checks.yourcompany.com
  - name: API Health
    url: https://wc-checks.yourcompany.com/api/health
    expectedStatusCodes:
      - 200
  - name: Database
    url: https://wc-checks.yourcompany.com/api/health-db

status-website:
  cname: status.yourcompany.com
  name: WC-Checks Status
  logoUrl: https://yourcompany.com/logo.png

i18n:
  activeIncidents: Active Incidents
  allSystemsOperational: All Systems Operational

5. Commit and push
6. GitHub Actions will auto-generate status page
7. Visit: https://yourcompany.github.io/status
   Or: https://status.yourcompany.com (with CNAME)
```

**Features:**
- ✅ Automated uptime monitoring (every 5 minutes)
- ✅ Auto-generated graphs
- ✅ Incident history
- ✅ GitHub Issues for incidents
- ✅ Completely free
- ✅ Open source

**What It Looks Like:**
```
Live at: https://upptime.js.org/
```

---

## 📊 Best Practices

### 1. Be Transparent

```markdown
✅ GOOD:
"Database experiencing intermittent connection timeouts.
Investigation in progress. Estimated resolution: 2:00 PM UTC."

❌ BAD:
"Technical difficulties."
```

### 2. Update Frequently During Incidents

```markdown
Timeline:
10:30 AM - Investigating database connectivity issues
10:45 AM - Identified slow query causing lockup, deploying fix
11:00 AM - Fix deployed, monitoring for stability
11:15 AM - Resolved - All systems operational

Total Duration: 45 minutes
```

### 3. Use Clear Language

```markdown
✅ GOOD:
"Login functionality temporarily unavailable due to authentication service outage."

❌ BAD:
"Auth service experiencing degraded performance on cluster node 3."
```

### 4. Maintain Historical Data

- Keep incident history for at least 90 days
- Show uptime percentage (last 30, 60, 90 days)
- Be honest about downtimes (builds trust)

### 5. Provide Subscribe Options

- Email notifications (highest priority)
- SMS (for critical updates)
- Slack/webhook (for technical teams)
- RSS feed

---

## 🚨 Incident Communication

### Incident Workflow

**1. Detection (0-5 minutes)**
- Monitor alerts (UptimeRobot, Sentry)
- Confirm incident is real (not false alarm)

**2. Acknowledge (0-10 minutes)**
- Post initial status update:
  ```
  Status: Investigating
  Title: API Experiencing Connectivity Issues
  Description: We are investigating reports of API errors.
  New inspections may be affected. Updates to follow.
  ```

**3. Updates (Every 15-30 minutes)**
- Progress updates:
  ```
  Update 1 (10:45 AM):
  We've identified the root cause as a database connection pool exhaustion.
  Deploying fix now. Estimated resolution: 11:00 AM.

  Update 2 (11:00 AM):
  Fix deployed. Monitoring for stability before marking as resolved.
  ```

**4. Resolution**
- Mark incident resolved:
  ```
  Status: Resolved
  Resolution: Database connection pool size increased from 10 to 50.
  All systems now operational. Total downtime: 45 minutes.
  We apologize for the inconvenience.
  ```

**5. Post-Mortem (Within 48 hours)**
- Optional for major incidents
- Root cause analysis
- Preventive measures

---

### Incident Severity Levels

| Level | Definition | Example | Update Frequency |
|-------|------------|---------|------------------|
| **P0 - Critical** | Complete outage | Frontend down | Every 15 min |
| **P1 - Major** | Core features unavailable | Cannot submit inspections | Every 30 min |
| **P2 - Minor** | Degraded performance | Slow page loads | Every hour |
| **P3 - Maintenance** | Planned downtime | Database upgrade | Before + after |

---

## ✅ Setup Checklist

Choose your option and complete:

### UptimeRobot (Free)
- [ ] UptimeRobot status page created
- [ ] Monitors linked
- [ ] Custom domain configured (optional)
- [ ] Logo uploaded
- [ ] Subscribe option tested
- [ ] Link added to app footer
- [ ] Badge added to README

### Atlassian Statuspage (Paid)
- [ ] Account created
- [ ] Components defined
- [ ] Monitoring connected
- [ ] Custom domain configured
- [ ] Branding customized
- [ ] Notification channels setup
- [ ] Incident templates created
- [ ] Team members invited

### Custom DIY
- [ ] Status API endpoint created
- [ ] Status page UI built
- [ ] Deployed to production
- [ ] Monitoring integrated
- [ ] Incident posting mechanism
- [ ] Subscribe functionality
- [ ] Historical data storage

---

## 🔗 Related Documentation

- **[UPTIMEROBOT_SETUP.md](./UPTIMEROBOT_SETUP.md)** - Detailed UptimeRobot monitoring setup
- **[MONITORING.md](./MONITORING.md)** - Complete monitoring strategy
- **[SENTRY_SETUP.md](./SENTRY_SETUP.md)** - Error tracking integration

---

**Questions?** Check the monitoring documentation or contact the DevOps team.
