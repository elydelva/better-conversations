import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const url = process.env.DATABASE_URL ?? "postgres://postgres:postgres@localhost:5432/better_conv";
const client = postgres(url);
export const db = drizzle(client);
