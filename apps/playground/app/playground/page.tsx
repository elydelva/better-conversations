"use client";

import Link from "next/link";
import { useState } from "react";

const POLICY_KEYS = [
  "allowedBlocks",
  "deniedBlocks",
  "maxBlocksPerMinute",
  "maxBlocksPerHour",
  "maxBlockBodyLength",
  "canEditOwnBlocks",
  "canDeleteOwnBlocks",
  "editWindowSeconds",
  "threadsEnabled",
  "maxThreadDepth",
  "readOnly",
] as const;

type PolicyKey = (typeof POLICY_KEYS)[number];

interface PolicyFormState {
  allowedBlocks: string;
  deniedBlocks: string;
  maxBlocksPerMinute: string;
  maxBlocksPerHour: string;
  maxBlockBodyLength: string;
  canEditOwnBlocks: boolean;
  canDeleteOwnBlocks: boolean;
  editWindowSeconds: string;
  threadsEnabled: boolean;
  maxThreadDepth: string;
  readOnly: boolean;
}

const defaultForm: PolicyFormState = {
  allowedBlocks: "",
  deniedBlocks: "",
  maxBlocksPerMinute: "",
  maxBlocksPerHour: "",
  maxBlockBodyLength: "",
  canEditOwnBlocks: true,
  canDeleteOwnBlocks: true,
  editWindowSeconds: "",
  threadsEnabled: true,
  maxThreadDepth: "",
  readOnly: false,
};

function toPolicyObject(form: PolicyFormState): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (form.allowedBlocks.trim())
    out.allowedBlocks =
      form.allowedBlocks.trim() === "*"
        ? "*"
        : form.allowedBlocks
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
  if (form.deniedBlocks.trim())
    out.deniedBlocks = form.deniedBlocks
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  const n = Number.parseInt(form.maxBlocksPerMinute, 10);
  if (!Number.isNaN(n)) out.maxBlocksPerMinute = n;
  const h = Number.parseInt(form.maxBlocksPerHour, 10);
  if (!Number.isNaN(h)) out.maxBlocksPerHour = h;
  const bl = Number.parseInt(form.maxBlockBodyLength, 10);
  if (!Number.isNaN(bl)) out.maxBlockBodyLength = bl;
  out.canEditOwnBlocks = form.canEditOwnBlocks;
  out.canDeleteOwnBlocks = form.canDeleteOwnBlocks;
  const ew = Number.parseInt(form.editWindowSeconds, 10);
  if (!Number.isNaN(ew)) out.editWindowSeconds = ew;
  out.threadsEnabled = form.threadsEnabled;
  const mtd = Number.parseInt(form.maxThreadDepth, 10);
  if (!Number.isNaN(mtd)) out.maxThreadDepth = mtd;
  out.readOnly = form.readOnly;
  return out;
}

export default function PlaygroundPage() {
  const [globalForm, setGlobalForm] = useState<PolicyFormState>(defaultForm);
  const [memberForm, setMemberForm] = useState<PolicyFormState>(defaultForm);
  const [ownerForm, setOwnerForm] = useState<PolicyFormState>(defaultForm);
  const [mergeStrategy, setMergeStrategy] = useState<"override" | "restrict">("override");
  const [chatterId, setChatterId] = useState("");
  const [conversationId, setConversationId] = useState("");
  const [threadParentBlockId, setThreadParentBlockId] = useState("");
  const [role, setRole] = useState<"member" | "owner">("member");
  const [resolved, setResolved] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);

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
          chatterId: chatterId || "test-chatter",
          conversationId: conversationId || undefined,
          threadParentBlockId: threadParentBlockId || undefined,
          role,
        }),
      });
      const data = await res.json();
      setResolved(data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Policy Playground</h1>
        <Link href="/" className="text-sm text-zinc-400 hover:text-zinc-100">
          ← Home
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <h2 className="mb-4 text-lg font-semibold">Global Policy</h2>
          <PolicyForm form={globalForm} setForm={setGlobalForm} />
        </section>

        <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <h2 className="mb-4 text-lg font-semibold">Role Overrides</h2>
          <div className="space-y-4">
            <div>
              <h3 className="mb-2 text-sm text-zinc-400">member</h3>
              <PolicyForm form={memberForm} setForm={setMemberForm} compact />
            </div>
            <div>
              <h3 className="mb-2 text-sm text-zinc-400">owner</h3>
              <PolicyForm form={ownerForm} setForm={setOwnerForm} compact />
            </div>
          </div>
        </section>
      </div>

      <section className="mt-8 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h2 className="mb-4 text-lg font-semibold">Resolve Context</h2>
        <div className="flex flex-wrap gap-4">
          <input
            type="text"
            placeholder="chatterId"
            value={chatterId}
            onChange={(e) => setChatterId(e.target.value)}
            className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm"
          />
          <input
            type="text"
            placeholder="conversationId"
            value={conversationId}
            onChange={(e) => setConversationId(e.target.value)}
            className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm"
          />
          <input
            type="text"
            placeholder="threadParentBlockId"
            value={threadParentBlockId}
            onChange={(e) => setThreadParentBlockId(e.target.value)}
            className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as "member" | "owner")}
            className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm"
          >
            <option value="member">member</option>
            <option value="owner">owner</option>
          </select>
          <select
            value={mergeStrategy}
            onChange={(e) => setMergeStrategy(e.target.value as "override" | "restrict")}
            className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm"
          >
            <option value="override">override</option>
            <option value="restrict">restrict</option>
          </select>
        </div>
        <button
          type="button"
          onClick={handleResolve}
          disabled={loading}
          className="mt-4 rounded-lg bg-amber-500 px-6 py-2 font-medium text-zinc-950 disabled:opacity-50"
        >
          {loading ? "Resolving…" : "Resolve"}
        </button>
      </section>

      {resolved && (
        <section className="mt-8 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <h2 className="mb-4 text-lg font-semibold">Resolved Policy</h2>
          <pre className="overflow-auto rounded-lg bg-zinc-950 p-4 text-sm">
            {JSON.stringify(resolved, null, 2)}
          </pre>
        </section>
      )}
    </main>
  );
}

