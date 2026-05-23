const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
   ssl: {
    rejectUnauthorized: false,
  },
});

pool.connect()
  .then(() => console.log("✅ DB Connected Successfully"))
  .catch(err => console.log("❌ DB ERROR:", err));

module.exports = pool;