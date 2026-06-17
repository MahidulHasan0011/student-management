import app from './app.js';
import { env } from './config/env.js';
import pool from './config/db.js';
import './config/redis.js'; // initialize redis connection

const server = app.listen(env.PORT, () => {
  console.log(`\n🚀 Server running on port ${env.PORT} [${env.NODE_ENV}]`);
  console.log(`📍 Health: http://localhost:${env.PORT}/health`);
  console.log(`📍 API:    http://localhost:${env.PORT}/api/v1\n`);
})

// Graceful shutdown
const shutdown = async (signal) => {
 console.log(`\n${signal} received — shutting down gracefully...`);
 server.close( async () => {
    await pool.end();
    console.log("DB pool closed. Bye!");
    process.exit(0);
 });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Unhandled rejections
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection at:', reason);
   shutdown('UNHANDLED_REJECTION');
});
