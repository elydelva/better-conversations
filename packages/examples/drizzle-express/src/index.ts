import { createExpressHandler } from "@better-conversation/handler-express";
import express from "express";
import { getEngine } from "./engine";

const app = express();
app.use(express.json());

app.use("/api", async (req, res, next) => {
  const engine = await getEngine();
  const handler = createExpressHandler(engine, { basePath: "/api" });
  return handler(req, res, next);
});

const port = Number(process.env.PORT) || 3001;
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log("Try: curl http://localhost:3001/api/conversations");
});
