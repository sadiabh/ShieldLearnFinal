-- ─────────────────────────────────────────────────────────────────────────────
--  ShieldLearn Postgres schema for Supabase
--
--  Run this once in your Supabase project: SQL Editor → New query → paste
--  this file → Run.
--
--  Conventions:
--    • Surrogate IDs use BIGSERIAL; users.id is TEXT (UUID strings).
--    • Booleans (coming_soon, passed) are SMALLINT (0/1) — matches the
--      shape the React frontend already consumes.
--    • Timestamps default to now() (TIMESTAMPTZ).
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name          TEXT,
  phone         TEXT,
  role          TEXT,
  avatar_index  INTEGER,
  linkedin      TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS categories (
  id    BIGSERIAL PRIMARY KEY,
  icon  TEXT NOT NULL,
  label TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS modules (
  id           BIGSERIAL PRIMARY KEY,
  category_id  BIGINT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  icon         TEXT NOT NULL,
  title        TEXT NOT NULL,
  description  TEXT,
  level        TEXT NOT NULL,
  path         TEXT,
  coming_soon  SMALLINT DEFAULT 0,
  module_type  TEXT,
  badge        TEXT,
  accent_color TEXT
);

CREATE TABLE IF NOT EXISTS questions (
  id          BIGSERIAL PRIMARY KEY,
  module_id   BIGINT NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  data        JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS scores (
  id           BIGSERIAL PRIMARY KEY,
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  module_id    BIGINT NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  score        INTEGER NOT NULL,
  total        INTEGER NOT NULL,
  passed       SMALLINT NOT NULL,
  badge        TEXT,
  completed_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS surveys (
  id            BIGSERIAL PRIMARY KEY,
  module_name   TEXT NOT NULL,
  q1_rating     INTEGER,
  q2_difficulty TEXT,
  q3_helpful    JSONB,
  q4_nps        INTEGER,
  q5_feedback   TEXT,
  q6_confidence TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS forum_posts (
  id         BIGSERIAL PRIMARY KEY,
  user_id    TEXT REFERENCES users(id) ON DELETE SET NULL,
  author     TEXT NOT NULL,
  avatar     TEXT DEFAULT '👤',
  category   TEXT DEFAULT '💬 General',
  title      TEXT NOT NULL,
  body       TEXT NOT NULL,
  likes      INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Useful indexes for the queries the API actually runs
CREATE INDEX IF NOT EXISTS idx_modules_category   ON modules(category_id);
CREATE INDEX IF NOT EXISTS idx_questions_module   ON questions(module_id, order_index);
CREATE INDEX IF NOT EXISTS idx_scores_user        ON scores(user_id, completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_created      ON forum_posts(created_at DESC);
