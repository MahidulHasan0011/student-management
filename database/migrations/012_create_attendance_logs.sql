-- =============================================================================
-- Migration: 012_create_attendance_logs.sql
-- Description: Create attendance_logs table for staff/teacher check-in check-out
-- Date: 2026-06-10 yyyy-mm-dd
-- Depends on: 002
-- =============================================================================

CREATE TABLE public.attendance_logs (
    id                   UUID NOT NULL DEFAULT gen_random_uuid(),
    user_id              UUID NOT NULL,
    attendance_date      DATE NOT NULL,
    check_in             TIMESTAMP WITHOUT TIME ZONE NULL,
    check_out            TIMESTAMP WITHOUT TIME ZONE NULL,
    total_work_minutes   INTEGER NULL DEFAULT 0,
    status               CHARACTER VARYING(20) NULL DEFAULT 'PRESENT'::CHARACTER VARYING,
    notes                TEXT NULL,
    ip_address           TEXT NULL,
    check_in_latitude    NUMERIC NULL,
    check_in_longitude   NUMERIC NULL,
    check_out_latitude   NUMERIC NULL,
    check_out_longitude  NUMERIC NULL,
    created_at           TIMESTAMP WITHOUT TIME ZONE NULL DEFAULT now(),
    updated_at           TIMESTAMP WITHOUT TIME ZONE NULL DEFAULT now(),
    deleted_at           TIMESTAMP WITHOUT TIME ZONE NULL,

    CONSTRAINT attendance_logs_pkey PRIMARY KEY (id),
    CONSTRAINT unique_user_date
        UNIQUE (user_id, attendance_date),
    CONSTRAINT attendance_logs_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES public.users (id)
) TABLESPACE pg_default;