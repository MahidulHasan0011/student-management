import { createWorker } from '../services/queue.service.js';
import { rollEngine } from '../core/roll.engine.js';
import { cacheService } from '../services/cache.service.js';

// ranking.job.js এই queue-তে job পাঠায় (rankedList সহ) — এখানে আসল roll_number বসানো হয়,
// history সংরক্ষণ হয় এবং ranking lock হয় (সব roll.engine একটাই transaction-এ করে)
const processor = async (job) => {
  const { rankedList, classId, academicSessionId, sectionId, lockedBy } = job.data;

  console.log(`[roll.job] assigning rolls for class=${classId} session=${academicSessionId}`);

  const { results, version } = await rollEngine.generateRolls({
    rankedList,
    classId,
    academicSessionId,
    sectionId,
    lockedBy,
  });

  // নতুন snapshot তৈরি হয়েছে → stale current-ranking cache সরিয়ে দাও
  await cacheService.del(`ranking:current:${classId}:${academicSessionId}`);

  return { assignedCount: results.length, version };
};

// "roll" নামের queue listen করে
export const rollWorker = createWorker('roll', processor);
