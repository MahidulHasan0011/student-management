import { createWorker } from "../services/queue.service.js";
import { rollEngine } from "../core/roll.engine.js";

// ranking.job.js এই queue-তে job পাঠায় (rankedList সহ) — এখানে আসল roll_number বসানো হয়
const processor = async (job) => {
  const { rankedList, classId, academicSessionId, sectionId } = job.data;

  console.log(`[roll.job] assigning rolls for class=${classId} session=${academicSessionId}`);

  const results = await rollEngine.generateRolls({
    rankedList,
    classId,
    academicSessionId,
    sectionId,
  });

  return { assignedCount: results.length };
};

// "roll" নামের queue listen করে
export const rollWorker = createWorker("roll", processor);