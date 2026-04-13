import { useState, useRef, useEffect } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  ChevronDown, ChevronUp, Upload, Check, AlertCircle,
  Clock, FileText, Plus, Eye, EyeOff, Send, Download, Lock, Sparkles, ArrowRight, Star,
  ScrollText, CheckCircle2
} from "lucide-react";

const LOGO_URL = "https://cdn-bmodern.manus.space/B-Modern-Homes_Logo_Horizontal-Monochrome_RGB.jpg";
const LOGO_WHITE_URL = "https://cdn-bmodern.manus.space/B-Modern-Homes_Logo_Horizontal-Monochrome_RGB.jpg";

// Tier config for package cards
const TIER_LABELS = [
  { key: 1, name: "Built for Excellence", tagline: "Quality inclusions, exceptional value", badge: "bg-slate-100 text-slate-700", color: "#4a5568", border: "#cbd5e0", recommended: false },
  { key: 2, name: "Tailored Living", tagline: "Elevated finishes, refined lifestyle", badge: "bg-amber-100 text-amber-800", color: "var(--bm-petrol)", border: "var(--bm-petrol)", recommended: true },
  { key: 3, name: "Signature Series", tagline: "Premium materials, signature style", badge: "bg-purple-100 text-purple-800", color: "#6b46c1", border: "#9f7aea", recommended: false },
];


