import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ArrowRight, Check, Save, Upload, X } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "presented", label: "Presented to Client" },
  { value: "under_review", label: "Under Review" },
  { value: "accepted", label: "Accepted" },
  { value: "contract_creation", label: "Contract Creation" },
  { value: "contract_signed", label: "Contract Signed" },
  { value: "post_contract", label: "Post Contract" },
];

const STEPS = [
  { id: 1, label: "Client & Project", description: "Who and where" },
  { id: 2, label: "Pricing & Quantities", description: "Costs and scope" },
  { id: 3, label: "Presentation", description: "Image and notes" },
];

// ─── Step Indicator ────────────────────────────────────────────────────────────
function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.map((step, idx) => {
        const isCompleted = step.id < current;
        const isActive = step.id === current;
        return (
          <div key={step.id} className="flex items-center flex-1 last:flex-none">
            {/* Step circle */}
            <div className="flex flex-col items-center">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-200"
                style={{
                  background: isCompleted ? "var(--bm-petrol)" : isActive ? "var(--bm-petrol)" : "var(--border)",
                  color: isCompleted || isActive ? "white" : "var(--muted-foreground)",
                  fontFamily: "Lato, sans-serif",
                  boxShadow: isActive ? "0 0 0 4px rgba(32,62,74,0.15)" : "none",
                }}
              >
                {isCompleted ? <Check size={15} /> : step.id}
              </div>
              <div className="mt-1.5 text-center hidden sm:block">
                <div
                  className="text-[11px] font-semibold"
                  style={{ color: isActive ? "var(--bm-petrol)" : "var(--muted-foreground)", fontFamily: "Lato, sans-serif" }}
                >
                  {step.label}
                </div>
                <div className="text-[10px] text-muted-foreground" style={{ fontFamily: "Lato, sans-serif" }}>
                  {step.description}
                </div>
              </div>
            </div>
            {/* Connector line */}
            {idx < STEPS.length - 1 && (
              <div
                className="flex-1 h-0.5 mx-2 mt-[-18px] sm:mt-[-28px] transition-all duration-200"
                style={{ background: isCompleted ? "var(--bm-petrol)" : "var(--border)" }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Field helpers ─────────────────────────────────────────────────────────────
function FieldGroup({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs tracking-wider uppercase" style={{ color: "var(--bm-petrol)", fontFamily: "Lato, sans-serif" }}>
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  );
}

export default function AdminProjectForm() {
  const params = useParams<{ id?: string }>();
  const [, navigate] = useLocation();
  const isEdit = !!params.id;
  const projectId = params.id ? parseInt(params.id) : undefined;

  const { data: existing } = trpc.projects.get.useQuery(
    { id: projectId! },
    { enabled: isEdit }
  );

  const utils = trpc.useUtils();
  const upsertQuantitiesMutation = trpc.quantities.upsert.useMutation();
  const createMutation = trpc.projects.create.useMutation({
    onSuccess: async (data) => {
      const newId = (data as any).id;
      // Save quantities if any were entered
      if (newId && (
        form.downlightsQty || form.powerPointsQty || form.kitchenBaseCabinetryLm ||
        form.kitchenOverheadCabinetryLm || form.kitchenBenchtopArea || form.islandBenchtopArea ||
        form.basinMixersQty || form.showerSetsQty || form.kitchenMixersQty ||
        form.floorTileM2 || form.wallTileM2
      )) {
        try {
          await upsertQuantitiesMutation.mutateAsync({
            projectId: newId,
            downlightsQty: form.downlightsQty ? parseInt(form.downlightsQty) : undefined,
            powerPointsQty: form.powerPointsQty ? parseInt(form.powerPointsQty) : undefined,
            kitchenBaseCabinetryLm: form.kitchenBaseCabinetryLm || undefined,
            kitchenOverheadCabinetryLm: form.kitchenOverheadCabinetryLm || undefined,
            kitchenBenchtopArea: form.kitchenBenchtopArea || undefined,
            islandBenchtopArea: form.islandBenchtopArea || undefined,
            basinMixersQty: form.basinMixersQty ? parseInt(form.basinMixersQty) : undefined,
            showerSetsQty: form.showerSetsQty ? parseInt(form.showerSetsQty) : undefined,
            kitchenMixersQty: form.kitchenMixersQty ? parseInt(form.kitchenMixersQty) : undefined,
            floorTileM2: form.floorTileM2 || undefined,
            wallTileM2: form.wallTileM2 || undefined,
          });
        } catch {
          // Quantities save failed silently — can be entered later in Quantities tab
        }
      }
      toast.success("Project created successfully");
      utils.projects.list.invalidate();
      navigate(`/admin/projects/${newId ?? ""}`);
    },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.projects.update.useMutation({
    onSuccess: () => {
      toast.success("Project updated");
      utils.projects.list.invalidate();
      navigate(`/admin/projects/${projectId}`);
    },
    onError: (e) => toast.error(e.message),
  });
  const uploadMutation = trpc.upload.getUploadUrl.useMutation();

  // ─── Form state ──────────────────────────────────────────────────────────────
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    // Step 1
    clientName: "",
    clientEmail: "",
    projectAddress: "",
    proposalNumber: "",
    projectType: "",
    buildType: "",
    tenderExpiryDate: "",
    // Step 2
    baseContractPrice: "",
    preliminaryEstimateMin: "",
    preliminaryEstimateMax: "",
    // Quantities (key ones for pricing engine)
    downlightsQty: "",
    powerPointsQty: "",
    kitchenBaseCabinetryLm: "",
    kitchenOverheadCabinetryLm: "",
    kitchenBenchtopArea: "",
    islandBenchtopArea: "",
    basinMixersQty: "",
    showerSetsQty: "",
    kitchenMixersQty: "",
    floorTileM2: "",
    wallTileM2: "",
    // Step 3
    heroImageUrl: "",
    notes: "",
    status: "draft" as string,
  });
  const [heroPreview, setHeroPreview] = useState<string>("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (existing) {
      setForm({
        clientName: existing.clientName || "",
        clientEmail: existing.clientEmail || "",
        projectAddress: existing.projectAddress || "",
        proposalNumber: existing.proposalNumber || "",
        projectType: existing.projectType || "",
        buildType: existing.buildType || "",
        tenderExpiryDate: existing.tenderExpiryDate ? new Date(existing.tenderExpiryDate).toISOString().split("T")[0] : "",
        baseContractPrice: existing.baseContractPrice?.toString() || "",
        preliminaryEstimateMin: existing.preliminaryEstimateMin?.toString() || "",
        preliminaryEstimateMax: existing.preliminaryEstimateMax?.toString() || "",
        downlightsQty: "",
        powerPointsQty: "",
        kitchenBaseCabinetryLm: "",
        kitchenOverheadCabinetryLm: "",
        kitchenBenchtopArea: "",
        islandBenchtopArea: "",
        basinMixersQty: "",
        showerSetsQty: "",
        kitchenMixersQty: "",
        floorTileM2: "",
        wallTileM2: "",
        heroImageUrl: existing.heroImageUrl || "",
        notes: existing.notes || "",
        status: existing.status || "draft",
      });
      setHeroPreview(existing.heroImageUrl || "");
    }
  }, [existing]);

  // ─── Validation ──────────────────────────────────────────────────────────────
  const validateStep = (s: number): string | null => {
    if (s === 1) {
      if (!form.clientName.trim()) return "Client name is required";
      if (!form.projectAddress.trim()) return "Project address is required";
      if (!form.proposalNumber.trim()) return "Proposal number is required";
    }
    if (s === 2) {
      if (!form.baseContractPrice) return "Base contract price is required";
    }
    return null;
  };

  const handleNext = () => {
    const err = validateStep(step);
    if (err) { toast.error(err); return; }
    setStep(s => Math.min(s + 1, 3));
  };

  const handleBack = () => setStep(s => Math.max(s - 1, 1));

  // ─── Image upload ─────────────────────────────────────────────────────────────
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error("Image must be under 10MB"); return; }
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const base64 = (ev.target?.result as string).split(",")[1];
        const result = await uploadMutation.mutateAsync({
          fileName: file.name,
          mimeType: file.type,
          fileData: base64,
          folder: "hero-images",
        });
        setForm((f) => ({ ...f, heroImageUrl: result.url }));
        setHeroPreview(result.url);
        setUploading(false);
        toast.success("Image uploaded");
      };
      reader.readAsDataURL(file);
    } catch {
      toast.error("Upload failed");
      setUploading(false);
    }
  };

  // ─── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = () => {
    const err = validateStep(step);
    if (err) { toast.error(err); return; }
    const data = {
      clientName: form.clientName,
      clientEmail: form.clientEmail || undefined,
      projectAddress: form.projectAddress,
      proposalNumber: form.proposalNumber,
      projectType: form.projectType || undefined,
      buildType: form.buildType || undefined,
      baseContractPrice: form.baseContractPrice || undefined,
      preliminaryEstimateMin: form.preliminaryEstimateMin || undefined,
      preliminaryEstimateMax: form.preliminaryEstimateMax || undefined,
      heroImageUrl: form.heroImageUrl || undefined,
      tenderExpiryDate: form.tenderExpiryDate || undefined,
      notes: form.notes || undefined,
    };
    if (isEdit && projectId) {
      updateMutation.mutate({ id: projectId, ...data, status: form.status as any });
    } else {
      createMutation.mutate(data);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  const f = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(prev => ({ ...prev, [key]: e.target.value })),
  });

  // ─── Edit mode: single page ───────────────────────────────────────────────────
  if (isEdit) {
    return (
      <AdminLayout breadcrumbs={[{ label: "Dashboard", href: "/admin" }, { label: "Edit Project" }]}>
        <div className="max-w-3xl space-y-8">
          <div>
            <h1 className="text-xl mb-1" style={{ fontFamily: "'Playfair Display SC', Georgia, serif", color: "var(--bm-petrol)" }}>
              Edit Project
            </h1>
            <p className="text-sm text-muted-foreground" style={{ fontFamily: "Lato, sans-serif" }}>
              Update the project details below.
            </p>
          </div>

          <section className="bg-card border rounded-lg p-6 space-y-4" style={{ borderColor: "var(--border)" }}>
            <h2 className="text-xs font-bold tracking-wider uppercase mb-4" style={{ color: "var(--bm-petrol)", fontFamily: "Lato, sans-serif" }}>Client Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FieldGroup label="Client Name" required><Input {...f("clientName")} placeholder="e.g. Smith Family" className="h-10 text-sm" /></FieldGroup>
              <FieldGroup label="Client Email"><Input {...f("clientEmail")} type="email" placeholder="client@email.com" className="h-10 text-sm" /></FieldGroup>
            </div>
            <FieldGroup label="Project Address" required><Input {...f("projectAddress")} placeholder="e.g. 12 Example Street, Rozelle NSW 2039" className="h-10 text-sm" /></FieldGroup>
          </section>

          <section className="bg-card border rounded-lg p-6 space-y-4" style={{ borderColor: "var(--border)" }}>
            <h2 className="text-xs font-bold tracking-wider uppercase mb-4" style={{ color: "var(--bm-petrol)", fontFamily: "Lato, sans-serif" }}>Project Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FieldGroup label="Proposal Number" required><Input {...f("proposalNumber")} placeholder="e.g. BM-2024-001" className="h-10 text-sm" /></FieldGroup>
              <FieldGroup label="Status">
                <Select value={form.status} onValueChange={(v) => setForm(p => ({ ...p, status: v }))}>
                  <SelectTrigger className="h-10 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUS_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                </Select>
              </FieldGroup>
              <FieldGroup label="Project Type"><Input {...f("projectType")} placeholder="e.g. New Build" className="h-10 text-sm" /></FieldGroup>
              <FieldGroup label="Build Type"><Input {...f("buildType")} placeholder="e.g. Brick Veneer" className="h-10 text-sm" /></FieldGroup>
              <FieldGroup label="Tender Expiry"><Input {...f("tenderExpiryDate")} type="date" className="h-10 text-sm" /></FieldGroup>
            </div>
          </section>

          <section className="bg-card border rounded-lg p-6 space-y-4" style={{ borderColor: "var(--border)" }}>
            <h2 className="text-xs font-bold tracking-wider uppercase mb-4" style={{ color: "var(--bm-petrol)", fontFamily: "Lato, sans-serif" }}>Pricing</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FieldGroup label="Base Contract Price ($)" required><Input {...f("baseContractPrice")} type="number" placeholder="e.g. 850000" className="h-10 text-sm" /></FieldGroup>
              <FieldGroup label="Estimate Min ($)"><Input {...f("preliminaryEstimateMin")} type="number" placeholder="e.g. 800000" className="h-10 text-sm" /></FieldGroup>
              <FieldGroup label="Estimate Max ($)"><Input {...f("preliminaryEstimateMax")} type="number" placeholder="e.g. 900000" className="h-10 text-sm" /></FieldGroup>
            </div>
          </section>

          <section className="bg-card border rounded-lg p-6" style={{ borderColor: "var(--border)" }}>
            <h2 className="text-xs font-bold tracking-wider uppercase mb-4" style={{ color: "var(--bm-petrol)", fontFamily: "Lato, sans-serif" }}>Hero Image</h2>
            {heroPreview ? (
              <div className="relative">
                <img src={heroPreview} alt="Hero" className="w-full h-48 object-cover rounded" />
                <button type="button" onClick={() => { setHeroPreview(""); setForm(f => ({ ...f, heroImageUrl: "" })); }}
                  className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80"><X size={14} /></button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center h-36 border-2 border-dashed rounded cursor-pointer hover:border-[var(--bm-petrol)] transition-colors" style={{ borderColor: "var(--border)" }}>
                <Upload size={20} className="mb-2 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{uploading ? "Uploading..." : "Click to upload hero image"}</span>
                <span className="text-xs text-muted-foreground mt-1">JPG, PNG, WEBP up to 10MB</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
              </label>
            )}
          </section>

          <section className="bg-card border rounded-lg p-6" style={{ borderColor: "var(--border)" }}>
            <h2 className="text-xs font-bold tracking-wider uppercase mb-4" style={{ color: "var(--bm-petrol)", fontFamily: "Lato, sans-serif" }}>Internal Notes</h2>
            <Textarea {...f("notes")} placeholder="Internal notes (not visible to client)" rows={3} className="text-sm resize-none" />
          </section>

          <div className="flex gap-3">
            <Button type="button" onClick={handleSubmit} disabled={isPending} className="gap-2 text-xs tracking-wider uppercase" style={{ background: "var(--bm-petrol)", fontFamily: "Lato, sans-serif" }}>
              <Save size={14} />{isPending ? "Saving..." : "Save Changes"}
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate(`/admin/projects/${projectId}`)} className="text-xs tracking-wider uppercase">Cancel</Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // ─── Create mode: 3-step wizard ───────────────────────────────────────────────
  return (
    <AdminLayout breadcrumbs={[{ label: "Dashboard", href: "/admin" }, { label: "New Project" }]}>
      <div className="max-w-2xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl mb-1" style={{ fontFamily: "'Playfair Display SC', Georgia, serif", color: "var(--bm-petrol)" }}>
            New Project
          </h1>
          <p className="text-sm text-muted-foreground" style={{ fontFamily: "Lato, sans-serif" }}>
            Step {step} of {STEPS.length} — {STEPS[step - 1].label}
          </p>
        </div>

        {/* Step indicator */}
        <StepIndicator current={step} total={STEPS.length} />

        {/* Step 1: Client & Project */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <section className="bg-card border rounded-lg p-6 space-y-4" style={{ borderColor: "var(--border)" }}>
              <h2 className="text-xs font-bold tracking-wider uppercase" style={{ color: "var(--bm-petrol)", fontFamily: "Lato, sans-serif" }}>Client Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FieldGroup label="Client Name" required>
                  <Input {...f("clientName")} placeholder="e.g. Smith Family" className="h-10 text-sm" autoFocus />
                </FieldGroup>
                <FieldGroup label="Client Email">
                  <Input {...f("clientEmail")} type="email" placeholder="client@email.com" className="h-10 text-sm" />
                </FieldGroup>
              </div>
              <FieldGroup label="Project Address" required>
                <Input {...f("projectAddress")} placeholder="e.g. 12 Example Street, Rozelle NSW 2039" className="h-10 text-sm" />
              </FieldGroup>
            </section>

            <section className="bg-card border rounded-lg p-6 space-y-4" style={{ borderColor: "var(--border)" }}>
              <h2 className="text-xs font-bold tracking-wider uppercase" style={{ color: "var(--bm-petrol)", fontFamily: "Lato, sans-serif" }}>Project Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FieldGroup label="Proposal Number" required>
                  <Input {...f("proposalNumber")} placeholder="e.g. BM-2024-001" className="h-10 text-sm" />
                </FieldGroup>
                <FieldGroup label="Tender Expiry Date">
                  <Input {...f("tenderExpiryDate")} type="date" className="h-10 text-sm" />
                </FieldGroup>
                <FieldGroup label="Project Type">
                  <Input {...f("projectType")} placeholder="e.g. New Build, Renovation" className="h-10 text-sm" />
                </FieldGroup>
                <FieldGroup label="Build Type">
                  <Input {...f("buildType")} placeholder="e.g. Brick Veneer, Double Brick" className="h-10 text-sm" />
                </FieldGroup>
              </div>
            </section>
          </div>
        )}

        {/* Step 2: Pricing & Quantities */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <section className="bg-card border rounded-lg p-6 space-y-4" style={{ borderColor: "var(--border)" }}>
              <h2 className="text-xs font-bold tracking-wider uppercase" style={{ color: "var(--bm-petrol)", fontFamily: "Lato, sans-serif" }}>Contract Pricing</h2>
              <p className="text-xs text-muted-foreground" style={{ fontFamily: "Lato, sans-serif" }}>
                The base contract price is the Tier 1 (Built for Excellence) total. Tier 2 and 3 prices are auto-calculated from the quantities and pricing rules you've set.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FieldGroup label="Base Contract Price ($)" required>
                  <Input {...f("baseContractPrice")} type="number" placeholder="e.g. 850000" className="h-10 text-sm" autoFocus />
                </FieldGroup>
                <FieldGroup label="Estimate Min ($)">
                  <Input {...f("preliminaryEstimateMin")} type="number" placeholder="e.g. 800000" className="h-10 text-sm" />
                </FieldGroup>
                <FieldGroup label="Estimate Max ($)">
                  <Input {...f("preliminaryEstimateMax")} type="number" placeholder="e.g. 900000" className="h-10 text-sm" />
                </FieldGroup>
              </div>
            </section>

            <section className="bg-card border rounded-lg p-6 space-y-4" style={{ borderColor: "var(--border)" }}>
              <div>
                <h2 className="text-xs font-bold tracking-wider uppercase" style={{ color: "var(--bm-petrol)", fontFamily: "Lato, sans-serif" }}>Key Quantities</h2>
                <p className="text-xs text-muted-foreground mt-1" style={{ fontFamily: "Lato, sans-serif" }}>
                  These quantities drive the automatic Tier 2 and Tier 3 price calculations. You can update them later in the Quantities tab.
                </p>
              </div>

              {/* Electrical */}
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2" style={{ fontFamily: "Lato, sans-serif" }}>Electrical</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <FieldGroup label="Downlights (qty)">
                    <Input {...f("downlightsQty")} type="number" placeholder="e.g. 25" className="h-9 text-sm" />
                  </FieldGroup>
                  <FieldGroup label="Power Points (qty)">
                    <Input {...f("powerPointsQty")} type="number" placeholder="e.g. 15" className="h-9 text-sm" />
                  </FieldGroup>
                </div>
              </div>

              {/* Joinery */}
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2" style={{ fontFamily: "Lato, sans-serif" }}>Joinery</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <FieldGroup label="Kitchen Base (lm)">
                    <Input {...f("kitchenBaseCabinetryLm")} type="number" placeholder="e.g. 6.5" className="h-9 text-sm" />
                  </FieldGroup>
                  <FieldGroup label="Kitchen Overhead (lm)">
                    <Input {...f("kitchenOverheadCabinetryLm")} type="number" placeholder="e.g. 4.0" className="h-9 text-sm" />
                  </FieldGroup>
                </div>
              </div>

              {/* Benchtops */}
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2" style={{ fontFamily: "Lato, sans-serif" }}>Benchtops</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <FieldGroup label="Kitchen Bench (m²)">
                    <Input {...f("kitchenBenchtopArea")} type="number" placeholder="e.g. 4.2" className="h-9 text-sm" />
                  </FieldGroup>
                  <FieldGroup label="Island Bench (m²)">
                    <Input {...f("islandBenchtopArea")} type="number" placeholder="e.g. 2.0" className="h-9 text-sm" />
                  </FieldGroup>
                </div>
              </div>

              {/* Tapware */}
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2" style={{ fontFamily: "Lato, sans-serif" }}>Tapware & Fixtures</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <FieldGroup label="Basin Mixers (qty)">
                    <Input {...f("basinMixersQty")} type="number" placeholder="e.g. 3" className="h-9 text-sm" />
                  </FieldGroup>
                  <FieldGroup label="Shower Sets (qty)">
                    <Input {...f("showerSetsQty")} type="number" placeholder="e.g. 2" className="h-9 text-sm" />
                  </FieldGroup>
                  <FieldGroup label="Kitchen Mixers (qty)">
                    <Input {...f("kitchenMixersQty")} type="number" placeholder="e.g. 1" className="h-9 text-sm" />
                  </FieldGroup>
                </div>
              </div>

              {/* Tiles */}
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2" style={{ fontFamily: "Lato, sans-serif" }}>Tiles</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <FieldGroup label="Floor Tile (m²)">
                    <Input {...f("floorTileM2")} type="number" placeholder="e.g. 80" className="h-9 text-sm" />
                  </FieldGroup>
                  <FieldGroup label="Wall Tile (m²)">
                    <Input {...f("wallTileM2")} type="number" placeholder="e.g. 40" className="h-9 text-sm" />
                  </FieldGroup>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* Step 3: Presentation */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <section className="bg-card border rounded-lg p-6" style={{ borderColor: "var(--border)" }}>
              <h2 className="text-xs font-bold tracking-wider uppercase mb-4" style={{ color: "var(--bm-petrol)", fontFamily: "Lato, sans-serif" }}>Hero Image</h2>
              <p className="text-xs text-muted-foreground mb-4" style={{ fontFamily: "Lato, sans-serif" }}>
                This image appears at the top of the client portal. You can add it now or upload it later.
              </p>
              {heroPreview ? (
                <div className="relative">
                  <img src={heroPreview} alt="Hero" className="w-full h-52 object-cover rounded-lg" />
                  <button type="button" onClick={() => { setHeroPreview(""); setForm(f => ({ ...f, heroImageUrl: "" })); }}
                    className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1.5 hover:bg-black/80 transition-colors">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-40 border-2 border-dashed rounded-lg cursor-pointer hover:border-[var(--bm-petrol)] transition-colors" style={{ borderColor: "var(--border)" }}>
                  <Upload size={22} className="mb-2 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground" style={{ fontFamily: "Lato, sans-serif" }}>
                    {uploading ? "Uploading..." : "Click to upload hero image"}
                  </span>
                  <span className="text-xs text-muted-foreground mt-1" style={{ fontFamily: "Lato, sans-serif" }}>JPG, PNG, WEBP up to 10MB</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                </label>
              )}
            </section>

            <section className="bg-card border rounded-lg p-6 space-y-4" style={{ borderColor: "var(--border)" }}>
              <h2 className="text-xs font-bold tracking-wider uppercase mb-1" style={{ color: "var(--bm-petrol)", fontFamily: "Lato, sans-serif" }}>Status & Notes</h2>
              <FieldGroup label="Initial Status">
                <Select value={form.status} onValueChange={(v) => setForm(p => ({ ...p, status: v }))}>
                  <SelectTrigger className="h-10 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUS_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                </Select>
              </FieldGroup>
              <FieldGroup label="Internal Notes">
                <Textarea {...f("notes")} placeholder="Internal notes (not visible to client)" rows={3} className="text-sm resize-none" />
              </FieldGroup>
            </section>

            {/* Summary card */}
            <div className="rounded-lg p-5 space-y-2" style={{ background: "rgba(32,62,74,0.05)", border: "1px solid rgba(32,62,74,0.15)" }}>
              <div className="text-xs font-bold tracking-wider uppercase mb-3" style={{ color: "var(--bm-petrol)", fontFamily: "Lato, sans-serif" }}>Project Summary</div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs" style={{ fontFamily: "Lato, sans-serif" }}>
                <div className="text-muted-foreground">Client</div><div className="font-medium">{form.clientName}</div>
                <div className="text-muted-foreground">Address</div><div className="font-medium">{form.projectAddress}</div>
                <div className="text-muted-foreground">Proposal No.</div><div className="font-medium">{form.proposalNumber}</div>
                {form.baseContractPrice && <><div className="text-muted-foreground">Base Price</div><div className="font-medium">${Number(form.baseContractPrice).toLocaleString()}</div></>}
              </div>
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t" style={{ borderColor: "var(--border)" }}>
          <Button
            type="button"
            variant="outline"
            onClick={step === 1 ? () => navigate("/admin") : handleBack}
            className="gap-2 text-xs tracking-wider uppercase"
            style={{ fontFamily: "Lato, sans-serif" }}
          >
            <ArrowLeft size={13} />
            {step === 1 ? "Cancel" : "Back"}
          </Button>

          {step < 3 ? (
            <Button
              type="button"
              onClick={handleNext}
              className="gap-2 text-xs tracking-wider uppercase"
              style={{ background: "var(--bm-petrol)", fontFamily: "Lato, sans-serif" }}
            >
              Next: {STEPS[step].label}
              <ArrowRight size={13} />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isPending}
              className="gap-2 text-xs tracking-wider uppercase"
              style={{ background: "var(--bm-petrol)", fontFamily: "Lato, sans-serif" }}
            >
              <Check size={13} />
              {isPending ? "Creating..." : "Create Project"}
            </Button>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
