import { db } from "@/lib/db";
import { chatters } from "@/lib/schema";
import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  const rows = await db.select().from(chatters).orderBy(desc(chatters.createdAt));
  const items = rows.map((r) => ({
    id: r.id,
    displayName: r.displayName,
    avatarUrl: r.avatarUrl,
    entityType: r.entityType,
    entityId: r.entityId,
    metadata: r.metadata,
    isActive: r.isActive,
    createdAt: r.createdAt?.toISOString(),
    updatedAt: r.updatedAt?.toISOString(),
  }));
  return NextResponse.json({ items });
}
