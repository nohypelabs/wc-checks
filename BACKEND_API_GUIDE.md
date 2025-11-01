# Backend API Guide - Role Management

This document explains the backend API implementation for secure role management.

## 🎯 Overview

The app now uses **Vercel Serverless Functions** for critical role management operations to ensure security and prevent frontend bypassing.

### What's Protected by Backend:
- ✅ Role verification (prevent spoofing)
- ✅ Role assignment (validate permissions)
- ✅ User status toggle (validate hierarchy)

### What's Still Direct (Safe):
- ✅ Read operations (buildings, locations, inspections)
- ✅ User-owned data (creating own inspections)

This **hybrid architecture** provides maximum security where needed while keeping read operations fast.

---

## 📁 Folder Structure

```
wc-checks/
├── api/                          # Backend serverless functions
│   ├── middleware/
│   │   └── role-guard.ts        # Auth & role validation middleware
│   ├── auth/
│   │   └── verify-role.ts       # Verify user role (GET)
│   └── admin/
│       ├── assign-role.ts       # Assign role to user (POST)
│       └── toggle-user-status.ts # Activate/deactivate user (POST)
├── src/                          # Frontend (Vite + React)
└── vercel.json                   # Vercel configuration
```

---

## 🔐 Environment Variables

### Required for Backend (Vercel):

Add these to your Vercel project environment variables:

```bash
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key-here
```

**How to get SERVICE_KEY:**
1. Go to Supabase Dashboard
2. Settings → API
3. Copy `service_role` key (NOT anon key!)
4. Add to Vercel: Project Settings → Environment Variables

**⚠️ Security Note:**
- NEVER commit SERVICE_KEY to git
- NEVER use SERVICE_KEY in frontend code
- Only use in backend API endpoints

---

## 🚀 API Endpoints

### 1. Verify Role (GET)

**Endpoint:** `/api/auth/verify-role`

**Purpose:** Server-side role verification to prevent frontend spoofing

**Headers:**
```
Authorization: Bearer <supabase-access-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "uuid",
    "role": {
      "id": "uuid",
      "name": "superadmin",
      "level": 100
    },
    "isAdmin": true,
    "isSuperAdmin": true
  }
}
```

**Frontend Usage:**
```typescript
// src/hooks/useIsAdmin.ts
const { isAdmin } = useIsAdmin(); // Now uses backend verification
```

---

### 2. Assign Role (POST)

**Endpoint:** `/api/admin/assign-role`

**Purpose:** Assign role to user with validation

**Requirements:**
- Only superadmin (level >= 100) can assign roles
- Cannot assign role higher than your own level
- Cannot modify your own role

**Headers:**
```
Authorization: Bearer <supabase-access-token>
Content-Type: application/json
```

**Body:**
```json
{
  "userId": "user-uuid",
  "roleId": "role-uuid"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "uuid",
    "roleId": "uuid",
    "roleName": "admin",
    "operation": "assigned"
  },
  "message": "Role 'admin' assigned successfully for John Doe"
}
```

**Frontend Usage:**
```typescript
// src/hooks/useUserRoles.ts
const assignRole = useAssignRole();
assignRole.mutate({ userId, roleId }); // assignedBy handled by backend
```

**Validations:**
- ✅ Only superadmin can execute
- ✅ Target role must exist and be active
- ✅ Cannot assign role higher than your level
- ✅ Cannot modify your own role
- ✅ Target user must exist

---

### 3. Toggle User Status (POST)

**Endpoint:** `/api/admin/toggle-user-status`

**Purpose:** Activate or deactivate user account

**Requirements:**
- Only admin (level >= 80) can toggle status
- Cannot deactivate yourself
- Cannot modify user with equal or higher role level

**Headers:**
```
Authorization: Bearer <supabase-access-token>
Content-Type: application/json
```

**Body:**
```json
{
  "userId": "user-uuid",
  "isActive": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "uuid",
    "isActive": false,
    "userName": "John Doe"
  },
  "message": "User 'John Doe' deactivated successfully"
}
```

**Frontend Usage:**
```typescript
// src/hooks/useUserRoles.ts
const toggleStatus = useToggleUserStatus();
toggleStatus.mutate({ userId, isActive: false });
```

**Validations:**
- ✅ Only admin (level >= 80) can execute
- ✅ Cannot deactivate yourself
- ✅ Cannot modify user with equal or higher role
- ✅ Target user must exist

---

## 🔒 Security Features

### 1. Server-Side Validation
All critical operations validated on the backend - cannot be bypassed from frontend.

### 2. Role Hierarchy Enforcement
```
Superadmin (100) > Admin (80) > User (0)
```
- Superadmin can manage everyone
- Admin can manage users but not other admins
- User cannot manage anyone

