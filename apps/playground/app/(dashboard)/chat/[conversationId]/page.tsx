"use client";

import { BlockList } from "@/components/block-list";
import { ParticipantList } from "@/components/participant-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useActiveChatter } from "@/contexts/chatter-context";
import {
  type Block,
  type Chatter,
  type Conversation,
  type Participant,
  blocksApi,
  chattersApi,
  conversationsApi,
  participantsApi,
  playgroundApi,
} from "@/lib/api";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export default function ChatConversationPage() {
  const params = useParams();
  const conversationId = params.conversationId as string;
  const { activeChatter } = useActiveChatter();

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [chatters, setChatters] = useState<Record<string, Chatter>>({});
  const [allChatters, setAllChatters] = useState<Chatter[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(() => {
    if (!conversationId) return;
    setLoading(true);
    Promise.all([
      conversationsApi.find(conversationId),
      blocksApi.list(conversationId, { limit: 50 }),
      participantsApi.list(conversationId),
    ])
      .then(([conv, blocksRes, parts]) => {
        setConversation(conv);
        setBlocks(blocksRes.items);
        setParticipants(parts);
        const ids = new Set<string>();
        for (const p of parts) ids.add(p.chatterId);
        for (const b of blocksRes.items) ids.add(b.authorId);
        return Array.from(ids);
      })
      .then((ids) => {
        return Promise.all(
          ids.map((id) =>
            chattersApi
              .find(id)
              .then((c) => ({ id, c }))
              .catch(() => null)
          )
        ).then((results) => {
          const map: Record<string, Chatter> = {};
          for (const r of results) {
            if (r) map[r.id] = r.c;
          }
          setChatters(map);
        });
      })
      .catch(() => {
        setConversation(null);
        setBlocks([]);
        setParticipants([]);
      })
      .finally(() => setLoading(false));
  }, [conversationId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    playgroundApi
      .listChatters()
      .then(setAllChatters)
      .catch(() => setAllChatters([]));
  }, []);

  if (loading || !conversation) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-6">
        <Button variant="ghost" asChild>
          <Link href="/chat">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" asChild>
          <Link href="/chat">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <h1 className="text-xl font-semibold">
          {conversation.title || `Conversation ${conversation.id.slice(0, 8)}`}
        </h1>
        <div className="w-20" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <Card>
          <CardHeader>
            <CardTitle>Messages</CardTitle>
            <CardDescription>Send, edit, delete, and reply in threads.</CardDescription>
          </CardHeader>
          <CardContent>
            <BlockList
              conversationId={conversationId}
              blocks={blocks}
              chatters={chatters}
              activeChatterId={activeChatter?.id ?? null}
              onBlockSent={loadData}
              onBlockDeleted={loadData}
              onBlockUpdated={loadData}
            />
          </CardContent>
        </Card>
        <div>
          <ParticipantList
            conversationId={conversationId}
            participants={participants}
            chatters={chatters}
            allChatters={allChatters}
            activeChatterId={activeChatter?.id ?? null}
            onParticipantsChange={loadData}
          />
        </div>
      </div>
    </div>
  );
}
