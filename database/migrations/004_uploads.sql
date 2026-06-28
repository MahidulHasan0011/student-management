-- =============================================================================
-- 004_uploads.sql — File Management System (pre-signed URL ভিত্তিক)
-- =============================================================================
-- ডিজাইন নোট:
--   backend কখনো আসল ফাইল byte পায় না। frontend সরাসরি S3/R2-তে আপলোড করে
--   (pre-signed PUT URL দিয়ে)। আমরা শুধু metadata রাখি। তাই একটা upload row-এর
--   দুটো ধাপ: PENDING (URL issue হয়েছে, কিন্তু আপলোড confirm হয়নি) → READY (confirm হয়েছে)।

-- ── Enums ────────────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE upload_category_enum AS ENUM (
    'STUDENT_PROFILE',
    'TEACHER_PROFILE',
    'SCHOOL_LOGO',
    'ASSIGNMENT',
    'QUESTION_PAPER',
    'ANSWER_SHEET',
    'EXAM_ATTACHMENT',
    'LEAVE_ATTACHMENT',
    'ATTENDANCE_PROOF',
    'CERTIFICATE',
    'NOTICE_ATTACHMENT',
    'OTHER'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE upload_status_enum AS ENUM ('PENDING', 'READY', 'FAILED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── uploads টেবিল ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.uploads (
  id            uuid NOT NULL DEFAULT gen_random_uuid(),

  -- S3/R2 bucket-এর ভেতরে object-এর সম্পূর্ণ path/key। আমরা generate করি (client নয়),
  -- যাতে নাম collision/path-traversal না হয়। UNIQUE — একই key দুবার থাকবে না।
  storage_key   varchar(512) NOT NULL,

  original_name varchar(255) NOT NULL,            -- user-এর আসল ফাইলের নাম (download-এ ফেরত দেব)
  mime_type     varchar(127) NOT NULL,            -- যাচাই করা MIME (image/png, application/pdf ...)
  extension     varchar(16)  NOT NULL,            -- lowercase, ডট ছাড়া (png, pdf, xlsx ...)
  file_size     bigint       NOT NULL,            -- bytes; presign-এ declared, confirm-এ S3 head দিয়ে যাচাই

  category      upload_category_enum NOT NULL,    -- কোন উদ্দেশ্যে আপলোড (RBAC/বিজনেস রুল এর সাথে যুক্ত)
  status        upload_status_enum   NOT NULL DEFAULT 'PENDING', -- PENDING→READY lifecycle

  uploaded_by   uuid NOT NULL,                    -- owner (FK users) — ownership-based access control

  checksum      varchar(128),                     -- S3 ETag/sha256 (confirm-এ সংরক্ষণ, integrity check)

  -- নমনীয় metadata: image হলে { width, height, thumbnails:{...} }, ভবিষ্যতে যেকোনো কিছু
  metadata      jsonb NOT NULL DEFAULT '{}'::jsonb,

  -- ঐচ্ছিক polymorphic link — ফাইলটা কোন entity-র সাথে যুক্ত (student/exam/leave ...)।
  -- আলাদা FK কলামের বদলে (type,id) রাখলাম যাতে যেকোনো module re-use করতে পারে।
  related_type  varchar(50),
  related_id    uuid,

  created_at    timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at    timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  deleted_at    timestamp without time zone,      -- soft delete (NULL = জীবিত)

  CONSTRAINT uploads_pkey PRIMARY KEY (id),
  CONSTRAINT uploads_storage_key_key UNIQUE (storage_key),
  CONSTRAINT uploads_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.users (id)
);

-- list/filter/search দ্রুত করার index (সবগুলো deleted_at IS NULL partial — সাধারণত জীবিত row পড়ি)
CREATE INDEX IF NOT EXISTS idx_uploads_uploaded_by ON public.uploads (uploaded_by) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_uploads_category    ON public.uploads (category)    WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_uploads_status      ON public.uploads (status);
CREATE INDEX IF NOT EXISTS idx_uploads_created_at  ON public.uploads (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_uploads_related     ON public.uploads (related_type, related_id) WHERE related_id IS NOT NULL;

-- ── upload_audit_logs টেবিল ─────────────────────────────────────────────────
-- প্রতিটা sensitive action (URL issue, confirm, download, delete, restore) এখানে log হয় —
-- কে, কখন, কোন IP থেকে। compliance + abuse তদন্তের জন্য।
CREATE TABLE IF NOT EXISTS public.upload_audit_logs (
  id          uuid NOT NULL DEFAULT gen_random_uuid(),
  upload_id   uuid NOT NULL,
  action      varchar(30) NOT NULL,               -- GENERATE_URL | CONFIRM | DOWNLOAD | DELETE | RESTORE
  actor_id    uuid,                               -- কাজটা করেছে যে user
  ip_address  varchar(45),                        -- IPv4/IPv6
  user_agent  text,
  detail      jsonb NOT NULL DEFAULT '{}'::jsonb, -- বাড়তি context (e.g. পুরোনো/নতুন status)
  created_at  timestamp without time zone DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT upload_audit_logs_pkey PRIMARY KEY (id),
  CONSTRAINT upload_audit_logs_upload_id_fkey FOREIGN KEY (upload_id) REFERENCES public.uploads (id),
  CONSTRAINT upload_audit_logs_actor_id_fkey   FOREIGN KEY (actor_id)  REFERENCES public.users (id)
);

CREATE INDEX IF NOT EXISTS idx_upload_audit_upload  ON public.upload_audit_logs (upload_id);
CREATE INDEX IF NOT EXISTS idx_upload_audit_actor   ON public.upload_audit_logs (actor_id);
CREATE INDEX IF NOT EXISTS idx_upload_audit_created ON public.upload_audit_logs (created_at DESC);

-- ── RBAC: permissions + role grants ─────────────────────────────────────────
-- নতুন route-গুলোর convention অনুযায়ী UPPER_SNAKE নাম।
INSERT INTO public.permissions (name) VALUES
  ('UPLOAD_CREATE'),   -- presigned URL নেওয়া + confirm করা
  ('UPLOAD_READ'),     -- নিজের ফাইল list/details/download
  ('UPLOAD_DELETE'),   -- soft delete
  ('UPLOAD_RESTORE'),  -- restore
  ('UPLOAD_MANAGE')    -- admin override: অন্যের ফাইলও দেখা/মোছা, bulk operation
ON CONFLICT DO NOTHING;

-- helper: role-কে permission grant (name দিয়ে, idempotent)
-- SUPER_ADMIN(001) + ADMIN(002): সব। TEACHER(003): create/read/delete। STUDENT(004): create/read।
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.role_id, p.id
FROM (VALUES
    ('00000000-0000-0000-0000-000000000001'::uuid, 'UPLOAD_CREATE'),
    ('00000000-0000-0000-0000-000000000001'::uuid, 'UPLOAD_READ'),
    ('00000000-0000-0000-0000-000000000001'::uuid, 'UPLOAD_DELETE'),
    ('00000000-0000-0000-0000-000000000001'::uuid, 'UPLOAD_RESTORE'),
    ('00000000-0000-0000-0000-000000000001'::uuid, 'UPLOAD_MANAGE'),
    ('00000000-0000-0000-0000-000000000002'::uuid, 'UPLOAD_CREATE'),
    ('00000000-0000-0000-0000-000000000002'::uuid, 'UPLOAD_READ'),
    ('00000000-0000-0000-0000-000000000002'::uuid, 'UPLOAD_DELETE'),
    ('00000000-0000-0000-0000-000000000002'::uuid, 'UPLOAD_RESTORE'),
    ('00000000-0000-0000-0000-000000000002'::uuid, 'UPLOAD_MANAGE'),
    ('00000000-0000-0000-0000-000000000003'::uuid, 'UPLOAD_CREATE'),
    ('00000000-0000-0000-0000-000000000003'::uuid, 'UPLOAD_READ'),
    ('00000000-0000-0000-0000-000000000003'::uuid, 'UPLOAD_DELETE'),
    ('00000000-0000-0000-0000-000000000004'::uuid, 'UPLOAD_CREATE'),
    ('00000000-0000-0000-0000-000000000004'::uuid, 'UPLOAD_READ')
  ) AS r(role_id, perm_name)
JOIN public.permissions p ON p.name = r.perm_name
ON CONFLICT DO NOTHING;
