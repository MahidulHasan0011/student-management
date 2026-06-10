-- =============================================================================
-- Migration: 004_create_students_teachers.sql
-- Description: Create teachers and students tables
-- Date: 2026-06-10 yyyy-mm-dd
-- Depends on: 001, 002
-- =============================================================================

CREATE TABLE public.teachers (
    id            UUID NOT NULL DEFAULT gen_random_uuid(),
    user_id       UUID NULL,
    phone         CHARACTER VARYING(20) NULL,
    designation   CHARACTER VARYING(100) NULL,
    qualification TEXT NULL,
    joining_date  DATE NULL,
    created_at    TIMESTAMP WITHOUT TIME ZONE NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP WITHOUT TIME ZONE NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at    TIMESTAMP WITHOUT TIME ZONE NULL,

    CONSTRAINT teachers_pkey PRIMARY KEY (id),
    CONSTRAINT teachers_user_id_key UNIQUE (user_id),
    CONSTRAINT teachers_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES public.users (id)
) TABLESPACE pg_default;


CREATE TABLE public.students (
    id              UUID NOT NULL DEFAULT gen_random_uuid(),
    student_code    CHARACTER VARYING(30) NOT NULL,
    user_id         UUID NULL,
    date_of_birth   DATE NULL,
    guardian_name   CHARACTER VARYING(100) NULL,
    guardian_phone  CHARACTER VARYING(20) NULL,
    address         TEXT NULL,
    created_at      TIMESTAMP WITHOUT TIME ZONE NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP WITHOUT TIME ZONE NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at      TIMESTAMP WITHOUT TIME ZONE NULL,

    CONSTRAINT students_pkey PRIMARY KEY (id),
    CONSTRAINT students_student_code_key UNIQUE (student_code),
    CONSTRAINT user_id FOREIGN KEY (user_id) REFERENCES public.users (id)
) TABLESPACE pg_default;