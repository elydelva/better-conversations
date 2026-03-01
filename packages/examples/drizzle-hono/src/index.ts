import { createHonoHandler } from "@better-conversation/handler-hono";
import { Hono } from "hono";
import { getEngine } from "./engine";

const app = new Hono();

app.all("/api/*", async (c) => {
  const engine = await getEngine();
  const handler = createHonoHandler(engine, { basePath: "/api" });
  return handler(c);
});

const port = Number(process.env.PORT) || 3002;
export default {
  port,
  fetch: app.fetch,
};

console.log(`Server running at http://localhost:${port}`);
console.log("Try: curl http://localhost:3002/api/conversations");
