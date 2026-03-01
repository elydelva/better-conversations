"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  type Chatter,
  type Participant,
  chattersApi,
  participantsApi,
  playgroundApi,
} from "@/lib/api";
import { Plus, UserMinus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const ROLES = ["member", "owner", "observer", "bot"] as const;

interface ParticipantListProps {
  conversationId: string;
  participants: Participant[];
  chatters: Record<string, Chatter>;
  allChatters: Chatter[];
  activeChatterId: string | null;
  onParticipantsChange: () => void;
}

export function ParticipantList({
  conversationId,
  participants,
  chatters,
  allChatters,
  activeChatterId,
  onParticipantsChange,
}: ParticipantListProps) {
  const [addOpen, setAddOpen] = useState(false);
  const [addChatterId, setAddChatterId] = useState("");
  const [addRole, setAddRole] = useState<string>("member");
  const [submitting, setSubmitting] = useState(false);

  const participantChatterIds = new Set(participants.map((p) => p.chatterId));
  const availableChatters = allChatters.filter((c) => !participantChatterIds.has(c.id));

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!addChatterId) return;
    setSubmitting(true);
    try {
      await participantsApi.add(conversationId, {
        chatterId: addChatterId,
        role: addRole,
      });
      setAddOpen(false);
      setAddChatterId("");
      setAddRole("member");
      onParticipantsChange();
      toast.success("Participant added");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add participant");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRemove(participant: Participant) {
    try {
      await participantsApi.remove(conversationId, participant.chatterId);
      onParticipantsChange();
      toast.success("Participant removed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove");
    }
  }

  async function handleSetRole(participant: Participant, role: string) {
    try {
      await participantsApi.setRole(conversationId, participant.chatterId, role);
      onParticipantsChange();
      toast.success("Role updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update role");
    }
  }

  async function handleMarkRead(participant: Participant) {
    try {
      await participantsApi.markRead(conversationId, participant.chatterId);
      onParticipantsChange();
      toast.success("Marked as read");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Participants</CardTitle>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm" disabled={availableChatters.length === 0}>
              <Plus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleAdd}>
              <DialogHeader>
                <DialogTitle>Add participant</DialogTitle>
                <DialogDescription>
                  Add a chatter to this conversation. They must exist as a chatter first.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Chatter</Label>
                  <Select value={addChatterId} onValueChange={setAddChatterId} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select chatter" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableChatters.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.displayName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Role</Label>
                  <Select value={addRole} onValueChange={setAddRole}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Adding…" : "Add"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {participants.map((p) => {
            const chatter = chatters[p.chatterId];
            return (
              <div key={p.id} className="flex items-center justify-between rounded-md border p-2">
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={chatter?.avatarUrl ?? undefined} />
                    <AvatarFallback className="text-xs">
                      {chatter?.displayName?.slice(0, 2).toUpperCase() ?? "?"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium truncate">
                    {chatter?.displayName ?? p.chatterId}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {p.role}
                  </Badge>
                </div>
                <div className="flex items-center gap-1">
                  <Select value={p.role} onValueChange={(v) => handleSetRole(p, v)}>
                    <SelectTrigger className="h-7 w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => handleMarkRead(p)}
                    title="Mark read"
                  >
                    ✓
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-destructive"
                    onClick={() => handleRemove(p)}
                    title="Remove"
                  >
                    <UserMinus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
        {participants.length === 0 && (
          <p className="text-sm text-muted-foreground">No participants yet.</p>
        )}
      </CardContent>
    </Card>
  );
}
