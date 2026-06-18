-- =============================================================================
-- VIEW: exam_result_summary
-- USE CASE: Result card / মার্কশিট দেখাতে — exam_results-এ শুধু ID থাকে,
--           এই view দিয়ে student name, subject name, exam name একসাথে পাওয়া যায়
-- =============================================================================

CREATE OR REPLACE VIEW public.exam_result_summary AS
SELECT
  er.id                   AS result_id,
  er.exam_id,
  e.name                  AS exam_name,
  e.exam_type,
  e.exam_date,
  e.academic_session_id,
  er.student_id,
  s.student_code,
  u.full_name             AS student_name,
  er.subject_id,
  sub.name                AS subject_name,
  sub.code                AS subject_code,
  er.marks,
  er.grade,
  er.created_at
FROM public.exam_results er
JOIN public.exams e ON e.id = er.exam_id
JOIN public.students s ON s.id = er.student_id
JOIN public.users u ON u.id = s.user_id
JOIN public.subjects sub ON sub.id = er.subject_id
WHERE er.deleted_at IS NULL
  AND e.deleted_at IS NULL
  AND s.deleted_at IS NULL;

-- Usage example:
-- SELECT * FROM exam_result_summary WHERE student_id = '...' ORDER BY exam_date;
-- SELECT student_name, SUM(marks) AS total FROM exam_result_summary
--   WHERE exam_id = '...' GROUP BY student_name ORDER BY total DESC;  ← merit list