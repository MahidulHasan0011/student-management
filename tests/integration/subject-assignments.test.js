import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { RUN, SEED, uniq, connect, disconnect, get, post, patch, del } from './_helpers.js';

// class c2-এ সেকশন আছে (seed: c2-A, c2-B), তাই assignment তৈরিতে section_id আবশ্যক।
// c2-A সেকশনের seeded UUID — SEED.sections-এ নাম দিয়ে exposed নয়, তাই সরাসরি ব্যবহার।
const SECTION_C2_A = 'e0000000-0000-0000-0000-000000000003';

// unique constraint (teacher,class,section,subject,session) hard UNIQUE (soft-delete বাদ দেয় না)।
// re-runnable রাখতে beforeAll-এ দুটো FRESH subject বানাই — create ও patch দুটো combo-ই
// প্রতি রানে নতুন subject পায়, তাই পুরনো soft-deleted row-এর সাথে clash হয় না।
describe.skipIf(!RUN)('Subject-Assignments API (integration)', () => {
  let app, token;
  let createdId; // lifecycle জুড়ে তৈরি করা assignment-এর id
  let subjectA, subjectB; // এই suite-এর fresh subject (create + patch)

  beforeAll(async () => {
    ({ app, token } = await connect());
    const a = await post(app, token, '/subjects', { name: uniq('SA_SUBJ'), code: uniq('SAA') });
    const b = await post(app, token, '/subjects', { name: uniq('SA_SUBJ'), code: uniq('SAB') });
    subjectA = a.body?.data?.id;
    subjectB = b.body?.data?.id;
  });
  afterAll(async () => {
    // cleanup: assignment → subjects (assignment soft-deleted হলে subject delete blocked থাকে না)
    if (createdId) await del(app, token, `/assignments/${createdId}`);
    if (subjectA) await del(app, token, `/subjects/${subjectA}`);
    if (subjectB) await del(app, token, `/subjects/${subjectB}`);
    await disconnect();
  });

  it('GET /assignments → 200 + paginated list', async () => {
    const res = await get(app, token, '/assignments');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta).toHaveProperty('total');
  });

  it('GET /assignments টোকেন ছাড়া → 401', async () => {
    const res = await get(app, 'invalid-token', '/assignments');
    expect(res.status).toBe(401);
  });

  it('POST /assignments → 201 নতুন assignment (seed-এ নেই এমন combo)', async () => {
    const res = await post(app, token, '/assignments', {
      teacher_id: SEED.teachers.t2,
      class_id: SEED.classes.c2,
      section_id: SECTION_C2_A,
      subject_id: subjectA,
      academic_session_id: SEED.sessions.active,
    });
    expect([200, 201]).toContain(res.status);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
    createdId = res.body.data.id;
  });

  it('POST /assignments ডুপ্লিকেট combo → 409', async () => {
    const res = await post(app, token, '/assignments', {
      teacher_id: SEED.teachers.t2,
      class_id: SEED.classes.c2,
      section_id: SECTION_C2_A,
      subject_id: subjectA,
      academic_session_id: SEED.sessions.active,
    });
    expect(res.status).toBe(409);
  });

  it('POST /assignments অসম্পূর্ণ body → 400', async () => {
    const res = await post(app, token, '/assignments', { teacher_id: SEED.teachers.t2 });
    expect(res.status).toBe(400);
  });

  it('GET /assignments/{id} → 200 সদ্য তৈরি assignment', async () => {
    expect(createdId).toBeTruthy();
    const res = await get(app, token, `/assignments/${createdId}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(createdId);
  });

  it('GET /assignments/teacher/{teacherId} → 200 array (seeded teacher t1)', async () => {
    const res = await get(app, token, `/assignments/teacher/${SEED.teachers.t1}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET অস্তিত্বহীন id → 404', async () => {
    const res = await get(app, token, '/assignments/00000000-0000-0000-0000-0000000000ff');
    expect(res.status).toBe(404);
  });

  it('PATCH /assignments/{id} → 200 আপডেট (subject reassign)', async () => {
    const res = await patch(app, token, `/assignments/${createdId}`, {
      subject_id: subjectB,
    });
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(createdId);
  });

  it('DELETE /assignments/{id} → 200 (soft delete)', async () => {
    const res = await del(app, token, `/assignments/${createdId}`);
    expect(res.status).toBe(200);
  });
});
