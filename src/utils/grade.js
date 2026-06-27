const GRADE_BANDS = [
  { min: 80, grade: 'A+', point: 5.0 },
  { min: 70, grade: 'A', point: 4.0 },
  { min: 60, grade: 'A-', point: 3.5 },
  { min: 50, grade: 'B', point: 3.0 },
  { min: 40, grade: 'C', point: 2.0 },
  { min: 33, grade: 'D', point: 1.0 },
  { min: 0, grade: 'F', point: 0.0 },
];

export const calculateGrade = (marks) => {
  const m = parseFloat(marks);
  if (Number.isNaN(m)) return null;
  return GRADE_BANDS.find((b) => m >= b.min)?.grade ?? 'F';
};
