-- =============================================================================
-- Migration: 010_create_fee_structures.sql
-- Description: Create fee_structures table
-- Date: 2026-06-10 yyyy-mm-dd
-- Depends on: 003, 005
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.fee_structures (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  class_id uuid,
  academic_session_id uuid,
  amount numeric(10, 2) NOT NULL,
  due_date date,
  description text,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  deleted_at timestamp without time zone,

  CONSTRAINT fee_structures_pkey PRIMARY KEY (id),

  CONSTRAINT fee_structures_class_id_academic_session_id_key
    UNIQUE (class_id, academic_session_id),

  CONSTRAINT chk_fee_structures_amount
    CHECK (amount >= 0),

  CONSTRAINT fee_structures_class_id_fkey
    FOREIGN KEY (class_id)
    REFERENCES public.classes (id),

  CONSTRAINT fee_structures_academic_session_id_fkey
    FOREIGN KEY (academic_session_id)
    REFERENCES public.academic_sessions (id)
);