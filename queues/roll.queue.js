const { Queue } = require("bullmq");
const redis = require("../config/redis");

const rollQueue = new Queue("roll-queue", {
  connection: redis
});

module.exports = rollQueue;