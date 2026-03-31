/**
 * prisma generate validates DATABASE_URL protocol. Vercel/CI sometimes omit it during
 * install, or .env is not loaded. A placeholder is fine — generate does not connect.
 */
const { spawnSync } = require("child_process");
const path = require("path");

const raw = process.env.DATABASE_URL;
const trimmed = typeof raw === "string" ? raw.trim() : "";
const valid = /^postgres(ql)?:\/\//i.test(trimmed);

if (!valid) {
  process.env.DATABASE_URL =
    "postgresql://prisma_generate_placeholder:unused@127.0.0.1:5432/prisma?schema=public";
}

const prismaCli = path.join(__dirname, "..", "node_modules", "prisma", "build", "index.js");
const result = spawnSync(process.execPath, [prismaCli, "generate"], {
  stdio: "inherit",
  env: process.env,
  cwd: path.join(__dirname, ".."),
});

process.exit(result.status === null ? 1 : result.status);
