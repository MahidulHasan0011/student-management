import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { RUN, SEED, uniq, connect, disconnect, get, post, patch, del } from './_helpers.js';

describe.skipIf(!RUN)('Teachers API (integration)', () => {
  let app, token;
  let createdId; // lifecycle জুড়ে তৈরি করা teacher-এর id

  beforeAll(async () => {
    ({ app, token } = await connect());
  });
  afterAll(async () => {
    await disconnect();
  });

  it('GET /teachers → 200 + paginated list', async () => {
    const res = await get(app, token, '/teachers');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta).toHaveProperty('total');
  });

  it('GET /teachers টোকেন ছাড়া → 401', async () => {
    const res = await get(app, 'invalid-token', '/teachers');
    expect(res.status).toBe(401);
  });

  it('POST /teachers → 201 নতুন teacher তৈরি', async () => {
    const email = `${uniq('teacher')}@test.school.com`;
    const res = await post(app, token, '/teachers', {
      full_name: 'Test Teacher',
      email,
      password: 'Password@123',
      gender: 'MALE',
      phone: '01700000000',
      designation: 'Senior Teacher',
      qualification: 'M.Sc in Mathematics',
      joining_date: '2020-01-15',
    });
    expect([200, 201]).toContain(res.status);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
    createdId = res.body.data.id;
  });

  it('POST /teachers ডুপ্লিকেট email → 409', async () => {
    const email = `${uniq('dup')}@test.school.com`;
    const body = { full_name: 'Dup Teacher', email, password: 'Password@123' };
    await post(app, token, '/teachers', body);
    const res = await post(app, token, '/teachers', body);
    expect(res.status).toBe(409);
  });

  it('POST /teachers অসম্পূর্ণ body → 400', async () => {
    const res = await post(app, token, '/teachers', { full_name: 'No Email' });
    expect(res.status).toBe(400);
  });

  it('GET /teachers/{id} → 200 সদ্য তৈরি teacher', async () => {
    expect(createdId).toBeTruthy();
    const res = await get(app, token, `/teachers/${createdId}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(createdId);
  });

  it('GET /teachers/{id}/assignments → 200 (profile + assignments)', async () => {
    const res = await get(app, token, `/teachers/${SEED.teachers.t1}/assignments`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.assignments)).toBe(true);
  });

  it('PATCH /teachers/{id} → 200 আপডেট', async () => {
    const res = await patch(app, token, `/teachers/${createdId}`, {
      designation: 'Head Teacher',
      qualification: 'Ph.D in Education',
    });
    expect(res.status).toBe(200);
    expect(res.body.data.designation).toBe('Head Teacher');
  });

  it('GET অস্তিত্বহীন id → 404', async () => {
    const res = await get(app, token, '/teachers/00000000-0000-0000-0000-0000000000ff');
    expect(res.status).toBe(404);
  });

  it('DELETE /teachers/{id} → 200 (assignment নেই বলে মুছবে)', async () => {
    const res = await del(app, token, `/teachers/${createdId}`);
    expect(res.status).toBe(200);
  });
});
