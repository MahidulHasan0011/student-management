-- ========================
-- ENUMS
-- ========================

CREATE TYPE exam_type_enum AS ENUM (
    'ADMISSION',
    'MIDTERM',
    'FINAL',
    'UNIT_TEST'
);

CREATE TYPE gender_enum AS ENUM (
    'MALE',
    'FEMALE',
    'OTHER'
);

-- ========================
-- 1. ROLES
-- ========================

CREATE TABLE roles (
    id          UUID        NOT NULL DEFAULT gen_random_uuid(),
    name        VARCHAR(50) NOT NULL UNIQUE,
    created_at  TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    deleted_at  TIMESTAMP   NULL,

    CONSTRAINT roles_pkey PRIMARY KEY (id)
);

-- ========================
-- 2. PERMISSIONS
-- ========================

CREATE TABLE permissions (
    id          UUID        NOT NULL DEFAULT gen_random_uuid(),
    name        VARCHAR(100) NOT NULL UNIQUE,
    created_at  TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    deleted_at  TIMESTAMP   NULL,

    CONSTRAINT permissions_pkey PRIMARY KEY (id)
);

-- ========================
-- 3. ROLE_PERMISSIONS
-- ========================

CREATE TABLE role_permissions (
    id            UUID  NOT NULL DEFAULT gen_random_uuid(),
    role_id       UUID  NOT NULL,
    permission_id UUID  NOT NULL,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at    TIMESTAMP NULL,

    CONSTRAINT role_permissions_pkey          PRIMARY KEY (id),
    CONSTRAINT role_permissions_role_id_fkey  FOREIGN KEY (role_id)       REFERENCES roles(id),
    CONSTRAINT role_permissions_perm_id_fkey  FOREIGN KEY (permission_id) REFERENCES permissions(id),
    CONSTRAINT role_permissions_unique        UNIQUE (role_id, permission_id)
);

-- ========================
-- 4. USERS
-- ========================

CREATE TABLE users (
    id          UUID         NOT NULL DEFAULT gen_random_uuid(),
    full_name   VARCHAR(100) NOT NULL,
    email       VARCHAR(100) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,
    role_id     UUID         NULL,
    is_active   BOOLEAN      DEFAULT TRUE,
    created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    deleted_at  TIMESTAMP    NULL,

    CONSTRAINT users_pkey         PRIMARY KEY (id),
    CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id) REFERENCES roles(id)
);

-- ========================
-- 5. TEACHERS
-- ========================

