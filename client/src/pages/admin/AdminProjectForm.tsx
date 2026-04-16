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
import { AlertCircle, ArrowLeft, ArrowRight, Check, CheckCircle, Save, Upload, X } from "lucide-react";

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
  { id: 2, label: "BOQ Upload", description: "Bill of Quantities" },
  { id: 3, label: "Pricing & Quantities", description: "Costs and scope" },
  { id: 4, label: "Presentation", description: "Image and notes" },
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
    // In wizard mode (step > 1 after creation), we handle navigation in handleSubmit
    // This onSuccess fires for mutateAsync too, so we skip navigation if step > 1
    onSuccess: async (data) => {
      // If we're in the wizard (step will be set to 2 after this), don't navigate yet
      // The navigation happens in updateMutation.onSuccess after Step 4
    },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.projects.update.useMutation({
    onSuccess: () => {
      toast.success(isEdit ? "Project updated" : "Project created successfully");
      utils.projects.list.invalidate();
      // In wizard mode, navigate to the wizard-created project
      const targetId = isEdit ? projectId : wizardProjectId;
      navigate(`/admin/projects/${targetId}`);
    },
    onError: (e) => toast.error(e.message),
  });
  const uploadMutation = trpc.upload.getUploadUrl.useMutation();

  // ─── Form state ──────────────────────────────────────────────────────────────
  const [step, setStep] = useState(1);
  // BOQ wizard state — project is created when advancing from Step 1
  const [wizardProjectId, setWizardProjectId] = useState<number | null>(null);
  const [boqFile, setBoqFile] = useState<File | null>(null);
  const [boqUploading, setBoqUploading] = useState(false);
  const [boqDocId, setBoqDocId] = useState<number | null>(null);
  const [boqStatus, setBoqStatus] = useState<string | null>(null);
  const [boqExtracted, setBoqExtracted] = useState<Array<{ id: number; category: string; description: string; unit: string | null; quantity: string | null; mappedQuantityField: string | null; confirmed: boolean }>>([]);
  const [boqPolling, setBoqPolling] = useState(false);
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
    pendantPointsQty: "",
    switchPlatesQty: "",
    dataPointsQty: "",
    exhaustFansQty: "",
    acZonesQty: "",
    acKw: "",
    kitchenBaseCabinetryLm: "",
    kitchenOverheadCabinetryLm: "",
    wardrobeLm: "",
    laundryJoineryQty: "",
    kitchenBenchtopArea: "",
    islandBenchtopArea: "",
    vanityStoneTopQty: "",
    basinMixersQty: "",
    showerSetsQty: "",
    kitchenMixersQty: "",
    toiletsQty: "",
    bathtubsQty: "",
    applianceSetsQty: "",
    floorTileM2: "",
    wallTileM2: "",
    splashbackTileM2: "",
    timberHybridM2: "",
    carpetM2: "",
    facadeCladdingM2: "",
    insulationCeilingR: "",
    insulationWallR: "",
    internalDoorsQty: "",
    externalDoorsQty: "",
    doorHandlesQty: "",
    // New scalable qty fields
    mainFloorTileM2: "",
    bathroomQty: "",
    drivewayM2: "",
    wallPlasterM2: "",
    ceilingPlasterM2: "",
    corniceLm: "",
    squareSetQty: "",
    garageDoorQty: "",
    ceilingInsulationM2: "",
    wallInsulationM2: "",
    acousticInsulationM2: "",
    // Starting tier
    startingTier: "1",
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
        // Quantities — not pre-filled from project (loaded separately in Quantities tab)
        downlightsQty: "", powerPointsQty: "", pendantPointsQty: "", switchPlatesQty: "",
        dataPointsQty: "", exhaustFansQty: "", acZonesQty: "", acKw: "",
        kitchenBaseCabinetryLm: "", kitchenOverheadCabinetryLm: "", wardrobeLm: "", laundryJoineryQty: "",
        kitchenBenchtopArea: "", islandBenchtopArea: "", vanityStoneTopQty: "",
        basinMixersQty: "", showerSetsQty: "", kitchenMixersQty: "", toiletsQty: "", bathtubsQty: "",
        applianceSetsQty: "", floorTileM2: "", wallTileM2: "", splashbackTileM2: "",
        timberHybridM2: "", carpetM2: "", facadeCladdingM2: "",
        mainFloorTileM2: "", bathroomQty: "", drivewayM2: "",
        wallPlasterM2: "", ceilingPlasterM2: "", corniceLm: "",
        squareSetQty: "", garageDoorQty: "",
        ceilingInsulationM2: "", wallInsulationM2: "", acousticInsulationM2: "",
        insulationCeilingR: "", insulationWallR: "",
        internalDoorsQty: "", externalDoorsQty: "", doorHandlesQty: "",
        startingTier: String(existing.startingTier ?? 1),
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
    if (s === 3) {
      if (!form.baseContractPrice) return "Base contract price is required";
    }
    return null;
  };

  const handleNext = async () => {
    const err = validateStep(step);
    if (err) { toast.error(err); return; }
    // When advancing from Step 1, create the project immediately so we have an ID for BOQ upload
    if (step === 1 && !wizardProjectId) {
      try {
        const data = {
          clientName: form.clientName,
          clientEmail: form.clientEmail || undefined,
          projectAddress: form.projectAddress,
          proposalNumber: form.proposalNumber,
          projectType: form.projectType || undefined,
          buildType: form.buildType || undefined,
          baseContractPrice: form.baseContractPrice || undefined,
          tenderExpiryDate: form.tenderExpiryDate || undefined,
          notes: form.notes || undefined,
          startingTier: parseInt(form.startingTier) || 1,
        };
        const result = await createMutation.mutateAsync(data);
        const newId = (result as any).id;
        setWizardProjectId(newId);
        setStep(2);
      } catch {
        // error handled by createMutation.onError
      }
      return;
    }
    // When advancing from Step 2 (BOQ), auto-fill quantities from extracted BOQ items
    if (step === 2 && boqExtracted.length > 0 && wizardProjectId) {
      const qtyUpdate: Record<string, number> = {};
      for (const item of boqExtracted) {
        if (item.mappedQuantityField && item.quantity) {
          const val = parseFloat(item.quantity);
          if (!isNaN(val)) qtyUpdate[item.mappedQuantityField] = val;
        }
      }
      if (Object.keys(qtyUpdate).length > 0) {
        setForm(prev => ({ ...prev, ...Object.fromEntries(Object.entries(qtyUpdate).map(([k, v]) => [k, String(v)])) }));
      }
    }
    setStep(s => Math.min(s + 1, STEPS.length));
  };

  const handleBack = () => setStep(s => Math.max(s - 1, 1));

  // BOQ upload handler for wizard Step 2
  const handleBoqUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !wizardProjectId) return;
    setBoqFile(file);
    setBoqUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('projectId', String(wizardProjectId));
      const res = await fetch('/api/boq/upload', { method: 'POST', body: fd, credentials: 'include' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Upload failed');
      setBoqDocId(json.docId);
      setBoqStatus('extracting');
      setBoqPolling(true);
      toast.success('BOQ uploaded — extracting items...');
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setBoqUploading(false);
    }
  };

  // Poll BOQ extraction status — poll listDocuments which has the status field
  useEffect(() => {
    if (!boqPolling || !boqDocId || !wizardProjectId) return;
    const interval = setInterval(async () => {
      try {
        const docRes = await fetch(
          `/api/trpc/boq.listDocuments?input=${encodeURIComponent(JSON.stringify({ json: { projectId: wizardProjectId } }))}`,
          { credentials: 'include' }
        );
        const docJson = await docRes.json();
        const docs: Array<{ id: number; status: string }> = docJson?.result?.data?.json ?? [];
        const doc = docs.find((d: any) => d.id === boqDocId);
        if (!doc) return;
        if (doc.status === 'extracted' || doc.status === 'error') {
          setBoqStatus(doc.status);
          setBoqPolling(false);
          if (doc.status === 'extracted') {
            const itemRes = await fetch(
              `/api/trpc/boq.getItems?input=${encodeURIComponent(JSON.stringify({ json: { boqDocumentId: boqDocId } }))}`,
              { credentials: 'include' }
            );
            const itemJson = await itemRes.json();
            const items: any[] = itemJson?.result?.data?.json ?? [];
            setBoqExtracted(items);
            if (items.length) {
              const qMap: Record<string, string> = {};
              for (const item of items) {
                if (item.mappedQuantityField && item.quantity) {
                  qMap[item.mappedQuantityField] = item.quantity;
                }
              }
              if (Object.keys(qMap).length > 0) {
                setForm(f => ({ ...f, ...qMap }));
                toast.success(`Auto-filled ${Object.keys(qMap).length} quantities from BOQ`);
              }
            }
          }
        }
      } catch { /* ignore */ }
    }, 3000);
    return () => clearInterval(interval);
  }, [boqPolling, boqDocId, wizardProjectId]);

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
  const handleSubmit = async () => {
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
      startingTier: parseInt(form.startingTier) || 1,
      tenderExpiryDate: form.tenderExpiryDate || undefined,
      notes: form.notes || undefined,
    };
    if (isEdit && projectId) {
      updateMutation.mutate({ id: projectId, ...data, status: form.status as any });
    } else if (wizardProjectId) {
      // Save quantities first, then update project with remaining fields
      const p = (key: string) => form[key as keyof typeof form] ? parseInt(form[key as keyof typeof form] as string) : undefined;
      const s = (key: string) => (form[key as keyof typeof form] as string) || undefined;
      try {
        await upsertQuantitiesMutation.mutateAsync({
          projectId: wizardProjectId,
          downlightsQty: p('downlightsQty'), powerPointsQty: p('powerPointsQty'),
          pendantPointsQty: p('pendantPointsQty'), switchPlatesQty: p('switchPlatesQty'),
          dataPointsQty: p('dataPointsQty'), exhaustFansQty: p('exhaustFansQty'),
          acZonesQty: p('acZonesQty'), acKw: s('acKw'),
          kitchenBaseCabinetryLm: s('kitchenBaseCabinetryLm'),
          kitchenOverheadCabinetryLm: s('kitchenOverheadCabinetryLm'),
          wardrobeLm: s('wardrobeLm'), laundryJoineryQty: p('laundryJoineryQty'),
          kitchenBenchtopArea: s('kitchenBenchtopArea'), islandBenchtopArea: s('islandBenchtopArea'),
          vanityStoneTopQty: p('vanityStoneTopQty'),
          basinMixersQty: p('basinMixersQty'), showerSetsQty: p('showerSetsQty'),
          kitchenMixersQty: p('kitchenMixersQty'), toiletsQty: p('toiletsQty'),
          bathtubsQty: p('bathtubsQty'), applianceSetsQty: p('applianceSetsQty'),
          floorTileM2: s('floorTileM2'), wallTileM2: s('wallTileM2'),
          splashbackTileM2: s('splashbackTileM2'),
          timberHybridM2: s('timberHybridM2'), carpetM2: s('carpetM2'),
          facadeCladdingM2: s('facadeCladdingM2'),
          insulationCeilingR: s('insulationCeilingR'), insulationWallR: s('insulationWallR'),
          internalDoorsQty: p('internalDoorsQty'), externalDoorsQty: p('externalDoorsQty'),
          doorHandlesQty: p('doorHandlesQty'),
          // New scalable qty fields
          mainFloorTileM2: s('mainFloorTileM2'), bathroomQty: p('bathroomQty'),
          drivewayM2: s('drivewayM2'), wallPlasterM2: s('wallPlasterM2'),
          ceilingPlasterM2: s('ceilingPlasterM2'), corniceLm: s('corniceLm'),
          squareSetQty: p('squareSetQty'), garageDoorQty: p('garageDoorQty'),
          ceilingInsulationM2: s('ceilingInsulationM2'), wallInsulationM2: s('wallInsulationM2'),
          acousticInsulationM2: s('acousticInsulationM2'),
        });
      } catch {
        // Quantities save failed silently — can be updated later in Quantities tab
      }
      updateMutation.mutate({ id: wizardProjectId, ...data, status: form.status as any });
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
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <FieldGroup label="Base Contract Price ($)" required><Input {...f("baseContractPrice")} type="number" placeholder="e.g. 850000" className="h-10 text-sm" /></FieldGroup>
              <FieldGroup label="Estimate Min ($)"><Input {...f("preliminaryEstimateMin")} type="number" placeholder="e.g. 800000" className="h-10 text-sm" /></FieldGroup>
              <FieldGroup label="Estimate Max ($)"><Input {...f("preliminaryEstimateMax")} type="number" placeholder="e.g. 900000" className="h-10 text-sm" /></FieldGroup>
              <FieldGroup label="Starting Tier">
                <Select value={form.startingTier} onValueChange={(v) => setForm(prev => ({ ...prev, startingTier: v }))}>
                  <SelectTrigger className="h-10 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Tier 1 — Built for Excellence</SelectItem>
                    <SelectItem value="2">Tier 2 — Tailored Living</SelectItem>
                    <SelectItem value="3">Tier 3 — Signature Series</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground mt-1">Clients only see upgrades above this tier</p>
              </FieldGroup>
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

        {/* Step 2: BOQ Upload */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <section className="bg-card border rounded-lg p-6 space-y-4" style={{ borderColor: "var(--border)" }}>
              <div>
                <h2 className="text-xs font-bold tracking-wider uppercase" style={{ color: "var(--bm-petrol)", fontFamily: "Lato, sans-serif" }}>Bill of Quantities</h2>
                <p className="text-xs text-muted-foreground mt-1" style={{ fontFamily: "Lato, sans-serif" }}>
                  Upload the client's BOQ (PDF or Excel). The AI will extract items and auto-fill quantities in the next step. You can skip this and enter quantities manually.
                </p>
              </div>

              {!boqFile && !boqDocId && (
                <label className="flex flex-col items-center justify-center h-40 border-2 border-dashed rounded-lg cursor-pointer hover:border-[var(--bm-petrol)] transition-colors" style={{ borderColor: "var(--border)" }}>
                  <Upload size={22} className="mb-2 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground" style={{ fontFamily: "Lato, sans-serif" }}>
                    {boqUploading ? "Uploading..." : "Click to upload BOQ (PDF or Excel)"}
                  </span>
                  <span className="text-xs text-muted-foreground mt-1" style={{ fontFamily: "Lato, sans-serif" }}>PDF, XLSX, XLS up to 16MB</span>
                  <input type="file" accept=".pdf,.xlsx,.xls,.csv" className="hidden" onChange={handleBoqUpload} disabled={boqUploading} />
                </label>
              )}

              {boqFile && boqStatus === 'extracting' && (
                <div className="flex items-center justify-between gap-3 p-4 rounded-lg" style={{ background: "rgba(32,62,74,0.05)", border: "1px solid rgba(32,62,74,0.15)" }}>
                  <div className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-2" style={{ borderColor: "var(--bm-petrol)", borderTopColor: "transparent" }} />
                    <div>
                      <div className="text-sm font-medium" style={{ color: "var(--bm-petrol)", fontFamily: "Lato, sans-serif" }}>Extracting items from {boqFile.name}...</div>
                      <div className="text-xs text-muted-foreground" style={{ fontFamily: "Lato, sans-serif" }}>This usually takes 15–30 seconds</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setBoqPolling(false); setBoqStatus(null); setBoqFile(null); setBoqDocId(null); }}
                    className="text-xs text-muted-foreground hover:text-foreground underline shrink-0"
                    style={{ fontFamily: "Lato, sans-serif" }}
                  >
                    Cancel
                  </button>
                </div>
              )}

              {boqStatus === 'extracted' && boqExtracted.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm" style={{ color: "var(--bm-petrol)", fontFamily: "Lato, sans-serif" }}>
                    <CheckCircle size={16} />
                    <span className="font-medium">Extracted {boqExtracted.length} items — quantities auto-filled in Step 3</span>
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {boqExtracted.slice(0, 10).map(item => (
                      <div key={item.id} className="flex items-center justify-between text-xs px-3 py-1.5 rounded" style={{ background: "rgba(32,62,74,0.04)", fontFamily: "Lato, sans-serif" }}>
                        <span className="text-muted-foreground">{item.category} — {item.description}</span>
                        {item.quantity && <span className="font-medium" style={{ color: "var(--bm-petrol)" }}>{item.quantity} {item.unit || ''}</span>}
                      </div>
                    ))}
                    {boqExtracted.length > 10 && <div className="text-xs text-muted-foreground px-3" style={{ fontFamily: "Lato, sans-serif" }}>+{boqExtracted.length - 10} more items</div>}
                  </div>
                </div>
              )}

              {boqStatus === 'error' && (
                <div className="flex items-center gap-2 p-3 rounded text-sm" style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.2)", color: "#dc2626", fontFamily: "Lato, sans-serif" }}>
                  <AlertCircle size={15} />
                  <span>Extraction failed. You can still enter quantities manually in the next step.</span>
                </div>
              )}
            </section>
          </div>
        )}

        {/* Step 3: Pricing & Quantities */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <section className="bg-card border rounded-lg p-6 space-y-4" style={{ borderColor: "var(--border)" }}>
              <h2 className="text-xs font-bold tracking-wider uppercase" style={{ color: "var(--bm-petrol)", fontFamily: "Lato, sans-serif" }}>Contract Pricing</h2>
              <p className="text-xs text-muted-foreground" style={{ fontFamily: "Lato, sans-serif" }}>
                The base contract price reflects the starting tier you select below. Upgrade prices are auto-calculated from the quantities and pricing rules you've set.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <FieldGroup label="Base Contract Price ($)" required>
                  <Input {...f("baseContractPrice")} type="number" placeholder="e.g. 850000" className="h-10 text-sm" autoFocus />
                </FieldGroup>
                <FieldGroup label="Estimate Min ($)">
                  <Input {...f("preliminaryEstimateMin")} type="number" placeholder="e.g. 800000" className="h-10 text-sm" />
                </FieldGroup>
                <FieldGroup label="Estimate Max ($)">
                  <Input {...f("preliminaryEstimateMax")} type="number" placeholder="e.g. 900000" className="h-10 text-sm" />
                </FieldGroup>
                <FieldGroup label="Starting Tier">
                  <Select value={form.startingTier} onValueChange={(v) => setForm(prev => ({ ...prev, startingTier: v }))}>
                    <SelectTrigger className="h-10 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Tier 1 — Built for Excellence</SelectItem>
                      <SelectItem value="2">Tier 2 — Tailored Living</SelectItem>
                      <SelectItem value="3">Tier 3 — Signature Series</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-muted-foreground mt-1">Clients will only see upgrades above this tier</p>
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
                  <FieldGroup label="Downlights (qty)"><Input {...f("downlightsQty")} type="number" placeholder="e.g. 25" className="h-9 text-sm" /></FieldGroup>
                  <FieldGroup label="Power Points (qty)"><Input {...f("powerPointsQty")} type="number" placeholder="e.g. 15" className="h-9 text-sm" /></FieldGroup>
                  <FieldGroup label="Pendant Points (qty)"><Input {...f("pendantPointsQty")} type="number" placeholder="e.g. 4" className="h-9 text-sm" /></FieldGroup>
                  <FieldGroup label="Switch Plates (qty)"><Input {...f("switchPlatesQty")} type="number" placeholder="e.g. 12" className="h-9 text-sm" /></FieldGroup>
                  <FieldGroup label="Data Points (qty)"><Input {...f("dataPointsQty")} type="number" placeholder="e.g. 6" className="h-9 text-sm" /></FieldGroup>
                  <FieldGroup label="Exhaust Fans (qty)"><Input {...f("exhaustFansQty")} type="number" placeholder="e.g. 3" className="h-9 text-sm" /></FieldGroup>
                </div>
              </div>

              {/* Air Conditioning */}
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2" style={{ fontFamily: "Lato, sans-serif" }}>Air Conditioning</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <FieldGroup label="AC Zones (qty)"><Input {...f("acZonesQty")} type="number" placeholder="e.g. 4" className="h-9 text-sm" /></FieldGroup>
                  <FieldGroup label="Total kW Capacity"><Input {...f("acKw")} type="number" placeholder="e.g. 14.0" className="h-9 text-sm" /></FieldGroup>
                </div>
              </div>

              {/* Joinery */}
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2" style={{ fontFamily: "Lato, sans-serif" }}>Joinery</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <FieldGroup label="Kitchen Base (lm)"><Input {...f("kitchenBaseCabinetryLm")} type="number" placeholder="e.g. 6.5" className="h-9 text-sm" /></FieldGroup>
                  <FieldGroup label="Kitchen Overhead (lm)"><Input {...f("kitchenOverheadCabinetryLm")} type="number" placeholder="e.g. 4.0" className="h-9 text-sm" /></FieldGroup>
                  <FieldGroup label="Wardrobe (lm)"><Input {...f("wardrobeLm")} type="number" placeholder="e.g. 8.0" className="h-9 text-sm" /></FieldGroup>
                  <FieldGroup label="Laundry Cabinets (qty)"><Input {...f("laundryJoineryQty")} type="number" placeholder="e.g. 1" className="h-9 text-sm" /></FieldGroup>
                </div>
              </div>

              {/* Benchtops & Stone */}
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2" style={{ fontFamily: "Lato, sans-serif" }}>Benchtops & Stone</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <FieldGroup label="Kitchen Bench (m²)"><Input {...f("kitchenBenchtopArea")} type="number" placeholder="e.g. 4.2" className="h-9 text-sm" /></FieldGroup>
                  <FieldGroup label="Island Bench (m²)"><Input {...f("islandBenchtopArea")} type="number" placeholder="e.g. 2.0" className="h-9 text-sm" /></FieldGroup>
                  <FieldGroup label="Vanity Stone Tops (qty)"><Input {...f("vanityStoneTopQty")} type="number" placeholder="e.g. 3" className="h-9 text-sm" /></FieldGroup>
                </div>
              </div>

              {/* Tapware & Sanitary */}
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2" style={{ fontFamily: "Lato, sans-serif" }}>Tapware & Sanitaryware</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <FieldGroup label="Basin Mixers (qty)"><Input {...f("basinMixersQty")} type="number" placeholder="e.g. 3" className="h-9 text-sm" /></FieldGroup>
                  <FieldGroup label="Shower Sets (qty)"><Input {...f("showerSetsQty")} type="number" placeholder="e.g. 2" className="h-9 text-sm" /></FieldGroup>
                  <FieldGroup label="Kitchen Mixers (qty)"><Input {...f("kitchenMixersQty")} type="number" placeholder="e.g. 1" className="h-9 text-sm" /></FieldGroup>
                  <FieldGroup label="Toilets (qty)"><Input {...f("toiletsQty")} type="number" placeholder="e.g. 3" className="h-9 text-sm" /></FieldGroup>
                  <FieldGroup label="Bathtubs (qty)"><Input {...f("bathtubsQty")} type="number" placeholder="e.g. 1" className="h-9 text-sm" /></FieldGroup>
                </div>
              </div>

              {/* Appliances */}
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2" style={{ fontFamily: "Lato, sans-serif" }}>Appliances</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <FieldGroup label="Appliance Sets (qty)"><Input {...f("applianceSetsQty")} type="number" placeholder="e.g. 1" className="h-9 text-sm" /></FieldGroup>
                </div>
              </div>

              {/* Tiles */}
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2" style={{ fontFamily: "Lato, sans-serif" }}>Tiles</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <FieldGroup label="Floor Tile (m²)"><Input {...f("floorTileM2")} type="number" placeholder="e.g. 80" className="h-9 text-sm" /></FieldGroup>
                  <FieldGroup label="Wall Tile (m²)"><Input {...f("wallTileM2")} type="number" placeholder="e.g. 40" className="h-9 text-sm" /></FieldGroup>
                  <FieldGroup label="Splashback Tile (m²)"><Input {...f("splashbackTileM2")} type="number" placeholder="e.g. 2.0" className="h-9 text-sm" /></FieldGroup>
                </div>
              </div>

              {/* Flooring */}
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2" style={{ fontFamily: "Lato, sans-serif" }}>Flooring</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <FieldGroup label="Timber / Hybrid (m²)"><Input {...f("timberHybridM2")} type="number" placeholder="e.g. 120" className="h-9 text-sm" /></FieldGroup>
                  <FieldGroup label="Carpet (m²)"><Input {...f("carpetM2")} type="number" placeholder="e.g. 60" className="h-9 text-sm" /></FieldGroup>
                </div>
              </div>

              {/* Doors & Hardware */}
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2" style={{ fontFamily: "Lato, sans-serif" }}>Doors & Hardware</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <FieldGroup label="Internal Doors (qty)"><Input {...f("internalDoorsQty")} type="number" placeholder="e.g. 12" className="h-9 text-sm" /></FieldGroup>
                  <FieldGroup label="External Doors (qty)"><Input {...f("externalDoorsQty")} type="number" placeholder="e.g. 2" className="h-9 text-sm" /></FieldGroup>
                  <FieldGroup label="Door Handles (qty)"><Input {...f("doorHandlesQty")} type="number" placeholder="e.g. 14" className="h-9 text-sm" /></FieldGroup>
                </div>
              </div>

              {/* Facade */}
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2" style={{ fontFamily: "Lato, sans-serif" }}>Facade</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <FieldGroup label="Facade Cladding (m²)"><Input {...f("facadeCladdingM2")} type="number" placeholder="e.g. 80" className="h-9 text-sm" /></FieldGroup>
                </div>
              </div>

              {/* Bathrooms */}
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2" style={{ fontFamily: "Lato, sans-serif" }}>Bathrooms</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <FieldGroup label="Bathrooms (qty)"><Input {...f("bathroomQty")} type="number" placeholder="e.g. 2" className="h-9 text-sm" /></FieldGroup>
                </div>
              </div>

              {/* Plasterboard */}
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2" style={{ fontFamily: "Lato, sans-serif" }}>Plasterboard</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <FieldGroup label="Wall Plaster (m²)"><Input {...f("wallPlasterM2")} type="number" placeholder="e.g. 350" className="h-9 text-sm" /></FieldGroup>
                  <FieldGroup label="Ceiling Plaster (m²)"><Input {...f("ceilingPlasterM2")} type="number" placeholder="e.g. 280" className="h-9 text-sm" /></FieldGroup>
                  <FieldGroup label="Cornice (lm)"><Input {...f("corniceLm")} type="number" placeholder="e.g. 120" className="h-9 text-sm" /></FieldGroup>
                  <FieldGroup label="Square Set Openings (qty)"><Input {...f("squareSetQty")} type="number" placeholder="e.g. 30" className="h-9 text-sm" /></FieldGroup>
                </div>
              </div>

              {/* Driveway & Garage */}
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2" style={{ fontFamily: "Lato, sans-serif" }}>Driveway & Garage</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <FieldGroup label="Driveway (m²)"><Input {...f("drivewayM2")} type="number" placeholder="e.g. 55" className="h-9 text-sm" /></FieldGroup>
                  <FieldGroup label="Garage Doors (qty)"><Input {...f("garageDoorQty")} type="number" placeholder="e.g. 2" className="h-9 text-sm" /></FieldGroup>
                  <FieldGroup label="Main Floor Tile (m²)"><Input {...f("mainFloorTileM2")} type="number" placeholder="e.g. 60" className="h-9 text-sm" /></FieldGroup>
                </div>
              </div>

              {/* Insulation */}
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2" style={{ fontFamily: "Lato, sans-serif" }}>Insulation</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <FieldGroup label="Ceiling Insulation (m²)"><Input {...f("ceilingInsulationM2")} type="number" placeholder="e.g. 280" className="h-9 text-sm" /></FieldGroup>
                  <FieldGroup label="Wall Insulation (m²)"><Input {...f("wallInsulationM2")} type="number" placeholder="e.g. 175" className="h-9 text-sm" /></FieldGroup>
                  <FieldGroup label="Acoustic Insulation (m²)"><Input {...f("acousticInsulationM2")} type="number" placeholder="e.g. 60" className="h-9 text-sm" /></FieldGroup>
                  <FieldGroup label="Ceiling Insulation (R)"><Input {...f("insulationCeilingR")} type="number" placeholder="e.g. 2.5" className="h-9 text-sm" /></FieldGroup>
                  <FieldGroup label="Wall Insulation (R)"><Input {...f("insulationWallR")} type="number" placeholder="e.g. 1.5" className="h-9 text-sm" /></FieldGroup>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* Step 4: Presentation */}
        {step === 4 && (
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

          {step < STEPS.length ? (
            <Button
              type="button"
              onClick={handleNext}
              disabled={createMutation.isPending}
              className="gap-2 text-xs tracking-wider uppercase"
              style={{ background: "var(--bm-petrol)", fontFamily: "Lato, sans-serif" }}
            >
              {createMutation.isPending && step === 1 ? "Creating..." : (<>Next: {STEPS[step].label}<ArrowRight size={13} /></>)}
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
