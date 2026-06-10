-- Migration: 001
-- Description: Create roles and permissions tables
-- Date: 2026-06-10 yyyy-mm-dd

CREATE TABLE public.roles (
    id          UUID NOT NULL DEFAULT gen_random_uuid(),
    name        CHARACTER VARYING(50) NOT NULL,
    created_at  TIMESTAMP WITHOUT TIME ZONE NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP WITHOUT TIME ZONE NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at  TIMESTAMP WITHOUT TIME ZONE NULL,
    CONSTRAINT roles_pkey PRIMARY KEY (id),
    CONSTRAINT roles_name_key UNIQUE (name)
) TABLESPACE pg_default;

CREATE TABLE public.permissions (
    id          UUID NOT NULL DEFAULT gen_random_uuid(),
    name        CHARACTER VARYING(100) NOT NULL,
    created_at  TIMESTAMP WITHOUT TIME ZONE NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP WITHOUT TIME ZONE NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at  TIMESTAMP WITHOUT TIME ZONE NULL,
    CONSTRAINT permissions_pkey PRIMARY KEY (id),
    CONSTRAINT permissions_name_key UNIQUE (name)
) TABLESPACE pg_default;

CREATE TABLE public.role_permissions (
    id            UUID NOT NULL DEFAULT gen_random_uuid(),
    role_id       UUID NOT NULL,
    permission_id UUID NOT NULL,
    created_at    TIMESTAMP WITHOUT TIME ZONE NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP WITHOUT TIME ZONE NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at    TIMESTAMP WITHOUT TIME ZONE NULL,
    CONSTRAINT role_permissions_pkey PRIMARY KEY (id),
    CONSTRAINT role_permissions_role_id_permission_id_key UNIQUE (role_id, permission_id),
    CONSTRAINT role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles (id),
    CONSTRAINT role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permissions (id)
) TABLESPACE pg_default;