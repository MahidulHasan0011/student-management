-- =============================================================================
-- Migration: 008_create_exams_results.sql
-- Description: Create exams and exam_results tables
-- Date: 2026-06-10 yyyy-mm-dd
-- Depends on: 003, 004, 005, 007
-- =============================================================================

CREATE TYPE public.exam_type_enum AS ENUM (
    'ADMISSION',
    'MIDTERM',
    'FINAL',
    'UNIT_TEST'
);


CREATE TABLE IF NOT EXISTS public.exams (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying(100) NOT NULL,
  class_id uuid,
  academic_session_id uuid,
  exam_date date,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  deleted_at timestamp without time zone,
  exam_type exam_type_enum NOT NULL DEFAULT 'ADMISSION',
  CONSTRAINT exams_pkey PRIMARY KEY (id),
  CONSTRAINT exams_academic_session_id_fkey FOREIGN KEY (academic_session_id) REFERENCES academic_sessions (id),
  CONSTRAINT exams_class_id_fkey FOREIGN KEY (class_id) REFERENCES classes (id)
);

CREATE TABLE IF NOT EXISTS public.exam_results (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  exam_id uuid,
  student_id uuid,
  subject_id uuid,
  marks numeric(5, 2),
  grade character varying(5),
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  deleted_at timestamp without time zone,
  CONSTRAINT exam_results_pkey PRIMARY KEY (id),
  CONSTRAINT exam_results_exam_id_student_id_subject_id_key UNIQUE (exam_id, student_id, subject_id),
  CONSTRAINT exam_results_exam_id_fkey FOREIGN KEY (exam_id) REFERENCES exams (id),
  CONSTRAINT exam_results_student_id_fkey FOREIGN KEY (student_id) REFERENCES students (id),
  CONSTRAINT exam_results_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES subjects (id)
);