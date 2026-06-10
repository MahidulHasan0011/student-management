-- =============================================================================
-- Migration: 007_create_subjects_assignments.sql
-- Description: Create subjects and subject_assignments tables
-- Date: 2026-06-10 yyyy-mm-dd
-- Depends on: 002, 003, 004, 005
-- =============================================================================

CREATE TABLE public.subjects (
    id          UUID NOT NULL DEFAULT gen_random_uuid(),
    name        CHARACTER VARYING(100) NOT NULL,
    code        CHARACTER VARYING(20) NULL,
    created_at  TIMESTAMP WITHOUT TIME ZONE NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP WITHOUT TIME ZONE NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at  TIMESTAMP WITHOUT TIME ZONE NULL,

    CONSTRAINT subjects_pkey PRIMARY KEY (id),
    CONSTRAINT subjects_code_key UNIQUE (code)
) TABLESPACE pg_default;


CREATE TABLE public.subject_assignments (
    id                   UUID NOT NULL DEFAULT gen_random_uuid(),
    teacher_id           UUID NULL,
    class_id             UUID NULL,
    section_id           UUID NULL,
    subject_id           UUID NULL,
    academic_session_id  UUID NULL,
    assigned_by          UUID NULL,
    created_at           TIMESTAMP WITHOUT TIME ZONE NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP WITHOUT TIME ZONE NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at           TIMESTAMP WITHOUT TIME ZONE NULL,

    CONSTRAINT subject_assignments_pkey PRIMARY KEY (id),
    CONSTRAINT subject_assignments_teacher_id_class_id_section_id_subject__key
        UNIQUE (teacher_id, class_id, section_id, subject_id, academic_session_id),
    CONSTRAINT subject_assignments_teacher_id_fkey
        FOREIGN KEY (teacher_id) REFERENCES public.teachers (id),
    CONSTRAINT subject_assignments_class_id_fkey
        FOREIGN KEY (class_id) REFERENCES public.classes (id),
    CONSTRAINT subject_assignments_section_id_fkey
        FOREIGN KEY (section_id) REFERENCES public.sections (id),
    CONSTRAINT subject_assignments_subject_id_fkey
        FOREIGN KEY (subject_id) REFERENCES public.subjects (id),
    CONSTRAINT subject_assignments_academic_session_id_fkey
        FOREIGN KEY (academic_session_id) REFERENCES public.academic_sessions (id),
    CONSTRAINT subject_assignments_assigned_by_fkey
        FOREIGN KEY (assigned_by) REFERENCES public.users (id)
) TABLESPACE pg_default;