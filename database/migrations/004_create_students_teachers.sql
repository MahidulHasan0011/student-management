-- =============================================================================
-- Migration: 004_create_students_teachers.sql
-- Description: Create teachers and students tables
-- Date: 2026-06-10 yyyy-mm-dd
-- Depends on: 001, 002
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.teachers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  phone character varying(20),
  designation character varying(100),
  qualification text,
  joining_date date,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  deleted_at timestamp without time zone,
  CONSTRAINT teachers_pkey PRIMARY KEY (id),
  CONSTRAINT teachers_user_id_key UNIQUE (user_id),
  CONSTRAINT teachers_user_id_fkey FOREIGN KEY (user_id) REFERENCES users (id)
);


CREATE TABLE IF NOT EXISTS public.students (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  student_code character varying(30) NOT NULL,
  date_of_birth date,
  guardian_name character varying(100),
  guardian_phone character varying(20),
  address text,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  deleted_at timestamp without time zone,
  user_id uuid,
  CONSTRAINT students_pkey PRIMARY KEY (id),
  CONSTRAINT students_student_code_key UNIQUE (student_code),
  CONSTRAINT students_user_id_fkey FOREIGN KEY (user_id) REFERENCES users (id)
);