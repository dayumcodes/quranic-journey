import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const { Client } = pg;

async function main() {
  const conn = process.env.DATABASE_URL?.trim();
  if (!conn) {
    throw new Error("Missing DATABASE_URL");
  }
  const here = path.dirname(fileURLToPath(import.meta.url));
  const migrationPath = path.resolve(here, "../db/migrations/001_create_pal_links.sql");
  const sql = await fs.readFile(migrationPath, "utf8");
  const client = new Client({ connectionString: conn });
  await client.connect();
  try {
    await client.query(sql);
    console.log("Applied pals migration:", migrationPath);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
