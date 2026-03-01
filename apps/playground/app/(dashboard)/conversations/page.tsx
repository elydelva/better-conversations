"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useActiveChatter } from "@/contexts/chatter-context";
import { convClient } from "@/lib/conversation-client";
import type { Conversation } from "@better-conversation/core";
import { useChatterConversations, useCreateConversation } from "@better-conversation/react";
import { Archive, MessageCircle, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

export default function ConversationsPage() {
  const { activeChatter } = useActiveChatter();
  const { data: conversationsData, isLoading: loading } = useChatterConversations(
    activeChatter?.id ?? null,
    { limit: 100 }
  );
  const conversations = conversationsData?.items ?? [];
  const createConversation = useCreateConversation();
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    status: "open" as const,
  });

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!activeChatter) {
      toast.error("Select a chatter first");
      return;
    }
    try {
      await createConversation.mutateAsync({
        title: form.title || undefined,
        createdBy: activeChatter.id,
        participants: [{ chatterId: activeChatter.id, role: "owner" }],
      });
      setForm({ title: "", status: "open" });
      setCreateOpen(false);
      toast.success("Conversation created");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create conversation");
    }
  }

  async function handleArchive(conv: Conversation) {
    try {
      await convClient.conversations.archive(conv.id);
      toast.success("Conversation archived");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to archive");
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Conversations</h1>
          <p className="text-muted-foreground mt-1">
            Create and browse conversations. Open one to chat.
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button disabled={!activeChatter}>
              <Plus className="mr-2 h-4 w-4" />
              Create conversation
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>Create conversation</DialogTitle>
                <DialogDescription>
                  {activeChatter
                    ? `Created by ${activeChatter.displayName}. You will be added as owner.`
                    : "Select a chatter first to create a conversation."}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Title (optional)</Label>
                  <Input
                    id="title"
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="My conversation"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Status</Label>
                  <Select
                    value={form.status}
                    onValueChange={(v) => setForm((f) => ({ ...f, status: v as "open" }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">open</SelectItem>
                      <SelectItem value="archived">archived</SelectItem>
                      <SelectItem value="locked">locked</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createConversation.isPending || !activeChatter}>
                  {createConversation.isPending ? "Creating…" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {!activeChatter && (
        <Card className="border-amber-500/50">
          <CardContent className="pt-6">
            <p className="text-sm">
              Select a chatter in the sidebar to create conversations and send messages.
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All conversations</CardTitle>
          <CardDescription>Click a conversation to open the chat view.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-sm">Loading…</p>
          ) : conversations.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No conversations yet. Create one to get started.
            </p>
          ) : (
            <div className="space-y-2">
              {conversations.map((c: Conversation) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50"
                >
                  <div className="flex items-center gap-4">
                    <MessageCircle className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{c.title || `Conversation ${c.id.slice(0, 8)}`}</p>
                      <p className="text-xs text-muted-foreground">
                        {c.status} · {new Date(c.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <Badge variant={c.status === "archived" ? "secondary" : "default"}>
                      {c.status}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    {c.status !== "archived" && (
                      <Button variant="ghost" size="sm" onClick={() => handleArchive(c)}>
                        <Archive className="h-4 w-4" />
                      </Button>
                    )}
                    <Button asChild size="sm">
                      <Link href={`/chat/${c.id}`}>Open</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
