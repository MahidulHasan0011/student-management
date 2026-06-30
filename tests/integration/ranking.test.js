import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { RUN, SEED, connect, disconnect, get, post } from './_helpers.js';

// CONSERVATIVE: প্রায় সব read-only — shared state নষ্ট করি না।
// generate-roll/recalculate ব্যবহার করি না (class lock করে অন্য suite ভাঙতে পারে)।
// শুধু unlock endpoint টেস্ট করি কারণ এটা idempotent ও state restore করে।
describe.skipIf(!RUN)('Ranking API (integration)', () => {
  let app, token;
  const classId = SEED.classes.c1;
  const sessionId = SEED.sessions.active;

  beforeAll(async () => {
    ({ app, token } = await connect());
  });
  afterAll(async () => {
    await disconnect();
  });

  it('GET /ranking/{classId}/{sessionId} → 200', async () => {
    const res = await get(app, token, `/ranking/${classId}/${sessionId}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    // service array (current ranking) বা cache থেকে ফেরত দেয়
    expect(res.body).toHaveProperty('data');
  });

  it('GET /ranking টোকেন ছাড়া → 401', async () => {
    const res = await get(app, 'invalid-token', `/ranking/${classId}/${sessionId}`);
    expect(res.status).toBe(401);
  });

  it('GET অস্তিত্বহীন class → 404', async () => {
    const res = await get(app, token, `/ranking/00000000-0000-0000-0000-0000000000ff/${sessionId}`);
    expect(res.status).toBe(404);
  });

  it('GET /ranking/{classId}/{sessionId}/history → 200', async () => {
    const res = await get(app, token, `/ranking/${classId}/${sessionId}/history`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('versions');
    expect(res.body.data).toHaveProperty('snapshots');
  });

  it('GET /ranking/{classId}/{sessionId}/audit → 200 array', async () => {
    const res = await get(app, token, `/ranking/${classId}/${sessionId}/audit`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('POST /ranking/unlock → 200 (idempotent, state restore-safe)', async () => {
    const res = await post(app, token, '/ranking/unlock', {
      classId,
      academicSessionId: sessionId,
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('POST /ranking/unlock অস্তিত্বহীন class → 404', async () => {
    const res = await post(app, token, '/ranking/unlock', {
      classId: '00000000-0000-0000-0000-0000000000ff',
      academicSessionId: sessionId,
    });
    expect(res.status).toBe(404);
  });
});
