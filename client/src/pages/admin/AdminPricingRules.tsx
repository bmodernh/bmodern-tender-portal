import { useState, useMemo, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import AdminLayout from "@/components/admin/AdminLayout";
import {
  Pencil, Check, X, ChevronDown, ChevronUp, DollarSign, Info,
  Plus, Trash2, ImagePlus, Loader2, Camera, Package, Layers
} from "lucide-react";

type PricingRule = {
  id: number;
  itemKey: string;
  label: string;
  category: string;
  unit: string;
  tier1Label: string | null;
  tier1ImageUrl: string | null;
  tier2Label: string | null;
  tier2CostPerUnit: string | null;
  tier2ImageUrl: string | null;
  tier2Description: string | null;
  tier2Qty: number | null;
  tier3Label: string | null;
  tier3CostPerUnit: string | null;
  tier3ImageUrl: string | null;
  tier3Description: string | null;
  tier3Qty: number | null;
  position: number;
};

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
        fileName: file.name, mimeType: file.type, fileData: base64, folder: "inclusion-library",
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

// ─── Tier Image Thumbnail ───────────────────────────────────────────────────
function TierImageUpload({ label, imageUrl, onUpload, color }: {
  label: string; imageUrl: string | null; onUpload: (url: string) => void; color: string;
}) {
  const { trigger, uploading, FileInput } = useImageUpload(onUpload);
  return (
    <div className="flex flex-col items-center gap-1">
      {FileInput}
      <div
        className="w-20 h-20 rounded-lg border-2 border-dashed flex items-center justify-center overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
        style={{ borderColor: imageUrl ? color : "var(--border)", background: imageUrl ? "transparent" : "var(--muted)" }}
        onClick={trigger}
        title={`Upload ${label} image`}
      >
        {uploading ? (
          <Loader2 size={18} className="animate-spin text-muted-foreground" />
        ) : imageUrl ? (
          <img src={imageUrl} alt={label} className="w-full h-full object-cover rounded-md" />
        ) : (
          <Camera size={18} className="text-muted-foreground" />
        )}
      </div>
      <span className="text-[10px] font-medium" style={{ color }}>{label}</span>
    </div>
  );
}

// ─── Rule Row ────────────────────────────────────────────────────────────────
function RuleRow({ rule, onSave, onDelete }: {
  rule: PricingRule;
  onSave: (id: number, data: Partial<PricingRule>) => Promise<void>;
  onDelete: (id: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [form, setForm] = useState({
    label: rule.label,
    tier1Label: rule.tier1Label ?? "",
    tier1ImageUrl: rule.tier1ImageUrl ?? "",
    tier2Label: rule.tier2Label ?? "",
    tier2CostPerUnit: rule.tier2CostPerUnit ?? "0",
    tier2Description: rule.tier2Description ?? "",
    tier2ImageUrl: rule.tier2ImageUrl ?? "",
    tier2Qty: rule.tier2Qty ?? 0,
    tier3Label: rule.tier3Label ?? "",
    tier3CostPerUnit: rule.tier3CostPerUnit ?? "0",
    tier3Description: rule.tier3Description ?? "",
    tier3ImageUrl: rule.tier3ImageUrl ?? "",
    tier3Qty: rule.tier3Qty ?? 0,
  });
  const [saving, setSaving] = useState(false);

  const unitLabel = rule.unit === "fixed" ? "fixed cost" : `per ${rule.unit}`;

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(rule.id, {
        label: form.label || rule.label,
        tier1Label: form.tier1Label || null,
        tier1ImageUrl: form.tier1ImageUrl || null,
        tier2Label: form.tier2Label || null,
        tier2CostPerUnit: form.tier2CostPerUnit,
        tier2Description: form.tier2Description || null,
        tier2ImageUrl: form.tier2ImageUrl || null,
        tier2Qty: form.tier2Qty || null,
        tier3Label: form.tier3Label || null,
        tier3CostPerUnit: form.tier3CostPerUnit,
        tier3Description: form.tier3Description || null,
        tier3ImageUrl: form.tier3ImageUrl || null,
        tier3Qty: form.tier3Qty || null,
      } as any);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border rounded-lg overflow-hidden" style={{ borderColor: "var(--border)" }}>
      {/* Header row */}
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-secondary/30 transition-colors"
        style={{ background: "var(--card)" }}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="font-medium text-sm" style={{ fontFamily: "Lato, sans-serif" }}>{rule.label}</span>
          <Badge variant="outline" className="text-xs shrink-0">{unitLabel}</Badge>
          {/* Show tiny tier image previews */}
          <div className="flex gap-1 ml-2">
            {rule.tier1ImageUrl && <img src={rule.tier1ImageUrl} alt="" className="w-6 h-6 rounded object-cover border" style={{ borderColor: "var(--border)" }} />}
            {rule.tier2ImageUrl && <img src={rule.tier2ImageUrl} alt="" className="w-6 h-6 rounded object-cover border border-amber-300" />}
            {rule.tier3ImageUrl && <img src={rule.tier3ImageUrl} alt="" className="w-6 h-6 rounded object-cover border border-purple-300" />}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-muted-foreground hidden sm:inline">
            T2: +${parseFloat(rule.tier2CostPerUnit ?? "0").toLocaleString()}
            {rule.unit !== "fixed" ? `/${rule.unit}` : ""}
            &nbsp;·&nbsp;
            T3: +${parseFloat(rule.tier3CostPerUnit ?? "0").toLocaleString()}
            {rule.unit !== "fixed" ? `/${rule.unit}` : ""}
          </span>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive"
            onClick={e => { e.stopPropagation(); if (confirm(`Delete "${rule.label}"? This cannot be undone.`)) onDelete(rule.id); }}>
            <Trash2 size={13} />
          </Button>
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="p-4 space-y-4 border-t" style={{ borderColor: "var(--border)", background: "var(--muted)" }}>
          {editing ? (
            <div className="space-y-4">
              {/* Item Name */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Item Name</label>
                <Input value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} className="text-sm" />
              </div>

              {/* Tier images row */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Product Images (shown to clients in upgrade comparison)</label>
                <div className="flex gap-4">
                  <TierImageUpload label="Tier 1" imageUrl={form.tier1ImageUrl || null}
                    onUpload={url => setForm(f => ({ ...f, tier1ImageUrl: url }))} color="var(--bm-petrol)" />
                  <TierImageUpload label="Tier 2" imageUrl={form.tier2ImageUrl || null}
                    onUpload={url => setForm(f => ({ ...f, tier2ImageUrl: url }))} color="#d97706" />
                  <TierImageUpload label="Tier 3" imageUrl={form.tier3ImageUrl || null}
                    onUpload={url => setForm(f => ({ ...f, tier3ImageUrl: url }))} color="#9333ea" />
                </div>
              </div>

              {/* Tier 1 */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide mb-1 block" style={{ color: "var(--bm-petrol)" }}>
                  Tier 1 — Built for Excellence (included in base price)
                </label>
                <Input value={form.tier1Label} onChange={e => setForm(f => ({ ...f, tier1Label: e.target.value }))}
                  placeholder="What's included in the base price..." className="text-sm" />
              </div>

              {/* Tier 2 */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-amber-600 uppercase tracking-wide block">Tier 2 — Tailored Living</label>
                <Input value={form.tier2Label} onChange={e => setForm(f => ({ ...f, tier2Label: e.target.value }))}
                  placeholder="Tier 2 specification..." className="text-sm" />
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground shrink-0" />
                  <Input type="number" value={form.tier2CostPerUnit}
                    onChange={e => setForm(f => ({ ...f, tier2CostPerUnit: e.target.value }))}
                    placeholder="Extra cost" className="text-sm w-40" />
                  <span className="text-xs text-muted-foreground">{unitLabel} above Tier 1</span>
                </div>
                {rule.category.toLowerCase() === "electrical" && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-28 shrink-0">Tier 2 qty:</span>
                    <Input type="number" value={form.tier2Qty}
                      onChange={e => setForm(f => ({ ...f, tier2Qty: parseInt(e.target.value) || 0 }))}
                      placeholder="e.g. 40" className="text-sm w-24" />
                  </div>
                )}
                <Textarea value={form.tier2Description}
                  onChange={e => setForm(f => ({ ...f, tier2Description: e.target.value }))}
                  placeholder="Description shown to client..." className="text-sm min-h-[60px]" />
              </div>

              {/* Tier 3 */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-purple-600 uppercase tracking-wide block">Tier 3 — Signature Series</label>
                <Input value={form.tier3Label} onChange={e => setForm(f => ({ ...f, tier3Label: e.target.value }))}
                  placeholder="Tier 3 specification..." className="text-sm" />
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground shrink-0" />
                  <Input type="number" value={form.tier3CostPerUnit}
                    onChange={e => setForm(f => ({ ...f, tier3CostPerUnit: e.target.value }))}
                    placeholder="Extra cost" className="text-sm w-40" />
                  <span className="text-xs text-muted-foreground">{unitLabel} above Tier 1</span>
                </div>
                {rule.category.toLowerCase() === "electrical" && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-28 shrink-0">Tier 3 qty:</span>
                    <Input type="number" value={form.tier3Qty}
                      onChange={e => setForm(f => ({ ...f, tier3Qty: parseInt(e.target.value) || 0 }))}
                      placeholder="e.g. 50" className="text-sm w-24" />
                  </div>
                )}
                <Textarea value={form.tier3Description}
                  onChange={e => setForm(f => ({ ...f, tier3Description: e.target.value }))}
                  placeholder="Description shown to client..." className="text-sm min-h-[60px]" />
              </div>

              <div className="flex gap-2">
                <Button size="sm" onClick={handleSave} disabled={saving} className="text-white" style={{ background: "var(--bm-petrol)" }}>
                  <Check className="h-3 w-3 mr-1" /> {saving ? "Saving..." : "Save Changes"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
                  <X className="h-3 w-3 mr-1" /> Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Tier image previews */}
              {(rule.tier1ImageUrl || rule.tier2ImageUrl || rule.tier3ImageUrl) && (
                <div className="flex gap-3 mb-3">
                  {rule.tier1ImageUrl && (
                    <div className="text-center">
                      <img src={rule.tier1ImageUrl} alt="Tier 1" className="w-24 h-24 rounded-lg object-cover border-2" style={{ borderColor: "var(--bm-petrol)" }} />
                      <span className="text-[10px] font-medium mt-1 block" style={{ color: "var(--bm-petrol)" }}>Tier 1</span>
                    </div>
                  )}
                  {rule.tier2ImageUrl && (
                    <div className="text-center">
                      <img src={rule.tier2ImageUrl} alt="Tier 2" className="w-24 h-24 rounded-lg object-cover border-2 border-amber-400" />
                      <span className="text-[10px] font-medium mt-1 block text-amber-600">Tier 2</span>
                    </div>
                  )}
                  {rule.tier3ImageUrl && (
                    <div className="text-center">
                      <img src={rule.tier3ImageUrl} alt="Tier 3" className="w-24 h-24 rounded-lg object-cover border-2 border-purple-400" />
                      <span className="text-[10px] font-medium mt-1 block text-purple-600">Tier 3</span>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Tier 1 */}
                <div className="rounded-md p-3 border-2" style={{ borderColor: "var(--bm-petrol)", background: "var(--card)" }}>
                  <div className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "var(--bm-petrol)" }}>Tier 1 — Base</div>
                  <div className="text-sm">{rule.tier1Label || <span className="text-muted-foreground italic">Not set</span>}</div>
                  <div className="text-xs text-muted-foreground mt-1">Included in base price</div>
                </div>
                {/* Tier 2 */}
                <div className="rounded-md bg-amber-50 dark:bg-amber-950/20 p-3 border-2 border-amber-300">
                  <div className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-1">Tier 2 — Tailored Living</div>
                  <div className="text-sm">{rule.tier2Label || <span className="text-muted-foreground italic">Not set</span>}</div>
                  <div className="text-xs font-medium text-amber-700 mt-1">
                    +${parseFloat(rule.tier2CostPerUnit ?? "0").toLocaleString()} {unitLabel}
                  </div>
                  {rule.tier2Description && <div className="text-xs text-muted-foreground mt-1">{rule.tier2Description}</div>}
                </div>
                {/* Tier 3 */}
                <div className="rounded-md bg-purple-50 dark:bg-purple-950/20 p-3 border-2 border-purple-300">
                  <div className="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-1">Tier 3 — Signature</div>
                  <div className="text-sm">{rule.tier3Label || <span className="text-muted-foreground italic">Not set</span>}</div>
                  <div className="text-xs font-medium text-purple-700 mt-1">
                    +${parseFloat(rule.tier3CostPerUnit ?? "0").toLocaleString()} {unitLabel}
                  </div>
                  {rule.tier3Description && <div className="text-xs text-muted-foreground mt-1">{rule.tier3Description}</div>}
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                <Pencil className="h-3 w-3 mr-1" /> Edit Item
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Add New Item Form ───────────────────────────────────────────────────────
function AddItemForm({ categories, onAdd, onCancel }: {
  categories: string[];
  onAdd: (data: { itemKey: string; label: string; category: string; unit: string }) => void;
  onCancel: () => void;
}) {
  const [label, setLabel] = useState("");
  const [category, setCategory] = useState(categories[0] || "Electrical");
  const [newCategory, setNewCategory] = useState("");
  const [useNewCategory, setUseNewCategory] = useState(false);
  const [unit, setUnit] = useState("each");

  const handleSubmit = () => {
    if (!label.trim()) return;
    const cat = useNewCategory ? newCategory.trim() : category;
    if (!cat) return;
    const itemKey = label.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
    onAdd({ itemKey, label: label.trim(), category: cat, unit });
  };

  return (
    <div className="border-2 rounded-lg p-4 space-y-3" style={{ borderColor: "var(--bm-petrol)", background: "var(--card)" }}>
      <div className="flex items-center gap-2 mb-2">
        <Plus size={14} style={{ color: "var(--bm-petrol)" }} />
        <span className="text-sm font-semibold" style={{ fontFamily: "var(--font-heading)", color: "var(--bm-petrol)" }}>Add New Inclusion Item</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Item Name *</label>
          <Input value={label} onChange={e => setLabel(e.target.value)} placeholder="e.g. Downlights" className="text-sm" autoFocus />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Unit</label>
          <Select value={unit} onValueChange={setUnit}>
            <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="each">Each</SelectItem>
              <SelectItem value="lm">Linear Metre (lm)</SelectItem>
              <SelectItem value="m2">Square Metre (m²)</SelectItem>
              <SelectItem value="fixed">Fixed Cost</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs text-muted-foreground mb-1 block">Category</label>
          {useNewCategory ? (
            <div className="flex gap-2">
              <Input value={newCategory} onChange={e => setNewCategory(e.target.value)} placeholder="New category name" className="text-sm flex-1" />
              <Button size="sm" variant="ghost" onClick={() => setUseNewCategory(false)} className="text-xs">Use existing</Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-9 text-sm flex-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button size="sm" variant="ghost" onClick={() => setUseNewCategory(true)} className="text-xs" style={{ color: "var(--bm-petrol)" }}>
                <Plus size={12} className="mr-1" /> New
              </Button>
            </div>
          )}
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <Button size="sm" onClick={handleSubmit} disabled={!label.trim()} className="text-white" style={{ background: "var(--bm-petrol)" }}>
          <Check size={12} className="mr-1" /> Add Item
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function AdminPricingRules() {
  const { data: rules, isLoading, refetch } = trpc.pricingRules.list.useQuery();
  const updateMutation = trpc.pricingRules.update.useMutation();
  const createMutation = trpc.pricingRules.create.useMutation();
  const deleteMutation = trpc.pricingRules.delete.useMutation();
  const [showAddForm, setShowAddForm] = useState(false);

  const categories = useMemo(() => {
    if (!rules) return { grouped: [] as [string, PricingRule[]][], names: [] as string[] };
    const map: Record<string, PricingRule[]> = {};
    for (const rule of rules) {
      if (!map[rule.category]) map[rule.category] = [];
      map[rule.category].push(rule as PricingRule);
    }
    return { grouped: Object.entries(map), names: Object.keys(map) };
  }, [rules]);

  const handleSave = async (id: number, data: Partial<PricingRule>) => {
    await updateMutation.mutateAsync({
      id,
      label: data.label as string | undefined,
      tier1Label: data.tier1Label as string | null | undefined,
      tier1ImageUrl: data.tier1ImageUrl as string | null | undefined,
      tier2Label: data.tier2Label as string | null | undefined,
      tier2CostPerUnit: data.tier2CostPerUnit as string | undefined,
      tier2ImageUrl: data.tier2ImageUrl as string | null | undefined,
      tier2Description: data.tier2Description as string | null | undefined,
      tier2Qty: data.tier2Qty as number | null | undefined,
      tier3Label: data.tier3Label as string | null | undefined,
      tier3CostPerUnit: data.tier3CostPerUnit as string | undefined,
      tier3ImageUrl: data.tier3ImageUrl as string | null | undefined,
      tier3Description: data.tier3Description as string | null | undefined,
      tier3Qty: data.tier3Qty as number | null | undefined,
    });
    toast.success("Item updated");
    refetch();
  };

  const handleAdd = async (data: { itemKey: string; label: string; category: string; unit: string }) => {
    try {
      await createMutation.mutateAsync({
        ...data,
        unit: data.unit as "each" | "lm" | "m2" | "fixed",
        position: (rules?.length ?? 0),
      });
      toast.success(`"${data.label}" added to ${data.category}`);
      setShowAddForm(false);
      refetch();
    } catch (e: any) {
      toast.error("Failed to add: " + (e.message || "Unknown error"));
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("Item removed");
      refetch();
    } catch (e: any) {
      toast.error("Failed to delete: " + (e.message || "Unknown error"));
    }
  };

  return (
    <AdminLayout
      title="Inclusions Library"
      breadcrumbs={[
        { label: "Dashboard", href: "/admin" },
        { label: "Inclusions Library" },
      ]}
    >
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl" style={{ fontFamily: "Playfair Display SC, serif", color: "var(--bm-petrol)" }}>
              Inclusions Library
            </h1>
            <p className="text-muted-foreground mt-1 text-sm" style={{ fontFamily: "Lato, sans-serif" }}>
              Manage your standard inclusion items, tier specifications, pricing, and product images.
              When you seed a project's tender, items are pulled from this library.
            </p>
          </div>
          <Button onClick={() => setShowAddForm(true)} className="text-white shrink-0" style={{ background: "var(--bm-petrol)" }}>
            <Plus size={14} className="mr-1.5" /> Add Item
          </Button>
        </div>

        <div className="flex items-start gap-3 p-4 rounded-lg border" style={{ background: "var(--card)", borderColor: "var(--bm-petrol)" }}>
          <Info className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "var(--bm-petrol)" }} />
          <div className="text-sm" style={{ fontFamily: "Lato, sans-serif" }}>
            <strong>How it works:</strong> Each item has 3 tiers. Tier 1 is included in the base price.
            Tiers 2 and 3 are upgrade options with additional costs. Upload product images for each tier
            so clients can visually compare options in the upgrade portal.
          </div>
        </div>

        {showAddForm && (
          <AddItemForm
            categories={categories.names.length > 0 ? categories.names : ["Electrical", "Tiles", "Bathrooms", "Kitchen", "Laundry", "Joinery", "Stone", "Doors & Hardware", "Flooring", "Air Conditioning", "Facade", "Insulation"]}
            onAdd={handleAdd}
            onCancel={() => setShowAddForm(false)}
          />
        )}

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading inclusions library...</div>
        ) : categories.grouped.length === 0 ? (
          <div className="text-center py-16 border rounded-lg border-dashed" style={{ borderColor: "var(--border)" }}>
            <Package size={36} className="mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm font-medium mb-1" style={{ fontFamily: "var(--font-heading)" }}>No items yet</p>
            <p className="text-xs text-muted-foreground mb-4">Add your first inclusion item to get started.</p>
            <Button onClick={() => setShowAddForm(true)} className="text-white" style={{ background: "var(--bm-petrol)" }}>
              <Plus size={14} className="mr-1.5" /> Add First Item
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            {categories.grouped.map(([category, categoryRules]) => (
              <div key={category}>
                <div className="flex items-center gap-3 mb-3">
                  <Layers size={15} style={{ color: "var(--bm-petrol)" }} />
                  <h2 className="text-base font-semibold" style={{ fontFamily: "var(--font-heading)", color: "var(--bm-petrol)" }}>
                    {category}
                  </h2>
                  <Badge variant="outline" className="text-xs">{categoryRules.length} items</Badge>
                  <Separator className="flex-1" />
                </div>
                <div className="space-y-2">
                  {categoryRules.map(rule => (
                    <RuleRow key={rule.id} rule={rule} onSave={handleSave} onDelete={handleDelete} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
