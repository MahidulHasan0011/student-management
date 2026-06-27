import redisClient from '../config/redis.js';

// সাধারণ cache wrapper — get/set/del-এর সাথে JSON parse/stringify built-in
// roleService.getCachedPermissions ইতিমধ্যে redisClient সরাসরি ব্যবহার করে;
// এই service ভবিষ্যতের সব module-এর জন্য একই কাজ একভাবে করার জন্য
export const cacheService = {
  async get(key) {
    const value = await redisClient.get(key);
    if (!value) return null;
    try {
      return JSON.parse(value);
    } catch {
      return value; // plain string হলে parse fail করবে, raw value-ই ফেরত দাও
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

  // pattern দিয়ে একসাথে অনেক key invalidate করতে — যেমন সব role-এর cache clear
  // KEYS পুরো Redis block করে দেয় (production-এ বিপজ্জনক); তাই SCAN দিয়ে batch-এ ঘুরে delete করি
  async delByPattern(pattern) {
    let cursor = 0; // node-redis v4 cursor সংখ্যা হিসেবে আসে, শেষ হলে 0-তে ফিরে আসে
    do {
      const reply = await redisClient.scan(cursor, { MATCH: pattern, COUNT: 100 });
      cursor = reply.cursor;
      if (reply.keys.length) await redisClient.del(reply.keys);
    } while (cursor !== 0);
  },
};
