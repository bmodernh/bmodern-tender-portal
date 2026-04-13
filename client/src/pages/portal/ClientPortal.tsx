import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Check, ChevronDown, ChevronUp, Upload, Send,
  Shield, Star, Crown, Loader2, Plus,
  MessageSquarePlus, ExternalLink, Clock, CheckCircle2, XCircle,
  AlertCircle, FileText, ScrollText, Sparkles, Lock, Image as ImageIcon,
} from "lucide-react";
import { FloatingChatButton } from "@/components/ProjectChat";

const LOGO_WHITE = "https://d2xsxph8kpxj0f.cloudfront.net/310519663548387177/imEXQJppF9z2GgJphACuNv/B-Modern-Homes_Logo_Horizontal-White_RGB_82d45951.png";
const LOGO_DARK = "https://d2xsxph8kpxj0f.cloudfront.net/310519663548387177/imEXQJppF9z2GgJphACuNv/B-Modern-Homes_Logo_Horizontal-Monochrome_RGB_233b3af0.png";

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmt(value: number | string | null | undefined): string {
  const n = typeof value === "string" ? parseFloat(value) : (value ?? 0);
  return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}
function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return "";
  return new Date(d as any).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" });
}

const TIER_META = [
  { tier: 1, name: "Built for Excellence", icon: Shield, accent: "#203E4A", bg: "bg-[#203E4A]/5", border: "border-[#203E4A]/20", ring: "ring-[#203E4A]", gradient: "from-[#203E4A] to-[#2a5060]" },
  { tier: 2, name: "Tailored Living", icon: Star, accent: "#b45309", bg: "bg-amber-50", border: "border-amber-200", ring: "ring-amber-500", gradient: "from-amber-600 to-amber-500" },
  { tier: 3, name: "Signature Series", icon: Crown, accent: "#6b21a8", bg: "bg-purple-50", border: "border-purple-200", ring: "ring-purple-600", gradient: "from-purple-700 to-purple-500" },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  submitted: { label: "Submitted", color: "bg-blue-100 text-blue-800", icon: Clock },
  under_review: { label: "Under Review", color: "bg-amber-100 text-amber-800", icon: AlertCircle },
  priced: { label: "Priced", color: "bg-green-100 text-green-800", icon: CheckCircle2 },
  approved: { label: "Approved", color: "bg-emerald-100 text-emerald-800", icon: CheckCircle2 },
  declined: { label: "Declined", color: "bg-red-100 text-red-800", icon: XCircle },
};

// ─── Loader ──────────────────────────────────────────────────────────────────
function PortalLoader() {
  return (
    <div className="min-h-screen bg-[#f8f6f1] flex items-center justify-center">
      <div className="text-center">
        <img src={LOGO_DARK} alt="B Modern Homes" className="h-12 mx-auto mb-6 opacity-60" />
        <div className="relative w-10 h-10 mx-auto mb-4">
          <div className="absolute inset-0 rounded-full border-2 border-[#203E4A]/10" />
          <div className="absolute inset-0 rounded-full border-2 border-t-[#203E4A] animate-spin" />
        </div>
        <p className="text-[#6D7E94] font-['Lato'] tracking-wide text-sm">Loading your proposal...</p>
      </div>
    </div>
  );
}

