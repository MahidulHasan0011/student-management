-- =============================================================================
-- Migration: 011_create_leaves.sql
-- Description: Create leaves table
-- Date: 2026-06-10 yyyy-mm-dd
-- Depends on: 002
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.leaves (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  leave_type character varying(50),
  start_date date,
  end_date date,
  reason text,
  status character varying(20) DEFAULT 'PENDING',
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  deleted_at timestamp without time zone,
  CONSTRAINT leaves_pkey PRIMARY KEY (id),
  CONSTRAINT leaves_user_id_fkey FOREIGN KEY (user_id) REFERENCES users (id)
);