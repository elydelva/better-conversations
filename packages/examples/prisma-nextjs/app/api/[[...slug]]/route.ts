import { getEngine } from "@/lib/engine";
import { createNextHandler } from "@better-conversation/handler-next";
import type { NextRequest } from "next/server";

const basePath = "/api";

async function handle(
  method: "GET" | "POST" | "PATCH" | "DELETE",
  req: NextRequest,
  context?: { params: Promise<{ slug?: string[] }> }
) {
  const engine = await getEngine();
  const handler = createNextHandler(engine, { basePath });
  const h = handler[method];
  const reqForHandler = req as unknown as Parameters<typeof handler.GET>[0];
  return method === "GET" ? h(reqForHandler, context) : h(reqForHandler);
}

export async function GET(req: NextRequest, context: { params: Promise<{ slug?: string[] }> }) {
  return handle("GET", req, context);
}

export async function POST(req: NextRequest) {
  return handle("POST", req);
}

export async function PATCH(req: NextRequest) {
  return handle("PATCH", req);
}

export async function DELETE(req: NextRequest) {
  return handle("DELETE", req);
}
