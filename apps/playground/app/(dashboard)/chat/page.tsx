"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useActiveChatter } from "@/contexts/chatter-context";
import type { Conversation } from "@better-conversation/core";
import { useConversations } from "@better-conversation/react";
import { MessageCircle } from "lucide-react";
import Link from "next/link";

export default function ChatPage() {
  const { activeChatter } = useActiveChatter();
  const { data: conversationsData, isLoading: loading } = useConversations({ limit: 50 });
  const conversations = (conversationsData?.items ?? []).filter(
    (c: Conversation) => c.status !== "archived"
  );

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Chat</h1>
        <p className="text-muted-foreground mt-1">
          Select a conversation to view messages, send new ones, edit, delete, and reply in threads.
        </p>
      </div>

      {!activeChatter && (
        <Card className="border-amber-500/50">
          <CardContent className="pt-6">
            <p className="text-sm">Select a chatter in the sidebar to send messages.</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Select a conversation</CardTitle>
          <CardDescription>Or create one from the Conversations page.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-sm">Loading…</p>
          ) : conversations.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No open conversations. Create one from the Conversations page.
            </p>
          ) : (
            <div className="space-y-2">
              {conversations.map((c: Conversation) => (
                <Button key={c.id} asChild variant="outline" className="w-full justify-start">
                  <Link href={`/chat/${c.id}`}>
                    <MessageCircle className="mr-2 h-4 w-4" />
                    {c.title || `Conversation ${c.id.slice(0, 8)}`}
                  </Link>
                </Button>
              ))}
            </div>
          )}
          <Button asChild className="mt-4">
            <Link href="/conversations">Go to Conversations</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
