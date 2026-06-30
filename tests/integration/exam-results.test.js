import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { RUN, SEED, uniq, connect, disconnect, get, post, patch, del } from './_helpers.js';

describe.skipIf(!RUN)('Exam-Results API (integration)', () => {
  let app, token;
  let examId; // টেস্টের জন্য তৈরি fresh exam (unique triple রাখতে)
  let resultId; // তৈরি করা result-এর id

  beforeAll(async () => {
    ({ app, token } = await connect());
    // unique (exam_id, student_id, subject_id) নিশ্চিত করতে নতুন exam বানাই
    const res = await post(app, token, '/exams', {
      name: uniq('ResultExam'),
      class_id: SEED.classes.c1,
      academic_session_id: SEED.sessions.active,
      exam_date: '2026-05-01',
      exam_type: 'UNIT_TEST',
    });
    examId = res.body?.data?.id;
  });

  afterAll(async () => {
    // self-clean: result আগে, তারপর exam (result থাকলে exam delete আটকায়)
    if (resultId) await del(app, token, `/results/${resultId}`);
    if (examId) await del(app, token, `/exams/${examId}`);
    await disconnect();
  });

  it('GET /results → 200 + paginated list', async () => {
    const res = await get(app, token, '/results');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta).toHaveProperty('total');
  });

  it('GET /results টোকেন ছাড়া → 401', async () => {
    const res = await get(app, 'invalid-token', '/results');
    expect(res.status).toBe(401);
  });

  it('POST /results → 201 নতুন result এন্ট্রি', async () => {
    expect(examId).toBeTruthy();
    const res = await post(app, token, '/results', {
      exam_id: examId,
      student_id: SEED.students.s1,
      subject_id: SEED.subjects.religion,
      marks: 77,
    });
    expect([200, 201]).toContain(res.status);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
    expect(Number(res.body.data.marks)).toBe(77);
    resultId = res.body.data.id;
  });

  it('POST /results ডুপ্লিকেট triple → 409', async () => {
    const res = await post(app, token, '/results', {
      exam_id: examId,
      student_id: SEED.students.s1,
      subject_id: SEED.subjects.religion,
      marks: 80,
    });
    expect(res.status).toBe(409);
  });

  it('POST /results অসম্পূর্ণ body → 400', async () => {
    const res = await post(app, token, '/results', { exam_id: examId });
    expect(res.status).toBe(400);
  });

  it('GET /results/{id} → 200 সদ্য তৈরি result', async () => {
    expect(resultId).toBeTruthy();
    const res = await get(app, token, `/results/${resultId}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(resultId);
  });

  it('GET অস্তিত্বহীন id → 404', async () => {
    const res = await get(app, token, '/results/00000000-0000-0000-0000-0000000000ff');
    expect(res.status).toBe(404);
  });

  it('PATCH /results/{id} → 200 marks আপডেট', async () => {
    const res = await patch(app, token, `/results/${resultId}`, { marks: 88 });
    expect(res.status).toBe(200);
    expect(Number(res.body.data.marks)).toBe(88);
  });

  it('GET /results/exam/{examId} → 200 array', async () => {
    const res = await get(app, token, `/results/exam/${examId}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /results/exam/{examId} অস্তিত্বহীন exam → 404', async () => {
    const res = await get(app, token, '/results/exam/00000000-0000-0000-0000-0000000000ff');
    expect(res.status).toBe(404);
  });

  it('GET marksheet (seeded exam + student) → 200', async () => {
    const res = await get(
      app,
      token,
      `/results/exam/${SEED.exams.midterm1}/student/${SEED.students.s1}/marksheet`,
    );
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('results');
    expect(res.body.data).toHaveProperty('total_marks');
    expect(Array.isArray(res.body.data.results)).toBe(true);
  });

  it('DELETE /results/{id} → 200', async () => {
    const res = await del(app, token, `/results/${resultId}`);
    expect(res.status).toBe(200);
    resultId = null;
  });
});
