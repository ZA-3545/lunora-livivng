import { Pool } from "pg";

let pool: Pool | null = null;

function needsSsl(url: string) {
  return /neon\.tech|supabase\.co|pooler\.supabase|railway\.app|sslmode=require/i.test(
    url,
  );
}

export function getPool() {
  if (pool) return pool;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  pool = new Pool({
    connectionString: url,
    ssl: needsSsl(url) ? { rejectUnauthorized: false } : undefined,
    max: 10,
  });
  return pool;
}

export async function closePool() {
  if (!pool) return;
  await pool.end();
  pool = null;
}
