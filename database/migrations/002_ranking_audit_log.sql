-- =============================================================================
-- MIGRATION: ranking_audit_log — কে কখন কী ranking action নিয়েছে তার পূর্ণ trail
-- কোনো পুরনো table পরিবর্তন হবে না, শুধু নতুন audit table যোগ হবে
-- =============================================================================

-- ── ranking_action_enum ──────────────────────────────────────
-- GENERATE          : প্রথমবার auto/manual roll+rank generate হলো
-- RECALCULATE       : admin manual RECALCULATE_RANKING চালালো
-- UNLOCK            : admin শুধু unlock করলো (regenerate ছাড়া)
-- LOCK              : rank generate শেষে system নিজে lock করলো
-- AUTO_TRIGGER      : exam publish হওয়ায় system নিজে job enqueue করলো
-- AUTO_TRIGGER_SKIP : publish হলো কিন্তু শর্ত পূরণ না হওয়ায় (বা locked) skip করা হলো
DO $$ BEGIN
  CREATE TYPE ranking_action_enum AS ENUM (
    'GENERATE', 'RECALCULATE', 'UNLOCK', 'LOCK', 'AUTO_TRIGGER', 'AUTO_TRIGGER_SKIP'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.ranking_audit_log (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  action ranking_action_enum NOT NULL,
  class_id uuid NOT NULL,
  academic_session_id uuid NOT NULL,
  actor_id uuid,                       -- NULL = system (auto-trigger), নাহলে যে user করেছে
  from_version integer,                -- recalc-এর আগে কোন version ছিল
  to_version integer,                  -- এই action-এর পর কোন version হলো
  detail jsonb,                        -- অতিরিক্ত context (reason, examType, rankedCount ইত্যাদি)
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT ranking_audit_log_pkey PRIMARY KEY (id),
  CONSTRAINT ranking_audit_log_class_id_fkey
    FOREIGN KEY (class_id) REFERENCES public.classes (id),
  CONSTRAINT ranking_audit_log_session_id_fkey
    FOREIGN KEY (academic_session_id) REFERENCES public.academic_sessions (id),
  CONSTRAINT ranking_audit_log_actor_id_fkey
    FOREIGN KEY (actor_id) REFERENCES public.users (id)
);

-- class+session-এর timeline দ্রুত পড়ার জন্য
CREATE INDEX IF NOT EXISTS idx_ranking_audit_class_session
  ON public.ranking_audit_log (class_id, academic_session_id, created_at DESC);
