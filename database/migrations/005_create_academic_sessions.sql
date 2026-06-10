-- =============================================================================
-- Migration: 005_create_academic_sessions.sql
-- Description: Create academic_sessions table
-- Date: 2026-06-10 yyyy-mm-dd
-- Depends on: 001, 002
-- =============================================================================

CREATE TABLE public.academic_sessions (
    id                      UUID NOT NULL DEFAULT gen_random_uuid(),
    name                    CHARACTER VARYING(50) NOT NULL,
    start_date              DATE NULL,
    end_date                DATE NULL,
    is_active               BOOLEAN NULL DEFAULT FALSE,
    admission_test_enabled  BOOLEAN NULL DEFAULT TRUE,
    created_at              TIMESTAMP WITHOUT TIME ZONE NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP WITHOUT TIME ZONE NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at              TIMESTAMP WITHOUT TIME ZONE NULL,

    CONSTRAINT academic_sessions_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;