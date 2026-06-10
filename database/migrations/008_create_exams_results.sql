-- =============================================================================
-- Migration: 008_create_exams_results.sql
-- Description: Create exams and exam_results tables
-- Date: 2026-06-10 yyyy-mm-dd
-- Depends on: 003, 004, 005, 007
-- =============================================================================

CREATE TYPE public.exam_type_enum AS ENUM (
    'ADMISSION',
    'MIDTERM',
    'FINAL',
    'UNIT_TEST'
);


CREATE TABLE public.exams (
    id                   UUID NOT NULL DEFAULT gen_random_uuid(),
    name                 CHARACTER VARYING(100) NOT NULL,
    class_id             UUID NULL,
    academic_session_id  UUID NULL,
    exam_date            DATE NULL,
    exam_type            public.exam_type_enum NOT NULL DEFAULT 'ADMISSION'::exam_type_enum,
    created_at           TIMESTAMP WITHOUT TIME ZONE NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP WITHOUT TIME ZONE NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at           TIMESTAMP WITHOUT TIME ZONE NULL,

    CONSTRAINT exams_pkey PRIMARY KEY (id),
    CONSTRAINT exams_class_id_fkey
        FOREIGN KEY (class_id) REFERENCES public.classes (id),
    CONSTRAINT exams_academic_session_id_fkey
        FOREIGN KEY (academic_session_id) REFERENCES public.academic_sessions (id)
) TABLESPACE pg_default;


CREATE TABLE public.exam_results (
    id          UUID NOT NULL DEFAULT gen_random_uuid(),
    exam_id     UUID NULL,
    student_id  UUID NULL,
    subject_id  UUID NULL,
    marks       NUMERIC(5, 2) NULL,
    grade       CHARACTER VARYING(5) NULL,
    created_at  TIMESTAMP WITHOUT TIME ZONE NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP WITHOUT TIME ZONE NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at  TIMESTAMP WITHOUT TIME ZONE NULL,

    CONSTRAINT exam_results_pkey PRIMARY KEY (id),
    CONSTRAINT unique_exam_student_subject
        UNIQUE (exam_id, student_id, subject_id),
    CONSTRAINT exam_results_exam_id_fkey
        FOREIGN KEY (exam_id) REFERENCES public.exams (id),
    CONSTRAINT exam_results_student_id_fkey
        FOREIGN KEY (student_id) REFERENCES public.students (id),
    CONSTRAINT exam_results_subject_id_fkey
        FOREIGN KEY (subject_id) REFERENCES public.subjects (id)
) TABLESPACE pg_default;