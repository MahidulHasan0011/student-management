import { Queue, Worker } from 'bullmq';
import { env } from '../config/env.js';

// Redis connection config for BullMQ — separate from redisClient (which is node-redis, not ioredis);
// BullMQ builds its own connection from these options

const connection = {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD || undefined,
};

// ── Retry backoff tuning (env-configurable, tune in prod without touching code) ──
const BACKOFF_BASE_MS = env.QUEUE_BACKOFF_BASE_MS; // first retry ~2s
const BACKOFF_CAP_MS = env.QUEUE_BACKOFF_CAP_MS; // never wait longer than this between retries

// Exponential backoff WITH "equal jitter" (AWS recipe).
// Plain exponential retries every failed job at the exact same instant (2s, 4s, 8s...),
// so a burst of failures keeps retrying in synchronized waves — a "thundering herd" that
// re-hammers a recovering DB/Redis. Jitter spreads the retries randomly across the window.
//
// equal jitter: half the delay is fixed (guaranteed breathing room) + half is random spread.
//   attemptsMade starts at 1 on the first failure.
const jitteredBackoff = (attemptsMade) => {
  const exp = Math.min(BACKOFF_CAP_MS, BACKOFF_BASE_MS * 2 ** (attemptsMade - 1));
  const half = exp / 2;
  return Math.round(half + Math.random() * half);
};

// Single place for creating a queue — used by queues/*.js
export const createQueue = (name) => {
  return new Queue(name, { connection });
};

// Single place for creating a worker — used by jobs/*.js
// processor = (job) => {...} — does the actual work using job.data
// settings.backoffStrategy registers the custom strategy referenced by addJob's
// backoff: { type: 'custom' }. It must live on the worker (the worker computes the delay).
export const createWorker = (name, processor, options = {}) => {
  const { settings, ...rest } = options;
  const worker = new Worker(name, processor, {
    connection,
    settings: {
      backoffStrategy: (attemptsMade) => jitteredBackoff(attemptsMade),
      ...settings,
    },
    ...rest,
  });
  worker.on('completed', (job) => {
    console.log(`[${name}] job ${job.id} completed`);
  });
  worker.on('failed', (job, err) => {
    console.error(`[${name}] job ${job.id} failed:`, err);
  });
  return worker;
};

// General helper to send a job to a queue
export const addJob = async (queue, jobName, data, opts = {}) => {
  return queue.add(jobName, data, {
    attempts: 3, // retry 3 times on failure
    // 'custom' → runs the backoffStrategy registered on the worker (exponential + jitter)
    backoff: { type: 'custom' },
    removeOnComplete: 500, // keep the last 500 completed jobs, remove older ones from the queue
    ...opts,
  });
};
