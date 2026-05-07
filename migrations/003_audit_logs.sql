CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userId UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  resourceId TEXT,
  metadata JSONB,
  ipAddress TEXT,
  createdAt TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_createdat ON audit_logs(userId, createdAt DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_createdat ON audit_logs(action, createdAt DESC);
