-- LifeOS / Adım 7: Kişisel tercihler, hatırlatmalar ve güvenli admin altyapısı
-- Supabase SQL Editor'da bir kez çalıştırın.

CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  daily_intention text NOT NULL DEFAULT '',
  reminders_enabled boolean NOT NULL DEFAULT false,
  reminder_time time NOT NULL DEFAULT '09:00',
  weekly_review_enabled boolean NOT NULL DEFAULT true,
  onboarding_completed boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_preferences' AND policyname = 'Users manage own preferences'
  ) THEN
    CREATE POLICY "Users manage own preferences"
    ON public.user_preferences FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Admin rolleri ayrı bir tabloda tutulur. Normal kullanıcıların bu tabloya yazma izni yoktur.
CREATE TABLE IF NOT EXISTS public.lifeos_admins (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  granted_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.lifeos_admins ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'lifeos_admins' AND policyname = 'Users can read own admin status'
  ) THEN
    CREATE POLICY "Users can read own admin status"
    ON public.lifeos_admins FOR SELECT TO authenticated
    USING (auth.uid() = user_id);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.is_lifeos_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.lifeos_admins WHERE user_id = auth.uid()
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_lifeos_admin() TO authenticated;

-- Adminler kullanıcı listesini sadece kontrol paneli için görebilir.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'LifeOS admins can view all profiles'
  ) THEN
    CREATE POLICY "LifeOS admins can view all profiles"
    ON public.profiles FOR SELECT TO authenticated
    USING (public.is_lifeos_admin());
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.lifeos_admin_summary()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_lifeos_admin() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  RETURN jsonb_build_object(
    'users', (SELECT count(*) FROM public.profiles),
    'tasks', (SELECT count(*) FROM public.tasks),
    'goals', (SELECT count(*) FROM public.goals),
    'habits', (SELECT count(*) FROM public.habits),
    'mood_checkins', (SELECT count(*) FROM public.mood_checkins),
    'focus_sessions', (SELECT count(*) FROM public.focus_sessions)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.lifeos_admin_summary() TO authenticated;

-- KENDİNİ ADMIN YAPMA (bir kez çalıştır; UUID yerine kendi auth.users id'ni yaz):
-- INSERT INTO public.lifeos_admins (user_id)
-- VALUES ('BURAYA_KENDI_KULLANICI_UUID_ADRESINI_YAZ')
-- ON CONFLICT (user_id) DO NOTHING;
