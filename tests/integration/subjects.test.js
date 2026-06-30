import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { RUN, uniq, connect, disconnect, get, post, patch, del } from './_helpers.js';

describe.skipIf(!RUN)('Subjects API (integration)', () => {
  let app, token;
  let createdId; // lifecycle জুড়ে তৈরি করা subject-এর id

  beforeAll(async () => {
    ({ app, token } = await connect());
  });
  afterAll(async () => {
    await disconnect();
  });

  it('GET /subjects → 200 + paginated list', async () => {
    const res = await get(app, token, '/subjects');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta).toHaveProperty('total');
  });

  it('GET /subjects টোকেন ছাড়া → 401', async () => {
    const res = await get(app, 'invalid-token', '/subjects');
    expect(res.status).toBe(401);
  });

  it('POST /subjects → 201 নতুন subject তৈরি', async () => {
    const res = await post(app, token, '/subjects', {
      name: uniq('Subject'),
      code: uniq('SC'),
    });
    expect([200, 201]).toContain(res.status);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
    createdId = res.body.data.id;
  });

  it('POST /subjects ডুপ্লিকেট code → 409', async () => {
    const code = uniq('SC');
    await post(app, token, '/subjects', { name: uniq('Subject'), code });
    const res = await post(app, token, '/subjects', { name: uniq('Subject'), code });
    expect(res.status).toBe(409);
  });

  it('POST /subjects অসম্পূর্ণ body → 400', async () => {
    const res = await post(app, token, '/subjects', { code: uniq('SC') });
    expect(res.status).toBe(400);
  });

  it('GET /subjects/{id} → 200 সদ্য তৈরি subject', async () => {
    expect(createdId).toBeTruthy();
    const res = await get(app, token, `/subjects/${createdId}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(createdId);
  });

  it('PATCH /subjects/{id} → 200 আপডেট', async () => {
    const newName = uniq('Subject');
    const res = await patch(app, token, `/subjects/${createdId}`, { name: newName });
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe(newName);
  });

  it('GET অস্তিত্বহীন id → 404', async () => {
    const res = await get(app, token, '/subjects/00000000-0000-0000-0000-0000000000ff');
    expect(res.status).toBe(404);
  });

  it('DELETE /subjects/{id} → 200 (unassigned বলে মুছবে)', async () => {
    const res = await del(app, token, `/subjects/${createdId}`);
    expect(res.status).toBe(200);
  });
});
