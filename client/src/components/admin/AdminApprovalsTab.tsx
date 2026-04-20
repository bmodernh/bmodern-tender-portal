import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { CheckSquare, Plus, Loader2, Clock, CheckCircle2, AlertTriangle, Image as ImageIcon } from "lucide-react";

function useUpload(folder: string) {
  const [uploading, setUploading] = useState(false);
  const mut = trpc.upload.getUploadUrl.useMutation();
  const upload = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) { toast.error("File must be under 10MB"); return null; }
    setUploading(true);
    try {
      const base64 = await new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res((r.result as string).split(",")[1]); r.onerror = rej; r.readAsDataURL(file); });
      return await mut.mutateAsync({ fileName: file.name, mimeType: file.type, fileData: base64, folder });
    } catch { toast.error("Upload failed"); return null; }
    finally { setUploading(false); }
  };
  return { upload, uploading };
}

const STATUS_BADGE: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: any }> = {
  pending: { label: "Pending", variant: "secondary", icon: Clock },
  approved: { label: "Approved", variant: "default", icon: CheckCircle2 },
  change_requested: { label: "Change Requested", variant: "destructive", icon: AlertTriangle },
};

export default function AdminApprovalsTab({ projectId }: { projectId: number }) {
  const { data: approvals, isLoading } = trpc.approvals.list.useQuery({ projectId });
  const utils = trpc.useUtils();
  const createMut = trpc.approvals.create.useMutation({
    onSuccess: () => { utils.approvals.list.invalidate({ projectId }); toast.success("Approval request created"); setOpen(false); resetForm(); },
    onError: (e) => toast.error(e.message),
  });

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [sitePhotoUrl, setSitePhotoUrl] = useState("");
  const [planImageUrl, setPlanImageUrl] = useState("");
  const { upload: uploadSite, uploading: uploadingSite } = useUpload("approvals/site");
  const { upload: uploadPlan, uploading: uploadingPlan } = useUpload("approvals/plan");

  const resetForm = () => { setTitle(""); setDescription(""); setCategory(""); setSitePhotoUrl(""); setPlanImageUrl(""); };

  const handleCreate = () => {
    if (!title.trim()) { toast.error("Title is required"); return; }
    createMut.mutate({
      projectId, title: title.trim(), description: description.trim() || undefined,
      category: category.trim() || undefined, sitePhotoUrl: sitePhotoUrl || undefined, planImageUrl: planImageUrl || undefined,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#203E4A]">Approval Requests</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm" className="gap-1.5" style={{ background: "#203E4A" }}><Plus size={14} /> New Request</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Create Approval Request</DialogTitle></DialogHeader>
            <p className="text-xs text-muted-foreground">Ask the client to approve a decision — e.g. fixture location, colour choice, or layout change.</p>
            <div className="space-y-3 mt-2">
              <Input placeholder="Title * (e.g. Kitchen mixer location)" value={title} onChange={e => setTitle(e.target.value)} />
              <Textarea placeholder="Description — explain what needs approval" value={description} onChange={e => setDescription(e.target.value)} rows={3} />
              <Input placeholder="Category (e.g. Plumbing, Electrical)" value={category} onChange={e => setCategory(e.target.value)} />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-medium mb-1">Site Photo</p>
                  {sitePhotoUrl ? (
                    <div className="relative"><img src={sitePhotoUrl} alt="" className="w-full h-28 object-cover rounded border" /><button onClick={() => setSitePhotoUrl("")} className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5 text-white text-xs">✕</button></div>
                  ) : (
                    <label className="h-28 rounded border-2 border-dashed flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 text-muted-foreground">
                      {uploadingSite ? <Loader2 size={16} className="animate-spin" /> : <><ImageIcon size={18} /><span className="text-[10px] mt-1">Upload site photo</span></>}
                      <input type="file" accept="image/*" className="hidden" onChange={async e => { const f = e.target.files?.[0]; if (f) { const r = await uploadSite(f); if (r) setSitePhotoUrl(r.url); } e.target.value = ""; }} />
                    </label>
                  )}
                </div>
                <div>
                  <p className="text-xs font-medium mb-1">Plan Image</p>
                  {planImageUrl ? (
                    <div className="relative"><img src={planImageUrl} alt="" className="w-full h-28 object-cover rounded border" /><button onClick={() => setPlanImageUrl("")} className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5 text-white text-xs">✕</button></div>
                  ) : (
                    <label className="h-28 rounded border-2 border-dashed flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 text-muted-foreground">
                      {uploadingPlan ? <Loader2 size={16} className="animate-spin" /> : <><ImageIcon size={18} /><span className="text-[10px] mt-1">Upload plan</span></>}
                      <input type="file" accept="image/*" className="hidden" onChange={async e => { const f = e.target.files?.[0]; if (f) { const r = await uploadPlan(f); if (r) setPlanImageUrl(r.url); } e.target.value = ""; }} />
                    </label>
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <DialogClose asChild><Button variant="outline" size="sm">Cancel</Button></DialogClose>
                <Button size="sm" onClick={handleCreate} disabled={createMut.isPending} style={{ background: "#203E4A" }}>
                  {createMut.isPending ? <Loader2 size={14} className="animate-spin mr-1" /> : null} Send to Client
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : !approvals?.length ? (
        <Card><CardContent className="py-8 text-center text-sm text-muted-foreground"><CheckSquare size={24} className="mx-auto mb-2 opacity-40" />No approval requests yet.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {approvals.map((a: any) => {
            const s = STATUS_BADGE[a.status] || STATUS_BADGE.pending;
            const Icon = s.icon;
            return (
              <Card key={a.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-[#203E4A]">{a.title}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground">{new Date(a.createdAt).toLocaleDateString("en-AU")}</span>
                        {a.category && <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">{a.category}</span>}
                      </div>
                    </div>
                    <Badge variant={s.variant} className="gap-1"><Icon size={12} />{s.label}</Badge>
                  </div>
                  {a.description && <p className="text-xs text-muted-foreground mt-2 whitespace-pre-wrap">{a.description}</p>}
                  <div className="flex gap-3 mt-3">
                    {a.sitePhotoUrl && <img src={a.sitePhotoUrl} alt="Site" className="w-32 h-24 rounded object-cover border" />}
                    {a.planImageUrl && <img src={a.planImageUrl} alt="Plan" className="w-32 h-24 rounded object-cover border" />}
                  </div>
                  {a.clientResponse && (
                    <div className="mt-3 p-2 rounded bg-gray-50 text-xs">
                      <span className="font-medium">Client response:</span> {a.clientResponse}
                      {a.respondedBy && <span className="text-muted-foreground ml-1">— {a.respondedBy}</span>}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
