import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';

// ── DB + Redis লাগে এমন পূর্ণ ফ্লো টেস্ট ──
// ডিফল্টভাবে skip — কারণ live Postgres + Redis + seed ডেটা লাগে।
// চালাতে:  TEST_INTEGRATION=1 npm test
// আগে নিশ্চিত করুন:  npm run db:fresh  (seed করা admin ইউজার থাকতে হবে)
const RUN = process.env.TEST_INTEGRATION === '1';

// seed.sql-এ থাকা super_admin/admin ক্রেডেনশিয়াল এখানে দিন (env দিয়ে override করা যায়)
const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || 'admin@school.com';
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || 'Password@123'; // seed.sql ডিফল্ট

describe.skipIf(!RUN)('auth flow (DB + Redis)', () => {
  let app;
  let accessToken;
  let refreshToken;

  beforeAll(async () => {
    const redis = (await import('../../src/config/redis.js')).default;
    if (!redis.isOpen) await redis.connect();
    app = (await import('../../src/app.js')).default;
  });

  afterAll(async () => {
    const redis = (await import('../../src/config/redis.js')).default;
    if (redis.isOpen) await redis.quit();
    const pool = (await import('../../src/config/db.js')).default;
    await pool.end();
  });

  it('login → accessToken + refreshToken', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeTruthy();
    expect(res.body.data.refreshToken).toBeTruthy();
    accessToken = res.body.data.accessToken;
    refreshToken = res.body.data.refreshToken;
  });

  it('GET /auth/me টোকেন দিয়ে কাজ করে', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe(ADMIN_EMAIL.toLowerCase());
  });

  it('refresh → নতুন টোকেন জোড়া', async () => {
    const res = await request(app).post('/api/v1/auth/refresh').send({ refreshToken });
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeTruthy();
  });

  it('ভুল পাসওয়ার্ড → 401', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: ADMIN_EMAIL, password: 'wrong-password' });
    expect(res.status).toBe(401);
  });
});
