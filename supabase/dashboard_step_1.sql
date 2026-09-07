-- LifeOS / Adım 1: Görevleri hedeflere bağlama
-- Supabase SQL Editor'da bir kez çalıştırın.

ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS goal_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'tasks_goal_id_fkey'
  ) THEN
    ALTER TABLE public.tasks
    ADD CONSTRAINT tasks_goal_id_fkey
    FOREIGN KEY (goal_id)
    REFERENCES public.goals(id)
    ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_tasks_goal_id
ON public.tasks(goal_id);
