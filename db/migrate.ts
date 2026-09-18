import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { loadLocalEnv } from "./env";
import { closePool, getPool } from "../lib/db/pool";

async function main() {
  loadLocalEnv();
  const pool = getPool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  const dir = resolve(process.cwd(), "db/migrations");
  const files = readdirSync(dir)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const applied = await pool.query(
      "SELECT 1 FROM schema_migrations WHERE id = $1",
      [file],
    );
    if (applied.rowCount) {
      console.log(`skip ${file}`);
      continue;
    }

    const sql = readFileSync(resolve(dir, file), "utf8");
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query("INSERT INTO schema_migrations (id) VALUES ($1)", [
        file,
      ]);
      await client.query("COMMIT");
      console.log(`applied ${file}`);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}

main()
  .then(async () => {
    await closePool();
  })
  .catch(async (error) => {
    console.error(error);
    await closePool();
    process.exit(1);
  });
