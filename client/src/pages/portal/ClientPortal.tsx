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
  Clock, FileText, Plus, Eye, EyeOff, Send, Download, Lock, Sparkles, ArrowRight, Star
} from "lucide-react";

const LOGO_URL = "https://cdn-bmodern.manus.space/B-Modern-Homes_Logo_Horizontal-Monochrome_RGB.jpg";
const LOGO_WHITE_URL = "https://cdn-bmodern.manus.space/B-Modern-Homes_Logo_Horizontal-Monochrome_RGB.jpg";

// Key differences for each package tier (for the comparison table)
const PACKAGE_HIGHLIGHTS: Record<string, { label: string; entry: string; mid: string; premium: string }[]> = {
  rows: [
    { label: "Tapware", entry: "Caroma Luna", mid: "ABI Interiors Milani", premium: "ABI Interiors Milani" },
    { label: "Appliances", entry: "Westinghouse", mid: "SMEG Classic", premium: "Fisher & Paykel" },
    { label: "Benchtop", entry: "20mm Engineered Stone", mid: "40mm Engineered Stone", premium: "40mm Marble" },
    { label: "Joinery", entry: "Laminate Soft-Close", mid: "Laminate Soft-Close", premium: "Shaker Joinery" },
    { label: "Tile Allowance", entry: "$40/m²", mid: "$50/m²", premium: "$60/m²" },
    { label: "Power Points", entry: "15 double", mid: "20 double", premium: "30 double" },
    { label: "Downlights", entry: "25 LED", mid: "40 LED", premium: "50 LED" },
    { label: "Air Conditioning", entry: "Ducted 12kW", mid: "Ducted 16kW", premium: "Ducted 20kW" },
    { label: "Smart Home", entry: "—", mid: "—", premium: "Loxone Automation" },
    { label: "Cornice", entry: "Standard Cove", mid: "Square Set", premium: "Square Set + Windows" },
  ] as any,
};

