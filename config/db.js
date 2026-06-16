const { Pool } = require("pg");
const { env } = require("./env");

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: env.NODE_ENV === "production"
    ? { rejectUnauthorized: false }
    : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// client.release() — connection leak without test
pool.connect()
  .then((client) => {
    console.log(" DB Connected Successfully");
    client.release();
  })
  .catch((err) => console.error(" DB ERROR:", err));

pool.on("error", (err) => {
  console.error("Unexpected DB pool error:", err);
});

// use this query andwithTransaction for all repository
const query = (text, params) => pool.query(text, params);

const withTransaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

module.exports = { query, withTransaction, pool };