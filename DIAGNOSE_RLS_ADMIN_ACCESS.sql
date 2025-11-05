-- =============================================================================
-- 🔍 DIAGNOSTIC: Why only agdscid@gmail.com can access all reports?
-- =============================================================================
-- Run this with different user accounts to see what's happening
-- =============================================================================

-- STEP 1: Show current user (who is running this query)
-- =============================================================================
SELECT
  '🔍 STEP 1: Current User' as step,
  auth.uid() as current_user_id,
  (SELECT email FROM users WHERE id = auth.uid()) as current_email;

-- STEP 2: Show current user's role assignment
-- =============================================================================
SELECT
  '🔍 STEP 2: Current User Role' as step,
  ur.user_id,
  u.email,
  u.full_name,
  r.id as role_id,
  r.name as role_name,
  r.level as role_level,
  CASE
    WHEN r.level >= 100 THEN '👑 Should have full access'
    WHEN r.level >= 80 THEN '⭐ Should see all reports'
    ELSE '👤 Should see own reports only'
  END as expected_access
FROM user_roles ur
JOIN users u ON ur.user_id = u.id
JOIN roles r ON ur.role_id = r.id
WHERE ur.user_id = auth.uid();

-- STEP 3: Test is_admin() function
-- =============================================================================
SELECT
  '🔍 STEP 3: is_admin() Function Test' as step,
  auth.uid() as user_id,
  (SELECT email FROM users WHERE id = auth.uid()) as email,
  public.is_admin() as is_admin_result,
  CASE
    WHEN public.is_admin() = true THEN '✅ Function returns TRUE - should see all reports'
    ELSE '❌ Function returns FALSE - will only see own reports'
  END as interpretation;

-- STEP 4: Test is_super_admin() function
-- =============================================================================
SELECT
  '🔍 STEP 4: is_super_admin() Function Test' as step,
  auth.uid() as user_id,
  (SELECT email FROM users WHERE id = auth.uid()) as email,
  public.is_super_admin() as is_super_admin_result,
  CASE
    WHEN public.is_super_admin() = true THEN '✅ Function returns TRUE - super admin'
    ELSE '❌ Function returns FALSE - not super admin'
  END as interpretation;

-- STEP 5: Manual check - what the function SHOULD return
-- =============================================================================
SELECT
  '🔍 STEP 5: Manual Level Check' as step,
  ur.user_id,
  u.email,
  r.level as role_level,
  r.level >= 80 as should_be_admin,
  r.level >= 100 as should_be_super_admin,
  CASE
    WHEN r.level >= 80 THEN '✅ Level >= 80, is_admin() SHOULD return TRUE'
    ELSE '❌ Level < 80, is_admin() SHOULD return FALSE'
  END as expected_function_behavior
FROM user_roles ur
JOIN users u ON ur.user_id = u.id
JOIN roles r ON ur.role_id = r.id
WHERE ur.user_id = auth.uid();

-- STEP 6: Check RLS policy on inspection_records
-- =============================================================================
SELECT
  '🔍 STEP 6: RLS Policy Check' as step,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies
WHERE tablename = 'inspection_records'
  AND cmd = 'SELECT'
ORDER BY policyname;

-- STEP 7: Test actual query with explicit conditions
-- =============================================================================
SELECT
  '🔍 STEP 7: Test Inspection Query' as step,
  COUNT(*) FILTER (WHERE user_id = auth.uid()) as own_inspections,
  COUNT(*) FILTER (WHERE user_id != auth.uid()) as other_users_inspections,
  COUNT(*) as total_visible_inspections,
  CASE
    WHEN COUNT(*) FILTER (WHERE user_id != auth.uid()) > 0 THEN '✅ Can see other users - admin access working'
    ELSE '❌ Cannot see other users - admin access NOT working'
  END as access_status
FROM inspection_records;

-- STEP 8: Compare with agdscid@gmail.com
-- =============================================================================
SELECT
  '🔍 STEP 8: agdscid Role Info' as step,
  u.id as agdscid_user_id,
  u.email,
  r.name as role_name,
  r.level as role_level,
  ur.assigned_at
FROM users u
LEFT JOIN user_roles ur ON ur.user_id = u.id
LEFT JOIN roles r ON r.id = ur.role_id
WHERE u.email = 'agdscid@gmail.com';

-- STEP 9: Compare current user with agdscid
-- =============================================================================
WITH current_user_info AS (
  SELECT
    u.id,
    u.email,
    r.level as role_level
  FROM users u
  LEFT JOIN user_roles ur ON ur.user_id = u.id
  LEFT JOIN roles r ON r.id = ur.role_id
  WHERE u.id = auth.uid()
),
agdscid_info AS (
  SELECT
    u.id,
    u.email,
    r.level as role_level
  FROM users u
  LEFT JOIN user_roles ur ON ur.user_id = u.id
  LEFT JOIN roles r ON r.id = ur.role_id
  WHERE u.email = 'agdscid@gmail.com'
)
SELECT
  '🔍 STEP 9: Comparison' as step,
  c.email as current_user_email,
  c.role_level as current_user_level,
  a.email as agdscid_email,
  a.role_level as agdscid_level,
  c.role_level = a.role_level as same_level,
  CASE
    WHEN c.role_level = a.role_level THEN '✅ Same level - should have same access'
    WHEN c.role_level > a.role_level THEN '⚠️ Higher level - should have MORE access'
    ELSE '❌ Lower level - different access expected'
  END as comparison
FROM current_user_info c
CROSS JOIN agdscid_info a;

-- STEP 10: Check if function has permission issues
-- =============================================================================
SELECT
  '🔍 STEP 10: Function Permissions' as step,
  n.nspname as schema,
  p.proname as function_name,
  pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname IN ('is_admin', 'is_super_admin')
ORDER BY p.proname;

-- =============================================================================
-- 🎯 INTERPRETATION GUIDE
-- =============================================================================
/*
Expected Results for Level 80+ Admin:
  - STEP 2: Should show role with level >= 80
  - STEP 3: is_admin() should return TRUE
  - STEP 4: is_super_admin() might be FALSE (only TRUE for level 100+)
  - STEP 5: should_be_admin should be TRUE
  - STEP 7: Should see other_users_inspections > 0
  - STEP 9: If same level as agdscid, comparison should say "Same level"

If is_admin() returns FALSE but level >= 80:
  → Function is broken or not using correct logic

If is_admin() returns TRUE but STEP 7 shows 0 other_users_inspections:
  → RLS policy is not working correctly
  → Maybe function has wrong permissions (not SECURITY DEFINER)

If everything looks correct but still can't access:
  → Possible Supabase caching issue
  → Try: Refresh RLS cache or restart Supabase
*/
