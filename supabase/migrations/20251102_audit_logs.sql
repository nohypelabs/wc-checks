-- =============================================================================
-- Audit Logs System - Enterprise Grade Tracking
-- =============================================================================
-- Created: 2025-11-02
-- Purpose: Track all admin actions for compliance and security
-- =============================================================================

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Who did it
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  user_role TEXT,

  -- What happened
  action TEXT NOT NULL, -- 'ASSIGN_ROLE', 'TOGGLE_USER_STATUS', 'DELETE_USER', etc.
  resource_type TEXT NOT NULL, -- 'user', 'role', 'building', etc.
  resource_id UUID,

  -- Details
  details JSONB DEFAULT '{}'::jsonb,

  -- Context
  ip_address INET,
  user_agent TEXT,

  -- Result
  success BOOLEAN DEFAULT true,
  error_message TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Indexes for fast querying
  CONSTRAINT audit_logs_action_check CHECK (action ~ '^[A-Z_]+$')
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Only admins can view audit logs
CREATE POLICY "Only admins can view audit logs"
ON audit_logs FOR SELECT
TO authenticated
USING (
  public.is_admin()
);

-- System can insert audit logs (via service role)
CREATE POLICY "System can insert audit logs"
ON audit_logs FOR INSERT
TO authenticated
WITH CHECK (true);

-- No one can update or delete audit logs (immutable)
-- This ensures audit trail integrity

-- =============================================================================
-- Helper Function: Create Audit Log Entry
-- =============================================================================
CREATE OR REPLACE FUNCTION public.create_audit_log(
  p_user_id UUID,
  p_action TEXT,
  p_resource_type TEXT,
  p_resource_id UUID DEFAULT NULL,
  p_details JSONB DEFAULT '{}'::jsonb,
  p_success BOOLEAN DEFAULT true,
  p_error_message TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_email TEXT;
  v_user_role TEXT;
  v_log_id UUID;
BEGIN
  -- Get user email
  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = p_user_id;

  -- Get user role
  SELECT r.name INTO v_user_role
  FROM user_roles ur
  JOIN roles r ON ur.role_id = r.id
  WHERE ur.user_id = p_user_id;

  -- Insert audit log
  INSERT INTO audit_logs (
    user_id,
    user_email,
    user_role,
    action,
    resource_type,
    resource_id,
    details,
    success,
    error_message
  ) VALUES (
    p_user_id,
    v_user_email,
    COALESCE(v_user_role, 'user'),
    p_action,
    p_resource_type,
    p_resource_id,
    p_details,
    p_success,
    p_error_message
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;

-- =============================================================================
-- Sample Audit Log Queries
-- =============================================================================

-- View recent admin actions
-- SELECT
--   al.created_at,
--   al.user_email,
--   al.action,
--   al.resource_type,
--   al.details
-- FROM audit_logs al
-- ORDER BY al.created_at DESC
-- LIMIT 100;

-- View specific user's actions
-- SELECT * FROM audit_logs
-- WHERE user_id = 'xxx'
-- ORDER BY created_at DESC;

-- View failed actions
-- SELECT * FROM audit_logs
-- WHERE success = false
-- ORDER BY created_at DESC;

-- =============================================================================
-- Grant permissions
-- =============================================================================
GRANT SELECT ON audit_logs TO authenticated;
GRANT INSERT ON audit_logs TO service_role;
GRANT EXECUTE ON FUNCTION create_audit_log TO service_role;

-- =============================================================================
-- Comments
-- =============================================================================
COMMENT ON TABLE audit_logs IS 'Immutable audit trail for all admin actions';
COMMENT ON FUNCTION create_audit_log IS 'Helper function to create audit log entries (service role only)';
