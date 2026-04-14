import { useState, useCallback, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Plus, Trash2, Check, X, ChevronDown, ChevronUp,
  Wand2, Layers, Edit, Sparkles, Loader2,
  DollarSign, FileX, ListChecks, Package
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type InclusionItem = {
  id: number;
  categoryId: number;
  projectId: number;
  name: string;
  qty: string | null;
  unit: string | null;
  description: string | null;
  imageUrl: string | null;
  included: boolean;
  isBoqImported: boolean | null;
  position: number;
};

type InclusionCategory = {
  id: number;
  projectId: number;
  name: string;
  imageUrl: string | null;
  position: number;
  items: InclusionItem[];
};

type WordingSuggestion = { label: string; text: string };

// ─── AI Suggest Panel ─────────────────────────────────────────────────────────
function AISuggestPanel({
  item,
  categoryName,
  onSelect,
  onClose,
}: {
  item: InclusionItem;
  categoryName: string;
  onSelect: (text: string) => void;
  onClose: () => void;
}) {
  const [suggestions, setSuggestions] = useState<WordingSuggestion[] | null>(null);

  const suggestMutation = trpc.inclusionMaster.suggestWording.useMutation({
    onSuccess: (data) => setSuggestions(data.suggestions),
    onError: (e) => toast.error("AI suggestion failed: " + e.message),
  });

  const handleGenerate = () => {
    suggestMutation.mutate({
      itemName: item.name,
      categoryName,
      qty: item.qty ?? undefined,
      unit: item.unit ?? undefined,
      currentDescription: item.description ?? undefined,
    });
  };

  useEffect(() => { handleGenerate(); }, []);

  return (
    <div className="mt-2 rounded-lg border p-3 space-y-3" style={{ borderColor: "var(--bm-petrol)", background: "var(--card)" }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Sparkles size={13} style={{ color: "var(--bm-petrol)" }} />
          <span className="text-xs font-semibold" style={{ color: "var(--bm-petrol)", fontFamily: "var(--font-heading)" }}>
            AI Wording Suggestions
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" onClick={handleGenerate} disabled={suggestMutation.isPending} className="h-6 text-xs px-2" style={{ color: "var(--bm-petrol)" }}>
            {suggestMutation.isPending ? <Loader2 size={11} className="animate-spin mr-1" /> : <Sparkles size={11} className="mr-1" />}
            Regenerate
          </Button>
          <Button size="sm" variant="ghost" onClick={onClose} className="h-6 w-6 p-0"><X size={12} /></Button>
        </div>
      </div>

      {suggestMutation.isPending && !suggestions && (
        <div className="flex items-center gap-2 py-3 justify-center">
          <Loader2 size={16} className="animate-spin" style={{ color: "var(--bm-petrol)" }} />
          <span className="text-xs text-muted-foreground">Generating professional tender wording…</span>
        </div>
      )}

      {suggestions && (
        <div className="space-y-2">
          {suggestions.map((s, i) => (
            <div
              key={i}
              className="rounded border p-2.5 hover:border-[var(--bm-petrol)] transition-colors group cursor-pointer"
              onClick={() => { onSelect(s.text); onClose(); }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <span className="text-xs font-semibold block mb-1" style={{ color: "var(--bm-petrol)", fontFamily: "var(--font-heading)" }}>
                    {s.label}
                  </span>
                  <p className="text-xs leading-relaxed" style={{ fontFamily: "Lato, sans-serif" }}>{s.text}</p>
                </div>
                <Button
                  size="sm"
                  className="shrink-0 h-7 text-xs opacity-0 group-hover:opacity-100 transition-opacity text-white"
                  style={{ background: "var(--bm-petrol)" }}
                  onClick={(e) => { e.stopPropagation(); onSelect(s.text); onClose(); }}
                >
                  Use this
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Item Row ─────────────────────────────────────────────────────────────────
function ItemRow({
  item,
  categoryName,
  onToggleIncluded,
  onUpdate,
  onDelete,
}: {
  item: InclusionItem;
  categoryName: string;
  onToggleIncluded: (id: number, included: boolean) => void;
  onUpdate: (id: number, data: { description: string; qty: string }) => void;
  onDelete: (id: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [desc, setDesc] = useState(item.description ?? item.name);
  const [qty, setQty] = useState(item.qty ?? "");
  const [showAISuggest, setShowAISuggest] = useState(false);

  const handleSave = () => {
    onUpdate(item.id, { description: desc, qty });
    setEditing(false);
    setShowAISuggest(false);
  };

  const handleCancel = () => {
    setDesc(item.description ?? item.name);
    setQty(item.qty ?? "");
    setEditing(false);
    setShowAISuggest(false);
  };

  if (editing) {
    return (
      <div className="border rounded-lg px-3 py-3 space-y-2 bg-card" style={{ borderColor: "var(--bm-petrol)" }}>
        <div className="flex gap-3 items-start">
          <div className="flex-1 space-y-2">
            <div className="flex gap-2 items-start">
              <div className="flex-1">
                <label className="text-xs text-muted-foreground mb-1 block">Description</label>
                <div className="flex gap-1.5">
                  <Input value={desc} onChange={e => setDesc(e.target.value)} className="h-8 text-sm flex-1" autoFocus />
                  <Button
                    size="sm" variant="outline"
                    onClick={() => setShowAISuggest(v => !v)}
                    className="h-8 w-8 p-0 shrink-0"
                    title="AI wording suggestions"
                    style={{ borderColor: showAISuggest ? "var(--bm-petrol)" : undefined, color: "var(--bm-petrol)" }}
                  >
                    <Sparkles size={13} />
                  </Button>
                </div>
              </div>
              <div className="w-24 shrink-0">
                <label className="text-xs text-muted-foreground mb-1 block">Qty</label>
                <Input value={qty} onChange={e => setQty(e.target.value)} placeholder="e.g. 45" className="h-8 text-sm" />
              </div>
            </div>
          </div>
        </div>

        {showAISuggest && (
          <AISuggestPanel
            item={{ ...item, description: desc || item.description }}
            categoryName={categoryName}
            onSelect={(text) => setDesc(text)}
            onClose={() => setShowAISuggest(false)}
          />
        )}

        <div className="flex gap-2">
          <Button size="sm" onClick={handleSave} className="text-xs h-7 text-white" style={{ background: "var(--bm-petrol)" }}>
            <Check size={12} className="mr-1" /> Save
          </Button>
          <Button size="sm" variant="outline" onClick={handleCancel} className="text-xs h-7">
            <X size={12} className="mr-1" /> Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-3 px-3 py-2 rounded-lg border bg-card hover:bg-secondary/30 group transition-colors"
      style={{ borderColor: "var(--border)", opacity: item.included ? 1 : 0.45 }}
    >
      <Checkbox checked={item.included} onCheckedChange={v => onToggleIncluded(item.id, !!v)} className="shrink-0" />

      <span className="flex-1 text-sm truncate" style={{ fontFamily: "Lato, sans-serif" }}>
        {item.description ?? item.name}
      </span>
      {item.qty && (
        <span className="text-xs text-muted-foreground shrink-0 tabular-nums" style={{ fontFamily: "Lato, sans-serif" }}>
          {item.qty} {item.unit || ""}
        </span>
      )}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <Button size="sm" variant="ghost" onClick={() => setEditing(true)} className="h-7 w-7 p-0">
          <Edit size={12} />
        </Button>
        <Button
          size="sm" variant="ghost"
          onClick={() => { if (confirm(`Delete "${item.description ?? item.name}"?`)) onDelete(item.id); }}
          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
        >
          <Trash2 size={12} />
        </Button>
      </div>
    </div>
  );
}

// ─── Category Card ─────────────────────────────────────────────────────────────
function CategoryCard({
  category,
  projectId,
  onRefresh,
}: {
  category: InclusionCategory;
  projectId: number;
  onRefresh: () => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [addingItem, setAddingItem] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(category.name);
  const [newDesc, setNewDesc] = useState("");
  const [newQty, setNewQty] = useState("");
  const utils = trpc.useUtils();

  const upsertItem = trpc.inclusionMaster.upsertItem.useMutation({
    onSuccess: () => { utils.inclusionMaster.listCategories.invalidate(); onRefresh(); },
    onError: e => toast.error(e.message),
  });
  const deleteItem = trpc.inclusionMaster.deleteItem.useMutation({
    onSuccess: () => { utils.inclusionMaster.listCategories.invalidate(); onRefresh(); },
    onError: e => toast.error(e.message),
  });
  const updateCategory = trpc.inclusionMaster.updateCategory.useMutation({
    onSuccess: () => { utils.inclusionMaster.listCategories.invalidate(); setEditingName(false); },
    onError: e => toast.error(e.message),
  });
  const deleteCategory = trpc.inclusionMaster.deleteCategory.useMutation({
    onSuccess: () => { utils.inclusionMaster.listCategories.invalidate(); },
    onError: e => toast.error(e.message),
  });


  const handleToggleIncluded = (id: number, included: boolean) => {
    const existing = category.items.find(i => i.id === id);
    if (!existing) return;
    upsertItem.mutate({
      id, categoryId: category.id, projectId,
      name: existing.name, description: existing.description ?? undefined,
      qty: existing.qty ?? undefined, unit: existing.unit ?? undefined, included,
    });
  };

  const handleUpdateItem = (id: number, data: { description: string; qty: string }) => {
    const existing = category.items.find(i => i.id === id);
    if (!existing) return;
    upsertItem.mutate({
      id, categoryId: category.id, projectId,
      name: data.description || existing.name, description: data.description || undefined,
      qty: data.qty || undefined, unit: existing.unit ?? undefined, included: existing.included,
    });
  };



  const handleAddItem = () => {
    if (!newDesc.trim()) return;
    upsertItem.mutate({
      categoryId: category.id, projectId,
      name: newDesc.trim(), description: newDesc.trim(),
      qty: newQty || null, unit: "item", included: true, position: category.items.length,
    });
    setNewDesc(""); setNewQty(""); setAddingItem(false);
  };

  const includedCount = category.items.filter(i => i.included).length;

  return (
    <div className="border rounded-lg overflow-hidden" style={{ borderColor: "var(--border)" }}>
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none"
        style={{ background: "var(--bm-petrol)", color: "#fff" }}
        onClick={() => setCollapsed(c => !c)}
      >
        <Layers size={15} className="shrink-0 text-white/70" />
        {editingName ? (
          <div className="flex items-center gap-2 flex-1" onClick={e => e.stopPropagation()}>
            <Input value={newName} onChange={e => setNewName(e.target.value)} className="h-7 text-sm flex-1 bg-white/10 border-white/30 text-white placeholder:text-white/50" autoFocus />
            <Button size="sm" className="h-7 text-xs bg-white/20 hover:bg-white/30 text-white" onClick={() => updateCategory.mutate({ id: category.id, name: newName })}>
              <Check size={12} />
            </Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs text-white hover:bg-white/10" onClick={() => { setEditingName(false); setNewName(category.name); }}>
              <X size={12} />
            </Button>
          </div>
        ) : (
          <div className="flex-1 flex items-center gap-2">
            <span className="font-semibold text-sm tracking-wide" style={{ fontFamily: "var(--font-heading)" }}>
              {category.name}
            </span>
            <span className="text-xs text-white/60">
              {includedCount}/{category.items.length} included
            </span>
          </div>
        )}
        <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-white/70 hover:text-white hover:bg-white/10" onClick={() => setEditingName(true)}>
            <Edit size={12} />
          </Button>
          <Button
            size="sm" variant="ghost"
            className="h-7 w-7 p-0 text-red-300 hover:text-red-200 hover:bg-white/10"
            onClick={() => { if (confirm(`Delete category "${category.name}" and all its items?`)) deleteCategory.mutate({ id: category.id }); }}
          >
            <Trash2 size={12} />
          </Button>
          {collapsed ? <ChevronDown size={14} className="text-white/70" /> : <ChevronUp size={14} className="text-white/70" />}
        </div>
      </div>

      {!collapsed && (
        <div className="p-3 space-y-1.5" style={{ background: "var(--card)" }}>
          {category.items.length === 0 && !addingItem && (
            <p className="text-xs text-muted-foreground text-center py-4">No items yet. Click "Add Item" below.</p>
          )}
          {category.items.map(item => (
            <ItemRow
              key={item.id}
              item={item}
              categoryName={category.name}
              onToggleIncluded={handleToggleIncluded}
              onUpdate={handleUpdateItem}
              onDelete={id => deleteItem.mutate({ id })}

            />
          ))}

          {addingItem ? (
            <div className="border rounded-lg px-3 py-2 space-y-2 bg-card" style={{ borderColor: "var(--bm-petrol)" }}>
              <div className="flex gap-2 items-start">
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground mb-1 block">Description *</label>
                  <Input
                    value={newDesc} onChange={e => setNewDesc(e.target.value)}
                    placeholder="e.g. Clipsal Iconic Series GPOs"
                    className="h-8 text-sm" autoFocus
                    onKeyDown={e => { if (e.key === "Enter") handleAddItem(); if (e.key === "Escape") setAddingItem(false); }}
                  />
                </div>
                <div className="w-24 shrink-0">
                  <label className="text-xs text-muted-foreground mb-1 block">Qty</label>
                  <Input value={newQty} onChange={e => setNewQty(e.target.value)} placeholder="e.g. 45" className="h-8 text-sm" />
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleAddItem} disabled={!newDesc.trim()} className="text-xs h-7 text-white" style={{ background: "var(--bm-petrol)" }}>
                  <Check size={12} className="mr-1" /> Add
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setAddingItem(false); setNewDesc(""); setNewQty(""); }} className="text-xs h-7">
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              size="sm" variant="ghost"
              onClick={() => setAddingItem(true)}
              className="w-full text-xs h-8 border border-dashed hover:border-solid mt-1"
              style={{ color: "var(--bm-petrol)", borderColor: "var(--bm-petrol)" }}
            >
              <Plus size={12} className="mr-1" /> Add Item
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Simple List Section (PC Items, Provisional Sums, Exclusions) ────────────
function SimpleListSection({
  title,
  icon: Icon,
  items,
  isLoading,
  onAdd,
  onUpdate,
  onDelete,
  fields,
  addPending,
}: {
  title: string;
  icon: React.ElementType;
  items: any[];
  isLoading: boolean;
  onAdd: (data: any) => void;
  onUpdate: (id: number, data: any) => void;
  onDelete: (id: number) => void;
  fields: { key: string; label: string; placeholder: string; type?: "text" | "currency" }[];
  addPending: boolean;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});

  const resetForm = () => {
    setFormData({});
    setAdding(false);
    setEditingId(null);
  };

  const handleAdd = () => {
    if (!formData[fields[0].key]?.trim()) return;
    onAdd(formData);
    resetForm();
  };

  const startEdit = (item: any) => {
    const data: Record<string, string> = {};
    fields.forEach(f => { data[f.key] = item[f.key] ?? ""; });
    setFormData(data);
    setEditingId(item.id);
  };

  const handleUpdate = () => {
    if (editingId === null) return;
    onUpdate(editingId, formData);
    resetForm();
  };

  return (
    <div className="border rounded-lg overflow-hidden" style={{ borderColor: "var(--border)" }}>
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none"
        style={{ background: "var(--bm-bluegum, #6D7E94)", color: "#fff" }}
        onClick={() => setCollapsed(c => !c)}
      >
        <Icon size={15} className="shrink-0 text-white/70" />
        <div className="flex-1 flex items-center gap-2">
          <span className="font-semibold text-sm tracking-wide" style={{ fontFamily: "var(--font-heading)" }}>
            {title}
          </span>
          <span className="text-xs text-white/60">{items.length} items</span>
        </div>
        {collapsed ? <ChevronDown size={14} className="text-white/70" /> : <ChevronUp size={14} className="text-white/70" />}
      </div>

      {!collapsed && (
        <div className="p-3 space-y-1.5" style={{ background: "var(--card)" }}>
          {isLoading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 size={16} className="animate-spin text-muted-foreground" />
            </div>
          )}

          {!isLoading && items.length === 0 && !adding && (
            <p className="text-xs text-muted-foreground text-center py-4">No items yet.</p>
          )}

          {items.map(item => (
            editingId === item.id ? (
              <div key={item.id} className="border rounded-lg px-3 py-2 space-y-2" style={{ borderColor: "var(--bm-petrol)" }}>
                <div className="flex gap-2 items-start flex-wrap">
                  {fields.map(f => (
                    <div key={f.key} className={f.type === "currency" ? "w-32 shrink-0" : "flex-1 min-w-[200px]"}>
                      <label className="text-xs text-muted-foreground mb-1 block">{f.label}</label>
                      <Input
                        value={formData[f.key] || ""}
                        onChange={e => setFormData(prev => ({ ...prev, [f.key]: e.target.value }))}
                        placeholder={f.placeholder}
                        className="h-8 text-sm"
                      />
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleUpdate} className="text-xs h-7 text-white" style={{ background: "var(--bm-petrol)" }}>
                    <Check size={12} className="mr-1" /> Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={resetForm} className="text-xs h-7">Cancel</Button>
                </div>
              </div>
            ) : (
              <div key={item.id} className="flex items-center gap-3 px-3 py-2 rounded-lg border bg-card hover:bg-secondary/30 group transition-colors" style={{ borderColor: "var(--border)" }}>
                <span className="flex-1 text-sm" style={{ fontFamily: "Lato, sans-serif" }}>
                  {item[fields[0].key]}
                </span>
                {fields.slice(1).map(f => (
                  item[f.key] ? (
                    <span key={f.key} className="text-xs text-muted-foreground shrink-0 tabular-nums">
                      {f.type === "currency" ? `$${Number(item[f.key]).toLocaleString()}` : item[f.key]}
                    </span>
                  ) : null
                ))}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <Button size="sm" variant="ghost" onClick={() => startEdit(item)} className="h-7 w-7 p-0">
                    <Edit size={12} />
                  </Button>
                  <Button
                    size="sm" variant="ghost"
                    onClick={() => { if (confirm(`Delete this item?`)) onDelete(item.id); }}
                    className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 size={12} />
                  </Button>
                </div>
              </div>
            )
          ))}

          {adding ? (
            <div className="border rounded-lg px-3 py-2 space-y-2" style={{ borderColor: "var(--bm-petrol)" }}>
              <div className="flex gap-2 items-start flex-wrap">
                {fields.map(f => (
                  <div key={f.key} className={f.type === "currency" ? "w-32 shrink-0" : "flex-1 min-w-[200px]"}>
                    <label className="text-xs text-muted-foreground mb-1 block">{f.label}</label>
                    <Input
                      value={formData[f.key] || ""}
                      onChange={e => setFormData(prev => ({ ...prev, [f.key]: e.target.value }))}
                      placeholder={f.placeholder}
                      className="h-8 text-sm"
                      autoFocus={f === fields[0]}
                      onKeyDown={e => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") resetForm(); }}
                    />
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleAdd} disabled={!formData[fields[0].key]?.trim() || addPending} className="text-xs h-7 text-white" style={{ background: "var(--bm-petrol)" }}>
                  <Check size={12} className="mr-1" /> Add
                </Button>
                <Button size="sm" variant="outline" onClick={resetForm} className="text-xs h-7">Cancel</Button>
              </div>
            </div>
          ) : (
            <Button
              size="sm" variant="ghost"
              onClick={() => { setFormData({}); setAdding(true); }}
              className="w-full text-xs h-8 border border-dashed hover:border-solid mt-1"
              style={{ color: "var(--bm-petrol)", borderColor: "var(--bm-petrol)" }}
            >
              <Plus size={12} className="mr-1" /> Add Item
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main: Tender Creation Tab ──────────────────────────────────────────────
export default function BaseInclusionsTab({ projectId }: { projectId: number }) {
  const utils = trpc.useUtils();
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [seedTier, setSeedTier] = useState<string>("1");

  // ─── Inclusions data ──────────────────────────────────────────────────────
  const { data: categories, isLoading, refetch } = trpc.inclusionMaster.listCategories.useQuery(
    { projectId },
    { refetchOnWindowFocus: false }
  );

  const seedDefaults = trpc.inclusionMaster.seedDefaults.useMutation({
    onSuccess: (data) => {
      if (data.skipped) {
        toast.info(data.message || "Standard inclusions already seeded.");
      } else {
        toast.success("Standard inclusions seeded from pricing rules!");
      }
      utils.inclusionMaster.listCategories.invalidate();
    },
    onError: e => toast.error(e.message),
  });

  const addCategory = trpc.inclusionMaster.addCategory.useMutation({
    onSuccess: () => { utils.inclusionMaster.listCategories.invalidate(); setNewCategoryName(""); setAddingCategory(false); },
    onError: e => toast.error(e.message),
  });

  // ─── Exclusions data ──────────────────────────────────────────────────────
  const { data: exclusions = [], isLoading: exclLoading } = trpc.exclusions.list.useQuery({ projectId }, { refetchOnWindowFocus: false });
  const createExclusion = trpc.exclusions.create.useMutation({
    onSuccess: () => utils.exclusions.list.invalidate(),
    onError: e => toast.error(e.message),
  });
  const updateExclusion = trpc.exclusions.update.useMutation({
    onSuccess: () => utils.exclusions.list.invalidate(),
    onError: e => toast.error(e.message),
  });
  const deleteExclusion = trpc.exclusions.delete.useMutation({
    onSuccess: () => utils.exclusions.list.invalidate(),
    onError: e => toast.error(e.message),
  });

  // ─── PC Items data ────────────────────────────────────────────────────────
  const { data: pcItems = [], isLoading: pcLoading } = trpc.pcItems.list.useQuery({ projectId }, { refetchOnWindowFocus: false });
  const createPcItem = trpc.pcItems.create.useMutation({
    onSuccess: () => utils.pcItems.list.invalidate(),
    onError: e => toast.error(e.message),
  });
  const updatePcItem = trpc.pcItems.update.useMutation({
    onSuccess: () => utils.pcItems.list.invalidate(),
    onError: e => toast.error(e.message),
  });
  const deletePcItem = trpc.pcItems.delete.useMutation({
    onSuccess: () => utils.pcItems.list.invalidate(),
    onError: e => toast.error(e.message),
  });

  // ─── Provisional Sums data ────────────────────────────────────────────────
  const { data: provSums = [], isLoading: psLoading } = trpc.provisionalSums.list.useQuery({ projectId }, { refetchOnWindowFocus: false });
  const createPS = trpc.provisionalSums.create.useMutation({
    onSuccess: () => utils.provisionalSums.list.invalidate(),
    onError: e => toast.error(e.message),
  });
  const updatePS = trpc.provisionalSums.update.useMutation({
    onSuccess: () => utils.provisionalSums.list.invalidate(),
    onError: e => toast.error(e.message),
  });
  const deletePS = trpc.provisionalSums.delete.useMutation({
    onSuccess: () => utils.provisionalSums.list.invalidate(),
    onError: e => toast.error(e.message),
  });

  const handleRefresh = useCallback(() => { refetch(); }, [refetch]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-t-transparent" style={{ borderColor: "var(--bm-petrol)" }} />
      </div>
    );
  }

  const totalIncluded = categories?.reduce((s, c) => s + c.items.filter(i => i.included).length, 0) ?? 0;
  const totalItems = categories?.reduce((s, c) => s + c.items.length, 0) ?? 0;
  const hasSeededItems = categories?.some(c => c.items.some(i => !i.isBoqImported)) ?? false;

  const TIER_NAMES: Record<string, string> = { "1": "Built for Excellence", "2": "Tailored Living", "3": "Signature Series" };

  return (
    <div className="space-y-6">
      {/* ─── Header ──────────────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-lg font-semibold" style={{ fontFamily: "var(--font-heading)", color: "var(--bm-petrol)" }}>
          Tender Creation
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5 max-w-2xl">
          Build your complete tender document. Choose a starting tier to seed standard inclusions from pricing rules,
          upload a BOQ to add contract items, and manage PC Items, Provisional Sums, and Exclusions — all in one place.
        </p>
      </div>

      {/* ─── Tier Seed Section ────────────────────────────────────────────────── */}
      <div className="border rounded-lg p-4" style={{ borderColor: "var(--bm-petrol)", background: "color-mix(in oklch, var(--bm-petrol) 5%, var(--card))" }}>
        <div className="flex items-center gap-3 mb-3">
          <Package size={18} style={{ color: "var(--bm-petrol)" }} />
          <div>
            <h3 className="text-sm font-semibold" style={{ fontFamily: "var(--font-heading)", color: "var(--bm-petrol)" }}>
              Standard Inclusions — Starting Tier
            </h3>
            <p className="text-xs text-muted-foreground">
              Select a tier and seed standard inclusions from your pricing rules. This populates the tender with tier-specific product descriptions and specifications.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Select value={seedTier} onValueChange={setSeedTier}>
            <SelectTrigger className="w-[220px] h-9 text-sm" style={{ borderColor: "var(--bm-petrol)" }}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Tier 1 — Built for Excellence</SelectItem>
              <SelectItem value="2">Tier 2 — Tailored Living</SelectItem>
              <SelectItem value="3">Tier 3 — Signature Series</SelectItem>
            </SelectContent>
          </Select>
          <Button
            size="sm"
            onClick={() => seedDefaults.mutate({ projectId, tier: Number(seedTier) })}
            disabled={seedDefaults.isPending || hasSeededItems}
            className="h-9 text-xs text-white"
            style={{ background: "var(--bm-petrol)" }}
          >
            <Wand2 size={13} className="mr-1.5" />
            {seedDefaults.isPending ? "Seeding..." : hasSeededItems ? "Already Seeded" : `Seed ${TIER_NAMES[seedTier]} Inclusions`}
          </Button>
          {hasSeededItems && (
            <span className="text-xs text-muted-foreground">
              Standard inclusions already populated. Delete seeded categories to re-seed with a different tier.
            </span>
          )}
        </div>
      </div>

      {/* ─── Section 1: Standard Inclusions + BOQ Items ──────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ListChecks size={16} style={{ color: "var(--bm-petrol)" }} />
            <h3 className="text-sm font-semibold" style={{ fontFamily: "var(--font-heading)", color: "var(--bm-petrol)" }}>
              Inclusions Schedule
            </h3>
            {totalItems > 0 && (
              <span className="text-xs text-muted-foreground">({totalIncluded}/{totalItems} included)</span>
            )}
          </div>
          <Button size="sm" onClick={() => setAddingCategory(true)} className="text-xs h-8 text-white" style={{ background: "var(--bm-petrol)" }}>
            <Plus size={13} className="mr-1.5" /> Add Category
          </Button>
        </div>

        <p className="text-xs text-muted-foreground max-w-lg">
          Click <Edit size={10} className="inline mx-0.5" /> to edit — use <Sparkles size={10} className="inline mx-0.5" style={{ color: "var(--bm-petrol)" }} /> for AI tender wording.
          Manage product images in the <a href="/admin/pricing-rules" className="underline" style={{ color: "var(--bm-petrol)" }}>Inclusions Library</a>.
        </p>

        {addingCategory && (
          <div className="border rounded-lg p-3 flex items-center gap-2" style={{ borderColor: "var(--bm-petrol)" }}>
            <Input
              value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)}
              placeholder="Category name (e.g. Electrical)" className="h-8 text-sm flex-1" autoFocus
              onKeyDown={e => {
                if (e.key === "Enter" && newCategoryName.trim()) addCategory.mutate({ projectId, name: newCategoryName, position: categories?.length ?? 0 });
                if (e.key === "Escape") { setAddingCategory(false); setNewCategoryName(""); }
              }}
            />
            <Button
              size="sm"
              onClick={() => addCategory.mutate({ projectId, name: newCategoryName, position: categories?.length ?? 0 })}
              disabled={!newCategoryName.trim() || addCategory.isPending}
              className="h-8 text-xs text-white" style={{ background: "var(--bm-petrol)" }}
            >
              <Check size={12} className="mr-1" /> Add
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setAddingCategory(false); setNewCategoryName(""); }} className="h-8 text-xs">
              <X size={12} />
            </Button>
          </div>
        )}

        {(!categories || categories.length === 0) && !addingCategory && (
          <div className="text-center py-8 border rounded-lg border-dashed" style={{ borderColor: "var(--border)" }}>
            <Layers size={28} className="mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm font-medium mb-1" style={{ fontFamily: "var(--font-heading)" }}>No inclusions yet</p>
            <p className="text-xs text-muted-foreground">
              Use the tier selector above to seed standard inclusions, or upload a BOQ from the BOQ tab.
            </p>
          </div>
        )}

        <div className="space-y-3">
          {categories?.map(cat => (
            <CategoryCard key={cat.id} category={cat} projectId={projectId} onRefresh={handleRefresh} />
          ))}
        </div>
      </div>

      {/* ─── Divider ─────────────────────────────────────────────────────────── */}
      <hr style={{ borderColor: "var(--border)" }} />

      {/* ─── Section 2: PC Items ─────────────────────────────────────────────── */}
      <SimpleListSection
        title="PC Items (Prime Cost)"
        icon={DollarSign}
        items={pcItems}
        isLoading={pcLoading}
        onAdd={(data) => createPcItem.mutate({ projectId, description: data.description, allowance: data.allowance || null, notes: data.notes || null, position: pcItems.length })}
        onUpdate={(id, data) => updatePcItem.mutate({ id, description: data.description, allowance: data.allowance || null, notes: data.notes || null })}
        onDelete={(id) => deletePcItem.mutate({ id })}
        addPending={createPcItem.isPending}
        fields={[
          { key: "description", label: "Description", placeholder: "e.g. Basin Mixer Taps" },
          { key: "allowance", label: "Allowance ($)", placeholder: "e.g. 450", type: "currency" },
          { key: "notes", label: "Notes", placeholder: "Optional notes" },
        ]}
      />

      {/* ─── Section 3: Provisional Sums ─────────────────────────────────────── */}
      <SimpleListSection
        title="Provisional Sums"
        icon={DollarSign}
        items={provSums}
        isLoading={psLoading}
        onAdd={(data) => createPS.mutate({ projectId, description: data.description, amount: data.amount || null, notes: data.notes || null, position: provSums.length })}
        onUpdate={(id, data) => updatePS.mutate({ id, description: data.description, amount: data.amount || null, notes: data.notes || null })}
        onDelete={(id) => deletePS.mutate({ id })}
        addPending={createPS.isPending}
        fields={[
          { key: "description", label: "Description", placeholder: "e.g. Soil Testing & Engineering" },
          { key: "amount", label: "Amount ($)", placeholder: "e.g. 5000", type: "currency" },
          { key: "notes", label: "Notes", placeholder: "Optional notes" },
        ]}
      />

      {/* ─── Section 4: Exclusions ───────────────────────────────────────────── */}
      <SimpleListSection
        title="Exclusions"
        icon={FileX}
        items={exclusions}
        isLoading={exclLoading}
        onAdd={(data) => createExclusion.mutate({ projectId, description: data.description, position: exclusions.length })}
        onUpdate={(id, data) => updateExclusion.mutate({ id, description: data.description })}
        onDelete={(id) => deleteExclusion.mutate({ id })}
        addPending={createExclusion.isPending}
        fields={[
          { key: "description", label: "Description", placeholder: "e.g. Landscaping and external works" },
        ]}
      />
    </div>
  );
}
