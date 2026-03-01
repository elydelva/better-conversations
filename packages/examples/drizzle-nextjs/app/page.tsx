"use client";

import { useEffect, useState } from "react";

const API = "/api";

export default function Home() {
  const [chatterId, setChatterId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<{ id: string; title?: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API}/chatters`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            displayName: "Demo User",
            entityType: "user",
            entityId: "demo-1",
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.message ?? "Failed to create chatter");
        }
        const chatter = await res.json();
        setChatterId(chatter.id);

        const convRes = await fetch(`${API}/conversations`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: "Welcome",
            createdBy: chatter.id,
            participants: [{ chatterId: chatter.id, role: "member" }],
          }),
        });
        if (!convRes.ok) throw new Error("Failed to create conversation");
        const conv = await convRes.json();

        const listRes = await fetch(`${API}/chatters/${chatter.id}/conversations`);
        if (!listRes.ok) throw new Error("Failed to list conversations");
        const list = await listRes.json();
        setConversations(list.items ?? []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <p>Setting up demo…</p>;
  if (error) return <p className="error">Error: {error}</p>;

  return (
    <main>
      <h1>Better Conversation</h1>
      <p className="success">Drizzle + Next.js (SQLite)</p>
      <p>
        Chatter ID: <code>{chatterId}</code>
      </p>
      <h2>Conversations</h2>
      <ul className="chat-list">
        {conversations.map((c) => (
          <li key={c.id}>
            <a href={`#conv-${c.id}`}>{c.title ?? c.id}</a>
          </li>
        ))}
      </ul>
      <p>
        <strong>API base:</strong> <code>{API}</code>
      </p>
      <p>
        Use curl to test:{" "}
        <code>
          curl {typeof window !== "undefined" ? window.location.origin : ""}
          {API}
        </code>
      </p>
    </main>
  );
}
