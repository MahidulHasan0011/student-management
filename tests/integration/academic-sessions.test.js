import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { RUN, SEED, uniq, connect, disconnect, get, post, patch, del } from './_helpers.js';

describe.skipIf(!RUN)('Academic-Sessions API (integration)', () => {
  let app, token;
  let createdId; // এই suite-এ তৈরি করা session — seeded active session-এ হাত দেওয়া হবে না

  beforeAll(async () => {
    ({ app, token } = await connect());
  });
  afterAll(async () => {
    await disconnect();
  });

  it('GET /academic-sessions → 200 + paginated list', async () => {
    const res = await get(app, token, '/academic-sessions');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta).toHaveProperty('total');
  });

  it('GET /academic-sessions টোকেন ছাড়া → 401', async () => {
    const res = await get(app, 'invalid-token', '/academic-sessions');
    expect(res.status).toBe(401);
  });

  it('GET /academic-sessions/active → 200 (seeded active session)', async () => {
    const res = await get(app, token, '/academic-sessions/active');
    expect(res.status).toBe(200);
    expect(res.body.data.is_active).toBe(true);
  });

  it('POST /academic-sessions → 201 নতুন session তৈরি', async () => {
    const res = await post(app, token, '/academic-sessions', {
      name: uniq('SESSION'),
      start_date: '2027-01-01',
      end_date: '2027-12-31',
    });
    expect([200, 201]).toContain(res.status);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
    createdId = res.body.data.id;
  });

  it('POST /academic-sessions অসম্পূর্ণ body → 400', async () => {
    const res = await post(app, token, '/academic-sessions', { start_date: '2027-01-01' });
    expect(res.status).toBe(400);
  });

  it('GET /academic-sessions/{id} → 200 সদ্য তৈরি session', async () => {
    expect(createdId).toBeTruthy();
    const res = await get(app, token, `/academic-sessions/${createdId}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(createdId);
  });

  it('GET অস্তিত্বহীন id → 404', async () => {
    const res = await get(app, token, '/academic-sessions/00000000-0000-0000-0000-0000000000ff');
    expect(res.status).toBe(404);
  });

  it('PATCH /academic-sessions/{id} → 200 আপডেট (name)', async () => {
    const res = await patch(app, token, `/academic-sessions/${createdId}`, {
      name: uniq('SESSION-UPD'),
    });
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(createdId);
  });

  it('PATCH /academic-sessions/{id}/activate → 200 (created session সক্রিয়)', async () => {
    const res = await patch(app, token, `/academic-sessions/${createdId}/activate`, {});
    expect(res.status).toBe(200);
    expect(res.body.data.is_active).toBe(true);
    // activate atomic ভাবে বাকি সব deactivate করে — seeded active session ফিরিয়ে আনি
    // যাতে অন্য suite ভেঙে না যায়।
    await patch(app, token, `/academic-sessions/${createdId}/deactivate`, {});
    await patch(app, token, `/academic-sessions/${SEED.sessions.active}/activate`, {});
  });

  it('PATCH /academic-sessions/{id}/deactivate → 200 (created session নিষ্ক্রিয়)', async () => {
    const res = await patch(app, token, `/academic-sessions/${createdId}/deactivate`, {});
    expect(res.status).toBe(200);
    expect(res.body.data.is_active).toBe(false);
  });

  it('PATCH /academic-sessions/{id}/admission-test → 200 (enable)', async () => {
    const res = await patch(app, token, `/academic-sessions/${createdId}/admission-test`, {
      admission_test_enabled: true,
    });
    expect(res.status).toBe(200);
    expect(res.body.data.admission_test_enabled).toBe(true);
  });

  it('PATCH /admission-test admission_test_enabled ছাড়া → 400', async () => {
    const res = await patch(app, token, `/academic-sessions/${createdId}/admission-test`, {});
    expect(res.status).toBe(400);
  });

  it('DELETE /academic-sessions/{id} → 200 (inactive বলে মুছবে)', async () => {
    // নিশ্চিত করি session নিষ্ক্রিয় (active session মুছা যায় না)
    await patch(app, token, `/academic-sessions/${createdId}/deactivate`, {});
    const res = await del(app, token, `/academic-sessions/${createdId}`);
    expect(res.status).toBe(200);
  });
});
