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
  const migrationsDir = path.resolve(here, "../db/migrations");
  const migrationFiles = (await fs.readdir(migrationsDir))
    .filter((name) => name.endsWith(".sql"))
    .sort((a, b) => a.localeCompare(b, "en"));
  const client = new Client({ connectionString: conn });
  await client.connect();
  try {
    for (const file of migrationFiles) {
      const migrationPath = path.join(migrationsDir, file);
      const sql = await fs.readFile(migrationPath, "utf8");
      await client.query(sql);
      console.log("Applied pals migration:", migrationPath);
    }
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
