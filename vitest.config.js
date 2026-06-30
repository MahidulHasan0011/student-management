import { defineConfig } from 'vitest/config';
import { config as loadEnv } from 'dotenv';

// config লোড হওয়ার সময় (Node context) .env পড়ে নিই — এই মানগুলো নিচে test.env-এ
// inject হয়, ফলে টেস্ট ফাইলের টপ-লেভেল কোডেও (যেমন process.env.TEST_INTEGRATION)
// পাওয়া যায়। named import — default-interop undefined সমস্যা এড়াতে (single-file run-এও স্থিতিশীল)।
const fileEnv = (loadEnv?.() || {}).parsed || {};

export default defineConfig({
  test: {
    // describe/it/expect গ্লোবাল — import ছাড়াই ব্যবহার করা যাবে
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.js'],
    // app import করলে db pool connect চেষ্টা করে; DB না থাকলে hang এড়াতে fork pool
    pool: 'forks',
    // concurrency সীমিত — Postgres connection limit (hosted-এ প্রায়ই ১৫) যেন না ছাড়ায়।
    // সর্বোচ্চ সংযোগ ≈ maxWorkers × DB_POOL_MAX = 2 × 4 = 8
    maxWorkers: 2,
    minWorkers: 1,
    testTimeout: 20000,
    env: {
      // .env-এর সব মান (TEST_INTEGRATION, TEST_ADMIN_*, DATABASE_URL, REDIS_* ...)
      ...fileEnv,
      // টেস্টের জন্য জোর করে predictable মান — .env-এর উপরে অগ্রাধিকার পায়
      NODE_ENV: 'test',
      JWT_ACCESS_SECRET: 'test_access_secret',
      JWT_REFRESH_SECRET: 'test_refresh_secret',
      DB_POOL_MAX: '4', // টেস্টে ছোট pool — parallel worker × pool যেন connection limit না ছাড়ায়
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.js'],
      exclude: ['src/server.js', 'src/jobs/**', 'src/queues/**'],
    },
  },
});
