import { createWorker } from '../services/queue.service.js';
import { rankingEngine } from '../core/ranking.engine.js';
import { enqueueRollJob } from '../queues/roll.queue.js';

// queue থেকে job আসলে এই processor চলে — আসল calculation core/ranking.engine.js করে
const processor = async (job) => {
  const { classId, academicSessionId, admissionTestEnabled, sectionId, triggeredBy, allowWhenLocked } = job.data;

  console.log(`[ranking.job] processing class=${classId} session=${academicSessionId}`);

  const rankedList = await rankingEngine.buildCombinedRanking({
    classId,
    academicSessionId,
    admissionTestEnabled,
    allowWhenLocked, // RECALCULATE_RANKING flow থেকে আসলে true থাকবে (ধাপ ৬)
  });

  // ranking শেষ — পরের ধাপ roll.queue-তে পাঠাও (sequential chain), lockedBy-ও সাথে যাচ্ছে
  await enqueueRollJob({ rankedList, classId, academicSessionId, sectionId, lockedBy: triggeredBy });

  return { rankedCount: rankedList.length };
};

// "ranking" নামের queue listen করে — server.js বা একটা আলাদা worker process এটা start করবে
export const rankingWorker = createWorker("ranking", processor);
