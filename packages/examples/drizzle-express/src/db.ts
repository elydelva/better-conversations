import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL is required. Set it in .env (see .env.example)");
}
const client = postgres(url);
export const db = drizzle(client);
