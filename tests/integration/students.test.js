import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { RUN, SEED, uniq, connect, disconnect, get, post, patch, del } from './_helpers.js';

// টেমপ্লেট ফাইল — বাকি module-test এই প্যাটার্নই অনুসরণ করে।
describe.skipIf(!RUN)('Students API (integration)', () => {
  let app, token;
  let createdId; // lifecycle জুড়ে তৈরি করা student-এর id

  beforeAll(async () => {
    ({ app, token } = await connect());
  });
  afterAll(async () => {
    await disconnect();
  });

  it('GET /students → 200 + paginated list', async () => {
    const res = await get(app, token, '/students');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta).toHaveProperty('total');
  });

  it('GET /students টোকেন ছাড়া → 401', async () => {
    const res = await get(app, 'invalid-token', '/students');
    expect(res.status).toBe(401);
  });

  it('POST /students → 201 নতুন student তৈরি', async () => {
    const email = `${uniq('student')}@test.school.com`;
    const res = await post(app, token, '/students', {
      full_name: 'Test Student',
      email,
      password: 'Password@123',
      gender: 'MALE',
      date_of_birth: '2015-05-10',
      guardian_name: 'Test Guardian',
      guardian_phone: '01700000000',
      address: 'Test Address, Dhaka',
    });
    expect([200, 201]).toContain(res.status);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data.student_code).toMatch(/^STU-/);
    createdId = res.body.data.id;
  });

  it('POST /students ডুপ্লিকেট email → 409', async () => {
    const email = `${uniq('dup')}@test.school.com`;
    const body = { full_name: 'Dup', email, password: 'Password@123' };
    await post(app, token, '/students', body);
    const res = await post(app, token, '/students', body);
    expect(res.status).toBe(409);
  });

  it('POST /students অসম্পূর্ণ body → 400', async () => {
    const res = await post(app, token, '/students', { full_name: 'No Email' });
    expect(res.status).toBe(400);
  });

  it('GET /students/{id} → 200 সদ্য তৈরি student', async () => {
    expect(createdId).toBeTruthy();
    const res = await get(app, token, `/students/${createdId}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(createdId);
  });

  it('GET /students/{id}/enrollment → 200 (enrollment null হতে পারে)', async () => {
    const res = await get(app, token, `/students/${SEED.students.s1}/enrollment`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('current_enrollment');
  });

  it('PATCH /students/{id} → 200 আপডেট', async () => {
    const res = await patch(app, token, `/students/${createdId}`, {
      guardian_name: 'Updated Guardian',
      address: 'Updated Address',
    });
    expect(res.status).toBe(200);
    expect(res.body.data.guardian_name).toBe('Updated Guardian');
  });

  it('GET অস্তিত্বহীন id → 404', async () => {
    const res = await get(app, token, '/students/00000000-0000-0000-0000-0000000000ff');
    expect(res.status).toBe(404);
  });

  it('DELETE /students/{id} → 200 (enrollment নেই বলে মুছবে)', async () => {
    const res = await del(app, token, `/students/${createdId}`);
    expect(res.status).toBe(200);
  });
});
