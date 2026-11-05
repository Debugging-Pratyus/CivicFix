/**
 * Database migration — CivicFix v0.1.0
 *
 * Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New Query)
 * OR apply it via the Supabase CLI:
 *   supabase db push
 *
 * Tables created:
 *   profiles, complaints, master_issues,
 *   duplicate_suggestions, status_history, sla_records
 *
 * Also creates:
 *   - Required enums
 *   - Foreign key relationships
 *   - Indexes for common query patterns
 *   - Row Level Security (RLS) policies
 *   - Storage bucket: complaint-images
 *   - Helper function: increment_complaint_count
 */

-- ─── Extensions ─────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pg_trgm";    -- trigram indexes for text search

-- ─── Enums ───────────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE complaint_category AS ENUM (
    'pothole',
    'waste_accumulation',
    'damaged_streetlight',
    'blocked_drain',
    'water_leakage'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE complaint_status AS ENUM (
    'pending',
    'in_progress',
    'resolved',
    'overdue',
    'duplicate'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('citizen', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE duplicate_suggestion_status AS ENUM ('pending', 'confirmed', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── profiles ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID          PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role        user_role     NOT NULL DEFAULT 'citizen',
  full_name   TEXT,
  phone       TEXT,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Auto-create a profile row when a new auth user is created
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, role)
  VALUES (NEW.id, 'citizen')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─── master_issues ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS master_issues (
  id              UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
  category        complaint_category  NOT NULL,
  title           TEXT                NOT NULL,
  description     TEXT                NOT NULL,
  status          complaint_status    NOT NULL DEFAULT 'pending',
  location_text   TEXT,
  latitude        DOUBLE PRECISION    CHECK (latitude  BETWEEN -90  AND 90),
  longitude       DOUBLE PRECISION    CHECK (longitude BETWEEN -180 AND 180),
  complaint_count INT                 NOT NULL DEFAULT 1,
  priority_score  SMALLINT            CHECK (priority_score BETWEEN 0 AND 100),
  created_at      TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_master_issues_category ON master_issues(category);
CREATE INDEX IF NOT EXISTS idx_master_issues_status   ON master_issues(status);

-- ─── complaints ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS complaints (
  id                      UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_id             TEXT                NOT NULL UNIQUE,
  citizen_id              UUID                REFERENCES auth.users(id) ON DELETE SET NULL,
  category                complaint_category  NOT NULL,
  status                  complaint_status    NOT NULL DEFAULT 'pending',
  title                   TEXT                NOT NULL CHECK (char_length(title) BETWEEN 5 AND 200),
  description             TEXT                NOT NULL CHECK (char_length(description) >= 10),
  location_text           TEXT,
  latitude                DOUBLE PRECISION    CHECK (latitude  BETWEEN -90  AND 90),
  longitude               DOUBLE PRECISION    CHECK (longitude BETWEEN -180 AND 180),
  landmark_clues          TEXT,
  image_urls              TEXT[]              NOT NULL DEFAULT '{}',
  priority_score          SMALLINT            CHECK (priority_score BETWEEN 0 AND 100),
  priority_breakdown      JSONB,
  ai_classification_raw   JSONB,
  missing_info_flags      TEXT[]              NOT NULL DEFAULT '{}',
  requires_clarification  BOOLEAN             NOT NULL DEFAULT FALSE,
  assigned_to             UUID                REFERENCES profiles(id) ON DELETE SET NULL,
  master_issue_id         UUID                REFERENCES master_issues(id) ON DELETE SET NULL,
  created_at              TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_complaints_tracking_id    ON complaints(tracking_id);
CREATE INDEX IF NOT EXISTS idx_complaints_citizen_id     ON complaints(citizen_id);
CREATE INDEX IF NOT EXISTS idx_complaints_category       ON complaints(category);
CREATE INDEX IF NOT EXISTS idx_complaints_status         ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_priority_score ON complaints(priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_complaints_created_at     ON complaints(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_complaints_master_issue   ON complaints(master_issue_id);

-- Trigram index for full-text search on title + description
CREATE INDEX IF NOT EXISTS idx_complaints_title_trgm       ON complaints USING GIN (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_complaints_description_trgm ON complaints USING GIN (description gin_trgm_ops);

-- ─── duplicate_suggestions ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS duplicate_suggestions (
  id                    UUID                        PRIMARY KEY DEFAULT gen_random_uuid(),
  source_complaint_id   UUID                        NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  target_complaint_id   UUID                        REFERENCES complaints(id) ON DELETE CASCADE,
  master_issue_id       UUID                        REFERENCES master_issues(id) ON DELETE SET NULL,
  similarity_score      NUMERIC(4,3)                NOT NULL CHECK (similarity_score BETWEEN 0 AND 1),
  similarity_reasons    TEXT[]                      NOT NULL DEFAULT '{}',
  status                duplicate_suggestion_status NOT NULL DEFAULT 'pending',
  reviewed_by           UUID                        REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at           TIMESTAMPTZ,
  created_at            TIMESTAMPTZ                 NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dupsug_source  ON duplicate_suggestions(source_complaint_id);
CREATE INDEX IF NOT EXISTS idx_dupsug_status  ON duplicate_suggestions(status);
CREATE INDEX IF NOT EXISTS idx_dupsug_score   ON duplicate_suggestions(similarity_score DESC);

-- ─── status_history ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS status_history (
  id            UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id  UUID              NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  from_status   complaint_status,
  to_status     complaint_status  NOT NULL,
  changed_by    UUID              REFERENCES profiles(id) ON DELETE SET NULL,
  notes         TEXT,
  created_at    TIMESTAMPTZ       NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_status_history_complaint ON status_history(complaint_id);
CREATE INDEX IF NOT EXISTS idx_status_history_created   ON status_history(created_at DESC);

-- ─── sla_records ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sla_records (
  id              UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id    UUID                NOT NULL UNIQUE REFERENCES complaints(id) ON DELETE CASCADE,
  category        complaint_category  NOT NULL,
  priority_score  SMALLINT            NOT NULL CHECK (priority_score BETWEEN 0 AND 100),
  deadline_hours  INT                 NOT NULL,
  deadline_at     TIMESTAMPTZ         NOT NULL,
  resolved_at     TIMESTAMPTZ,
  is_overdue      BOOLEAN             NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sla_complaint    ON sla_records(complaint_id);
CREATE INDEX IF NOT EXISTS idx_sla_deadline     ON sla_records(deadline_at);
CREATE INDEX IF NOT EXISTS idx_sla_is_overdue   ON sla_records(is_overdue);

-- ─── updated_at trigger (applied to all relevant tables) ─────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DO $$ 
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['profiles','complaints','master_issues','sla_records'] LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trg_set_updated_at ON %I;
       CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON %I
       FOR EACH ROW EXECUTE FUNCTION set_updated_at();', t, t
    );
  END LOOP;
END $$;

-- ─── Helper: increment complaint count on a master_issue ─────────────────────
CREATE OR REPLACE FUNCTION increment_complaint_count(issue_id UUID)
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  UPDATE master_issues
  SET complaint_count = complaint_count + 1,
      updated_at      = NOW()
  WHERE id = issue_id;
END;
$$;

-- ─── Row Level Security ───────────────────────────────────────────────────────

ALTER TABLE profiles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints           ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_issues        ENABLE ROW LEVEL SECURITY;
ALTER TABLE duplicate_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_history       ENABLE ROW LEVEL SECURITY;
ALTER TABLE sla_records          ENABLE ROW LEVEL SECURITY;

-- Helper: is the caller an admin?
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- ── profiles ──
DROP POLICY IF EXISTS "profiles_self_read"   ON profiles;
DROP POLICY IF EXISTS "profiles_self_write"  ON profiles;
DROP POLICY IF EXISTS "profiles_admin_all"   ON profiles;

CREATE POLICY "profiles_self_read"
  ON profiles FOR SELECT
  USING (id = auth.uid() OR is_admin());

CREATE POLICY "profiles_self_write"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "profiles_admin_all"
  ON profiles FOR ALL
  USING (is_admin());

-- ── complaints ──
DROP POLICY IF EXISTS "complaints_citizen_insert"      ON complaints;
DROP POLICY IF EXISTS "complaints_citizen_read_own"    ON complaints;
DROP POLICY IF EXISTS "complaints_anon_read_by_track"  ON complaints;
DROP POLICY IF EXISTS "complaints_admin_all"           ON complaints;

-- Citizens can submit (anon or authenticated)
CREATE POLICY "complaints_citizen_insert"
  ON complaints FOR INSERT
  WITH CHECK (TRUE);  -- server validates via service role; anon inserts allowed

-- Citizens can read their own complaints
CREATE POLICY "complaints_citizen_read_own"
  ON complaints FOR SELECT
  USING (citizen_id = auth.uid() OR is_admin());

-- Anyone can read a complaint by tracking_id (for public tracking)
-- (Supabase RLS does not support per-row column filtering natively;
--  the API route controls what fields are returned to anonymous callers)
CREATE POLICY "complaints_anon_read_by_track"
  ON complaints FOR SELECT
  USING (TRUE);  -- field-level restriction enforced at the API layer

-- Admins have full access
CREATE POLICY "complaints_admin_all"
  ON complaints FOR ALL
  USING (is_admin());

-- ── master_issues ──
DROP POLICY IF EXISTS "master_issues_public_read" ON master_issues;
DROP POLICY IF EXISTS "master_issues_admin_all"   ON master_issues;

CREATE POLICY "master_issues_public_read"
  ON master_issues FOR SELECT USING (TRUE);

CREATE POLICY "master_issues_admin_all"
  ON master_issues FOR ALL USING (is_admin());

-- ── duplicate_suggestions ──
DROP POLICY IF EXISTS "dupsug_admin_all" ON duplicate_suggestions;

CREATE POLICY "dupsug_admin_all"
  ON duplicate_suggestions FOR ALL USING (is_admin());

-- ── status_history ──
DROP POLICY IF EXISTS "status_history_citizen_read_own" ON status_history;
DROP POLICY IF EXISTS "status_history_admin_all"        ON status_history;

CREATE POLICY "status_history_citizen_read_own"
  ON status_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM complaints c
      WHERE c.id = status_history.complaint_id
        AND (c.citizen_id = auth.uid() OR is_admin())
    )
  );

CREATE POLICY "status_history_admin_all"
  ON status_history FOR ALL USING (is_admin());

-- ── sla_records ──
DROP POLICY IF EXISTS "sla_admin_all" ON sla_records;

CREATE POLICY "sla_admin_all"
  ON sla_records FOR ALL USING (is_admin());

-- ─── Storage bucket ───────────────────────────────────────────────────────────
-- Run this only once; Supabase UI can also create the bucket.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'complaint-images',
  'complaint-images',
  FALSE,
  5242880,  -- 5 MB
  ARRAY['image/jpeg','image/png','image/webp','image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: anyone can upload; admins and complaint owners can read
DROP POLICY IF EXISTS "storage_upload_allow" ON storage.objects;
DROP POLICY IF EXISTS "storage_read_allow" ON storage.objects;

CREATE POLICY "storage_upload_allow"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'complaint-images');

CREATE POLICY "storage_read_allow"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'complaint-images');

-- CivicFix prototype: remove unnecessary public access policies

DROP POLICY IF EXISTS "profiles_self_write" ON public.profiles;

DROP POLICY IF EXISTS "complaints_anon_read_by_track" ON public.complaints;
DROP POLICY IF EXISTS "complaints_citizen_insert" ON public.complaints;

DROP POLICY IF EXISTS "master_issues_public_read" ON public.master_issues;

DROP POLICY IF EXISTS "storage_upload_allow" ON storage.objects;
DROP POLICY IF EXISTS "storage_read_allow" ON storage.objects;
