import { Database } from "bun:sqlite";
import { join } from "node:path";
import { drizzle } from "drizzle-orm/bun-sqlite";

/** DB path: package dir when BENCH_DB unset (works from any cwd) */
const dbPath = process.env.BENCH_DB ?? join(import.meta.dir, "..", "benchmarks.db");
export const db = drizzle(new Database(dbPath, { create: true }));
