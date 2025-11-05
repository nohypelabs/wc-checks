-- =============================================================================
-- 🔍 CHECK: Difference between SQL vs User Management role assignment
-- =============================================================================
-- This will show if there's any difference in how roles are assigned
-- =============================================================================

-- STEP 1: Show agdscid@gmail.com role assignment details
-- =============================================================================
SELECT
  '🔍 agdscid Role Assignment (via SQL)' as description,
  ur.user_id,
  u.email,
  ur.role_id,
  r.name as role_name,
  r.level as role_level,
  ur.assigned_by,
  ur.assigned_at,
  ur.created_at,
  ur.updated_at,
  (SELECT email FROM users WHERE id = ur.assigned_by) as assigned_by_email
FROM user_roles ur
JOIN users u ON ur.user_id = u.id
JOIN roles r ON ur.role_id = r.id
WHERE u.email = 'agdscid@gmail.com';

-- STEP 2: Show OTHER level 100 users role assignment details
-- =============================================================================
SELECT
  '🔍 Other Level 100 Users (via User Management)' as description,
  ur.user_id,
  u.email,
  ur.role_id,
  r.name as role_name,
  r.level as role_level,
  ur.assigned_by,
  ur.assigned_at,
  ur.created_at,
  ur.updated_at,
  (SELECT email FROM users WHERE id = ur.assigned_by) as assigned_by_email
FROM user_roles ur
JOIN users u ON ur.user_id = u.id
JOIN roles r ON ur.role_id = r.id
WHERE u.email != 'agdscid@gmail.com'
  AND r.level >= 100
ORDER BY ur.created_at DESC;

-- STEP 3: Compare structure - check for missing fields
-- =============================================================================
SELECT
  '🔍 Field Comparison' as description,
  u.email,
  ur.role_id IS NOT NULL as has_role_id,
  ur.assigned_by IS NOT NULL as has_assigned_by,
  ur.assigned_at IS NOT NULL as has_assigned_at,
  ur.created_at IS NOT NULL as has_created_at,
  ur.updated_at IS NOT NULL as has_updated_at,
  r.level as role_level
FROM user_roles ur
JOIN users u ON ur.user_id = u.id
JOIN roles r ON ur.role_id = r.id
WHERE r.level >= 100
ORDER BY u.email;

-- STEP 4: Check if is_admin() and is_super_admin() work for ALL level 100 users
-- =============================================================================
-- This will test the functions for each user
SELECT
  '🔍 Function Test for All Level 100 Users' as description,
  u.id as user_id,
  u.email,
  r.level as role_level,
  -- Test if functions would work (simulating auth.uid())
  EXISTS (
    SELECT 1
    FROM user_roles ur2
    JOIN roles r2 ON ur2.role_id = r2.id
    WHERE ur2.user_id = u.id
    AND r2.level >= 80
  ) as would_pass_is_admin,
  EXISTS (
    SELECT 1
    FROM user_roles ur2
    JOIN roles r2 ON ur2.role_id = r2.id
    WHERE ur2.user_id = u.id
    AND r2.level >= 100
  ) as would_pass_is_super_admin,
  CASE
    WHEN EXISTS (
      SELECT 1
      FROM user_roles ur2
      JOIN roles r2 ON ur2.role_id = r2.id
      WHERE ur2.user_id = u.id
      AND r2.level >= 80
    ) THEN '✅ Should be able to see all reports'
    ELSE '❌ Cannot see all reports'
  END as expected_access
FROM users u
JOIN user_roles ur ON ur.user_id = u.id
JOIN roles r ON ur.role_id = r.id
WHERE r.level >= 100
ORDER BY u.email;

-- STEP 5: Raw data dump for comparison
-- =============================================================================
SELECT
  '🔍 Raw Data - ALL Level 80+ Users' as description,
  u.email,
  ur.user_id,
  ur.role_id,
  r.name as role_name,
  r.level,
  ur.assigned_by,
  ur.assigned_at,
  ur.created_at,
  (ur.assigned_at IS NOT NULL) as has_assigned_at,
  (ur.assigned_by IS NOT NULL) as has_assigned_by
FROM user_roles ur
JOIN users u ON ur.user_id = u.id
JOIN roles r ON ur.role_id = r.id
WHERE r.level >= 80
ORDER BY r.level DESC, u.email;

-- =============================================================================
-- 🎯 INTERPRETATION:
-- =============================================================================
/*
Look for differences between agdscid and other users:

1. If assigned_by is NULL for others but NOT NULL for agdscid:
   → Backend API didn't write assigned_by correctly

2. If assigned_at format is different:
   → Timestamp issue

3. If role_id is different:
   → Different role assigned (should all be same for level 100)

4. If would_pass_is_admin is FALSE for others:
   → Role assignment didn't work properly

5. If ALL fields look identical:
   → Problem is NOT in database, might be frontend caching or RLS function issue
*/
