const { Pool } = require("pg");
const { DATABASE_URL } = require("./env");

const pool = new Pool({
  connectionString: DATABASE_URL,
   ssl: {
    rejectUnauthorized: false,
  },
});

pool.connect()
  .then(() => console.log("DB Connected Successfully"))
  .catch(err => console.log("DB ERROR:", err));

module.exports = pool;