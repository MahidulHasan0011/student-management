-- =============================================================================
-- Migration: 012_create_attendance_logs.sql
-- Description: Create attendance_logs table for staff/teacher check-in check-out
-- Date: 2026-06-10 yyyy-mm-dd
-- Depends on: 002
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.attendance_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  attendance_date date NOT NULL,
  check_in timestamp without time zone,
  check_out timestamp without time zone,
  total_work_minutes integer DEFAULT 0,
  status character varying(20) DEFAULT 'PRESENT',
  notes text,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  deleted_at timestamp without time zone,
  ip_address text,
  check_in_latitude numeric,
  check_in_longitude numeric,
  check_out_latitude numeric,
  check_out_longitude numeric,
  CONSTRAINT attendance_logs_pkey PRIMARY KEY (id),
  CONSTRAINT attendance_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES users (id)
);