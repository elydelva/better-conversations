"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useActiveChatter } from "@/contexts/chatter-context";
import { conversationsApi, playgroundApi } from "@/lib/api";
import { MessageCircle, MessageSquare, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function OverviewPage() {
  const { activeChatter } = useActiveChatter();
  const [chatterCount, setChatterCount] = useState<number | null>(null);
  const [conversationCount, setConversationCount] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([
      playgroundApi.listChatters().then((r) => r.length),
      conversationsApi.list({ limit: 100 }).then((r) => r.items.length),
    ])
      .then(([c, conv]) => {
        setChatterCount(c);
        setConversationCount(conv);
      })
      .catch(() => {
        setChatterCount(0);
        setConversationCount(0);
      });
  }, []);

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
        <p className="text-muted-foreground mt-1">
          Test all better-conversations features: chatters, conversations, blocks, policies, and
          permissions.
        </p>
      </div>

      {activeChatter && (
        <Card>
          <CardHeader>
            <CardTitle>Active chatter</CardTitle>
            <CardDescription>You are testing as this user</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{activeChatter.displayName}</p>
            <p className="text-sm text-muted-foreground">
              {activeChatter.entityType}
              {activeChatter.entityId ? ` · ${activeChatter.entityId}` : ""}
            </p>
          </CardContent>
        </Card>
      )}

      {!activeChatter && (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>Select a chatter</CardTitle>
            <CardDescription>
              Use the sidebar to select an active chatter, or create one first.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/chatters">Go to Chatters</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chatters</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{chatterCount ?? "—"}</p>
            <p className="text-xs text-muted-foreground">Total chatters in database</p>
            <Button asChild variant="outline" size="sm" className="mt-2">
              <Link href="/chatters">Manage</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversations</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{conversationCount ?? "—"}</p>
            <p className="text-xs text-muted-foreground">Total conversations</p>
            <Button asChild variant="outline" size="sm" className="mt-2">
              <Link href="/conversations">Manage</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick start</CardTitle>
          <CardDescription>Recommended flow to test the API</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Create or select a chatter in the sidebar</li>
            <li>Create a conversation (or open an existing one)</li>
            <li>Send messages, edit, delete, reply in threads</li>
            <li>Configure policies and test restrictions</li>
            <li>Manage permissions for the active chatter</li>
          </ol>
          <Button asChild className="mt-4">
            <Link href="/chat">
              <MessageSquare className="mr-2 h-4 w-4" />
              Open Chat
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
