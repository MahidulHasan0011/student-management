import dotenv from "dotenv";
dotenv.config();

import { Client } from "pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { env } from "../src/config/env.js";

// ESM-এ __dirname নেই — এভাবে বানাতে হয়
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const runFile = async (client, filename) => {
  const filePath = path.join(__dirname, filename);
  const sql = fs.readFileSync(filePath, "utf8"); // ← utf8 explicitly

  // remove all comment also bangla.
  const noComments = sql
    .split("\n")
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n");

  // Separate each statement and run it one by one.
  const statements = noComments
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

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

// Execute each .sql file in the views/ folder sequentially.
const runViewsFolder = async (client) => {
  const viewsDir = path.join(__dirname, "views");
  if (!fs.existsSync(viewsDir)) {
    console.log("does not exist views/ folder, skipping...");
    return;
  }

  const files = fs.readdirSync(viewsDir).filter((f) => f.endsWith(".sql"));
  console.log(`Running views/ (${files.length} files)...`);

  for (const file of files) {
    const sql = fs.readFileSync(path.join(viewsDir, file), "utf8");
    const noComments = sql
      .split("\n")
      .filter((line) => !line.trim().startsWith("--"))
      .join("\n");
    const statements = noComments
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const stmt of statements) {
      try {
        await client.query(stmt);
      } catch (err) {
        console.error(`\nFailed in ${file}:`);
        console.error(stmt.substring(0, 150));
        throw err;
      }
    }
    console.log(`  ✓ ${file}`);
  }
  console.log("views done!");
};

const main = async () => {
  const arg = process.argv[2]; // "schema" | "seed" | "all"

  if (!env.DATABASE_URL) {
    console.error("DATABASE_URL not found");
    process.exit(1);
  }

  const client = new Client({
    connectionString: env.DATABASE_URL,
    ssl: env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
  });

  try {
    await client.connect();
    // set the encoding immediately after connecting.
    await client.query("SET client_encoding TO 'UTF8'");
    console.log("Connected to database\n");

    if (arg === "schema" || arg === "all") await runFile(client, "schema.sql");
    if (arg === "views" || arg === "all") await runViewsFolder(client);
    if (arg === "seed" || arg === "all") await runFile(client, "seed.sql");

    if (!arg) {
      console.log('Usage: node db-init.js <schema|views|seed|all>');
    }

    console.log("\nDone!");
  } catch (err) {
    console.error("Failed:", err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
};

main();