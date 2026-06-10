-- Migration: 002
-- Description: Create users table
-- Date: 2026-06-10 yyyy-mm-dd

CREATE TYPE public.gender_enum AS ENUM ('MALE', 'FEMALE', 'OTHER');

CREATE TABLE public.users (
    id          UUID NOT NULL DEFAULT gen_random_uuid(),
    full_name   CHARACTER VARYING(100) NOT NULL,
    email       CHARACTER VARYING(100) NOT NULL,
    password    TEXT NOT NULL,
    role_id     UUID NULL,
    is_active   BOOLEAN NULL DEFAULT TRUE,
    gender      public.gender_enum NULL DEFAULT 'MALE'::gender_enum,
    created_at  TIMESTAMP WITHOUT TIME ZONE NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP WITHOUT TIME ZONE NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at  TIMESTAMP WITHOUT TIME ZONE NULL,
    CONSTRAINT users_pkey PRIMARY KEY (id),
    CONSTRAINT users_email_key UNIQUE (email),
    CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles (id)
) TABLESPACE pg_default;