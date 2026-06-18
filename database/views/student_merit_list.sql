-- =============================================================================
-- VIEW: student_merit_list
-- USE CASE: Ranking engine-এর জন্য সবচেয়ে গুরুত্বপূর্ণ view।
--           প্রতিটি exam-এ প্রতিটি ছাত্রের total marks + rank রেডি করে দেয়।
--           roll.engine.js / ranking.engine.js এখান থেকে সরাসরি rank পড়তে পারবে,
--           আলাদা করে SUM+GROUP BY+RANK লিখতে হবে না।
-- =============================================================================

CREATE OR REPLACE VIEW public.student_merit_list AS
SELECT
  e.id                     AS exam_id,
  e.name                   AS exam_name,
  e.exam_type,
  e.class_id,
  e.academic_session_id,
  er.student_id,
  s.student_code,
  u.full_name              AS student_name,
  SUM(er.marks)            AS total_marks,
  COUNT(er.subject_id)     AS subjects_counted,
  RANK() OVER (
    PARTITION BY e.id
    ORDER BY SUM(er.marks) DESC
  )                        AS rank_position
FROM public.exam_results er
JOIN public.exams e ON e.id = er.exam_id
JOIN public.students s ON s.id = er.student_id
JOIN public.users u ON u.id = s.user_id
WHERE er.deleted_at IS NULL
  AND e.deleted_at IS NULL
  AND s.deleted_at IS NULL
GROUP BY e.id, e.name, e.exam_type, e.class_id, e.academic_session_id,
         er.student_id, s.student_code, u.full_name;

-- Usage example:
-- SELECT * FROM student_merit_list WHERE exam_id = '...' ORDER BY rank_position;
-- ← roll.engine.js এই rank_position অনুযায়ী roll_number assign করবে