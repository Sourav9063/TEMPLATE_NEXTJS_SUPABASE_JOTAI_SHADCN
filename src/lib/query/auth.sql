CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email varchar(320) NOT NULL UNIQUE,
  display_name varchar(160),
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name varchar(160);
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url text;

CREATE TABLE IF NOT EXISTS auth_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code_hash char(64) NOT NULL,
  magic_token_hash char(64) NOT NULL UNIQUE,
  attempts smallint NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS auth_challenges_email_idx
  ON auth_challenges (user_id, created_at DESC)
  WHERE used_at IS NULL;

CREATE INDEX IF NOT EXISTS sessions_user_idx
  ON sessions (user_id, expires_at DESC)
  WHERE revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS auth_challenges_expiry_idx
  ON auth_challenges (expires_at);

CREATE INDEX IF NOT EXISTS sessions_expiry_idx
  ON sessions (expires_at);
