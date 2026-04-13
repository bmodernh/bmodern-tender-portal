import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, X } from "lucide-react";

export default function AdminCompanySettings() {
  const utils = trpc.useUtils();
  const { data: settings } = trpc.companySettings.get.useQuery();
  const upsertMutation = trpc.companySettings.upsert.useMutation({
    onSuccess: () => { utils.companySettings.get.invalidate(); toast.success("Company settings saved"); },
    onError: (e) => toast.error(e.message),
  });
  const uploadMutation = trpc.upload.getUploadUrl.useMutation();

  const [form, setForm] = useState({
    aboutUs: "",
    tagline: "",
    phone: "",
    email: "",
    website: "",
    address: "",
    credentials: "",
    logoUrl: "",
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (settings) {
      setForm({
        aboutUs: settings.aboutUs || "",
        tagline: settings.tagline || "",
        phone: settings.phone || "",
        email: settings.email || "",
        website: settings.website || "",
        address: settings.address || "",
        credentials: settings.credentials || "",
        logoUrl: settings.logoUrl || "",
      });
    }
  }, [settings]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const base64 = (ev.target?.result as string).split(",")[1];
        const result = await uploadMutation.mutateAsync({ fileName: file.name, mimeType: file.type, fileData: base64, folder: "company" });
        setForm((f) => ({ ...f, logoUrl: result.url }));
        toast.success("Logo uploaded");
      } catch { toast.error("Upload failed"); }
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    upsertMutation.mutate({
      aboutUs: form.aboutUs || null,
      tagline: form.tagline || null,
      phone: form.phone || null,
      email: form.email || null,
      website: form.website || null,
      address: form.address || null,
      credentials: form.credentials || null,
      logoUrl: form.logoUrl || null,
    });
  };

  const field = (label: string, key: keyof typeof form, placeholder = "", multiline = false) => (
    <div className="space-y-1.5">
      <Label className="text-xs tracking-wide uppercase" style={{ color: "var(--bm-bluegum)", fontFamily: "Lato, sans-serif" }}>{label}</Label>
      {multiline ? (
        <Textarea
          value={form[key]}
          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
          placeholder={placeholder}
          rows={4}
          className="text-sm resize-none"
          style={{ fontFamily: "Lato, sans-serif" }}
        />
      ) : (
        <Input
          value={form[key]}
          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
          placeholder={placeholder}
          className="h-9 text-sm"
          style={{ fontFamily: "Lato, sans-serif" }}
        />
      )}
    </div>
  );

  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl" style={{ fontFamily: "Playfair Display SC, serif", color: "var(--bm-petrol)" }}>Company Settings</h1>
          <p className="text-sm text-muted-foreground mt-1" style={{ fontFamily: "Lato, sans-serif" }}>
            This information appears in the About Us section of all PDF proposals.
          </p>
        </div>

        {/* Logo */}
        <div className="bg-card border rounded-lg p-5 space-y-4" style={{ borderColor: "var(--border)" }}>
          <h2 className="text-xs tracking-wider uppercase font-medium" style={{ color: "var(--bm-petrol)", fontFamily: "Lato, sans-serif" }}>Company Logo (for PDF)</h2>
          {form.logoUrl ? (
            <div className="flex items-center gap-4">
              <img src={form.logoUrl} alt="Company logo" className="h-14 object-contain" />
              <Button variant="ghost" size="sm" onClick={() => setForm((f) => ({ ...f, logoUrl: "" }))} className="text-destructive hover:text-destructive gap-1.5 text-xs">
                <X size={13} /> Remove
              </Button>
            </div>
          ) : (
            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer hover:text-foreground" style={{ fontFamily: "Lato, sans-serif" }}>
              <Upload size={14} /> {uploading ? "Uploading..." : "Click to upload logo"}
              <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={uploading} />
            </label>
          )}
        </div>

        {/* Identity */}
        <div className="bg-card border rounded-lg p-5 space-y-4" style={{ borderColor: "var(--border)" }}>
          <h2 className="text-xs tracking-wider uppercase font-medium" style={{ color: "var(--bm-petrol)", fontFamily: "Lato, sans-serif" }}>Brand Identity</h2>
          {field("Tagline", "tagline", "e.g. Building Modern Homes for Modern Lives")}
          {field("About Us", "aboutUs", "A short description of B Modern Homes — who you are, what you build, your philosophy...", true)}
          {field("Credentials / Awards", "credentials", "e.g. Licensed Builder NSW, HIA Member, 10+ years experience", true)}
        </div>

        {/* Contact */}
        <div className="bg-card border rounded-lg p-5 space-y-4" style={{ borderColor: "var(--border)" }}>
          <h2 className="text-xs tracking-wider uppercase font-medium" style={{ color: "var(--bm-petrol)", fontFamily: "Lato, sans-serif" }}>Contact Details</h2>
          {field("Phone", "phone", "+61 2 XXXX XXXX")}
          {field("Email", "email", "operations@bmodernhomes.com.au")}
          {field("Website", "website", "https://bmodernhomes.com.au")}
          {field("Office Address", "address", "Sydney, NSW")}
        </div>

        <Button
          onClick={handleSave}
          disabled={upsertMutation.isPending}
          className="w-full tracking-wider uppercase text-sm"
          style={{ background: "var(--bm-petrol)", fontFamily: "Lato, sans-serif" }}
        >
          {upsertMutation.isPending ? "Saving..." : "Save Company Settings"}
        </Button>
      </div>
    </AdminLayout>
  );
}
