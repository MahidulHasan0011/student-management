const Redis = require("ioredis");

const redis = new Redis(process.env.REDIS_URL);
// need to genearate REDIS_URL in .env file like this:

module.exports = redis;