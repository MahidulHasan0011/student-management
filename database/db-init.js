require("dotenv").config();
const { Client } = require("pg");
const fs = require("fs");
const path = require("path");
const config = require("../config/env");


const runFile = async (client, filename) => {
  const filePath = path.join(__dirname, filename);
  const sql = fs.readFileSync(filePath, "utf8");  // ← utf8 explicitly

// remove all comment also bangla.
  const noComments  = sql
    .split("\n")
    .filter(line => !line.trim().startsWith("--"))
    .join("\n");

// Separate each statement and run it one by one.
    const statements = noComments
        .split(";")
        .map(s => s.trim())
        .filter(s => s.length > 0);

  console.log(`Running ${filename}... (${statements.length} statements)`);

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    try {
      await client.query(stmt);
    } catch (err) {
      console.error(`\nFailed at statement ${i + 1}:`);
      console.error(stmt.substring(0, 150)); // প্রথম ১৫০ char দেখাও
      throw err;
    }
}
console.log(`${filename} done!`);
};

const main = async () => {
  const arg = process.argv[2]; // "schema" | "seed" | "all"

    if (!config.DATABASE_URL) {
    console.error(" DATABASE_URL not found");
    process.exit(1);
  }

  const client = new Client({
    connectionString: config.DATABASE_URL,
    ssl: false,
  });

  try {
    await client.connect();
     // set the encoding immediately after connecting.
    await client.query("SET client_encoding TO 'UTF8'");
    console.log(" Connected to database\n");

    if (arg === "schema" || arg === "all") await runFile(client, "schema.sql");
    if (arg === "seed"   || arg === "all") await runFile(client, "seed.sql");

    console.log("\n Done!");
  } catch (err) {
    console.error("Failed:", err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
};

main();