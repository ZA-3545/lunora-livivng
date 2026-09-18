import { spawn } from "node:child_process";
import { loadLocalEnv } from "../db/env";
import { closePool, getPool } from "../lib/db/pool";

const WAIT_MS = 60_000;
const RETRY_MS = 1_000;
const CONTAINER_NAME = "lunora-postgres";

function isLocalDockerUrl(url: string) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname;
    const port = parsed.port || "5432";
    return (
      (host === "127.0.0.1" || host === "localhost") && port === "5433"
    );
  } catch {
    return false;
  }
}

function resolveCommand(command: string) {
  if (process.platform !== "win32") return command;
  if (command === "npm") return "npm.cmd";
  if (command === "npx") return "npx.cmd";
  return command;
}

function run(command: string, args: string[], inherit = true) {
  return new Promise<{ code: number; stdout: string; stderr: string }>(
    (resolve, reject) => {
      const child = spawn(resolveCommand(command), args, {
        cwd: process.cwd(),
        stdio: inherit ? "inherit" : "pipe",
        shell: false,
      });
      let stdout = "";
      let stderr = "";
      child.stdout?.on("data", (chunk) => {
        stdout += String(chunk);
      });
      child.stderr?.on("data", (chunk) => {
        stderr += String(chunk);
      });
      child.on("error", reject);
      child.on("exit", (code) => {
        resolve({ code: code ?? 1, stdout, stderr });
      });
    },
  );
}

async function containerExists(name: string) {
  const result = await run("docker", ["inspect", "-f", "{{.State.Status}}", name], false);
  return result.code === 0;
}

async function startExistingContainer() {
  if (!(await containerExists(CONTAINER_NAME))) return false;
  console.log(`Starting existing ${CONTAINER_NAME} container...`);
  const started = await run("docker", ["start", CONTAINER_NAME]);
  if (started.code !== 0) return false;
  await run("docker", ["update", "--restart", "unless-stopped", CONTAINER_NAME], false);
  return true;
}

async function canConnect() {
  try {
    const pool = getPool();
    await pool.query("SELECT 1");
    return true;
  } catch {
    return false;
  } finally {
    await closePool();
  }
}

async function waitForDatabase() {
  const started = Date.now();
  let lastError: unknown;

  while (Date.now() - started < WAIT_MS) {
    try {
      const pool = getPool();
      await pool.query("SELECT 1");
      return;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, RETRY_MS));
    }
  }

  throw lastError ?? new Error("Timed out waiting for Postgres");
}

async function needsSeed() {
  const pool = getPool();
  const tables = await pool.query<{ exists: boolean }>(
    `SELECT EXISTS (
       SELECT 1
       FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = 'products'
     ) AS exists`,
  );
  if (!tables.rows[0]?.exists) return true;

  const count = await pool.query<{ count: string }>(
    "SELECT COUNT(*)::text AS count FROM products",
  );
  return Number(count.rows[0]?.count ?? 0) === 0;
}

async function ensureLocalPostgres() {
  if (await canConnect()) {
    console.log("Postgres is already running.");
    return;
  }

  if (await startExistingContainer()) return;

  console.log("Starting local Postgres with Docker Compose...");
  const compose = await run("docker", ["compose", "up", "-d"]);
  if (compose.code === 0) return;

  if (await startExistingContainer()) return;

  throw new Error(
    "Could not start local Postgres. Start Docker Desktop, then run npm run dev again.",
  );
}

async function main() {
  loadLocalEnv();
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }

  if (isLocalDockerUrl(url)) {
    await ensureLocalPostgres();
  }

  await waitForDatabase();
  console.log("Postgres is ready.");

  await closePool();
  const migrate = await run("npm", ["run", "db:migrate"]);
  if (migrate.code !== 0) {
    throw new Error("Database migration failed.");
  }

  loadLocalEnv();
  if (await needsSeed()) {
    await closePool();
    console.log("Catalog is empty; seeding...");
    const seed = await run("npm", ["run", "db:seed"]);
    if (seed.code !== 0) {
      throw new Error("Database seed failed.");
    }
  } else {
    await closePool();
  }
}

main().catch(async (error) => {
  console.error(error instanceof Error ? error.message : error);
  await closePool();
  process.exit(1);
});
