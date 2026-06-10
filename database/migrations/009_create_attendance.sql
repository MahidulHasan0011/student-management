-- =============================================================================
-- Migration: 009_create_attendance.sql
-- Description: Create student_attendance table
-- Date: 2026-06-10 yyyy-mm-dd
-- Depends on: 003, 004
-- =============================================================================

CREATE TABLE public.student_attendance (
    id               UUID NOT NULL DEFAULT gen_random_uuid(),
    student_id       UUID NULL,
    class_id         UUID NULL,
    section_id       UUID NULL,
    attendance_date  DATE NULL,
    status           CHARACTER VARYING(20) NULL,
    created_at       TIMESTAMP WITHOUT TIME ZONE NULL DEFAULT now(),
    updated_at       TIMESTAMP WITHOUT TIME ZONE NULL DEFAULT now(),
    deleted_at       TIMESTAMP WITHOUT TIME ZONE NULL,

    CONSTRAINT student_attendance_pkey PRIMARY KEY (id),
    CONSTRAINT unique_student_date
        UNIQUE (student_id, attendance_date),
    CONSTRAINT student_attendance_student_id_fkey
        FOREIGN KEY (student_id) REFERENCES public.students (id),
    CONSTRAINT student_attendance_class_id_fkey
        FOREIGN KEY (class_id) REFERENCES public.classes (id),
    CONSTRAINT student_attendance_section_id_fkey
        FOREIGN KEY (section_id) REFERENCES public.sections (id),
    CONSTRAINT chk_attendance_status CHECK (
        (status)::TEXT = ANY (
            ARRAY[
                'PRESENT'::CHARACTER VARYING,
                'ABSENT'::CHARACTER VARYING,
                'LATE'::CHARACTER VARYING,
                'EXCUSED'::CHARACTER VARYING
            ]::TEXT[]
        )
    )
) TABLESPACE pg_default;