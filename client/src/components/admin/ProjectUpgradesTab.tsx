import { useState, useMemo, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  ChevronDown, ChevronUp, Edit, Eye, EyeOff, Plus, Trash2, Sparkles, Loader2, RefreshCw, Check, X, DollarSign, Camera, Upload,
} from "lucide-react";

type Override = {
  id: number;
  projectId: number;
  itemKey: string;
  label: string;
  category: string;
  unit: "each" | "lm" | "m2" | "fixed";
  tier1Label: string | null;
  tier2Label: string | null;
  tier3Label: string | null;
  tier1Description: string | null;
  tier2Description: string | null;
  tier3Description: string | null;
  tier1ImageUrl: string | null;
  tier2ImageUrl: string | null;
  tier3ImageUrl: string | null;
  tier2CostPerUnit: string | null;
  tier3CostPerUnit: string | null;
  baseQty: string | null;
  tier2Qty: number | null;
  tier3Qty: number | null;
  enabled: boolean;
  isCustom: boolean;
  position: number;
};

const UNIT_LABELS: Record<string, string> = { each: "ea", lm: "lm", m2: "m²", fixed: "fixed" };
const TIER_NAMES = ["", "Built for Excellence", "Tailored Living", "Signature Series"];

// ─── Image Upload Hook ──────────────────────────────────────────────────────
function useImageUpload(onUploaded: (url: string) => void) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = trpc.upload.getUploadUrl.useMutation();

  const trigger = () => inputRef.current?.click();

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file"); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error("Image must be under 10MB"); return; }
    setUploading(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const { url } = await uploadMutation.mutateAsync({
        fileName: file.name, mimeType: file.type, fileData: base64, folder: "project-upgrades",
      });
      onUploaded(url);
      toast.success("Image uploaded");
    } catch (e: any) {
      toast.error("Upload failed: " + (e.message || "Unknown error"));
    } finally {
      setUploading(false);
    }
  };

  const FileInput = (
    <input ref={inputRef} type="file" accept="image/*" className="hidden"
      onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />
  );

  return { trigger, uploading, FileInput };
}

// ─── Tier Image Upload ──────────────────────────────────────────────────────
function TierImageUpload({ label, imageUrl, onUpload, color }: {
  label: string; imageUrl: string | null; onUpload: (url: string) => void; color: string;
}) {
  const { trigger, uploading, FileInput } = useImageUpload(onUpload);
  return (
    <div className="flex flex-col items-center gap-1">
      {FileInput}
      <div
        className="w-16 h-16 rounded-lg border-2 border-dashed flex items-center justify-center overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
        style={{ borderColor: imageUrl ? color : "var(--border)", background: imageUrl ? "transparent" : "var(--muted)" }}
        onClick={trigger}
        title={`Upload ${label} image`}
      >
        {uploading ? (
          <Loader2 size={16} className="animate-spin text-muted-foreground" />
        ) : imageUrl ? (
          <img src={imageUrl} alt={label} className="w-full h-full object-cover rounded-md" />
        ) : (
          <Camera size={16} className="text-muted-foreground" />
        )}
      </div>
      <span className="text-[10px] font-medium" style={{ color }}>{label}</span>
    </div>
  );
}

