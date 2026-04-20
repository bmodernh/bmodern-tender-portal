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
  Package, ToggleRight, Eye, X, Download, DollarSign, MinusCircle, Banknote,
  Milestone, Building2, Hammer, KeyRound, Home, ClipboardCheck, PenTool, FileSignature, HardHat,
} from "lucide-react";
import { FloatingChatButton } from "@/components/ProjectChat";
import { SignaturePad } from "@/components/SignaturePad";
import PortalLayout, { type PortalTab } from "@/components/portal/PortalLayout";
import PortalDashboard from "@/components/portal/PortalDashboard";
import PortalSiteUpdates from "@/components/portal/PortalSiteUpdates";
import PortalApprovals from "@/components/portal/PortalApprovals";
import PortalVariations from "@/components/portal/PortalVariations";
import PortalDocuments from "@/components/portal/PortalDocuments";
import PortalMessages from "@/components/portal/PortalMessages";
import PortalMeetingMinutes from "@/components/portal/PortalMeetingMinutes";

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

// ─── Project Timeline ────────────────────────────────────────────────────────
function ProjectTimeline({ token }: { token: string }) {
  const { data: timeline, isLoading } = trpc.portal.getTimeline.useQuery({ token });

  if (isLoading || !timeline) return null;

  const milestones = [
    { key: "portalOpened", label: "Proposal Issued", date: timeline.portalOpened, icon: FileText, description: "Your personalised tender portal was created" },
    { key: "tenderSigned", label: "Tender Signed", date: timeline.tenderSigned, icon: PenTool, description: "Upgrade selections reviewed and signed off" },
    { key: "contractUploaded", label: "Contract Signed", date: timeline.contractUploaded, icon: FileSignature, description: "Building contract executed" },
    { key: "constructionStarted", label: "Construction Started", date: timeline.constructionStarted, icon: HardHat, description: "Site works commenced" },
    { key: "framingCompleted", label: "Frame Stage", date: timeline.framingCompleted, icon: Building2, description: "Structural framing completed" },
    { key: "lockupCompleted", label: "Lock-Up Stage", date: timeline.lockupCompleted, icon: KeyRound, description: "External cladding, windows & doors installed" },
    { key: "fixoutCompleted", label: "Fix-Out Stage", date: timeline.fixoutCompleted, icon: Hammer, description: "Internal fit-out and finishing" },
    { key: "completed", label: "Practical Completion", date: timeline.completed, icon: ClipboardCheck, description: "Build complete, final inspections passed" },
    { key: "handover", label: "Handover", date: timeline.handover, icon: Home, description: "Keys handed over — welcome home" },
  ];

  // Find the last completed milestone index
  let lastCompletedIdx = -1;
  milestones.forEach((m, i) => { if (m.date) lastCompletedIdx = i; });

  // Only show timeline if at least the first milestone is done
  if (lastCompletedIdx < 0) return null;

  // Determine which milestones to show: all completed + next upcoming one
  const visibleCount = Math.min(lastCompletedIdx + 2, milestones.length);

  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-8 h-8 rounded-full bg-[#203E4A]/10 flex items-center justify-center">
            <Milestone className="h-4 w-4 text-[#203E4A]" />
          </div>
          <h2 className="font-['Playfair_Display_SC'] text-xl text-[#203E4A] tracking-wider">Project Timeline</h2>
        </div>
        <p className="text-sm text-[#6D7E94] font-['Lato'] ml-[42px]">Track the progress of your home build</p>
      </div>

      <div className="relative ml-4 sm:ml-8">
        {/* Vertical line */}
        <div className="absolute left-4 top-0 bottom-0 w-px bg-gradient-to-b from-[#203E4A]/30 via-[#203E4A]/15 to-transparent" />

        <div className="space-y-0">
          {milestones.slice(0, visibleCount).map((m, idx) => {
            const isCompleted = !!m.date;
            const isCurrent = idx === lastCompletedIdx;
            const isNext = idx === lastCompletedIdx + 1;
            const Icon = m.icon;

            return (
              <div key={m.key} className="relative flex items-start gap-5 pb-8 last:pb-0">
                {/* Node */}
                <div className={`relative z-10 flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-500 ${
                  isCompleted
                    ? isCurrent
                      ? "bg-[#203E4A] shadow-lg shadow-[#203E4A]/25 ring-4 ring-[#203E4A]/10"
                      : "bg-[#203E4A]"
                    : isNext
                      ? "bg-white border-2 border-[#203E4A]/30 border-dashed"
                      : "bg-gray-100 border border-gray-200"
                }`}>
                  {isCompleted ? (
                    <Icon className="h-4 w-4 text-white" />
                  ) : (
                    <Icon className={`h-4 w-4 ${isNext ? "text-[#203E4A]/40" : "text-gray-300"}`} />
                  )}
                  {isCurrent && (
                    <span className="absolute -right-1 -top-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white animate-pulse" />
                  )}
                </div>

                {/* Content */}
                <div className={`flex-1 min-w-0 pt-1 ${
                  isCompleted ? "" : "opacity-50"
                }`}>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className={`font-['Lato'] font-semibold text-sm tracking-wide ${
                      isCompleted ? "text-[#203E4A]" : "text-gray-400"
                    }`}>
                      {m.label}
                    </h3>
                    {isCompleted && m.date && (
                      <span className="text-[11px] font-['Lato'] text-[#6D7E94] bg-[#203E4A]/5 rounded-full px-2.5 py-0.5">
                        {fmtDate(m.date)}
                      </span>
                    )}
                    {isCurrent && (
                      <span className="text-[10px] font-['Lato'] font-bold uppercase tracking-[0.15em] text-emerald-600 bg-emerald-50 rounded-full px-2 py-0.5">
                        Current
                      </span>
                    )}
                    {isNext && (
                      <span className="text-[10px] font-['Lato'] font-bold uppercase tracking-[0.15em] text-[#203E4A]/40 bg-[#203E4A]/5 rounded-full px-2 py-0.5">
                        Up Next
                      </span>
                    )}
                  </div>
                  <p className={`text-xs font-['Lato'] mt-0.5 ${
                    isCompleted ? "text-[#6D7E94]" : "text-gray-300"
                  }`}>
                    {m.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

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
function HeroSection({ project, minPrice, maxPrice, hasSelections }: { project: any; minPrice?: number; maxPrice?: number; hasSelections?: boolean }) {
  const basePrice = parseFloat(project.baseContractPrice || "0");
  const showRange = minPrice != null && maxPrice != null && maxPrice > minPrice && !hasSelections;
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
            {showRange ? (
              <>
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#6D7E94] font-['Lato'] font-semibold mb-1">Estimated Price Range</p>
                <p className="text-3xl md:text-4xl font-bold text-[#203E4A] font-['Lato'] tracking-tight">
                  {fmt(minPrice)} <span className="text-[#6D7E94] font-normal mx-1">&ndash;</span> {fmt(maxPrice)}
                </p>
                <p className="text-[10px] text-[#6D7E94] font-['Lato'] mt-1">Based on your starting tier. Final price depends on your selections.</p>
              </>
            ) : (
              <>
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#6D7E94] font-['Lato'] font-semibold mb-1">Base Contract Price</p>
                <p className="text-3xl md:text-4xl font-bold text-[#203E4A] font-['Lato'] tracking-tight">{fmt(basePrice)}</p>
              </>
            )}
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

// ─── Section 1B: PC Items (Prime Cost) ────────────────────────────────────────────────
function PcItemsSection({ token }: { token: string }) {
  const { data: items } = trpc.portal.getPcItems.useQuery({ token });
  if (!items || items.length === 0) return null;
  return (
    <section className="py-10 md:py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-[#203E4A] flex items-center justify-center">
            <DollarSign className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="font-['Playfair_Display_SC'] text-xl md:text-2xl text-[#203E4A] tracking-wider">PC Items (Prime Cost)</h2>
            <p className="text-xs text-[#6D7E94] font-['Lato'] mt-0.5">Allowances for items selected during construction</p>
          </div>
        </div>
        <div className="mt-6 bg-white rounded-xl border shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#203E4A]/5 text-[#6D7E94] font-['Lato'] text-xs uppercase tracking-wider">
                <th className="text-left px-5 py-3">Description</th>
                <th className="text-right px-5 py-3">Allowance</th>
                <th className="text-left px-5 py-3">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item: any) => (
                <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3 font-['Lato'] text-[#203E4A] font-medium">{item.description}</td>
                  <td className="px-5 py-3 text-right font-['Lato'] text-[#203E4A] font-semibold">{item.allowance ? fmt(item.allowance) : "TBC"}</td>
                  <td className="px-5 py-3 font-['Lato'] text-[#6D7E94] text-xs">{item.notes || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

// ─── Section 1C: Provisional Sums ────────────────────────────────────────────────────
function ProvisionalSumsSection({ token }: { token: string }) {
  const { data: items } = trpc.portal.getProvisionalSums.useQuery({ token });
  if (!items || items.length === 0) return null;
  return (
    <section className="py-10 md:py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-[#203E4A] flex items-center justify-center">
            <Banknote className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="font-['Playfair_Display_SC'] text-xl md:text-2xl text-[#203E4A] tracking-wider">Provisional Sums</h2>
            <p className="text-xs text-[#6D7E94] font-['Lato'] mt-0.5">Estimated amounts subject to final measurement</p>
          </div>
        </div>
        <div className="mt-6 bg-white rounded-xl border shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#203E4A]/5 text-[#6D7E94] font-['Lato'] text-xs uppercase tracking-wider">
                <th className="text-left px-5 py-3">Description</th>
                <th className="text-right px-5 py-3">Amount</th>
                <th className="text-left px-5 py-3">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item: any) => (
                <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3 font-['Lato'] text-[#203E4A] font-medium">{item.description}</td>
                  <td className="px-5 py-3 text-right font-['Lato'] text-[#203E4A] font-semibold">{item.amount ? fmt(item.amount) : "TBC"}</td>
                  <td className="px-5 py-3 font-['Lato'] text-[#6D7E94] text-xs">{item.notes || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

// ─── Section 1D: Exclusions ─────────────────────────────────────────────────────────
function ExclusionsSection({ token }: { token: string }) {
  const { data: items } = trpc.portal.getExclusions.useQuery({ token });
  if (!items || items.length === 0) return null;
  return (
    <section className="py-10 md:py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-[#203E4A] flex items-center justify-center">
            <MinusCircle className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="font-['Playfair_Display_SC'] text-xl md:text-2xl text-[#203E4A] tracking-wider">Exclusions</h2>
            <p className="text-xs text-[#6D7E94] font-['Lato'] mt-0.5">Items not included in the base contract price</p>
          </div>
        </div>
        <div className="mt-6 bg-white rounded-xl border shadow-sm overflow-hidden">
          <ul className="divide-y divide-gray-100">
            {items.map((item: any) => (
              <li key={item.id} className="px-5 py-3.5 flex items-start gap-3 hover:bg-gray-50/50 transition-colors">
                <MinusCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-[#203E4A] font-['Lato']">{item.description}</span>
              </li>
            ))}
          </ul>
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

  const startingTier = project.startingTier ?? 1;

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

  // Calculate deltas relative to starting tier
  const getRelativeDelta = (item: any, targetTier: number) => {
    if (targetTier <= startingTier) return 0;
    const baseDelta = startingTier === 1 ? 0 : startingTier === 2 ? Number(item.tier2Delta || 0) : Number(item.tier3Delta || 0);
    const targetDelta = targetTier === 1 ? 0 : targetTier === 2 ? Number(item.tier2Delta || 0) : Number(item.tier3Delta || 0);
    return targetDelta - baseDelta;
  };

  const upgradeTotal = useMemo(() => {
    if (!priceData?.lineItems) return 0;
    let total = 0;
    for (const item of priceData.lineItems) {
      const tier = selectionMap[item.itemKey] ?? startingTier;
      total += getRelativeDelta(item, tier);
    }
    return total;
  }, [priceData, selectionMap, startingTier]);

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

        {/* Tier legend — only show tiers >= startingTier */}
        <div className="flex flex-wrap gap-2 mt-6 mb-8">
          {TIER_META.filter(t => t.tier >= startingTier).map(t => {
            const Icon = t.icon;
            return (
              <div key={t.tier} className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-['Lato'] font-semibold ${t.bg} ${t.border} border shadow-sm`}>
                <Icon className="h-3.5 w-3.5" style={{ color: t.accent }} />
                <span style={{ color: t.accent }}>{t.name}{t.tier === startingTier ? " (Included)" : ""}</span>
              </div>
            );
          })}
        </div>

        <div className="space-y-3">
          {grouped.map(({ category, items }) => {
            const isOpen = expandedCats.has(category);
            const catUpgrade = items.reduce((sum, item) => {
              const tier = selectionMap[item.itemKey] ?? startingTier;
              return sum + getRelativeDelta(item, tier);
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
                      const currentTier = selectionMap[item.itemKey] ?? startingTier;
                      // Build visible tier cards based on startingTier
                      const tierCards: Array<{ tier: number; label: string | null; desc: string | null; img: string | null; delta: number; meta: typeof TIER_META[0] }> = [];
                      if (startingTier <= 1) tierCards.push({ tier: 1, label: item.tier1Label, desc: null, img: item.tier1ImageUrl, delta: 0, meta: TIER_META[0] });
                      if (startingTier <= 2) tierCards.push({ tier: 2, label: item.tier2Label, desc: item.tier2Description, img: item.tier2ImageUrl, delta: getRelativeDelta(item, 2), meta: TIER_META[1] });
                      tierCards.push({ tier: 3, label: item.tier3Label, desc: item.tier3Description, img: item.tier3ImageUrl, delta: getRelativeDelta(item, 3), meta: TIER_META[2] });

                      const gridCols = tierCards.length === 3 ? "sm:grid-cols-3" : tierCards.length === 2 ? "sm:grid-cols-2" : "sm:grid-cols-1";

                      return (
                        <div key={item.itemKey} className="px-5 py-5">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="font-['Lato'] font-bold text-[#203E4A] text-sm">{item.label}</h4>

                          </div>
                          <div className={`grid grid-cols-1 ${gridCols} gap-3`}>
                            {tierCards.map(tc => {
                              const isSelected = currentTier === tc.tier;
                              const isBase = tc.tier === startingTier;
                              const Icon = tc.meta.icon;
                              return (
                                <button
                                  key={tc.tier}
                                  onClick={() => handleSelect(item.itemKey, tc.tier)}
                                  className={`relative rounded-xl border-2 p-4 text-left transition-all group ${
                                    isSelected
                                      ? `border-[${tc.meta.accent}] ${tc.meta.bg} shadow-md ring-1 ${tc.meta.ring}/20`
                                      : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                                  }`}
                                  style={isSelected ? { borderColor: tc.meta.accent } : undefined}
                                >
                                  {isSelected && (
                                    <div className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: tc.meta.accent }}>
                                      <Check className="h-3 w-3 text-white" />
                                    </div>
                                  )}
                                  {tc.img && (
                                    <img src={tc.img} alt="" className="w-full h-20 object-cover rounded-lg mb-3" />
                                  )}
                                  <div className="flex items-center gap-1.5 mb-2">
                                    <Icon className="h-3.5 w-3.5" style={{ color: tc.meta.accent }} />
                                    <span className="text-[10px] uppercase tracking-[0.12em] font-bold font-['Lato']" style={{ color: tc.meta.accent }}>
                                      {isBase ? "Included" : tc.meta.name.split(" ")[0]}
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-700 font-['Lato'] leading-relaxed line-clamp-2">{tc.label || (isBase ? "Standard inclusion" : "Upgrade option")}</p>
                                  {tc.desc && <p className="text-[11px] text-gray-500 mt-1 font-['Lato'] line-clamp-1">{tc.desc}</p>}
                                  <p className="text-sm font-bold mt-2 font-['Lato']" style={{ color: tc.meta.accent }}>
                                    {isBase ? "Included" : tc.delta > 0 ? `+${fmt(tc.delta)}` : tc.delta < 0 ? fmt(tc.delta) : "Included"}
                                  </p>
                                </button>
                              );
                            })}
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

// ─── Section 2B: Plus Options (Per-Project Add-Ons) ─────────────────────────
function PlusOptionsSection({
  token,
  project,
  onTotalChange,
}: {
  token: string;
  project: any;
  onTotalChange: (plusTotal: number) => void;
}) {
  const { data: groups } = trpc.portal.getUpgradeGroups.useQuery({ token });
  const { data: options } = trpc.portal.getUpgradeOptions.useQuery({ token });
  const { data: mySelections } = trpc.portal.getMySelections.useQuery({ token });
  const utils = trpc.useUtils();
  const saveMut = trpc.portal.saveSelection.useMutation({
    onSuccess: () => utils.portal.getMySelections.invalidate(),
    onError: (e) => toast.error(e.message),
  });

  const selectedSet = useMemo(() => {
    const s = new Set<number>();
    if (mySelections) for (const sel of mySelections) { if (sel.selected) s.add(sel.upgradeOptionId); }
    return s;
  }, [mySelections]);

  const plusTotal = useMemo(() => {
    if (!options) return 0;
    let total = 0;
    for (const opt of options) {
      if (selectedSet.has(opt.id) && !opt.isIncluded) {
        total += Number(opt.priceDelta || 0);
      }
    }
    return total;
  }, [options, selectedSet]);

  useEffect(() => { onTotalChange(plusTotal); }, [plusTotal]);

  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set());
  const toggleGroup = (id: number) => {
    setExpandedGroups(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  if (!groups || groups.length === 0 || !options || options.length === 0) return null;

  const isLocked = !!project.portalLockedAt;

  const handleToggle = (optionId: number) => {
    if (isLocked) return;
    const currentlySelected = selectedSet.has(optionId);
    saveMut.mutate({ token, upgradeOptionId: optionId, selected: !currentlySelected });
  };

  return (
    <section className="py-12 md:py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Section header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center">
            <Package className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="font-['Playfair_Display_SC'] text-xl md:text-2xl text-[#203E4A] tracking-wider">Plus Options</h2>
            <p className="text-xs text-[#6D7E94] font-['Lato'] mt-0.5">Additional add-ons to enhance your home beyond the standard tiers</p>
          </div>
        </div>

        <div className="space-y-3 mt-8">
          {groups.map((group: any) => {
            const groupOptions = options.filter((o: any) => o.groupId === group.id);
            if (groupOptions.length === 0) return null;
            const isOpen = expandedGroups.has(group.id);
            const groupTotal = groupOptions.reduce((sum: number, opt: any) => {
              if (selectedSet.has(opt.id) && !opt.isIncluded) return sum + Number(opt.priceDelta || 0);
              return sum;
            }, 0);

            return (
              <div key={group.id} className="border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                <button onClick={() => toggleGroup(group.id)} className="w-full flex items-center justify-between px-5 py-4 bg-gray-50/80 hover:bg-gray-100/80 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="font-['Playfair_Display_SC'] text-sm tracking-wider text-[#203E4A]">{group.category}</span>
                    <Badge variant="secondary" className="text-[10px] font-['Lato'] bg-teal-50 text-teal-700">{groupOptions.length} options</Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    {groupTotal > 0 && (
                      <span className="text-xs font-['Lato'] font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full">+{fmt(groupTotal)}</span>
                    )}
                    {isOpen ? <ChevronUp className="h-4 w-4 text-[#6D7E94]" /> : <ChevronDown className="h-4 w-4 text-[#6D7E94]" />}
                  </div>
                </button>
                {isOpen && (
                  <div className="divide-y">
                    {groupOptions.map((opt: any) => {
                      const isSelected = selectedSet.has(opt.id);
                      const price = Number(opt.priceDelta || 0);
                      return (
                        <div key={opt.id} className="px-5 py-4">
                          <div className="flex items-start gap-4">
                            {/* Option image */}
                            {opt.imageUrl && (
                              <img src={opt.imageUrl} alt={opt.optionName} className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-xl flex-shrink-0 border" />
                            )}
                            {!opt.imageUrl && (
                              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                                <Package className="h-6 w-6 text-[#6D7E94]/40" />
                              </div>
                            )}
                            {/* Option details */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-['Lato'] font-bold text-[#203E4A] text-sm">{opt.optionName}</h4>
                                {opt.isIncluded && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-50 text-green-700 font-['Lato'] font-semibold">Included</span>
                                )}
                              </div>
                              {opt.description && (
                                <p className="text-xs text-[#6D7E94] font-['Lato'] leading-relaxed line-clamp-2">{opt.description}</p>
                              )}
                              {!opt.isIncluded && price > 0 && (
                                <p className="text-sm font-bold text-teal-700 mt-1.5 font-['Lato']">+{fmt(price)}</p>
                              )}
                              {!opt.isIncluded && price === 0 && (
                                <p className="text-sm font-bold text-[#203E4A] mt-1.5 font-['Lato']">No additional cost</p>
                              )}
                            </div>
                            {/* Toggle button */}
                            {!opt.isIncluded && (
                              <button
                                onClick={() => handleToggle(opt.id)}
                                disabled={isLocked || saveMut.isPending}
                                className={`flex-shrink-0 w-14 h-8 rounded-full transition-all duration-200 relative ${
                                  isSelected
                                    ? "bg-teal-600 shadow-inner"
                                    : "bg-gray-200 hover:bg-gray-300"
                                } ${isLocked ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                              >
                                <div className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-200 ${
                                  isSelected ? "left-7" : "left-1"
                                }`} />
                              </button>
                            )}
                            {opt.isIncluded && (
                              <div className="flex-shrink-0 w-14 h-8 rounded-full bg-green-100 flex items-center justify-center">
                                <Check className="h-4 w-4 text-green-600" />
                              </div>
                            )}
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
    onSuccess: () => {
      utils.portal.getSubmission.invalidate();
      utils.portal.getAdminResponse.invalidate();
      setShowSignoff(false);
      toast.success("Selections submitted and signed off!");
    },
    onError: (e) => toast.error(e.message),
  });
  const [notes, setNotes] = useState("");
  const [showSignoff, setShowSignoff] = useState(false);
  const [signoffName, setSignoffName] = useState("");
  const [signoffSignature, setSignoffSignature] = useState<string | null>(null);

  const hasSubmitted = !!existing;
  const hasAdminResponse = adminResponse?.adminResponsePrice;
  const canSubmit = signoffName.trim().length > 0 && signoffSignature;

  const [signoffStep, setSignoffStep] = useState<1 | 2 | 3>(1);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const handleSubmit = () => {
    if (!canSubmit || !termsAccepted) return;
    submitMut.mutate({
      token,
      totalUpgradeCost: upgradeTotal.toFixed(2),
      notes: notes || undefined,
      signoffName: signoffName.trim(),
      signoffSignature: signoffSignature!,
      userAgent: navigator.userAgent,
    });
  };

  const handleStartSignoff = () => {
    setShowSignoff(true);
    setSignoffStep(1);
    setTermsAccepted(false);
    setSignoffName("");
    setSignoffSignature(null);
  };

  return (
    <section className="py-12 md:py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-[#203E4A] flex items-center justify-center">
            <Send className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="font-['Playfair_Display_SC'] text-xl md:text-2xl text-[#203E4A] tracking-wider">
              {hasSubmitted ? "Submission Status" : "Review & Sign Off"}
            </h2>
            <p className="text-xs text-[#6D7E94] font-['Lato'] mt-0.5">
              {hasSubmitted ? "Your selections are being reviewed by the B Modern team" : "Review your selections, sign off, and submit for a confirmed price"}
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
                {existing?.signoffName && (
                  <div className="mt-4 p-4 bg-white rounded-xl shadow-sm border border-green-200">
                    <p className="text-[10px] uppercase tracking-[0.12em] text-green-700 font-['Lato'] font-semibold mb-2">Signed Off By</p>
                    <div className="flex items-end gap-4">
                      <div>
                        <p className="text-sm font-semibold text-[#203E4A] font-['Lato']">{existing.signoffName}</p>
                        <p className="text-xs text-[#6D7E94] font-['Lato']">{fmtDate(existing.signedOffAt)}</p>
                      </div>
                      {existing.signoffSignature && (
                        <img src={existing.signoffSignature} alt="Client signature" className="h-12 object-contain" />
                      )}
                    </div>
                  </div>
                )}
                <p className="text-[11px] text-[#6D7E94] font-['Lato'] mt-4">Responded on {fmtDate(adminResponse.adminRespondedAt)}</p>
                <Button variant="outline" onClick={() => window.open(`/api/pdf/selections/${token}`, '_blank')}
                  className="mt-4 font-['Lato'] h-10 text-sm tracking-wide border-[#203E4A]/20 text-[#203E4A] hover:bg-[#203E4A]/5">
                  <Download className="mr-2 h-4 w-4" /> Download Selections Summary (PDF)
                </Button>
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
                  Your selections have been submitted and signed off. The B Modern team will review and respond with a confirmed price.
                </p>
                <div className="flex justify-center gap-8 text-sm mb-4">
                  <div><p className="text-[10px] uppercase tracking-[0.15em] text-[#6D7E94] font-['Lato'] font-semibold">Submitted</p><p className="font-bold text-[#203E4A] font-['Lato'] mt-0.5">{fmtDate(existing.submittedAt)}</p></div>
                  <div><p className="text-[10px] uppercase tracking-[0.15em] text-[#6D7E94] font-['Lato'] font-semibold">Upgrade Total</p><p className="font-bold text-amber-700 font-['Lato'] mt-0.5">+{fmt(existing.totalUpgradeCost)}</p></div>
                </div>
                {existing?.signoffName && (
                  <div className="inline-flex items-center gap-2 bg-white rounded-lg px-4 py-2 shadow-sm border border-amber-200 mb-4">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-xs font-['Lato'] text-[#203E4A]">Signed by <strong>{existing.signoffName}</strong></span>
                  </div>
                )}
                <div>
                  <Button variant="outline" onClick={() => window.open(`/api/pdf/selections/${token}`, '_blank')}
                    className="font-['Lato'] h-10 text-sm tracking-wide border-[#203E4A]/20 text-[#203E4A] hover:bg-[#203E4A]/5">
                    <Download className="mr-2 h-4 w-4" /> Download Selections Summary (PDF)
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Submit form with sign-off */}
          {!hasSubmitted && !showSignoff && (
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
                <Button onClick={handleStartSignoff}
                  className="w-full bg-[#203E4A] hover:bg-[#2a5060] text-white font-['Lato'] h-12 text-sm tracking-wide shadow-lg">
                  <ScrollText className="mr-2 h-4 w-4" />
                  Proceed to Sign Tender
                </Button>
                <p className="text-[11px] text-[#6D7E94] font-['Lato'] text-center mt-3">
                  You will be guided through a 3-step sign-off process to finalise your selections.
                </p>
                <Button variant="outline" onClick={() => window.open(`/api/pdf/selections/${token}`, '_blank')}
                  className="w-full mt-3 font-['Lato'] h-10 text-sm tracking-wide border-[#203E4A]/20 text-[#203E4A] hover:bg-[#203E4A]/5">
                  <Download className="mr-2 h-4 w-4" /> Preview Selections Summary (PDF)
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Multi-step Sign Tender Flow */}
          {!hasSubmitted && showSignoff && (
            <Card className="shadow-xl border-[#203E4A]/15 overflow-hidden">
              {/* Step Progress Bar */}
              <div className="bg-[#203E4A] px-6 py-4">
                <div className="flex items-center justify-between max-w-md mx-auto">
                  {["Review", "Terms", "Sign"].map((label, i) => {
                    const stepNum = (i + 1) as 1 | 2 | 3;
                    const isActive = signoffStep === stepNum;
                    const isDone = signoffStep > stepNum;
                    return (
                      <div key={label} className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold font-['Lato'] transition-all ${
                          isDone ? "bg-green-500 text-white" : isActive ? "bg-white text-[#203E4A]" : "bg-white/20 text-white/60"
                        }`}>
                          {isDone ? <Check className="h-4 w-4" /> : stepNum}
                        </div>
                        <span className={`text-xs font-['Lato'] font-semibold tracking-wide hidden sm:inline ${
                          isActive ? "text-white" : isDone ? "text-green-300" : "text-white/40"
                        }`}>{label}</span>
                        {i < 2 && <div className={`w-12 sm:w-20 h-0.5 mx-2 ${isDone ? "bg-green-400" : "bg-white/15"}`} />}
                      </div>
                    );
                  })}
                </div>
              </div>

              <CardContent className="p-6 sm:p-8">
                {/* STEP 1: Review Selections */}
                {signoffStep === 1 && (
                  <div>
                    <div className="flex items-center gap-2 mb-6">
                      <FileText className="h-5 w-5 text-[#203E4A]" />
                      <h3 className="font-['Playfair_Display_SC'] text-lg text-[#203E4A] tracking-wider">Review Your Selections</h3>
                    </div>
                    <p className="text-sm text-[#6D7E94] font-['Lato'] mb-6 leading-relaxed">
                      Please review the summary of your upgrade selections below. Once you are satisfied, proceed to accept the terms and conditions.
                    </p>
                    <div className="bg-gray-50 rounded-xl p-5 mb-6">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                        <div className="bg-white rounded-lg p-4 shadow-sm">
                          <p className="text-[10px] uppercase tracking-[0.2em] text-[#6D7E94] font-['Lato'] font-semibold mb-1">Base Contract</p>
                          <p className="text-xl font-bold text-[#203E4A] font-['Lato']">{fmt(basePrice)}</p>
                        </div>
                        <div className="bg-white rounded-lg p-4 shadow-sm">
                          <p className="text-[10px] uppercase tracking-[0.2em] text-[#6D7E94] font-['Lato'] font-semibold mb-1">Selected Upgrades</p>
                          <p className="text-xl font-bold text-amber-700 font-['Lato']">{upgradeTotal > 0 ? `+${fmt(upgradeTotal)}` : fmt(0)}</p>
                        </div>
                        <div className="bg-white rounded-lg p-4 shadow-sm border-2 border-[#203E4A]/20">
                          <p className="text-[10px] uppercase tracking-[0.2em] text-[#6D7E94] font-['Lato'] font-semibold mb-1">Estimated Total</p>
                          <p className="text-xl font-bold text-[#203E4A] font-['Lato']">{fmt(basePrice + upgradeTotal)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="mb-5">
                      <label className="text-xs font-medium text-[#203E4A] font-['Lato'] mb-1.5 block">Additional Notes (optional)</label>
                      <Textarea placeholder="Any comments or questions about your selections..." value={notes} onChange={e => setNotes(e.target.value)}
                        className="font-['Lato'] text-sm" rows={3} />
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
                      <p className="text-xs text-blue-800 font-['Lato']">
                        <AlertCircle className="h-3.5 w-3.5 inline mr-1.5 -mt-0.5" />
                        You can download a detailed PDF of your selections for your records before proceeding.
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <Button variant="outline" onClick={() => window.open(`/api/pdf/selections/${token}`, '_blank')}
                        className="font-['Lato'] h-11 text-sm tracking-wide border-[#203E4A]/20 text-[#203E4A] hover:bg-[#203E4A]/5">
                        <Download className="mr-2 h-4 w-4" /> Download PDF
                      </Button>
                      <Button onClick={() => setSignoffStep(2)}
                        className="flex-1 bg-[#203E4A] hover:bg-[#2a5060] text-white font-['Lato'] h-11 text-sm tracking-wide shadow-lg">
                        Continue to Terms
                        <ChevronDown className="ml-2 h-4 w-4 rotate-[-90deg]" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* STEP 2: Accept Terms */}
                {signoffStep === 2 && (
                  <div>
                    <div className="flex items-center gap-2 mb-6">
                      <Shield className="h-5 w-5 text-[#203E4A]" />
                      <h3 className="font-['Playfair_Display_SC'] text-lg text-[#203E4A] tracking-wider">Terms & Conditions</h3>
                    </div>
                    <div className="bg-[#203E4A]/[0.03] border border-[#203E4A]/10 rounded-xl p-6 mb-6 max-h-[400px] overflow-y-auto">
                      <h4 className="text-sm font-bold text-[#203E4A] font-['Lato'] mb-3">Upgrade Selection Agreement</h4>
                      <div className="text-sm text-[#203E4A]/80 font-['Lato'] leading-relaxed space-y-3">
                        <p><strong>1. Selection Confirmation</strong><br />
                        By signing this tender, I confirm that I have carefully reviewed all upgrade selections and optional extras detailed in this document. I understand that these selections represent my preferred specifications for the project.</p>
                        <p><strong>2. Pricing</strong><br />
                        I acknowledge that all prices shown are estimates based on current rates and specifications. The final contract price will be confirmed by B Modern Homes following their review of my selections. Prices may vary based on availability, market conditions, and final engineering requirements.</p>
                        <p><strong>3. Scope of Upgrades</strong><br />
                        Upgrades and optional extras are additions to the base contract inclusions. The base contract inclusions remain as specified in the original building agreement unless explicitly modified by an upgrade selection in this document.</p>
                        <p><strong>4. Modifications After Signing</strong><br />
                        I understand that once this tender is signed and submitted, any changes to my selections will require a new submission and may be subject to revised pricing. B Modern Homes reserves the right to adjust pricing for any modifications requested after signing.</p>
                        <p><strong>5. Product Availability</strong><br />
                        Selected products and finishes are subject to availability at the time of procurement. In the event that a selected item becomes unavailable, B Modern Homes will offer a suitable alternative of equal or greater value for my approval.</p>
                        <p><strong>6. Construction Timeline</strong><br />
                        I acknowledge that certain upgrade selections may affect the construction timeline. B Modern Homes will advise of any timeline implications during their review process.</p>
                        <p><strong>7. Digital Signature</strong><br />
                        I agree that my digital signature on this document is legally binding and equivalent to a handwritten signature for the purposes of this upgrade selection agreement.</p>
                      </div>
                    </div>
                    <label className="flex items-start gap-3 p-4 bg-white rounded-xl border-2 border-[#203E4A]/10 cursor-pointer hover:border-[#203E4A]/30 transition-colors mb-6">
                      <input type="checkbox" checked={termsAccepted} onChange={e => setTermsAccepted(e.target.checked)}
                        className="mt-0.5 h-5 w-5 rounded border-[#203E4A]/30 text-[#203E4A] focus:ring-[#203E4A] cursor-pointer" />
                      <span className="text-sm text-[#203E4A] font-['Lato'] leading-relaxed">
                        I have read and agree to the terms and conditions above. I confirm that I am authorised to sign this upgrade selection tender on behalf of the contracting party.
                      </span>
                    </label>
                    <div className="flex gap-3">
                      <Button variant="outline" onClick={() => setSignoffStep(1)}
                        className="font-['Lato'] h-11 text-sm tracking-wide border-[#203E4A]/20 text-[#203E4A] hover:bg-[#203E4A]/5">
                        <X className="mr-2 h-4 w-4" /> Back
                      </Button>
                      <Button onClick={() => setSignoffStep(3)} disabled={!termsAccepted}
                        className="flex-1 bg-[#203E4A] hover:bg-[#2a5060] text-white font-['Lato'] h-11 text-sm tracking-wide shadow-lg disabled:opacity-50">
                        Continue to Signature
                        <ChevronDown className="ml-2 h-4 w-4 rotate-[-90deg]" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* STEP 3: Draw Signature & Submit */}
                {signoffStep === 3 && (
                  <div>
                    <div className="flex items-center gap-2 mb-6">
                      <ScrollText className="h-5 w-5 text-[#203E4A]" />
                      <h3 className="font-['Playfair_Display_SC'] text-lg text-[#203E4A] tracking-wider">Sign Your Tender</h3>
                    </div>
                    <p className="text-sm text-[#6D7E94] font-['Lato'] mb-6 leading-relaxed">
                      Please enter your full legal name and draw your signature below to complete the sign-off process.
                    </p>

                    {/* Full Name */}
                    <div className="mb-5">
                      <label className="text-xs font-medium text-[#203E4A] font-['Lato'] mb-1.5 block">
                        Full Legal Name <span className="text-red-500">*</span>
                      </label>
                      <Input
                        placeholder="Enter your full legal name as it appears on the contract"
                        value={signoffName}
                        onChange={e => setSignoffName(e.target.value)}
                        className="font-['Lato'] text-sm h-12 text-base"
                      />
                    </div>

                    {/* Signature Pad */}
                    <div className="mb-5">
                      <label className="text-xs font-medium text-[#203E4A] font-['Lato'] mb-1.5 block">
                        Draw Your Signature <span className="text-red-500">*</span>
                      </label>
                      <SignaturePad onSignatureChange={setSignoffSignature} />
                    </div>

                    {/* Date & Timestamp */}
                    <div className="flex items-center justify-between mb-6 px-1">
                      <div className="text-xs text-[#6D7E94] font-['Lato']">
                        <span className="font-semibold">Date:</span> {new Date().toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })}
                      </div>
                      <div className="text-xs text-[#6D7E94] font-['Lato']">
                        <span className="font-semibold">Time:</span> {new Date().toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>

                    {/* Security Notice */}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-6">
                      <p className="text-xs text-green-800 font-['Lato']">
                        <Lock className="h-3.5 w-3.5 inline mr-1.5 -mt-0.5" />
                        Your signature is securely recorded with a timestamp, IP address, and unique document reference for audit purposes.
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <Button variant="outline" onClick={() => setSignoffStep(2)}
                        className="font-['Lato'] h-12 text-sm tracking-wide border-[#203E4A]/20 text-[#203E4A] hover:bg-[#203E4A]/5">
                        <X className="mr-2 h-4 w-4" /> Back
                      </Button>
                      <Button onClick={handleSubmit}
                        disabled={!canSubmit || !termsAccepted || submitMut.isPending}
                        className="flex-[2] bg-[#203E4A] hover:bg-[#2a5060] text-white font-['Lato'] h-12 text-sm tracking-wide shadow-lg disabled:opacity-50">
                        {submitMut.isPending ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                        Sign & Submit Tender
                      </Button>
                    </div>
                    {!canSubmit && (
                      <p className="text-[11px] text-amber-600 font-['Lato'] text-center mt-3">
                        Please enter your full legal name and draw your signature to complete.
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </section>
  );
}

// ─── Sticky Running Total Bar ────────────────────────────────────────────────
function StickyTotalBar({ basePrice, upgradeTotal, isLocked, minPrice, maxPrice, hasSelections }: { basePrice: number; upgradeTotal: number; isLocked: boolean; minPrice?: number; maxPrice?: number; hasSelections?: boolean }) {
  const showRange = minPrice != null && maxPrice != null && maxPrice > minPrice && !hasSelections;
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-r from-[#203E4A] via-[#1a3540] to-[#203E4A] text-white shadow-2xl">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
        {showRange ? (
          <>
            <div className="font-['Lato']">
              <p className="text-white/40 text-[9px] sm:text-[10px] uppercase tracking-[0.2em] font-semibold">Estimated Range</p>
              <p className="font-bold text-sm sm:text-base">{fmt(minPrice)} <span className="text-white/40 mx-0.5">&ndash;</span> {fmt(maxPrice)}</p>
            </div>
            <div className="text-right">
              <p className="text-amber-300/80 text-[9px] sm:text-[10px] uppercase tracking-[0.2em] font-['Lato'] font-semibold">Select upgrades to refine</p>
              <p className="text-xs sm:text-sm text-white/50 font-['Lato']">Your final price depends on your selections</p>
            </div>
          </>
        ) : (
          <>
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
          </>
        )}
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
  const isPreview = new URLSearchParams(window.location.search).get("preview") === "1";

  const { data: project, isLoading, error } = trpc.portal.getProject.useQuery({ token }, { enabled: !!token });
  const { data: tcStatus } = trpc.portal.hasAcknowledgedTerms.useQuery({ token }, { enabled: !!token && !!project });

  const [tcAccepted, setTcAccepted] = useState(false);
  const [upgradeTotal, setUpgradeTotal] = useState(0);
  const [plusTotal, setPlusTotal] = useState(0);
  const combinedUpgradeTotal = upgradeTotal + plusTotal;
  const [activeTab, setActiveTab] = useState<PortalTab>("dashboard");

  // Fetch pricing data for range display
  const { data: priceData } = trpc.portal.getPackagePrices.useQuery({ token }, { enabled: !!token && !!project });
  const { data: mySelections } = trpc.portal.getItemSelections.useQuery({ token }, { enabled: !!token && !!project });
  const hasSelections = (mySelections?.length ?? 0) > 0;

  useEffect(() => {
    if (tcStatus?.acknowledged) setTcAccepted(true);
  }, [tcStatus]);

  if (!token) return <ErrorPage message="No access token provided." />;
  if (isLoading) return <PortalLoader />;
  if (error) return <ErrorPage message={error.message} />;
  if (!project) return <ErrorPage message="Project not found." />;

  // T&C gate — skip in preview mode
  if (!isPreview && !tcAccepted) return <TermsGate token={token} onAccepted={() => setTcAccepted(true)} />;

  const basePrice = parseFloat(project.baseContractPrice || "0");
  const isLocked = !!project.portalLockedAt;
  const projectId = project.id;

  // Render the selections (tender presentation) content
  const selectionsContent = (
    <div className="min-h-screen bg-[#f8f6f1] pb-28">
      {/* Admin Preview Banner */}
      {isPreview && (
        <div className="sticky top-0 z-[100] bg-gradient-to-r from-[#203E4A] via-[#2a5060] to-[#203E4A] text-white py-2.5 px-4 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1">
              <Eye className="h-3.5 w-3.5" />
              <span className="text-xs font-['Lato'] font-semibold tracking-wider uppercase">Admin Preview</span>
            </div>
            <span className="text-xs font-['Lato'] text-white/70">This is how the client will see the portal. Selections made here are not saved.</span>
          </div>
          <button onClick={() => window.close()} className="flex items-center gap-1.5 text-xs font-['Lato'] bg-white/15 hover:bg-white/25 rounded-full px-3 py-1 transition-colors">
            <X className="h-3.5 w-3.5" /> Close Preview
          </button>
        </div>
      )}
      <HeroSection project={project} minPrice={priceData?.tier1Total} maxPrice={priceData?.tier3Total} hasSelections={hasSelections} />
      {project.status === "draft" && (
        <div className="bg-amber-50 border-b border-amber-200 text-center py-2.5 text-xs text-amber-800 font-['Lato'] font-medium">
          <AlertCircle className="inline h-3.5 w-3.5 mr-1.5" /> This proposal is in draft and may change before presentation.
        </div>
      )}
      <ProjectTimeline token={token} />
      <BaseInclusionsSection token={token} />
      <PcItemsSection token={token} />
      <ProvisionalSumsSection token={token} />
      <ExclusionsSection token={token} />
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#203E4A]/15 to-transparent" />
          <Sparkles className="h-4 w-4 text-[#6D7E94]/30" />
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#203E4A]/15 to-transparent" />
        </div>
      </div>
      <UpgradeSelectionsSection token={token} project={project} onTotalChange={setUpgradeTotal} />
      <PlusOptionsSection token={token} project={project} onTotalChange={setPlusTotal} />
      <CustomItemRequestSection token={token} />
      <FileUploadSection token={token} />
      <SubmitSection token={token} upgradeTotal={combinedUpgradeTotal} basePrice={basePrice} />
      <div className="bg-gradient-to-br from-[#203E4A] via-[#1a3540] to-[#162d36] mt-12 py-10 text-center mb-20">
        <img src={LOGO_WHITE} alt="B Modern Homes" className="h-7 mx-auto mb-4" />
        <p className="text-white/30 text-xs font-['Lato'] tracking-[0.2em] uppercase">Building Modern Homes for Modern Living</p>
      </div>
      <StickyTotalBar basePrice={basePrice} upgradeTotal={combinedUpgradeTotal} isLocked={isLocked} minPrice={priceData?.tier1Total} maxPrice={priceData?.tier3Total} hasSelections={hasSelections} />
    </div>
  );

  return (
    <PortalLayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      projectName={project.projectAddress || `Project #${project.proposalNumber}`}
      clientName={project.clientName}
    >
      {activeTab === "dashboard" && <PortalDashboard projectId={projectId} onNavigate={setActiveTab} />}
      {activeTab === "selections" && selectionsContent}
      {activeTab === "site-updates" && <PortalSiteUpdates projectId={projectId} />}
      {activeTab === "approvals" && <PortalApprovals projectId={projectId} />}
      {activeTab === "variations" && <PortalVariations projectId={projectId} />}
      {activeTab === "documents" && <PortalDocuments projectId={projectId} />}
      {activeTab === "messages" && <PortalMessages projectId={projectId} />}
      {activeTab === "minutes" && <PortalMeetingMinutes projectId={projectId} />}
    </PortalLayout>
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
