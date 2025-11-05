# Enterprise-Grade Features - Role Management System

This document explains all enterprise features implemented to ensure robust, production-ready role management.

---

## 🎯 Problem Solved

**Original Issue:** "Admin page tiba-tiba blocked, inconsistent access control"

**Root Cause:**
- Frontend-only role checks (easy to bypass)
- No fallback mechanisms
- No audit trail
- Single point of failure

**Enterprise Solution:** Multi-layered defense with graceful degradation

---

## ✅ Implemented Features

### **1. Audit Logs System** 🔍

**Purpose:** Track all admin actions for compliance, security, and debugging

**Implementation:**
- SQL table: `audit_logs` (immutable)
- RPC function: `create_audit_log()`
- Frontend hook: `useAuditLogs()`

**What's Tracked:**
```typescript
{
  user_id: "who did it",
  action: "ASSIGN_ROLE | TOGGLE_USER_STATUS | etc",
  resource_type: "user | role | building",
  resource_id: "affected resource",
  details: { ...additional context },
  success: true/false,
  error_message: "if failed",
  created_at: "timestamp"
}
```

**Usage:**
```typescript
// View all audit logs
const { data: logs } = useAuditLogs(100);

// View specific user's actions
const { data: userLogs } = useAuditLogs(50, userId);

// View only failures
const { data: failures } = useFailedActions();

// View recent actions (24h)
const { data: recent } = useRecentAdminActions();
```

**Benefits:**
- ✅ Compliance (GDPR, SOC2 requirements)
- ✅ Security (detect unauthorized access attempts)
- ✅ Debugging (understand what went wrong)
- ✅ User accountability (who changed what when)

**Database Migration:**
```bash
# Run this SQL migration:
supabase/migrations/20251102_audit_logs.sql
```

---

### **2. Fallback Mechanism** ⚡

**Purpose:** Ensure admin access never breaks even if backend has issues

**How It Works:**
```typescript
try {
  // ATTEMPT 1: Backend API (preferred)
  const role = await fetch('/api/auth/verify-role');

  if (role.status >= 500) {
    // ATTEMPT 2: Direct database (fallback)
    return await fallbackRoleCheck(userId);
  }

  return role;
} catch {
  // ATTEMPT 3: Final fallback
  return await fallbackRoleCheck(userId);
}
```

**Graceful Degradation:**
1. Backend API works → ✅ Use server-validated role
2. Backend 500 error → ⚠️ Fallback to direct query
3. Network error → ⚠️ Fallback to direct query
4. Everything fails → ❌ Deny access (fail closed)

**Benefits:**
- ✅ **No more "tiba-tiba blocked"** issue
- ✅ Admin access maintained during backend issues
- ✅ Still secure (fallback uses RLS policies)
- ✅ Automatic recovery when backend fixed

**Implementation:**
- File: `src/hooks/useIsAdmin.ts`
- Function: `fallbackRoleCheck()`

---

### **3. Enhanced Health Monitoring** 📊

**Purpose:** Quickly diagnose why admin access might fail

**Endpoints:**

**A. Backend Health Check**
```bash
GET /api/health

Response:
{
  "status": "ok",
  "timestamp": "2025-11-02T...",
  "environment": {
    "nodeVersion": "v20.x",
    "hasSupabaseUrl": true,
    "hasServiceKey": true,
    "supabaseUrlPrefix": "https://..."
  }
}
```

**B. Debug Script (Frontend)**
```javascript
// In browser console:
// Copy paste: debug-admin-access.js

// Automatically checks:
// 1. Supabase client
// 2. Current session
// 3. User role in database
// 4. Backend API health
// 5. Role verification API
// 6. Frontend state

// Results saved to: window.DEBUG_RESULTS
```

**Benefits:**
- ✅ Self-service debugging for admins
- ✅ Quick identification of issues
- ✅ No need to check server logs immediately
- ✅ Helps support team diagnose problems

