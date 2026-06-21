import { createQueue, addJob } from "../services/queue.service.js";

export const rankingQueue = createQueue("ranking");

// controller/service থেকে এটা কল করে ranking job schedule করে
// data = { examId, classId, academicSessionId, admissionTestEnabled }
export const enqueueRankingJob = (data) => {
    return addJob(rankingQueue, "calculate-ranking", data)
};