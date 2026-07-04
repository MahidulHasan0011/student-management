import { Queue, Worker } from 'bullmq';
import { env } from '../config/env.js';

// Redis connection config for BullMQ — separate from redisClient (which is node-redis, not ioredis);
// BullMQ builds its own connection from these options

const connection = {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD || undefined,
};
// Single place for creating a queue — used by queues/*.js
export const createQueue = (name) => {
  return new Queue(name, { connection });
};

// Single place for creating a worker — used by jobs/*.js
// processor = (job) => {...} — does the actual work using job.data
export const createWorker = (name, processor, options = {}) => {
  const worker = new Worker(name, processor, { connection, ...options });
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
    backoff: { type: 'exponential', delay: 2000 }, // wait before retrying (2s, 4s, 8s)
    removeOnComplete: 500, // keep the last 500 completed jobs, remove older ones from the queue
    ...opts,
  });
};