**Usage:**
```bash
# Production health check
curl https://your-app.vercel.app/api/health

# Frontend debug
# Open browser console → paste debug script
```

---

### **4. Consistent Role Validation** 🔒

**Purpose:** Single source of truth for role checks

**Architecture:**
```
┌──────────────────────────────────────┐
│       BACKEND (Source of Truth)       │
├──────────────────────────────────────┤
│  1. Validate JWT token               │
│  2. Query user_roles with SERVICE_KEY│
│  3. Check role level                 │
│  4. Return { isAdmin, isSuperAdmin } │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│     FRONTEND (Reads from Backend)     │
├──────────────────────────────────────┤
│  const { isAdmin } = useIsAdmin();   │
│                                      │
│  // Use for UI only                  │
│  {isAdmin && <AdminButton />}        │
│                                      │
│  // Backend blocks if spoofed        │
└──────────────────────────────────────┘
```

**Role Hierarchy Enforced:**
```typescript
Level 100: SuperAdmin
  ├─ Can access User Management
  ├─ Can assign any role
  └─ Can toggle any user status

Level 80-99: Admin
  ├─ Can access admin pages
  ├─ Can see all data
  └─ Cannot access User Management

Level 0-79: User
  ├─ Regular app access
  └─ No admin privileges
```

**Validation Rules:**
- ✅ Cannot assign role higher than your own
- ✅ Cannot modify your own role
- ✅ Cannot deactivate yourself
- ✅ Cannot deactivate users with equal/higher role

---

### **5. Error Handling & Retries** 🔄

**Purpose:** Resilient against temporary failures

**Retry Strategy:**
```typescript
useQuery({
  retry: 2,              // Retry 2 times
  retryDelay: 1000,      // Wait 1s between retries
  staleTime: 5 * 60 * 1000, // Cache 5 minutes
})
```

**Error Scenarios Handled:**

| Scenario | Response | Fallback |
|----------|----------|----------|
| Backend 500 error | Retry → Fallback | Direct DB query |
| Network timeout | Retry → Fallback | Direct DB query |
| 401 Unauthorized | No retry | Deny access |
| 403 Forbidden | No retry | Deny access |
| Database error | Log error | Deny access (fail closed) |

**Benefits:**
- ✅ Handles temporary network issues
- ✅ Handles backend deployment moments
- ✅ Automatic recovery
- ✅ Still secure (fail closed on persistent errors)

---

## 📊 Enterprise Checklist Status

| Feature | Status | Implementation |
|---------|--------|---------------|
| ✅ Backend validates EVERY request | ✅ Done | API middleware |
| ✅ Single source of truth | ✅ Done | Backend API |
| ✅ Graceful degradation | ✅ Done | Fallback mechanism |
| ✅ Audit logs | ✅ Done | SQL + RPC + Hook |
| ✅ Automated tests | ⚠️ Manual | Debug script |
| ✅ Monitoring | ✅ Done | Health endpoints |
| ✅ Clear hierarchy | ✅ Done | Level-based |
| ✅ Instant revocation | ✅ Done | Toggle user status |

---

## 🔍 Debugging Guide

### **If Admin Page Blocked:**

**Step 1: Run Debug Script**
```javascript
// In browser console (F12)
// Paste contents of: debug-admin-access.js
// Check output for errors
```

**Step 2: Check Results**
```javascript
// View saved results
console.log(window.DEBUG_RESULTS);

// Common issues:
// - session.status: No active session → Login again
// - databaseRole: No role assigned → Add role in Supabase
// - apiHealth.hasServiceKey: false → Set env var in Vercel
// - apiVerifyRole.status: 500 → Check Vercel logs
```

**Step 3: Check Vercel Deployment**
- Go to: https://vercel.com/dashboard
- Latest deployment → View Function Logs
- Look for errors in `/api/auth/verify-role`

**Step 4: Verify Environment Variables**
- Vercel → Settings → Environment Variables
- Ensure `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` set
- Redeploy if just added

