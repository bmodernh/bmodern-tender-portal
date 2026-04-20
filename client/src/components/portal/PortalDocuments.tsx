import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { FileText, Download, Pen, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { SignaturePad } from "@/components/SignaturePad";

export default function PortalDocuments({ projectId }: { projectId: number }) {
  const { data: docs, isLoading } = trpc.documents.list.useQuery({ projectId });
  const utils = trpc.useUtils();
  const [signId, setSignId] = useState<number | null>(null);
  const [clientName, setClientName] = useState("");
  const [signature, setSignature] = useState("");
  const signMut = trpc.documents.sign.useMutation({
    onSuccess: () => { utils.documents.list.invalidate({ projectId }); setSignId(null); setClientName(""); setSignature(""); toast.success("Document signed"); },
    onError: (e) => toast.error(e.message),
  });
  const catColor = (c: string) => ({ contract: "#dc2626", plan: "#3b82f6", specification: "#8b5cf6", variation: "#f59e0b", other: "#6b7280" }[c] || "#6b7280");
  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  if (!docs?.length) return (<div className="text-center py-16"><FileText size={40} className="mx-auto mb-3 text-muted-foreground/40" /><p className="text-sm text-muted-foreground">No documents yet</p><p className="text-xs text-muted-foreground mt-1">Your builder will upload contracts, plans, and specifications here</p></div>);
  const needsSign = docs.filter((d: any) => d.requiresSignature && !d.clientSignedAt);
  const signed = docs.filter((d: any) => d.clientSignedAt);
  const other = docs.filter((d: any) => !d.requiresSignature && !d.clientSignedAt);
  const DocRow = ({ d, showSign }: { d: any; showSign?: boolean }) => (
    <div className="bg-white rounded-lg border p-3 flex items-center gap-3" style={{ borderColor: "#e5e5e3", borderLeft: showSign ? `3px solid ${catColor(d.category)}` : undefined }}>
      {d.clientSignedAt ? <CheckCircle2 size={18} className="text-green-500 shrink-0" /> : <FileText size={18} style={{ color: catColor(d.category) }} className="shrink-0" />}
      <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{d.title}</p>
        <div className="flex items-center gap-2 mt-0.5"><span className="text-[10px] px-1.5 py-0.5 rounded capitalize" style={{ background: `${catColor(d.category)}15`, color: catColor(d.category) }}>{d.category}</span>
          <span className="text-[10px] text-muted-foreground">{d.clientSignedAt ? `Signed ${new Date(d.clientSignedAt).toLocaleDateString("en-AU")}` : new Date(d.createdAt).toLocaleDateString("en-AU")}</span></div></div>
      <div className="flex gap-1 shrink-0">
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => window.open(d.fileUrl, "_blank")}><Download size={12} className="mr-1" />View</Button>
        {showSign && <Button size="sm" className="h-7 text-xs" style={{ background: "#c9a96e" }} onClick={() => setSignId(d.id)}><Pen size={12} className="mr-1" />Sign</Button>}
      </div></div>
  );
  return (
    <div className="space-y-6 max-w-3xl">
      {needsSign.length > 0 && (<div><h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: "#1a2b3c" }}><Pen size={14} className="text-amber-500" /> Requires Signature ({needsSign.length})</h3><div className="space-y-2">{needsSign.map((d: any) => <DocRow key={d.id} d={d} showSign />)}</div></div>)}
      {other.length > 0 && (<div><h3 className="text-sm font-semibold mb-3" style={{ color: "#1a2b3c" }}>Documents ({other.length})</h3><div className="space-y-2">{other.map((d: any) => <DocRow key={d.id} d={d} />)}</div></div>)}
      {signed.length > 0 && (<div><h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: "#1a2b3c" }}><CheckCircle2 size={14} className="text-green-500" /> Signed ({signed.length})</h3><div className="space-y-2">{signed.map((d: any) => <DocRow key={d.id} d={d} />)}</div></div>)}
      <Dialog open={signId !== null} onOpenChange={() => setSignId(null)}>
        <DialogContent><DialogHeader><DialogTitle>Sign Document</DialogTitle></DialogHeader>
          <div className="space-y-3"><div><label className="text-xs font-medium">Your Full Name</label><input className="w-full border rounded px-3 py-2 text-sm mt-1" value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Enter your full name" /></div>
            <div><label className="text-xs font-medium">Signature</label><div className="mt-1"><SignaturePad onSignatureChange={(v) => setSignature(v || "")} /></div></div></div>
          <DialogFooter><Button variant="outline" onClick={() => setSignId(null)}>Cancel</Button>
            <Button onClick={() => { if (signId && clientName && signature) signMut.mutate({ id: signId, clientSignature: signature, clientSignedName: clientName }); }}
              disabled={signMut.isPending || !clientName || !signature} style={{ background: "#c9a96e" }}>{signMut.isPending ? "Signing..." : "Sign Document"}</Button></DialogFooter></DialogContent></Dialog>
    </div>
  );
}
