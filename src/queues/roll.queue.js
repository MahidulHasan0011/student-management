import { createQueue, addJob } from '../services/queue.service.js';

export const rollQueue = createQueue('roll');

// Triggered after the ranking job finishes
// data = { rankedList, classId, academicSessionId, sectionId }
export const enqueueRollJob = (data) => {
  return addJob(rollQueue, 'generate-roll', data);
};
