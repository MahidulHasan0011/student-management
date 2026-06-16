require("dotenv").config();

module.exports = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT, 10) || 4000,
  DATABASE_URL: process.env.DATABASE_URL || "",
  // JWT
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || "access_secret_change_in_prod",
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || "refresh_secret_change_in_prod",
  JWT_ACCESS_EXPIRES: process.env.JWT_ACCESS_EXPIRES || "15m",
  JWT_REFRESH_EXPIRES: process.env.JWT_REFRESH_EXPIRES || "7d",

  //  REDIS
  REDIS_HOST: process.env.REDIS_HOST || "localhost",
  REDIS_PORT: parseInt(process.env.REDIS_PORT) || 6379,
// REDIS_PASSWORD: process.env.REDIS_PASSWORD || "",


  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS) || 12,
};