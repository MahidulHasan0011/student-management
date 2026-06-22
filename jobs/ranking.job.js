import { createWorker } from "../services/queue.service.js";
import { rankingEngine } from "../core/ranking.engine.js";
import { enqueueRollJob } from "../queues/roll.queue.js";

// queue থেকে job আসলে এই processor চলে — আসল calculation core/ranking.engine.js করে
const processor = async (job) => {
    const { examId, classId, academicSessionId, admissionTestEnabled, sectionId } = job.data;
    console.log(`[ranking.job] processing exam=${examId} class=${classId}`);
    const rankedList = await rankingEngine.buildCombinedRanking({
        examId,
        classId,
        academicSessionId,
        admissionTestEnabled,
    });

    // ranking শেষ — পরের ধাপ roll.queue-তে পাঠাও (sequential chain)
    await enqueueRollJob({ rankedList, classId, academicSessionId, sectionId });
    return { rankedCount: rankedList.length };
};

export const rankingWorker = createWorker("ranking", processor);