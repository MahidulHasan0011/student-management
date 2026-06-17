-- =============================================================================
-- Migration: 006_create_enrollments.sql
-- Description: Create student_enrollments table
-- Date: 2026-06-10 yyyy-mm-dd
-- Depends on: 003, 004, 005
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.student_enrollments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  student_id uuid,
  class_id uuid,
  section_id uuid,
  academic_session_id uuid,
  roll_number integer,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  deleted_at timestamp without time zone,
  CONSTRAINT student_enrollments_pkey PRIMARY KEY (id),
  CONSTRAINT student_enrollments_student_id_academic_session_id_key UNIQUE (student_id, academic_session_id),
  CONSTRAINT student_enrollments_academic_session_id_fkey FOREIGN KEY (academic_session_id) REFERENCES academic_sessions (id),
  CONSTRAINT student_enrollments_class_id_fkey FOREIGN KEY (class_id) REFERENCES classes (id),
  CONSTRAINT student_enrollments_section_id_fkey FOREIGN KEY (section_id) REFERENCES sections (id),
  CONSTRAINT student_enrollments_student_id_fkey FOREIGN KEY (student_id) REFERENCES students (id)
);
