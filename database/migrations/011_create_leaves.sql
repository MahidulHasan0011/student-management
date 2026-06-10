-- =============================================================================
-- Migration: 011_create_leaves.sql
-- Description: Create leaves table
-- Date: 2026-06-10 yyyy-mm-dd
-- Depends on: 002
-- =============================================================================

CREATE TABLE public.leaves (
    id          UUID NOT NULL DEFAULT gen_random_uuid(),
    user_id     UUID NULL,
    leave_type  CHARACTER VARYING(50) NULL,
    start_date  DATE NULL,
    end_date    DATE NULL,
    reason      TEXT NULL,
    status      CHARACTER VARYING(20) NULL DEFAULT 'PENDING'::CHARACTER VARYING,
    created_at  TIMESTAMP WITHOUT TIME ZONE NULL DEFAULT now(),
    updated_at  TIMESTAMP WITHOUT TIME ZONE NULL DEFAULT now(),
    deleted_at  TIMESTAMP WITHOUT TIME ZONE NULL,

    CONSTRAINT leaves_pkey PRIMARY KEY (id),
    CONSTRAINT leaves_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES public.users (id)
) TABLESPACE pg_default;