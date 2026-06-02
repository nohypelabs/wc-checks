-- Migration: Inspection Limits & Billing Plans
-- Date: 2025-06-03
-- Purpose: Add plan tiers and monthly inspection limits

-- ============================================================
-- 1. Add plan columns to users table
-- ============================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'free';
ALTER TABLE users ADD COLUMN IF NOT EXISTS inspection_limit INTEGER NOT NULL DEFAULT 50;

-- Index for plan lookups
CREATE INDEX IF NOT EXISTS idx_users_plan ON users(plan);

-- ============================================================
-- 2. Plan constraints
-- ============================================================
-- Allowed plan values
ALTER TABLE users ADD CONSTRAINT IF NOT EXISTS users_plan_check
  CHECK (plan IN ('free', 'basic', 'pro', 'pro_max'));

-- Limit must be positive
ALTER TABLE users ADD CONSTRAINT IF NOT EXISTS users_inspection_limit_check
  CHECK (inspection_limit > 0);

-- ============================================================
-- 3. Helper function: count inspections this month for a user
-- ============================================================
CREATE OR REPLACE FUNCTION count_monthly_inspections(p_user_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM inspection_records
  WHERE user_id = p_user_id
    AND inspection_date >= date_trunc('month', CURRENT_DATE)::date
    AND inspection_date < (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month')::date;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- 4. Plan definitions (for reference)
-- ============================================================
-- | Plan     | Limit     | Price/month |
-- |----------|-----------|-------------|
-- | free     | 50        | Rp 0        |
-- | basic    | 500       | Rp 699,000  |
-- | pro      | 1,000     | Rp 1,499,000|
-- | pro_max  | unlimited | Rp 2,999,000|
--
-- Unlimited is represented by inspection_limit = 999999