**Step 5: Check User Role in Database**
```sql
-- In Supabase SQL Editor
SELECT
  u.email,
  r.name as role,
  r.level
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.email = 'your@email.com';

-- If no role: assign one
INSERT INTO user_roles (user_id, role_id)
VALUES (
  'user-uuid',
  (SELECT id FROM roles WHERE name = 'superadmin')
);
```

---

## 🚀 Deployment Checklist

**Before Deploy:**
- [ ] Run SQL migrations (audit_logs)
- [ ] Set environment variables in Vercel
- [ ] Test locally with `vercel dev`

**After Deploy:**
- [ ] Test `/api/health` endpoint
- [ ] Login as superadmin
- [ ] Verify admin pages accessible
- [ ] Check audit logs working
- [ ] Test role assignment
- [ ] Test user toggle status

**Monitoring:**
- [ ] Check Vercel function logs weekly
- [ ] Review audit logs for suspicious activity
- [ ] Monitor failed actions in audit_logs

---

## 📚 API Reference

### **Backend Endpoints:**

**1. Health Check**
```
GET /api/health
Response: { status, environment }
```

**2. Verify Role**
```
GET /api/auth/verify-role
Headers: Authorization: Bearer <token>
Response: { isAdmin, isSuperAdmin, role }
```

**3. Assign Role** (SuperAdmin only)
```
POST /api/admin/assign-role
Headers: Authorization: Bearer <token>
Body: { userId, roleId }
Response: { success, message }
```

**4. Toggle User Status** (Admin only)
```
POST /api/admin/toggle-user-status
Headers: Authorization: Bearer <token>
Body: { userId, isActive }
Response: { success, message }
```

### **Frontend Hooks:**

```typescript
// Role verification (with fallback)
const { isAdmin, isSuperAdmin, loading } = useIsAdmin();

// Audit logs
const { data: logs } = useAuditLogs(100);
const { data: recent } = useRecentAdminActions();
const { data: failures } = useFailedActions();

// Role management (unchanged)
const { data: users } = useUsers();
const { data: roles } = useRoles();
const assignRole = useAssignRole();
const toggleStatus = useToggleUserStatus();
```

---

## 🎓 Best Practices

**1. Always Check Logs**
```typescript
// Before debugging, check audit logs
const { data: logs } = useAuditLogs(100);
// Look for failed actions, errors
```

**2. Use Debug Script**
```javascript
// When admin reports issue, ask them to:
// 1. Open console (F12)
// 2. Run debug script
// 3. Share window.DEBUG_RESULTS
```

**3. Monitor Health Endpoint**
```bash
# Setup monitoring (e.g., UptimeRobot)
# Check /api/health every 5 minutes
# Alert if status != "ok"
```

**4. Regular Audit Review**
```sql
-- Weekly: Review failed actions
SELECT * FROM audit_logs
WHERE success = false
AND created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;
```

---

## 🔐 Security Notes

**Environment Variables:**
- ⚠️ `SUPABASE_SERVICE_KEY` = Full database access
- ⚠️ Never expose in frontend
- ⚠️ Only backend should use it
- ⚠️ Rotate if compromised

**Fallback Security:**
- ✅ Fallback still uses RLS policies
- ✅ Fallback is read-only (no mutations)
- ✅ Fallback only for role check
- ✅ Still secure, just less audited

**Audit Logs:**
- ✅ Immutable (no updates/deletes)
- ✅ Only admins can read
- ✅ System can always write
- ✅ Provides compliance trail

---

## 📞 Support

**If you encounter issues:**

1. Run debug script (debug-admin-access.js)
2. Check BACKEND_API_GUIDE.md
3. Check this document (ENTERPRISE_FEATURES.md)
4. Review Vercel function logs
5. Check Supabase logs

**Common Solutions:**
- Admin blocked → Check debug script output
- 500 errors → Check Vercel env vars
- Audit logs not working → Run SQL migration
- Fallback activating → Check backend health

---

**Last Updated:** 2025-11-05
**Version:** 3.0.0
