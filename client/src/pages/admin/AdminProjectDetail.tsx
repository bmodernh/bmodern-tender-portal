import { useState } from "react";
import React from "react";
import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Edit, Link2, Lock, Unlock, Plus, Trash2, Upload, X, GripVertical,
  ExternalLink, Copy, Check, ChevronDown, ChevronUp, Eye, EyeOff, FileDown, Package, Sparkles,
  FileText, RefreshCw, Wand2, CheckCheck, AlertCircle, Loader2, Layers
} from "lucide-react";
import BaseInclusionsTab from "@/components/admin/BaseInclusionsTab";

// ─── PDF Download Button ─────────────────────────────────────────────────────
function PdfDownloadButton({ projectId, proposalNumber }: { projectId: number; proposalNumber: string | null }) {
  const [loading, setLoading] = useState(false);
  const handleDownload = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/pdf/proposal/${projectId}`, { credentials: "include" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "PDF generation failed" }));
        toast.error(err.error || "PDF generation failed");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `B-Modern-Proposal-${proposalNumber || projectId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to generate PDF");
    } finally {
      setLoading(false);
    }
  };
  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded border hover:bg-secondary transition-colors disabled:opacity-50"
      style={{ fontFamily: "Lato, sans-serif", color: "var(--bm-petrol)", borderColor: "var(--border)", background: "transparent" }}
    >
      {loading ? <Loader2 size={13} className="animate-spin" /> : <FileDown size={13} />} PDF
    </button>
  );
}

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft", presented: "Presented", under_review: "Under Review",
  accepted: "Accepted", contract_creation: "Contract Creation",
  contract_signed: "Contract Signed", post_contract: "Post Contract",
};

