import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as sleep } from "node:timers/promises";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..");
const backendDir = join(repoRoot, "apps/backend");
const composeFile = join(repoRoot, "docker-compose.yml");
const npxCmd = process.platform === "win32" ? "npx.cmd" : "npx";

const { default: killPort } = await import("kill-port");

function runSync(command, args, options = {}) {
  return spawnSync(command, args, {
    stdio: "pipe",
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 10,
    ...options,
  });
}

const portsToFree = [3000, 4000];

for (const port of portsToFree) {
  try {
    await killPort(port);
    console.log(`[predev] Freed port ${port}`);
  } catch (error) {
    const message = typeof error?.message === "string" ? error.message : "";
    if (message.includes("No process") || error?.code === "ESRCH") {
      console.log(`[predev] Port ${port} already free`);
      continue;
    }

    console.warn(`[predev] Could not free port ${port}:`, error);
  }
}

const skipDbBoot = process.env.SKIP_DB_BOOT === "1";
let dockerContainerReady = false;

if (!skipDbBoot && existsSync(composeFile)) {
  console.log("[predev] Ensuring local Postgres is running (docker compose up -d db)...");
  const composeResult = runSync("docker", ["compose", "up", "-d", "db"], { cwd: repoRoot });

  if (composeResult.error && composeResult.error.code === "ENOENT") {
    console.warn("[predev] Docker not found. Skipping automatic database startup.");
  } else if (composeResult.status !== 0) {
    const stderr = composeResult.stderr ?? "";
    if (stderr.trim()) {
      console.warn(stderr.trim());
    }

    if (stderr.includes("already in use")) {
      console.log("[predev] Existing container detected. Attempting to start it...");
      const startResult = runSync("docker", ["start", "splitwise_plus_db"], { cwd: repoRoot });

      if (startResult.error && startResult.error.code === "ENOENT") {
        console.warn("[predev] Docker not found when starting container.");
      } else if (startResult.status === 0) {
        console.log("[predev] Re-used existing splitwise_plus_db container.");
        dockerContainerReady = true;
      } else {
        if (startResult.stderr?.trim()) {
          console.warn(startResult.stderr.trim());
        }
        console.warn("[predev] Could not start existing splitwise_plus_db container.");
      }
    } else {
      console.warn("[predev] docker compose command failed. Start Postgres manually if needed.");
    }
  } else {
    if (composeResult.stdout?.trim()) {
      console.log(composeResult.stdout.trim());
    }
    dockerContainerReady = true;
    console.log("[predev] Local Postgres up (container: splitwise_plus_db).");
  }
} else if (skipDbBoot) {
  console.log("[predev] SKIP_DB_BOOT=1 set. Skipping Docker startup.");
}

async function waitForPostgres() {
  const attempts = 20;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const result = runSync("docker", ["exec", "splitwise_plus_db", "pg_isready", "-U", "postgres"], {
      cwd: repoRoot,
    });

    if (result.error && result.error.code === "ENOENT") {
      console.warn("[predev] Docker not found while waiting for Postgres readiness.");
      return false;
    }

    if (result.status === 0) {
      console.log(`[predev] Postgres is ready (attempt ${attempt}).`);
      return true;
    }

    if (attempt === 1 && result.stderr?.trim()) {
      console.log(`[predev] Waiting for Postgres... (${result.stderr.trim()})`);
    }

    await sleep(1000);
  }

  console.warn("[predev] Postgres did not report ready after waiting. Continuing anyway.");
  return false;
}

function runPrismaStep(label, args) {
  console.log(`[predev] ${label}...`);
  const result = runSync(npxCmd, ["prisma", ...args], {
    cwd: backendDir,
  });

  if (result.error && result.error.code === "ENOENT") {
    console.warn(`[predev] Prisma CLI not found while ${label.toLowerCase()}. Did you run npm install?`);
    return false;
  }

  if (result.status !== 0) {
    if (result.stderr?.trim()) {
      console.warn(result.stderr.trim());
    }
    console.warn(`[predev] ${label} failed. Fix the issue and rerun when ready.`);
    return false;
  }

  if (result.stdout?.trim()) {
    console.log(result.stdout.trim());
  }

  return true;
}

const skipPrismaPrep = process.env.SKIP_PRISMA_PREP === "1";
if (skipPrismaPrep) {
  console.log("[predev] SKIP_PRISMA_PREP=1 set. Skipping Prisma migrate/generate.");
} else {
  if (!skipDbBoot && dockerContainerReady) {
    await waitForPostgres();
  }

  const migrateOk = runPrismaStep("Applying Prisma migrations", ["migrate", "deploy"]);
  if (migrateOk) {
    runPrismaStep("Generating Prisma client", ["generate"]);
  } else {
    console.warn("[predev] Prisma migrations failed; skipping client generation.");
  }
}