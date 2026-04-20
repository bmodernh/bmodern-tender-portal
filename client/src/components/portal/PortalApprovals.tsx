import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { CheckSquare, Clock, CheckCircle2, XCircle, Loader2, ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export default function PortalApprovals({ projectId }: { projectId: number }) {
  const { data: approvals, isLoading } = trpc.approvals.list.useQuery({ projectId });
  const utils = trpc.useUtils();
  const [respondId, setRespondId] = useState<number | null>(null);
  const [responseText, setResponseText] = useState("");
  const [respondStatus, setRespondStatus] = useState<"approved" | "change_requested">("approved");
  const [zoomImg, setZoomImg] = useState<string | null>(null);
  const respondMut = trpc.approvals.respond.useMutation({
    onSuccess: () => { utils.approvals.list.invalidate({ projectId }); setRespondId(null); setResponseText(""); toast.success("Response submitted"); },
    onError: (e) => toast.error(e.message),
  });
  const statusBadge = (s: string) => {
    if (s === "approved") return <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">Approved</span>;
    if (s === "change_requested") return <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-medium">Change Requested</span>;
    return <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">Pending</span>;
  };
  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  if (!approvals?.length) return (
    <div className="text-center py-16">
      <CheckSquare size={40} className="mx-auto mb-3 text-muted-foreground/40" />
      <p className="text-sm text-muted-foreground">No approval requests yet</p>
      <p className="text-xs text-muted-foreground mt-1">Your builder will send approval requests for on-site decisions here</p>
    </div>
  );
  const pending = approvals.filter((a: any) => a.status === "pending");
  const completed = approvals.filter((a: any) => a.status !== "pending");
  return (
    <div className="space-y-6 max-w-3xl">
      {pending.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: "#1a2b3c" }}><Clock size={14} className="text-amber-500" /> Pending Approvals ({pending.length})</h3>
          <div className="space-y-3">
            {pending.map((a: any) => (
              <div key={a.id} className="bg-white rounded-lg border p-4" style={{ borderColor: "#e5e5e3", borderLeft: "3px solid #f59e0b" }}>
                <div className="flex items-start justify-between gap-2">
                  <div><h4 className="text-sm font-semibold" style={{ color: "#1a2b3c" }}>{a.title}</h4>
                    {a.category && <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">{a.category}</span>}</div>
                  {statusBadge(a.status)}
                </div>
                {a.description && <p className="text-xs text-muted-foreground mt-2 whitespace-pre-wrap">{a.description}</p>}
                <div className="flex gap-2 mt-3">
                  {a.sitePhotoUrl && (
                    <div className="relative group cursor-pointer" onClick={() => setZoomImg(a.sitePhotoUrl)}>
                      <img src={a.sitePhotoUrl} alt="Site photo" className="w-24 h-24 rounded object-cover" />
                      <div className="absolute inset-0 bg-black/30 rounded opacity-0 group-hover:opacity-100 transition flex items-center justify-center"><ZoomIn size={16} className="text-white" /></div>
                      <span className="absolute bottom-1 left-1 text-[9px] bg-black/60 text-white px-1 rounded">Site Photo</span>
                    </div>
                  )}
                  {a.planImageUrl && (
                    <div className="relative group cursor-pointer" onClick={() => setZoomImg(a.planImageUrl)}>
                      <img src={a.planImageUrl} alt="Plan" className="w-24 h-24 rounded object-cover" />
                      <div className="absolute inset-0 bg-black/30 rounded opacity-0 group-hover:opacity-100 transition flex items-center justify-center"><ZoomIn size={16} className="text-white" /></div>
                      <span className="absolute bottom-1 left-1 text-[9px] bg-black/60 text-white px-1 rounded">Plan</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" className="text-xs" style={{ background: "#22c55e" }} onClick={() => { setRespondId(a.id); setRespondStatus("approved"); }}>Approve</Button>
                  <Button size="sm" variant="outline" className="text-xs" onClick={() => { setRespondId(a.id); setRespondStatus("change_requested"); }}>Request Change</Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {completed.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3" style={{ color: "#1a2b3c" }}>Completed ({completed.length})</h3>
          <div className="space-y-2">
            {completed.map((a: any) => (
              <div key={a.id} className="bg-white rounded-lg border p-3 flex items-center gap-3" style={{ borderColor: "#e5e5e3" }}>
                {a.status === "approved" ? <CheckCircle2 size={16} className="text-green-500 shrink-0" /> : <XCircle size={16} className="text-orange-500 shrink-0" />}
                <div className="flex-1 min-w-0"><p className="text-sm truncate">{a.title}</p><p className="text-[10px] text-muted-foreground">{a.respondedAt ? new Date(a.respondedAt).toLocaleDateString("en-AU") : ""}</p></div>
                {statusBadge(a.status)}
              </div>
            ))}
          </div>
        </div>
      )}
      <Dialog open={respondId !== null} onOpenChange={() => setRespondId(null)}>
        <DialogContent><DialogHeader><DialogTitle>{respondStatus === "approved" ? "Confirm Approval" : "Request Change"}</DialogTitle></DialogHeader>
          <Textarea value={responseText} onChange={e => setResponseText(e.target.value)} placeholder={respondStatus === "approved" ? "Optional comment..." : "Describe the change you'd like..."} rows={3} />
          <DialogFooter><Button variant="outline" onClick={() => setRespondId(null)}>Cancel</Button>
            <Button onClick={() => { if (respondId) respondMut.mutate({ id: respondId, status: respondStatus, clientResponse: responseText, respondedBy: "Client" }); }}
              disabled={respondMut.isPending} style={{ background: respondStatus === "approved" ? "#22c55e" : "#f59e0b" }}>
              {respondMut.isPending ? "Submitting..." : respondStatus === "approved" ? "Approve" : "Request Change"}</Button></DialogFooter></DialogContent>
      </Dialog>
      <Dialog open={!!zoomImg} onOpenChange={() => setZoomImg(null)}>
        <DialogContent className="max-w-3xl p-1">{zoomImg && <img src={zoomImg} alt="" className="w-full rounded" />}</DialogContent>
      </Dialog>
    </div>
  );
}
