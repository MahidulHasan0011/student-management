import dotenv from 'dotenv';
dotenv.config();

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT, 10) || 4000,
  DATABASE_URL: process.env.DATABASE_URL || '',
  // JWT
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'access_secret_change_in_prod',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'refresh_secret_change_in_prod',
  JWT_ACCESS_EXPIRES: process.env.JWT_ACCESS_EXPIRES || '15m',
  JWT_REFRESH_EXPIRES: process.env.JWT_REFRESH_EXPIRES || '7d',
  //  REDIS
  REDIS_HOST: process.env.REDIS_HOST || 'localhost',
  REDIS_PORT: parseInt(process.env.REDIS_PORT) || 6379,
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || '',
  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS) || 12,

  // ── Object storage (S3-compatible: AWS S3 বা Cloudflare R2) ──────────────
  // R2 ব্যবহার করলে STORAGE_ENDPOINT = https://<account_id>.r2.cloudflarestorage.com
  // আর STORAGE_REGION = 'auto' দিন। খাঁটি AWS S3 হলে STORAGE_ENDPOINT খালি রাখুন।
  STORAGE_PROVIDER: process.env.STORAGE_PROVIDER || 's3', // 's3' | 'r2' (শুধু লগ/ডকুমেন্টেশনের জন্য)
  STORAGE_ENDPOINT: process.env.STORAGE_ENDPOINT || '', // R2/MinIO-র custom endpoint; AWS হলে খালি
  STORAGE_REGION: process.env.STORAGE_REGION || 'us-east-1',
  STORAGE_BUCKET: process.env.STORAGE_BUCKET || '',
  STORAGE_ACCESS_KEY: process.env.STORAGE_ACCESS_KEY || '',
  STORAGE_SECRET_KEY: process.env.STORAGE_SECRET_KEY || '',
  // presigned PUT/GET URL কত সেকেন্ড বৈধ থাকবে
  STORAGE_UPLOAD_URL_TTL: parseInt(process.env.STORAGE_UPLOAD_URL_TTL) || 300, // 5 min
  STORAGE_DOWNLOAD_URL_TTL: parseInt(process.env.STORAGE_DOWNLOAD_URL_TTL) || 300, // 5 min
  // path-style দরকার হলে (MinIO/কিছু R2 সেটআপ) true; AWS virtual-hosted হলে false
  STORAGE_FORCE_PATH_STYLE: process.env.STORAGE_FORCE_PATH_STYLE === 'true',
};
