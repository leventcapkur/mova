-- Mova / Adım 8: yayın öncesi güvenlik ve performans düzenlemeleri
-- Bunu; dashboard_step_1.sql, habits_step_2.sql, water_step_3.sql,
-- sleep_step_4.sql, life_center_step_6.sql ve experience_step_7.sql
-- dosyalarından SONRA Supabase SQL Editor'da bir kez çalıştırın.
-- Komutlar tekrar çalıştırılabilir; kullanıcı verilerini silmez.

-- Sık kullanılan kullanıcı sorgularını hızlandırır.
CREATE INDEX IF NOT EXISTS idx_tasks_user_due_date ON public.tasks(user_id, due_date);
CREATE INDEX IF NOT EXISTS idx_goals_user_created_at ON public.goals(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_weekly_reviews_user_week ON public.weekly_reviews(user_id, week_start DESC);

-- updated_at alanlarının gerçekten son değişikliği göstermesini sağlar.
CREATE OR REPLACE FUNCTION public.mova_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS mova_preferences_updated_at ON public.user_preferences;
CREATE TRIGGER mova_preferences_updated_at
BEFORE UPDATE ON public.user_preferences
FOR EACH ROW EXECUTE FUNCTION public.mova_set_updated_at();

DROP TRIGGER IF EXISTS mova_water_settings_updated_at ON public.water_settings;
CREATE TRIGGER mova_water_settings_updated_at
BEFORE UPDATE ON public.water_settings
FOR EACH ROW EXECUTE FUNCTION public.mova_set_updated_at();

DROP TRIGGER IF EXISTS mova_balance_updated_at ON public.life_balance_scores;
CREATE TRIGGER mova_balance_updated_at
BEFORE UPDATE ON public.life_balance_scores
FOR EACH ROW EXECUTE FUNCTION public.mova_set_updated_at();

-- Her kullanıcı yalnızca kendi profilini okuyup değiştirebilir.
-- Yönetim fonksiyonu service-role ile çalıştığı için bu kural admin ekranını etkilemez.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users read own profile'
  ) THEN
    CREATE POLICY "Users read own profile" ON public.profiles
    FOR SELECT TO authenticated USING (auth.uid() = id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users create own profile'
  ) THEN
    CREATE POLICY "Users create own profile" ON public.profiles
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users update own profile'
  ) THEN
    CREATE POLICY "Users update own profile" ON public.profiles
    FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- SECURITY DEFINER fonksiyonları yalnızca oturum açmış kullanıcılara açık tutar.
REVOKE ALL ON FUNCTION public.mova_set_updated_at() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_lifeos_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.lifeos_admin_summary() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_lifeos_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.lifeos_admin_summary() TO authenticated;
