-- Migration: Add can_submit column to users table
-- Purpose: Server-side billing gate — block users who haven't paid from submitting inspections
-- Default: true (existing users keep access, set false manually for non-paying clients)

ALTER TABLE users ADD COLUMN IF NOT EXISTS can_submit BOOLEAN DEFAULT true;

-- Ensure existing users have the default
UPDATE users SET can_submit = true WHERE can_submit IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN users.can_submit IS
  'Controls whether user can submit inspection records. Set to false for billing enforcement.';
