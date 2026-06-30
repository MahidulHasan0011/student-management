import { defineConfig } from 'vitest/config';
import dotenv from 'dotenv';

// config লোড হওয়ার সময় (Node context) .env পড়ে নিই — এই মানগুলো নিচে test.env-এ
// inject হয়, ফলে টেস্ট ফাইলের টপ-লেভেল কোডেও (যেমন process.env.TEST_INTEGRATION)
// পাওয়া যায়। worker-এ dotenv import করার চেয়ে এটা নির্ভরযোগ্য।
const fileEnv = dotenv.config().parsed || {};

export default defineConfig({
  test: {
    // describe/it/expect গ্লোবাল — import ছাড়াই ব্যবহার করা যাবে
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.js'],
    // app import করলে db pool connect চেষ্টা করে; DB না থাকলে hang এড়াতে fork pool
    pool: 'forks',
    testTimeout: 15000,
    env: {
      // .env-এর সব মান (TEST_INTEGRATION, TEST_ADMIN_*, DATABASE_URL, REDIS_* ...)
      ...fileEnv,
      // টেস্টের জন্য জোর করে predictable মান — .env-এর উপরে অগ্রাধিকার পায়
      NODE_ENV: 'test',
      JWT_ACCESS_SECRET: 'test_access_secret',
      JWT_REFRESH_SECRET: 'test_refresh_secret',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.js'],
      exclude: ['src/server.js', 'src/jobs/**', 'src/queues/**'],
    },
  },
});