// ─── T&C Gate Screen ──────────────────────────────────────────────────────────
function TcGateScreen({
  token,
  onAccepted,
}: {
  token: string;
  onAccepted: () => void;
}) {
  const { data: terms, isLoading } = trpc.portal.getTerms.useQuery({ token });
  const acknowledgeMutation = trpc.portal.acknowledgeTerms.useMutation({
    onSuccess: onAccepted,
    onError: (e) => toast.error(e.message),
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const [checked, setChecked] = useState(false);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 20) {
      setScrolledToBottom(true);
    }
  };

  // If no T&Cs are set, skip the gate
  useEffect(() => {
    if (!isLoading && (!terms || !terms.content)) {
      onAccepted();
    }
  }, [isLoading, terms, onAccepted]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bm-cream)" }}>
        <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--bm-petrol)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  if (!terms || !terms.content) return null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12" style={{ background: "var(--bm-cream)" }}>
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="text-center mb-8">
          <img
            src={LOGO_URL}
            alt="B Modern Homes"
            className="h-8 mx-auto mb-4 object-contain"
            style={{ filter: "brightness(0) saturate(100%) invert(18%) sepia(28%) saturate(700%) hue-rotate(162deg) brightness(95%) contrast(95%)" }}
          />
          <div className="flex items-center justify-center gap-2 mb-2">
            <ScrollText size={20} style={{ color: "var(--bm-petrol)" }} />
            <h1 className="text-xl font-semibold" style={{ fontFamily: "'Playfair Display SC', Georgia, serif", color: "var(--bm-petrol)" }}>
              Terms & Conditions
            </h1>
          </div>
          <p className="text-sm text-muted-foreground" style={{ fontFamily: "Lato, sans-serif" }}>
            Please read and accept the terms before viewing your proposal.
          </p>
        </div>

        {/* T&C content */}
        <div
          className="bg-white rounded-xl border shadow-sm mb-6 overflow-hidden"
          style={{ borderColor: "var(--border)" }}
        >
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="p-6 overflow-y-auto text-sm leading-relaxed"
            style={{ maxHeight: "380px", fontFamily: "Lato, sans-serif", color: "var(--bm-petrol)", whiteSpace: "pre-wrap" }}
          >
            {terms.content}
          </div>
          {!scrolledToBottom && (
            <div className="px-6 py-2 bg-amber-50 border-t border-amber-100 text-xs text-amber-700 flex items-center gap-1.5" style={{ fontFamily: "Lato, sans-serif" }}>
              <ChevronDown size={13} />
              Scroll to read the full terms
            </div>
          )}
        </div>

        {/* Checkbox + Accept */}
        <div className="space-y-4">
          <label className="flex items-start gap-3 cursor-pointer group">
            <div
              className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${checked ? "border-[var(--bm-petrol)] bg-[var(--bm-petrol)]" : "border-gray-300 group-hover:border-[var(--bm-petrol)]"}`}
              onClick={() => setChecked(!checked)}
            >
              {checked && <Check size={12} className="text-white" />}
            </div>
            <span className="text-sm" style={{ fontFamily: "Lato, sans-serif", color: "var(--bm-petrol)", lineHeight: "1.6" }}>
              I have read and agree to the Terms & Conditions set out above. I understand this proposal is subject to these terms.
            </span>
          </label>

          <Button
            className="w-full h-11 text-sm font-medium tracking-wide"
            style={{ background: checked ? "var(--bm-petrol)" : undefined, fontFamily: "Lato, sans-serif" }}
            disabled={!checked || acknowledgeMutation.isPending}
            onClick={() => acknowledgeMutation.mutate({ token })}
          >
            {acknowledgeMutation.isPending ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <CheckCircle2 size={16} className="mr-2" />
                Accept & View Proposal
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Package Selection Screen (Pricing Engine) ─────────────────────────────────
function PackageSelectionScreen({
  token,
  project,
  onPackageSelected,
}: {
  token: string;
  project: any;
  onPackageSelected: (tierKey: number) => void;
}) {
  const { data: priceData, isLoading } = trpc.portal.getPackagePrices.useQuery({ token });
  const { data: mySelections } = trpc.portal.getItemSelections.useQuery({ token });
  const utils = trpc.useUtils();

  // selectedTier: which starting tier the client has chosen (1/2/3)
  const [selectedTier, setSelectedTier] = useState<number | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [showMixMatch, setShowMixMatch] = useState(false);
  // Per-item overrides: itemKey -> tier (1/2/3)
  const [itemOverrides, setItemOverrides] = useState<Record<string, number>>({});

  const selectItemMutation = trpc.portal.selectItem.useMutation({
    onError: (e) => toast.error(e.message),
  });
  const selectPackageMutation = trpc.portal.selectPackage.useMutation({
    onSuccess: () => {
      utils.portal.getProject.invalidate();
      toast.success("Package confirmed! Your proposal is ready below.");
      onPackageSelected(selectedTier!);
    },
    onError: (e) => toast.error(e.message),
  });

  // Calculate the custom total based on base price + item overrides
  const customTotal = (() => {
    if (!priceData || selectedTier === null) return 0;
    const base = Number(project.baseContractPrice || 0);
    let extra = 0;
    if (!priceData.lineItems) return base;
    for (const item of priceData.lineItems) {
      const overrideTier = itemOverrides[item.itemKey] ?? selectedTier;
      if (overrideTier === 2) extra += Number(item.tier2Delta || 0);
      else if (overrideTier === 3) extra += Number(item.tier3Delta || 0);
    }
    return base + extra;
  })();

  const handleItemOverride = (itemKey: string, tier: number) => {
    setItemOverrides(prev => ({ ...prev, [itemKey]: tier }));
    selectItemMutation.mutate({ token, itemKey, selectedTier: tier });
  };

  const handleConfirm = () => {
    if (!selectedTier) return;
    // Save the package selection (use tier as a proxy for packageId for now)
    // We'll use tier 1=1, 2=2, 3=3 mapped to master package IDs
    selectPackageMutation.mutate({ token, packageId: selectedTier });
  };

  const basePrice = Number(project.baseContractPrice || 0);

  return (
    <div className="min-h-screen" style={{ background: "var(--bm-cream)" }}>
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
          <img src={LOGO_URL} alt="B Modern Homes" className="h-7 object-contain"
            style={{ filter: "brightness(0) saturate(100%) invert(18%) sepia(28%) saturate(700%) hue-rotate(162deg) brightness(95%) contrast(95%)" }} />
          <div className="text-xs text-muted-foreground" style={{ fontFamily: "Lato, sans-serif", letterSpacing: "0.1em" }}>TENDER PORTAL</div>
        </div>
      </header>

      {/* Hero */}
      <div className="py-14 sm:py-20 text-center" style={{ background: "linear-gradient(135deg, var(--bm-petrol) 0%, #1a3540 100%)" }}>
        <div className="max-w-2xl mx-auto px-4">
          <p className="text-xs tracking-widest uppercase mb-4" style={{ color: "rgba(255,255,255,0.6)", fontFamily: "Lato, sans-serif" }}>
            Welcome, {project.clientName}
          </p>
          <h1 className="text-3xl sm:text-4xl mb-4" style={{ fontFamily: "'Playfair Display SC', Georgia, serif", color: "white" }}>
            Your Package Options
          </h1>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.75)", fontFamily: "Lato, sans-serif", lineHeight: "1.8" }}>
            Three complete packages tailored for {project.projectAddress}.
            Start with any package, then mix individual items to build your perfect home.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-12">
        {/* Package price cards */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[1,2,3].map(i => <div key={i} className="h-64 rounded-xl bg-secondary animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {TIER_LABELS.map((tier) => {
              const isSelected = selectedTier === tier.key;
              const tierTotal = tier.key === 1 ? basePrice
                : tier.key === 2 ? (priceData?.tier2Total ?? basePrice)
                : (priceData?.tier3Total ?? basePrice);
              const extraCost = tierTotal - basePrice;
              return (
                <div
                  key={tier.key}
                  className="relative rounded-xl overflow-hidden transition-all duration-200 cursor-pointer"
                  style={{
                    border: `2px solid ${isSelected ? tier.border : "var(--border)"}`,
                    boxShadow: isSelected ? `0 8px 32px ${tier.color}22` : "0 2px 8px rgba(0,0,0,0.06)",
                    background: "white",
                  }}
                  onClick={() => setSelectedTier(tier.key)}
                >
                  {tier.recommended && (
                    <div className="absolute top-3 right-3 z-10 flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full"
                      style={{ background: "var(--bm-petrol)", color: "white", fontFamily: "Lato, sans-serif", letterSpacing: "0.08em" }}>
                      <Sparkles size={9} /> RECOMMENDED
                    </div>
                  )}
                  <div className="p-6">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${tier.badge}`} style={{ fontFamily: "Lato, sans-serif" }}>
                      TIER {tier.key}
                    </span>
                    <h2 className="text-xl mt-3 mb-1" style={{ fontFamily: "'Playfair Display', Georgia, serif", color: "var(--bm-petrol)" }}>
                      {tier.name}
                    </h2>
                    <p className="text-xs text-muted-foreground mb-5" style={{ fontFamily: "Lato, sans-serif", lineHeight: "1.6" }}>
                      {tier.tagline}
                    </p>
                    {/* Price */}
                    <div className="mb-5">
                      <div className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display', Georgia, serif", color: tier.key === 1 ? "var(--bm-petrol)" : tier.color }}>
                        {tierTotal > 0 ? `$${tierTotal.toLocaleString()}` : "Price on request"}
                      </div>
                      {extraCost > 0 && (
                        <div className="text-xs mt-0.5" style={{ color: tier.color, fontFamily: "Lato, sans-serif" }}>
                          +${extraCost.toLocaleString()} above base package
                        </div>
                      )}
                      {tier.key === 1 && (
                        <div className="text-xs mt-0.5 text-muted-foreground" style={{ fontFamily: "Lato, sans-serif" }}>Base contract price</div>
                      )}
                    </div>
                    <button
                      className="w-full py-2.5 rounded text-sm font-semibold transition-all"
                      style={{
                        background: isSelected ? tier.color : "transparent",
                        color: isSelected ? "white" : tier.color,
                        border: `1.5px solid ${tier.color}`,
                        fontFamily: "Lato, sans-serif",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {isSelected ? <span className="flex items-center justify-center gap-2"><Check size={14} /> Selected</span> : "Select Package"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Mix & Match toggle */}
        {selectedTier !== null && priceData?.lineItems && priceData.lineItems.length > 0 && (
          <div className="mt-8">
            <div className="text-center mb-4">
              <button
                onClick={() => setShowMixMatch(!showMixMatch)}
                className="text-sm flex items-center gap-2 mx-auto transition-colors"
                style={{ color: "var(--bm-petrol)", fontFamily: "Lato, sans-serif" }}
              >
                {showMixMatch ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                {showMixMatch ? "Hide item customisation" : "Customise individual items (mix & match)"}
              </button>
            </div>

            {showMixMatch && (
              <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
                <div className="px-5 py-3 text-xs font-semibold" style={{ background: "var(--bm-petrol)", color: "white", fontFamily: "Lato, sans-serif", letterSpacing: "0.08em" }}>
                  ITEM-BY-ITEM CUSTOMISATION
                </div>
                <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                  {priceData.lineItems.map((item: any) => {
                    const currentTier = itemOverrides[item.itemKey] ?? selectedTier;
                    return (
                      <div key={item.itemKey} className="flex items-center justify-between gap-4 px-5 py-3">
                        <div className="min-w-0">
                          <div className="text-sm font-medium" style={{ fontFamily: "Lato, sans-serif", color: "var(--bm-petrol)" }}>{item.label}</div>
                          <div className="text-xs text-muted-foreground" style={{ fontFamily: "Lato, sans-serif" }}>
                            {currentTier === 1 ? item.tier1Label : currentTier === 2 ? item.tier2Label : item.tier3Label}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {[1, 2, 3].map(t => {
                            const cfg = TIER_LABELS[t - 1];
                            const extra = t === 1 ? 0 : t === 2 ? Number(item.tier2Delta || 0) : Number(item.tier3Delta || 0);
                            const isActive = currentTier === t;
                            return (
                              <button
                                key={t}
                                onClick={() => handleItemOverride(item.itemKey, t)}
                                className="text-[10px] px-2.5 py-1 rounded transition-all"
                                style={{
                                  background: isActive ? cfg.color : "transparent",
                                  color: isActive ? "white" : cfg.color,
                                  border: `1px solid ${cfg.color}`,
                                  fontFamily: "Lato, sans-serif",
                                  fontWeight: isActive ? 700 : 400,
                                }}
                              >
                                T{t}{extra > 0 ? ` +$${extra.toLocaleString()}` : ""}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Comparison table toggle */}
        <div className="mt-8 text-center">
          <button
            onClick={() => setShowComparison(!showComparison)}
            className="text-sm flex items-center gap-2 mx-auto transition-colors"
            style={{ color: "var(--bm-petrol)", fontFamily: "Lato, sans-serif" }}
          >
            {showComparison ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            {showComparison ? "Hide comparison" : "Compare all packages"}
          </button>
        </div>

        {showComparison && priceData?.lineItems && (
          <div className="mt-6 rounded-xl overflow-hidden border" style={{ borderColor: "var(--border)" }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "var(--bm-petrol)", color: "white" }}>
                  <th className="py-3 px-4 text-left text-xs" style={{ fontFamily: "Lato, sans-serif", letterSpacing: "0.08em", fontWeight: 600 }}>ITEM</th>
                  <th className="py-3 px-4 text-center text-xs" style={{ fontFamily: "Lato, sans-serif", letterSpacing: "0.08em", fontWeight: 600 }}>BUILT FOR EXCELLENCE</th>
                  <th className="py-3 px-4 text-center text-xs" style={{ fontFamily: "Lato, sans-serif", letterSpacing: "0.08em", fontWeight: 600, background: "rgba(255,255,255,0.1)" }}>TAILORED LIVING ★</th>
                  <th className="py-3 px-4 text-center text-xs" style={{ fontFamily: "Lato, sans-serif", letterSpacing: "0.08em", fontWeight: 600 }}>SIGNATURE SERIES</th>
                </tr>
              </thead>
              <tbody>
                {priceData.lineItems.map((item: any, idx: number) => (
                  <tr key={item.itemKey} style={{ background: idx % 2 === 0 ? "white" : "var(--bm-cream)" }}>
                    <td className="py-2.5 px-4 text-xs font-medium" style={{ fontFamily: "Lato, sans-serif", color: "var(--bm-petrol)" }}>{item.label}</td>
                    <td className="py-2.5 px-4 text-xs text-center text-muted-foreground" style={{ fontFamily: "Lato, sans-serif" }}>{item.tier1Label || "—"}</td>
                    <td className="py-2.5 px-4 text-xs text-center font-medium" style={{ fontFamily: "Lato, sans-serif", color: "var(--bm-petrol)", background: idx % 2 === 0 ? "rgba(32,62,74,0.04)" : "rgba(32,62,74,0.08)" }}>
                      {item.tier2Label || "—"}
                      {Number(item.tier2Delta) > 0 && <span className="ml-1 text-amber-600">(+${Number(item.tier2Delta).toLocaleString()})</span>}
                    </td>
                    <td className="py-2.5 px-4 text-xs text-center text-muted-foreground" style={{ fontFamily: "Lato, sans-serif" }}>
                      {item.tier3Label || "—"}
                      {Number(item.tier3Delta) > 0 && <span className="ml-1 text-purple-600">(+${Number(item.tier3Delta).toLocaleString()})</span>}
                    </td>
                  </tr>
                ))}
                {/* Totals row */}
                <tr style={{ background: "var(--bm-petrol)", color: "white" }}>
                  <td className="py-3 px-4 text-xs font-bold" style={{ fontFamily: "Lato, sans-serif", letterSpacing: "0.05em" }}>TOTAL PACKAGE PRICE</td>
                  <td className="py-3 px-4 text-xs text-center font-bold" style={{ fontFamily: "Lato, sans-serif" }}>
                    {basePrice > 0 ? `$${basePrice.toLocaleString()}` : "—"}
                  </td>
                  <td className="py-3 px-4 text-xs text-center font-bold" style={{ fontFamily: "Lato, sans-serif", background: "rgba(255,255,255,0.1)" }}>
                    {priceData?.tier2Total ? `$${priceData.tier2Total.toLocaleString()}` : "—"}
                  </td>
                  <td className="py-3 px-4 text-xs text-center font-bold" style={{ fontFamily: "Lato, sans-serif" }}>
                    {priceData?.tier3Total ? `$${priceData.tier3Total.toLocaleString()}` : "—"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Live total + confirm CTA */}
        <div className="mt-10">
          {selectedTier !== null && (
            <div className="mb-6 p-5 rounded-xl text-center" style={{ background: "white", border: "2px solid var(--bm-petrol)" }}>
              <div className="text-xs text-muted-foreground mb-1" style={{ fontFamily: "Lato, sans-serif", letterSpacing: "0.1em" }}>YOUR CUSTOM TOTAL</div>
              <div className="text-3xl font-bold" style={{ fontFamily: "'Playfair Display', Georgia, serif", color: "var(--bm-petrol)" }}>
                ${customTotal.toLocaleString()}
              </div>
              {Object.keys(itemOverrides).length > 0 && (
                <div className="text-xs text-muted-foreground mt-1" style={{ fontFamily: "Lato, sans-serif" }}>
                  Based on {TIER_LABELS[selectedTier - 1].name} with {Object.keys(itemOverrides).length} item{Object.keys(itemOverrides).length !== 1 ? "s" : ""} customised
                </div>
              )}
            </div>
          )}
          <div className="text-center">
            <Button
              disabled={!selectedTier || selectPackageMutation.isPending}
              onClick={handleConfirm}
              className="gap-2 px-8 py-3 text-sm tracking-widest uppercase"
              style={{ background: "var(--bm-petrol)", fontFamily: "Lato, sans-serif", fontWeight: 700 }}
            >
              {selectPackageMutation.isPending ? "Confirming..." : (
                <><ArrowRight size={15} /> Confirm &amp; View Full Proposal</>
              )}
            </Button>
            {!selectedTier && (
              <p className="text-xs text-muted-foreground mt-3" style={{ fontFamily: "Lato, sans-serif" }}>Please select a package above to continue</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Portal Header ─────────────────────────────────────────────────────────────
function PortalHeader({ project, token }: { project: any; token: string }) {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm" style={{ borderBottom: "1px solid var(--border)" }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
        <img
          src={LOGO_URL}
          alt="B Modern Homes"
          className="h-7 object-contain"
          style={{ filter: "brightness(0) saturate(100%) invert(18%) sepia(28%) saturate(700%) hue-rotate(162deg) brightness(95%) contrast(95%)" }}
        />
        <div className="flex items-center gap-3">
          <div className="hidden sm:block text-xs text-muted-foreground" style={{ fontFamily: "Lato, sans-serif", letterSpacing: "0.1em" }}>
            TENDER PORTAL
          </div>
          <a
            href={`/api/pdf/portal/${token}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded border hover:bg-secondary transition-colors"
            style={{ fontFamily: "Lato, sans-serif", textDecoration: "none", color: "var(--bm-petrol)", borderColor: "var(--bm-petrol)" }}
          >
            <Download size={12} /> Proposal PDF
          </a>
          <div
            className="text-xs px-3 py-1 rounded-full"
            style={{
              background: "var(--bm-petrol)",
              color: "white",
              fontFamily: "Lato, sans-serif",
              letterSpacing: "0.1em",
              fontSize: "0.65rem"
            }}
          >
            #{project.proposalNumber}
          </div>
        </div>
      </div>
    </header>
  );
}

// ─── Hero Section ──────────────────────────────────────────────────────────────
function HeroSection({ project }: { project: any }) {
  if (project.heroImageUrl) {
    return (
      <section className="relative">
        <div className="relative h-[55vh] min-h-[380px] max-h-[600px] overflow-hidden">
          <img
            src={project.heroImageUrl}
            alt={project.projectAddress}
            className="w-full h-full object-cover"
          />
          {/* Gradient overlay */}
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(to bottom, rgba(32,62,74,0.15) 0%, rgba(32,62,74,0.5) 50%, rgba(32,62,74,0.88) 100%)"
            }}
          />
          {/* Content */}
          <div className="absolute inset-0 flex flex-col justify-end">
            <div className="max-w-6xl mx-auto px-4 sm:px-8 pb-10 w-full">
              <div
                className="text-white/60 text-xs mb-3"
                style={{ fontFamily: "Lato, sans-serif", letterSpacing: "0.3em" }}
              >
                {[project.projectType, project.buildType].filter(Boolean).join(" · ").toUpperCase() || "RESIDENTIAL · NEW BUILD"}
              </div>
              <h1
                className="text-white text-3xl sm:text-5xl mb-2 leading-tight"
                style={{ fontFamily: "'Playfair Display SC', Georgia, serif", fontWeight: 400 }}
              >
                {project.clientName}
              </h1>
              <p className="text-white/75 text-sm sm:text-base" style={{ fontFamily: "Lato, sans-serif" }}>
                {project.projectAddress}
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // No hero image fallback
  return (
    <section
      className="py-16 sm:py-24"
      style={{ background: "var(--bm-petrol)" }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-8">
        <div
          className="text-white/50 text-xs mb-3"
          style={{ fontFamily: "Lato, sans-serif", letterSpacing: "0.3em" }}
        >
          {[project.projectType, project.buildType].filter(Boolean).join(" · ").toUpperCase() || "RESIDENTIAL · NEW BUILD"}
        </div>
        <h1
          className="text-white text-3xl sm:text-5xl mb-2 leading-tight"
          style={{ fontFamily: "'Playfair Display SC', Georgia, serif", fontWeight: 400 }}
        >
          {project.clientName}
        </h1>
        <p className="text-white/70 text-sm sm:text-base" style={{ fontFamily: "Lato, sans-serif" }}>
          {project.projectAddress}
        </p>
      </div>
    </section>
  );
}

// ─── Proposal Summary Bar ──────────────────────────────────────────────────────
function ProposalSummaryBar({ project, upgradeTotal }: { project: any; upgradeTotal: number }) {
  const basePrice = Number(project.baseContractPrice || 0);
  const total = basePrice + upgradeTotal;

  return (
    <section style={{ background: "white", borderBottom: "1px solid var(--border)" }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8">
          {/* Proposal number */}
          <div>
            <div
              className="text-xs mb-1.5"
              style={{ color: "var(--bm-bluegum)", fontFamily: "Lato, sans-serif", letterSpacing: "0.15em" }}
            >
              PROPOSAL
            </div>
            <div className="text-base font-medium" style={{ fontFamily: "Lato, sans-serif", color: "var(--bm-petrol)" }}>
              #{project.proposalNumber}
            </div>
          </div>

          {/* Base contract */}
          <div>
            <div
              className="text-xs mb-1.5"
              style={{ color: "var(--bm-bluegum)", fontFamily: "Lato, sans-serif", letterSpacing: "0.15em" }}
            >
              BASE CONTRACT
            </div>
            <div
              className="text-xl"
              style={{ fontFamily: "'Playfair Display SC', Georgia, serif", color: "var(--bm-petrol)", fontWeight: 400 }}
            >
              ${basePrice.toLocaleString("en-AU")}
            </div>
          </div>

          {/* Upgrades */}
          <div>
            <div
              className="text-xs mb-1.5"
              style={{ color: "var(--bm-bluegum)", fontFamily: "Lato, sans-serif", letterSpacing: "0.15em" }}
            >
              SELECTED UPGRADES
            </div>
            <div
              className="text-xl"
              style={{
                fontFamily: "'Playfair Display SC', Georgia, serif",
                color: upgradeTotal > 0 ? "var(--bm-petrol)" : "var(--muted-foreground)",
                fontWeight: 400
              }}
            >
              {upgradeTotal > 0 ? `+$${upgradeTotal.toLocaleString("en-AU")}` : "—"}
            </div>
          </div>

          {/* Expiry */}
          {project.tenderExpiryDate ? (
            <div>
              <div
                className="text-xs mb-1.5"
                style={{ color: "var(--bm-bluegum)", fontFamily: "Lato, sans-serif", letterSpacing: "0.15em" }}
              >
                TENDER EXPIRY
              </div>
              <div
                className="text-sm flex items-center gap-1.5"
                style={{ fontFamily: "Lato, sans-serif", color: "var(--bm-petrol)" }}
              >
                <Clock size={13} />
                {new Date(project.tenderExpiryDate).toLocaleDateString("en-AU", {
                  day: "numeric", month: "long", year: "numeric"
                })}
              </div>
            </div>
          ) : (
            <div>
              <div
                className="text-xs mb-1.5"
                style={{ color: "var(--bm-bluegum)", fontFamily: "Lato, sans-serif", letterSpacing: "0.15em" }}
              >
                ESTIMATED TOTAL
              </div>
              <div
                className="text-xl"
                style={{
                  fontFamily: "'Playfair Display SC', Georgia, serif",
                  color: "var(--bm-petrol)",
                  fontWeight: 400
                }}
              >
                ${total.toLocaleString("en-AU")}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// ─── Section Heading ───────────────────────────────────────────────────────────
function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mb-8 sm:mb-10">
      <div
        className="text-xs mb-2"
        style={{ color: "var(--bm-bluegum)", fontFamily: "Lato, sans-serif", letterSpacing: "0.3em" }}
      >
        {eyebrow.toUpperCase()}
      </div>
      <h2
        className="text-2xl sm:text-3xl"
        style={{ fontFamily: "'Playfair Display SC', Georgia, serif", color: "var(--bm-petrol)", fontWeight: 400 }}
      >
        {title}
      </h2>
      <div className="w-10 h-px mt-4" style={{ background: "var(--bm-petrol)" }} />
    </div>
  );
}

// ─── Inclusions Section ────────────────────────────────────────────────────────
function InclusionsSection({ token }: { token: string }) {
  const { data: categories } = trpc.portal.getBaseInclusions.useQuery({ token });
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  if (!categories?.length) return null;

  const toggleSection = (id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <section className="py-12 sm:py-16" style={{ background: "white" }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-8">
        <SectionHeading eyebrow="What's Included" title="Base Inclusions" />
        <div className="space-y-3">
          {categories.map((category) => {
            const isOpen = expanded.has(category.id);
            return (
              <div
                key={category.id}
                className="overflow-hidden rounded"
                style={{ border: "1px solid var(--border)" }}
              >
                <button
                  className="w-full flex items-center justify-between px-6 py-5 text-left transition-colors"
                  style={{
                    background: isOpen ? "var(--bm-petrol)" : "white",
                    fontFamily: "Lato, sans-serif"
                  }}
                  onClick={() => toggleSection(category.id)}
                >
                  <span
                    className="font-medium text-sm tracking-wide"
                    style={{
                      color: isOpen ? "white" : "var(--bm-petrol)",
                      letterSpacing: "0.05em"
                    }}
                  >
                    {category.name.toUpperCase()}
                  </span>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs" style={{ color: isOpen ? "rgba(255,255,255,0.65)" : "var(--bm-bluegum)" }}>
                      {category.items.length} {category.items.length === 1 ? "item" : "items"}
                    </span>
                    {isOpen
                      ? <ChevronUp size={16} style={{ color: "white" }} />
                      : <ChevronDown size={16} style={{ color: "var(--bm-bluegum)" }} />
                    }
                  </div>
                </button>
                {isOpen && (
                  <div className="border-t" style={{ borderColor: "var(--border)" }}>
                    {category.imageUrl && (
                      <div className="w-full h-48 sm:h-64 overflow-hidden">
                        <img
                          src={category.imageUrl}
                          alt={category.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                      {(category.items as any[]).map((item) => (
                        <div key={item.id} className="flex items-start justify-between gap-6 px-6 py-3.5">
                          <p
                            className="text-sm flex-1"
                            style={{ fontFamily: "Lato, sans-serif", color: "var(--foreground)", lineHeight: "1.75" }}
                          >
                            {item.description || item.name}
                          </p>
                          {item.qty && (
                            <span
                              className="text-xs shrink-0 tabular-nums pt-0.5"
                              style={{ color: "var(--bm-bluegum)", fontFamily: "Lato, sans-serif" }}
                            >
                              {item.qty}{item.unit ? ` ${item.unit}` : ""}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
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

// ─── Upgrades Section ──────────────────────────────────────────────────────────
function UpgradesSection({
  token,
  isLocked,
  onSelectionChange,
}: {
  token: string;
  isLocked: boolean;
  onSelectionChange: (total: number, selections: Record<number, number>) => void;
}) {
  const { data: groups } = trpc.portal.getUpgradeGroups.useQuery({ token });
  const { data: options } = trpc.portal.getUpgradeOptions.useQuery({ token });
  const { data: existingSelections } = trpc.portal.getMySelections.useQuery({ token });

  const [selections, setSelections] = useState<Record<number, number>>({});
  const [revealedImages, setRevealedImages] = useState<Set<number>>(new Set());
  const [initialised, setInitialised] = useState(false);

  useEffect(() => {
    if (existingSelections && !initialised) {
      const sel: Record<number, number> = {};
      existingSelections.forEach((s: any) => { sel[s.groupId] = s.upgradeOptionId; });
      setSelections(sel);
      setInitialised(true);
    }
  }, [existingSelections, initialised]);

  useEffect(() => {
    if (!options) return;
    let total = 0;
    Object.values(selections).forEach((optId) => {
      const opt = options.find((o: any) => o.id === optId);
      if (opt && !opt.isIncluded) total += Number(opt.priceDelta || 0);
    });
    onSelectionChange(total, selections);
  }, [selections, options]);

  const saveSelectionMutation = trpc.portal.saveSelection.useMutation({
    onError: (e) => toast.error(e.message),
  });

  const selectOption = (groupId: number, optionId: number) => {
    if (isLocked) return;
    setSelections((prev) => ({ ...prev, [groupId]: optionId }));
    saveSelectionMutation.mutate({ token, upgradeOptionId: optionId, selected: true });
  };

  const toggleImage = (optId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setRevealedImages((prev) => {
      const next = new Set(prev);
      next.has(optId) ? next.delete(optId) : next.add(optId);
      return next;
    });
  };

  if (!groups?.length) return null;

  return (
    <section className="py-12 sm:py-16" style={{ background: "var(--bm-cream)" }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-8">
        <SectionHeading eyebrow="Personalise Your Home" title="Upgrade Options" />

        {isLocked && (
          <div
            className="mb-8 flex items-center gap-3 px-5 py-4 rounded"
            style={{ background: "white", border: "1px solid var(--border)" }}
          >
            <Lock size={15} style={{ color: "var(--bm-petrol)" }} className="shrink-0" />
            <p className="text-sm" style={{ fontFamily: "Lato, sans-serif", color: "var(--bm-petrol)" }}>
              Upgrade selections are locked for this project. Please contact your B Modern representative.
            </p>
          </div>
        )}

        <div className="space-y-10">
          {groups.map((group: any) => {
            const groupOptions = options?.filter((o: any) => o.groupId === group.id) || [];
            const selectedId = selections[group.id];
            return (
              <div key={group.id}>
                <div className="flex items-center gap-4 mb-4">
                  <h3
                    className="text-xs tracking-widest"
                    style={{ color: "var(--bm-petrol)", fontFamily: "Lato, sans-serif", fontWeight: 700 }}
                  >
                    {group.category.toUpperCase()}
                  </h3>
                  <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groupOptions.map((opt: any) => {
                    const isSelected = selectedId === opt.id;
                    const showImg = revealedImages.has(opt.id);
                    return (
                      <div
                        key={opt.id}
                        className="rounded overflow-hidden cursor-pointer transition-all"
                        style={{
                          background: "white",
                          border: isSelected ? `2px solid var(--bm-petrol)` : "1px solid var(--border)",
                          boxShadow: isSelected ? "0 4px 20px rgba(32,62,74,0.12)" : "none",
                          transform: isSelected ? "translateY(-1px)" : "none",
                        }}
                        onClick={() => selectOption(group.id, opt.id)}
                      >
                        {/* Image area */}
                        <div className="relative w-full h-44 bg-secondary overflow-hidden">
                          {opt.imageUrl ? (
                            showImg ? (
                              <>
                                <img
                                  src={opt.imageUrl}
                                  alt={opt.optionName}
                                  className="w-full h-full object-cover"
                                />
                                <button
                                  type="button"
                                  onClick={(e) => toggleImage(opt.id, e)}
                                  className="absolute top-2 right-2 rounded-full p-1.5 transition-colors"
                                  style={{ background: "rgba(0,0,0,0.5)", color: "white" }}
                                >
                                  <EyeOff size={13} />
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => toggleImage(opt.id, e)}
                                className="w-full h-full flex flex-col items-center justify-center gap-2 transition-colors hover:bg-secondary/80"
                                style={{ fontFamily: "Lato, sans-serif" }}
                              >
                                <Eye size={22} style={{ color: "var(--bm-bluegum)" }} />
                                <span className="text-xs" style={{ color: "var(--bm-bluegum)", letterSpacing: "0.1em" }}>
                                  VIEW IMAGE
                                </span>
                              </button>
                            )
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="text-xs text-muted-foreground" style={{ fontFamily: "Lato, sans-serif" }}>No image</span>
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="p-4">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <span
                              className="text-sm font-medium leading-tight"
                              style={{ fontFamily: "Lato, sans-serif", color: "var(--bm-petrol)" }}
                            >
                              {opt.optionName}
                            </span>
                            <div
                              className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all"
                              style={{
                                borderColor: isSelected ? "var(--bm-petrol)" : "var(--border)",
                                background: isSelected ? "var(--bm-petrol)" : "transparent"
                              }}
                            >
                              {isSelected && <Check size={11} className="text-white" />}
                            </div>
                          </div>
                          {opt.description && (
                            <p
                              className="text-xs text-muted-foreground leading-relaxed mb-2"
                              style={{ fontFamily: "Lato, sans-serif" }}
                            >
                              {opt.description}
                            </p>
                          )}
                          <div className="flex items-center justify-between mt-2">
                            {opt.isIncluded ? (
                              <span
                                className="text-xs px-2 py-0.5 rounded-full"
                                style={{
                                  background: "rgba(32,62,74,0.08)",
                                  color: "var(--bm-petrol)",
                                  fontFamily: "Lato, sans-serif",
                                  letterSpacing: "0.05em"
                                }}
                              >
                                Included
                              </span>
                            ) : Number(opt.priceDelta) > 0 ? (
                              <span
                                className="text-xs font-semibold"
                                style={{ color: "var(--bm-petrol)", fontFamily: "Lato, sans-serif" }}
                              >
                                +${Number(opt.priceDelta).toLocaleString("en-AU")}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground" style={{ fontFamily: "Lato, sans-serif" }}>
                                No additional cost
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── Sticky Upgrade Total Bar ──────────────────────────────────────────────────
function StickyUpgradeBar({
  upgradeTotal,
  basePrice,
  isLocked,
  onSubmit,
  isSubmitting,
  isSubmitted,
}: {
  upgradeTotal: number;
  basePrice: number;
  isLocked: boolean;
  onSubmit: () => void;
  isSubmitting: boolean;
  isSubmitted: boolean;
}) {
  if (upgradeTotal === 0 && !isSubmitted) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 px-4 py-3 sm:py-4"
      style={{
        background: "var(--bm-petrol)",
        boxShadow: "0 -4px 20px rgba(0,0,0,0.15)"
      }}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <div>
            <div
              className="text-white/60 text-xs mb-0.5"
              style={{ fontFamily: "Lato, sans-serif", letterSpacing: "0.15em" }}
            >
              UPGRADE TOTAL
            </div>
            <div
              className="text-white text-lg"
              style={{ fontFamily: "'Playfair Display SC', Georgia, serif", fontWeight: 400 }}
            >
              +${upgradeTotal.toLocaleString("en-AU")}
            </div>
          </div>
          <div className="hidden sm:block w-px h-8 bg-white/20" />
          <div className="hidden sm:block">
            <div
              className="text-white/60 text-xs mb-0.5"
              style={{ fontFamily: "Lato, sans-serif", letterSpacing: "0.15em" }}
            >
              ESTIMATED TOTAL
            </div>
            <div
              className="text-white text-lg"
              style={{ fontFamily: "'Playfair Display SC', Georgia, serif", fontWeight: 400 }}
            >
              ${(basePrice + upgradeTotal).toLocaleString("en-AU")}
            </div>
          </div>
        </div>

        {!isLocked && (
          isSubmitted ? (
            <div className="flex items-center gap-2 text-white/80 text-sm" style={{ fontFamily: "Lato, sans-serif" }}>
              <Check size={15} />
              Selections submitted
            </div>
          ) : (
            <Button
              onClick={onSubmit}
              disabled={isSubmitting}
              className="gap-2 text-xs tracking-widest uppercase"
              style={{
                background: "white",
                color: "var(--bm-petrol)",
                fontFamily: "Lato, sans-serif",
                fontWeight: 700,
                minWidth: "160px"
              }}
            >
              <Send size={13} />
              {isSubmitting ? "Submitting..." : "Submit Selections"}
            </Button>
          )
        )}
      </div>
    </div>
  );
}

// ─── Submit Upgrades Section ───────────────────────────────────────────────────
function SubmitUpgradesSection({
  token,
  upgradeTotal,
  isLocked,
  onSubmitted,
}: {
  token: string;
  upgradeTotal: number;
  isLocked: boolean;
  onSubmitted: (submitted: boolean) => void;
}) {
  const utils = trpc.useUtils();
  const { data: existing } = trpc.portal.getSubmission.useQuery({ token });
  const submitMutation = trpc.portal.submitSelections.useMutation({
    onSuccess: () => {
      utils.portal.getSubmission.invalidate();
      toast.success("Your selections have been submitted. We will be in touch shortly.");
      onSubmitted(true);
    },
    onError: (e) => toast.error(e.message),
  });

  useEffect(() => {
    if (existing) onSubmitted(true);
  }, [existing]);

  if (isLocked) return null;

  return (
    <section className="py-8 sm:py-10" style={{ background: "white", borderTop: "1px solid var(--border)" }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-8">
        {existing ? (
          <div
            className="flex items-start gap-4 p-5 rounded"
            style={{ background: "rgba(32,62,74,0.05)", border: "1px solid rgba(32,62,74,0.15)" }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
              style={{ background: "var(--bm-petrol)" }}
            >
              <Check size={15} className="text-white" />
            </div>
            <div>
              <p
                className="text-sm font-medium mb-0.5"
                style={{ fontFamily: "Lato, sans-serif", color: "var(--bm-petrol)" }}
              >
                Selections submitted on{" "}
                {new Date(existing.submittedAt).toLocaleDateString("en-AU", {
                  day: "numeric", month: "long", year: "numeric"
                })}
              </p>
              {Number(existing.totalUpgradeCost) > 0 && (
                <p className="text-xs text-muted-foreground" style={{ fontFamily: "Lato, sans-serif" }}>
                  Total upgrade cost: ${Number(existing.totalUpgradeCost).toLocaleString("en-AU")}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1" style={{ fontFamily: "Lato, sans-serif" }}>
                You can continue to adjust your selections until the tender is finalised.
              </p>
            </div>
          </div>
        ) : (
          <div
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded"
            style={{ border: "2px solid var(--bm-petrol)" }}
          >
            <div>
              <h3
                className="text-base mb-1"
                style={{ fontFamily: "'Playfair Display SC', Georgia, serif", color: "var(--bm-petrol)" }}
              >
                Ready to Submit?
              </h3>
              <p className="text-sm text-muted-foreground" style={{ fontFamily: "Lato, sans-serif" }}>
                {upgradeTotal > 0
                  ? `Your selected upgrades total $${upgradeTotal.toLocaleString("en-AU")}. Submit to notify the B Modern team.`
                  : "Submit your selections to notify the B Modern team."}
              </p>
            </div>
            <Button
              onClick={() => submitMutation.mutate({ token, totalUpgradeCost: upgradeTotal.toString() })}
              disabled={submitMutation.isPending}
              className="gap-2 text-xs tracking-widest uppercase shrink-0"
              style={{ background: "var(--bm-petrol)", fontFamily: "Lato, sans-serif", minWidth: "160px" }}
            >
              <Send size={13} />
              {submitMutation.isPending ? "Submitting..." : "Submit Selections"}
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}

// ─── File Upload Section ───────────────────────────────────────────────────────
function FileUploadSection({ token }: { token: string }) {
  const utils = trpc.useUtils();
  const { data: files } = trpc.portal.getMyFiles.useQuery({ token });
  const uploadMutation = trpc.portal.uploadFile.useMutation({
    onSuccess: () => {
      utils.portal.getMyFiles.invalidate();
      toast.success("File uploaded successfully");
    },
    onError: (e) => toast.error(e.message),
  });

  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList?.length) return;
    setUploading(true);
    for (const file of Array.from(fileList)) {
      if (file.size > 20 * 1024 * 1024) {
        toast.error(`${file.name} exceeds the 20MB limit`);
        continue;
      }
      const reader = new FileReader();
      await new Promise<void>((resolve) => {
        reader.onload = async (ev: ProgressEvent<FileReader>) => {
          try {
            const base64 = (ev.target?.result as string).split(",")[1];
            await uploadMutation.mutateAsync({
              token,
              fileName: file.name,
              mimeType: file.type,
              fileData: base64,
              fileSizeBytes: file.size,
            });
          } catch {}
          resolve();
        };
        reader.readAsDataURL(file);
      });
    }
    setUploading(false);
  };

  return (
    <section className="py-12 sm:py-16" style={{ background: "white" }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-8">
        <SectionHeading eyebrow="Post Contract" title="Plan Amendments" />
        <p
          className="text-sm text-muted-foreground mb-6 -mt-4"
          style={{ fontFamily: "Lato, sans-serif", lineHeight: "1.7" }}
        >
          Upload any amended plans or documents here. The B Modern team will review and issue variations as required.
        </p>

        <div
          className="rounded p-8 text-center transition-all cursor-pointer"
          style={{
            border: `2px dashed ${dragging ? "var(--bm-petrol)" : "var(--border)"}`,
            background: dragging ? "rgba(32,62,74,0.04)" : "var(--bm-cream)",
          }}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
          onClick={() => fileRef.current?.click()}
        >
          <Upload size={28} className="mx-auto mb-3" style={{ color: "var(--bm-bluegum)" }} />
          <p className="text-sm mb-1" style={{ fontFamily: "Lato, sans-serif", color: "var(--bm-petrol)" }}>
            {uploading ? "Uploading..." : "Drag and drop files here, or click to browse"}
          </p>
          <p className="text-xs text-muted-foreground" style={{ fontFamily: "Lato, sans-serif" }}>
            PDF, DWG, JPG, PNG — up to 20MB per file
          </p>
          <input
            ref={fileRef}
            type="file"
            multiple
            className="hidden"
            accept=".pdf,.dwg,.jpg,.jpeg,.png,.webp"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>

        {files && files.length > 0 && (
          <div className="mt-4 space-y-2">
            {files.map((f: any) => (
              <div
                key={f.id}
                className="flex items-center gap-3 px-4 py-3 rounded"
                style={{ background: "white", border: "1px solid var(--border)" }}
              >
                <FileText size={15} style={{ color: "var(--bm-bluegum)" }} className="shrink-0" />
                <span className="text-sm flex-1 truncate" style={{ fontFamily: "Lato, sans-serif" }}>{f.fileName}</span>
                <span
                  className="text-xs text-muted-foreground shrink-0"
                  style={{ fontFamily: "Lato, sans-serif" }}
                >
                  {new Date(f.uploadedAt).toLocaleDateString("en-AU")}
                </span>
                <a
                  href={f.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs hover:underline shrink-0"
                  style={{ color: "var(--bm-petrol)", fontFamily: "Lato, sans-serif" }}
                  onClick={(e) => e.stopPropagation()}
                >
                  View
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Change Request Section ────────────────────────────────────────────────────
function ChangeRequestSection({ token }: { token: string }) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");

  const submitMutation = trpc.portal.submitChangeRequest.useMutation({
    onSuccess: () => {
      toast.success("Change request submitted. We'll be in touch.");
      setOpen(false);
      setCategory("");
      setDescription("");
    },
    onError: (e) => toast.error(e.message),
  });

  const CATEGORIES = [
    "Structural Change",
    "Foundation / Slab",
    "External Finishes",
    "Roof Change",
    "Window / Door Change",
    "Floor Plan Modification",
    "Other Significant Change",
  ];

  return (
    <section
      className="py-12 sm:py-16"
      style={{ background: "var(--bm-cream)", borderTop: "1px solid var(--border)" }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-8">
        <SectionHeading eyebrow="Variations" title="Change Requests" />
        <p
          className="text-sm text-muted-foreground mb-6 -mt-4"
          style={{ fontFamily: "Lato, sans-serif", lineHeight: "1.7" }}
        >
          For significant structural changes that may affect the base contract price, submit a formal change request.
          The B Modern team will review and contact you regarding any variation.
        </p>
        <Button
          onClick={() => setOpen(true)}
          variant="outline"
          className="gap-2 text-xs tracking-widest uppercase"
          style={{
            borderColor: "var(--bm-petrol)",
            color: "var(--bm-petrol)",
            fontFamily: "Lato, sans-serif",
            fontWeight: 700
          }}
        >
          <Plus size={14} />
          Submit Change Request
        </Button>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle
                style={{ fontFamily: "'Playfair Display SC', Georgia, serif", color: "var(--bm-petrol)" }}
              >
                Change Request
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground" style={{ fontFamily: "Lato, sans-serif" }}>
                This request will be sent to the B Modern team for review. You will be contacted regarding any variation to the contract price.
              </p>
              <div className="space-y-1.5">
                <label
                  className="text-xs tracking-wider uppercase"
                  style={{ color: "var(--bm-petrol)", fontFamily: "Lato, sans-serif" }}
                >
                  Category
                </label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="h-10 text-sm" style={{ fontFamily: "Lato, sans-serif" }}>
                    <SelectValue placeholder="Select change type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c} style={{ fontFamily: "Lato, sans-serif" }}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label
                  className="text-xs tracking-wider uppercase"
                  style={{ color: "var(--bm-petrol)", fontFamily: "Lato, sans-serif" }}
                >
                  Description
                </label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the change you'd like to make..."
                  rows={4}
                  className="text-sm resize-none"
                  style={{ fontFamily: "Lato, sans-serif" }}
                />
              </div>
              <div className="flex gap-2 pt-1">
                <Button
                  onClick={() => submitMutation.mutate({ token, category, description })}
                  disabled={!category || !description || submitMutation.isPending}
                  className="flex-1 text-xs tracking-widest uppercase gap-2"
                  style={{ background: "var(--bm-petrol)", fontFamily: "Lato, sans-serif" }}
                >
                  <Send size={13} />
                  {submitMutation.isPending ? "Submitting..." : "Submit Request"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setOpen(false)}
                  className="text-xs"
                  style={{ fontFamily: "Lato, sans-serif" }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
}

// ─── Main Portal Component ─────────────────────────────────────────────────────
export default function ClientPortal() {
  const params = useParams<{ token: string }>();
  const token = params.token;

  const { data: project, isLoading, error } = trpc.portal.getProject.useQuery({ token });

  const [upgradeTotal, setUpgradeTotal] = useState(0);
  const [upgradeSelections, setUpgradeSelections] = useState<Record<number, number>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  // Track whether the client has completed package selection (stores the selected packageId)
  const [packageConfirmed, setPackageConfirmed] = useState<number | null>(null);
  // T&C acknowledgement gate: null = not checked yet, false = not accepted, true = accepted
  const [tcAccepted, setTcAccepted] = useState<boolean | null>(null);

  // Check if T&Cs have already been acknowledged (persisted on server)
  const { data: tcStatus } = trpc.portal.hasAcknowledgedTerms.useQuery(
    { token },
    { enabled: !!token }
  );

  useEffect(() => {
    if (tcStatus !== undefined) {
      setTcAccepted(tcStatus.acknowledged);
    }
  }, [tcStatus]);

  const utils = trpc.useUtils();
  const submitMutation = trpc.portal.submitSelections.useMutation({
    onSuccess: () => {
      utils.portal.getSubmission.invalidate();
      toast.success("Your selections have been submitted. We will be in touch shortly.");
      setIsSubmitted(true);
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSelectionChange = (total: number, selections: Record<number, number>) => {
    setUpgradeTotal(total);
    setUpgradeSelections(selections);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bm-cream)" }}>
        <div className="text-center">
          <div
            className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-4"
            style={{ borderColor: "var(--bm-petrol)", borderTopColor: "transparent" }}
          />
          <p className="text-sm text-muted-foreground" style={{ fontFamily: "Lato, sans-serif" }}>
            Loading your proposal...
          </p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bm-cream)" }}>
        <div className="text-center max-w-sm px-6">
          <img
            src={LOGO_URL}
            alt="B Modern Homes"
            className="h-8 mx-auto mb-8 object-contain"
            style={{ filter: "brightness(0) saturate(100%) invert(18%) sepia(28%) saturate(700%) hue-rotate(162deg) brightness(95%) contrast(95%)" }}
          />
          <h1
            className="text-xl mb-3"
            style={{ fontFamily: "'Playfair Display SC', Georgia, serif", color: "var(--bm-petrol)" }}
          >
            Access Unavailable
          </h1>
          <p className="text-sm text-muted-foreground" style={{ fontFamily: "Lato, sans-serif", lineHeight: "1.7" }}>
            This link is invalid or has expired. Please contact your B Modern representative for assistance.
          </p>
        </div>
      </div>
    );
  }

  const isLocked = !!project.portalLockedAt;
  const isPostContract = project.status === "contract_signed" || project.status === "post_contract";
  const basePrice = Number(project.baseContractPrice || 0);

  // Show T&C gate if not yet accepted
  if (tcAccepted === null) {
    // Still loading T&C status — show spinner
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bm-cream)" }}>
        <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--bm-petrol)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  if (!tcAccepted) {
    return <TcGateScreen token={token} onAccepted={() => setTcAccepted(true)} />;
  }

  // Show package selection screen if no package has been selected yet
  // (and the portal is not locked / post-contract)
  const hasPackageSelected = project.selectedPackageId != null;
  const showPackageSelection = !hasPackageSelected && !isLocked && packageConfirmed === null && !isPostContract;

  if (showPackageSelection) {
    return (
      <PackageSelectionScreen
        token={token}
        project={project}
        onPackageSelected={(pkgId) => setPackageConfirmed(pkgId)}
      />
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--bm-cream)", paddingBottom: upgradeTotal > 0 ? "80px" : "0" }}>
      {project.status === "draft" && (
        <div className="w-full py-2 px-4 text-center text-xs font-medium" style={{ background: "#f59e0b", color: "#1a1a1a", fontFamily: "Lato, sans-serif", letterSpacing: "0.05em" }}>
          DRAFT PREVIEW — This proposal has not been sent to the client yet
        </div>
      )}
      <PortalHeader project={project} token={token} />
      <HeroSection project={project} />
      <ProposalSummaryBar project={project} upgradeTotal={upgradeTotal} />
      <InclusionsSection token={token} />
      <UpgradesSection token={token} isLocked={isLocked} onSelectionChange={handleSelectionChange} />
      <SubmitUpgradesSection
        token={token}
        upgradeTotal={upgradeTotal}
        isLocked={isLocked}
        onSubmitted={setIsSubmitted}
      />
      {isPostContract && (
        <>
          <FileUploadSection token={token} />
          <ChangeRequestSection token={token} />
        </>
      )}

      {/* Footer */}
      <footer
        className="py-10 mt-4"
        style={{ background: "var(--bm-petrol)" }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-8 text-center">
          <img
            src={LOGO_URL}
            alt="B Modern Homes"
            className="h-7 mx-auto mb-4 object-contain"
            style={{ filter: "brightness(0) invert(1) opacity(0.7)" }}
          />
          <p
            className="text-xs"
            style={{ color: "rgba(255,255,255,0.5)", fontFamily: "Lato, sans-serif", letterSpacing: "0.05em" }}
          >
            This proposal is confidential and prepared exclusively for {project.clientName}.
          </p>
        </div>
      </footer>

      {/* Sticky upgrade total bar */}
      <StickyUpgradeBar
        upgradeTotal={upgradeTotal}
        basePrice={basePrice}
        isLocked={isLocked}
        onSubmit={() => submitMutation.mutate({ token, totalUpgradeCost: upgradeTotal.toString() })}
        isSubmitting={submitMutation.isPending}
        isSubmitted={isSubmitted}
      />
    </div>
  );
}
