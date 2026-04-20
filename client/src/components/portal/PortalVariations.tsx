import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ArrowUpDown, Clock, CheckCircle2, XCircle, Loader2, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { SignaturePad } from "@/components/SignaturePad";

export default function PortalVariations({ projectId }: { projectId: number }) {
  const { data: variations, isLoading } = trpc.variations.list.useQuery({ projectId });
  const utils = trpc.useUtils();
  const [signId, setSignId] = useState<number | null>(null);
  const [signStatus, setSignStatus] = useState<"approved" | "declined">("approved");
  const [clientName, setClientName] = useState("");
  const [signature, setSignature] = useState("");
  const respondMut = trpc.variations.respond.useMutation({
    onSuccess: () => { utils.variations.list.invalidate({ projectId }); setSignId(null); setClientName(""); setSignature(""); toast.success("Variation response submitted"); },
    onError: (e) => toast.error(e.message),
  });
  const statusBadge = (s: string) => {
    if (s === "approved") return <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">Approved</span>;
    if (s === "declined") return <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">Declined</span>;
    return <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">Pending</span>;
  };
  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  if (!variations?.length) return (
    <div className="text-center py-16"><ArrowUpDown size={40} className="mx-auto mb-3 text-muted-foreground/40" />
      <p className="text-sm text-muted-foreground">No variations yet</p>
      <p className="text-xs text-muted-foreground mt-1">Variations raised by your builder will appear here for your review</p></div>
  );
  const pending = variations.filter((v: any) => v.status === "pending");
  const completed = variations.filter((v: any) => v.status !== "pending");
  const totalApproved = completed.filter((v: any) => v.status === "approved").reduce((s: number, v: any) => s + Number(v.costImpact || 0), 0);
  return (
    <div className="space-y-6 max-w-3xl">
      {totalApproved !== 0 && (
        <div className="bg-white rounded-lg border p-4 flex items-center gap-3" style={{ borderColor: "#e5e5e3" }}>
          <DollarSign size={18} style={{ color: "#c9a96e" }} /><div><p className="text-xs text-muted-foreground">Total Approved Variations</p>
            <p className="text-lg font-bold" style={{ color: "#1a2b3c" }}>${totalApproved.toLocaleString("en-AU", { minimumFractionDigits: 2 })}</p></div></div>
      )}
      {pending.length > 0 && (<div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: "#1a2b3c" }}><Clock size={14} className="text-amber-500" /> Pending ({pending.length})</h3>
        <div className="space-y-3">{pending.map((v: any) => (
          <div key={v.id} className="bg-white rounded-lg border p-4" style={{ borderColor: "#e5e5e3", borderLeft: "3px solid #8b5cf6" }}>
            <div className="flex items-start justify-between gap-2"><h4 className="text-sm font-semibold" style={{ color: "#1a2b3c" }}>{v.title}</h4>
              <span className="text-sm font-bold shrink-0" style={{ color: Number(v.costImpact) >= 0 ? "#dc2626" : "#22c55e" }}>{Number(v.costImpact) >= 0 ? "+" : ""}${Number(v.costImpact || 0).toLocaleString("en-AU", { minimumFractionDigits: 2 })}</span></div>
            {v.description && <p className="text-xs text-muted-foreground mt-2 whitespace-pre-wrap">{v.description}</p>}
            {v.builderName && <p className="text-[10px] text-muted-foreground mt-2">Raised by: {v.builderName}</p>}
            <div className="flex gap-2 mt-3">
              <Button size="sm" className="text-xs" style={{ background: "#22c55e" }} onClick={() => { setSignId(v.id); setSignStatus("approved"); }}>Approve & Sign</Button>
              <Button size="sm" variant="outline" className="text-xs text-red-600 border-red-200 hover:bg-red-50" onClick={() => { setSignId(v.id); setSignStatus("declined"); }}>Decline</Button>
            </div></div>))}</div></div>)}
      {completed.length > 0 && (<div>
        <h3 className="text-sm font-semibold mb-3" style={{ color: "#1a2b3c" }}>Completed ({completed.length})</h3>
        <div className="space-y-2">{completed.map((v: any) => (
          <div key={v.id} className="bg-white rounded-lg border p-3 flex items-center gap-3" style={{ borderColor: "#e5e5e3" }}>
            {v.status === "approved" ? <CheckCircle2 size={16} className="text-green-500 shrink-0" /> : <XCircle size={16} className="text-red-500 shrink-0" />}
            <div className="flex-1 min-w-0"><p className="text-sm truncate">{v.title}</p><p className="text-[10px] text-muted-foreground">{v.clientSignedAt ? new Date(v.clientSignedAt).toLocaleDateString("en-AU") : ""}</p></div>
            <span className="text-xs font-medium shrink-0">${Number(v.costImpact || 0).toLocaleString("en-AU")}</span>{statusBadge(v.status)}</div>))}</div></div>)}
      <Dialog open={signId !== null} onOpenChange={() => setSignId(null)}>
        <DialogContent><DialogHeader><DialogTitle>{signStatus === "approved" ? "Approve Variation" : "Decline Variation"}</DialogTitle></DialogHeader>
          <div className="space-y-3"><div><label className="text-xs font-medium">Your Full Name</label>
            <input className="w-full border rounded px-3 py-2 text-sm mt-1" value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Enter your full name" /></div>
            {signStatus === "approved" && (<div><label className="text-xs font-medium">Signature</label><div className="mt-1"><SignaturePad onSignatureChange={(v) => setSignature(v || "")} /></div></div>)}</div>
          <DialogFooter><Button variant="outline" onClick={() => setSignId(null)}>Cancel</Button>
            <Button onClick={() => { if (signId && clientName) respondMut.mutate({ id: signId, status: signStatus, clientName, clientSignature: signature }); }}
              disabled={respondMut.isPending || !clientName || (signStatus === "approved" && !signature)}
              style={{ background: signStatus === "approved" ? "#22c55e" : "#dc2626" }}>
              {respondMut.isPending ? "Submitting..." : signStatus === "approved" ? "Sign & Approve" : "Confirm Decline"}</Button></DialogFooter></DialogContent></Dialog>
    </div>
  );
}
