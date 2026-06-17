-- =============================================================================
-- Migration: 005_create_academic_sessions.sql
-- Description: Create academic_sessions table
-- Date: 2026-06-10 yyyy-mm-dd
-- Depends on: 001, 002
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.academic_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying(50) NOT NULL,
  start_date date,
  end_date date,
  is_active boolean DEFAULT false,
  admission_test_enabled boolean DEFAULT true,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  deleted_at timestamp without time zone,
  CONSTRAINT academic_sessions_pkey PRIMARY KEY (id)
);