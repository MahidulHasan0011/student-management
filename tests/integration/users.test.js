import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { RUN, SEED, uniq, connect, disconnect, get, post, patch, del } from './_helpers.js';

describe.skipIf(!RUN)('Users API (integration)', () => {
  let app, token;
  let createdId; // lifecycle জুড়ে তৈরি করা user-এর id

  beforeAll(async () => {
    ({ app, token } = await connect());
  });
  afterAll(async () => {
    await disconnect();
  });

  it('GET /users → 200 + paginated list', async () => {
    const res = await get(app, token, '/users');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta).toHaveProperty('total');
  });

  it('GET /users টোকেন ছাড়া → 401', async () => {
    const res = await get(app, 'invalid-token', '/users');
    expect(res.status).toBe(401);
  });

  it('POST /users → 201 নতুন user তৈরি', async () => {
    const email = `${uniq('user')}@test.school.com`;
    const res = await post(app, token, '/users', {
      full_name: 'Test User',
      email,
      password: 'Password@123',
      role_id: SEED.roles.teacher,
      gender: 'MALE',
    });
    expect([200, 201]).toContain(res.status);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data.email).toBe(email);
    createdId = res.body.data.id;
  });

  it('POST /users ডুপ্লিকেট email → 409', async () => {
    const email = `${uniq('dup')}@test.school.com`;
    const body = {
      full_name: 'Dup User',
      email,
      password: 'Password@123',
      role_id: SEED.roles.teacher,
    };
    const first = await post(app, token, '/users', body);
    expect([200, 201]).toContain(first.status);
    const res = await post(app, token, '/users', body);
    expect(res.status).toBe(409);
  });

  it('POST /users অসম্পূর্ণ body → 400', async () => {
    const res = await post(app, token, '/users', { full_name: 'No Email' });
    expect(res.status).toBe(400);
  });

  it('GET /users/{id} → 200 সদ্য তৈরি user', async () => {
    expect(createdId).toBeTruthy();
    const res = await get(app, token, `/users/${createdId}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(createdId);
  });

  it('PATCH /users/{id} → 200 আপডেট', async () => {
    const res = await patch(app, token, `/users/${createdId}`, {
      full_name: 'Updated User',
    });
    expect(res.status).toBe(200);
    expect(res.body.data.full_name).toBe('Updated User');
  });

  it('PATCH /users/{id}/toggle-active → 200 নিষ্ক্রিয়/সক্রিয়', async () => {
    const off = await patch(app, token, `/users/${createdId}/toggle-active`, {
      is_active: false,
    });
    expect(off.status).toBe(200);
    expect(off.body.success).toBe(true);
    expect(off.body.data.is_active).toBe(false);

    const on = await patch(app, token, `/users/${createdId}/toggle-active`, {
      is_active: true,
    });
    expect(on.status).toBe(200);
    expect(on.body.data.is_active).toBe(true);
  });

  it('GET অস্তিত্বহীন id → 404', async () => {
    const res = await get(app, token, '/users/00000000-0000-0000-0000-0000000000ff');
    expect(res.status).toBe(404);
  });

  it('DELETE /users/{id} → 200 (soft delete)', async () => {
    const res = await del(app, token, `/users/${createdId}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
