"use client";

import { BlockList } from "@/components/block-list";
import { ParticipantList } from "@/components/participant-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useActiveChatter } from "@/contexts/chatter-context";
import { convClient } from "@/lib/conversation-client";
import type { Block, Chatter, Participant } from "@better-conversation/core";
import {
  useBlocks,
  useChatters,
  useConversation,
  useParticipants,
} from "@better-conversation/react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo } from "react";

export default function ChatConversationPage() {
  const params = useParams();
  const conversationId = (params.conversationId as string) ?? null;
  const { activeChatter } = useActiveChatter();

  const {
    data: conversation,
    isLoading: convLoading,
    refetch: refetchConv,
  } = useConversation(conversationId);
  const { data: blocksData, refetch: refetchBlocks } = useBlocks(conversationId, { limit: 50 });
  const { data: participants = [], refetch: refetchParticipants } = useParticipants(conversationId);
  const { data: allChattersData } = useChatters({ limit: 100 });

  const blocks = blocksData?.items ?? [];
  const allChatters = allChattersData?.items ?? [];

  const chatterIds = useMemo(() => {
    const ids = new Set<string>();
    for (const p of participants) ids.add(p.chatterId);
    for (const b of blocks) ids.add(b.authorId);
    return Array.from(ids);
  }, [participants, blocks]);

  const chatters = useMemo(() => {
    const map: Record<string, Chatter> = {};
    for (const c of allChatters) {
      if (chatterIds.includes(c.id)) map[c.id] = c;
    }
    return map;
  }, [allChatters, chatterIds]);

  const refetch = () => {
    refetchConv();
    refetchBlocks();
    refetchParticipants();
  };

  const loading = convLoading;

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
              conversationId={conversationId ?? ""}
              blocks={blocks}
              chatters={chatters}
              activeChatterId={activeChatter?.id ?? null}
              onBlockSent={refetch}
              onBlockDeleted={refetch}
              onBlockUpdated={refetch}
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
            onParticipantsChange={refetch}
          />
        </div>
      </div>
    </div>
  );
}
