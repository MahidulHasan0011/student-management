-- =============================================================================
-- Migration: 010_create_fee_structures.sql
-- Description: Create fee_structures table
-- Date: 2026-06-10 yyyy-mm-dd
-- Depends on: 003, 005
-- =============================================================================

CREATE TABLE public.fee_structures (
    id                   UUID NOT NULL DEFAULT gen_random_uuid(),
    class_id             UUID NULL,
    academic_session_id  UUID NULL,
    amount               NUMERIC(10, 2) NOT NULL,
    due_date             DATE NULL,
    description          TEXT NULL,
    created_at           TIMESTAMP WITHOUT TIME ZONE NULL DEFAULT now(),
    updated_at           TIMESTAMP WITHOUT TIME ZONE NULL DEFAULT now(),
    deleted_at           TIMESTAMP WITHOUT TIME ZONE NULL,

    CONSTRAINT fee_structures_pkey PRIMARY KEY (id),
    CONSTRAINT fee_structures_class_id_fkey
        FOREIGN KEY (class_id) REFERENCES public.classes (id),
    CONSTRAINT fee_structures_session_id_fkey
        FOREIGN KEY (academic_session_id) REFERENCES public.academic_sessions (id)
) TABLESPACE pg_default;