require("dotenv").config();

module.exports = {
  PORT: process.env.PORT || 4001,
  JWT_SECRET: process.env.JWT_SECRET,
  DATABASE_URL: process.env.DATABASE_URL,
};