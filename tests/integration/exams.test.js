import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { RUN, SEED, uniq, connect, disconnect, get, post, patch, del } from './_helpers.js';

describe.skipIf(!RUN)('Exams API (integration)', () => {
  let app, token;
  let createdId; // lifecycle জুড়ে তৈরি করা exam-এর id

  beforeAll(async () => {
    ({ app, token } = await connect());
  });
  afterAll(async () => {
    await disconnect();
  });

  it('GET /exams → 200 + paginated list', async () => {
    const res = await get(app, token, '/exams');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta).toHaveProperty('total');
  });

  it('GET /exams টোকেন ছাড়া → 401', async () => {
    const res = await get(app, 'invalid-token', '/exams');
    expect(res.status).toBe(401);
  });

  it('POST /exams → 201 নতুন exam তৈরি (DRAFT)', async () => {
    const res = await post(app, token, '/exams', {
      name: uniq('Exam'),
      class_id: SEED.classes.c2,
      academic_session_id: SEED.sessions.active,
      exam_date: '2026-03-01',
      exam_type: 'MIDTERM',
    });
    expect([200, 201]).toContain(res.status);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data.status).toBe('DRAFT');
    expect(res.body.data.exam_type).toBe('MIDTERM');
    createdId = res.body.data.id;
  });

  it('POST /exams name ছাড়া → 400', async () => {
    const res = await post(app, token, '/exams', { exam_type: 'MIDTERM' });
    expect(res.status).toBe(400);
  });

  it('GET /exams/{id} → 200 সদ্য তৈরি exam', async () => {
    expect(createdId).toBeTruthy();
    const res = await get(app, token, `/exams/${createdId}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(createdId);
  });

  it('GET অস্তিত্বহীন id → 404', async () => {
    const res = await get(app, token, '/exams/00000000-0000-0000-0000-0000000000ff');
    expect(res.status).toBe(404);
  });

  it('PATCH /exams/{id} → 200 আপডেট', async () => {
    const res = await patch(app, token, `/exams/${createdId}`, {
      exam_date: '2026-04-01',
      exam_type: 'UNIT_TEST',
    });
    expect(res.status).toBe(200);
    expect(res.body.data.exam_type).toBe('UNIT_TEST');
  });

  it('PATCH /exams/{id}/publish result ছাড়া → 400', async () => {
    // সদ্য তৈরি exam-এ কোনো result নেই, তাই publish আটকাবে
    const res = await patch(app, token, `/exams/${createdId}/publish`);
    expect(res.status).toBe(400);
  });

  it('PATCH /exams/{id}/unpublish ইতিমধ্যে DRAFT → 400', async () => {
    const res = await patch(app, token, `/exams/${createdId}/unpublish`);
    expect(res.status).toBe(400);
  });

  it('DELETE /exams/{id} → 200 (result নেই বলে মুছবে)', async () => {
    const res = await del(app, token, `/exams/${createdId}`);
    expect(res.status).toBe(200);
    createdId = null;
  });
});
