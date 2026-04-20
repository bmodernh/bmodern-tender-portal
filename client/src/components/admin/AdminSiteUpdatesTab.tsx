import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, Plus, Loader2, X, Send, MessageSquare } from "lucide-react";

const BUILD_STAGES = ["Site Prep", "Slab", "Frame", "Lockup", "Fixout", "Finishing", "Handover", "Other"];

function useUpload(folder: string) {
  const [uploading, setUploading] = useState(false);
  const mut = trpc.upload.getUploadUrl.useMutation();
  const upload = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) { toast.error("File must be under 10MB"); return null; }
    setUploading(true);
    try {
      const base64 = await new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res((r.result as string).split(",")[1]); r.onerror = rej; r.readAsDataURL(file); });
      return await mut.mutateAsync({ fileName: file.name, mimeType: file.type, fileData: base64, folder });
    } catch (e: any) { toast.error("Upload failed"); return null; }
    finally { setUploading(false); }
  };
  return { upload, uploading };
}

export default function AdminSiteUpdatesTab({ projectId }: { projectId: number }) {
  const { data: updates, isLoading } = trpc.siteUpdates.list.useQuery({ projectId });
  const utils = trpc.useUtils();
  const createMut = trpc.siteUpdates.create.useMutation({
    onSuccess: () => { utils.siteUpdates.list.invalidate({ projectId }); toast.success("Site update posted"); setOpen(false); resetForm(); },
    onError: (e) => toast.error(e.message),
  });
  const commentMut = trpc.siteUpdates.addComment.useMutation({
    onSuccess: () => utils.siteUpdates.list.invalidate({ projectId }),
    onError: (e) => toast.error(e.message),
  });

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [stage, setStage] = useState("");
  const [photos, setPhotos] = useState<{ imageUrl: string; fileKey?: string; caption?: string }[]>([]);
  const [commentText, setCommentText] = useState<Record<number, string>>({});
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const { upload, uploading } = useUpload("site-updates");

  const resetForm = () => { setTitle(""); setDescription(""); setStage(""); setPhotos([]); };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;
      const result = await upload(file);
      if (result) setPhotos(prev => [...prev, { imageUrl: result.url, fileKey: result.key }]);
    }
    e.target.value = "";
  };

  const handleCreate = () => {
    if (!title.trim()) { toast.error("Title is required"); return; }
    createMut.mutate({ projectId, title: title.trim(), description: description.trim() || undefined, stage: stage || undefined, photos: photos.length > 0 ? photos : undefined });
  };

  const handleComment = (updateId: number) => {
    const text = commentText[updateId]?.trim();
    if (!text) return;
    commentMut.mutate({ siteUpdateId: updateId, authorName: "B Modern Team", authorType: "admin", comment: text });
    setCommentText(prev => ({ ...prev, [updateId]: "" }));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#203E4A]">Site Updates</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm" className="gap-1.5" style={{ background: "#203E4A" }}><Plus size={14} /> New Update</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Post Site Update</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Title *" value={title} onChange={e => setTitle(e.target.value)} />
              <Textarea placeholder="Description (optional)" value={description} onChange={e => setDescription(e.target.value)} rows={3} />
              <Select value={stage} onValueChange={setStage}>
                <SelectTrigger><SelectValue placeholder="Build Stage (optional)" /></SelectTrigger>
                <SelectContent>{BUILD_STAGES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
              <div>
                <p className="text-xs text-muted-foreground mb-2">Photos</p>
                <div className="flex flex-wrap gap-2">
                  {photos.map((p, i) => (
                    <div key={i} className="relative w-20 h-20 rounded overflow-hidden border">
                      <img src={p.imageUrl} alt="" className="w-full h-full object-cover" />
                      <button onClick={() => setPhotos(prev => prev.filter((_, j) => j !== i))} className="absolute top-0.5 right-0.5 bg-black/60 rounded-full p-0.5"><X size={10} className="text-white" /></button>
                    </div>
                  ))}
                  <label className="w-20 h-20 rounded border-2 border-dashed flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 text-muted-foreground">
                    {uploading ? <Loader2 size={16} className="animate-spin" /> : <><Camera size={16} /><span className="text-[10px] mt-0.5">Add</span></>}
                    <input type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoUpload} />
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <DialogClose asChild><Button variant="outline" size="sm">Cancel</Button></DialogClose>
                <Button size="sm" onClick={handleCreate} disabled={createMut.isPending} style={{ background: "#203E4A" }}>
                  {createMut.isPending ? <Loader2 size={14} className="animate-spin mr-1" /> : null} Post Update
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : !updates?.length ? (
        <Card><CardContent className="py-8 text-center text-sm text-muted-foreground"><Camera size={24} className="mx-auto mb-2 opacity-40" />No site updates yet.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {updates.map((u: any) => (
            <Card key={u.id}>
              <CardContent className="p-4">
                <h4 className="text-sm font-semibold text-[#203E4A]">{u.title}</h4>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-muted-foreground">{new Date(u.createdAt).toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" })}</span>
                  {u.stage && <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">{u.stage}</span>}
                </div>
                {u.description && <p className="text-xs text-muted-foreground mt-2 whitespace-pre-wrap">{u.description}</p>}
                {u.photos?.length > 0 && (
                  <div className="flex gap-2 mt-3 flex-wrap">{u.photos.map((p: any) => <img key={p.id} src={p.imageUrl} alt="" className="w-24 h-24 rounded object-cover border" />)}</div>
                )}
                <div className="mt-3 pt-3 border-t">
                  <button onClick={() => setExpandedId(expandedId === u.id ? null : u.id)} className="text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground">
                    <MessageSquare size={12} /> {u.comments?.length || 0} comment{u.comments?.length !== 1 ? "s" : ""}
                  </button>
                  {expandedId === u.id && (
                    <div className="mt-2 space-y-2">
                      {u.comments?.map((c: any) => (
                        <div key={c.id} className={`text-xs p-2 rounded ${c.authorType === "admin" ? "bg-blue-50" : "bg-gray-50"}`}>
                          <span className="font-medium">{c.authorName}</span> <span className="text-muted-foreground">{new Date(c.createdAt).toLocaleDateString("en-AU")}</span>
                          <p className="mt-0.5">{c.comment}</p>
                        </div>
                      ))}
                      <div className="flex gap-2">
                        <Input value={commentText[u.id] || ""} onChange={e => setCommentText(prev => ({ ...prev, [u.id]: e.target.value }))}
                          placeholder="Reply..." className="text-xs h-8" onKeyDown={e => e.key === "Enter" && handleComment(u.id)} />
                        <Button size="sm" className="h-8 px-2" onClick={() => handleComment(u.id)} disabled={commentMut.isPending} style={{ background: "#203E4A" }}><Send size={12} /></Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
