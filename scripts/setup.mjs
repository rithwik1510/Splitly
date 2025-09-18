import { existsSync, copyFileSync } from "node:fs";
import { mkdir, readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..");

async function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: repoRoot,
      stdio: "inherit",
      shell: process.platform === "win32",
      ...options,
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve(code);
      } else {
        reject(new Error(`${command} ${args.join(" ")} exited with code ${code}`));
      }
    });
  });
}

async function ensureFile(examplePath, targetPath) {
  if (!existsSync(examplePath)) {
    console.warn(`Skipped ${targetPath} because example file is missing.`);
    return;
  }

  if (existsSync(targetPath)) {
    console.log(`? ${targetPath} already exists`);
    return;
  }

  await mkdir(dirname(targetPath), { recursive: true });
  copyFileSync(examplePath, targetPath);
  console.log(`?? Created ${targetPath} from example`);
}

async function main() {
  try {
    console.log("?? Installing workspace dependencies...");
    await run("npm", ["install"]);

    console.log("?? Bootstrapping environment files...");
    await ensureFile(
      join(repoRoot, "apps/backend/.env.example"),
      join(repoRoot, "apps/backend/.env")
    );
    await ensureFile(
      join(repoRoot, "apps/frontend/.env.example"),
      join(repoRoot, "apps/frontend/.env.local")
    );

    const prismaDir = join(repoRoot, "apps/backend/prisma");
    const prismaSchemaExists = existsSync(join(prismaDir, "schema.prisma"));
    if (prismaSchemaExists) {
      console.log("???  Running Prisma migrations...");
      try {
        await run("npx", ["prisma", "migrate", "deploy"], { cwd: join(repoRoot, "apps/backend") });
      } catch (error) {
        console.warn(
          "?? Prisma migrate deploy skipped (database unreachable). Run `npm run prisma:deploy --workspace @splitwise/backend` once your DATABASE_URL is ready."
        );
        console.warn(error.message);
      }

      console.log("?? Generating Prisma client...");
      try {
        await run("npx", ["prisma", "generate"], { cwd: join(repoRoot, "apps/backend") });
      } catch (error) {
        console.warn(
          "?? Prisma generate failed. Re-run `npm run prisma:generate --workspace @splitwise/backend` after addressing the issue."
        );
        console.warn(error.message);
      }
    } else {
      console.warn("??  Prisma schema not found, skipping migrate/generate for now.");
      try {
        await readdir(prismaDir);
      } catch {
        // no-op
      }
    }

    console.log("? Setup complete. Start developing with `npm run dev`.");
  } catch (error) {
    console.error("? Setup failed:", error);
    process.exitCode = 1;
  }
}

await main();