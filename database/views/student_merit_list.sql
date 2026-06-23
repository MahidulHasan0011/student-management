-- =============================================================================
-- VIEW: student_merit_list
-- USE CASE: Class + session ভিত্তিক merit list — OLD students-এর
--           UNIT_TEST + MIDTERM + FINAL সব exam-এর marks যোগ করে, FINAL ও MIDTERM আলাদা
--           track রাখে (tie-breaking-এর জন্য), এবং ৫টা tie-breaking rule
--           অনুযায়ী rank দেয়:
--             ১. Higher total score (sum of marks)
--             ২. Higher FINAL score
--             ৩. Higher MIDTERM score
--             ৪. Earlier admission_date
--             ৫. Earlier created_at
--             ৬. Lower student_id (সবচেয়ে শেষ, deterministic guarantee)
--
-- শুধুমাত্র PUBLISHED status-এর exam ব্যবহার হয় — DRAFT exam-এর result গণনায় আসে না।
-- শুধুমাত্র FINAL ও MIDTERM-কে আলাদা column-এ আনার জন্য conditional aggregation (CASE+SUM) ব্যবহার করা হয়েছে।
-- =============================================================================

CREATE OR REPLACE VIEW public.student_merit_list AS
WITH per_exam_totals AS (
  -- প্রতিটি student + exam কম্বিনেশনের জন্য সব subject-এর marks যোগ
  SELECT
    er.student_id,
    e.id          AS exam_id,
    e.exam_type,
    e.class_id,
    e.academic_session_id,
    SUM(er.marks) AS exam_total
  FROM public.exam_results er
  JOIN public.exams e ON e.id = er.exam_id
  WHERE er.deleted_at IS NULL
    AND e.deleted_at IS NULL
    AND e.status = 'PUBLISHED'      -- শুধু PUBLISHED exam গণনায় আসবে
    AND e.exam_type IN ('UNIT_TEST', 'MIDTERM', 'FINAL')  -- OLD student-দের ৩ ধরনের exam
  GROUP BY er.student_id, e.id, e.exam_type, e.class_id, e.academic_session_id
)
SELECT
  pet.class_id,
  pet.academic_session_id,
  pet.student_id,
  s.student_code,
  u.full_name                      AS student_name,
  se.admission_date,
  se.created_at                    AS enrollment_created_at,

  -- মোট score — UNIT_TEST+MIDTERM+FINAL সব exam-এর exam_total যোগ
  SUM(pet.exam_total)              AS total_score,

  -- tie-breaking-এর জন্য FINAL ও MIDTERM আলাদা করে রাখা
  COALESCE(SUM(pet.exam_total) FILTER (WHERE pet.exam_type = 'FINAL'), 0) AS FINAL_score,
  COALESCE(SUM(pet.exam_total) FILTER (WHERE pet.exam_type = 'MIDTERM'), 0)   AS midterm_score,

  -- ৫ ধাপের tie-breaking rule অনুযায়ী rank — deterministic, কখনো tie থাকবে না
  RANK() OVER (
    PARTITION BY pet.class_id, pet.academic_session_id
    ORDER BY
      SUM(pet.exam_total) DESC,
      COALESCE(SUM(pet.exam_total) FILTER (WHERE pet.exam_type = 'FINAL'), 0) DESC,
      COALESCE(SUM(pet.exam_total) FILTER (WHERE pet.exam_type = 'MIDTERM'), 0) DESC,
      se.admission_date ASC,
      se.created_at ASC,
      pet.student_id ASC
  ) AS rank_position

FROM per_exam_totals pet
JOIN public.students s ON s.id = pet.student_id
JOIN public.users u ON u.id = s.user_id
JOIN public.student_enrollments se
  ON se.student_id = pet.student_id
  AND se.academic_session_id = pet.academic_session_id
  AND se.deleted_at IS NULL
WHERE s.deleted_at IS NULL
GROUP BY pet.class_id, pet.academic_session_id, pet.student_id,
         s.student_code, u.full_name, se.admission_date, se.created_at;

-- Usage example:
-- SELECT * FROM student_merit_list
--   WHERE class_id = '...' AND academic_session_id = '...'
--   ORDER BY rank_position;
-- ← roll.engine.js এই rank_position অনুযায়ী roll_number assign করবে