-- =============================================================================
-- Migration: 007_create_subjects_assignments.sql
-- Description: Create subjects and subject_assignments tables
-- Date: 2026-06-10 yyyy-mm-dd
-- Depends on: 002, 003, 004, 005
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.subjects (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying(100) NOT NULL,
  code character varying(20),
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  deleted_at timestamp without time zone,
  CONSTRAINT subjects_pkey PRIMARY KEY (id),
  CONSTRAINT subjects_code_key UNIQUE (code)
);


CREATE TABLE IF NOT EXISTS public.subject_assignments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  teacher_id uuid,
  class_id uuid,
  section_id uuid,
  subject_id uuid,
  academic_session_id uuid,
  assigned_by uuid,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  deleted_at timestamp without time zone,
  CONSTRAINT subject_assignments_pkey PRIMARY KEY (id),
  CONSTRAINT subject_assignments_teacher_id_class_id_section_id_subject__key
    UNIQUE (teacher_id, class_id, section_id, subject_id, academic_session_id),
  CONSTRAINT subject_assignments_class_id_fkey FOREIGN KEY (class_id) REFERENCES classes (id),
  CONSTRAINT subject_assignments_section_id_fkey FOREIGN KEY (section_id) REFERENCES sections (id),
  CONSTRAINT subject_assignments_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES subjects (id),
  CONSTRAINT subject_assignments_academic_session_id_fkey FOREIGN KEY (academic_session_id) REFERENCES academic_sessions (id),
  CONSTRAINT subject_assignments_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES teachers (id),
  CONSTRAINT subject_assignments_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES users (id)
);