import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { FileText, Plus, Loader2, Trash2, Download, FileSignature, Upload } from "lucide-react";

const DOC_CATEGORIES = ["Contract", "Plans", "Specifications", "Variation", "Permit", "Certificate", "Invoice", "Other"];

export default function AdminDocumentsTab({ projectId }: { projectId: number }) {
  const { data: docs, isLoading } = trpc.documents.list.useQuery({ projectId });
  const utils = trpc.useUtils();
  const uploadMut = trpc.upload.getUploadUrl.useMutation();
  const createMut = trpc.documents.create.useMutation({
    onSuccess: () => { utils.documents.list.invalidate({ projectId }); toast.success("Document uploaded"); setOpen(false); resetForm(); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMut = trpc.documents.delete.useMutation({
    onSuccess: () => { utils.documents.list.invalidate({ projectId }); toast.success("Document deleted"); },
    onError: (e) => toast.error(e.message),
  });

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Contract");
  const [requiresSignature, setRequiresSignature] = useState(false);
  const [fileUrl, setFileUrl] = useState("");
  const [fileKey, setFileKey] = useState("");
  const [mimeType, setMimeType] = useState("");
  const [fileSize, setFileSize] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState("");

  const resetForm = () => { setTitle(""); setCategory("Contract"); setRequiresSignature(false); setFileUrl(""); setFileKey(""); setMimeType(""); setFileSize(0); setFileName(""); };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) { toast.error("File must be under 20MB"); return; }
    setUploading(true);
    try {
      const base64 = await new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res((r.result as string).split(",")[1]); r.onerror = rej; r.readAsDataURL(file); });
      const result = await uploadMut.mutateAsync({ fileName: file.name, mimeType: file.type, fileData: base64, folder: "documents" });
      setFileUrl(result.url); setFileKey(result.key); setMimeType(file.type); setFileSize(file.size); setFileName(file.name);
      if (!title) setTitle(file.name.replace(/\.[^/.]+$/, ""));
    } catch { toast.error("Upload failed"); }
    finally { setUploading(false); e.target.value = ""; }
  };

  const handleCreate = () => {
    if (!title.trim()) { toast.error("Title is required"); return; }
    if (!fileUrl) { toast.error("Please upload a file"); return; }
    createMut.mutate({ projectId, title: title.trim(), category, fileUrl, fileKey, mimeType: mimeType || undefined, fileSizeBytes: fileSize || undefined, requiresSignature });
  };

  const formatSize = (bytes: number) => {
    if (!bytes) return "";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#203E4A]">Documents</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm" className="gap-1.5" style={{ background: "#203E4A" }}><Plus size={14} /> Upload Document</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Upload Document</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium mb-1">File *</p>
                {fileUrl ? (
                  <div className="flex items-center gap-2 p-2 rounded border bg-gray-50">
                    <FileText size={16} className="text-muted-foreground" />
                    <span className="text-xs flex-1 truncate">{fileName}</span>
                    <span className="text-[10px] text-muted-foreground">{formatSize(fileSize)}</span>
                    <button onClick={() => { setFileUrl(""); setFileKey(""); setFileName(""); }} className="text-xs text-red-500">Remove</button>
                  </div>
                ) : (
                  <label className="h-20 rounded border-2 border-dashed flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 text-muted-foreground">
                    {uploading ? <Loader2 size={16} className="animate-spin" /> : <><Upload size={18} /><span className="text-[10px] mt-1">Click to upload (PDF, DOC, images, etc.)</span></>}
                    <input type="file" className="hidden" onChange={handleFileUpload} accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif" />
                  </label>
                )}
              </div>
              <Input placeholder="Document Title *" value={title} onChange={e => setTitle(e.target.value)} />
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                <SelectContent>{DOC_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <Switch checked={requiresSignature} onCheckedChange={setRequiresSignature} />
                <span className="text-xs">Requires client signature</span>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <DialogClose asChild><Button variant="outline" size="sm">Cancel</Button></DialogClose>
                <Button size="sm" onClick={handleCreate} disabled={createMut.isPending} style={{ background: "#203E4A" }}>
                  {createMut.isPending ? <Loader2 size={14} className="animate-spin mr-1" /> : null} Upload
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : !docs?.length ? (
        <Card><CardContent className="py-8 text-center text-sm text-muted-foreground"><FileText size={24} className="mx-auto mb-2 opacity-40" />No documents yet.</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {docs.map((d: any) => (
            <Card key={d.id}>
              <CardContent className="p-3 flex items-center gap-3">
                <FileText size={20} className="text-[#203E4A] shrink-0" />
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium truncate">{d.title}</h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">{d.category}</span>
                    <span className="text-[10px] text-muted-foreground">{new Date(d.createdAt).toLocaleDateString("en-AU")}</span>
                    {d.fileSizeBytes && <span className="text-[10px] text-muted-foreground">{formatSize(d.fileSizeBytes)}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {d.requiresSignature && (
                    d.clientSignature
                      ? <Badge variant="default" className="gap-1 text-[10px]"><FileSignature size={10} />Signed</Badge>
                      : <Badge variant="secondary" className="gap-1 text-[10px]"><FileSignature size={10} />Awaiting</Badge>
                  )}
                  <a href={d.fileUrl} target="_blank" rel="noopener noreferrer"><Button variant="ghost" size="sm" className="h-7 w-7 p-0"><Download size={14} /></Button></a>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500 hover:text-red-700" onClick={() => { if (confirm("Delete this document?")) deleteMut.mutate({ id: d.id }); }}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
