"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

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

export type PolicyKey = (typeof POLICY_KEYS)[number];

export interface PolicyFormState {
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

export const defaultPolicyForm: PolicyFormState = {
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

export function toPolicyObject(form: PolicyFormState): Record<string, unknown> {
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

interface PolicyFormProps {
  form: PolicyFormState;
  setForm: React.Dispatch<React.SetStateAction<PolicyFormState>>;
  compact?: boolean;
}

export function PolicyForm({ form, setForm, compact = false }: PolicyFormProps) {
  const update = (k: keyof PolicyFormState, v: string | boolean) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  if (compact) {
    return (
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <Label className="text-xs">allowedBlocks</Label>
          <Input
            type="text"
            placeholder="comma or *"
            value={form.allowedBlocks}
            onChange={(e) => update("allowedBlocks", e.target.value)}
            className="h-8"
          />
        </div>
        <div>
          <Label className="text-xs">maxBlocksPerMinute</Label>
          <Input
            type="text"
            value={form.maxBlocksPerMinute}
            onChange={(e) => update("maxBlocksPerMinute", e.target.value)}
            className="h-8"
          />
        </div>
        <div className="flex items-center gap-2 col-span-2">
          <Switch
            id="canEdit"
            checked={form.canEditOwnBlocks}
            onCheckedChange={(v) => update("canEditOwnBlocks", v)}
          />
          <Label htmlFor="canEdit" className="text-xs">
            canEditOwnBlocks
          </Label>
        </div>
        <div className="flex items-center gap-2 col-span-2">
          <Switch
            id="readOnly"
            checked={form.readOnly}
            onCheckedChange={(v) => update("readOnly", v)}
          />
          <Label htmlFor="readOnly" className="text-xs">
            readOnly
          </Label>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-3 text-sm">
      <div>
        <Label htmlFor="allowedBlocks">allowedBlocks</Label>
        <Input
          id="allowedBlocks"
          type="text"
          placeholder='comma-separated or "*"'
          value={form.allowedBlocks}
          onChange={(e) => update("allowedBlocks", e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="deniedBlocks">deniedBlocks</Label>
        <Input
          id="deniedBlocks"
          type="text"
          placeholder="comma-separated"
          value={form.deniedBlocks}
          onChange={(e) => update("deniedBlocks", e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label htmlFor="maxBlocksPerMinute">maxBlocksPerMinute</Label>
          <Input
            id="maxBlocksPerMinute"
            type="text"
            value={form.maxBlocksPerMinute}
            onChange={(e) => update("maxBlocksPerMinute", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="maxBlocksPerHour">maxBlocksPerHour</Label>
          <Input
            id="maxBlocksPerHour"
            type="text"
            value={form.maxBlocksPerHour}
            onChange={(e) => update("maxBlocksPerHour", e.target.value)}
          />
        </div>
      </div>
      <div>
        <Label htmlFor="maxBlockBodyLength">maxBlockBodyLength</Label>
        <Input
          id="maxBlockBodyLength"
          type="text"
          value={form.maxBlockBodyLength}
          onChange={(e) => update("maxBlockBodyLength", e.target.value)}
        />
      </div>
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <Switch
            id="canEditOwnBlocks"
            checked={form.canEditOwnBlocks}
            onCheckedChange={(v) => update("canEditOwnBlocks", v)}
          />
          <Label htmlFor="canEditOwnBlocks">canEditOwnBlocks</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="canDeleteOwnBlocks"
            checked={form.canDeleteOwnBlocks}
            onCheckedChange={(v) => update("canDeleteOwnBlocks", v)}
          />
          <Label htmlFor="canDeleteOwnBlocks">canDeleteOwnBlocks</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="threadsEnabled"
            checked={form.threadsEnabled}
            onCheckedChange={(v) => update("threadsEnabled", v)}
          />
          <Label htmlFor="threadsEnabled">threadsEnabled</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="readOnly"
            checked={form.readOnly}
            onCheckedChange={(v) => update("readOnly", v)}
          />
          <Label htmlFor="readOnly">readOnly</Label>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label htmlFor="editWindowSeconds">editWindowSeconds</Label>
          <Input
            id="editWindowSeconds"
            type="text"
            value={form.editWindowSeconds}
            onChange={(e) => update("editWindowSeconds", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="maxThreadDepth">maxThreadDepth</Label>
          <Input
            id="maxThreadDepth"
            type="text"
            value={form.maxThreadDepth}
            onChange={(e) => update("maxThreadDepth", e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
