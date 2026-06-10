-- =============================================================================
-- Migration: 006_create_enrollments.sql
-- Description: Create student_enrollments table
-- Date: 2026-06-10 yyyy-mm-dd
-- Depends on: 003, 004, 005
-- =============================================================================

CREATE TABLE public.student_enrollments (
    id                   UUID NOT NULL DEFAULT gen_random_uuid(),
    student_id           UUID NULL,
    class_id             UUID NULL,
    section_id           UUID NULL,
    academic_session_id  UUID NULL,
    roll_number          INTEGER NULL,
    created_at           TIMESTAMP WITHOUT TIME ZONE NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP WITHOUT TIME ZONE NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at           TIMESTAMP WITHOUT TIME ZONE NULL,

    CONSTRAINT student_enrollments_pkey PRIMARY KEY (id),
    CONSTRAINT student_enrollments_student_id_academic_session_id_key
        UNIQUE (student_id, academic_session_id),
    CONSTRAINT student_enrollments_student_id_fkey
        FOREIGN KEY (student_id) REFERENCES public.students (id),
    CONSTRAINT student_enrollments_class_id_fkey
        FOREIGN KEY (class_id) REFERENCES public.classes (id),
    CONSTRAINT student_enrollments_section_id_fkey
        FOREIGN KEY (section_id) REFERENCES public.sections (id),
    CONSTRAINT student_enrollments_academic_session_id_fkey
        FOREIGN KEY (academic_session_id) REFERENCES public.academic_sessions (id)
) TABLESPACE pg_default;