# Organization Scoping — Multi-Tenant Architecture

> Dokumentasi lengkap untuk migrasi organization scoping, RLS policies, dan user management flow.

## Overview

Sistem WC-Checks menggunakan multi-tenant architecture di mana setiap perusahaan (tenant) adalah sebuah `organization`. Data inspeksi, lokasi, dan users di-isolasi per organisasi via Row Level Security (RLS).

**Tanggal migrasi:** 9 Juni 2026
**Migrations:** `20260609_01` sampai `20260609_06`

---

## Data Model

```
organizations (tenants)
├── buildings (fisik gedung, optional)
│   └── locations (toilet/area inspeksi)
│       └── inspection_records (data inspeksi)
└── users (staff per org)
```

### Organisasi yang ada

| Org | Short Code | Keterangan |
|-----|-----------|------------|
| Dharma Kyungshin Indonesia | DKI | Tenant |
| PT. ABN | ABN01 | Tenant |
| RS PTPN Subang | PTPN | Tenant |
| PT TIRTA AMARTA | GDG01 | Tenant |

**Prenacons** (platform operator) TIDAK ada di organizations table. Superadmin mengelola sistem dari luar organisasi.

---

## RLS Policies

### Prinsip

| User State | Akses |
|-----------|-------|
| `organization_id` terisi + `approved` | Hanya data org-nya |
| `organization_id` NULL + `approved` | Semua data (backward compatible) |
| `approval_status = 'pending'` | Hanya profile sendiri |
| Backend API (service role) | Full access, bypass RLS |

### Helper Function

```sql
-- SECURITY DEFINER = bypasses RLS, hindari infinite recursion
CREATE FUNCTION get_user_org_id() RETURNS UUID AS $$
  SELECT organization_id FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;
```

### Policy per Tabel

**users:**
- `users_select_own` — user baca profile sendiri
- `users_select_org` — admin baca users dalam org yang sama
- `users_update_own` — user update profile sendiri
- `users_insert_own` — registrasi baru
- `users_service_role` — backend API full access
- `users_delete_superadmin` — superadmin hapus user

**inspection_records:**
- `ir_select_own` — user lihat inspeksi sendiri
- `ir_select_org` — user dengan org lihat inspeksi org-nya
- `ir_select_no_org` — user approved tanpa org lihat semua
- `ir_insert` — user buat inspeksi di lokasi org-nya
- `ir_update` — user update inspeksi sendiri + admin verify
- `ir_delete` — admin hapus inspeksi org-nya
- `ir_service_role` — backend API full access

**locations:**
- `loc_select` — org-scoped + backward compatible
- `loc_insert/update/delete` — admin dalam org yang sama
- `loc_service_role` — backend API full access

**buildings:**
- `bld_select` — org-scoped + backward compatible
- `bld_insert/update` — admin dalam org yang sama
- `bld_delete` — superadmin only
- `bld_service_role` — backend API full access

**photos:**
- `photo_select_own` — user lihat foto sendiri
- `photo_select_org` — user lihat foto inspeksi org-nya
- `photo_select_no_org` — user approved tanpa org lihat semua
- `photo_insert/update` — user manage foto sendiri
- `photo_delete` — admin dalam org yang sama
- `photo_service_role` — backend API full access

---

## User Registration & Approval Flow

### Flow

```
1. User daftar → approval_status = 'pending', organization_id = NULL
2. Superadmin review di /superadmin/users
3. Superadmin assign organisasi + set approval = 'approved'
4. User bisa akses data org-nya
```

### Approval Status

| Status | Akses | Keterangan |
|--------|-------|------------|
| `pending` | Login saja, lihat profile sendiri | Default untuk user baru |
| `approved` | Full access (sesuai org) | Di-set oleh superadmin |
| `rejected` | Diblokir | Di-set oleh superadmin |

### Superadmin Actions (di /superadmin/users)

- **Assign Organisasi** — dropdown per user, pilih org (DKI, ABN01, PTPN, GDG01)
- **Set Approval** — dropdown per user (pending/approved/rejected)
- **Toggle Status** — tombol ✅/❌ di user card header
- **Set All Pending** — tombol bulk, set semua non-admin ke pending
- **Kill Switch** — blokir/unblokir semua user non-admin

### API Endpoints

| Endpoint | Action | Keterangan |
|----------|--------|------------|
| `POST /api/admin/users?action=assign-role` | Assign role + auto-activate | Superadmin only |
| `POST /api/admin/users?action=update-org` | Assign user ke org | Superadmin only |
| `POST /api/admin/users?action=update-approval` | Ubah approval status | Superadmin only |
| `POST /api/admin/users?action=set-all-pending` | Set semua non-admin pending | Superadmin only |
| `POST /api/admin/users?action=toggle-status` | Aktif/nonaktifkan user | Admin+ |
| `POST /api/admin/users?action=toggle-submit` | Blokir/unblokir submit | Superadmin only |

---

## Migration Files

| File | Keterangan | Status |
|------|-----------|--------|
| `20260609_01_add_org_scoping_safe.sql` | +organization_id, +approval_status, users RLS | ✅ Done |
| `20260609_02_migrate_buildings_safe.sql` | Buildings → Organizations | ✅ Done |
| `20260609_03_org_scoped_rls.sql` | RLS org-scoped semua tabel | ✅ Done |
| `20260609_04_cleanup_buildings.sql` | Hapus company entries dari buildings | ✅ Done |
| `20260609_05_fix_rls_recursion.sql` | Fix infinite recursion (SECURITY DEFINER) | ✅ Done |
| `20260609_06_pending_default_and_rls.sql` | New registrations default pending | ✅ Done |
| `20260609_rollback.sql` | Rollback semua migrasi | Ready |

### Rollback

Kalau ada masalah, jalankan `20260609_rollback.sql`. Semua migrasi di-wrap dalam `BEGIN; ... COMMIT;` — kalau error di step manapun, auto-rollback.

---

## Buildings Table

Setelah migrasi, `buildings` table kosong. Bangunan fisik (gedung) ditambahkan nanti oleh tenant admin:

```
Organization (DKI) → Building (Gedung A) → Location (Toilet L1)
```

`locations.building_id` nullable — lokasi bisa ada tanpa building (langsung ke org).

---

## Pending Tasks

- [ ] Mapping user → org (tunggu data dari Prenacons)
- [ ] Assign 56 existing users ke org yang sesuai
- [ ] Buat org "Prenacons Staff" untuk cleaners (opsional)
- [ ] Add real buildings ke buildings table

---

## Related Files

- `src/types/database.types.ts` — Generated types (termasuk organization_id)
- `src/hooks/useUserRoles.ts` — Hooks untuk user management
- `api/admin/users.ts` — Backend API user management
- `src/pages/superadmin/UserManagement.tsx` — Superadmin UI
- `src/lib/supabase.ts` — Supabase client dengan typed helpers
