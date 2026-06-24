import { createClient } from 'redis';
import { env } from './env.js';

const redisClient = createClient({
  socket: {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
  },
  password: env.REDIS_PASSWORD || undefined,
});

redisClient.on('error', (err) => console.error('Redis error:', err));
redisClient.on('connect', () => console.log('Redis Connected'));

export const TTL = {
  ACCESS_TOKEN: 60 * 15,
  REFRESH_TOKEN: 60 * 60 * 24 * 7,
  PERMISSIONS: 60 * 60,
};

export default redisClient;
