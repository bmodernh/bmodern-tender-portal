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
import { Save, Upload, X } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "presented", label: "Presented to Client" },
  { value: "under_review", label: "Under Review" },
  { value: "accepted", label: "Accepted" },
  { value: "contract_creation", label: "Contract Creation" },
  { value: "contract_signed", label: "Contract Signed" },
  { value: "post_contract", label: "Post Contract" },
];

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
  const createMutation = trpc.projects.create.useMutation({
    onSuccess: () => { toast.success("Project created"); utils.projects.list.invalidate(); navigate("/admin"); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.projects.update.useMutation({
    onSuccess: () => { toast.success("Project updated"); utils.projects.list.invalidate(); navigate(`/admin/projects/${projectId}`); },
    onError: (e) => toast.error(e.message),
  });
  const uploadMutation = trpc.upload.getUploadUrl.useMutation();

  const [form, setForm] = useState({
    clientName: "",
    clientEmail: "",
    projectAddress: "",
    proposalNumber: "",
    projectType: "",
    buildType: "",
    baseContractPrice: "",
    preliminaryEstimateMin: "",
    preliminaryEstimateMax: "",
    heroImageUrl: "",
    tenderExpiryDate: "",
    status: "draft" as string,
    notes: "",
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
        baseContractPrice: existing.baseContractPrice?.toString() || "",
        preliminaryEstimateMin: existing.preliminaryEstimateMin?.toString() || "",
        preliminaryEstimateMax: existing.preliminaryEstimateMax?.toString() || "",
        heroImageUrl: existing.heroImageUrl || "",
        tenderExpiryDate: existing.tenderExpiryDate ? new Date(existing.tenderExpiryDate).toISOString().split("T")[0] : "",
        status: existing.status || "draft",
        notes: existing.notes || "",
      });
      setHeroPreview(existing.heroImageUrl || "");
    }
  }, [existing]);

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
    } catch (err) {
      toast.error("Upload failed");
      setUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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

  const field = (label: string, key: keyof typeof form, type = "text", placeholder = "") => (
    <div className="space-y-1.5">
      <Label className="text-xs tracking-wider uppercase" style={{ color: "var(--bm-petrol)", fontFamily: "Lato, sans-serif" }}>{label}</Label>
      <Input
        type={type}
        value={form[key]}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        placeholder={placeholder}
        className="h-10 text-sm"
        style={{ fontFamily: "Lato, sans-serif" }}
      />
    </div>
  );

  return (
    <AdminLayout
      breadcrumbs={[
        { label: "Dashboard", href: "/admin" },
        { label: isEdit ? "Edit Project" : "New Project" },
      ]}
    >
      <form onSubmit={handleSubmit} className="max-w-3xl space-y-8">
        <div>
          <h1 className="text-xl mb-1" style={{ fontFamily: "'Playfair Display SC', Georgia, serif", color: "var(--bm-petrol)" }}>
            {isEdit ? "Edit Project" : "New Project"}
          </h1>
          <p className="text-sm text-muted-foreground" style={{ fontFamily: "Lato, sans-serif" }}>
            {isEdit ? "Update the project details below." : "Fill in the details to create a new tender project."}
          </p>
        </div>

        {/* Client details */}
        <section className="bg-card border rounded p-6 space-y-4" style={{ borderColor: "var(--border)" }}>
          <h2 className="text-sm tracking-wider uppercase mb-4" style={{ color: "var(--bm-petrol)", fontFamily: "Lato, sans-serif", fontWeight: 700 }}>Client Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {field("Client Name *", "clientName", "text", "e.g. Smith Family")}
            {field("Client Email", "clientEmail", "email", "client@email.com")}
          </div>
          {field("Project Address *", "projectAddress", "text", "e.g. 12 Example Street, Rozelle NSW 2039")}
        </section>

        {/* Project details */}
        <section className="bg-card border rounded p-6 space-y-4" style={{ borderColor: "var(--border)" }}>
          <h2 className="text-sm tracking-wider uppercase mb-4" style={{ color: "var(--bm-petrol)", fontFamily: "Lato, sans-serif", fontWeight: 700 }}>Project Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {field("Proposal Number *", "proposalNumber", "text", "e.g. BM-2024-001")}
            <div className="space-y-1.5">
              <Label className="text-xs tracking-wider uppercase" style={{ color: "var(--bm-petrol)", fontFamily: "Lato, sans-serif" }}>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
                <SelectTrigger className="h-10 text-sm" style={{ fontFamily: "Lato, sans-serif" }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value} style={{ fontFamily: "Lato, sans-serif" }}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {field("Project Type", "projectType", "text", "e.g. New Build, Renovation")}
            {field("Build Type", "buildType", "text", "e.g. Brick Veneer, Double Brick")}
            {field("Tender Expiry Date", "tenderExpiryDate", "date")}
          </div>
        </section>

        {/* Pricing */}
        <section className="bg-card border rounded p-6 space-y-4" style={{ borderColor: "var(--border)" }}>
          <h2 className="text-sm tracking-wider uppercase mb-4" style={{ color: "var(--bm-petrol)", fontFamily: "Lato, sans-serif", fontWeight: 700 }}>Pricing</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {field("Base Contract Price ($)", "baseContractPrice", "number", "e.g. 850000")}
            {field("Estimate Min ($)", "preliminaryEstimateMin", "number", "e.g. 800000")}
            {field("Estimate Max ($)", "preliminaryEstimateMax", "number", "e.g. 900000")}
          </div>
        </section>

        {/* Hero image */}
        <section className="bg-card border rounded p-6" style={{ borderColor: "var(--border)" }}>
          <h2 className="text-sm tracking-wider uppercase mb-4" style={{ color: "var(--bm-petrol)", fontFamily: "Lato, sans-serif", fontWeight: 700 }}>Hero Image</h2>
          {heroPreview ? (
            <div className="relative">
              <img src={heroPreview} alt="Hero" className="w-full h-48 object-cover rounded" />
              <button
                type="button"
                onClick={() => { setHeroPreview(""); setForm((f) => ({ ...f, heroImageUrl: "" })); }}
                className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center h-36 border-2 border-dashed rounded cursor-pointer hover:border-[var(--bm-petrol)] transition-colors" style={{ borderColor: "var(--border)" }}>
              <Upload size={20} className="mb-2 text-muted-foreground" />
              <span className="text-sm text-muted-foreground" style={{ fontFamily: "Lato, sans-serif" }}>
                {uploading ? "Uploading..." : "Click to upload hero image"}
              </span>
              <span className="text-xs text-muted-foreground mt-1" style={{ fontFamily: "Lato, sans-serif" }}>JPG, PNG, WEBP up to 10MB</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
            </label>
          )}
        </section>

        {/* Notes */}
        <section className="bg-card border rounded p-6" style={{ borderColor: "var(--border)" }}>
          <h2 className="text-sm tracking-wider uppercase mb-4" style={{ color: "var(--bm-petrol)", fontFamily: "Lato, sans-serif", fontWeight: 700 }}>Internal Notes</h2>
          <Textarea
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            placeholder="Internal notes (not visible to client)"
            rows={3}
            className="text-sm resize-none"
            style={{ fontFamily: "Lato, sans-serif" }}
          />
        </section>

        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={isPending}
            className="gap-2 text-xs tracking-wider uppercase"
            style={{ background: "var(--bm-petrol)", fontFamily: "Lato, sans-serif" }}
          >
            <Save size={14} />
            {isPending ? "Saving..." : isEdit ? "Save Changes" : "Create Project"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(isEdit ? `/admin/projects/${projectId}` : "/admin")}
            className="text-xs tracking-wider uppercase"
            style={{ fontFamily: "Lato, sans-serif" }}
          >
            Cancel
          </Button>
        </div>
      </form>
    </AdminLayout>
  );
}
