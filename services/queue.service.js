import { Queue, Worker } from 'bullmq';
import { env } from '../config/env.js';

// BullMQ-র জন্য Redis connection config — redisClient (ioredis নয়, node-redis) আলাদা,
// BullMQ নিজে connection বানায় এই options দিয়ে

const connection = {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD || undefined,
};
// queue তৈরি করার জন্য একটাই জায়গা — queues/*.js এটা ব্যবহার করবে
export const createQueue = (name) => {
  return new Queue(name, { connection });
};

// worker তৈরি করার জন্য একটাই জায়গা — jobs/*.js এটা ব্যবহার করবে
// processor = (job) => {...} — job.data নিয়ে আসল কাজ করে
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

// একটা job queue-তে পাঠানোর সাধারণ helper
export const addJob = async (queue, jobName, data, opts = {}) => {
  return queue.add(jobName, data, {
    attempts: 3, // ব্যর্থ হলে 3 বার retry করবে
    backoff: { type: 'exponential', delay: 2000 }, // retry করার আগে অপেক্ষা করবে (2s, 4s, 8s)
    removeOnComplete: 500, // সফল হলে job 5000ms পরে queue থেকে মুছে ফেলবে
    ...opts,
  });
};
