"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import type { Block, Chatter } from "@better-conversation/core";
import { useConversationClient } from "@better-conversation/react";
import { MoreHorizontal, Pencil, Reply, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface BlockListProps {
  conversationId: string;
  blocks: Block[];
  chatters: Record<string, Chatter>;
  activeChatterId: string | null;
  onBlockSent: () => void;
  onBlockDeleted: () => void;
  onBlockUpdated: () => void;
}

export function BlockList({
  conversationId,
  blocks,
  chatters,
  activeChatterId,
  onBlockSent,
  onBlockDeleted,
  onBlockUpdated,
}: BlockListProps) {
  const client = useConversationClient();
  const [newBody, setNewBody] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!activeChatterId || !newBody.trim()) return;
    setSending(true);
    try {
      await client.blocks.send(conversationId, {
        authorId: activeChatterId,
        type: "text",
        body: newBody.trim(),
        threadParentId: replyTo ?? undefined,
      });
      setNewBody("");
      setReplyTo(null);
      onBlockSent();
      toast.success("Message sent");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send");
    } finally {
      setSending(false);
    }
  }

  async function handleEdit(block: Block) {
    if (!editBody.trim()) return;
    try {
      await client.blocks.update(conversationId, block.id, { body: editBody.trim() });
      setEditingId(null);
      setEditBody("");
      onBlockUpdated();
      toast.success("Message updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    }
  }

  async function handleDelete(block: Block) {
    try {
      await client.blocks.delete(conversationId, block.id);
      onBlockDeleted();
      toast.success("Message deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  }

  const rootBlocks = blocks.filter((b) => !b.threadParentId);
  const threadMap = blocks.reduce<Record<string, Block[]>>((acc, b) => {
    if (b.threadParentId) {
      if (!acc[b.threadParentId]) acc[b.threadParentId] = [];
      acc[b.threadParentId].push(b);
    }
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-4">
      <div className="flex-1 space-y-4 overflow-auto">
        {rootBlocks.map((block) => {
          const author = chatters[block.authorId];
          const replies = threadMap[block.id] ?? [];
          const isOwn = block.authorId === activeChatterId;

          return (
            <div key={block.id} className="space-y-2">
              <BlockItem
                block={block}
                author={author}
                isOwn={isOwn}
                editingId={editingId}
                editBody={editBody}
                onEditStart={() => {
                  setEditingId(block.id);
                  setEditBody(block.body ?? "");
                }}
                onEditChange={setEditBody}
                onEditSave={() => handleEdit(block)}
                onEditCancel={() => {
                  setEditingId(null);
                  setEditBody("");
                }}
                onDelete={() => handleDelete(block)}
                onReply={() => setReplyTo(block.id)}
                activeChatterId={activeChatterId}
              />
              {replies.length > 0 && (
                <div className="ml-6 border-l-2 border-muted pl-4 space-y-2">
                  {replies.map((r) => {
                    const replyAuthor = chatters[r.authorId];
                    const isReplyOwn = r.authorId === activeChatterId;
                    return (
                      <BlockItem
                        key={r.id}
                        block={r}
                        author={replyAuthor}
                        isOwn={isReplyOwn}
                        editingId={editingId}
                        editBody={editBody}
                        onEditStart={() => {
                          setEditingId(r.id);
                          setEditBody(r.body ?? "");
                        }}
                        onEditChange={setEditBody}
                        onEditSave={() => handleEdit(r)}
                        onEditCancel={() => {
                          setEditingId(null);
                          setEditBody("");
                        }}
                        onDelete={() => handleDelete(r)}
                        onReply={() => setReplyTo(r.id)}
                        activeChatterId={activeChatterId}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {activeChatterId && (
        <form onSubmit={handleSend} className="flex gap-2">
          {replyTo && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setReplyTo(null)}
              className="shrink-0"
            >
              Cancel reply
            </Button>
          )}
          <Input
            value={newBody}
            onChange={(e) => setNewBody(e.target.value)}
            placeholder={replyTo ? "Reply…" : "Type a message…"}
            disabled={sending}
            className="flex-1"
          />
          <Button type="submit" disabled={sending || !newBody.trim()}>
            {sending ? "Sending…" : "Send"}
          </Button>
        </form>
      )}
    </div>
  );
}

interface BlockItemProps {
  block: Block;
  author?: Chatter;
  isOwn: boolean;
  editingId: string | null;
  editBody: string;
  onEditStart: () => void;
  onEditChange: (v: string) => void;
  onEditSave: () => void;
  onEditCancel: () => void;
  onDelete: () => void;
  onReply: () => void;
  activeChatterId: string | null;
}

function BlockItem({
  block,
  author,
  isOwn,
  editingId,
  editBody,
  onEditStart,
  onEditChange,
  onEditSave,
  onEditCancel,
  onDelete,
  onReply,
  activeChatterId,
}: BlockItemProps) {
  const isEditing = editingId === block.id;

  return (
    <Card>
      <CardContent className="flex items-start gap-3 pt-4">
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage src={author?.avatarUrl ?? undefined} />
          <AvatarFallback className="text-xs">
            {author?.displayName?.slice(0, 2).toUpperCase() ?? "?"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">
            {author?.displayName ?? block.authorId}
            {block.editedAt && <span className="text-xs text-muted-foreground ml-2">(edited)</span>}
          </p>
          {isEditing ? (
            <div className="mt-2 space-y-2">
              <Input
                value={editBody}
                onChange={(e) => onEditChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onEditSave();
                  if (e.key === "Escape") onEditCancel();
                }}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={onEditSave}>
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={onEditCancel}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground mt-0.5">{block.body}</p>
          )}
        </div>
        {activeChatterId && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onReply}>
                <Reply className="mr-2 h-4 w-4" />
                Reply
              </DropdownMenuItem>
              {isOwn && (
                <>
                  <DropdownMenuItem onClick={onEditStart}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onDelete} className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardContent>
    </Card>
  );
}
