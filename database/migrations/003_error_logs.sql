-- =============================================================================
-- MIGRATION: error_logs — server-side error/exception-এর persistent trail
-- global error handler unhandled (500/non-operational) error গুলো এখানে জমা করে
-- কোনো পুরনো table পরিবর্তন হবে না, শুধু নতুন table যোগ হবে
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.error_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name varchar(100),                   -- error constructor নাম: 'Error', 'TypeError', 'AppError' ইত্যাদি
  message text NOT NULL,               -- error.message
  stack text,                          -- পূর্ণ stack trace
  status_code integer,                 -- response-এ যে status গেছে (সাধারণত 500)
  is_operational boolean NOT NULL DEFAULT false,  -- AppError (known) নাকি unexpected crash
  method varchar(10),                  -- HTTP method: GET/POST/...
  path text,                           -- request path
  context jsonb,                       -- body/params/query/ip/userAgent ইত্যাদি অতিরিক্ত তথ্য
  user_id uuid,                        -- কোন logged-in user request করেছিল (NULL = anonymous/system)
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  deleted_at timestamp without time zone,         -- soft delete (shared queryBuilder-এর সাথে consistent)
  CONSTRAINT error_logs_pkey PRIMARY KEY (id),
  CONSTRAINT error_logs_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.users (id) ON DELETE SET NULL
);

-- সাম্প্রতিক error দ্রুত দেখার জন্য (default listing order)
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at
  ON public.error_logs (created_at DESC);

-- status_code দিয়ে filter করার জন্য
CREATE INDEX IF NOT EXISTS idx_error_logs_status_code
  ON public.error_logs (status_code);

-- কোন user-এর কাছে error হচ্ছে তা খুঁজতে
CREATE INDEX IF NOT EXISTS idx_error_logs_user_id
  ON public.error_logs (user_id);
