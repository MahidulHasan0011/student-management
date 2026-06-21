import { createQueue, addJob } from "../services/queue.service.js";

export const rollQueue = createQueue("roll");

// ranking job শেষ হওয়ার পর এটা trigger হয়
// data = { rankedList, classId, academicSessionId, sectionId }
export const enqueueRollJob = (data) => {
  return addJob(rollQueue, "generate-roll", data);
};