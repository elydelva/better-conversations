import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";

const dbPath = process.env.BENCH_DB ?? "./benchmarks.db";
export const db = drizzle(new Database(dbPath, { create: true }));