function formatCurrency(n: number) {
  return n.toLocaleString("en-AU", { style: "currency", currency: "AUD", minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function calcItemCost(item: Override, tier: 2 | 3): number {
  const qty = parseFloat(item.baseQty || "0") || 1;
  const cost = parseFloat(tier === 2 ? (item.tier2CostPerUnit || "0") : (item.tier3CostPerUnit || "0"));
  // Electrical items with override qty
  const isElec = item.category.toLowerCase() === "electrical";
  const tQty = tier === 2 ? (item.tier2Qty ?? 0) : (item.tier3Qty ?? 0);
  if (isElec && tQty > 0) {
    if (tier === 2) return Math.max(0, tQty - qty) * cost;
    return tQty * cost;
  }
  return qty * cost;
}

// ─── AI Description Suggestions ──────────────────────────────────────────────
function AiDescriptionButton({ itemName, category, tierNumber, tierLabel, currentDescription, unit, onSelect }: {
  itemName: string; category: string; tierNumber: number; tierLabel?: string; currentDescription?: string; unit?: string;
  onSelect: (text: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<{ label: string; text: string }[]>([]);
  const generateMutation = trpc.pricingRules.generateDescription.useMutation({
    onSuccess: (data) => setSuggestions(data.suggestions || []),
    onError: (e) => toast.error(e.message),
  });

  const handleGenerate = () => {
    setOpen(true);
    setSuggestions([]);
    generateMutation.mutate({ itemName, category, tierNumber, tierLabel: tierLabel || undefined, currentDescription: currentDescription || undefined, unit: unit || undefined });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <button type="button" onClick={handleGenerate} className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border border-purple-200 text-purple-600 hover:bg-purple-50 transition-colors" style={{ fontFamily: "Lato, sans-serif" }}>
        <Sparkles size={10} /> AI Write
      </button>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm" style={{ fontFamily: "Lato, sans-serif", color: "var(--bm-petrol)" }}>
            AI Description — {itemName} (Tier {tierNumber})
          </DialogTitle>
        </DialogHeader>
        {generateMutation.isPending ? (
          <div className="flex items-center justify-center py-8 gap-2 text-sm text-muted-foreground">
            <Loader2 size={16} className="animate-spin" /> Generating...
          </div>
        ) : (
          <div className="space-y-2">
            {suggestions.map((s, i) => (
              <button key={i} onClick={() => { onSelect(s.text); setOpen(false); }} className="w-full text-left p-3 rounded border hover:border-[var(--bm-petrol)] hover:bg-muted/30 transition-colors" style={{ borderColor: "var(--border)" }}>
                <div className="text-[10px] font-medium text-muted-foreground mb-1" style={{ fontFamily: "Lato, sans-serif" }}>{s.label}</div>
                <div className="text-xs" style={{ fontFamily: "Lato, sans-serif" }}>{s.text}</div>
              </button>
            ))}
            <Button size="sm" variant="outline" onClick={handleGenerate} className="w-full gap-1.5 text-xs" style={{ fontFamily: "Lato, sans-serif" }}>
              <RefreshCw size={12} /> Regenerate
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Inline Qty Editor ──────────────────────────────────────────────────────
function InlineQtyInput({ item, onSave }: { item: Override; onSave: (baseQty: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(item.baseQty || "0");

  if (!editing) {
    return (
      <button
        onClick={() => { setVal(item.baseQty || "0"); setEditing(true); }}
        className="text-xs px-1.5 py-0.5 rounded border hover:bg-muted/50 transition-colors tabular-nums"
        style={{ fontFamily: "Lato, sans-serif", borderColor: "var(--border)", minWidth: 50, textAlign: "center" }}
        title="Click to edit quantity"
      >
        {parseFloat(item.baseQty || "0") || (item.unit === "fixed" ? "1" : "0")} {UNIT_LABELS[item.unit] || item.unit}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <Input
        type="number"
        step="0.1"
        value={val}
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => {
          if (e.key === "Enter") { onSave(val); setEditing(false); }
          if (e.key === "Escape") setEditing(false);
        }}
        className="h-6 w-16 text-xs text-center"
        style={{ fontFamily: "Lato, sans-serif" }}
        autoFocus
      />
      <button onClick={() => { onSave(val); setEditing(false); }} className="p-0.5 rounded hover:bg-green-100 text-green-600"><Check size={12} /></button>
      <button onClick={() => setEditing(false)} className="p-0.5 rounded hover:bg-red-100 text-red-500"><X size={12} /></button>
    </div>
  );
}

// ─── Single Item Editor ──────────────────────────────────────────────────────
function ItemEditor({ item, onSave, onCancel }: { item: Override; onSave: (data: Partial<Override>) => void; onCancel: () => void }) {
  const [form, setForm] = useState({
    label: item.label,
    unit: item.unit,
    baseQty: item.baseQty || "0",
    tier1Label: item.tier1Label || "",
    tier2Label: item.tier2Label || "",
    tier3Label: item.tier3Label || "",
    tier1Description: item.tier1Description || "",
    tier2Description: item.tier2Description || "",
    tier3Description: item.tier3Description || "",
    tier1ImageUrl: item.tier1ImageUrl || "",
    tier2ImageUrl: item.tier2ImageUrl || "",
    tier3ImageUrl: item.tier3ImageUrl || "",
    tier2CostPerUnit: item.tier2CostPerUnit || "0",
    tier3CostPerUnit: item.tier3CostPerUnit || "0",
    tier2Qty: item.tier2Qty ?? 0,
    tier3Qty: item.tier3Qty ?? 0,
  });

  const update = (key: string, value: any) => setForm(f => ({ ...f, [key]: value }));

  // Live cost preview
  const previewQty = parseFloat(form.baseQty) || 1;
  const previewT2 = parseFloat(form.tier2CostPerUnit) * previewQty;
  const previewT3 = parseFloat(form.tier3CostPerUnit) * previewQty;

  const tierConfigs = [
    { num: 1, name: "Built for Excellence", labelKey: "tier1Label", descKey: "tier1Description", imgKey: "tier1ImageUrl", costKey: null, qtyKey: null },
    { num: 2, name: "Tailored Living", labelKey: "tier2Label", descKey: "tier2Description", imgKey: "tier2ImageUrl", costKey: "tier2CostPerUnit", qtyKey: "tier2Qty" },
    { num: 3, name: "Signature Series", labelKey: "tier3Label", descKey: "tier3Description", imgKey: "tier3ImageUrl", costKey: "tier3CostPerUnit", qtyKey: "tier3Qty" },
  ];

  return (
    <div className="px-4 py-4 space-y-4 border-t" style={{ borderColor: "var(--bm-petrol)", background: "oklch(97% 0.003 80)" }}>
      {/* Item header with qty */}
      <div className="grid grid-cols-4 gap-3">
        <div className="col-span-2 space-y-1">
          <Label className="text-[10px]" style={{ fontFamily: "Lato, sans-serif" }}>Item Label</Label>
          <Input value={form.label} onChange={e => update("label", e.target.value)} className="h-8 text-xs" style={{ fontFamily: "Lato, sans-serif" }} />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px]" style={{ fontFamily: "Lato, sans-serif" }}>Unit</Label>
          <Select value={form.unit} onValueChange={v => update("unit", v)}>
            <SelectTrigger className="h-8 text-xs" style={{ fontFamily: "Lato, sans-serif" }}><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="each">Each</SelectItem>
              <SelectItem value="lm">Linear Metre</SelectItem>
              <SelectItem value="m2">Square Metre</SelectItem>
              <SelectItem value="fixed">Fixed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-[10px]" style={{ fontFamily: "Lato, sans-serif" }}>Quantity</Label>
          <Input type="number" step="0.1" value={form.baseQty} onChange={e => update("baseQty", e.target.value)} className="h-8 text-xs" style={{ fontFamily: "Lato, sans-serif" }} />
        </div>
      </div>

      {/* Live cost preview */}
      <div className="flex items-center gap-4 px-3 py-2 rounded text-xs" style={{ background: "oklch(95% 0.01 200)", fontFamily: "Lato, sans-serif" }}>
        <DollarSign size={13} style={{ color: "var(--bm-petrol)" }} />
        <span className="text-muted-foreground">Live Cost Preview:</span>
        <span>T2 upgrade: <strong style={{ color: "var(--bm-petrol)" }}>{formatCurrency(previewT2)}</strong></span>
        <span>T3 upgrade: <strong style={{ color: "var(--bm-petrol)" }}>{formatCurrency(previewT3)}</strong></span>
        <span className="text-muted-foreground">({previewQty} {UNIT_LABELS[form.unit] || form.unit} × rate)</span>
      </div>

      {tierConfigs.map(tier => (
        <div key={tier.num} className="border rounded p-3 space-y-2" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center justify-between">
            <h5 className="text-xs font-medium" style={{ fontFamily: "Lato, sans-serif", color: "var(--bm-petrol)" }}>
              Tier {tier.num} — {tier.name}
            </h5>
            <AiDescriptionButton
              itemName={form.label}
              category={item.category}
              tierNumber={tier.num}
              tierLabel={(form as any)[tier.labelKey]}
              currentDescription={(form as any)[tier.descKey]}
              unit={form.unit}
              onSelect={text => update(tier.descKey, text)}
            />
          </div>
          <div className="grid grid-cols-[1fr_auto] gap-3 items-start">
            <div className="space-y-2">
              <div className="space-y-1">
                <Label className="text-[10px]" style={{ fontFamily: "Lato, sans-serif" }}>Tier Label / Product</Label>
                <Input value={(form as any)[tier.labelKey]} onChange={e => update(tier.labelKey, e.target.value)} className="h-7 text-xs" style={{ fontFamily: "Lato, sans-serif" }} placeholder="e.g. Laminate Flat" />
              </div>
            </div>
            <TierImageUpload
              label={`Tier ${tier.num}`}
              imageUrl={(form as any)[tier.imgKey] || null}
              onUpload={url => update(tier.imgKey, url)}
              color={tier.num === 1 ? "var(--bm-petrol)" : tier.num === 2 ? "#d97706" : "#9333ea"}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px]" style={{ fontFamily: "Lato, sans-serif" }}>Description</Label>
            <Textarea value={(form as any)[tier.descKey]} onChange={e => update(tier.descKey, e.target.value)} rows={2} className="text-xs resize-none" style={{ fontFamily: "Lato, sans-serif" }} placeholder="Product description..." />
          </div>
          {tier.costKey && (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[10px]" style={{ fontFamily: "Lato, sans-serif" }}>Cost Per Unit ($)</Label>
                <Input type="number" step="0.01" value={(form as any)[tier.costKey]} onChange={e => update(tier.costKey, e.target.value)} className="h-7 text-xs" style={{ fontFamily: "Lato, sans-serif" }} />
              </div>
              {tier.qtyKey && (
                <div className="space-y-1">
                  <Label className="text-[10px]" style={{ fontFamily: "Lato, sans-serif" }}>Override Qty (electrical only, 0 = use base)</Label>
                  <Input type="number" value={(form as any)[tier.qtyKey]} onChange={e => update(tier.qtyKey, parseInt(e.target.value) || 0)} className="h-7 text-xs" style={{ fontFamily: "Lato, sans-serif" }} />
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      <div className="flex gap-2">
        <Button size="sm" onClick={() => onSave(form)} className="gap-1.5 text-xs" style={{ background: "var(--bm-petrol)", fontFamily: "Lato, sans-serif" }}>
          <Check size={12} /> Save Changes
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel} className="text-xs" style={{ fontFamily: "Lato, sans-serif" }}>Cancel</Button>
      </div>
    </div>
  );
}

// ─── Add Custom Item Dialog ──────────────────────────────────────────────────
function AddCustomItemDialog({ projectId, position, onSuccess }: { projectId: number; position: number; onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ label: "", category: "", unit: "fixed" as const, tier1Label: "", tier2Label: "", tier3Label: "", tier2CostPerUnit: "0", tier3CostPerUnit: "0", baseQty: "1" });
  const upsertMutation = trpc.projectOverrides.upsert.useMutation({
    onSuccess: () => { toast.success("Custom item added"); setOpen(false); setForm({ label: "", category: "", unit: "fixed", tier1Label: "", tier2Label: "", tier3Label: "", tier2CostPerUnit: "0", tier3CostPerUnit: "0", baseQty: "1" }); onSuccess(); },
    onError: (e) => toast.error(e.message),
  });

  const CATEGORIES = ["Joinery", "Tiles & Stone", "Bathroom & Kitchen Fixtures", "Door Hardware", "Appliances", "Driveway", "Electrical",
    "Plasterboard", "Fixout Material", "Air Conditioning", "Garage Doors", "Staircases", "Insulation", "Other"];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5 text-xs" style={{ fontFamily: "Lato, sans-serif" }}>
          <Plus size={13} /> Add Custom Item
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm" style={{ fontFamily: "Lato, sans-serif", color: "var(--bm-petrol)" }}>Add Custom Upgrade Item</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs" style={{ fontFamily: "Lato, sans-serif" }}>Item Name</Label>
            <Input value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} className="h-8 text-sm" style={{ fontFamily: "Lato, sans-serif" }} placeholder="e.g. Custom Feature Wall" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs" style={{ fontFamily: "Lato, sans-serif" }}>Category</Label>
              <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                <SelectTrigger className="h-8 text-xs" style={{ fontFamily: "Lato, sans-serif" }}><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs" style={{ fontFamily: "Lato, sans-serif" }}>Unit</Label>
              <Select value={form.unit} onValueChange={v => setForm(f => ({ ...f, unit: v as any }))}>
                <SelectTrigger className="h-8 text-xs" style={{ fontFamily: "Lato, sans-serif" }}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="each">Each</SelectItem>
                  <SelectItem value="lm">Linear Metre</SelectItem>
                  <SelectItem value="m2">Square Metre</SelectItem>
                  <SelectItem value="fixed">Fixed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs" style={{ fontFamily: "Lato, sans-serif" }}>Quantity</Label>
              <Input type="number" step="0.1" value={form.baseQty} onChange={e => setForm(f => ({ ...f, baseQty: e.target.value }))} className="h-8 text-sm" style={{ fontFamily: "Lato, sans-serif" }} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label className="text-[10px]" style={{ fontFamily: "Lato, sans-serif" }}>Tier 1 Label</Label>
              <Input value={form.tier1Label} onChange={e => setForm(f => ({ ...f, tier1Label: e.target.value }))} className="h-7 text-xs" style={{ fontFamily: "Lato, sans-serif" }} placeholder="Standard" />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px]" style={{ fontFamily: "Lato, sans-serif" }}>Tier 2 Label</Label>
              <Input value={form.tier2Label} onChange={e => setForm(f => ({ ...f, tier2Label: e.target.value }))} className="h-7 text-xs" style={{ fontFamily: "Lato, sans-serif" }} placeholder="Upgrade" />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px]" style={{ fontFamily: "Lato, sans-serif" }}>Tier 3 Label</Label>
              <Input value={form.tier3Label} onChange={e => setForm(f => ({ ...f, tier3Label: e.target.value }))} className="h-7 text-xs" style={{ fontFamily: "Lato, sans-serif" }} placeholder="Premium" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs" style={{ fontFamily: "Lato, sans-serif" }}>Tier 2 Cost ($)</Label>
              <Input type="number" step="0.01" value={form.tier2CostPerUnit} onChange={e => setForm(f => ({ ...f, tier2CostPerUnit: e.target.value }))} className="h-8 text-sm" style={{ fontFamily: "Lato, sans-serif" }} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs" style={{ fontFamily: "Lato, sans-serif" }}>Tier 3 Cost ($)</Label>
              <Input type="number" step="0.01" value={form.tier3CostPerUnit} onChange={e => setForm(f => ({ ...f, tier3CostPerUnit: e.target.value }))} className="h-8 text-sm" style={{ fontFamily: "Lato, sans-serif" }} />
            </div>
          </div>
          <Button onClick={() => {
            if (!form.label || !form.category) { toast.error("Name and category required"); return; }
            const itemKey = `custom_${form.label.toLowerCase().replace(/[^a-z0-9]+/g, "_")}_${Date.now()}`;
            upsertMutation.mutate({ projectId, itemKey, label: form.label, category: form.category, unit: form.unit, tier1Label: form.tier1Label || null, tier2Label: form.tier2Label || null, tier3Label: form.tier3Label || null, tier2CostPerUnit: form.tier2CostPerUnit, tier3CostPerUnit: form.tier3CostPerUnit, baseQty: form.baseQty, enabled: true, isCustom: true, position });
          }} disabled={!form.label || !form.category || upsertMutation.isPending} className="w-full gap-1.5 text-xs" style={{ background: "var(--bm-petrol)", fontFamily: "Lato, sans-serif" }}>
            {upsertMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />} Add Item
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function ProjectUpgradesTab({ projectId }: { projectId: number }) {
  const utils = trpc.useUtils();
  const { data: overrides, isLoading } = trpc.projectOverrides.list.useQuery({ projectId });
  const { data: project } = trpc.projects.get.useQuery({ id: projectId });

  const seedMutation = trpc.projectOverrides.seed.useMutation({
    onSuccess: (data) => {
      utils.projectOverrides.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });
  const upsertMutation = trpc.projectOverrides.upsert.useMutation({
    onSuccess: () => { toast.success("Item updated"); utils.projectOverrides.list.invalidate(); setEditingId(null); },
    onError: (e) => toast.error(e.message),
  });
  const qtyMutation = trpc.projectOverrides.upsert.useMutation({
    onSuccess: () => { utils.projectOverrides.list.invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const toggleMutation = trpc.projectOverrides.toggle.useMutation({
    onSuccess: () => utils.projectOverrides.list.invalidate(),
    onError: (e) => toast.error(e.message),
  });
  const toggleCategoryMutation = trpc.projectOverrides.toggleCategory.useMutation({
    onSuccess: () => { utils.projectOverrides.list.invalidate(); toast.success("Category updated"); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.projectOverrides.delete.useMutation({
    onSuccess: () => { toast.success("Item deleted"); utils.projectOverrides.list.invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const updateProjectMutation = trpc.projects.update.useMutation({
    onSuccess: () => { toast.success("Starting tier updated"); utils.projects.get.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const [editingId, setEditingId] = useState<number | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [showQtyTable, setShowQtyTable] = useState(false);

  const startingTier = project?.startingTier ?? 1;

  // Group overrides by category
  const grouped = useMemo(() => {
    if (!overrides) return [];
    const map = new Map<string, Override[]>();
    for (const o of overrides) {
      const cat = o.category;
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(o as Override);
    }
    return Array.from(map.entries()).map(([category, items]) => ({ category, items }));
  }, [overrides]);

  // Calculate totals
  const totals = useMemo(() => {
    if (!overrides) return { t2: 0, t3: 0, enabledCount: 0, totalCount: 0 };
    let t2 = 0, t3 = 0;
    const enabled = overrides.filter(o => o.enabled);
    for (const item of enabled as Override[]) {
      t2 += calcItemCost(item, 2);
      t3 += calcItemCost(item, 3);
    }
    return { t2, t3, enabledCount: enabled.length, totalCount: overrides.length };
  }, [overrides]);

  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat); else next.add(cat);
      return next;
    });
  };

  const handleSave = (item: Override, data: Partial<Override>) => {
    upsertMutation.mutate({
      id: item.id,
      projectId: item.projectId,
      itemKey: item.itemKey,
      label: data.label || item.label,
      category: item.category,
      unit: (data.unit || item.unit) as any,
      tier1Label: data.tier1Label ?? item.tier1Label,
      tier2Label: data.tier2Label ?? item.tier2Label,
      tier3Label: data.tier3Label ?? item.tier3Label,
      tier1Description: data.tier1Description ?? item.tier1Description,
      tier2Description: data.tier2Description ?? item.tier2Description,
      tier3Description: data.tier3Description ?? item.tier3Description,
      tier1ImageUrl: data.tier1ImageUrl ?? item.tier1ImageUrl,
      tier2ImageUrl: data.tier2ImageUrl ?? item.tier2ImageUrl,
      tier3ImageUrl: data.tier3ImageUrl ?? item.tier3ImageUrl,
      tier2CostPerUnit: data.tier2CostPerUnit ?? item.tier2CostPerUnit ?? "0",
      tier3CostPerUnit: data.tier3CostPerUnit ?? item.tier3CostPerUnit ?? "0",
      baseQty: data.baseQty ?? item.baseQty ?? "0",
      tier2Qty: data.tier2Qty ?? item.tier2Qty,
      tier3Qty: data.tier3Qty ?? item.tier3Qty,
      enabled: item.enabled,
      isCustom: item.isCustom,
      position: item.position,
    });
  };

  const handleQtySave = (item: Override, baseQty: string) => {
    qtyMutation.mutate({
      id: item.id,
      projectId: item.projectId,
      itemKey: item.itemKey,
      label: item.label,
      category: item.category,
      unit: item.unit,
      baseQty,
      tier2CostPerUnit: item.tier2CostPerUnit ?? "0",
      tier3CostPerUnit: item.tier3CostPerUnit ?? "0",
      enabled: item.enabled,
      isCustom: item.isCustom,
      position: item.position,
    });
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-12 text-sm text-muted-foreground gap-2"><Loader2 size={16} className="animate-spin" /> Loading...</div>;
  }

  // No overrides yet — show seed button
  if (!overrides || overrides.length === 0) {
    return (
      <div className="text-center py-12 space-y-4">
        <div className="text-sm text-muted-foreground" style={{ fontFamily: "Lato, sans-serif" }}>
          No project-specific upgrades yet. Seed from the Inclusions Library to get started.
        </div>
        <Button onClick={() => seedMutation.mutate({ projectId })} disabled={seedMutation.isPending} className="gap-1.5" style={{ background: "var(--bm-petrol)", fontFamily: "Lato, sans-serif" }}>
          {seedMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />} Seed from Library
        </Button>
      </div>
    );
  }

  const customCount = overrides.filter(o => o.isCustom).length;
  const basePrice = parseFloat(project?.baseContractPrice || "0");

  return (
    <div className="space-y-3">
      {/* Header: Starting Tier + Totals */}
      <div className="flex items-start justify-between flex-wrap gap-3 p-3 rounded border" style={{ borderColor: "var(--border)", background: "oklch(96% 0.005 200)" }}>
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Label className="text-xs font-medium" style={{ fontFamily: "Lato, sans-serif", color: "var(--bm-petrol)" }}>Starting Tier</Label>
            <Select value={String(startingTier)} onValueChange={v => updateProjectMutation.mutate({ id: projectId, startingTier: parseInt(v) })}>
              <SelectTrigger className="h-8 w-52 text-xs bg-white" style={{ fontFamily: "Lato, sans-serif" }}><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Tier 1 — Built for Excellence</SelectItem>
                <SelectItem value="2">Tier 2 — Tailored Living</SelectItem>
                <SelectItem value="3">Tier 3 — Signature Series</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-[10px] text-muted-foreground" style={{ fontFamily: "Lato, sans-serif" }}>
            Clients will see tiers above the starting tier as upgrades. Tiers at or below are included in base price.
          </p>
        </div>

        <div className="text-right space-y-1">
          <div className="text-[10px] text-muted-foreground" style={{ fontFamily: "Lato, sans-serif" }}>
            {totals.enabledCount} of {totals.totalCount} items enabled
            {customCount > 0 && ` · ${customCount} custom`}
          </div>
          <div className="flex items-center gap-4 text-xs" style={{ fontFamily: "Lato, sans-serif" }}>
            <span>T2 total: <strong style={{ color: "var(--bm-petrol)" }}>{formatCurrency(totals.t2)}</strong></span>
            <span>T3 total: <strong style={{ color: "var(--bm-petrol)" }}>{formatCurrency(totals.t3)}</strong></span>
          </div>
          {basePrice > 0 && (
            <div className="flex items-center gap-4 text-[10px] text-muted-foreground" style={{ fontFamily: "Lato, sans-serif" }}>
              <span>T2 package: {formatCurrency(basePrice + totals.t2)}</span>
              <span>T3 package: {formatCurrency(basePrice + totals.t3)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Quantities Summary Table */}
      <div className="border rounded overflow-hidden" style={{ borderColor: "var(--border)" }}>
        <button
          onClick={() => setShowQtyTable(!showQtyTable)}
          className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-muted/30 transition-colors"
          style={{ background: "var(--bm-stone, oklch(93% 0.008 80))" }}
        >
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm" style={{ fontFamily: "Lato, sans-serif", color: "var(--bm-petrol)" }}>Quantities Summary</span>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{totals.enabledCount} items</Badge>
          </div>
          {showQtyTable ? <ChevronUp size={15} className="text-muted-foreground" /> : <ChevronDown size={15} className="text-muted-foreground" />}
        </button>
        {showQtyTable && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs" style={{ fontFamily: "Lato, sans-serif" }}>
              <thead>
                <tr className="border-b" style={{ borderColor: "var(--border)", background: "oklch(97% 0.003 200)" }}>
                  <th className="text-left px-4 py-2 font-medium" style={{ color: "var(--bm-petrol)" }}>Item</th>
                  <th className="text-left px-3 py-2 font-medium" style={{ color: "var(--bm-petrol)" }}>Category</th>
                  <th className="text-center px-3 py-2 font-medium" style={{ color: "var(--bm-petrol)" }}>Qty</th>
                  <th className="text-center px-3 py-2 font-medium" style={{ color: "var(--bm-petrol)" }}>Unit</th>
                  <th className="text-right px-3 py-2 font-medium" style={{ color: "var(--bm-petrol)" }}>T2 Cost/Unit</th>
                  <th className="text-right px-3 py-2 font-medium" style={{ color: "var(--bm-petrol)" }}>T3 Cost/Unit</th>
                  <th className="text-right px-4 py-2 font-medium" style={{ color: "var(--bm-petrol)" }}>T2 Total</th>
                  <th className="text-right px-4 py-2 font-medium" style={{ color: "var(--bm-petrol)" }}>T3 Total</th>
                </tr>
              </thead>
              <tbody>
                {grouped.map(({ category, items }) => {
                  const enabledItems = items.filter(i => i.enabled);
                  if (enabledItems.length === 0) return null;
                  return enabledItems.map((item, idx) => (
                    <tr key={item.id} className={`border-b hover:bg-muted/20 transition-colors ${idx === 0 ? "" : ""}`} style={{ borderColor: "var(--border)" }}>
                      <td className="px-4 py-1.5 font-medium">{item.label}</td>
                      <td className="px-3 py-1.5 text-muted-foreground">{idx === 0 ? category : ""}</td>
                      <td className="px-3 py-1.5 text-center">
                        <InlineQtyInput item={item as Override} onSave={(baseQty) => handleQtySave(item as Override, baseQty)} />
                      </td>
                      <td className="px-3 py-1.5 text-center text-muted-foreground">{UNIT_LABELS[item.unit] || item.unit}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums text-muted-foreground">${parseFloat(item.tier2CostPerUnit || "0").toLocaleString("en-AU", { minimumFractionDigits: 0 })}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums text-muted-foreground">${parseFloat(item.tier3CostPerUnit || "0").toLocaleString("en-AU", { minimumFractionDigits: 0 })}</td>
                      <td className="px-4 py-1.5 text-right tabular-nums font-medium">{formatCurrency(calcItemCost(item as Override, 2))}</td>
                      <td className="px-4 py-1.5 text-right tabular-nums font-medium">{formatCurrency(calcItemCost(item as Override, 3))}</td>
                    </tr>
                  ));
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 font-semibold" style={{ borderColor: "var(--bm-petrol)", background: "oklch(96% 0.005 200)" }}>
                  <td className="px-4 py-2" colSpan={6} style={{ color: "var(--bm-petrol)" }}>Total</td>
                  <td className="px-4 py-2 text-right tabular-nums" style={{ color: "var(--bm-petrol)" }}>{formatCurrency(totals.t2)}</td>
                  <td className="px-4 py-2 text-right tabular-nums" style={{ color: "var(--bm-petrol)" }}>{formatCurrency(totals.t3)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <AddCustomItemDialog projectId={projectId} position={overrides.length} onSuccess={() => utils.projectOverrides.list.invalidate()} />
        <Button size="sm" variant="outline" onClick={() => {
          if (confirm("Re-sync will update all library items with the latest values (labels, descriptions, images, costs). Per-project quantities and enabled/disabled states are preserved. New library items will be added, removed items will be deleted. Continue?")) {
            seedMutation.mutate({ projectId }, {
              onSuccess: (data: any) => {
                if (data.added || data.updated || data.removed) {
                  const parts = [];
                  if (data.updated) parts.push(`${data.updated} updated`);
                  if (data.added) parts.push(`${data.added} added`);
                  if (data.removed) parts.push(`${data.removed} removed`);
                  alert(`Library sync complete: ${parts.join(", ")}`);
                } else {
                  alert("Library sync complete — no changes needed.");
                }
              },
            });
          }
        }} disabled={seedMutation.isPending} className="gap-1.5 text-xs" style={{ fontFamily: "Lato, sans-serif" }}>
          <RefreshCw size={12} className={seedMutation.isPending ? "animate-spin" : ""} /> {seedMutation.isPending ? "Syncing..." : "Re-sync Library"}
        </Button>
      </div>

      {/* Categories */}
      {grouped.map(({ category, items }) => {
        const isExpanded = expandedCategories.has(category);
        const enabledInCat = items.filter(i => i.enabled).length;
        const allEnabled = enabledInCat === items.length;
        const noneEnabled = enabledInCat === 0;
        const catT2 = items.filter(i => i.enabled).reduce((sum, i) => sum + calcItemCost(i, 2), 0);
        const catT3 = items.filter(i => i.enabled).reduce((sum, i) => sum + calcItemCost(i, 3), 0);
        return (
          <div key={category} className={`bg-card border rounded overflow-hidden ${noneEnabled ? "opacity-60" : ""}`} style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/30 transition-colors" style={{ background: "var(--bm-stone, oklch(93% 0.008 80))" }}>
              <div className="flex items-center gap-3 cursor-pointer flex-1" onClick={() => toggleCategory(category)}>
                <span className="font-medium text-sm" style={{ fontFamily: "Lato, sans-serif", color: noneEnabled ? "var(--muted-foreground)" : "var(--bm-petrol)" }}>{category}</span>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{enabledInCat}/{items.length}</Badge>
              </div>
              <div className="flex items-center gap-3">
                {!noneEnabled && (
                  <span className="text-[10px] text-muted-foreground tabular-nums" style={{ fontFamily: "Lato, sans-serif" }}>
                    T2: {formatCurrency(catT2)} · T3: {formatCurrency(catT3)}
                  </span>
                )}
                <Switch
                  checked={allEnabled}
                  onCheckedChange={(checked) => {
                    toggleCategoryMutation.mutate({ projectId, category, enabled: checked });
                  }}
                  className="data-[state=checked]:bg-[var(--bm-petrol)]"
                  title={allEnabled ? "Disable all items in this category" : "Enable all items in this category"}
                />
                <button onClick={() => toggleCategory(category)} className="p-0.5">
                  {isExpanded ? <ChevronUp size={15} className="text-muted-foreground" /> : <ChevronDown size={15} className="text-muted-foreground" />}
                </button>
              </div>
            </div>

            {isExpanded && (
              <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                {items.map(item => (
                  <div key={item.id}>
                    <div className={`flex items-center gap-3 px-4 py-2.5 ${!item.enabled ? "opacity-50" : ""}`}>
                      {/* Thumbnail */}
                      {item.tier1ImageUrl && <img src={item.tier1ImageUrl} className="w-10 h-8 object-cover rounded shrink-0" />}

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium" style={{ fontFamily: "Lato, sans-serif" }}>{item.label}</span>
                          {item.isCustom && <Badge variant="outline" className="text-[9px] px-1 py-0 border-purple-300 text-purple-600">Custom</Badge>}
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5 flex gap-3" style={{ fontFamily: "Lato, sans-serif" }}>
                          {item.tier1Label && <span>T1: {item.tier1Label}</span>}
                          {item.tier2Label && <span>T2: {item.tier2Label}</span>}
                          {item.tier3Label && <span>T3: {item.tier3Label}</span>}
                        </div>
                      </div>

                      {/* Qty */}
                      <div className="shrink-0">
                        <InlineQtyInput item={item} onSave={(baseQty) => handleQtySave(item, baseQty)} />
                      </div>

                      {/* Cost display */}
                      <div className="shrink-0 text-right">
                        <div className="text-[10px] text-muted-foreground tabular-nums" style={{ fontFamily: "Lato, sans-serif" }}>
                          T2: {formatCurrency(calcItemCost(item, 2))}
                        </div>
                        <div className="text-[10px] text-muted-foreground tabular-nums" style={{ fontFamily: "Lato, sans-serif" }}>
                          T3: {formatCurrency(calcItemCost(item, 3))}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => toggleMutation.mutate({ id: item.id, enabled: !item.enabled })} className="p-1 rounded hover:bg-muted transition-colors" title={item.enabled ? "Disable" : "Enable"}>
                          {item.enabled ? <Eye size={14} className="text-green-600" /> : <EyeOff size={14} className="text-muted-foreground" />}
                        </button>
                        <button onClick={() => setEditingId(editingId === item.id ? null : item.id)} className="p-1 rounded hover:bg-muted transition-colors" title="Edit">
                          <Edit size={14} style={{ color: editingId === item.id ? "var(--bm-petrol)" : undefined }} />
                        </button>
                        {item.isCustom && (
                          <button onClick={() => { if (confirm(`Delete "${item.label}"?`)) deleteMutation.mutate({ id: item.id }); }} className="p-1 rounded hover:bg-muted transition-colors text-destructive" title="Delete">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Inline editor */}
                    {editingId === item.id && (
                      <ItemEditor item={item} onSave={(data) => handleSave(item, data)} onCancel={() => setEditingId(null)} />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
