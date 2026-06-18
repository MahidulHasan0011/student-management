-- =============================================================================
-- VIEW: student_full_profile
-- USE CASE: ছাত্রের তালিকা/প্রোফাইল দেখাতে — user info + student info +
--           current enrollment (class, section, roll) এক query-তে
-- বারবার যা লাগে: students JOIN users JOIN student_enrollments JOIN classes JOIN sections
-- =============================================================================

CREATE OR REPLACE VIEW public.student_full_profile AS
SELECT
  s.id                    AS student_id,
  s.student_code,
  s.date_of_birth,
  s.guardian_name,
  s.guardian_phone,
  s.address,
  u.id                    AS user_id,
  u.full_name,
  u.email,
  u.gender,
  u.is_active,
  se.id                   AS enrollment_id,
  se.academic_session_id,
  asess.name              AS session_name,
  asess.is_active         AS session_is_active,
  se.class_id,
  c.name                  AS class_name,
  se.section_id,
  sec.name                AS section_name,
  se.roll_number,
  s.created_at,
  s.deleted_at
FROM public.students s
JOIN public.users u ON u.id = s.user_id
LEFT JOIN public.student_enrollments se
  ON se.student_id = s.id AND se.deleted_at IS NULL
LEFT JOIN public.academic_sessions asess ON asess.id = se.academic_session_id
LEFT JOIN public.classes c ON c.id = se.class_id
LEFT JOIN public.sections sec ON sec.id = se.section_id
WHERE s.deleted_at IS NULL;

-- Usage example:
-- SELECT * FROM student_full_profile WHERE session_is_active = true;
-- SELECT * FROM student_full_profile WHERE class_name = 'Class 1' AND section_name = 'A';