"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { useActiveChatter } from "@/contexts/chatter-context";
import { type Chatter, chattersApi, playgroundApi } from "@/lib/api";
import { Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

export default function ChattersPage() {
  const { activeChatter, setActiveChatter } = useActiveChatter();
  const [chatters, setChatters] = useState<Chatter[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    displayName: "",
    entityType: "user",
    entityId: "",
    avatarUrl: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const loadChatters = useCallback(() => {
    setLoading(true);
    playgroundApi
      .listChatters()
      .then(setChatters)
      .catch(() => {
        toast.error("Failed to load chatters");
        setChatters([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadChatters();
  }, [loadChatters]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const chatter = await chattersApi.create({
        displayName: form.displayName,
        entityType: form.entityType,
        entityId: form.entityId || undefined,
        avatarUrl: form.avatarUrl || undefined,
      });
      setChatters((prev) => [chatter, ...prev]);
      setActiveChatter(chatter);
      setForm({ displayName: "", entityType: "user", entityId: "", avatarUrl: "" });
      setCreateOpen(false);
      toast.success(`Chatter "${chatter.displayName}" created`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create chatter");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUse(chatter: Chatter) {
    try {
      const full = await chattersApi.find(chatter.id);
      setActiveChatter(full);
      toast.success(`Using "${full.displayName}"`);
    } catch {
      setActiveChatter(chatter);
      toast.success(`Using "${chatter.displayName}"`);
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Chatters</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage chatters. Select one as the active user for testing.
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create chatter
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>Create chatter</DialogTitle>
                <DialogDescription>
                  Chatters represent users or entities that can participate in conversations.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="displayName">Display name</Label>
                  <Input
                    id="displayName"
                    value={form.displayName}
                    onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
                    placeholder="Alice"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="entityType">Entity type</Label>
                  <Input
                    id="entityType"
                    value={form.entityType}
                    onChange={(e) => setForm((f) => ({ ...f, entityType: e.target.value }))}
                    placeholder="user"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="entityId">Entity ID (optional)</Label>
                  <Input
                    id="entityId"
                    value={form.entityId}
                    onChange={(e) => setForm((f) => ({ ...f, entityId: e.target.value }))}
                    placeholder="user-123"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="avatarUrl">Avatar URL (optional)</Label>
                  <Input
                    id="avatarUrl"
                    value={form.avatarUrl}
                    onChange={(e) => setForm((f) => ({ ...f, avatarUrl: e.target.value }))}
                    placeholder="https://..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Creating…" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All chatters</CardTitle>
          <CardDescription>
            Select a chatter to use as the active user in the playground.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-sm">Loading…</p>
          ) : chatters.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No chatters yet. Create one to get started.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {chatters.map((c) => (
                <Card key={c.id} className="relative">
                  <CardContent className="flex items-center gap-4 pt-6">
                    <Avatar>
                      <AvatarImage src={c.avatarUrl ?? undefined} />
                      <AvatarFallback>{c.displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{c.displayName}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {c.entityType}
                        {c.entityId ? ` · ${c.entityId}` : ""}
                      </p>
                      {activeChatter?.id === c.id && (
                        <Badge variant="secondary" className="mt-1">
                          Active
                        </Badge>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant={activeChatter?.id === c.id ? "default" : "outline"}
                      onClick={() => handleUse(c)}
                    >
                      {activeChatter?.id === c.id ? "Active" : "Use"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