// ─── T&C Gate ────────────────────────────────────────────────────────────────
function TermsGate({ token, onAccepted }: { token: string; onAccepted: () => void }) {
  const { data: terms, isLoading } = trpc.portal.getTerms.useQuery({ token });
  const ack = trpc.portal.acknowledgeTerms.useMutation({ onSuccess: onAccepted, onError: (e) => toast.error(e.message) });
  const scrollRef = useRef<HTMLDivElement>(null);
  const [atBottom, setAtBottom] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => { if (!isLoading && (!terms || !terms.content)) onAccepted(); }, [isLoading, terms]);

  if (isLoading) return <PortalLoader />;
  if (!terms?.content) return null;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[#f8f6f1]">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <img src={LOGO_DARK} alt="B Modern Homes" className="h-8 mx-auto mb-4" />
          <div className="flex items-center justify-center gap-2 mb-2">
            <ScrollText size={20} className="text-[#203E4A]" />
            <h1 className="text-xl font-['Playfair_Display_SC'] text-[#203E4A] tracking-wider">Terms & Conditions</h1>
          </div>
          <p className="text-sm text-[#6D7E94] font-['Lato']">Please read and accept the terms before viewing your proposal.</p>
        </div>
        <div className="bg-white rounded-xl border shadow-sm mb-6 overflow-hidden">
          <div ref={scrollRef} onScroll={() => { const el = scrollRef.current; if (el && el.scrollTop + el.clientHeight >= el.scrollHeight - 20) setAtBottom(true); }}
            className="p-6 overflow-y-auto text-sm leading-relaxed max-h-[380px] font-['Lato'] text-[#203E4A]" style={{ whiteSpace: "pre-wrap" }}>
            {terms.content}
          </div>
          {!atBottom && <div className="px-6 py-2 bg-amber-50 border-t border-amber-100 text-xs text-amber-700 flex items-center gap-1.5 font-['Lato']"><ChevronDown size={13} /> Scroll to read the full terms</div>}
        </div>
        <div className="space-y-4">
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${checked ? "border-[#203E4A] bg-[#203E4A]" : "border-gray-300 group-hover:border-[#203E4A]"}`} onClick={() => setChecked(!checked)}>
              {checked && <Check size={12} className="text-white" />}
            </div>
            <span className="text-sm font-['Lato'] text-[#203E4A] leading-relaxed">I have read and agree to the Terms & Conditions set out above.</span>
          </label>
          <Button className="w-full h-11 bg-[#203E4A] hover:bg-[#2a5060] text-white font-['Lato'] tracking-wide" disabled={!checked || ack.isPending} onClick={() => ack.mutate({ token })}>
            {ack.isPending ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
            Accept & View Proposal
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Hero Section ────────────────────────────────────────────────────────────
function HeroSection({ project }: { project: any }) {
  return (
    <div className="relative overflow-hidden">
      {project.heroImageUrl ? (
        <div className="relative h-[42vh] min-h-[340px]">
          <img src={project.heroImageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#203E4A] via-[#203E4A]/50 to-[#203E4A]/10" />
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
            <img src={LOGO_WHITE} alt="B Modern Homes" className="h-8 mb-6" />
            <h1 className="font-['Playfair_Display_SC'] text-2xl md:text-4xl text-white tracking-wider mb-1.5">{project.clientName}</h1>
            <p className="text-white/80 font-['Lato'] text-base md:text-lg tracking-wide">{project.projectAddress}</p>
            <div className="flex flex-wrap gap-2 mt-4">
              <Badge variant="outline" className="bg-white/10 text-white border-white/20 text-xs font-['Lato'] backdrop-blur-sm">#{project.proposalNumber}</Badge>
              {project.projectType && <Badge variant="outline" className="bg-white/10 text-white border-white/20 text-xs font-['Lato'] backdrop-blur-sm">{project.projectType}</Badge>}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-br from-[#203E4A] via-[#1a3540] to-[#162d36] px-6 py-12 md:px-10 md:py-16">
          <img src={LOGO_WHITE} alt="B Modern Homes" className="h-8 mb-8" />
          <h1 className="font-['Playfair_Display_SC'] text-2xl md:text-4xl text-white tracking-wider mb-1.5">{project.clientName}</h1>
          <p className="text-white/80 font-['Lato'] text-base md:text-lg tracking-wide">{project.projectAddress}</p>
          <div className="flex flex-wrap gap-2 mt-4">
            <Badge variant="outline" className="bg-white/10 text-white border-white/20 text-xs font-['Lato']">#{project.proposalNumber}</Badge>
            {project.projectType && <Badge variant="outline" className="bg-white/10 text-white border-white/20 text-xs font-['Lato']">{project.projectType}</Badge>}
          </div>
        </div>
      )}
      {/* Price bar */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#6D7E94] font-['Lato'] font-semibold mb-1">Base Contract Price</p>
            <p className="text-3xl md:text-4xl font-bold text-[#203E4A] font-['Lato'] tracking-tight">{fmt(project.baseContractPrice)}</p>
          </div>
          <div className="flex gap-8 text-sm text-[#6D7E94]">
            {project.tenderExpiryDate && (
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] font-semibold mb-0.5 font-['Lato']">Valid Until</p>
                <p className="font-semibold text-[#203E4A] text-sm font-['Lato']">{fmtDate(project.tenderExpiryDate)}</p>
              </div>
            )}
            {project.buildType && (
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] font-semibold mb-0.5 font-['Lato']">Build Type</p>
                <p className="font-semibold text-[#203E4A] text-sm font-['Lato']">{project.buildType}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Product Image Thumbnail ────────────────────────────────────────────────
function ProductImage({ url, name }: { url?: string | null; name: string }) {
  const [error, setError] = useState(false);
  if (!url || error) {
    return (
      <div className="w-14 h-14 rounded-lg bg-[#203E4A]/5 flex items-center justify-center flex-shrink-0">
        <ImageIcon className="w-5 h-5 text-[#6D7E94]/40" />
      </div>
    );
  }
  return (
    <img
      src={url}
      alt={name}
      onError={() => setError(true)}
      className="w-14 h-14 rounded-lg object-cover flex-shrink-0 border border-gray-100 shadow-sm"
    />
  );
}

// ─── Section 1: Base Inclusions ──────────────────────────────────────────────
function BaseInclusionsSection({ token }: { token: string }) {
  const { data: categories } = trpc.portal.getBaseInclusions.useQuery({ token });
  const [expandedCats, setExpandedCats] = useState<Set<number>>(new Set());

  const toggleCat = (id: number) => {
    setExpandedCats(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Auto-expand first category (must be before early return to respect hooks order)
  useEffect(() => {
    if (categories && categories.length > 0 && expandedCats.size === 0) {
      setExpandedCats(new Set([categories[0].id]));
    }
  }, [categories]);

  if (!categories || categories.length === 0) return null;

  return (
    <section className="py-12 md:py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Section header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-[#203E4A] flex items-center justify-center">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="font-['Playfair_Display_SC'] text-xl md:text-2xl text-[#203E4A] tracking-wider">Base Inclusions</h2>
            <p className="text-xs text-[#6D7E94] font-['Lato'] mt-0.5">Built for Excellence — included in your base contract price</p>
          </div>
        </div>

        <div className="mt-8 space-y-3">
          {categories.map((cat: any) => {
            const isOpen = expandedCats.has(cat.id);
            const itemCount = cat.items?.length ?? 0;
            return (
              <div key={cat.id} className="bg-white rounded-xl border shadow-sm overflow-hidden transition-all hover:shadow-md">
                <button onClick={() => toggleCat(cat.id)} className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#203E4A]/8 flex items-center justify-center">
                      <span className="text-xs font-bold text-[#203E4A] font-['Lato']">{itemCount}</span>
                    </div>
                    <span className="font-['Playfair_Display_SC'] text-sm tracking-wider text-[#203E4A]">{cat.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px] font-['Lato'] bg-[#203E4A]/5 text-[#6D7E94]">{itemCount} items</Badge>
                    {isOpen ? <ChevronUp className="h-4 w-4 text-[#6D7E94]" /> : <ChevronDown className="h-4 w-4 text-[#6D7E94]" />}
                  </div>
                </button>
                {isOpen && (
                  <div className="border-t divide-y divide-gray-50">
                    {cat.items.map((item: any) => (
                      <div key={item.id} className="px-5 py-3.5 flex items-center gap-4 hover:bg-gray-50/30 transition-colors">
                        <ProductImage url={item.imageUrl} name={item.name} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-semibold text-[#203E4A] font-['Lato'] truncate">{item.name}</h4>
                            {item.included === false && (
                              <Badge variant="outline" className="text-[9px] border-red-200 text-red-600 bg-red-50">Excluded</Badge>
                            )}
                          </div>
                          {item.description && (
                            <p className="text-xs text-[#6D7E94] font-['Lato'] mt-0.5 line-clamp-2 leading-relaxed">{item.description}</p>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          {item.qty ? (
                            <span className="text-sm font-semibold text-[#203E4A] font-['Lato']">
                              {item.qty} <span className="text-xs font-normal text-[#6D7E94]">{item.unit || ""}</span>
                            </span>
                          ) : (
                            <span className="text-xs text-[#6D7E94]">—</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── Section 2: Upgrade Selections (Cross-Tier Pick & Choose) ────────────────
function UpgradeSelectionsSection({
  token,
  project,
  onTotalChange,
}: {
  token: string;
  project: any;
  onTotalChange: (upgradeTotal: number) => void;
}) {
  const { data: priceData } = trpc.portal.getPackagePrices.useQuery({ token });
  const { data: mySelections } = trpc.portal.getItemSelections.useQuery({ token });
  const utils = trpc.useUtils();
  const selectMut = trpc.portal.selectItem.useMutation({
    onSuccess: () => utils.portal.getItemSelections.invalidate(),
    onError: (e) => toast.error(e.message),
  });

  const selectionMap = useMemo(() => {
    const m: Record<string, number> = {};
    if (mySelections) for (const s of mySelections) m[s.itemKey] = s.selectedTier;
    return m;
  }, [mySelections]);

  const grouped = useMemo(() => {
    if (!priceData?.lineItems) return [];
    const map = new Map<string, typeof priceData.lineItems>();
    for (const item of priceData.lineItems) {
      if (!map.has(item.category)) map.set(item.category, []);
      map.get(item.category)!.push(item);
    }
    return Array.from(map.entries()).map(([cat, items]) => ({ category: cat, items }));
  }, [priceData]);

  const upgradeTotal = useMemo(() => {
    if (!priceData?.lineItems) return 0;
    let total = 0;
    for (const item of priceData.lineItems) {
      const tier = selectionMap[item.itemKey] ?? 1;
      if (tier === 2) total += Number(item.tier2Delta || 0);
      else if (tier === 3) total += Number(item.tier3Delta || 0);
    }
    return total;
  }, [priceData, selectionMap]);

  useEffect(() => { onTotalChange(upgradeTotal); }, [upgradeTotal]);

  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());
  const toggleCat = (cat: string) => {
    setExpandedCats(prev => { const n = new Set(prev); n.has(cat) ? n.delete(cat) : n.add(cat); return n; });
  };

  if (!priceData || grouped.length === 0) return null;

  const handleSelect = (itemKey: string, tier: number) => {
    if (!!project.portalLockedAt) return;
    selectMut.mutate({ token, itemKey, selectedTier: tier });
  };

  return (
    <section className="py-12 md:py-16 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Section header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="font-['Playfair_Display_SC'] text-xl md:text-2xl text-[#203E4A] tracking-wider">Upgrade Options</h2>
            <p className="text-xs text-[#6D7E94] font-['Lato'] mt-0.5">Mix and match from any tier to customise your home</p>
          </div>
        </div>

        {/* Tier legend */}
        <div className="flex flex-wrap gap-2 mt-6 mb-8">
          {TIER_META.map(t => {
            const Icon = t.icon;
            return (
              <div key={t.tier} className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-['Lato'] font-semibold ${t.bg} ${t.border} border shadow-sm`}>
                <Icon className="h-3.5 w-3.5" style={{ color: t.accent }} />
                <span style={{ color: t.accent }}>{t.name}</span>
              </div>
            );
          })}
        </div>

        <div className="space-y-3">
          {grouped.map(({ category, items }) => {
            const isOpen = expandedCats.has(category);
            const catUpgrade = items.reduce((sum, item) => {
              const tier = selectionMap[item.itemKey] ?? 1;
              if (tier === 2) return sum + Number(item.tier2Delta || 0);
              if (tier === 3) return sum + Number(item.tier3Delta || 0);
              return sum;
            }, 0);

            return (
              <div key={category} className="border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                <button onClick={() => toggleCat(category)} className="w-full flex items-center justify-between px-5 py-4 bg-gray-50/80 hover:bg-gray-100/80 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="font-['Playfair_Display_SC'] text-sm tracking-wider text-[#203E4A]">{category}</span>
                    <Badge variant="secondary" className="text-[10px] font-['Lato'] bg-[#203E4A]/5 text-[#6D7E94]">{items.length} items</Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    {catUpgrade > 0 && (
                      <span className="text-xs font-['Lato'] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">+{fmt(catUpgrade)}</span>
                    )}
                    {catUpgrade < 0 && (
                      <span className="text-xs font-['Lato'] font-bold text-green-700 bg-green-50 px-2.5 py-1 rounded-full">{fmt(catUpgrade)}</span>
                    )}
                    {isOpen ? <ChevronUp className="h-4 w-4 text-[#6D7E94]" /> : <ChevronDown className="h-4 w-4 text-[#6D7E94]" />}
                  </div>
                </button>
                {isOpen && (
                  <div className="divide-y">
                    {items.map(item => {
                      const currentTier = selectionMap[item.itemKey] ?? 1;
                      return (
                        <div key={item.itemKey} className="px-5 py-5">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="font-['Lato'] font-bold text-[#203E4A] text-sm">{item.label}</h4>
                            {item.qty > 0 && (
                              <span className="text-xs text-[#6D7E94] font-['Lato'] bg-gray-100 px-2.5 py-1 rounded-full">
                                {item.qty} {item.unit}
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {/* Tier 1 — Base (included) */}
                            <button
                              onClick={() => handleSelect(item.itemKey, 1)}
                              className={`relative rounded-xl border-2 p-4 text-left transition-all group ${
                                currentTier === 1
                                  ? "border-[#203E4A] bg-[#203E4A]/5 shadow-md ring-1 ring-[#203E4A]/20"
                                  : "border-gray-200 hover:border-[#203E4A]/40 hover:shadow-sm"
                              }`}
                            >
                              {currentTier === 1 && (
                                <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#203E4A] flex items-center justify-center">
                                  <Check className="h-3 w-3 text-white" />
                                </div>
                              )}
                              {/* Image */}
                              {item.tier1ImageUrl && (
                                <img src={item.tier1ImageUrl} alt="" className="w-full h-20 object-cover rounded-lg mb-3" />
                              )}
                              <div className="flex items-center gap-1.5 mb-2">
                                <Shield className="h-3.5 w-3.5 text-[#203E4A]" />
                                <span className="text-[10px] uppercase tracking-[0.12em] font-bold text-[#203E4A] font-['Lato']">Base</span>
                              </div>
                              <p className="text-xs text-[#203E4A] font-['Lato'] leading-relaxed line-clamp-2">{item.tier1Label || "Standard inclusion"}</p>
                              <p className="text-sm font-bold text-[#203E4A] mt-2 font-['Lato']">Included</p>
                            </button>

                            {/* Tier 2 */}
                            <button
                              onClick={() => handleSelect(item.itemKey, 2)}
                              className={`relative rounded-xl border-2 p-4 text-left transition-all group ${
                                currentTier === 2
                                  ? "border-amber-500 bg-amber-50 shadow-md ring-1 ring-amber-200"
                                  : "border-gray-200 hover:border-amber-300 hover:shadow-sm"
                              }`}
                            >
                              {currentTier === 2 && (
                                <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center">
                                  <Check className="h-3 w-3 text-white" />
                                </div>
                              )}
                              {item.tier2ImageUrl && (
                                <img src={item.tier2ImageUrl} alt="" className="w-full h-20 object-cover rounded-lg mb-3" />
                              )}
                              <div className="flex items-center gap-1.5 mb-2">
                                <Star className="h-3.5 w-3.5 text-amber-600" />
                                <span className="text-[10px] uppercase tracking-[0.12em] font-bold text-amber-700 font-['Lato']">Tailored</span>
                              </div>
                              <p className="text-xs text-gray-700 font-['Lato'] leading-relaxed line-clamp-2">{item.tier2Label || "Upgrade option"}</p>
                              {item.tier2Description && <p className="text-[11px] text-gray-500 mt-1 font-['Lato'] line-clamp-1">{item.tier2Description}</p>}
                              <p className="text-sm font-bold text-amber-700 mt-2 font-['Lato']">
                                {Number(item.tier2Delta) > 0 ? `+${fmt(item.tier2Delta)}` : Number(item.tier2Delta) < 0 ? fmt(item.tier2Delta) : "Included"}
                              </p>
                            </button>

                            {/* Tier 3 */}
                            <button
                              onClick={() => handleSelect(item.itemKey, 3)}
                              className={`relative rounded-xl border-2 p-4 text-left transition-all group ${
                                currentTier === 3
                                  ? "border-purple-500 bg-purple-50 shadow-md ring-1 ring-purple-200"
                                  : "border-gray-200 hover:border-purple-300 hover:shadow-sm"
                              }`}
                            >
                              {currentTier === 3 && (
                                <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center">
                                  <Check className="h-3 w-3 text-white" />
                                </div>
                              )}
                              {item.tier3ImageUrl && (
                                <img src={item.tier3ImageUrl} alt="" className="w-full h-20 object-cover rounded-lg mb-3" />
                              )}
                              <div className="flex items-center gap-1.5 mb-2">
                                <Crown className="h-3.5 w-3.5 text-purple-600" />
                                <span className="text-[10px] uppercase tracking-[0.12em] font-bold text-purple-700 font-['Lato']">Signature</span>
                              </div>
                              <p className="text-xs text-gray-700 font-['Lato'] leading-relaxed line-clamp-2">{item.tier3Label || "Premium option"}</p>
                              {item.tier3Description && <p className="text-[11px] text-gray-500 mt-1 font-['Lato'] line-clamp-1">{item.tier3Description}</p>}
                              <p className="text-sm font-bold text-purple-700 mt-2 font-['Lato']">
                                {Number(item.tier3Delta) > 0 ? `+${fmt(item.tier3Delta)}` : Number(item.tier3Delta) < 0 ? fmt(item.tier3Delta) : "Included"}
                              </p>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── Section 3: Custom Item Request ──────────────────────────────────────────
function CustomItemRequestSection({ token }: { token: string }) {
  const utils = trpc.useUtils();
  const { data: myRequests } = trpc.portal.getMyCustomItemRequests.useQuery({ token });
  const submitMut = trpc.portal.submitCustomItemRequest.useMutation({
    onSuccess: () => {
      utils.portal.getMyCustomItemRequests.invalidate();
      toast.success("Custom item request submitted! We'll review and respond with pricing.");
      setForm({ itemName: "", description: "", preferredBrand: "", referenceUrl: "", room: "", quantity: 1 });
      setShowForm(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ itemName: "", description: "", preferredBrand: "", referenceUrl: "", room: "", quantity: 1 });

  return (
    <section className="py-12 md:py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-[#203E4A]/10 flex items-center justify-center">
            <MessageSquarePlus className="h-5 w-5 text-[#203E4A]" />
          </div>
          <div>
            <h2 className="font-['Playfair_Display_SC'] text-xl md:text-2xl text-[#203E4A] tracking-wider">Custom Requests</h2>
            <p className="text-xs text-[#6D7E94] font-['Lato'] mt-0.5">Request items not listed above — we'll price them for you</p>
          </div>
        </div>

        <div className="mt-8 space-y-4">
          {/* Existing requests */}
          {myRequests && myRequests.length > 0 && (
            <div className="space-y-3">
              {myRequests.map((req: any) => {
                const status = STATUS_CONFIG[req.status] || STATUS_CONFIG.submitted;
                const StatusIcon = status.icon;
                return (
                  <Card key={req.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-sm font-semibold text-[#203E4A] font-['Lato']">{req.itemName}</h4>
                            <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold ${status.color}`}>
                              <StatusIcon className="h-3 w-3" /> {status.label}
                            </span>
                          </div>
                          {req.description && <p className="text-xs text-[#6D7E94] font-['Lato']">{req.description}</p>}
                          <div className="flex flex-wrap gap-3 mt-2 text-[11px] text-[#6D7E94] font-['Lato']">
                            {req.preferredBrand && <span>Brand: <strong>{req.preferredBrand}</strong></span>}
                            {req.room && <span>Room: <strong>{req.room}</strong></span>}
                            {req.quantity > 1 && <span>Qty: <strong>{req.quantity}</strong></span>}
                          </div>
                        </div>
                        {req.adminPrice && (
                          <div className="text-right flex-shrink-0">
                            <p className="text-[10px] uppercase tracking-[0.1em] text-[#6D7E94] font-['Lato']">Quoted</p>
                            <p className="text-lg font-bold text-[#203E4A] font-['Lato']">{fmt(req.adminPrice)}</p>
                          </div>
                        )}
                      </div>
                      {req.adminNotes && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <p className="text-[10px] uppercase tracking-[0.1em] text-[#6D7E94] font-['Lato'] mb-0.5">Notes from B Modern</p>
                          <p className="text-xs text-[#203E4A] font-['Lato']">{req.adminNotes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Add request button / form */}
          {!showForm ? (
            <Button
              variant="outline"
              onClick={() => setShowForm(true)}
              className="border-dashed border-[#203E4A]/30 text-[#203E4A] hover:bg-[#203E4A]/5 font-['Lato'] h-12"
            >
              <Plus className="h-4 w-4 mr-2" /> Request a Custom Item
            </Button>
          ) : (
            <Card className="border-[#203E4A]/20">
              <CardContent className="p-5 space-y-4">
                <h3 className="font-['Playfair_Display_SC'] text-sm text-[#203E4A] tracking-wider">New Custom Item Request</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-[#203E4A] font-['Lato'] mb-1 block">Item Name *</label>
                    <Input placeholder="e.g. Underfloor Heating" value={form.itemName} onChange={e => setForm(f => ({ ...f, itemName: e.target.value }))} className="font-['Lato'] text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[#203E4A] font-['Lato'] mb-1 block">Preferred Brand</label>
                    <Input placeholder="e.g. Warmtech" value={form.preferredBrand} onChange={e => setForm(f => ({ ...f, preferredBrand: e.target.value }))} className="font-['Lato'] text-sm" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs font-medium text-[#203E4A] font-['Lato'] mb-1 block">Description</label>
                    <Textarea placeholder="Describe what you're looking for..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="font-['Lato'] text-sm" rows={2} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[#203E4A] font-['Lato'] mb-1 block">Room / Area</label>
                    <Input placeholder="e.g. Master Bedroom" value={form.room} onChange={e => setForm(f => ({ ...f, room: e.target.value }))} className="font-['Lato'] text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[#203E4A] font-['Lato'] mb-1 block">Quantity</label>
                    <Input type="number" min={1} value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: parseInt(e.target.value) || 1 }))} className="font-['Lato'] text-sm" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs font-medium text-[#203E4A] font-['Lato'] mb-1 block">Reference Link</label>
                    <Input placeholder="https://..." value={form.referenceUrl} onChange={e => setForm(f => ({ ...f, referenceUrl: e.target.value }))} className="font-['Lato'] text-sm" />
                  </div>
                </div>
                <div className="flex gap-3 pt-1">
                  <Button onClick={() => submitMut.mutate({ token, ...form })} disabled={!form.itemName.trim() || submitMut.isPending}
                    className="bg-[#203E4A] hover:bg-[#2a5060] text-white font-['Lato']">
                    {submitMut.isPending ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Send className="mr-2 h-4 w-4" />}
                    Submit Request
                  </Button>
                  <Button variant="ghost" onClick={() => setShowForm(false)} className="font-['Lato']">Cancel</Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </section>
  );
}

// ─── Section 4: File Upload ──────────────────────────────────────────────────
function FileUploadSection({ token }: { token: string }) {
  const utils = trpc.useUtils();
  const { data: files } = trpc.portal.getMyFiles.useQuery({ token });
  const uploadMut = trpc.portal.uploadFile.useMutation({
    onSuccess: () => { utils.portal.getMyFiles.invalidate(); toast.success("File uploaded successfully"); },
    onError: (e) => toast.error(e.message),
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 16 * 1024 * 1024) { toast.error("File must be under 16MB"); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      uploadMut.mutate({ token, fileName: file.name, mimeType: file.type, fileData: base64, fileSizeBytes: file.size });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <section className="py-12 md:py-16 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-[#203E4A]/10 flex items-center justify-center">
            <Upload className="h-5 w-5 text-[#203E4A]" />
          </div>
          <div>
            <h2 className="font-['Playfair_Display_SC'] text-xl md:text-2xl text-[#203E4A] tracking-wider">Documents</h2>
            <p className="text-xs text-[#6D7E94] font-['Lato'] mt-0.5">Upload plans, amendments, or supporting documents</p>
          </div>
        </div>

        <div className="mt-8 space-y-4">
          <input ref={fileInputRef} type="file" className="hidden" onChange={handleUpload} accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.dwg" />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploadMut.isPending}
            className="border-dashed border-[#203E4A]/30 text-[#203E4A] hover:bg-[#203E4A]/5 font-['Lato'] h-12">
            {uploadMut.isPending ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Plus className="h-4 w-4 mr-2" />}
            Upload File
          </Button>

          {files && files.length > 0 && (
            <div className="space-y-2">
              {files.map((f: any) => (
                <div key={f.id} className="flex items-center gap-3 p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="w-9 h-9 rounded-lg bg-[#203E4A]/10 flex items-center justify-center flex-shrink-0">
                    <FileText className="h-4 w-4 text-[#203E4A]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-['Lato'] text-[#203E4A] truncate font-medium">{f.fileName}</p>
                    <p className="text-[11px] text-[#6D7E94] font-['Lato']">{fmtDate(f.uploadedAt)}</p>
                  </div>
                  <a href={f.fileUrl} target="_blank" rel="noopener noreferrer" className="text-[#203E4A] hover:text-[#2a5060] p-2">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// ─── Section 5: Submit & Admin Response ──────────────────────────────────────
function SubmitSection({ token, upgradeTotal, basePrice }: { token: string; upgradeTotal: number; basePrice: number }) {
  const utils = trpc.useUtils();
  const { data: existing } = trpc.portal.getSubmission.useQuery({ token });
  const { data: adminResponse } = trpc.portal.getAdminResponse.useQuery({ token });
  const submitMut = trpc.portal.submitSelections.useMutation({
    onSuccess: () => { utils.portal.getSubmission.invalidate(); utils.portal.getAdminResponse.invalidate(); toast.success("Selections submitted for review!"); },
    onError: (e) => toast.error(e.message),
  });
  const [notes, setNotes] = useState("");

  const hasSubmitted = !!existing;
  const hasAdminResponse = adminResponse?.adminResponsePrice;

  return (
    <section className="py-12 md:py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-[#203E4A] flex items-center justify-center">
            <Send className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="font-['Playfair_Display_SC'] text-xl md:text-2xl text-[#203E4A] tracking-wider">
              {hasSubmitted ? "Submission Status" : "Submit for Review"}
            </h2>
            <p className="text-xs text-[#6D7E94] font-['Lato'] mt-0.5">
              {hasSubmitted ? "Your selections are being reviewed by the B Modern team" : "Send your selections to B Modern for a confirmed price"}
            </p>
          </div>
        </div>

        <div className="mt-8">
          {/* Admin Response Card */}
          {hasAdminResponse && (
            <Card className="mb-6 border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50/30 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                    <CheckCircle2 className="h-4 w-4 text-white" />
                  </div>
                  <h3 className="font-['Playfair_Display_SC'] text-lg text-[#203E4A] tracking-wider">Price Confirmed</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
                  <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-[#6D7E94] font-['Lato'] font-semibold mb-1">Base Contract</p>
                    <p className="text-xl font-bold text-[#203E4A] font-['Lato']">{fmt(basePrice)}</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-[#6D7E94] font-['Lato'] font-semibold mb-1">Your Upgrades</p>
                    <p className="text-xl font-bold text-amber-700 font-['Lato']">+{fmt(adminResponse.totalUpgradeCost)}</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 text-center shadow-sm border-2 border-[#203E4A]">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-[#6D7E94] font-['Lato'] font-semibold mb-1">Confirmed Total</p>
                    <p className="text-2xl font-bold text-[#203E4A] font-['Lato']">{fmt(adminResponse.adminResponsePrice)}</p>
                  </div>
                </div>
                {adminResponse.adminResponseNotes && (
                  <div className="p-4 bg-white rounded-xl shadow-sm">
                    <p className="text-[10px] uppercase tracking-[0.12em] text-[#6D7E94] font-['Lato'] font-semibold mb-1">Notes from B Modern</p>
                    <p className="text-sm text-[#203E4A] font-['Lato'] leading-relaxed">{adminResponse.adminResponseNotes}</p>
                  </div>
                )}
                <p className="text-[11px] text-[#6D7E94] font-['Lato'] mt-4">Responded on {fmtDate(adminResponse.adminRespondedAt)}</p>
              </CardContent>
            </Card>
          )}

          {/* Under review */}
          {hasSubmitted && !hasAdminResponse && (
            <Card className="mb-6 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50/30">
              <CardContent className="p-8 text-center">
                <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-7 w-7 text-amber-600" />
                </div>
                <h3 className="font-['Playfair_Display_SC'] text-lg text-[#203E4A] tracking-wider mb-2">Under Review</h3>
                <p className="text-sm text-[#6D7E94] font-['Lato'] mb-6 max-w-md mx-auto">
                  Your selections have been submitted. The B Modern team will review and respond with a confirmed price.
                </p>
                <div className="flex justify-center gap-8 text-sm">
                  <div><p className="text-[10px] uppercase tracking-[0.15em] text-[#6D7E94] font-['Lato'] font-semibold">Submitted</p><p className="font-bold text-[#203E4A] font-['Lato'] mt-0.5">{fmtDate(existing.submittedAt)}</p></div>
                  <div><p className="text-[10px] uppercase tracking-[0.15em] text-[#6D7E94] font-['Lato'] font-semibold">Upgrade Total</p><p className="font-bold text-amber-700 font-['Lato'] mt-0.5">+{fmt(existing.totalUpgradeCost)}</p></div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Submit form */}
          {!hasSubmitted && (
            <Card className="shadow-lg border-[#203E4A]/10">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-[#6D7E94] font-['Lato'] font-semibold mb-1">Base Contract</p>
                    <p className="text-xl font-bold text-[#203E4A] font-['Lato']">{fmt(basePrice)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-[#6D7E94] font-['Lato'] font-semibold mb-1">Selected Upgrades</p>
                    <p className="text-xl font-bold text-amber-700 font-['Lato']">{upgradeTotal > 0 ? `+${fmt(upgradeTotal)}` : fmt(0)}</p>
                  </div>
                  <div className="bg-[#203E4A]/5 rounded-xl p-4 text-center border border-[#203E4A]/15">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-[#6D7E94] font-['Lato'] font-semibold mb-1">Estimated Total</p>
                    <p className="text-xl font-bold text-[#203E4A] font-['Lato']">{fmt(basePrice + upgradeTotal)}</p>
                  </div>
                </div>
                <div className="mb-5">
                  <label className="text-xs font-medium text-[#203E4A] font-['Lato'] mb-1.5 block">Additional Notes (optional)</label>
                  <Textarea placeholder="Any comments or questions about your selections..." value={notes} onChange={e => setNotes(e.target.value)}
                    className="font-['Lato'] text-sm" rows={3} />
                </div>
                <Button onClick={() => submitMut.mutate({ token, totalUpgradeCost: upgradeTotal.toFixed(2), notes: notes || undefined })}
                  disabled={submitMut.isPending} className="w-full bg-[#203E4A] hover:bg-[#2a5060] text-white font-['Lato'] h-12 text-sm tracking-wide shadow-lg">
                  {submitMut.isPending ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Send className="mr-2 h-4 w-4" />}
                  Submit Selections for Review
                </Button>
                <p className="text-[11px] text-[#6D7E94] font-['Lato'] text-center mt-3">
                  The B Modern team will review your selections and respond with a confirmed price.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </section>
  );
}

// ─── Sticky Running Total Bar ────────────────────────────────────────────────
function StickyTotalBar({ basePrice, upgradeTotal, isLocked }: { basePrice: number; upgradeTotal: number; isLocked: boolean }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-r from-[#203E4A] via-[#1a3540] to-[#203E4A] text-white shadow-2xl">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-4 sm:gap-6 text-xs sm:text-sm font-['Lato']">
          <div>
            <p className="text-white/40 text-[9px] sm:text-[10px] uppercase tracking-[0.2em] font-semibold">Base</p>
            <p className="font-bold text-sm sm:text-base">{fmt(basePrice)}</p>
          </div>
          <div className="text-white/20 text-lg">+</div>
          <div>
            <p className="text-white/40 text-[9px] sm:text-[10px] uppercase tracking-[0.2em] font-semibold">Upgrades</p>
            <p className="font-bold text-sm sm:text-base text-amber-300">{upgradeTotal > 0 ? `+${fmt(upgradeTotal)}` : upgradeTotal < 0 ? fmt(upgradeTotal) : fmt(0)}</p>
          </div>
          <div className="text-white/20 text-lg">=</div>
        </div>
        <div className="text-right">
          <p className="text-white/40 text-[9px] sm:text-[10px] uppercase tracking-[0.2em] font-['Lato'] font-semibold">Estimated Total</p>
          <p className="text-lg sm:text-2xl font-bold font-['Lato']">{fmt(basePrice + upgradeTotal)}</p>
        </div>
      </div>
      {isLocked && (
        <div className="bg-amber-600 text-center py-1.5 text-xs font-['Lato'] font-semibold">
          <Lock className="inline h-3 w-3 mr-1" /> Portal is locked — selections are view-only
        </div>
      )}
    </div>
  );
}

// ─── Main Portal Component ───────────────────────────────────────────────────
export default function ClientPortal() {
  const params = useParams<{ token: string }>();
  const token = params.token || "";

  const { data: project, isLoading, error } = trpc.portal.getProject.useQuery({ token }, { enabled: !!token });
  const { data: tcStatus } = trpc.portal.hasAcknowledgedTerms.useQuery({ token }, { enabled: !!token && !!project });

  const [tcAccepted, setTcAccepted] = useState(false);
  const [upgradeTotal, setUpgradeTotal] = useState(0);

  useEffect(() => {
    if (tcStatus?.acknowledged) setTcAccepted(true);
  }, [tcStatus]);

  if (!token) return <ErrorPage message="No access token provided." />;
  if (isLoading) return <PortalLoader />;
  if (error) return <ErrorPage message={error.message} />;
  if (!project) return <ErrorPage message="Project not found." />;

  // T&C gate
  if (!tcAccepted) return <TermsGate token={token} onAccepted={() => setTcAccepted(true)} />;

  const basePrice = parseFloat(project.baseContractPrice || "0");
  const isLocked = !!project.portalLockedAt;

  return (
    <div className="min-h-screen bg-[#f8f6f1] pb-28">
      {/* Hero */}
      <HeroSection project={project} />

      {/* Draft banner */}
      {project.status === "draft" && (
        <div className="bg-amber-50 border-b border-amber-200 text-center py-2.5 text-xs text-amber-800 font-['Lato'] font-medium">
          <AlertCircle className="inline h-3.5 w-3.5 mr-1.5" /> This proposal is in draft and may change before presentation.
        </div>
      )}

      {/* 1. Base Inclusions — shown FIRST */}
      <BaseInclusionsSection token={token} />

      {/* Elegant divider */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#203E4A]/15 to-transparent" />
          <Sparkles className="h-4 w-4 text-[#6D7E94]/30" />
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#203E4A]/15 to-transparent" />
        </div>
      </div>

      {/* 2. Upgrade Selections — cross-tier pick and choose */}
      <UpgradeSelectionsSection token={token} project={project} onTotalChange={setUpgradeTotal} />

      {/* 3. Custom Item Requests */}
      <CustomItemRequestSection token={token} />

      {/* 4. File Upload */}
      <FileUploadSection token={token} />

      {/* 5. Submit for Review / Admin Response */}
      <SubmitSection token={token} upgradeTotal={upgradeTotal} basePrice={basePrice} />

      {/* Footer */}
      <div className="bg-gradient-to-br from-[#203E4A] via-[#1a3540] to-[#162d36] mt-12 py-10 text-center mb-20">
        <img src={LOGO_WHITE} alt="B Modern Homes" className="h-7 mx-auto mb-4" />
        <p className="text-white/30 text-xs font-['Lato'] tracking-[0.2em] uppercase">Building Modern Homes for Modern Living</p>
      </div>

      {/* Sticky running total */}
      <StickyTotalBar basePrice={basePrice} upgradeTotal={upgradeTotal} isLocked={isLocked} />

      {/* Floating chat button */}
      <FloatingChatButton token={token} />
    </div>
  );
}

function ErrorPage({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-[#f8f6f1] flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <img src={LOGO_DARK} alt="B Modern Homes" className="h-10 mx-auto mb-6" />
        <div className="bg-white rounded-xl border shadow-sm p-8">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-7 w-7 text-red-400" />
          </div>
          <h2 className="font-['Playfair_Display_SC'] text-lg text-[#203E4A] tracking-wider mb-2">Access Error</h2>
          <p className="text-sm text-[#6D7E94] font-['Lato'] leading-relaxed">{message}</p>
          <p className="text-xs text-[#6D7E94] font-['Lato'] mt-4">
            If you believe this is an error, please contact B Modern Homes.
          </p>
        </div>
      </div>
    </div>
  );
}
