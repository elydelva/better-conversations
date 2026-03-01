"use client";

import { PolicyForm, defaultPolicyForm, toPolicyObject } from "@/components/policy-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useActiveChatter } from "@/contexts/chatter-context";
import { playgroundApi, policiesApi } from "@/lib/api";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function PoliciesPage() {
  const { activeChatter } = useActiveChatter();
  const [globalForm, setGlobalForm] = useState(defaultPolicyForm);
  const [memberForm, setMemberForm] = useState(defaultPolicyForm);
  const [ownerForm, setOwnerForm] = useState(defaultPolicyForm);
  const [mergeStrategy, setMergeStrategy] = useState<"override" | "restrict">("override");
  const [chatterId, setChatterId] = useState("");
  const [conversationId, setConversationId] = useState("");
  const [threadParentBlockId, setThreadParentBlockId] = useState("");
  const [role, setRole] = useState<"member" | "owner">("member");
  const [resolved, setResolved] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [applyLoading, setApplyLoading] = useState<string | null>(null);

  useEffect(() => {
    playgroundApi.listChatters().catch(() => []);
  }, []);

  async function handleResolve() {
    setLoading(true);
    setResolved(null);
    try {
      const globalPolicy = toPolicyObject(globalForm);
      const roles: Record<string, Record<string, unknown>> = {};
      const mp = toPolicyObject(memberForm);
      const op = toPolicyObject(ownerForm);
      if (Object.keys(mp).length > 0) roles.member = mp;
      if (Object.keys(op).length > 0) roles.owner = op;

      const res = await fetch("/api/playground/policies/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          global: Object.keys(globalPolicy).length > 0 ? globalPolicy : undefined,
          roles: Object.keys(roles).length > 0 ? roles : undefined,
          mergeStrategy,
          chatterId: chatterId || activeChatter?.id || "test-chatter",
          conversationId: conversationId || undefined,
          threadParentBlockId: threadParentBlockId || undefined,
          role,
        }),
      });
      const data = await res.json();
      setResolved(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to resolve");
    } finally {
      setLoading(false);
    }
  }

  async function handleApplyGlobal() {
    setApplyLoading("global");
    try {
      const policy = toPolicyObject(globalForm);
      if (Object.keys(policy).length === 0) {
        toast.error("Add at least one policy field");
        return;
      }
      await policiesApi.setGlobal(policy);
      toast.success("Global policy updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to apply");
    } finally {
      setApplyLoading(null);
    }
  }

  async function handleApplyRole(r: string) {
    setApplyLoading(`role-${r}`);
    try {
      const policy = r === "member" ? toPolicyObject(memberForm) : toPolicyObject(ownerForm);
      if (Object.keys(policy).length === 0) {
        toast.error("Add at least one policy field");
        return;
      }
      await policiesApi.setRole(r, policy);
      toast.success(`${r} role policy updated`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to apply");
    } finally {
      setApplyLoading(null);
    }
  }

  async function handleApplyChatter() {
    const cid = chatterId || activeChatter?.id;
    if (!cid) {
      toast.error("Select or enter a chatter ID");
      return;
    }
    setApplyLoading("chatter");
    try {
      const policy = toPolicyObject(globalForm); // could use a dedicated form
      if (Object.keys(policy).length === 0) {
        toast.error("Add at least one policy field");
        return;
      }
      await policiesApi.setChatter(cid, policy);
      toast.success("Chatter policy updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to apply");
    } finally {
      setApplyLoading(null);
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Policies</h1>
        <p className="text-muted-foreground mt-1">
          Configure and resolve policies. Test global, role, chatter, and conversation-level
          overrides.
        </p>
      </div>

      <Tabs defaultValue="resolve">
        <TabsList>
          <TabsTrigger value="resolve">Resolve (simulate)</TabsTrigger>
          <TabsTrigger value="apply">Apply via API</TabsTrigger>
        </TabsList>

        <TabsContent value="resolve" className="space-y-6 mt-4">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Global Policy</CardTitle>
                <CardDescription>Base policy applied to all conversations.</CardDescription>
              </CardHeader>
              <CardContent>
                <PolicyForm form={globalForm} setForm={setGlobalForm} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Role Overrides</CardTitle>
                <CardDescription>Overrides per role (member, owner, etc.).</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label className="text-muted-foreground">member</Label>
                    <PolicyForm form={memberForm} setForm={setMemberForm} compact />
                  </div>
                  <div>
                    <Label className="text-muted-foreground">owner</Label>
                    <PolicyForm form={ownerForm} setForm={setOwnerForm} compact />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Resolve Context</CardTitle>
              <CardDescription>
                Simulate policy resolution for a chatter in a conversation.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-4">
                <div className="grid gap-2">
                  <Label>chatterId</Label>
                  <Input
                    placeholder={activeChatter?.id ?? "chatter-id"}
                    value={chatterId}
                    onChange={(e) => setChatterId(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>conversationId</Label>
                  <Input
                    placeholder="optional"
                    value={conversationId}
                    onChange={(e) => setConversationId(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>threadParentBlockId</Label>
                  <Input
                    placeholder="optional"
                    value={threadParentBlockId}
                    onChange={(e) => setThreadParentBlockId(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>role</Label>
                  <Select value={role} onValueChange={(v) => setRole(v as "member" | "owner")}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">member</SelectItem>
                      <SelectItem value="owner">owner</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>mergeStrategy</Label>
                  <Select
                    value={mergeStrategy}
                    onValueChange={(v) => setMergeStrategy(v as "override" | "restrict")}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="override">override</SelectItem>
                      <SelectItem value="restrict">restrict</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleResolve} disabled={loading}>
                {loading ? "Resolving…" : "Resolve"}
              </Button>
            </CardContent>
          </Card>

          {resolved && (
            <Card>
              <CardHeader>
                <CardTitle>Resolved Policy</CardTitle>
                <CardDescription>Result of merging global + role policies.</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px] rounded-md border p-4">
                  <pre className="text-xs">{JSON.stringify(resolved, null, 2)}</pre>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="apply" className="space-y-6 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Apply policies via API</CardTitle>
              <CardDescription>
                Push policy changes to the engine. These affect real resolution for chatters and
                conversations.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Button onClick={handleApplyGlobal} disabled={!!applyLoading}>
                  {applyLoading === "global" ? "Applying…" : "Apply global policy"}
                </Button>
                <span className="text-sm text-muted-foreground">
                  Uses the Global Policy form above.
                </span>
              </div>
              <div className="flex items-center gap-4">
                <Button onClick={() => handleApplyRole("member")} disabled={!!applyLoading}>
                  {applyLoading === "role-member" ? "Applying…" : "Apply member role"}
                </Button>
                <Button onClick={() => handleApplyRole("owner")} disabled={!!applyLoading}>
                  {applyLoading === "role-owner" ? "Applying…" : "Apply owner role"}
                </Button>
                <span className="text-sm text-muted-foreground">Uses role overrides above.</span>
              </div>
              <div className="flex items-center gap-4">
                <Input
                  placeholder="Chatter ID"
                  value={chatterId || activeChatter?.id || ""}
                  onChange={(e) => setChatterId(e.target.value)}
                  className="w-48"
                />
                <Button onClick={handleApplyChatter} disabled={!!applyLoading}>
                  {applyLoading === "chatter" ? "Applying…" : "Apply chatter policy"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
