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
  Clock, FileText, Plus, Eye, EyeOff, Send
} from "lucide-react";

// ─── Portal Header ─────────────────────────────────────────────────────────────
function PortalHeader({ project }: { project: any }) {
  return (
    <header className="sticky top-0 z-30 border-b bg-white/95 backdrop-blur-sm" style={{ borderColor: "var(--border)" }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-xs tracking-[0.3em] uppercase" style={{ color: "var(--bm-petrol)", fontFamily: "Lato, sans-serif", fontWeight: 700 }}>
            B Modern Homes
          </div>
          <div className="w-px h-4 bg-border" />
          <div className="text-xs text-muted-foreground" style={{ fontFamily: "Lato, sans-serif" }}>
            Tender Portal
          </div>
        </div>
        <div className="text-xs text-muted-foreground" style={{ fontFamily: "Lato, sans-serif" }}>
          #{project.proposalNumber}
        </div>
      </div>
    </header>
  );
}

// ─── Hero Section ──────────────────────────────────────────────────────────────
function HeroSection({ project }: { project: any }) {
  return (
    <section className="relative">
      {project.heroImageUrl ? (
        <div className="relative h-64 sm:h-96 overflow-hidden">
          <img src={project.heroImageUrl} alt={project.projectAddress} className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(32,62,74,0.3) 0%, rgba(32,62,74,0.75) 100%)" }} />
          <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-10">
            <div className="max-w-5xl mx-auto w-full">
              <div className="text-white/70 text-xs tracking-[0.25em] uppercase mb-2" style={{ fontFamily: "Lato, sans-serif" }}>
                {project.projectType || "Residential"} &bull; {project.buildType || "New Build"}
              </div>
              <h1 className="text-white text-2xl sm:text-4xl mb-1" style={{ fontFamily: "'Playfair Display SC', Georgia, serif", fontWeight: 400 }}>
                {project.clientName}
              </h1>
              <p className="text-white/80 text-sm" style={{ fontFamily: "Lato, sans-serif" }}>
                {project.projectAddress}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="h-40 flex flex-col justify-end p-6">
          <div className="max-w-5xl mx-auto w-full">
            <div className="text-muted-foreground text-xs tracking-[0.25em] uppercase mb-2" style={{ fontFamily: "Lato, sans-serif" }}>
              {project.projectType || "Residential"} &bull; {project.buildType || "New Build"}
            </div>
            <h1 className="text-2xl sm:text-3xl mb-1" style={{ fontFamily: "'Playfair Display SC', Georgia, serif", color: "var(--bm-petrol)", fontWeight: 400 }}>
              {project.clientName}
            </h1>
            <p className="text-sm text-muted-foreground" style={{ fontFamily: "Lato, sans-serif" }}>
              {project.projectAddress}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

// ─── Proposal Summary ──────────────────────────────────────────────────────────
function ProposalSummary({ project, upgradeTotal }: { project: any; upgradeTotal: number }) {
  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white border rounded p-5" style={{ borderColor: "var(--border)" }}>
          <div className="text-xs tracking-wider uppercase mb-2" style={{ color: "var(--bm-bluegum)", fontFamily: "Lato, sans-serif" }}>Proposal</div>
          <div className="text-sm font-medium" style={{ fontFamily: "Lato, sans-serif" }}>#{project.proposalNumber}</div>
        </div>
        <div className="bg-white border rounded p-5" style={{ borderColor: "var(--border)" }}>
          <div className="text-xs tracking-wider uppercase mb-2" style={{ color: "var(--bm-bluegum)", fontFamily: "Lato, sans-serif" }}>Base Contract</div>
          <div className="text-xl font-light" style={{ fontFamily: "'Playfair Display SC', Georgia, serif", color: "var(--bm-petrol)" }}>
            ${Number(project.baseContractPrice || 0).toLocaleString("en-AU")}
          </div>
        </div>
        {upgradeTotal > 0 && (
          <div className="bg-white border-2 rounded p-5 col-span-2 sm:col-span-1" style={{ borderColor: "var(--bm-petrol)" }}>
            <div className="text-xs tracking-wider uppercase mb-2" style={{ color: "var(--bm-bluegum)", fontFamily: "Lato, sans-serif" }}>Selected Upgrades</div>
            <div className="text-xl font-light" style={{ fontFamily: "'Playfair Display SC', Georgia, serif", color: "var(--bm-petrol)" }}>
              +${upgradeTotal.toLocaleString("en-AU")}
            </div>
          </div>
        )}
        {project.tenderExpiryDate && (
          <div className="bg-amber-50 border border-amber-200 rounded p-5 col-span-2 sm:col-span-1">
            <div className="flex items-center gap-1.5 text-xs tracking-wider uppercase mb-2 text-amber-700" style={{ fontFamily: "Lato, sans-serif" }}>
              <Clock size={12} /> Tender Expiry
            </div>
            <div className="text-sm font-medium text-amber-800" style={{ fontFamily: "Lato, sans-serif" }}>
              {new Date(project.tenderExpiryDate).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Inclusions Section ────────────────────────────────────────────────────────
function InclusionsSection({ token }: { token: string }) {
  const { data: sections } = trpc.portal.getInclusions.useQuery({ token });
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  if (!sections?.length) return null;

  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 py-8 border-t" style={{ borderColor: "var(--border)" }}>
      <div className="mb-6">
        <div className="text-xs tracking-[0.25em] uppercase mb-2" style={{ color: "var(--bm-bluegum)", fontFamily: "Lato, sans-serif" }}>What's Included</div>
        <h2 className="text-2xl" style={{ fontFamily: "'Playfair Display SC', Georgia, serif", color: "var(--bm-petrol)", fontWeight: 400 }}>
          Base Inclusions
        </h2>
        <div className="w-12 h-px mt-3" style={{ background: "var(--bm-petrol)" }} />
      </div>
      <div className="space-y-2">
        {sections.map((section) => {
          const isOpen = expanded.has(section.id);
          return (
            <div key={section.id} className="bg-white border rounded overflow-hidden" style={{ borderColor: "var(--border)" }}>
              <button
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-secondary/50 transition-colors"
                onClick={() => {
                  const next = new Set(expanded);
                  isOpen ? next.delete(section.id) : next.add(section.id);
                  setExpanded(next);
                }}
              >
                <span className="font-medium text-sm" style={{ fontFamily: "Lato, sans-serif", color: "var(--bm-petrol)" }}>{section.title}</span>
                {isOpen ? <ChevronUp size={16} className="text-muted-foreground shrink-0" /> : <ChevronDown size={16} className="text-muted-foreground shrink-0" />}
              </button>
              {isOpen && (
                <div className="px-5 pb-5 border-t" style={{ borderColor: "var(--border)" }}>
                  {section.imageUrl && (
                    <img src={section.imageUrl} alt={section.title} className="w-full h-48 object-cover rounded mt-4 mb-4" />
                  )}
                  {section.description && (
                    <p className="text-sm text-muted-foreground leading-relaxed mt-4" style={{ fontFamily: "Lato, sans-serif" }}>
                      {section.description}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
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

  const [selections, setSelections] = useState<Record<number, number>>({}); // groupId -> optionId
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

  const toggleImage = (optId: number) => {
    setRevealedImages((prev) => {
      const next = new Set(prev);
      next.has(optId) ? next.delete(optId) : next.add(optId);
      return next;
    });
  };

  if (!groups?.length) return null;

  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 py-8 border-t" style={{ borderColor: "var(--border)" }}>
      <div className="mb-6">
        <div className="text-xs tracking-[0.25em] uppercase mb-2" style={{ color: "var(--bm-bluegum)", fontFamily: "Lato, sans-serif" }}>Personalise Your Home</div>
        <h2 className="text-2xl" style={{ fontFamily: "'Playfair Display SC', Georgia, serif", color: "var(--bm-petrol)", fontWeight: 400 }}>
          Upgrade Options
        </h2>
        <div className="w-12 h-px mt-3" style={{ background: "var(--bm-petrol)" }} />
        {isLocked && (
          <div className="mt-3 flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2 w-fit">
            <AlertCircle size={14} />
            <span style={{ fontFamily: "Lato, sans-serif" }}>Upgrade selections are locked for this project.</span>
          </div>
        )}
      </div>

      <div className="space-y-8">
        {groups.map((group: any) => {
          const groupOptions = options?.filter((o: any) => o.groupId === group.id) || [];
          const selectedId = selections[group.id];
          return (
            <div key={group.id}>
              <h3 className="text-sm tracking-wider uppercase mb-3" style={{ color: "var(--bm-petrol)", fontFamily: "Lato, sans-serif", fontWeight: 700 }}>
                {group.category}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {groupOptions.map((opt: any) => {
                  const isSelected = selectedId === opt.id;
                  const showImg = revealedImages.has(opt.id);
                  return (
                    <div
                      key={opt.id}
                      className={`bg-white border rounded overflow-hidden cursor-pointer transition-all ${isSelected ? "border-2 shadow-sm" : "hover:border-[var(--bm-bluegum)]"}`}
                      style={{ borderColor: isSelected ? "var(--bm-petrol)" : "var(--border)" }}
                      onClick={() => selectOption(group.id, opt.id)}
                    >
                      {opt.imageUrl && (
                        <div className="relative">
                          {showImg ? (
                            <img src={opt.imageUrl} alt={opt.optionName} className="w-full h-36 object-cover" />
                          ) : (
                            <div className="w-full h-36 bg-secondary flex items-center justify-center">
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); toggleImage(opt.id); }}
                                className="flex flex-col items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
                              >
                                <Eye size={20} />
                                <span className="text-xs" style={{ fontFamily: "Lato, sans-serif" }}>View Image</span>
                              </button>
                            </div>
                          )}
                          {showImg && (
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); toggleImage(opt.id); }}
                              className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70"
                            >
                              <EyeOff size={12} />
                            </button>
                          )}
                        </div>
                      )}
                      <div className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="text-sm font-medium" style={{ fontFamily: "Lato, sans-serif" }}>{opt.optionName}</span>
                              {opt.isIncluded && (
                                <span className="text-xs px-1.5 py-0.5 rounded bg-green-50 text-green-700" style={{ fontFamily: "Lato, sans-serif" }}>Included</span>
                              )}
                            </div>
                            {opt.description && (
                              <p className="text-xs text-muted-foreground" style={{ fontFamily: "Lato, sans-serif" }}>{opt.description}</p>
                            )}
                          </div>
                          <div className="shrink-0 flex flex-col items-end gap-1">
                            {!opt.isIncluded && Number(opt.priceDelta) > 0 && (
                              <span className="text-xs font-medium" style={{ color: "var(--bm-petrol)", fontFamily: "Lato, sans-serif" }}>
                                +${Number(opt.priceDelta).toLocaleString("en-AU")}
                              </span>
                            )}
                            <div
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all`}
                              style={{ borderColor: isSelected ? "var(--bm-petrol)" : "oklch(75% 0.008 60)", background: isSelected ? "var(--bm-petrol)" : "transparent" }}
                            >
                              {isSelected && <Check size={11} className="text-white" />}
                            </div>
                          </div>
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
    </section>
  );
}

// ─── Submit Upgrades ───────────────────────────────────────────────────────────
function SubmitUpgradesSection({
  token,
  upgradeTotal,
  isLocked,
}: {
  token: string;
  upgradeTotal: number;
  isLocked: boolean;
}) {
  const { data: existing } = trpc.portal.getSubmission.useQuery({ token });
  const submitMutation = trpc.portal.submitSelections.useMutation({
    onSuccess: () => toast.success("Your selections have been submitted. We will be in touch shortly."),
    onError: (e) => toast.error(e.message),
  });

  if (isLocked) return null;
  if (existing) {
    return (
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
        <div className="bg-green-50 border border-green-200 rounded p-4 flex items-center gap-3">
          <Check size={16} className="text-green-600 shrink-0" />
          <div>
            <p className="text-sm font-medium text-green-800" style={{ fontFamily: "Lato, sans-serif" }}>
              Selections submitted on {new Date(existing.submittedAt).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })}
            </p>
            {Number(existing.totalUpgradeCost) > 0 && (
              <p className="text-xs text-green-700" style={{ fontFamily: "Lato, sans-serif" }}>
                Total upgrade cost: ${Number(existing.totalUpgradeCost).toLocaleString("en-AU")}
              </p>
            )}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
      <div className="bg-white border-2 rounded p-6" style={{ borderColor: "var(--bm-petrol)" }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base mb-1" style={{ fontFamily: "'Playfair Display SC', Georgia, serif", color: "var(--bm-petrol)" }}>
              Submit Your Selections
            </h3>
            {upgradeTotal > 0 && (
              <p className="text-sm text-muted-foreground" style={{ fontFamily: "Lato, sans-serif" }}>
                Total upgrade cost: <strong style={{ color: "var(--bm-petrol)" }}>${upgradeTotal.toLocaleString("en-AU")}</strong>
              </p>
            )}
          </div>
          <Button
            onClick={() => submitMutation.mutate({ token, totalUpgradeCost: upgradeTotal.toString() })}
            disabled={submitMutation.isPending}
            className="gap-2 text-xs tracking-wider uppercase shrink-0"
            style={{ background: "var(--bm-petrol)", fontFamily: "Lato, sans-serif" }}
          >
            <Send size={14} />
            {submitMutation.isPending ? "Submitting..." : "Submit Selections"}
          </Button>
        </div>
      </div>
    </section>
  );
}

// ─── File Upload Section ───────────────────────────────────────────────────────
function FileUploadSection({ token }: { token: string }) {
  const utils = trpc.useUtils();
  const { data: files } = trpc.portal.getMyFiles.useQuery({ token });
  const uploadMutation = trpc.portal.uploadFile.useMutation({
    onSuccess: () => { utils.portal.getMyFiles.invalidate(); toast.success("File uploaded successfully"); },
    onError: (e) => toast.error(e.message),
  });

  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList?.length) return;
    setUploading(true);
    for (const file of Array.from(fileList)) {
      if (file.size > 20 * 1024 * 1024) { toast.error(`${file.name} is too large (max 20MB)`); continue; }
      const reader = new FileReader();
      await new Promise<void>((resolve) => {
        reader.onload = async (ev: ProgressEvent<FileReader>) => {
          try {
            const base64 = (ev.target?.result as string).split(",")[1];
            await uploadMutation.mutateAsync({ token, fileName: file.name, mimeType: file.type, fileData: base64, fileSizeBytes: file.size });
          } catch {}
          resolve();
        };
        reader.readAsDataURL(file);
      });
    }
    setUploading(false);
  };

  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 py-8 border-t" style={{ borderColor: "var(--border)" }}>
      <div className="mb-6">
        <div className="text-xs tracking-[0.25em] uppercase mb-2" style={{ color: "var(--bm-bluegum)", fontFamily: "Lato, sans-serif" }}>Post Contract</div>
        <h2 className="text-2xl" style={{ fontFamily: "'Playfair Display SC', Georgia, serif", color: "var(--bm-petrol)", fontWeight: 400 }}>
          Plan Amendments
        </h2>
        <div className="w-12 h-px mt-3 mb-4" style={{ background: "var(--bm-petrol)" }} />
        <p className="text-sm text-muted-foreground" style={{ fontFamily: "Lato, sans-serif" }}>
          Upload any amended plans or documents here. B Modern will review and issue variations as required.
        </p>
      </div>

      <div
        className={`border-2 border-dashed rounded p-8 text-center transition-colors`}
        style={{ borderColor: dragging ? "var(--bm-petrol)" : "var(--border)", background: dragging ? "var(--bm-stone)" : "transparent" }}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
      >
        <Upload size={24} className="mx-auto mb-3 text-muted-foreground" />
        <p className="text-sm text-muted-foreground mb-3" style={{ fontFamily: "Lato, sans-serif" }}>
          {uploading ? "Uploading..." : "Drag and drop files here, or click to browse"}
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="text-xs tracking-wider uppercase"
          style={{ fontFamily: "Lato, sans-serif" }}
        >
          Browse Files
        </Button>
        <p className="text-xs text-muted-foreground mt-2" style={{ fontFamily: "Lato, sans-serif" }}>PDF, DWG, JPG, PNG up to 20MB</p>
        <input ref={fileRef} type="file" multiple className="hidden" accept=".pdf,.dwg,.jpg,.jpeg,.png,.webp" onChange={(e) => handleFiles(e.target.files)} />
      </div>

      {files && files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((f: any) => (
            <div key={f.id} className="flex items-center gap-3 bg-white border rounded px-4 py-2.5" style={{ borderColor: "var(--border)" }}>
              <FileText size={15} className="text-muted-foreground shrink-0" />
              <span className="text-sm flex-1 truncate" style={{ fontFamily: "Lato, sans-serif" }}>{f.fileName}</span>
              <span className="text-xs text-muted-foreground shrink-0" style={{ fontFamily: "Lato, sans-serif" }}>
                {new Date(f.uploadedAt).toLocaleDateString("en-AU")}
              </span>
              <a href={f.fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs hover:underline shrink-0" style={{ color: "var(--bm-petrol)", fontFamily: "Lato, sans-serif" }}>View</a>
            </div>
          ))}
        </div>
      )}
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
    "Structural Change", "Foundation / Slab", "External Finishes", "Roof Change",
    "Window / Door Change", "Floor Plan Modification", "Other Significant Change",
  ];

  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 py-8 border-t" style={{ borderColor: "var(--border)" }}>
      <div className="mb-6">
        <div className="text-xs tracking-[0.25em] uppercase mb-2" style={{ color: "var(--bm-bluegum)", fontFamily: "Lato, sans-serif" }}>Variations</div>
        <h2 className="text-2xl" style={{ fontFamily: "'Playfair Display SC', Georgia, serif", color: "var(--bm-petrol)", fontWeight: 400 }}>
          Change Requests
        </h2>
        <div className="w-12 h-px mt-3 mb-4" style={{ background: "var(--bm-petrol)" }} />
        <p className="text-sm text-muted-foreground" style={{ fontFamily: "Lato, sans-serif" }}>
          For significant structural changes that may affect the base contract price, submit a formal change request below.
        </p>
      </div>
      <Button
        onClick={() => setOpen(true)}
        variant="outline"
        className="gap-2 text-xs tracking-wider uppercase"
        style={{ borderColor: "var(--bm-petrol)", color: "var(--bm-petrol)", fontFamily: "Lato, sans-serif" }}
      >
        <Plus size={14} />
        Submit Change Request
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "'Playfair Display SC', Georgia, serif", color: "var(--bm-petrol)" }}>
              Change Request
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground" style={{ fontFamily: "Lato, sans-serif" }}>
              This request will be sent to the B Modern team for review. You will be contacted regarding any variation to the contract price.
            </p>
            <div className="space-y-1.5">
              <label className="text-xs tracking-wider uppercase" style={{ color: "var(--bm-petrol)", fontFamily: "Lato, sans-serif" }}>Category</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-9 text-sm" style={{ fontFamily: "Lato, sans-serif" }}>
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
              <label className="text-xs tracking-wider uppercase" style={{ color: "var(--bm-petrol)", fontFamily: "Lato, sans-serif" }}>Description</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the change you'd like to make..."
                rows={4}
                className="text-sm resize-none"
                style={{ fontFamily: "Lato, sans-serif" }}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => submitMutation.mutate({ token, category, description })}
                disabled={!category || !description || submitMutation.isPending}
                className="flex-1 text-xs tracking-wider uppercase gap-2"
                style={{ background: "var(--bm-petrol)", fontFamily: "Lato, sans-serif" }}
              >
                <Send size={13} />
                {submitMutation.isPending ? "Submitting..." : "Submit Request"}
              </Button>
              <Button variant="outline" onClick={() => setOpen(false)} className="text-xs" style={{ fontFamily: "Lato, sans-serif" }}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
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

  const handleSelectionChange = (total: number, selections: Record<number, number>) => {
    setUpgradeTotal(total);
    setUpgradeSelections(selections);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bm-cream)" }}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[var(--bm-petrol)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted-foreground" style={{ fontFamily: "Lato, sans-serif" }}>Loading your proposal...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bm-cream)" }}>
        <div className="text-center max-w-sm px-6">
          <div className="text-xs tracking-[0.3em] uppercase mb-6" style={{ color: "var(--bm-petrol)", fontFamily: "Lato, sans-serif" }}>B Modern Homes</div>
          <h1 className="text-xl mb-3" style={{ fontFamily: "'Playfair Display SC', Georgia, serif", color: "var(--bm-petrol)" }}>
            Access Unavailable
          </h1>
          <p className="text-sm text-muted-foreground" style={{ fontFamily: "Lato, sans-serif" }}>
            This link is invalid or has expired. Please contact your B Modern representative for assistance.
          </p>
        </div>
      </div>
    );
  }

  const isLocked = !!project.portalLockedAt;
  const isPostContract = project.status === "contract_signed" || project.status === "post_contract";

  return (
    <div className="min-h-screen" style={{ background: "var(--bm-cream)" }}>
      <PortalHeader project={project} />
      <HeroSection project={project} />
      <ProposalSummary project={project} upgradeTotal={upgradeTotal} />
      <InclusionsSection token={token} />
      <UpgradesSection token={token} isLocked={isLocked} onSelectionChange={handleSelectionChange} />
      <SubmitUpgradesSection token={token} upgradeTotal={upgradeTotal} isLocked={isLocked} />
      {isPostContract && (
        <>
          <FileUploadSection token={token} />
          <ChangeRequestSection token={token} />
        </>
      )}
      <footer className="border-t py-8 mt-8" style={{ borderColor: "var(--border)" }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <div className="text-xs tracking-[0.3em] uppercase mb-1" style={{ color: "var(--bm-petrol)", fontFamily: "Lato, sans-serif" }}>B Modern Homes</div>
          <p className="text-xs text-muted-foreground" style={{ fontFamily: "Lato, sans-serif" }}>
            This proposal is confidential and prepared exclusively for {project.clientName}.
          </p>
        </div>
      </footer>
    </div>
  );
}