// ─── Inclusions Tab ───────────────────────────────────────────────────────────
function InclusionsTab({ projectId }: { projectId: number }) {
  const utils = trpc.useUtils();
  const { data: sections, isLoading } = trpc.inclusions.list.useQuery({ projectId });
  const createMutation = trpc.inclusions.create.useMutation({ onSuccess: () => { utils.inclusions.list.invalidate(); setShowAdd(false); setNewSection({ title: "", description: "", imageUrl: "" }); }, onError: (e) => toast.error(e.message) });
  const updateMutation = trpc.inclusions.update.useMutation({ onSuccess: () => { utils.inclusions.list.invalidate(); setEditing(null); }, onError: (e) => toast.error(e.message) });
  const deleteMutation = trpc.inclusions.delete.useMutation({ onSuccess: () => utils.inclusions.list.invalidate(), onError: (e) => toast.error(e.message) });
  const uploadMutation = trpc.upload.getUploadUrl.useMutation();
  const handlePackageApplied = () => utils.inclusions.list.invalidate();

  const [showAdd, setShowAdd] = useState(false);
  const [newSection, setNewSection] = useState({ title: "", description: "", imageUrl: "" });
  const [editing, setEditing] = useState<any>(null);
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, onUrl: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const base64 = (ev.target?.result as string).split(",")[1];
        const result = await uploadMutation.mutateAsync({ fileName: file.name, mimeType: file.type, fileData: base64, folder: "inclusions" });
        onUrl(result.url);
        toast.success("Image uploaded");
      } catch { toast.error("Upload failed"); }
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const SUGGESTED_ROOMS = ["Kitchen", "Ensuite", "Main Bathroom", "Laundry", "Doors & Hardware", "Flooring", "Electrical", "Wardrobes / Joinery", "External Finishes"];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground" style={{ fontFamily: "Lato, sans-serif" }}>
          Add room-by-room sections that will be displayed to the client.
        </p>
        <div className="flex items-center gap-2">
          <ApplyPackageDialog projectId={projectId} onApplied={handlePackageApplied} />
          <Button onClick={() => setShowAdd(true)} size="sm" className="gap-1.5 text-xs" style={{ background: "var(--bm-petrol)", fontFamily: "Lato, sans-serif" }}>
            <Plus size={13} /> Add Section
          </Button>
        </div>
      </div>

      {/* Suggested rooms */}
      <div className="flex flex-wrap gap-1.5">
        {SUGGESTED_ROOMS.map((room) => (
          <button
            key={room}
            onClick={() => { setNewSection({ title: room, description: "", imageUrl: "" }); setShowAdd(true); }}
            className="text-xs px-2.5 py-1 rounded-full border hover:border-[var(--bm-petrol)] hover:text-[var(--bm-petrol)] transition-colors"
            style={{ fontFamily: "Lato, sans-serif", borderColor: "var(--border)" }}
          >
            {room}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 bg-secondary rounded animate-pulse" />)}</div>
      ) : sections?.length === 0 ? (
        <div className="text-center py-10 text-sm text-muted-foreground" style={{ fontFamily: "Lato, sans-serif" }}>No sections yet. Add your first room above.</div>
      ) : (
        <div className="space-y-2">
          {sections?.map((section, idx) => (
            <div key={section.id} className="bg-card border rounded p-4" style={{ borderColor: "var(--border)" }}>
              {editing?.id === section.id ? (
                <div className="space-y-3">
                  <Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} className="h-9 text-sm" placeholder="Section title" style={{ fontFamily: "Lato, sans-serif" }} />
                  <Textarea value={editing.description || ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} placeholder="Description of inclusions..." rows={3} className="text-sm resize-none" style={{ fontFamily: "Lato, sans-serif" }} />
                  {editing.imageUrl ? (
                    <div className="relative w-32">
                      <img src={editing.imageUrl} className="w-32 h-20 object-cover rounded" />
                      <button type="button" onClick={() => setEditing({ ...editing, imageUrl: "" })} className="absolute -top-1.5 -right-1.5 bg-black/60 text-white rounded-full p-0.5"><X size={12} /></button>
                    </div>
                  ) : (
                    <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer hover:text-foreground" style={{ fontFamily: "Lato, sans-serif" }}>
                      <Upload size={13} /> {uploading ? "Uploading..." : "Upload image"}
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, (url) => setEditing({ ...editing, imageUrl: url }))} />
                    </label>
                  )}
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => updateMutation.mutate({ id: section.id, title: editing.title, description: editing.description, imageUrl: editing.imageUrl })} className="text-xs" style={{ background: "var(--bm-petrol)", fontFamily: "Lato, sans-serif" }}>Save</Button>
                    <Button size="sm" variant="outline" onClick={() => setEditing(null)} className="text-xs" style={{ fontFamily: "Lato, sans-serif" }}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  {section.imageUrl && <img src={section.imageUrl} className="w-16 h-12 object-cover rounded shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm mb-0.5" style={{ fontFamily: "Lato, sans-serif" }}>{section.title}</div>
                    {section.description && <p className="text-xs text-muted-foreground line-clamp-2" style={{ fontFamily: "Lato, sans-serif" }}>{section.description}</p>}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button size="sm" variant="ghost" onClick={() => setEditing({ ...section })} className="h-7 w-7 p-0"><Edit size={13} /></Button>
                    <Button size="sm" variant="ghost" onClick={() => { if (confirm("Delete this section?")) deleteMutation.mutate({ id: section.id }); }} className="h-7 w-7 p-0 text-destructive hover:text-destructive"><Trash2 size={13} /></Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add section form */}
      {showAdd && (
        <div className="bg-card border-2 rounded p-4 space-y-3" style={{ borderColor: "var(--bm-petrol)" }}>
          <h3 className="text-sm font-medium" style={{ fontFamily: "Lato, sans-serif", color: "var(--bm-petrol)" }}>New Section</h3>
          <Input value={newSection.title} onChange={(e) => setNewSection({ ...newSection, title: e.target.value })} placeholder="Section title (e.g. Kitchen)" className="h-9 text-sm" style={{ fontFamily: "Lato, sans-serif" }} />
          <Textarea value={newSection.description} onChange={(e) => setNewSection({ ...newSection, description: e.target.value })} placeholder="Describe what's included..." rows={3} className="text-sm resize-none" style={{ fontFamily: "Lato, sans-serif" }} />
          {newSection.imageUrl ? (
            <div className="relative w-32">
              <img src={newSection.imageUrl} className="w-32 h-20 object-cover rounded" />
              <button type="button" onClick={() => setNewSection({ ...newSection, imageUrl: "" })} className="absolute -top-1.5 -right-1.5 bg-black/60 text-white rounded-full p-0.5"><X size={12} /></button>
            </div>
          ) : (
            <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer hover:text-foreground" style={{ fontFamily: "Lato, sans-serif" }}>
              <Upload size={13} /> {uploading ? "Uploading..." : "Upload image"}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, (url) => setNewSection({ ...newSection, imageUrl: url }))} />
            </label>
          )}
          <div className="flex gap-2">
            <Button size="sm" onClick={() => createMutation.mutate({ projectId, title: newSection.title, description: newSection.description, imageUrl: newSection.imageUrl, position: sections?.length || 0 })} disabled={!newSection.title} className="text-xs" style={{ background: "var(--bm-petrol)", fontFamily: "Lato, sans-serif" }}>Add Section</Button>
            <Button size="sm" variant="outline" onClick={() => setShowAdd(false)} className="text-xs" style={{ fontFamily: "Lato, sans-serif" }}>Cancel</Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── BOQ Tab ──────────────────────────────────────────────────────────────────────────────
const CATEGORY_ORDER = ["Preliminaries", "Structural", "External", "Internal", "Electrical", "Plumbing", "HVAC", "Other"];

function BoqTab({ projectId }: { projectId: number }) {
  const utils = trpc.useUtils();
  const [selectedDocId, setSelectedDocId] = React.useState<number | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [polling, setPolling] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  const { data: documents, refetch: refetchDocs } = trpc.boq.listDocuments.useQuery(
    { projectId },
    { refetchInterval: polling ? 3000 : false }
  );
  const { data: items, refetch: refetchItems } = trpc.boq.getItems.useQuery(
    { boqDocumentId: selectedDocId! },
    { enabled: !!selectedDocId, refetchInterval: polling ? 3000 : false }
  );
  const confirmAllMutation = trpc.boq.confirmAll.useMutation({
    onSuccess: () => { toast.success("BOQ confirmed"); refetchDocs(); refetchItems(); },
    onError: (e) => toast.error(e.message),
  });
  const autoFillMutation = trpc.boq.autoFillQuantities.useMutation({
    onSuccess: (r) => { toast.success(`Auto-filled ${r.filledCount} quantity fields`); utils.quantities.get.invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.boq.deleteDocument.useMutation({
    onSuccess: () => { toast.success("Document deleted"); setSelectedDocId(null); refetchDocs(); },
    onError: (e) => toast.error(e.message),
  });
  const importToInclusionsMutation = trpc.boq.importToInclusions.useMutation({
    onSuccess: (r) => { toast.success(`Imported ${r.importedCount} items to Base Inclusions`); utils.inclusionMaster.listCategories.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  // Auto-select first doc
  React.useEffect(() => {
    if (documents && documents.length > 0 && !selectedDocId) {
      setSelectedDocId(documents[0].id);
    }
  }, [documents]);

  // Poll while extracting
  React.useEffect(() => {
    const doc = documents?.find(d => d.id === selectedDocId);
    if (doc?.status === "extracting" || doc?.status === "uploaded") {
      setPolling(true);
    } else {
      setPolling(false);
    }
  }, [documents, selectedDocId, items]);

  const selectedDoc = documents?.find(d => d.id === selectedDocId);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("projectId", String(projectId));
      const res = await fetch("/api/boq/upload", { method: "POST", body: formData, credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      toast.success("BOQ uploaded — extracting items...");
      await refetchDocs();
      setSelectedDocId(data.docId);
      setPolling(true);
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  // Group items by category
  const grouped = React.useMemo(() => {
    if (!items) return {};
    const map: Record<string, typeof items> = {};
    for (const item of items) {
      const cat = item.category || "Other";
      if (!map[cat]) map[cat] = [];
      map[cat].push(item);
    }
    return map;
  }, [items]);

  const sortedCategories = Object.keys(grouped).sort((a, b) => {
    const ai = CATEGORY_ORDER.indexOf(a);
    const bi = CATEGORY_ORDER.indexOf(b);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold" style={{ fontFamily: "Cormorant Garamond, serif" }}>Bill of Quantities</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Upload a PDF or Excel BOQ — AI will extract and categorise all line items automatically.</p>
        </div>
        <div className="flex gap-2">
          <input ref={fileRef} type="file" accept=".pdf,.xlsx,.xls,.csv" className="hidden" onChange={handleUpload} />
          <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Upload className="w-3 h-3 mr-1" />}
            {uploading ? "Uploading..." : "Upload BOQ"}
          </Button>
        </div>
      </div>

      {/* Document selector */}
      {documents && documents.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {documents.map(doc => (
            <button
              key={doc.id}
              onClick={() => setSelectedDocId(doc.id)}
              className={`px-3 py-1 rounded text-xs border transition-colors ${
                selectedDocId === doc.id ? "bg-foreground text-background" : "bg-background text-foreground hover:bg-muted"
              }`}
            >
              {doc.fileName}
            </button>
          ))}
        </div>
      )}

      {/* Status banner */}
      {selectedDoc && (
        <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
          selectedDoc.status === "extracting" || selectedDoc.status === "uploaded" ? "bg-amber-50 text-amber-800 border border-amber-200" :
          selectedDoc.status === "error" ? "bg-red-50 text-red-800 border border-red-200" :
          selectedDoc.status === "confirmed" ? "bg-green-50 text-green-800 border border-green-200" :
          "bg-blue-50 text-blue-800 border border-blue-200"
        }`}>
          {(selectedDoc.status === "extracting" || selectedDoc.status === "uploaded") && <Loader2 className="w-4 h-4 animate-spin" />}
          {selectedDoc.status === "error" && <AlertCircle className="w-4 h-4" />}
          {selectedDoc.status === "confirmed" && <CheckCheck className="w-4 h-4" />}
          {selectedDoc.status === "extracted" && <FileText className="w-4 h-4" />}
          <span>
            {selectedDoc.status === "extracting" || selectedDoc.status === "uploaded" ? "Extracting items from BOQ... This may take 30–60 seconds." :
             selectedDoc.status === "error" ? `Extraction failed: ${selectedDoc.extractionError || "Unknown error"}` :
             selectedDoc.status === "confirmed" ? `BOQ confirmed — ${items?.length || 0} items` :
             `${items?.length || 0} items extracted — review and confirm below`}
          </span>
          {(selectedDoc.status === "extracting" || selectedDoc.status === "uploaded") && (
            <Button size="sm" variant="ghost" className="ml-auto h-6 text-xs" onClick={() => refetchDocs()}>
              <RefreshCw className="w-3 h-3 mr-1" /> Refresh
            </Button>
          )}
        </div>
      )}

      {/* Action buttons */}
      {selectedDoc && (selectedDoc.status === "extracted" || selectedDoc.status === "confirmed") && items && items.length > 0 && (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => autoFillMutation.mutate({ boqDocumentId: selectedDocId!, projectId })} disabled={autoFillMutation.isPending}>
            <Wand2 className="w-3 h-3 mr-1" />
            {autoFillMutation.isPending ? "Filling..." : "Auto-fill Quantities"}
          </Button>
          {selectedDoc.status !== "confirmed" && (
            <Button size="sm" onClick={() => confirmAllMutation.mutate({ boqDocumentId: selectedDocId!, projectId })} disabled={confirmAllMutation.isPending}>
              <CheckCheck className="w-3 h-3 mr-1" />
              {confirmAllMutation.isPending ? "Confirming..." : "Confirm All Items"}
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => importToInclusionsMutation.mutate({ boqDocumentId: selectedDocId!, projectId })} disabled={importToInclusionsMutation.isPending}>
            <Layers className="w-3 h-3 mr-1" />
            {importToInclusionsMutation.isPending ? "Importing..." : "Import to Base Inclusions"}
          </Button>
          <Button size="sm" variant="ghost" className="ml-auto text-destructive hover:text-destructive" onClick={() => { if (confirm("Delete this BOQ document?")) deleteMutation.mutate({ id: selectedDocId! }); }}>
            <Trash2 className="w-3 h-3 mr-1" /> Delete
          </Button>
        </div>
      )}

      {/* Items table */}
      {items && items.length > 0 && sortedCategories.map(cat => (
        <div key={cat}>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 mt-4">{cat}</h4>
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-2 font-medium">Description</th>
                  <th className="text-left p-2 font-medium w-16">Unit</th>
                  <th className="text-left p-2 font-medium w-16">Qty</th>
                  <th className="text-left p-2 font-medium w-32">Maps to</th>
                </tr>
              </thead>
              <tbody>
                {grouped[cat].map(item => (
                  <tr key={item.id} className="border-t hover:bg-muted/20">
                    <td className="p-2">{item.description}</td>
                    <td className="p-2 text-muted-foreground">{item.unit || "—"}</td>
                    <td className="p-2 text-muted-foreground">{item.quantity || "—"}</td>
                    <td className="p-2">
                      {item.mappedQuantityField ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-green-100 text-green-800 text-[10px]">
                          <Check className="w-2.5 h-2.5" /> {item.mappedQuantityField}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {!documents?.length && (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No BOQ uploaded yet</p>
          <p className="text-xs mt-1">Upload a PDF or Excel BOQ to extract and categorise all line items</p>
        </div>
      )}
    </div>
  );
}

// ─── Quantities Tab ─────────────────────────────────────────────
function QuantitiesTab({ projectId }: { projectId: number }) {
  const utils = trpc.useUtils();
  const { data: qty } = trpc.quantities.get.useQuery({ projectId });
  const upsertMutation = trpc.quantities.upsert.useMutation({ onSuccess: () => { utils.quantities.get.invalidate(); toast.success("Quantities saved"); }, onError: (e) => toast.error(e.message) });

  // Exclusions
  const { data: exclusionsList } = trpc.exclusions.list.useQuery({ projectId });
  const createExclusionMutation = trpc.exclusions.create.useMutation({ onSuccess: () => { utils.exclusions.list.invalidate(); setNewExclusion(""); }, onError: (e) => toast.error(e.message) });
  const deleteExclusionMutation = trpc.exclusions.delete.useMutation({ onSuccess: () => utils.exclusions.list.invalidate(), onError: (e) => toast.error(e.message) });
  const updateExclusionMutation = trpc.exclusions.update.useMutation({ onSuccess: () => utils.exclusions.list.invalidate(), onError: (e) => toast.error(e.message) });

  // Provisional Sums
  const { data: psList } = trpc.provisionalSums.list.useQuery({ projectId });
  const createPsMutation = trpc.provisionalSums.create.useMutation({ onSuccess: () => { utils.provisionalSums.list.invalidate(); setNewPs({ description: "", amount: "", notes: "" }); }, onError: (e) => toast.error(e.message) });
  const deletePsMutation = trpc.provisionalSums.delete.useMutation({ onSuccess: () => utils.provisionalSums.list.invalidate(), onError: (e) => toast.error(e.message) });
  const updatePsMutation = trpc.provisionalSums.update.useMutation({ onSuccess: () => utils.provisionalSums.list.invalidate(), onError: (e) => toast.error(e.message) });

  const [form, setForm] = useState<Record<string, string>>({});
  const [initialised, setInitialised] = useState(false);
  const [newExclusion, setNewExclusion] = useState("");
  const [editingExclusion, setEditingExclusion] = useState<{ id: number; description: string } | null>(null);
  const [newPs, setNewPs] = useState({ description: "", amount: "", notes: "" });
  const [editingPs, setEditingPs] = useState<{ id: number; description: string; amount: string; notes: string } | null>(null);

  if (qty && !initialised) {
    const init: Record<string, string> = {};
    Object.entries(qty).forEach(([k, v]) => { if (v !== null && v !== undefined) init[k] = String(v); });
    setForm(init);
    setInitialised(true);
  }

  const numField = (label: string, key: string, unit = "") => (
    <div className="space-y-1">
      <Label className="text-xs" style={{ color: "var(--bm-bluegum)", fontFamily: "Lato, sans-serif" }}>{label}{unit && <span className="ml-1 opacity-60">{unit}</span>}</Label>
      <Input type="number" value={form[key] || ""} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} className="h-8 text-sm" step="any" style={{ fontFamily: "Lato, sans-serif" }} />
    </div>
  );

  const handleSave = () => {
    const data: Record<string, any> = { projectId };
    const intKeys = ["basinMixersQty","showerSetsQty","bathFillersQty","kitchenMixersQty","laundryMixersQty","toiletsQty","basinsQty","bathtubsQty","pantryUnitsQty","potDrawerStacksQty","utilityDrawerStacksQty","binPulloutQty","vanityQty","vanityWidthMm","robeDrawerPacksQty","internalDoorsQty","externalDoorsQty","doorHandlesQty","entranceHardwareQty","downlightsQty","pendantPointsQty","powerPointsQty","switchPlatesQty","dataPointsQty","exhaustFansQty","vanityStoneTopQty"];
    Object.entries(form).forEach(([k, v]) => {
      if (k === "projectId" || k === "id" || k === "createdAt" || k === "updatedAt") return;
      if (v === "" || v === null || v === undefined) { data[k] = null; return; }
      data[k] = intKeys.includes(k) ? parseInt(v) : v;
    });
    upsertMutation.mutate(data as any);
  };

  const section = (title: string, children: React.ReactNode) => (
    <div className="bg-card border rounded p-4 space-y-3" style={{ borderColor: "var(--border)" }}>
      <h3 className="text-xs tracking-wider uppercase font-medium" style={{ color: "var(--bm-petrol)", fontFamily: "Lato, sans-serif" }}>{title}</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">{children}</div>
    </div>
  );

  const listSection = (title: string, subtitle: string, children: React.ReactNode) => (
    <div className="bg-card border rounded p-4 space-y-3" style={{ borderColor: "var(--border)" }}>
      <div>
        <h3 className="text-xs tracking-wider uppercase font-medium" style={{ color: "var(--bm-petrol)", fontFamily: "Lato, sans-serif" }}>{title}</h3>
        <p className="text-xs text-muted-foreground mt-0.5" style={{ fontFamily: "Lato, sans-serif" }}>{subtitle}</p>
      </div>
      {children}
    </div>
  );

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground" style={{ fontFamily: "Lato, sans-serif" }}>
        Enter quantities to calculate upgrade pricing. This data does not affect the base contract price.
      </p>
      {section("Tiles", <>
        {numField("Floor Tile", "floorTileM2", "m²")}
        {numField("Wall Tile", "wallTileM2", "m²")}
        {numField("Shower Wall Tile", "showerWallTileM2", "m²")}
        {numField("Splashback Tile", "splashbackTileM2", "m²")}
        {numField("Feature Tile", "featureTileM2", "m²")}
        {numField("Wastage", "tileWastagePct", "%")}
        {numField("Base Tile Allowance", "baseTileAllowancePerM2", "$/m²")}
      </>)}
      {section("Fixtures", <>
        {numField("Basin Mixers", "basinMixersQty", "qty")}
        {numField("Shower Sets", "showerSetsQty", "qty")}
        {numField("Bath Fillers", "bathFillersQty", "qty")}
        {numField("Kitchen Mixers", "kitchenMixersQty", "qty")}
        {numField("Laundry Mixers", "laundryMixersQty", "qty")}
        {numField("Toilets", "toiletsQty", "qty")}
        {numField("Basins", "basinsQty", "qty")}
        {numField("Bathtubs", "bathtubsQty", "qty")}
      </>)}
      {section("Joinery", <>
        {numField("Kitchen Base Cabinetry", "kitchenBaseCabinetryLm", "lm")}
        {numField("Kitchen Overhead Cabinetry", "kitchenOverheadCabinetryLm", "lm")}
        {numField("Pantry Units", "pantryUnitsQty", "qty")}
        {numField("Pot Drawer Stacks", "potDrawerStacksQty", "qty")}
        {numField("Utility Drawer Stacks", "utilityDrawerStacksQty", "qty")}
        {numField("Bin Pullout", "binPulloutQty", "qty")}
        {numField("Vanity", "vanityQty", "qty")}
        {numField("Vanity Width", "vanityWidthMm", "mm")}
        {numField("Wardrobe", "wardrobeLm", "lm")}
        {numField("Robe Drawer Packs", "robeDrawerPacksQty", "qty")}
      </>)}
      {section("Doors & Hardware", <>
        {numField("Internal Doors", "internalDoorsQty", "qty")}
        {numField("External Doors", "externalDoorsQty", "qty")}
        {numField("Door Handles", "doorHandlesQty", "qty")}
        {numField("Entrance Hardware", "entranceHardwareQty", "qty")}
      </>)}
      {section("Electrical", <>
        {numField("Downlights", "downlightsQty", "qty")}
        {numField("Pendant Points", "pendantPointsQty", "qty")}
        {numField("Power Points", "powerPointsQty", "qty")}
        {numField("Switch Plates", "switchPlatesQty", "qty")}
        {numField("Data Points", "dataPointsQty", "qty")}
        {numField("Exhaust Fans", "exhaustFansQty", "qty")}
      </>)}
      {section("Flooring", <>
        {numField("Timber / Hybrid", "timberHybridM2", "m²")}
        {numField("Carpet", "carpetM2", "m²")}
        {numField("Skirting", "skirtingLm", "lm")}
      </>)}
      {section("Stone / Benchtops", <>
        {numField("Kitchen Benchtop", "kitchenBenchtopArea", "m²")}
        {numField("Island Benchtop", "islandBenchtopArea", "m²")}
        {numField("Vanity Stone Tops", "vanityStoneTopQty", "qty")}
        {numField("Stone Splashback", "stoneSplashbackArea", "m²")}
      </>)}
      {section("Allowances", <>
        {numField("Floor Tile Allowance", "floorTileAllowancePerM2", "$/m²")}
        {numField("Wall Tile Allowance", "wallTileAllowancePerM2", "$/m²")}
        {numField("Tapware Allowance", "tapwareAllowance", "$")}
        {numField("Sanitaryware Allowance", "sanitarywareAllowance", "$")}
        {numField("Joinery Allowance", "joineryAllowance", "$")}
        {numField("Stone Allowance", "stoneAllowance", "$")}
        {numField("Appliances Allowance", "appliancesAllowance", "$")}
      </>)}
      <Button onClick={handleSave} disabled={upsertMutation.isPending} className="text-xs tracking-wider uppercase gap-2" style={{ background: "var(--bm-petrol)", fontFamily: "Lato, sans-serif" }}>
        {upsertMutation.isPending ? "Saving..." : "Save Quantities"}
      </Button>

      {/* ─── Exclusions ─── */}
      {listSection("Exclusions", "Items explicitly excluded from the base contract scope.",
        <div className="space-y-2">
          {exclusionsList?.map((ex) => (
            <div key={ex.id} className="flex items-center gap-2">
              {editingExclusion?.id === ex.id ? (
                <>
                  <Input value={editingExclusion.description} onChange={(e) => setEditingExclusion((v) => v ? { ...v, description: e.target.value } : v)} className="h-8 text-sm flex-1" style={{ fontFamily: "Lato, sans-serif" }} />
                  <Button size="sm" onClick={() => { updateExclusionMutation.mutate({ id: ex.id, description: editingExclusion.description }); setEditingExclusion(null); }} className="h-8 text-xs" style={{ background: "var(--bm-petrol)" }}>Save</Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingExclusion(null)} className="h-8 text-xs">Cancel</Button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm" style={{ fontFamily: "Lato, sans-serif" }}>{ex.description}</span>
                  <Button size="sm" variant="ghost" onClick={() => setEditingExclusion({ id: ex.id, description: ex.description })} className="h-7 w-7 p-0"><Edit size={13} /></Button>
                  <Button size="sm" variant="ghost" onClick={() => deleteExclusionMutation.mutate({ id: ex.id })} className="h-7 w-7 p-0 text-destructive hover:text-destructive"><Trash2 size={13} /></Button>
                </>
              )}
            </div>
          ))}
          <div className="flex gap-2 mt-2">
            <Input value={newExclusion} onChange={(e) => setNewExclusion(e.target.value)} placeholder="Add exclusion item..." className="h-8 text-sm" style={{ fontFamily: "Lato, sans-serif" }} onKeyDown={(e) => { if (e.key === "Enter" && newExclusion) { createExclusionMutation.mutate({ projectId, description: newExclusion, position: exclusionsList?.length || 0 }); } }} />
            <Button size="sm" onClick={() => { if (newExclusion) createExclusionMutation.mutate({ projectId, description: newExclusion, position: exclusionsList?.length || 0 }); }} disabled={!newExclusion} className="h-8 gap-1 text-xs shrink-0" style={{ background: "var(--bm-petrol)" }}><Plus size={12} /> Add</Button>
          </div>
        </div>
      )}

      {/* ─── Provisional Sums ─── */}
      {listSection("Provisional Sums (PS)", "Estimated allowances for work that cannot be fully defined at tender stage.",
        <div className="space-y-2">
          {psList?.map((ps) => (
            <div key={ps.id} className="border rounded p-3 space-y-2" style={{ borderColor: "var(--border)" }}>
              {editingPs?.id === ps.id ? (
                <div className="space-y-2">
                  <Input value={editingPs.description} onChange={(e) => setEditingPs((v) => v ? { ...v, description: e.target.value } : v)} placeholder="Description" className="h-8 text-sm" style={{ fontFamily: "Lato, sans-serif" }} />
                  <div className="flex gap-2">
                    <Input value={editingPs.amount} onChange={(e) => setEditingPs((v) => v ? { ...v, amount: e.target.value } : v)} placeholder="Amount $" type="number" className="h-8 text-sm" style={{ fontFamily: "Lato, sans-serif" }} />
                    <Input value={editingPs.notes} onChange={(e) => setEditingPs((v) => v ? { ...v, notes: e.target.value } : v)} placeholder="Notes (optional)" className="h-8 text-sm" style={{ fontFamily: "Lato, sans-serif" }} />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => { updatePsMutation.mutate({ id: ps.id, description: editingPs.description, amount: editingPs.amount || null, notes: editingPs.notes || null }); setEditingPs(null); }} className="h-8 text-xs" style={{ background: "var(--bm-petrol)" }}>Save</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingPs(null)} className="h-8 text-xs">Cancel</Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <div className="text-sm font-medium" style={{ fontFamily: "Lato, sans-serif" }}>{ps.description}</div>
                    <div className="flex gap-3 mt-0.5">
                      {ps.amount && <span className="text-xs text-muted-foreground" style={{ fontFamily: "Lato, sans-serif" }}>Allowance: <strong>${Number(ps.amount).toLocaleString("en-AU")}</strong></span>}
                      {ps.notes && <span className="text-xs text-muted-foreground" style={{ fontFamily: "Lato, sans-serif" }}>{ps.notes}</span>}
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => setEditingPs({ id: ps.id, description: ps.description, amount: ps.amount || "", notes: ps.notes || "" })} className="h-7 w-7 p-0"><Edit size={13} /></Button>
                  <Button size="sm" variant="ghost" onClick={() => deletePsMutation.mutate({ id: ps.id })} className="h-7 w-7 p-0 text-destructive hover:text-destructive"><Trash2 size={13} /></Button>
                </div>
              )}
            </div>
          ))}
          <div className="border rounded p-3 space-y-2 bg-secondary/30" style={{ borderColor: "var(--border)" }}>
            <Input value={newPs.description} onChange={(e) => setNewPs((v) => ({ ...v, description: e.target.value }))} placeholder="PS description (e.g. Landscaping)" className="h-8 text-sm" style={{ fontFamily: "Lato, sans-serif" }} />
            <div className="flex gap-2">
              <Input value={newPs.amount} onChange={(e) => setNewPs((v) => ({ ...v, amount: e.target.value }))} placeholder="Allowance $" type="number" className="h-8 text-sm" style={{ fontFamily: "Lato, sans-serif" }} />
              <Input value={newPs.notes} onChange={(e) => setNewPs((v) => ({ ...v, notes: e.target.value }))} placeholder="Notes (optional)" className="h-8 text-sm" style={{ fontFamily: "Lato, sans-serif" }} />
            </div>
            <Button size="sm" onClick={() => { if (newPs.description) createPsMutation.mutate({ projectId, description: newPs.description, amount: newPs.amount || null, notes: newPs.notes || null, position: psList?.length || 0 }); }} disabled={!newPs.description} className="h-8 gap-1 text-xs" style={{ background: "var(--bm-petrol)" }}><Plus size={12} /> Add Provisional Sum</Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Upgrades Tab ─────────────────────────────────────────────────────────────
function UpgradesTab({ projectId }: { projectId: number }) {
  const utils = trpc.useUtils();
  const { data: groups } = trpc.upgrades.listGroups.useQuery({ projectId });
  const { data: options } = trpc.upgrades.listOptions.useQuery({ projectId });
  const createGroupMutation = trpc.upgrades.createGroup.useMutation({ onSuccess: () => { utils.upgrades.listGroups.invalidate(); setNewGroupName(""); }, onError: (e) => toast.error(e.message) });
  const deleteGroupMutation = trpc.upgrades.deleteGroup.useMutation({ onSuccess: () => { utils.upgrades.listGroups.invalidate(); utils.upgrades.listOptions.invalidate(); }, onError: (e) => toast.error(e.message) });
  const createOptionMutation = trpc.upgrades.createOption.useMutation({ onSuccess: () => { utils.upgrades.listOptions.invalidate(); setAddingToGroup(null); setNewOption({ optionName: "", description: "", imageUrl: "", isIncluded: false, priceDelta: "0" }); }, onError: (e) => toast.error(e.message) });
  const deleteOptionMutation = trpc.upgrades.deleteOption.useMutation({ onSuccess: () => utils.upgrades.listOptions.invalidate(), onError: (e) => toast.error(e.message) });
  const uploadMutation = trpc.upload.getUploadUrl.useMutation();

  const [newGroupName, setNewGroupName] = useState("");
  const [addingToGroup, setAddingToGroup] = useState<number | null>(null);
  const [newOption, setNewOption] = useState({ optionName: "", description: "", imageUrl: "", isIncluded: false, priceDelta: "0" });
  const [uploading, setUploading] = useState(false);

  const SUGGESTED_GROUPS = ["Tapware", "Stone", "Bath", "Toilet", "Joinery Upgrades", "Door Hardware", "Flooring Upgrades", "Appliances"];

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const base64 = (ev.target?.result as string).split(",")[1];
        const result = await uploadMutation.mutateAsync({ fileName: file.name, mimeType: file.type, fileData: base64, folder: "upgrades" });
        setNewOption((o) => ({ ...o, imageUrl: result.url }));
        toast.success("Image uploaded");
      } catch { toast.error("Upload failed"); }
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-4">
      {/* Add group */}
      <div className="flex gap-2">
        <Input value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} placeholder="New upgrade group name..." className="h-9 text-sm" style={{ fontFamily: "Lato, sans-serif" }} />
        <Button onClick={() => { if (newGroupName) createGroupMutation.mutate({ projectId, category: newGroupName, position: groups?.length || 0 }); }} disabled={!newGroupName} size="sm" className="gap-1.5 text-xs shrink-0" style={{ background: "var(--bm-petrol)", fontFamily: "Lato, sans-serif" }}>
          <Plus size={13} /> Add Group
        </Button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {SUGGESTED_GROUPS.map((g) => (
          <button key={g} onClick={() => setNewGroupName(g)} className="text-xs px-2.5 py-1 rounded-full border hover:border-[var(--bm-petrol)] hover:text-[var(--bm-petrol)] transition-colors" style={{ fontFamily: "Lato, sans-serif", borderColor: "var(--border)" }}>{g}</button>
        ))}
      </div>

      {/* Groups */}
      {groups?.map((group) => {
        const groupOptions = options?.filter((o) => o.groupId === group.id) || [];
        return (
          <div key={group.id} className="bg-card border rounded overflow-hidden" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--border)", background: "var(--bm-stone, oklch(93% 0.008 80))" }}>
              <span className="font-medium text-sm" style={{ fontFamily: "Lato, sans-serif", color: "var(--bm-petrol)" }}>{group.category}</span>
              <div className="flex items-center gap-1">
                <Button size="sm" variant="ghost" onClick={() => setAddingToGroup(group.id)} className="h-7 gap-1 text-xs" style={{ fontFamily: "Lato, sans-serif" }}><Plus size={12} /> Add Option</Button>
                <Button size="sm" variant="ghost" onClick={() => { if (confirm("Delete this group and all its options?")) deleteGroupMutation.mutate({ id: group.id }); }} className="h-7 w-7 p-0 text-destructive hover:text-destructive"><Trash2 size={13} /></Button>
              </div>
            </div>
            <div className="divide-y" style={{ borderColor: "var(--border)" }}>
              {groupOptions.map((opt) => (
                <div key={opt.id} className="flex items-start gap-3 px-4 py-3">
                  {opt.imageUrl && <img src={opt.imageUrl} className="w-12 h-10 object-cover rounded shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium" style={{ fontFamily: "Lato, sans-serif" }}>{opt.optionName}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${opt.isIncluded ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`} style={{ fontFamily: "Lato, sans-serif" }}>
                        {opt.isIncluded ? "Included" : "Upgrade"}
                      </span>
                      {!opt.isIncluded && Number(opt.priceDelta) > 0 && (
                        <span className="text-xs text-muted-foreground" style={{ fontFamily: "Lato, sans-serif" }}>+${Number(opt.priceDelta).toLocaleString("en-AU")}</span>
                      )}
                    </div>
                    {opt.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1" style={{ fontFamily: "Lato, sans-serif" }}>{opt.description}</p>}
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => { if (confirm("Delete this option?")) deleteOptionMutation.mutate({ id: opt.id }); }} className="h-7 w-7 p-0 text-destructive hover:text-destructive shrink-0"><Trash2 size={13} /></Button>
                </div>
              ))}
              {groupOptions.length === 0 && (
                <div className="px-4 py-3 text-xs text-muted-foreground" style={{ fontFamily: "Lato, sans-serif" }}>No options yet.</div>
              )}
            </div>

            {/* Add option form */}
            {addingToGroup === group.id && (
              <div className="px-4 py-4 border-t space-y-3" style={{ borderColor: "var(--bm-petrol)" }}>
                <h4 className="text-xs font-medium" style={{ color: "var(--bm-petrol)", fontFamily: "Lato, sans-serif" }}>New Option</h4>
                <div className="grid grid-cols-2 gap-3">
                  <Input value={newOption.optionName} onChange={(e) => setNewOption((o) => ({ ...o, optionName: e.target.value }))} placeholder="Option name" className="h-8 text-sm col-span-2" style={{ fontFamily: "Lato, sans-serif" }} />
                  <Textarea value={newOption.description} onChange={(e) => setNewOption((o) => ({ ...o, description: e.target.value }))} placeholder="Description" rows={2} className="text-sm resize-none col-span-2" style={{ fontFamily: "Lato, sans-serif" }} />
                  <div className="space-y-1">
                    <Label className="text-xs" style={{ fontFamily: "Lato, sans-serif" }}>Type</Label>
                    <Select value={newOption.isIncluded ? "included" : "upgrade"} onValueChange={(v) => setNewOption((o) => ({ ...o, isIncluded: v === "included" }))}>
                      <SelectTrigger className="h-8 text-xs" style={{ fontFamily: "Lato, sans-serif" }}><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="included">Included</SelectItem><SelectItem value="upgrade">Upgrade</SelectItem></SelectContent>
                    </Select>
                  </div>
                  {!newOption.isIncluded && (
                    <div className="space-y-1">
                      <Label className="text-xs" style={{ fontFamily: "Lato, sans-serif" }}>Price Delta ($)</Label>
                      <Input type="number" value={newOption.priceDelta} onChange={(e) => setNewOption((o) => ({ ...o, priceDelta: e.target.value }))} className="h-8 text-sm" style={{ fontFamily: "Lato, sans-serif" }} />
                    </div>
                  )}
                </div>
                {newOption.imageUrl ? (
                  <div className="relative w-24">
                    <img src={newOption.imageUrl} className="w-24 h-16 object-cover rounded" />
                    <button type="button" onClick={() => setNewOption((o) => ({ ...o, imageUrl: "" }))} className="absolute -top-1.5 -right-1.5 bg-black/60 text-white rounded-full p-0.5"><X size={12} /></button>
                  </div>
                ) : (
                  <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer hover:text-foreground" style={{ fontFamily: "Lato, sans-serif" }}>
                    <Upload size={13} /> {uploading ? "Uploading..." : "Upload image (optional)"}
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>
                )}
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => createOptionMutation.mutate({ groupId: group.id, projectId, optionName: newOption.optionName, description: newOption.description, imageUrl: newOption.imageUrl, isIncluded: newOption.isIncluded, priceDelta: newOption.priceDelta, position: groupOptions.length })} disabled={!newOption.optionName} className="text-xs" style={{ background: "var(--bm-petrol)", fontFamily: "Lato, sans-serif" }}>Add Option</Button>
                  <Button size="sm" variant="outline" onClick={() => setAddingToGroup(null)} className="text-xs" style={{ fontFamily: "Lato, sans-serif" }}>Cancel</Button>
                </div>
              </div>
            )}
          </div>
        );
      })}
      {(!groups || groups.length === 0) && (
        <div className="text-center py-10 text-sm text-muted-foreground" style={{ fontFamily: "Lato, sans-serif" }}>No upgrade groups yet. Add a group above.</div>
      )}
    </div>
  );
}

// ─── Client Portal Tab ────────────────────────────────────────────────────────
function ClientPortalTab({ projectId, project }: { projectId: number; project: any }) {
  const utils = trpc.useUtils();
  const { data: tokens } = trpc.projects.getClientTokens.useQuery({ projectId });
  const { data: submissions } = trpc.upgrades.getSubmissions.useQuery({ projectId });
  const { data: files } = trpc.inbox.listFiles.useQuery({ projectId });
  const { data: changeReqs } = trpc.inbox.listByProject.useQuery({ projectId });
  const generateLinkMutation = trpc.projects.generateClientLink.useMutation({ onSuccess: () => utils.projects.getClientTokens.invalidate(), onError: (e) => toast.error(e.message) });
  const lockMutation = trpc.projects.lockPortal.useMutation({ onSuccess: () => { utils.projects.get.invalidate(); toast.success(project.portalLockedAt ? "Portal unlocked" : "Portal locked"); }, onError: (e) => toast.error(e.message) });

  const [copied, setCopied] = useState<string | null>(null);

  const copyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(url);
    setTimeout(() => setCopied(null), 2000);
    toast.success("Link copied");
  };

  const generateLink = () => {
    generateLinkMutation.mutate({ projectId, origin: window.location.origin });
  };

  return (
    <div className="space-y-6">
      {/* Access links */}
      <div className="bg-card border rounded p-4" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium" style={{ fontFamily: "Lato, sans-serif", color: "var(--bm-petrol)" }}>Client Access Links</h3>
          <Button size="sm" onClick={generateLink} disabled={generateLinkMutation.isPending} className="gap-1.5 text-xs" style={{ background: "var(--bm-petrol)", fontFamily: "Lato, sans-serif" }}>
            <Link2 size={13} /> Generate Link
          </Button>
        </div>
        {tokens?.length === 0 ? (
          <p className="text-xs text-muted-foreground" style={{ fontFamily: "Lato, sans-serif" }}>No access links generated yet.</p>
        ) : (
          <div className="space-y-2">
            {tokens?.map((t) => {
              const url = `${window.location.origin}/portal/${t.token}`;
              return (
                <div key={t.id} className="flex items-center gap-2 bg-secondary rounded px-3 py-2">
                  <code className="text-xs flex-1 truncate" style={{ fontFamily: "monospace" }}>{url}</code>
                  <button onClick={() => copyLink(url)} className="shrink-0 text-muted-foreground hover:text-foreground">
                    {copied === url ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                  </button>
                  <a href={url} target="_blank" rel="noopener noreferrer" className="shrink-0 text-muted-foreground hover:text-foreground">
                    <ExternalLink size={14} />
                  </a>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Lock/unlock */}
      <div className="bg-card border rounded p-4 flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
        <div>
          <div className="text-sm font-medium mb-0.5" style={{ fontFamily: "Lato, sans-serif" }}>Portal Access</div>
          <div className="text-xs text-muted-foreground" style={{ fontFamily: "Lato, sans-serif" }}>
            {project.portalLockedAt ? `Locked on ${new Date(project.portalLockedAt).toLocaleDateString("en-AU")}` : "Portal is open for client access"}
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => lockMutation.mutate({ id: projectId, lock: !project.portalLockedAt })}
          disabled={lockMutation.isPending}
          className="gap-1.5 text-xs"
          style={{ fontFamily: "Lato, sans-serif" }}
        >
          {project.portalLockedAt ? <><Unlock size={13} /> Unlock Portal</> : <><Lock size={13} /> Lock Portal</>}
        </Button>
      </div>

      {/* Submissions */}
      {submissions && submissions.length > 0 && (
        <div className="bg-card border rounded p-4" style={{ borderColor: "var(--border)" }}>
          <h3 className="text-sm font-medium mb-3" style={{ fontFamily: "Lato, sans-serif", color: "var(--bm-petrol)" }}>Upgrade Submissions</h3>
          <div className="space-y-2">
            {submissions.map((sub) => (
              <div key={sub.id} className="flex items-center justify-between bg-secondary rounded px-3 py-2 text-sm">
                <span style={{ fontFamily: "Lato, sans-serif" }}>{new Date(sub.submittedAt).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}</span>
                <span className="font-medium" style={{ fontFamily: "Lato, sans-serif", color: "var(--bm-petrol)" }}>
                  ${Number(sub.totalUpgradeCost).toLocaleString("en-AU")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Uploaded files */}
      {files && files.length > 0 && (
        <div className="bg-card border rounded p-4" style={{ borderColor: "var(--border)" }}>
          <h3 className="text-sm font-medium mb-3" style={{ fontFamily: "Lato, sans-serif", color: "var(--bm-petrol)" }}>Client Uploaded Files</h3>
          <div className="space-y-2">
            {files.map((f) => (
              <div key={f.id} className="flex items-center justify-between bg-secondary rounded px-3 py-2">
                <span className="text-sm truncate" style={{ fontFamily: "Lato, sans-serif" }}>{f.fileName}</span>
                <a href={f.fileUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground shrink-0 ml-2">
                  <ExternalLink size={14} />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Change requests */}
      {changeReqs && changeReqs.length > 0 && (
        <div className="bg-card border rounded p-4" style={{ borderColor: "var(--border)" }}>
          <h3 className="text-sm font-medium mb-3" style={{ fontFamily: "Lato, sans-serif", color: "var(--bm-petrol)" }}>Change Requests</h3>
          <div className="space-y-2">
            {changeReqs.map((req) => (
              <div key={req.id} className="bg-secondary rounded px-3 py-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium" style={{ fontFamily: "Lato, sans-serif" }}>{req.category}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${req.status === "pending" ? "bg-amber-50 text-amber-700" : req.status === "actioned" ? "bg-green-50 text-green-700" : "bg-blue-50 text-blue-700"}`} style={{ fontFamily: "Lato, sans-serif" }}>{req.status}</span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2" style={{ fontFamily: "Lato, sans-serif" }}>{req.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Apply Package Dialog ─────────────────────────────────────────────────────────────────
function ApplyPackageDialog({ projectId, onApplied }: { projectId: number; onApplied: () => void }) {
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [previewId, setPreviewId] = useState<number | null>(null);
  const { data: packages } = trpc.packages.list.useQuery();
  const { data: preview } = trpc.packages.get.useQuery(
    { id: previewId! },
    { enabled: previewId !== null }
  );
  const applyMutation = trpc.packages.applyPackage.useMutation({
    onSuccess: (res) => {
      toast.success(`Package applied — ${res.sectionsCreated} sections added`);
      onApplied();
      setOpen(false);
      setSelectedId(null);
      setPreviewId(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const TIER_BADGE: Record<string, string> = {
    entry: "bg-slate-100 text-slate-700",
    mid: "bg-amber-100 text-amber-700",
    premium: "bg-purple-100 text-purple-700",
  };
  const TIER_LABEL: Record<string, string> = { entry: "Entry", mid: "Mid", premium: "Premium" };

  // Group preview items by section
  const previewSections = preview?.items
    ? Object.entries(
        preview.items.reduce((acc: Record<string, typeof preview.items>, item) => {
          if (!acc[item.section]) acc[item.section] = [];
          acc[item.section].push(item);
          return acc;
        }, {})
      )
    : [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5 text-xs" style={{ fontFamily: "Lato, sans-serif" }}>
          <Package size={13} /> Apply Standard Package
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle style={{ fontFamily: "Playfair Display, serif" }}>Apply Standard Package</DialogTitle>
          <p className="text-sm text-muted-foreground" style={{ fontFamily: "Lato, sans-serif" }}>
            Selecting a package will add its inclusions as sections to this project. You can edit or remove them afterwards.
          </p>
        </DialogHeader>

        {/* Package cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
          {packages?.map((pkg) => (
            <button
              key={pkg.id}
              onClick={() => { setSelectedId(pkg.id); setPreviewId(pkg.id); }}
              className={`relative text-left rounded-lg border-2 p-3 transition-all ${
                selectedId === pkg.id
                  ? "border-[var(--bm-petrol)] bg-[var(--bm-petrol)]/5"
                  : "border-border hover:border-[var(--bm-petrol)]/50"
              }`}
            >
              {pkg.isRecommended && (
                <div className="absolute -top-2.5 left-3 flex items-center gap-1 bg-amber-400 text-amber-900 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                  <Sparkles size={9} /> Recommended
                </div>
              )}
              {pkg.heroImageUrl && (
                <img src={pkg.heroImageUrl} className="w-full h-24 object-cover rounded mb-2" alt={pkg.name} />
              )}
              <div className="flex items-start justify-between gap-1 mb-1">
                <span className="font-semibold text-sm" style={{ fontFamily: "Playfair Display, serif" }}>{pkg.name}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ${TIER_BADGE[pkg.tier] || ""}`}>
                  {TIER_LABEL[pkg.tier]}
                </span>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2" style={{ fontFamily: "Lato, sans-serif" }}>{pkg.tagline}</p>
            </button>
          ))}
        </div>

        {/* Preview of selected package */}
        {preview && previewSections.length > 0 && (
          <div className="mt-4 border rounded-lg p-4 bg-muted/30">
            <h4 className="text-sm font-semibold mb-3" style={{ fontFamily: "Playfair Display, serif" }}>
              {preview.name} — Inclusions Preview
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {previewSections.map(([section, items]) => (
                <div key={section} className="bg-card rounded p-3 border">
                  <div className="flex items-center gap-2 mb-2">
                    {items.find((i) => i.imageUrl) && (
                      <img src={items.find((i) => i.imageUrl)!.imageUrl!} className="w-10 h-8 object-cover rounded" />
                    )}
                    <span className="text-xs font-semibold" style={{ fontFamily: "Lato, sans-serif" }}>{section}</span>
                  </div>
                  <ul className="space-y-0.5">
                    {items.map((item) => (
                      <li key={item.id} className="text-xs text-muted-foreground flex items-start gap-1.5">
                        <span className="mt-0.5 shrink-0 text-[var(--bm-petrol)]">&#8226;</span>
                        {item.item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" size="sm" onClick={() => setOpen(false)} style={{ fontFamily: "Lato, sans-serif" }}>Cancel</Button>
          <Button
            size="sm"
            disabled={!selectedId || applyMutation.isPending}
            onClick={() => selectedId && applyMutation.mutate({ projectId, packageId: selectedId })}
            style={{ background: "var(--bm-petrol)", fontFamily: "Lato, sans-serif" }}
          >
            {applyMutation.isPending ? "Applying..." : "Apply Package"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Inclusions Tab ─────────────────────────────────────────────────────────────────────
function PlanImagesTab({ projectId }: { projectId: number }) {
  const utils = trpc.useUtils();
  const { data: images } = trpc.planImages.list.useQuery({ projectId });
  const createMutation = trpc.planImages.create.useMutation({ onSuccess: () => { utils.planImages.list.invalidate(); setNewTitle(""); setNewImageUrl(""); }, onError: (e) => toast.error(e.message) });
  const deleteMutation = trpc.planImages.delete.useMutation({ onSuccess: () => utils.planImages.list.invalidate(), onError: (e) => toast.error(e.message) });
  const uploadMutation = trpc.upload.getUploadUrl.useMutation();

  const [newTitle, setNewTitle] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const base64 = (ev.target?.result as string).split(",")[1];
        const result = await uploadMutation.mutateAsync({ fileName: file.name, mimeType: file.type, fileData: base64, folder: "plans" });
        setNewImageUrl(result.url);
        toast.success("Image uploaded");
      } catch { toast.error("Upload failed"); }
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground" style={{ fontFamily: "Lato, sans-serif" }}>Upload plan drawings, screenshots, or site images to include in the PDF proposal.</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {images?.map((img) => (
          <div key={img.id} className="relative group rounded overflow-hidden border" style={{ borderColor: "var(--border)" }}>
            <img src={img.imageUrl} alt={img.title || "Plan"} className="w-full aspect-[4/3] object-cover" />
            {img.title && <div className="px-2 py-1.5 text-xs font-medium truncate" style={{ fontFamily: "Lato, sans-serif", color: "var(--bm-petrol)" }}>{img.title}</div>}
            <button onClick={() => { if (confirm("Remove this image?")) deleteMutation.mutate({ id: img.id }); }} className="absolute top-1.5 right-1.5 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Trash2 size={12} />
            </button>
          </div>
        ))}
      </div>
      <div className="bg-card border rounded p-4 space-y-3" style={{ borderColor: "var(--border)" }}>
        <h3 className="text-xs tracking-wider uppercase font-medium" style={{ color: "var(--bm-petrol)", fontFamily: "Lato, sans-serif" }}>Add Plan Image</h3>
        <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Image title (optional, e.g. Ground Floor Plan)" className="h-8 text-sm" style={{ fontFamily: "Lato, sans-serif" }} />
        {newImageUrl ? (
          <div className="relative w-40">
            <img src={newImageUrl} className="w-40 h-28 object-cover rounded" />
            <button type="button" onClick={() => setNewImageUrl("")} className="absolute -top-1.5 -right-1.5 bg-black/60 text-white rounded-full p-0.5"><X size={12} /></button>
          </div>
        ) : (
          <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer hover:text-foreground" style={{ fontFamily: "Lato, sans-serif" }}>
            <Upload size={14} /> {uploading ? "Uploading..." : "Click to upload plan image"}
            <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
          </label>
        )}
        <Button onClick={() => { if (newImageUrl) createMutation.mutate({ projectId, title: newTitle || null, imageUrl: newImageUrl, position: images?.length || 0 }); }} disabled={!newImageUrl || createMutation.isPending} className="gap-1.5 text-xs" style={{ background: "var(--bm-petrol)", fontFamily: "Lato, sans-serif" }}>
          <Plus size={13} /> Add Image
        </Button>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────────────
export default function AdminProjectDetail() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const projectId = parseInt(params.id);

  const { data: project, isLoading } = trpc.projects.get.useQuery({ id: projectId });
  const deleteProjectMutation = trpc.projects.delete.useMutation({
    onSuccess: () => { toast.success("Project deleted"); navigate("/admin"); },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <AdminLayout breadcrumbs={[{ label: "Dashboard", href: "/admin" }, { label: "Loading..." }]}>
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-[var(--bm-petrol)] border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  if (!project) {
    return (
      <AdminLayout breadcrumbs={[{ label: "Dashboard", href: "/admin" }, { label: "Not Found" }]}>
        <div className="text-center py-20 text-muted-foreground" style={{ fontFamily: "Lato, sans-serif" }}>Project not found.</div>
      </AdminLayout>
    );
  }


  return (
    <AdminLayout
      breadcrumbs={[
        { label: "Dashboard", href: "/admin" },
        { label: project.clientName },
      ]}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1 flex-wrap">
            <h1 className="text-xl" style={{ fontFamily: "'Playfair Display SC', Georgia, serif", color: "var(--bm-petrol)" }}>
              {project.clientName}
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground" style={{ fontFamily: "Lato, sans-serif" }}>
              {STATUS_LABELS[project.status] || project.status}
            </span>
          </div>
          <div className="text-sm text-muted-foreground" style={{ fontFamily: "Lato, sans-serif" }}>
            {project.projectAddress} &bull; #{project.proposalNumber}
          </div>
          {project.baseContractPrice && (
            <div className="text-sm mt-1" style={{ fontFamily: "Lato, sans-serif", color: "var(--bm-petrol)" }}>
              Base Contract: <strong>${Number(project.baseContractPrice).toLocaleString("en-AU")}</strong>
            </div>
          )}
        </div>
        <div className="flex gap-2 shrink-0">
          <PdfDownloadButton projectId={projectId} proposalNumber={project.proposalNumber} />
          <Button
            onClick={() => navigate(`/admin/projects/${projectId}/edit`)}
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            style={{ fontFamily: "Lato, sans-serif" }}
          >
            <Edit size={13} /> Edit
          </Button>
          <Button
            onClick={() => {
              if (confirm(`Delete "${project.clientName}"? This cannot be undone.`)) {
                deleteProjectMutation.mutate({ id: projectId });
              }
            }}
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
            style={{ fontFamily: "Lato, sans-serif" }}
            disabled={deleteProjectMutation.isPending}
          >
            <Trash2 size={13} /> Delete
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="inclusions">
        <TabsList className="mb-6 h-9 flex-wrap">
          {["inclusions", "boq", "upgrades", "plans", "portal"].map((tab) => (
            <TabsTrigger key={tab} value={tab} className="text-xs" style={{ fontFamily: "Lato, sans-serif" }}>
              {tab === "portal" ? "Client Portal" : tab === "plans" ? "Plan Images" : tab === "boq" ? "BOQ" : tab === "inclusions" ? "Base Inclusions" : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="inclusions"><BaseInclusionsTab projectId={projectId} /></TabsContent>
        <TabsContent value="quantities"><QuantitiesTab projectId={projectId} /></TabsContent>
        <TabsContent value="boq"><BoqTab projectId={projectId} /></TabsContent>
        <TabsContent value="upgrades"><UpgradesTab projectId={projectId} /></TabsContent>
        <TabsContent value="plans"><PlanImagesTab projectId={projectId} /></TabsContent>
        <TabsContent value="portal"><ClientPortalTab projectId={projectId} project={project} /></TabsContent>
      </Tabs>
    </AdminLayout>
  );
}
