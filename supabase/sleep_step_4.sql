-- LifeOS / Adım 4: Uyku Takibi
-- Supabase SQL Editor'da bir kez çalıştırın.

CREATE TABLE IF NOT EXISTS public.sleep_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sleep_started_at timestamptz NOT NULL,
  woke_at timestamptz NOT NULL,
  duration_minutes integer NOT NULL CHECK (duration_minutes BETWEEN 30 AND 1440),
  quality integer NOT NULL DEFAULT 3 CHECK (quality BETWEEN 1 AND 5),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (woke_at > sleep_started_at)
);

CREATE INDEX IF NOT EXISTS idx_sleep_entries_user_start
ON public.sleep_entries(user_id, sleep_started_at DESC);

ALTER TABLE public.sleep_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own sleep entries"
ON public.sleep_entries
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
