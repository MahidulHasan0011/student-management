-- =============================================================================
-- FILE: schema.sql
-- PROJECT: School Management System
-- DESCRIPTION: Complete database schema - all tables in dependency order
-- CREATED: 2026-06-09
-- =============================================================================


-- -----------------------------------------------------------------------------
-- STEP 1: ENUMS
-- -----------------------------------------------------------------------------

CREATE TYPE public.gender_enum AS ENUM (
    'MALE',
    'FEMALE',
    'OTHER'
);

CREATE TYPE public.exam_type_enum AS ENUM (
    'ADMISSION',
    'MIDTERM',
    'FINAL',
    'UNIT_TEST'
);


-- -----------------------------------------------------------------------------
-- STEP 2: ROLES & PERMISSIONS
-- -----------------------------------------------------------------------------

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


-- -----------------------------------------------------------------------------
-- STEP 3: USERS
-- -----------------------------------------------------------------------------

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


-- -----------------------------------------------------------------------------
-- STEP 4: TEACHERS & STUDENTS
-- -----------------------------------------------------------------------------

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
    CONSTRAINT teachers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users (id)
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


-- -----------------------------------------------------------------------------
-- STEP 5: CLASSES & SECTIONS
-- -----------------------------------------------------------------------------

CREATE TABLE public.classes (
    id          UUID NOT NULL DEFAULT gen_random_uuid(),
    name        CHARACTER VARYING(50) NOT NULL,
    created_at  TIMESTAMP WITHOUT TIME ZONE NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP WITHOUT TIME ZONE NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at  TIMESTAMP WITHOUT TIME ZONE NULL,

    CONSTRAINT classes_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;


CREATE TABLE public.sections (
    id            UUID NOT NULL DEFAULT gen_random_uuid(),
    class_id      UUID NULL,
    name          CHARACTER VARYING(20) NOT NULL,
    max_capacity  INTEGER NULL,
    created_at    TIMESTAMP WITHOUT TIME ZONE NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP WITHOUT TIME ZONE NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at    TIMESTAMP WITHOUT TIME ZONE NULL,

    CONSTRAINT sections_pkey PRIMARY KEY (id),
    CONSTRAINT sections_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes (id)
) TABLESPACE pg_default;


-- -----------------------------------------------------------------------------
-- STEP 6: ACADEMIC SESSIONS
-- -----------------------------------------------------------------------------

CREATE TABLE public.academic_sessions (
    id                      UUID NOT NULL DEFAULT gen_random_uuid(),
    name                    CHARACTER VARYING(50) NOT NULL,
    start_date              DATE NULL,
    end_date                DATE NULL,
    is_active               BOOLEAN NULL DEFAULT FALSE,
    admission_test_enabled  BOOLEAN NULL DEFAULT TRUE,
    created_at              TIMESTAMP WITHOUT TIME ZONE NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP WITHOUT TIME ZONE NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at              TIMESTAMP WITHOUT TIME ZONE NULL,

    CONSTRAINT academic_sessions_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;


-- -----------------------------------------------------------------------------
-- STEP 7: STUDENT ENROLLMENTS
-- -----------------------------------------------------------------------------

CREATE TABLE public.student_enrollments (
    id                   UUID NOT NULL DEFAULT gen_random_uuid(),
    student_id           UUID NULL,
    class_id             UUID NULL,
    section_id           UUID NULL,
    academic_session_id  UUID NULL,
    roll_number          INTEGER NULL,
    created_at           TIMESTAMP WITHOUT TIME ZONE NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP WITHOUT TIME ZONE NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at           TIMESTAMP WITHOUT TIME ZONE NULL,

    CONSTRAINT student_enrollments_pkey PRIMARY KEY (id),
    CONSTRAINT student_enrollments_student_id_academic_session_id_key
        UNIQUE (student_id, academic_session_id),
    CONSTRAINT student_enrollments_student_id_fkey
        FOREIGN KEY (student_id) REFERENCES public.students (id),
    CONSTRAINT student_enrollments_class_id_fkey
        FOREIGN KEY (class_id) REFERENCES public.classes (id),
    CONSTRAINT student_enrollments_section_id_fkey
        FOREIGN KEY (section_id) REFERENCES public.sections (id),
    CONSTRAINT student_enrollments_academic_session_id_fkey
        FOREIGN KEY (academic_session_id) REFERENCES public.academic_sessions (id)
) TABLESPACE pg_default;


-- -----------------------------------------------------------------------------
-- STEP 8: SUBJECTS & ASSIGNMENTS
-- -----------------------------------------------------------------------------

CREATE TABLE public.subjects (
    id          UUID NOT NULL DEFAULT gen_random_uuid(),
    name        CHARACTER VARYING(100) NOT NULL,
    code        CHARACTER VARYING(20) NULL,
    created_at  TIMESTAMP WITHOUT TIME ZONE NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP WITHOUT TIME ZONE NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at  TIMESTAMP WITHOUT TIME ZONE NULL,

    CONSTRAINT subjects_pkey PRIMARY KEY (id),
    CONSTRAINT subjects_code_key UNIQUE (code)
) TABLESPACE pg_default;


CREATE TABLE public.subject_assignments (
    id                   UUID NOT NULL DEFAULT gen_random_uuid(),
    teacher_id           UUID NULL,
    class_id             UUID NULL,
    section_id           UUID NULL,
    subject_id           UUID NULL,
    academic_session_id  UUID NULL,
    assigned_by          UUID NULL,
    created_at           TIMESTAMP WITHOUT TIME ZONE NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP WITHOUT TIME ZONE NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at           TIMESTAMP WITHOUT TIME ZONE NULL,

    CONSTRAINT subject_assignments_pkey PRIMARY KEY (id),
    CONSTRAINT subject_assignments_teacher_id_class_id_section_id_subject__key
        UNIQUE (teacher_id, class_id, section_id, subject_id, academic_session_id),
    CONSTRAINT subject_assignments_teacher_id_fkey
        FOREIGN KEY (teacher_id) REFERENCES public.teachers (id),
    CONSTRAINT subject_assignments_class_id_fkey
        FOREIGN KEY (class_id) REFERENCES public.classes (id),
    CONSTRAINT subject_assignments_section_id_fkey
        FOREIGN KEY (section_id) REFERENCES public.sections (id),
    CONSTRAINT subject_assignments_subject_id_fkey
        FOREIGN KEY (subject_id) REFERENCES public.subjects (id),
    CONSTRAINT subject_assignments_academic_session_id_fkey
        FOREIGN KEY (academic_session_id) REFERENCES public.academic_sessions (id),
    CONSTRAINT subject_assignments_assigned_by_fkey
        FOREIGN KEY (assigned_by) REFERENCES public.users (id)
) TABLESPACE pg_default;


-- -----------------------------------------------------------------------------
-- STEP 9: EXAMS & RESULTS
-- -----------------------------------------------------------------------------

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


-- -----------------------------------------------------------------------------
-- STEP 10: STUDENT ATTENDANCE
-- ✅ unique_student_date constraint যোগ করা হয়েছে
-- -----------------------------------------------------------------------------

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


-- -----------------------------------------------------------------------------
-- STEP 11: FEE STRUCTURES
-- -----------------------------------------------------------------------------

CREATE TABLE public.fee_structures (
    id                   UUID NOT NULL DEFAULT gen_random_uuid(),
    class_id             UUID NULL,
    academic_session_id  UUID NULL,
    amount               NUMERIC(10, 2) NOT NULL,
    due_date             DATE NULL,
    description          TEXT NULL,
    created_at           TIMESTAMP WITHOUT TIME ZONE NULL DEFAULT now(),
    updated_at           TIMESTAMP WITHOUT TIME ZONE NULL DEFAULT now(),
    deleted_at           TIMESTAMP WITHOUT TIME ZONE NULL,

    CONSTRAINT fee_structures_pkey PRIMARY KEY (id),
    CONSTRAINT fee_structures_class_id_fkey
        FOREIGN KEY (class_id) REFERENCES public.classes (id),
    CONSTRAINT fee_structures_session_id_fkey
        FOREIGN KEY (academic_session_id) REFERENCES public.academic_sessions (id)
) TABLESPACE pg_default;


-- -----------------------------------------------------------------------------
-- STEP 12: LEAVES
-- -----------------------------------------------------------------------------

CREATE TABLE public.leaves (
    id          UUID NOT NULL DEFAULT gen_random_uuid(),
    user_id     UUID NULL,
    leave_type  CHARACTER VARYING(50) NULL,
    start_date  DATE NULL,
    end_date    DATE NULL,
    reason      TEXT NULL,
    status      CHARACTER VARYING(20) NULL DEFAULT 'PENDING'::CHARACTER VARYING,
    created_at  TIMESTAMP WITHOUT TIME ZONE NULL DEFAULT now(),
    updated_at  TIMESTAMP WITHOUT TIME ZONE NULL DEFAULT now(),
    deleted_at  TIMESTAMP WITHOUT TIME ZONE NULL,

    CONSTRAINT leaves_pkey PRIMARY KEY (id),
    CONSTRAINT leaves_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users (id)
) TABLESPACE pg_default;


-- -----------------------------------------------------------------------------
-- STEP 13: ATTENDANCE LOGS (Staff / Teacher)
-- ✅ unique_user_date constraint যোগ করা হয়েছে
-- ✅ GPS latitude/longitude সহ
-- -----------------------------------------------------------------------------

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


-- =============================================================================
-- STEP 14: VIEWS
-- সব টেবিল তৈরির পরে view তৈরি করতে হয়
-- কারণ view নির্ভর করে অনেকগুলো টেবিলের উপর
-- =============================================================================

-- teacher_class_assignments:
-- কোন teacher কোন class ও section-এ assigned আছে তার সহজ view
-- Backend permission check এ এই view ব্যবহার করা হয়
CREATE VIEW public.teacher_class_assignments AS
SELECT
    t.id          AS teacher_id,
    u.full_name   AS teacher_name,
    c.id          AS class_id,
    c.name        AS class_name,
    s.id          AS section_id,
    s.name        AS section_name,
    acs.id        AS session_id,
    acs.name      AS session_name
FROM public.subject_assignments sa
JOIN public.teachers t          ON t.id   = sa.teacher_id
JOIN public.users u             ON u.id   = t.user_id
JOIN public.classes c           ON c.id   = sa.class_id
JOIN public.sections s          ON s.id   = sa.section_id
JOIN public.academic_sessions acs ON acs.id = sa.academic_session_id
WHERE sa.deleted_at  IS NULL
  AND acs.is_active  = TRUE
GROUP BY
    t.id, u.full_name,
    c.id, c.name,
    s.id, s.name,
    acs.id, acs.name;


-- =============================================================================
-- END OF SCHEMA
-- =============================================================================
-- সারসংক্ষেপ:
--   ENUM  : 2 (gender_enum, exam_type_enum)
--   TABLE : 13
--   VIEW  : 1 (teacher_class_assignments)
--
-- নতুন সংযোজন (আগের schema থেকে পরিবর্তন):
--   ✅ student_attendance  → CONSTRAINT unique_student_date UNIQUE (student_id, attendance_date)
--   ✅ attendance_logs     → CONSTRAINT unique_user_date    UNIQUE (user_id, attendance_date)
--   ✅ VIEW teacher_class_assignments → Step 14 এ যোগ করা হয়েছে
--
-- Run command:
--   psql -U your_username -d your_database -f schema.sql
-- =============================================================================