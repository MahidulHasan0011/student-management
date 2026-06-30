import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { RUN, SEED, uniq, connect, disconnect, get, post, patch, del } from './_helpers.js';

describe.skipIf(!RUN)('Classes API (integration)', () => {
  let app, token;
  let createdId; // lifecycle জুড়ে তৈরি করা class-এর id

  beforeAll(async () => {
    ({ app, token } = await connect());
  });
  afterAll(async () => {
    await disconnect();
  });

  it('GET /classes → 200 + paginated list', async () => {
    const res = await get(app, token, '/classes');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta).toHaveProperty('total');
  });

  it('GET /classes টোকেন ছাড়া → 401', async () => {
    const res = await get(app, 'invalid-token', '/classes');
    expect(res.status).toBe(401);
  });

  it('POST /classes → 201 নতুন class তৈরি', async () => {
    const res = await post(app, token, '/classes', { name: uniq('Class') });
    expect([200, 201]).toContain(res.status);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
    createdId = res.body.data.id;
  });

  it('POST /classes ডুপ্লিকেট name → 409', async () => {
    const name = uniq('Class');
    await post(app, token, '/classes', { name });
    const res = await post(app, token, '/classes', { name });
    expect(res.status).toBe(409);
  });

  it('POST /classes অসম্পূর্ণ body → 400', async () => {
    const res = await post(app, token, '/classes', {});
    expect(res.status).toBe(400);
  });

  it('GET /classes/{id} → 200 সদ্য তৈরি class', async () => {
    expect(createdId).toBeTruthy();
    const res = await get(app, token, `/classes/${createdId}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(createdId);
  });

  it('GET /classes/{id}/sections → 200 array', async () => {
    const res = await get(app, token, `/classes/${SEED.classes.c1}/sections`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.sections)).toBe(true);
  });

  it('PATCH /classes/{id} → 200 আপডেট', async () => {
    const newName = uniq('Class');
    const res = await patch(app, token, `/classes/${createdId}`, { name: newName });
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe(newName);
  });

  it('GET অস্তিত্বহীন id → 404', async () => {
    const res = await get(app, token, '/classes/00000000-0000-0000-0000-0000000000ff');
    expect(res.status).toBe(404);
  });

  it('DELETE /classes/{id} → 200 (section নেই বলে মুছবে)', async () => {
    const res = await del(app, token, `/classes/${createdId}`);
    expect(res.status).toBe(200);
  });
});
