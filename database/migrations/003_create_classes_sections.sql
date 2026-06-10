-- =============================================================================
-- Migration: 003_create_classes_sections.sql
-- Description: Create classes and sections tables
-- Date: 2026-06-10 yyyy-mm-dd
-- Depends on: 001, 002
-- =============================================================================

CREATE TABLE public.classes (
    id          UUID NOT NULL DEFAULT gen_random_uuid(),
    name        CHARACTER VARYING(50) NOT NULL,
    created_at  TIMESTAMP WITHOUT TIME ZONE NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP WITHOUT TIME ZONE NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at  TIMESTAMP WITHOUT TIME ZONE NULL,

    CONSTRAINT classes_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;


CREATE TABLE public.sections (
    id            UUID NOT NULL DEFAULT gen_random_uuid(),
    class_id      UUID NULL,
    name          CHARACTER VARYING(20) NOT NULL,
    max_capacity  INTEGER NULL,
    created_at    TIMESTAMP WITHOUT TIME ZONE NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP WITHOUT TIME ZONE NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at    TIMESTAMP WITHOUT TIME ZONE NULL,

    CONSTRAINT sections_pkey PRIMARY KEY (id),
    CONSTRAINT sections_class_id_fkey
        FOREIGN KEY (class_id) REFERENCES public.classes (id)
) TABLESPACE pg_default;