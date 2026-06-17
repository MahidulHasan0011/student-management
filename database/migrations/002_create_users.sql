-- Migration: 002
-- Description: Create users table
-- Date: 2026-06-10 yyyy-mm-dd

CREATE TYPE public.gender_enum AS ENUM ('MALE', 'FEMALE', 'OTHER');

CREATE TABLE IF NOT EXISTS public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  full_name character varying(100) NOT NULL,
  email character varying(100) NOT NULL,
  password text NOT NULL,
  role_id uuid,
  is_active boolean DEFAULT true,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  deleted_at timestamp without time zone,
  gender gender_enum DEFAULT 'MALE',
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_email_key UNIQUE (email),
  CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id) REFERENCES roles (id)
);