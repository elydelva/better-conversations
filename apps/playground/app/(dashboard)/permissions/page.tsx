"use client";

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
import { convClient } from "@/lib/conversation-client";
import { Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

interface PermissionItem {
  action: string;
  scope: string | null;
  granted: boolean;
}

export default function PermissionsPage() {
  const { activeChatter } = useActiveChatter();
  const [permissions, setPermissions] = useState<PermissionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [addAction, setAddAction] = useState("");
  const [addScope, setAddScope] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadPermissions = useCallback(() => {
    if (!activeChatter) {
      setPermissions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    convClient.permissions
      .list(activeChatter.id)
      .then(setPermissions)
      .catch(() => {
        toast.error("Failed to load permissions (may not be supported)");
        setPermissions([]);
      })
      .finally(() => setLoading(false));
  }, [activeChatter]);

  useEffect(() => {
    loadPermissions();
  }, [loadPermissions]);

  async function handleGrant(e: React.FormEvent) {
    e.preventDefault();
    if (!activeChatter || !addAction.trim()) return;
    setSubmitting(true);
    try {
      await convClient.permissions.grant(activeChatter.id, {
        action: addAction.trim(),
        scope: addScope.trim() || undefined,
      });
      setAddOpen(false);
      setAddAction("");
      setAddScope("");
      loadPermissions();
      toast.success("Permission granted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to grant");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRevoke(action: string) {
    if (!activeChatter) return;
    try {
      await convClient.permissions.revoke(activeChatter.id, action);
      loadPermissions();
      toast.success("Permission revoked");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to revoke");
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Permissions</h1>
        <p className="text-muted-foreground mt-1">
          Grant and revoke permissions for the active chatter.
        </p>
      </div>

      {!activeChatter && (
        <Card className="border-amber-500/50">
          <CardContent className="pt-6">
            <p className="text-sm">Select a chatter in the sidebar to manage permissions.</p>
          </CardContent>
        </Card>
      )}

      {activeChatter && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle>Permissions for {activeChatter.displayName}</CardTitle>
              <CardDescription>Actions the chatter is allowed to perform.</CardDescription>
            </div>
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Grant
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleGrant}>
                  <DialogHeader>
                    <DialogTitle>Grant permission</DialogTitle>
                    <DialogDescription>
                      Add an action the chatter can perform. Scope is optional.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="action">Action</Label>
                      <Input
                        id="action"
                        value={addAction}
                        onChange={(e) => setAddAction(e.target.value)}
                        placeholder="e.g. send_message"
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="scope">Scope (optional)</Label>
                      <Input
                        id="scope"
                        value={addScope}
                        onChange={(e) => setAddScope(e.target.value)}
                        placeholder="e.g. conversation:123"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={submitting}>
                      {submitting ? "Granting…" : "Grant"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground text-sm">Loading…</p>
            ) : permissions.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No permissions. Grant one to add. (Note: permissions.list may not be implemented in
                the adapter.)
              </p>
            ) : (
              <div className="space-y-2">
                {permissions.map((p) => (
                  <div
                    key={`${p.action}-${p.scope ?? ""}`}
                    className="flex items-center justify-between rounded-md border p-3"
                  >
                    <div>
                      <p className="font-medium">{p.action}</p>
                      {p.scope && <p className="text-xs text-muted-foreground">scope: {p.scope}</p>}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => handleRevoke(p.action)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
