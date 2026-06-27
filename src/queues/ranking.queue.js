import { createQueue, addJob } from '../services/queue.service.js';

export const rankingQueue = createQueue('ranking');
// controller/service থেকে এটা কল করে ranking job schedule করে
// data = { classId, academicSessionId, admissionTestEnabled, ... }
// jobId deterministic — একই class+session-এর duplicate job (double-click / duplicate event) থেকে রক্ষা।
// BullMQ একই jobId-র দ্বিতীয় job চুপচাপ ফেলে দেয় (queue-তে থাকা অবস্থায়)।
// allowWhenLocked (recalc flow) আলাদা jobId পায়, যাতে normal trigger-এর সাথে collide না করে।
export const enqueueRankingJob = (data) => {
  const suffix = data.allowWhenLocked ? 'recalc' : 'auto';
  const jobId = `ranking:${data.classId}:${data.academicSessionId}:${suffix}`;
  return addJob(rankingQueue, 'calculate-ranking', data, { jobId });
};