### 3. Self-Protection
- Cannot modify your own role
- Cannot deactivate yourself

### 4. Audit Logging (Placeholder)
All operations logged for compliance (TODO: create audit_logs table).

---

## 📦 Deployment

### Vercel Deployment (Automatic)

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Add backend API for role management"
   git push
   ```

2. **Vercel auto-deploys:**
   - Frontend: Vite build → `/dist`
   - Backend: API routes → `/api/*`

3. **Add Environment Variables:**
   - Go to Vercel Dashboard
   - Project Settings → Environment Variables
   - Add `SUPABASE_URL` and `SUPABASE_SERVICE_KEY`
   - Redeploy

### Local Testing

```bash
# Install Vercel CLI
npm i -g vercel

# Run local dev server (includes serverless functions)
vercel dev

# Test API endpoints
curl http://localhost:3000/api/auth/verify-role \
  -H "Authorization: Bearer <token>"
```

---

## 🧪 Testing

### Manual Testing

1. **Test verify-role:**
   ```bash
   # Get token from browser (Application → Local Storage → supabase.auth.token)
   curl https://your-app.vercel.app/api/auth/verify-role \
     -H "Authorization: Bearer <token>"
   ```

2. **Test assign-role (superadmin only):**
   ```bash
   curl -X POST https://your-app.vercel.app/api/admin/assign-role \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"userId": "uuid", "roleId": "uuid"}'
   ```

3. **Test toggle-status (admin only):**
   ```bash
   curl -X POST https://your-app.vercel.app/api/admin/toggle-user-status \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"userId": "uuid", "isActive": false}'
   ```

### Frontend Testing

1. Login as superadmin
2. Go to User Management page
3. Try to:
   - Assign role to user (should work)
   - Deactivate user (should work)
   - Modify your own role (should fail with error)
   - Assign higher role than yours (should fail with error)

---

## 🐛 Troubleshooting

### Error: "Unauthorized"
- Check if token is valid (not expired)
- Verify Authorization header format: `Bearer <token>`

### Error: "Forbidden: Only superadmin..."
- Check user's role level in database
- Verify user_roles table has correct assignment

### Error: "Cannot assign role higher than your own level"
- This is expected - working as designed
- Only superadmin (level 100) can assign all roles

### API returns 404
- Check vercel.json is correctly configured
- Verify API file exists in `/api` folder
- Check Vercel deployment logs

### Environment variables not working
- Verify variables are added in Vercel Dashboard
- Redeploy after adding variables
- Check variable names match exactly (case-sensitive)

---

## 📊 What Changed

### Before (Direct Supabase):
```typescript
// ❌ Frontend could bypass validation
const { error } = await supabase
  .from('user_roles')
  .update({ role_id: roleId }) // No validation!
  .eq('user_id', userId);
```

### After (Backend API):
```typescript
// ✅ Backend validates everything
const response = await fetch('/api/admin/assign-role', {
  headers: { Authorization: `Bearer ${token}` },
  body: JSON.stringify({ userId, roleId }),
});
// Backend checks: permissions, hierarchy, validity
```

---

## 🎯 Benefits

| Aspect | Before | After |
|--------|--------|-------|
| **Security** | ❌ Frontend can bypass | ✅ Server-side validation |
| **Role hierarchy** | ❌ Not enforced | ✅ Strictly enforced |
| **Audit trail** | ❌ None | ✅ Logged |
| **Self-protection** | ❌ Can break own account | ✅ Protected |
| **Type safety** | ❌ Manual types | ✅ Shared types |

---

## 🔄 Future Enhancements

- [ ] Add audit_logs table in Supabase
- [ ] Add rate limiting per endpoint
- [ ] Add email notifications on role changes
- [ ] Add approval workflow for sensitive operations
- [ ] Add more granular permissions (RBAC)

---

## 📚 Related Files

- **Backend:**
  - `/api/middleware/role-guard.ts` - Auth middleware
  - `/api/auth/verify-role.ts` - Role verification
  - `/api/admin/assign-role.ts` - Role assignment
  - `/api/admin/toggle-user-status.ts` - User status

- **Frontend:**
  - `/src/hooks/useIsAdmin.ts` - Admin check hook
  - `/src/hooks/useUserRoles.ts` - Role management hooks
  - `/src/pages/superadmin/UserManagement.tsx` - Admin UI

- **Config:**
  - `/vercel.json` - Vercel configuration
  - `/.env.example` - Environment variables template

---

## 💡 Questions?

Check the inline comments in the code for more details. All API endpoints have comprehensive JSDoc comments explaining parameters, responses, and validation rules.