CREATE TABLE teachers (
    id            UUID         NOT NULL DEFAULT gen_random_uuid(),
    user_id       UUID         NOT NULL,
    phone         VARCHAR(20)  NULL,
    designation   VARCHAR(100) NULL,
    qualification VARCHAR(255) NULL,
    created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    deleted_at    TIMESTAMP    NULL,

    CONSTRAINT teachers_pkey         PRIMARY KEY (id),
    CONSTRAINT teachers_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ========================
-- 6. CLASSES
-- ========================

CREATE TABLE classes (
    id          UUID        NOT NULL DEFAULT gen_random_uuid(),
    name        VARCHAR(50) NOT NULL UNIQUE,
    created_at  TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    deleted_at  TIMESTAMP   NULL,

    CONSTRAINT classes_pkey PRIMARY KEY (id)
);

-- ========================
-- 7. SECTIONS
-- ========================

CREATE TABLE sections (
    id          UUID        NOT NULL DEFAULT gen_random_uuid(),
    class_id    UUID        NOT NULL,
    name        VARCHAR(50) NOT NULL,
    created_at  TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    deleted_at  TIMESTAMP   NULL,

    CONSTRAINT sections_pkey         PRIMARY KEY (id),
    CONSTRAINT sections_class_id_fkey FOREIGN KEY (class_id) REFERENCES classes(id),
    CONSTRAINT sections_unique        UNIQUE (class_id, name)
);

-- ========================
-- 8. SUBJECTS
-- ========================

CREATE TABLE subjects (
    id          UUID        NOT NULL DEFAULT gen_random_uuid(),
    name        VARCHAR(100) NOT NULL,
    code        VARCHAR(20)  NOT NULL UNIQUE,
    created_at  TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    deleted_at  TIMESTAMP   NULL,

    CONSTRAINT subjects_pkey PRIMARY KEY (id)
);

-- ========================
-- 9. ACADEMIC_SESSIONS
-- ========================

CREATE TABLE academic_sessions (
    id          UUID        NOT NULL DEFAULT gen_random_uuid(),
    name        VARCHAR(100) NOT NULL UNIQUE,
    start_date  DATE        NOT NULL,
    end_date    DATE        NOT NULL,
    is_active   BOOLEAN     DEFAULT FALSE,
    created_at  TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    deleted_at  TIMESTAMP   NULL,

    CONSTRAINT academic_sessions_pkey PRIMARY KEY (id)
);

-- ========================
-- 10. STUDENTS
-- ========================

CREATE TABLE students (
    id             UUID         NOT NULL DEFAULT gen_random_uuid(),
    user_id        UUID         NOT NULL,
    student_code   VARCHAR(50)  NOT NULL UNIQUE,
    full_name      VARCHAR(100) NULL,
    gender         gender_enum  NULL,
    date_of_birth  DATE         NULL,
    guardian_name  VARCHAR(100) NULL,
    guardian_phone VARCHAR(20)  NULL,
    address        TEXT         NULL,
    created_at     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    deleted_at     TIMESTAMP    NULL,

    CONSTRAINT students_pkey         PRIMARY KEY (id),
    CONSTRAINT students_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ========================
-- 11. STUDENT_ENROLLMENTS
-- ========================

CREATE TABLE student_enrollments (
    id                  UUID    NOT NULL DEFAULT gen_random_uuid(),
    student_id          UUID    NOT NULL,
    class_id            UUID    NOT NULL,
    section_id          UUID    NOT NULL,
    academic_session_id UUID    NOT NULL,
    roll_number         VARCHAR(20) NULL,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at          TIMESTAMP NULL,

    CONSTRAINT student_enrollments_pkey               PRIMARY KEY (id),
    CONSTRAINT student_enrollments_student_id_fkey    FOREIGN KEY (student_id)          REFERENCES students(id),
    CONSTRAINT student_enrollments_class_id_fkey      FOREIGN KEY (class_id)            REFERENCES classes(id),
    CONSTRAINT student_enrollments_section_id_fkey    FOREIGN KEY (section_id)          REFERENCES sections(id),
    CONSTRAINT student_enrollments_session_id_fkey    FOREIGN KEY (academic_session_id) REFERENCES academic_sessions(id),
    CONSTRAINT student_enrollments_unique             UNIQUE (student_id, academic_session_id)
);

-- ========================
-- 12. SUBJECT_ASSIGNMENTS
-- ========================

CREATE TABLE subject_assignments (
    id                  UUID NOT NULL DEFAULT gen_random_uuid(),
    teacher_id          UUID NOT NULL,
    class_id            UUID NOT NULL,
    section_id          UUID NOT NULL,
    subject_id          UUID NOT NULL,
    academic_session_id UUID NOT NULL,
    assigned_by         UUID NULL,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at          TIMESTAMP NULL,

    CONSTRAINT subject_assignments_pkey               PRIMARY KEY (id),
    CONSTRAINT subject_assignments_teacher_id_fkey    FOREIGN KEY (teacher_id)          REFERENCES teachers(id),
    CONSTRAINT subject_assignments_class_id_fkey      FOREIGN KEY (class_id)            REFERENCES classes(id),
    CONSTRAINT subject_assignments_section_id_fkey    FOREIGN KEY (section_id)          REFERENCES sections(id),
    CONSTRAINT subject_assignments_subject_id_fkey    FOREIGN KEY (subject_id)          REFERENCES subjects(id),
    CONSTRAINT subject_assignments_session_id_fkey    FOREIGN KEY (academic_session_id) REFERENCES academic_sessions(id),
    CONSTRAINT subject_assignments_assigned_by_fkey   FOREIGN KEY (assigned_by)         REFERENCES users(id),
    CONSTRAINT subject_assignments_unique             UNIQUE (teacher_id, class_id, section_id, subject_id, academic_session_id)
);

-- ========================
-- 13. EXAMS
-- ========================

CREATE TABLE exams (
    id                  UUID            NOT NULL DEFAULT gen_random_uuid(),
    name                VARCHAR(100)    NOT NULL,
    class_id            UUID            NULL,
    academic_session_id UUID            NULL,
    exam_date           DATE            NULL,
    exam_type           exam_type_enum  NOT NULL DEFAULT 'ADMISSION',
    created_at          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    deleted_at          TIMESTAMP       NULL,

    CONSTRAINT exams_pkey               PRIMARY KEY (id),
    CONSTRAINT exams_class_id_fkey      FOREIGN KEY (class_id)            REFERENCES classes(id),
    CONSTRAINT exams_session_id_fkey    FOREIGN KEY (academic_session_id) REFERENCES academic_sessions(id)
);

-- ========================
-- 14. EXAM_RESULTS
-- ========================

CREATE TABLE exam_results (
    id          UUID        NOT NULL DEFAULT gen_random_uuid(),
    exam_id     UUID        NOT NULL,
    student_id  UUID        NOT NULL,
    subject_id  UUID        NOT NULL,
    marks       NUMERIC(5,2) NULL,
    grade       VARCHAR(5)  NULL,
    created_at  TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    deleted_at  TIMESTAMP   NULL,

    CONSTRAINT exam_results_pkey            PRIMARY KEY (id),
    CONSTRAINT exam_results_exam_id_fkey    FOREIGN KEY (exam_id)    REFERENCES exams(id),
    CONSTRAINT exam_results_student_id_fkey FOREIGN KEY (student_id) REFERENCES students(id),
    CONSTRAINT exam_results_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES subjects(id),
    CONSTRAINT exam_results_unique          UNIQUE (exam_id, student_id, subject_id)
);