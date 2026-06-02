-- ============================================================
-- Batch Assign Organization to Existing Users
-- Date: 2025-06-03
-- Purpose: Assign all existing users without org to a specific organization
-- ============================================================

-- STEP 1: Check how many users have no org
SELECT COUNT(*) as users_without_org
FROM users
WHERE organization_id IS NULL;

-- STEP 2: List organizations to pick the right one
SELECT id, name, short_code, is_active
FROM organizations
ORDER BY created_at;

-- STEP 3: Assign all users without org to a specific organization
-- ⚠️ REPLACE 'YOUR_ORG_ID_HERE' with the actual organization UUID from STEP 2
--
-- UPDATE users
-- SET organization_id = 'YOUR_ORG_ID_HERE'
-- WHERE organization_id IS NULL;

-- ============================================================
-- ALTERNATIVE: Assign based on user's most-used location's org
-- (Auto-detect which org each user belongs to based on their inspections)
-- ============================================================

-- This query shows each user's most-inspected organization
SELECT
  u.id as user_id,
  u.full_name,
  u.email,
  l.organization_id as suggested_org_id,
  o.name as org_name,
  COUNT(ir.id) as inspection_count
FROM users u
JOIN inspection_records ir ON ir.user_id = u.id
JOIN locations l ON l.id = ir.location_id
JOIN organizations o ON o.id = l.organization_id
WHERE u.organization_id IS NULL
GROUP BY u.id, u.full_name, u.email, l.organization_id, o.name
ORDER BY u.full_name, inspection_count DESC;

-- After reviewing the suggestions above, run this to auto-assign
-- based on the user's most-inspected organization:
--
-- UPDATE users u
-- SET organization_id = (
--   SELECT l.organization_id
--   FROM inspection_records ir
--   JOIN locations l ON l.id = ir.location_id
--   WHERE ir.user_id = u.id
--   GROUP BY l.organization_id
--   ORDER BY COUNT(*) DESC
--   LIMIT 1
-- )
-- WHERE u.organization_id IS NULL;
