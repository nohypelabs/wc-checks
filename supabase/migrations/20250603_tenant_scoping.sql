-- Migration: Tenant Scoping (Organization-based Data Isolation)
-- Date: 2025-06-03
-- Purpose: Add organization_id to users, update RLS policies for multi-tenant isolation

-- ============================================================
-- 1. Add organization_id column to users table
-- ============================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- Index for fast org lookups
CREATE INDEX IF NOT EXISTS idx_users_organization_id ON users(organization_id);

-- ============================================================
-- 2. Helper function: get current user's organization_id
-- ============================================================
CREATE OR REPLACE FUNCTION get_user_org_id()
RETURNS UUID AS $$
  SELECT organization_id FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- 3. Helper function: check if user is super admin (bypasses org scoping)
-- ============================================================
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid() AND r.level >= 100
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- 4. Drop existing RLS policies that need updating
-- ============================================================

-- Organizations
DROP POLICY IF EXISTS "org_select" ON organizations;
DROP POLICY IF EXISTS "organizations_select_active" ON organizations;

-- Buildings
DROP POLICY IF EXISTS "building_select" ON buildings;
DROP POLICY IF EXISTS "buildings_select_active" ON buildings;

-- Locations
DROP POLICY IF EXISTS "location_select" ON locations;
DROP POLICY IF EXISTS "locations_select_active" ON locations;

-- Inspection records
DROP POLICY IF EXISTS "inspection_select_own" ON inspection_records;
DROP POLICY IF EXISTS "inspection_select_admin" ON inspection_records;
DROP POLICY IF EXISTS "inspection_select" ON inspection_records;

-- Users
DROP POLICY IF EXISTS "user_select_own" ON users;
DROP POLICY IF EXISTS "user_select_admin" ON users;
DROP POLICY IF EXISTS "users_select" ON users;

-- Audit logs
DROP POLICY IF EXISTS "audit_logs_select" ON audit_logs;

-- ============================================================
-- 5. New RLS policies with org scoping
-- ============================================================

-- ORGANIZATIONS:
-- Super admins see all, others see only their own org
CREATE POLICY "org_select_scoped" ON organizations
  FOR SELECT USING (
    is_super_admin() OR id = get_user_org_id()
  );

-- BUILDINGS:
-- Super admins see all, others see only buildings in their org
CREATE POLICY "building_select_scoped" ON buildings
  FOR SELECT USING (
    is_active = true AND (
      is_super_admin() OR organization_id = get_user_org_id()
    )
  );

-- LOCATIONS:
-- Super admins see all, others see only locations in their org
CREATE POLICY "location_select_scoped" ON locations
  FOR SELECT USING (
    is_active = true AND (
      is_super_admin() OR organization_id = get_user_org_id()
    )
  );

-- INSPECTION RECORDS:
-- Users see own inspections. Admins see org inspections. Super admins see all.
CREATE POLICY "inspection_select_scoped" ON inspection_records
  FOR SELECT USING (
    user_id = auth.uid()  -- own inspections
    OR is_super_admin()   -- super admin sees all
    OR (
      is_admin() AND EXISTS (  -- admin sees org inspections
        SELECT 1 FROM locations l
        WHERE l.id = inspection_records.location_id
        AND l.organization_id = get_user_org_id()
      )
    )
  );

-- USERS:
-- Users see own profile. Admins see org users. Super admins see all.
CREATE POLICY "user_select_scoped" ON users
  FOR SELECT USING (
    id = auth.uid()  -- own profile
    OR is_super_admin()  -- super admin sees all
    OR (
      is_admin() AND organization_id = get_user_org_id()  -- admin sees org users
    )
  );

-- AUDIT LOGS:
-- Super admins see all, admins see org logs
CREATE POLICY "audit_logs_select_scoped" ON audit_logs
  FOR SELECT USING (
    is_super_admin() OR (
      is_admin() AND (
        user_id = auth.uid()  -- own logs
        OR user_id IN (  -- logs from org users
          SELECT id FROM users WHERE organization_id = get_user_org_id()
        )
      )
    )
  );

-- ============================================================
-- 6. Keep existing INSERT/UPDATE/DELETE policies (they use is_admin/is_super_admin)
-- ============================================================
-- These don't need org scoping because:
-- - INSERT: admins create within their org (enforced at app level)
-- - UPDATE: admins update what they can SELECT (RLS handles it)
-- - DELETE: super admin only (already correct)
