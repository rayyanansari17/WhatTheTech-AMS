CREATE TABLE request_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action      TEXT NOT NULL,
  method      TEXT NOT NULL,
  path        TEXT NOT NULL,
  status      INTEGER,
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name   TEXT,
  user_email  TEXT,
  user_role   TEXT,
  ip_address  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_request_logs_created_at ON request_logs (created_at DESC);
CREATE INDEX idx_request_logs_action ON request_logs (action);
CREATE INDEX idx_request_logs_user_id ON request_logs (user_id);

ALTER TABLE request_logs ENABLE ROW LEVEL SECURITY;
