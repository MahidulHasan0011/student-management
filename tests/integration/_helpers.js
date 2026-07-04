// ─────────────────────────────────────────────────────────────────────────
// Integration test helpers — used by every module-test file.
//
// Prerequisites to run (otherwise all suites are skipped):
//   1. Postgres + Redis running
//   2. npm run db:fresh  (seeded — the SEED.* UUIDs below come from here)
//   3. TEST_INTEGRATION=1 npm run test:integration
//
// Each test file runs in a separate worker process (vitest forks), so app/redis/pool
// are per-file singletons — connect() in beforeAll, disconnect() in afterAll.
// ─────────────────────────────────────────────────────────────────────────
import request from 'supertest';

export const RUN = process.env.TEST_INTEGRATION === '1';

export const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || 'admin@school.com';
export const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || 'Password@123';

export const API = '/api/v1';

// fixed UUIDs from seed.sql — guaranteed to exist after db:fresh
export const SEED = {
  roles: {
    superAdmin: '00000000-0000-0000-0000-000000000001',
    admin: '00000000-0000-0000-0000-000000000002',
    teacher: '00000000-0000-0000-0000-000000000003',
    student: '00000000-0000-0000-0000-000000000004',
    accountant: '00000000-0000-0000-0000-000000000005',
    staff: '00000000-0000-0000-0000-000000000006',
  },
  users: {
    superadmin: 'a0000000-0000-0000-0000-000000000001',
    admin: 'a0000000-0000-0000-0000-000000000002',
    teacher1: 'a0000000-0000-0000-0000-000000000003',
    accountant: 'a0000000-0000-0000-0000-000000000009',
    student1: 'a0000000-0000-0000-0000-000000000010',
  },
  teachers: {
    t1: 'b0000000-0000-0000-0000-000000000001',
    t2: 'b0000000-0000-0000-0000-000000000002',
  },
  students: {
    s1: 'c0000000-0000-0000-0000-000000000001',
    s2: 'c0000000-0000-0000-0000-000000000002',
    s10: 'c0000000-0000-0000-0000-000000000010',
  },
  classes: {
    c1: 'd0000000-0000-0000-0000-000000000001',
    c2: 'd0000000-0000-0000-0000-000000000002',
    c5: 'd0000000-0000-0000-0000-000000000005',
  },
  sections: {
    c1a: 'e0000000-0000-0000-0000-000000000001',
    c1b: 'e0000000-0000-0000-0000-000000000002',
  },
  sessions: {
    s2324: 'f0000000-0000-0000-0000-000000000001',
    s2425: 'f0000000-0000-0000-0000-000000000002',
    active: 'f0000000-0000-0000-0000-000000000003', // 2025-2026, is_active=true
  },
  subjects: {
    bangla: '20000000-0000-0000-0000-000000000001',
    english: '20000000-0000-0000-0000-000000000002',
    math: '20000000-0000-0000-0000-000000000003',
    science: '20000000-0000-0000-0000-000000000004',
    religion: '20000000-0000-0000-0000-000000000007',
  },
  assignments: {
    a1: '30000000-0000-0000-0000-000000000001',
  },
  enrollments: {
    e1: '40000000-0000-0000-0000-000000000001',
  },
  exams: {
    admission: '50000000-0000-0000-0000-000000000001',
    unit1: '50000000-0000-0000-0000-000000000002',
    midterm1: '50000000-0000-0000-0000-000000000003',
    annual: '50000000-0000-0000-0000-000000000007',
  },
};

// generates unique names/codes/emails within tests — to avoid duplicate/unique-constraint errors
let _seq = 0;
export const uniq = (prefix = 'T') => `${prefix}_${Date.now().toString(36)}_${_seq++}`;

// fetches app + admin token; connects redis. Call this in beforeAll.
export async function connect() {
  const redis = (await import('../../src/config/redis.js')).default;
  if (!redis.isOpen) await redis.connect();
  const app = (await import('../../src/app.js')).default;

  const res = await request(app)
    .post(`${API}/auth/login`)
    .send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });

  const token = res.body?.data?.accessToken;
  if (!token) {
    throw new Error(
      `Admin login failed (status ${res.status}). Did you run db:fresh? credentials: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`,
    );
  }
  return { app, token, redis };
}

// closes redis + db pool — call this in afterAll (so the worker exits cleanly).
export async function disconnect() {
  try {
    const redis = (await import('../../src/config/redis.js')).default;
    if (redis.isOpen) await redis.quit();
  } catch {
    /* ignore */
  }
  try {
    const pool = (await import('../../src/config/db.js')).default;
    await pool.end();
  } catch {
    /* ignore */
  }
}

// supertest helper — sets the Bearer header.  await get(app, token, '/students')
export const get = (app, token, path) =>
  request(app).get(`${API}${path}`).set('Authorization', `Bearer ${token}`);
export const post = (app, token, path, body) =>
  request(app).post(`${API}${path}`).set('Authorization', `Bearer ${token}`).send(body);
export const patch = (app, token, path, body) =>
  request(app).patch(`${API}${path}`).set('Authorization', `Bearer ${token}`).send(body);
export const put = (app, token, path, body) =>
  request(app).put(`${API}${path}`).set('Authorization', `Bearer ${token}`).send(body);
export const del = (app, token, path) =>
  request(app).delete(`${API}${path}`).set('Authorization', `Bearer ${token}`);
