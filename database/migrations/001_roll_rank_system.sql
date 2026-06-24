-- =============================================================================
-- MIGRATION: Roll & Rank Generation System — schema additions
-- এই migration আগের সব table-কে ALTER করে, কোনো ডাটা delete হবে না
-- =============================================================================

-- ── exam_status_enum ─────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE exam_status_enum AS ENUM ('DRAFT', 'PUBLISHED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── exams টেবিলে status column ───────────────────────────────
-- ডিফল্ট DRAFT — কোনো exam তৈরি হলেই PUBLISHED ধরা হবে না,
-- admin/teacher আলাদা করে "publish" না করলে result গণনায় আসবে না
ALTER TABLE public.exams
  ADD COLUMN IF NOT EXISTS status exam_status_enum NOT NULL DEFAULT 'DRAFT';

-- ──   + admission tracking ──
-- ranking_locked: rank generate হয়ে গেলে true — নতুন automatic recalculation আটকাবে
-- admission_date: NEW student-দের FIFO ranking-এর জন্য দরকার (student_enrollments.created_at দিয়েই
--   কাজ চলে যেত, কিন্তু আলাদা explicit column রাখলে ভবিষ্যতে admission_date বদলানো সহজ হয়,
--   created_at কখনো বদলানো ঠিক নয়)
ALTER TABLE public.student_enrollments
  ADD COLUMN IF NOT EXISTS admission_date date,
  ADD COLUMN IF NOT EXISTS ranking_locked boolean NOT NULL DEFAULT false;

-- পুরনো রেকর্ডে admission_date ফাঁকা থাকলে created_at দিয়ে backfill করো
UPDATE public.student_enrollments
SET admission_date = created_at::date
WHERE admission_date IS NULL;

-- ── academic_sessions-এ class-level lock track করার table ───
-- ranking_locked আসলে per-class+per-session হওয়া উচিত (document অনুযায়ী),
-- তাই student_enrollments-এ rাখা flag-টাই যথেষ্ট না — class-wide lock আলাদা track করতে হবে
CREATE TABLE IF NOT EXISTS public.ranking_locks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL,
  academic_session_id uuid NOT NULL,
  is_locked boolean NOT NULL DEFAULT false,
  locked_at timestamp without time zone,
  locked_by uuid,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT ranking_locks_pkey PRIMARY KEY (id),
  CONSTRAINT ranking_locks_class_session_key UNIQUE (class_id, academic_session_id),
  CONSTRAINT ranking_locks_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes (id),
  CONSTRAINT ranking_locks_session_id_fkey FOREIGN KEY (academic_session_id) REFERENCES public.academic_sessions (id),
  CONSTRAINT ranking_locks_locked_by_fkey FOREIGN KEY (locked_by) REFERENCES public.users (id)
);

-- ── ranking_history টেবিল — প্রতিবার rank generate/recalculate হলে snapshot সংরক্ষণ ──
CREATE TABLE IF NOT EXISTS public.ranking_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  academic_session_id uuid NOT NULL,
  class_id uuid NOT NULL,
  student_id uuid NOT NULL,
  total_score numeric(7, 2) NOT NULL,
  rank_position integer NOT NULL,
  roll_number integer NOT NULL,
  version integer NOT NULL DEFAULT 1,
  generated_at timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT ranking_history_pkey PRIMARY KEY (id),
  CONSTRAINT ranking_history_session_id_fkey FOREIGN KEY (academic_session_id) REFERENCES public.academic_sessions (id),
  CONSTRAINT ranking_history_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes (id),
  CONSTRAINT ranking_history_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students (id)
);

-- version lookup দ্রুত করার জন্য index
CREATE INDEX IF NOT EXISTS idx_ranking_history_class_session
  ON public.ranking_history (class_id, academic_session_id, version);