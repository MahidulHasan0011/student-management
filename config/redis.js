const { createClient } = require("redis");
const { env } = require("./env");

const redisClient = createClient({
    socket: {
     host: env.REDIS_HOST,
     port: env.REDIS_PORT,
    },
    password: env.REDIS_PASSWORD || undefined,
});

redisClient.on("error", (err) => console.error("Redis error:", err));
redisClient.on("connect", () => console.log("✅ Redis Connected"));

// connect() async — server.js- do await 
const connectRedis = () => redisClient.connect();

const TTL = {
  ACCESS_TOKEN:   60 * 15,           // 15 min
  REFRESH_TOKEN:  60 * 60 * 24 * 7,  // 7 days
  PERMISSIONS:    60 * 60,           // 1 hour
};
module.exports = { redisClient, connectRedis, TTL };