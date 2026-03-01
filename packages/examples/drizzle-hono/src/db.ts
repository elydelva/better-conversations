import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";

const client = new Database("data.db", { create: true });
export const db = drizzle(client);
