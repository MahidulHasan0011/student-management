import redisClient from '../config/redis.js';

// General cache wrapper — get/set/del with JSON parse/stringify built in
// roleService.getCachedPermissions already uses redisClient directly;
// this service exists so all future modules do the same thing in one consistent way
export const cacheService = {
  async get(key) {
    const value = await redisClient.get(key);
    if (!value) return null;
    try {
      return JSON.parse(value);
    } catch {
      return value; // for a plain string the parse fails, so return the raw value
    }
  },

  async set(key, value, ttlSeconds) {
    const payload = typeof value === 'string' ? value : JSON.stringify(value);
    if (ttlSeconds) {
      await redisClient.setEx(key, ttlSeconds, payload);
    } else {
      await redisClient.set(key, payload);
    }
  },

  async del(key) {
    await redisClient.del(key);
  },

  // Invalidate many keys at once by pattern — e.g. clear the cache for all roles
  // KEYS blocks the whole of Redis (dangerous in production); so we iterate in batches with SCAN and delete
  async delByPattern(pattern) {
    let cursor = 0; // in node-redis v4 the cursor comes as a number, returning to 0 when done
    do {
      const reply = await redisClient.scan(cursor, { MATCH: pattern, COUNT: 100 });
      cursor = reply.cursor;
      if (reply.keys.length) await redisClient.del(reply.keys);
    } while (cursor !== 0);
  },
};
