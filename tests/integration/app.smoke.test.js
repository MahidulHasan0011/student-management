import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';

// এই টেস্টগুলো DB/Redis ছাড়াই চলে — শুধু এমন path যেখানে কোনো external call হয় না।
describe('app smoke (no DB needed)', () => {
  it('GET /health → 200 ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('GET /api/docs.json → valid OpenAPI spec', async () => {
    const res = await request(app).get('/api/docs.json');
    expect(res.status).toBe(200);
    expect(res.body.openapi).toBe('3.0.3');
    // অন্তত auth path গুলো ডকুমেন্টেড আছে
    expect(Object.keys(res.body.paths)).toContain('/auth/login');
  });

  it('unknown route → 404 envelope', async () => {
    const res = await request(app).get('/no/such/route');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  describe('auth guard (DB hit হওয়ার আগেই থামে)', () => {
    it('garbage login body → 401 (type guard, DB ছোঁয় না)', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({});
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('টোকেন ছাড়া protected route → 401', async () => {
      const res = await request(app).get('/api/v1/students');
      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/token/i);
    });

    it('ভুল টোকেন → 401 invalid token', async () => {
      const res = await request(app)
        .get('/api/v1/students')
        .set('Authorization', 'Bearer garbage.token.here');
      expect(res.status).toBe(401);
    });
  });
});
