import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { RUN, API, uniq, connect, disconnect, get, post, patch, del } from './_helpers.js';

// permissions write-ops (CREATE/UPDATE/DELETE) ADMIN role-এ নেই — শুধু SUPER_ADMIN-এ আছে।
async function superAdminToken(app) {
  const res = await request(app)
    .post(`${API}/auth/login`)
    .send({ email: 'superadmin@school.com', password: 'Password@123' });
  const token = res.body?.data?.accessToken;
  if (!token) throw new Error(`Super-admin login ব্যর্থ (status ${res.status})`);
  return token;
}

describe.skipIf(!RUN)('Permissions API (integration)', () => {
  let app, token;
  let createdId; // lifecycle জুড়ে তৈরি করা permission-এর id

  beforeAll(async () => {
    ({ app } = await connect());
    token = await superAdminToken(app);
  });
  afterAll(async () => {
    await disconnect();
  });

  it('GET /permissions → 200 + paginated list', async () => {
    const res = await get(app, token, '/permissions');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta).toHaveProperty('total');
  });

  it('GET /permissions টোকেন ছাড়া → 401', async () => {
    const res = await get(app, 'invalid-token', '/permissions');
    expect(res.status).toBe(401);
  });

  it('POST /permissions → 201 নতুন permission তৈরি', async () => {
    const name = uniq('PERM');
    const res = await post(app, token, '/permissions', { name });
    expect([200, 201]).toContain(res.status);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data.name).toBe(name.toUpperCase());
    createdId = res.body.data.id;
  });

  it('POST /permissions ডুপ্লিকেট name → 409', async () => {
    const name = uniq('PERMDUP');
    const first = await post(app, token, '/permissions', { name });
    expect([200, 201]).toContain(first.status);
    const res = await post(app, token, '/permissions', { name });
    expect(res.status).toBe(409);
  });

  it('POST /permissions অসম্পূর্ণ body → 400', async () => {
    const res = await post(app, token, '/permissions', {});
    expect(res.status).toBe(400);
  });

  it('GET /permissions/{id} → 200 সদ্য তৈরি permission', async () => {
    expect(createdId).toBeTruthy();
    const res = await get(app, token, `/permissions/${createdId}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(createdId);
  });

  it('PATCH /permissions/{id} → 200 আপডেট', async () => {
    const name = uniq('PERMUPD');
    const res = await patch(app, token, `/permissions/${createdId}`, { name });
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe(name.toUpperCase());
  });

  it('GET অস্তিত্বহীন id → 404', async () => {
    const res = await get(app, token, '/permissions/00000000-0000-0000-0000-0000000000ff');
    expect(res.status).toBe(404);
  });

  it('DELETE /permissions/{id} → 200', async () => {
    const res = await del(app, token, `/permissions/${createdId}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
