DO $$ BEGIN
  CREATE TYPE enrollment_type_enum AS ENUM ('OLD', 'NEW');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.student_enrollments
  ADD COLUMN IF NOT EXISTS enrollment_type enrollment_type_enum NOT NULL DEFAULT 'OLD';