// ─── Package Selection Screen ─────────────────────────────────────────────────
function PackageSelectionScreen({
  token,
  project,
  onPackageSelected,
}: {
  token: string;
  project: any;
  onPackageSelected: (packageId: number) => void;
}) {
  const utils = trpc.useUtils();
  const { data: packages, isLoading } = trpc.portal.getPackages.useQuery({ token });
  const [selectedId, setSelectedId] = useState<number | null>(project.selectedPackageId ?? null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const selectMutation = trpc.portal.selectPackage.useMutation({
    onSuccess: () => {
      utils.portal.getProject.invalidate();
      toast.success("Package selected! Explore your inclusions and upgrades below.");
      onPackageSelected(selectedId!);
    },
    onError: (e) => toast.error(e.message),
  });

  const TIER_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; badge: string }> = {
    entry: { label: "Entry", color: "#4a5568", bg: "#f7f8fa", border: "#cbd5e0", badge: "bg-slate-100 text-slate-700" },
    mid: { label: "Mid", color: "var(--bm-petrol)", bg: "rgba(32,62,74,0.03)", border: "var(--bm-petrol)", badge: "bg-amber-100 text-amber-800" },
    premium: { label: "Premium", color: "#6b46c1", bg: "rgba(107,70,193,0.03)", border: "#9f7aea", badge: "bg-purple-100 text-purple-800" },
  };

  const highlights = (PACKAGE_HIGHLIGHTS as any).rows as { label: string; entry: string; mid: string; premium: string }[];

  return (
    <div className="min-h-screen" style={{ background: "var(--bm-cream)" }}>
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
          <img
            src={LOGO_URL}
            alt="B Modern Homes"
            className="h-7 object-contain"
            style={{ filter: "brightness(0) saturate(100%) invert(18%) sepia(28%) saturate(700%) hue-rotate(162deg) brightness(95%) contrast(95%)" }}
          />
          <div className="text-xs text-muted-foreground" style={{ fontFamily: "Lato, sans-serif", letterSpacing: "0.1em" }}>TENDER PORTAL</div>
        </div>
      </header>

      {/* Hero */}
      <div
        className="py-16 sm:py-20 text-center"
        style={{ background: "linear-gradient(135deg, var(--bm-petrol) 0%, #1a3540 100%)" }}
      >
        <div className="max-w-2xl mx-auto px-4">
          <p className="text-xs tracking-widest uppercase mb-4" style={{ color: "rgba(255,255,255,0.6)", fontFamily: "Lato, sans-serif" }}>
            Welcome, {project.clientName}
          </p>
          <h1 className="text-3xl sm:text-4xl mb-4" style={{ fontFamily: "'Playfair Display SC', Georgia, serif", color: "white" }}>
            Choose Your Package
          </h1>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.75)", fontFamily: "Lato, sans-serif", lineHeight: "1.8" }}>
            Select the package that best suits your vision for {project.projectAddress}.
            Each package includes a full set of standard inclusions — you can customise further with upgrades after selecting.
          </p>
        </div>
      </div>

      {/* Package Cards */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-12">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[1,2,3].map(i => <div key={i} className="h-96 rounded-xl bg-secondary animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {packages?.map((pkg) => {
              const cfg = TIER_CONFIG[pkg.tier] || TIER_CONFIG.entry;
              const isSelected = selectedId === pkg.id;
              const isExpanded = expandedId === pkg.id;
              return (
                <div
                  key={pkg.id}
                  className="relative rounded-xl overflow-hidden transition-all duration-200"
                  style={{
                    border: `2px solid ${isSelected ? cfg.border : "var(--border)"}`,
                    boxShadow: isSelected ? `0 8px 32px ${cfg.color}22` : "0 2px 8px rgba(0,0,0,0.06)",
                    background: "white",
                  }}
                >
                  {/* Recommended badge */}
                  {pkg.isRecommended && (
                    <div
                      className="absolute top-3 right-3 z-10 flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full"
                      style={{ background: "var(--bm-petrol)", color: "white", fontFamily: "Lato, sans-serif", letterSpacing: "0.08em" }}
                    >
                      <Sparkles size={9} /> RECOMMENDED
                    </div>
                  )}

                  {/* Hero image */}
                  {pkg.heroImageUrl && (
                    <div className="relative h-48 overflow-hidden">
                      <img src={pkg.heroImageUrl} alt={pkg.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.4) 100%)" }} />
                    </div>
                  )}

                  <div className="p-5">
                    {/* Tier badge */}
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg.badge}`} style={{ fontFamily: "Lato, sans-serif" }}>
                      {cfg.label.toUpperCase()}
                    </span>

                    <h2 className="text-xl mt-2 mb-1" style={{ fontFamily: "'Playfair Display', Georgia, serif", color: "var(--bm-petrol)" }}>
                      {pkg.name}
                    </h2>
                    <p className="text-xs text-muted-foreground mb-4" style={{ fontFamily: "Lato, sans-serif", lineHeight: "1.6" }}>
                      {pkg.tagline}
                    </p>

                    {/* Key highlights */}
                    <div className="space-y-1.5 mb-5">
                      {highlights.slice(0, 4).map((row) => (
                        <div key={row.label} className="flex items-start gap-2 text-xs" style={{ fontFamily: "Lato, sans-serif" }}>
                          <span className="shrink-0 mt-0.5" style={{ color: cfg.color }}>&#8226;</span>
                          <span className="text-muted-foreground">{row.label}:</span>
                          <span className="font-medium" style={{ color: "var(--bm-petrol)" }}>
                            {(row as any)[pkg.tier]}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Expand/collapse more details */}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : pkg.id)}
                      className="flex items-center gap-1 text-xs mb-4 transition-colors"
                      style={{ color: cfg.color, fontFamily: "Lato, sans-serif" }}
                    >
                      {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      {isExpanded ? "Show less" : "View all inclusions"}
                    </button>

                    {isExpanded && (
                      <div className="mb-4 space-y-1.5">
                        {highlights.slice(4).map((row) => (
                          <div key={row.label} className="flex items-start gap-2 text-xs" style={{ fontFamily: "Lato, sans-serif" }}>
                            <span className="shrink-0 mt-0.5" style={{ color: cfg.color }}>&#8226;</span>
                            <span className="text-muted-foreground">{row.label}:</span>
                            <span className="font-medium" style={{ color: "var(--bm-petrol)" }}>
                              {(row as any)[pkg.tier]}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Select button */}
                    <button
                      onClick={() => setSelectedId(pkg.id)}
                      className="w-full py-2.5 rounded text-sm font-semibold transition-all"
                      style={{
                        background: isSelected ? cfg.color : "transparent",
                        color: isSelected ? "white" : cfg.color,
                        border: `1.5px solid ${cfg.color}`,
                        fontFamily: "Lato, sans-serif",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {isSelected ? (
                        <span className="flex items-center justify-center gap-2"><Check size={14} /> Selected</span>
                      ) : (
                        "Select Package"
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
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

        {/* Comparison table */}
        {showComparison && (
          <div className="mt-6 rounded-xl overflow-hidden border" style={{ borderColor: "var(--border)" }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "var(--bm-petrol)", color: "white" }}>
                  <th className="py-3 px-4 text-left text-xs" style={{ fontFamily: "Lato, sans-serif", letterSpacing: "0.08em", fontWeight: 600 }}>FEATURE</th>
                  <th className="py-3 px-4 text-center text-xs" style={{ fontFamily: "Lato, sans-serif", letterSpacing: "0.08em", fontWeight: 600 }}>BUILT FOR EXCELLENCE</th>
                  <th className="py-3 px-4 text-center text-xs" style={{ fontFamily: "Lato, sans-serif", letterSpacing: "0.08em", fontWeight: 600, background: "rgba(255,255,255,0.1)" }}>TAILORED LIVING ★</th>
                  <th className="py-3 px-4 text-center text-xs" style={{ fontFamily: "Lato, sans-serif", letterSpacing: "0.08em", fontWeight: 600 }}>SIGNATURE SERIES</th>
                </tr>
              </thead>
              <tbody>
                {highlights.map((row, idx) => (
                  <tr key={row.label} style={{ background: idx % 2 === 0 ? "white" : "var(--bm-cream)" }}>
                    <td className="py-2.5 px-4 text-xs font-medium" style={{ fontFamily: "Lato, sans-serif", color: "var(--bm-petrol)" }}>{row.label}</td>
                    <td className="py-2.5 px-4 text-xs text-center text-muted-foreground" style={{ fontFamily: "Lato, sans-serif" }}>{row.entry}</td>
                    <td className="py-2.5 px-4 text-xs text-center font-medium" style={{ fontFamily: "Lato, sans-serif", color: "var(--bm-petrol)", background: idx % 2 === 0 ? "rgba(32,62,74,0.04)" : "rgba(32,62,74,0.08)" }}>{row.mid}</td>
                    <td className="py-2.5 px-4 text-xs text-center text-muted-foreground" style={{ fontFamily: "Lato, sans-serif" }}>{row.premium}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Confirm selection CTA */}
        <div className="mt-10 text-center">
          <Button
            disabled={!selectedId || selectMutation.isPending}
            onClick={() => selectedId && selectMutation.mutate({ token, packageId: selectedId })}
            className="gap-2 px-8 py-3 text-sm tracking-widest uppercase"
            style={{ background: "var(--bm-petrol)", fontFamily: "Lato, sans-serif", fontWeight: 700 }}
          >
            {selectMutation.isPending ? "Confirming..." : (
              <><ArrowRight size={15} /> Confirm Package &amp; View Proposal</>
            )}
          </Button>
          {!selectedId && (
            <p className="text-xs text-muted-foreground mt-3" style={{ fontFamily: "Lato, sans-serif" }}>Please select a package above to continue</p>
          )}
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
  const { data: sections } = trpc.portal.getInclusions.useQuery({ token });
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  if (!sections?.length) return null;

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
          {sections.map((section) => {
            const isOpen = expanded.has(section.id);
            return (
              <div
                key={section.id}
                className="overflow-hidden rounded"
                style={{ border: "1px solid var(--border)" }}
              >
                <button
                  className="w-full flex items-center justify-between px-6 py-5 text-left transition-colors"
                  style={{
                    background: isOpen ? "var(--bm-petrol)" : "white",
                    fontFamily: "Lato, sans-serif"
                  }}
                  onClick={() => toggleSection(section.id)}
                >
                  <span
                    className="font-medium text-sm tracking-wide"
                    style={{
                      color: isOpen ? "white" : "var(--bm-petrol)",
                      letterSpacing: "0.05em"
                    }}
                  >
                    {section.title.toUpperCase()}
                  </span>
                  {isOpen
                    ? <ChevronUp size={16} style={{ color: "white" }} className="shrink-0" />
                    : <ChevronDown size={16} style={{ color: "var(--bm-bluegum)" }} className="shrink-0" />
                  }
                </button>
                {isOpen && (
                  <div className="border-t" style={{ borderColor: "var(--border)" }}>
                    {section.imageUrl && (
                      <div className="w-full h-56 sm:h-72 overflow-hidden">
                        <img
                          src={section.imageUrl}
                          alt={section.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    {section.description && (
                      <div className="px-6 py-5">
                        <p
                          className="text-sm leading-relaxed"
                          style={{ fontFamily: "Lato, sans-serif", color: "var(--foreground)", lineHeight: "1.8" }}
                        >
                          {section.description}
                        </p>
                      </div>
                    )}
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
