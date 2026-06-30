import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { RUN, API, uniq, connect, disconnect, get, post, del } from './_helpers.js';

// role-permission write-ops ROLE_UPDATE + role CREATE/DELETE দরকার — শুধু SUPER_ADMIN-এ আছে।
async function superAdminToken(app) {
  const res = await request(app)
    .post(`${API}/auth/login`)
    .send({ email: 'superadmin@school.com', password: 'Password@123' });
  const token = res.body?.data?.accessToken;
  if (!token) throw new Error(`Super-admin login ব্যর্থ (status ${res.status})`);
  return token;
}

describe.skipIf(!RUN)('Role-Permissions API (integration)', () => {
  let app, token;
  let roleId; // টেস্টের জন্য বানানো fresh role
  let permissionId; // assign/revoke করার জন্য আসল permission

  beforeAll(async () => {
    ({ app } = await connect());
    token = await superAdminToken(app);

    // fresh role বানাই — যাতে seed role-এর state নষ্ট না হয়
    const roleRes = await post(app, token, '/roles', { name: uniq('RPROLE') });
    expect([200, 201]).toContain(roleRes.status);
    roleId = roleRes.body.data.id;

    // নিজস্ব permission বানাই — sibling suite-এর সাথে race এড়াতে
    const permRes = await post(app, token, '/permissions', { name: uniq('RPPERM') });
    expect([200, 201]).toContain(permRes.status);
    permissionId = permRes.body.data.id;
    expect(permissionId).toBeTruthy();
  });

  afterAll(async () => {
    // cleanup — বানানো role + permission মুছে দিই
    if (roleId) await del(app, token, `/roles/${roleId}`);
    if (permissionId) await del(app, token, `/permissions/${permissionId}`);
    await disconnect();
  });

  it('GET /role-permissions/role/{roleId} → 200 + array', async () => {
    const res = await get(app, token, `/role-permissions/role/${roleId}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /role-permissions টোকেন ছাড়া → 401', async () => {
    const res = await get(app, 'invalid-token', `/role-permissions/role/${roleId}`);
    expect(res.status).toBe(401);
  });

  it('POST /role-permissions → 201 permission assign', async () => {
    const res = await post(app, token, '/role-permissions', { roleId, permissionId });
    expect([200, 201]).toContain(res.status);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
  });

  it('POST /role-permissions আবার একই → 409', async () => {
    const res = await post(app, token, '/role-permissions', { roleId, permissionId });
    expect(res.status).toBe(409);
  });

  it('POST /role-permissions অসম্পূর্ণ body → 400', async () => {
    const res = await post(app, token, '/role-permissions', { roleId });
    expect(res.status).toBe(400);
  });

  it('GET /role-permissions/role/{roleId} → assign করা permission দেখা যায়', async () => {
    const res = await get(app, token, `/role-permissions/role/${roleId}`);
    expect(res.status).toBe(200);
    const ids = res.body.data.map((rp) => rp.permission_id || rp.permissionId);
    expect(ids).toContain(permissionId);
  });

  it('DELETE /role-permissions → 200 permission revoke', async () => {
    const res = await del(app, token, '/role-permissions').send({ roleId, permissionId });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('DELETE /role-permissions আবার (assign নেই) → 404', async () => {
    const res = await del(app, token, '/role-permissions').send({ roleId, permissionId });
    expect(res.status).toBe(404);
  });
});
