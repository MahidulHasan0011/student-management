-- =============================================================================
-- Migration: 003_create_classes_sections.sql
-- Description: Create classes and sections tables
-- Date: 2026-06-10 yyyy-mm-dd
-- Depends on: 001, 002
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.classes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying(50) NOT NULL,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  deleted_at timestamp without time zone,
  CONSTRAINT classes_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.sections (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  class_id uuid,
  name character varying(20) NOT NULL,
  max_capacity integer DEFAULT NULL,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  deleted_at timestamp without time zone,
  CONSTRAINT sections_pkey PRIMARY KEY (id),
  CONSTRAINT sections_class_id_fkey FOREIGN KEY (class_id) REFERENCES classes (id)
);