function PolicyForm({
  form,
  setForm,
  compact = false,
}: {
  form: PolicyFormState;
  setForm: React.Dispatch<React.SetStateAction<PolicyFormState>>;
  compact?: boolean;
}) {
  const update = (k: keyof PolicyFormState, v: string | boolean) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  if (compact) {
    return (
      <div className="grid grid-cols-2 gap-2 text-sm">
        <input
          type="text"
          placeholder="allowedBlocks (comma or *)"
          value={form.allowedBlocks}
          onChange={(e) => update("allowedBlocks", e.target.value)}
          className="rounded border border-zinc-700 bg-zinc-800 px-2 py-1"
        />
        <input
          type="text"
          placeholder="maxBlocksPerMinute"
          value={form.maxBlocksPerMinute}
          onChange={(e) => update("maxBlocksPerMinute", e.target.value)}
          className="rounded border border-zinc-700 bg-zinc-800 px-2 py-1"
        />
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.canEditOwnBlocks}
            onChange={(e) => update("canEditOwnBlocks", e.target.checked)}
          />
          canEditOwnBlocks
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.readOnly}
            onChange={(e) => update("readOnly", e.target.checked)}
          />
          readOnly
        </label>
      </div>
    );
  }

  return (
    <div className="grid gap-2 text-sm">
      <div>
        <label htmlFor="allowedBlocks" className="block text-zinc-400">
          allowedBlocks
        </label>
        <input
          id="allowedBlocks"
          type="text"
          placeholder='comma-separated or "*"'
          value={form.allowedBlocks}
          onChange={(e) => update("allowedBlocks", e.target.value)}
          className="w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1"
        />
      </div>
      <div>
        <label htmlFor="deniedBlocks" className="block text-zinc-400">
          deniedBlocks
        </label>
        <input
          id="deniedBlocks"
          type="text"
          placeholder="comma-separated"
          value={form.deniedBlocks}
          onChange={(e) => update("deniedBlocks", e.target.value)}
          className="w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label htmlFor="maxBlocksPerMinute" className="block text-zinc-400">
            maxBlocksPerMinute
          </label>
          <input
            id="maxBlocksPerMinute"
            type="text"
            value={form.maxBlocksPerMinute}
            onChange={(e) => update("maxBlocksPerMinute", e.target.value)}
            className="w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1"
          />
        </div>
        <div>
          <label htmlFor="maxBlocksPerHour" className="block text-zinc-400">
            maxBlocksPerHour
          </label>
          <input
            id="maxBlocksPerHour"
            type="text"
            value={form.maxBlocksPerHour}
            onChange={(e) => update("maxBlocksPerHour", e.target.value)}
            className="w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1"
          />
        </div>
      </div>
      <div>
        <label htmlFor="maxBlockBodyLength" className="block text-zinc-400">
          maxBlockBodyLength
        </label>
        <input
          id="maxBlockBodyLength"
          type="text"
          value={form.maxBlockBodyLength}
          onChange={(e) => update("maxBlockBodyLength", e.target.value)}
          className="w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1"
        />
      </div>
      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.canEditOwnBlocks}
            onChange={(e) => update("canEditOwnBlocks", e.target.checked)}
          />
          canEditOwnBlocks
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.canDeleteOwnBlocks}
            onChange={(e) => update("canDeleteOwnBlocks", e.target.checked)}
          />
          canDeleteOwnBlocks
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.threadsEnabled}
            onChange={(e) => update("threadsEnabled", e.target.checked)}
          />
          threadsEnabled
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.readOnly}
            onChange={(e) => update("readOnly", e.target.checked)}
          />
          readOnly
        </label>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label htmlFor="editWindowSeconds" className="block text-zinc-400">
            editWindowSeconds
          </label>
          <input
            id="editWindowSeconds"
            type="text"
            value={form.editWindowSeconds}
            onChange={(e) => update("editWindowSeconds", e.target.value)}
            className="w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1"
          />
        </div>
        <div>
          <label htmlFor="maxThreadDepth" className="block text-zinc-400">
            maxThreadDepth
          </label>
          <input
            id="maxThreadDepth"
            type="text"
            value={form.maxThreadDepth}
            onChange={(e) => update("maxThreadDepth", e.target.value)}
            className="w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1"
          />
        </div>
      </div>
    </div>
  );
}
