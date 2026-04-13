import { useState, useCallback, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Plus, Trash2, Check, X, ChevronDown, ChevronUp,
  Wand2, GripVertical, Layers, Edit, Sparkles, Loader2
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

  // Auto-generate on mount
  useEffect(() => { handleGenerate(); }, []);

  return (
    <div
      className="mt-2 rounded-lg border p-3 space-y-3"
      style={{ borderColor: "var(--bm-petrol)", background: "var(--card)" }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Sparkles size={13} style={{ color: "var(--bm-petrol)" }} />
          <span className="text-xs font-semibold" style={{ color: "var(--bm-petrol)", fontFamily: "Cormorant Garamond, serif" }}>
            AI Wording Suggestions
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="sm" variant="ghost"
            onClick={handleGenerate}
            disabled={suggestMutation.isPending}
            className="h-6 text-xs px-2"
            style={{ color: "var(--bm-petrol)" }}
          >
            {suggestMutation.isPending ? (
              <Loader2 size={11} className="animate-spin mr-1" />
            ) : (
              <Sparkles size={11} className="mr-1" />
            )}
            Regenerate
          </Button>
          <Button size="sm" variant="ghost" onClick={onClose} className="h-6 w-6 p-0">
            <X size={12} />
          </Button>
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
              style={{ borderColor: "var(--border)" }}
              onClick={() => { onSelect(s.text); onClose(); }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <span
                    className="text-xs font-semibold block mb-1"
                    style={{ color: "var(--bm-petrol)", fontFamily: "Cormorant Garamond, serif" }}
                  >
                    {s.label}
                  </span>
                  <p className="text-xs leading-relaxed" style={{ fontFamily: "Lato, sans-serif", color: "var(--foreground)" }}>
                    {s.text}
                  </p>
                </div>
                <Button
                  size="sm"
                  className="shrink-0 h-7 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
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
      <div
        className="border rounded px-3 py-2 space-y-2 bg-card"
        style={{ borderColor: "var(--bm-petrol)" }}
      >
        <div className="flex gap-2 items-start">
          <div className="flex-1">
            <label className="text-xs text-muted-foreground mb-1 block">Description</label>
            <div className="flex gap-1.5">
              <Input
                value={desc}
                onChange={e => setDesc(e.target.value)}
                className="h-8 text-sm flex-1"
                autoFocus
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowAISuggest(v => !v)}
                className="h-8 w-8 p-0 shrink-0"
                title="AI wording suggestions"
                style={{
                  borderColor: showAISuggest ? "var(--bm-petrol)" : undefined,
                  color: "var(--bm-petrol)",
                }}
              >
                <Sparkles size={13} />
              </Button>
            </div>
          </div>
          <div className="w-24 shrink-0">
            <label className="text-xs text-muted-foreground mb-1 block">Qty</label>
            <Input
              value={qty}
              onChange={e => setQty(e.target.value)}
              placeholder="e.g. 45"
              className="h-8 text-sm"
            />
          </div>
        </div>

        {/* AI Suggest Panel */}
        {showAISuggest && (
          <AISuggestPanel
            item={{ ...item, description: desc || item.description }}
            categoryName={categoryName}
            onSelect={(text) => setDesc(text)}
            onClose={() => setShowAISuggest(false)}
          />
        )}

        <div className="flex gap-2">
          <Button size="sm" onClick={handleSave} className="text-xs h-7" style={{ background: "var(--bm-petrol)" }}>
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
      className="flex items-center gap-2 px-3 py-2 rounded border bg-card hover:bg-secondary/30 group transition-colors"
      style={{ borderColor: "var(--border)", opacity: item.included ? 1 : 0.45 }}
    >
      <GripVertical size={13} className="text-muted-foreground shrink-0 cursor-grab" />
      <Checkbox
        checked={item.included}
        onCheckedChange={v => onToggleIncluded(item.id, !!v)}
        className="shrink-0"
      />
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
      id,
      categoryId: category.id,
      projectId,
      name: existing.name,
      description: existing.description ?? undefined,
      qty: existing.qty ?? undefined,
      unit: existing.unit ?? undefined,
      included,
    });
  };

  const handleUpdateItem = (id: number, data: { description: string; qty: string }) => {
    const existing = category.items.find(i => i.id === id);
    if (!existing) return;
    upsertItem.mutate({
      id,
      categoryId: category.id,
      projectId,
      name: data.description || existing.name,
      description: data.description || undefined,
      qty: data.qty || undefined,
      unit: existing.unit ?? undefined,
      included: existing.included,
    });
  };

  const handleAddItem = () => {
    if (!newDesc.trim()) return;
    upsertItem.mutate({
      categoryId: category.id,
      projectId,
      name: newDesc.trim(),
      description: newDesc.trim(),
      qty: newQty || null,
      unit: "item",
      included: true,
      position: category.items.length,
    });
    setNewDesc("");
    setNewQty("");
    setAddingItem(false);
  };

  const includedCount = category.items.filter(i => i.included).length;

  return (
    <div className="border rounded-lg overflow-hidden" style={{ borderColor: "var(--border)" }}>
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 bg-secondary/40 cursor-pointer select-none"
        onClick={() => setCollapsed(c => !c)}
      >
        <Layers size={15} style={{ color: "var(--bm-petrol)" }} className="shrink-0" />
        {editingName ? (
          <div className="flex items-center gap-2 flex-1" onClick={e => e.stopPropagation()}>
            <Input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              className="h-7 text-sm flex-1"
              autoFocus
            />
            <Button size="sm" className="h-7 text-xs" onClick={() => updateCategory.mutate({ id: category.id, name: newName })} style={{ background: "var(--bm-petrol)" }}>
              <Check size={12} />
            </Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setEditingName(false); setNewName(category.name); }}>
              <X size={12} />
            </Button>
          </div>
        ) : (
          <div className="flex-1 flex items-center gap-2">
            <span className="font-semibold text-sm" style={{ fontFamily: "Cormorant Garamond, serif", color: "var(--bm-petrol)" }}>
              {category.name}
            </span>
            <span className="text-xs text-muted-foreground">
              {includedCount}/{category.items.length} included
            </span>
          </div>
        )}
        <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setEditingName(true)}>
            <Edit size={12} />
          </Button>
          <Button
            size="sm" variant="ghost"
            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
            onClick={() => { if (confirm(`Delete category "${category.name}" and all its items?`)) deleteCategory.mutate({ id: category.id }); }}
          >
            <Trash2 size={12} />
          </Button>
          {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </div>
      </div>

      {/* Items */}
      {!collapsed && (
        <div className="p-3 space-y-1.5">
          {category.items.length === 0 && !addingItem && (
            <p className="text-xs text-muted-foreground text-center py-3">
              No items yet.
            </p>
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

          {/* Add item form */}
          {addingItem ? (
            <div className="border rounded px-3 py-2 space-y-2 bg-card" style={{ borderColor: "var(--bm-petrol)" }}>
              <div className="flex gap-2 items-start">
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground mb-1 block">Description *</label>
                  <Input
                    value={newDesc}
                    onChange={e => setNewDesc(e.target.value)}
                    placeholder="e.g. Clipsal Iconic Series GPOs"
                    className="h-8 text-sm"
                    autoFocus
                    onKeyDown={e => { if (e.key === "Enter") handleAddItem(); if (e.key === "Escape") setAddingItem(false); }}
                  />
                </div>
                <div className="w-24 shrink-0">
                  <label className="text-xs text-muted-foreground mb-1 block">Qty</label>
                  <Input
                    value={newQty}
                    onChange={e => setNewQty(e.target.value)}
                    placeholder="e.g. 45"
                    className="h-8 text-sm"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleAddItem} disabled={!newDesc.trim()} className="text-xs h-7" style={{ background: "var(--bm-petrol)" }}>
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
              className="w-full text-xs h-7 border border-dashed hover:border-solid mt-1"
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

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function BaseInclusionsTab({ projectId }: { projectId: number }) {
  const utils = trpc.useUtils();
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const { data: categories, isLoading, refetch } = trpc.inclusionMaster.listCategories.useQuery(
    { projectId },
    { refetchOnWindowFocus: false }
  );

  const seedDefaults = trpc.inclusionMaster.seedDefaults.useMutation({
    onSuccess: () => {
      toast.success("Default categories added");
      utils.inclusionMaster.listCategories.invalidate();
    },
    onError: e => toast.error(e.message),
  });

  const addCategory = trpc.inclusionMaster.addCategory.useMutation({
    onSuccess: () => {
      utils.inclusionMaster.listCategories.invalidate();
      setNewCategoryName("");
      setAddingCategory(false);
    },
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

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold" style={{ fontFamily: "Cormorant Garamond, serif", color: "var(--bm-petrol)" }}>
            Base Inclusions
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Contract schedule of included items. Upload a BOQ to auto-populate. Check/uncheck to include or exclude.
            Click <Edit size={10} className="inline mx-0.5" /> to edit — then use the <Sparkles size={10} className="inline mx-0.5" style={{ color: "var(--bm-petrol)" }} /> button for AI tender wording suggestions.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {(!categories || categories.length === 0) && (
            <Button
              size="sm" variant="outline"
              onClick={() => seedDefaults.mutate({ projectId })}
              disabled={seedDefaults.isPending}
              className="text-xs h-8"
              style={{ color: "var(--bm-petrol)", borderColor: "var(--bm-petrol)" }}
            >
              <Wand2 size={13} className="mr-1.5" />
              {seedDefaults.isPending ? "Adding..." : "Add Default Categories"}
            </Button>
          )}
          <Button
            size="sm"
            onClick={() => setAddingCategory(true)}
            className="text-xs h-8"
            style={{ background: "var(--bm-petrol)" }}
          >
            <Plus size={13} className="mr-1.5" /> Add Category
          </Button>
        </div>
      </div>

      {/* Add category */}
      {addingCategory && (
        <div className="border rounded-lg p-3 flex items-center gap-2" style={{ borderColor: "var(--bm-petrol)" }}>
          <Input
            value={newCategoryName}
            onChange={e => setNewCategoryName(e.target.value)}
            placeholder="Category name (e.g. Electrical)"
            className="h-8 text-sm flex-1"
            autoFocus
            onKeyDown={e => {
              if (e.key === "Enter" && newCategoryName.trim()) addCategory.mutate({ projectId, name: newCategoryName, position: categories?.length ?? 0 });
              if (e.key === "Escape") { setAddingCategory(false); setNewCategoryName(""); }
            }}
          />
          <Button
            size="sm"
            onClick={() => addCategory.mutate({ projectId, name: newCategoryName, position: categories?.length ?? 0 })}
            disabled={!newCategoryName.trim() || addCategory.isPending}
            className="h-8 text-xs"
            style={{ background: "var(--bm-petrol)" }}
          >
            <Check size={12} className="mr-1" /> Add
          </Button>
          <Button size="sm" variant="ghost" onClick={() => { setAddingCategory(false); setNewCategoryName(""); }} className="h-8 text-xs">
            <X size={12} />
          </Button>
        </div>
      )}

      {/* Empty state */}
      {(!categories || categories.length === 0) && !addingCategory && (
        <div className="text-center py-12 border rounded-lg border-dashed" style={{ borderColor: "var(--border)" }}>
          <Layers size={32} className="mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm font-medium mb-1" style={{ fontFamily: "Cormorant Garamond, serif" }}>No inclusions yet</p>
          <p className="text-xs text-muted-foreground mb-4">
            Upload a BOQ to auto-populate, or click "Add Default Categories" to start manually.
          </p>
        </div>
      )}

      {/* Category cards */}
      <div className="space-y-3">
        {categories?.map(cat => (
          <CategoryCard
            key={cat.id}
            category={cat}
            projectId={projectId}
            onRefresh={handleRefresh}
          />
        ))}
      </div>

      {/* Summary */}
      {totalItems > 0 && (
        <div className="text-xs text-muted-foreground text-right pt-2">
          {totalIncluded} of {totalItems} items included
        </div>
      )}
    </div>
  );
}
