-- Migration: Create audit_logs table and function
-- Purpose: Track all admin actions for compliance and security
-- Run this in Supabase SQL Editor

-- 1. Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  details JSONB DEFAULT '{}'::jsonb,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);

-- 3. Create RPC function for creating audit logs
CREATE OR REPLACE FUNCTION public.create_audit_log(
  p_user_id UUID,
  p_action TEXT,
  p_resource_type TEXT,
  p_resource_id UUID DEFAULT NULL,
  p_details JSONB DEFAULT NULL,
  p_success BOOLEAN DEFAULT TRUE,
  p_error_message TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_audit_id UUID;
BEGIN
  INSERT INTO audit_logs (
    user_id,
    action,
    resource_type,
    resource_id,
    details,
    success,
    error_message,
    created_at
  )
  VALUES (
    p_user_id,
    p_action,
    p_resource_type,
    p_resource_id,
    COALESCE(p_details, '{}'::jsonb),
    p_success,
    p_error_message,
    NOW()
  )
  RETURNING id INTO v_audit_id;

  RETURN v_audit_id;

EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the transaction
    RAISE WARNING 'Audit log failed: %', SQLERRM;
    RETURN NULL;
END;
$$;

-- 4. Grant necessary permissions
-- Service role should be able to insert audit logs
GRANT INSERT, SELECT ON audit_logs TO service_role;
GRANT EXECUTE ON FUNCTION create_audit_log TO service_role;

-- 5. Add comment for documentation
COMMENT ON TABLE audit_logs IS 'Stores audit trail of all admin actions for compliance and security monitoring';
COMMENT ON FUNCTION create_audit_log IS 'Creates audit log entry for admin actions. Returns audit log ID or NULL if failed.';

-- 6. Example queries to verify setup:
-- SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 10;
-- SELECT action, COUNT(*) FROM audit_logs GROUP BY action;
-- SELECT * FROM audit_logs WHERE user_id = 'your-user-id' ORDER BY created_at DESC;
