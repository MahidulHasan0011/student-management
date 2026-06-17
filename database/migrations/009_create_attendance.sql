-- =============================================================================
-- Migration: 009_create_attendance.sql
-- Description: Create student_attendance table
-- Date: 2026-06-10 yyyy-mm-dd
-- Depends on: 003, 004
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.student_attendance (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  student_id uuid,
  class_id uuid,
  section_id uuid,
  attendance_date date,
  status character varying(20),
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  deleted_at timestamp without time zone,
  CONSTRAINT student_attendance_pkey PRIMARY KEY (id),
  CONSTRAINT student_attendance_class_id_fkey FOREIGN KEY (class_id) REFERENCES classes (id),
  CONSTRAINT student_attendance_section_id_fkey FOREIGN KEY (section_id) REFERENCES sections (id),
  CONSTRAINT student_attendance_student_id_fkey FOREIGN KEY (student_id) REFERENCES students (id),
  CONSTRAINT chk_student_attendance_status CHECK (status IN ('PRESENT', 'ABSENT', 'LATE', 'EXCUSED'))
);