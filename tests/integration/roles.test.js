import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { RUN, API, uniq, connect, disconnect, get, post, patch, put, del } from './_helpers.js';

// roles write-ops (CREATE/UPDATE/DELETE) ADMIN role-এ নেই — শুধু SUPER_ADMIN-এ আছে।
// তাই এই suite super-admin হিসেবে লগইন করে।
async function superAdminToken(app) {
  const res = await request(app)
    .post(`${API}/auth/login`)
    .send({ email: 'superadmin@school.com', password: 'Password@123' });
  const token = res.body?.data?.accessToken;
  if (!token) throw new Error(`Super-admin login ব্যর্থ (status ${res.status})`);
  return token;
}

describe.skipIf(!RUN)('Roles API (integration)', () => {
  let app, token;
  let createdId; // lifecycle জুড়ে তৈরি করা role-এর id

  beforeAll(async () => {
    ({ app } = await connect());
    token = await superAdminToken(app);
  });
  afterAll(async () => {
    await disconnect();
  });

  it('GET /roles → 200 + paginated list', async () => {
    const res = await get(app, token, '/roles');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta).toHaveProperty('total');
  });

  it('GET /roles টোকেন ছাড়া → 401', async () => {
    const res = await get(app, 'invalid-token', '/roles');
    expect(res.status).toBe(401);
  });

  it('POST /roles → 201 নতুন role তৈরি', async () => {
    const name = uniq('ROLE');
    const res = await post(app, token, '/roles', { name });
    expect([200, 201]).toContain(res.status);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data.name).toBe(name.toUpperCase());
    createdId = res.body.data.id;
  });

  it('POST /roles ডুপ্লিকেট name → 409', async () => {
    const name = uniq('ROLEDUP');
    const first = await post(app, token, '/roles', { name });
    expect([200, 201]).toContain(first.status);
    const res = await post(app, token, '/roles', { name });
    expect(res.status).toBe(409);
  });

  it('POST /roles অসম্পূর্ণ body → 400', async () => {
    const res = await post(app, token, '/roles', {});
    expect(res.status).toBe(400);
  });

  it('GET /roles/{id} → 200 সদ্য তৈরি role', async () => {
    expect(createdId).toBeTruthy();
    const res = await get(app, token, `/roles/${createdId}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(createdId);
  });

  it('PATCH /roles/{id} → 200 আপডেট', async () => {
    const name = uniq('ROLEUPD');
    const res = await patch(app, token, `/roles/${createdId}`, { name });
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe(name.toUpperCase());
  });

  it('PUT /roles/{id}/permissions → 200 permission সিঙ্ক', async () => {
    // নিজস্ব permission বানাই — sibling suite-এর সাথে race এড়াতে (ওরা permission মুছে দেয়)
    const p1 = await post(app, token, '/permissions', { name: uniq('RSYNCPERM') });
    const p2 = await post(app, token, '/permissions', { name: uniq('RSYNCPERM') });
    expect([200, 201]).toContain(p1.status);
    expect([200, 201]).toContain(p2.status);
    const permissionIds = [p1.body.data.id, p2.body.data.id];

    try {
      const res = await put(app, token, `/roles/${createdId}/permissions`, { permissionIds });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(createdId);

      // খালি অ্যারে দিলে সব permission সরে যায়
      const cleared = await put(app, token, `/roles/${createdId}/permissions`, {
        permissionIds: [],
      });
      expect(cleared.status).toBe(200);
    } finally {
      // cleanup — বানানো permission মুছে দিই
      await del(app, token, `/permissions/${p1.body.data.id}`);
      await del(app, token, `/permissions/${p2.body.data.id}`);
    }
  });

  it('GET অস্তিত্বহীন id → 404', async () => {
    const res = await get(app, token, '/roles/00000000-0000-0000-0000-0000000000ff');
    expect(res.status).toBe(404);
  });

  it('DELETE /roles/{id} → 200 (soft delete)', async () => {
    const res = await del(app, token, `/roles/${createdId}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
