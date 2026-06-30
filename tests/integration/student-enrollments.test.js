import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { RUN, SEED, uniq, connect, disconnect, get, post, patch, del } from './_helpers.js';

// unique constraint: (student_id, academic_session_id) — এটি hard UNIQUE (soft-delete বাদ দেয় না)।
// তাই fixed combo দ্বিতীয়বার insert করলে clash হতো। re-runnable রাখতে beforeAll-এ একটা
// FRESH session তৈরি করি আর s1-কে তাতে enroll করি — প্রতি রানে combo সবসময় নতুন।
// class c1-এ সেকশন আছে (seed: c1-A, c1-B), তাই section_id আবশ্যক — c1a ব্যবহার করি।

describe.skipIf(!RUN)('Student-Enrollments API (integration)', () => {
  let app, token;
  let createdId; // lifecycle জুড়ে তৈরি করা enrollment-এর id
  let sessionId; // এই suite-এর জন্য তৈরি fresh academic session

  beforeAll(async () => {
    ({ app, token } = await connect());
    // fresh session — unique (student, session) নিশ্চিত করতে
    const res = await post(app, token, '/academic-sessions', {
      name: uniq('ENROLL_SESSION'),
      start_date: '2030-01-01',
      end_date: '2030-12-31',
    });
    sessionId = res.body?.data?.id;
  });
  afterAll(async () => {
    // cleanup: enrollment → session (থাকলে), error ignore করি
    if (createdId) await del(app, token, `/enrollments/${createdId}`);
    if (sessionId) await del(app, token, `/academic-sessions/${sessionId}`);
    await disconnect();
  });

  it('GET /enrollments → 200 + paginated list', async () => {
    const res = await get(app, token, '/enrollments');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta).toHaveProperty('total');
  });

  it('GET /enrollments টোকেন ছাড়া → 401', async () => {
    const res = await get(app, 'invalid-token', '/enrollments');
    expect(res.status).toBe(401);
  });

  it('POST /enrollments → 201 নতুন enrollment (s1 → s2324)', async () => {
    const res = await post(app, token, '/enrollments', {
      student_id: SEED.students.s1,
      class_id: SEED.classes.c1,
      section_id: SEED.sections.c1a,
      academic_session_id: sessionId,
    });
    expect([200, 201]).toContain(res.status);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
    createdId = res.body.data.id;
  });

  it('POST /enrollments একই student+session → 409', async () => {
    const res = await post(app, token, '/enrollments', {
      student_id: SEED.students.s1,
      class_id: SEED.classes.c1,
      section_id: SEED.sections.c1a,
      academic_session_id: sessionId,
    });
    expect(res.status).toBe(409);
  });

  it('POST /enrollments অসম্পূর্ণ body → 400', async () => {
    const res = await post(app, token, '/enrollments', { student_id: SEED.students.s1 });
    expect(res.status).toBe(400);
  });

  it('GET /enrollments/{id} → 200 সদ্য তৈরি enrollment', async () => {
    expect(createdId).toBeTruthy();
    const res = await get(app, token, `/enrollments/${createdId}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(createdId);
  });

  it('GET অস্তিত্বহীন id → 404', async () => {
    const res = await get(app, token, '/enrollments/00000000-0000-0000-0000-0000000000ff');
    expect(res.status).toBe(404);
  });

  it('PATCH /enrollments/{id} → 200 আপডেট (section transfer c1a → c1b)', async () => {
    const res = await patch(app, token, `/enrollments/${createdId}`, {
      class_id: SEED.classes.c1,
      section_id: SEED.sections.c1b,
    });
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(createdId);
  });

  it('DELETE /enrollments/{id} → 200 (admin-এর ENROLLMENT_UPDATE permission আছে)', async () => {
    const res = await del(app, token, `/enrollments/${createdId}`);
    expect(res.status).toBe(200);
  });
});
