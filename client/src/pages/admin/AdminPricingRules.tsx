import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Pencil, Check, X, ChevronDown, ChevronUp, DollarSign, Info } from "lucide-react";

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

function RuleRow({ rule, onSave }: { rule: PricingRule; onSave: (id: number, data: Partial<PricingRule>) => Promise<void> }) {
  const [editing, setEditing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [form, setForm] = useState({
    tier1Label: rule.tier1Label ?? "",
    tier2Label: rule.tier2Label ?? "",
    tier2CostPerUnit: rule.tier2CostPerUnit ?? "0",
    tier2Description: rule.tier2Description ?? "",
    tier2Qty: rule.tier2Qty ?? 0,
    tier3Label: rule.tier3Label ?? "",
    tier3CostPerUnit: rule.tier3CostPerUnit ?? "0",
    tier3Description: rule.tier3Description ?? "",
    tier3Qty: rule.tier3Qty ?? 0,
  });
  const [saving, setSaving] = useState(false);

  const unitLabel = rule.unit === "fixed" ? "fixed cost" : `per ${rule.unit}`;

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(rule.id, {
        tier1Label: form.tier1Label || null,
        tier2Label: form.tier2Label || null,
        tier2CostPerUnit: form.tier2CostPerUnit,
        tier2Description: form.tier2Description || null,
        tier2Qty: form.tier2Qty || null,
        tier3Label: form.tier3Label || null,
        tier3CostPerUnit: form.tier3CostPerUnit,
        tier3Description: form.tier3Description || null,
        tier3Qty: form.tier3Qty || null,
      });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      {/* Header row */}
      <div
        className="flex items-center justify-between p-3 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="font-medium text-sm">{rule.label}</span>
          <Badge variant="outline" className="text-xs shrink-0">{unitLabel}</Badge>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-muted-foreground">
            T2: +${parseFloat(rule.tier2CostPerUnit ?? "0").toLocaleString()}
            {rule.unit !== "fixed" ? `/${rule.unit}` : ""}
            &nbsp;·&nbsp;
            T3: +${parseFloat(rule.tier3CostPerUnit ?? "0").toLocaleString()}
            {rule.unit !== "fixed" ? `/${rule.unit}` : ""}
          </span>
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="p-4 space-y-4">
          {editing ? (
            <div className="space-y-4">
              {/* Tier 1 */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Tier 1 — Built for Excellence (included in base price)</label>
                <Input
                  value={form.tier1Label}
                  onChange={e => setForm(f => ({ ...f, tier1Label: e.target.value }))}
                  placeholder="What's included in the base price..."
                  className="text-sm"
                />
              </div>
              {/* Tier 2 */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-amber-600 uppercase tracking-wide block">Tier 2 — Tailored Living</label>
                <Input
                  value={form.tier2Label}
                  onChange={e => setForm(f => ({ ...f, tier2Label: e.target.value }))}
                  placeholder="Tier 2 specification..."
                  className="text-sm"
                />
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground shrink-0" />
                  <Input
                    type="number"
                    value={form.tier2CostPerUnit}
                    onChange={e => setForm(f => ({ ...f, tier2CostPerUnit: e.target.value }))}
                    placeholder="Extra cost"
                    className="text-sm w-40"
                  />
                  <span className="text-xs text-muted-foreground">{unitLabel} above Tier 1</span>
                </div>
                {rule.category.toLowerCase() === "electrical" && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-28 shrink-0">Tier 2 qty (upgraded):</span>
                    <Input
                      type="number"
                      value={form.tier2Qty}
                      onChange={e => setForm(f => ({ ...f, tier2Qty: parseInt(e.target.value) || 0 }))}
                      placeholder="e.g. 40"
                      className="text-sm w-24"
                    />
                    <span className="text-xs text-muted-foreground">units in Tier 2 (cost = extra units × price)</span>
                  </div>
                )}
                <Textarea
                  value={form.tier2Description}
                  onChange={e => setForm(f => ({ ...f, tier2Description: e.target.value }))}
                  placeholder="Description shown to client..."
                  className="text-sm min-h-[60px]"
                />
              </div>
              {/* Tier 3 */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-purple-600 uppercase tracking-wide block">Tier 3 — Signature Series</label>
                <Input
                  value={form.tier3Label}
                  onChange={e => setForm(f => ({ ...f, tier3Label: e.target.value }))}
                  placeholder="Tier 3 specification..."
                  className="text-sm"
                />
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground shrink-0" />
                  <Input
                    type="number"
                    value={form.tier3CostPerUnit}
                    onChange={e => setForm(f => ({ ...f, tier3CostPerUnit: e.target.value }))}
                    placeholder="Extra cost"
                    className="text-sm w-40"
                  />
                  <span className="text-xs text-muted-foreground">{unitLabel} above Tier 1</span>
                </div>
                {rule.category.toLowerCase() === "electrical" && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-28 shrink-0">Tier 3 qty (upgraded):</span>
                    <Input
                      type="number"
                      value={form.tier3Qty}
                      onChange={e => setForm(f => ({ ...f, tier3Qty: parseInt(e.target.value) || 0 }))}
                      placeholder="e.g. 40"
                      className="text-sm w-24"
                    />
                    <span className="text-xs text-muted-foreground">units in Tier 3 (cost = all units × premium price)</span>
                  </div>
                )}
                <Textarea
                  value={form.tier3Description}
                  onChange={e => setForm(f => ({ ...f, tier3Description: e.target.value }))}
                  placeholder="Description shown to client..."
                  className="text-sm min-h-[60px]"
                />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSave} disabled={saving}>
                  <Check className="h-3 w-3 mr-1" /> {saving ? "Saving..." : "Save"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
                  <X className="h-3 w-3 mr-1" /> Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Tier 1 */}
                <div className="rounded-md bg-slate-50 dark:bg-slate-900 p-3 border border-slate-200 dark:border-slate-700">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Tier 1 — Base</div>
                  <div className="text-sm">{rule.tier1Label || <span className="text-muted-foreground italic">Not set</span>}</div>
                  <div className="text-xs text-muted-foreground mt-1">Included in base price</div>
                </div>
                {/* Tier 2 */}
                <div className="rounded-md bg-amber-50 dark:bg-amber-950/20 p-3 border border-amber-200 dark:border-amber-800">
                  <div className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-1">Tier 2 — Tailored Living</div>
                  <div className="text-sm">{rule.tier2Label || <span className="text-muted-foreground italic">Not set</span>}</div>
                  <div className="text-xs font-medium text-amber-700 mt-1">
                    +${parseFloat(rule.tier2CostPerUnit ?? "0").toLocaleString()} {unitLabel}
                  </div>
                  {rule.tier2Description && <div className="text-xs text-muted-foreground mt-1">{rule.tier2Description}</div>}
                </div>
                {/* Tier 3 */}
                <div className="rounded-md bg-purple-50 dark:bg-purple-950/20 p-3 border border-purple-200 dark:border-purple-800">
                  <div className="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-1">Tier 3 — Signature</div>
                  <div className="text-sm">{rule.tier3Label || <span className="text-muted-foreground italic">Not set</span>}</div>
                  <div className="text-xs font-medium text-purple-700 mt-1">
                    +${parseFloat(rule.tier3CostPerUnit ?? "0").toLocaleString()} {unitLabel}
                  </div>
                  {rule.tier3Description && <div className="text-xs text-muted-foreground mt-1">{rule.tier3Description}</div>}
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                <Pencil className="h-3 w-3 mr-1" /> Edit Pricing
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminPricingRules() {
  const { data: rules, isLoading, refetch } = trpc.pricingRules.list.useQuery();
  const updateMutation = trpc.pricingRules.update.useMutation();
  const categories = useMemo(() => {
    if (!rules) return [];
    const map: Record<string, PricingRule[]> = {};
    for (const rule of rules) {
      if (!map[rule.category]) map[rule.category] = [];
      map[rule.category].push(rule as PricingRule);
    }
    return Object.entries(map);
  }, [rules]);

  const handleSave = async (id: number, data: Partial<PricingRule>) => {
    await updateMutation.mutateAsync({
      id,
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
    toast.success("Pricing rule updated", { description: "Changes will apply to all future package calculations." });
    refetch();
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Upgrade Pricing Rules</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          These rules are set once and apply to every project. When you enter a project's base price and quantities,
          the system automatically calculates the Tailored Living and Signature Series package totals.
        </p>
      </div>

      <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
        <Info className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
        <div className="text-sm text-blue-800 dark:text-blue-200">
          <strong>How pricing works:</strong> For each item, enter the extra cost per unit to upgrade from Tier 1 to Tier 2 or Tier 3.
          For <em>fixed cost</em> items (appliances, facade, etc.) the quantity is always 1.
          For <em>per unit</em> items (downlights, flooring, etc.) the cost is multiplied by the project quantity you enter in each project's Quantities tab.
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading pricing rules...</div>
      ) : (
        <div className="space-y-8">
          {categories.map(([category, categoryRules]) => (
            <div key={category}>
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-base font-semibold">{category}</h2>
                <Separator className="flex-1" />
              </div>
              <div className="space-y-2">
                {categoryRules.map(rule => (
                  <RuleRow key={rule.id} rule={rule} onSave={handleSave} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
