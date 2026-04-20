import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ClipboardList, Pen, CheckCircle2, Loader2, Calendar, MapPin, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { SignaturePad } from "@/components/SignaturePad";

export default function PortalMeetingMinutes({ projectId }: { projectId: number }) {
  const { data: minutes, isLoading } = trpc.meetingMinutes.list.useQuery({ projectId });
  const utils = trpc.useUtils();
  const [signId, setSignId] = useState<number | null>(null);
  const [viewId, setViewId] = useState<number | null>(null);
  const [clientName, setClientName] = useState("");
  const [signature, setSignature] = useState("");
  const signMut = trpc.meetingMinutes.clientSign.useMutation({
    onSuccess: () => { utils.meetingMinutes.list.invalidate({ projectId }); setSignId(null); setClientName(""); setSignature(""); toast.success("Meeting minutes signed"); },
    onError: (e: any) => toast.error(e.message),
  });
  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  if (!minutes?.length) return (<div className="text-center py-16"><ClipboardList size={40} className="mx-auto mb-3 text-muted-foreground/40" /><p className="text-sm text-muted-foreground">No meeting minutes yet</p></div>);
  const unsigned = minutes.filter((m: any) => !m.clientSignedAt);
  const signedList = minutes.filter((m: any) => m.clientSignedAt);
  const viewItem = minutes.find((m: any) => m.id === viewId);
  return (
    <div className="space-y-6 max-w-3xl">
      {unsigned.length > 0 && (<div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: "#1a2b3c" }}><Pen size={14} className="text-amber-500" /> Awaiting Signature ({unsigned.length})</h3>
        <div className="space-y-2">{unsigned.map((m: any) => (
          <div key={m.id} className="bg-white rounded-lg border p-4" style={{ borderColor: "#e5e5e3", borderLeft: "3px solid #c9a96e" }}>
            <div className="flex items-start justify-between gap-2">
              <div><div className="flex items-center gap-2"><Calendar size={12} className="text-muted-foreground" /><span className="text-xs text-muted-foreground">{new Date(m.meetingDate).toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span></div>
                {m.location && <div className="flex items-center gap-2 mt-1"><MapPin size={12} className="text-muted-foreground" /><span className="text-xs text-muted-foreground">{m.location}</span></div>}
                {m.attendees && <div className="flex items-center gap-2 mt-1"><Users size={12} className="text-muted-foreground" /><span className="text-xs text-muted-foreground">{m.attendees}</span></div>}</div>
              <div className="flex gap-1 shrink-0">
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setViewId(m.id)}>View</Button>
                <Button size="sm" className="h-7 text-xs" style={{ background: "#c9a96e" }} onClick={() => setSignId(m.id)}><Pen size={12} className="mr-1" />Sign</Button></div></div>
            {m.notes && <p className="text-xs text-muted-foreground mt-2 line-clamp-2 whitespace-pre-wrap">{m.notes}</p>}
          </div>))}</div></div>)}
      {signedList.length > 0 && (<div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: "#1a2b3c" }}><CheckCircle2 size={14} className="text-green-500" /> Signed ({signedList.length})</h3>
        <div className="space-y-2">{signedList.map((m: any) => (
          <div key={m.id} className="bg-white rounded-lg border p-3 flex items-center gap-3 cursor-pointer hover:shadow-sm" style={{ borderColor: "#e5e5e3" }} onClick={() => setViewId(m.id)}>
            <CheckCircle2 size={16} className="text-green-500 shrink-0" />
            <div className="flex-1 min-w-0"><p className="text-sm">{new Date(m.meetingDate).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}</p>
              <p className="text-[10px] text-muted-foreground">Signed {new Date(m.clientSignedAt).toLocaleDateString("en-AU")}</p></div></div>))}</div></div>)}
      <Dialog open={viewId !== null} onOpenChange={() => setViewId(null)}>
        <DialogContent className="max-w-lg"><DialogHeader><DialogTitle>Meeting Minutes</DialogTitle></DialogHeader>
          {viewItem && (<div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-2"><div><span className="text-xs text-muted-foreground">Date</span><p>{new Date(viewItem.meetingDate).toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p></div>
              {viewItem.location && <div><span className="text-xs text-muted-foreground">Location</span><p>{viewItem.location}</p></div>}</div>
            {viewItem.attendees && <div><span className="text-xs text-muted-foreground">Attendees</span><p>{viewItem.attendees}</p></div>}
            {viewItem.agenda && <div><span className="text-xs text-muted-foreground">Agenda</span><p className="whitespace-pre-wrap">{viewItem.agenda}</p></div>}
            {viewItem.notes && <div><span className="text-xs text-muted-foreground">Notes</span><p className="whitespace-pre-wrap">{viewItem.notes}</p></div>}
            {viewItem.actionItems && <div><span className="text-xs text-muted-foreground">Action Items</span><p className="whitespace-pre-wrap">{viewItem.actionItems}</p></div>}
            <div className="border-t pt-3 grid grid-cols-2 gap-3" style={{ borderColor: "#e5e5e3" }}>
              <div><span className="text-xs text-muted-foreground">Builder</span>{viewItem.builderSignature ? <div><img src={viewItem.builderSignature} alt="sig" className="h-10 mt-1" /><p className="text-[10px]">{viewItem.builderName}</p></div> : <p className="text-xs italic text-muted-foreground">Not signed</p>}</div>
              <div><span className="text-xs text-muted-foreground">Client</span>{viewItem.clientSignature ? <div><img src={viewItem.clientSignature} alt="sig" className="h-10 mt-1" /><p className="text-[10px]">{viewItem.clientName}</p></div> : <p className="text-xs italic text-muted-foreground">Not signed</p>}</div></div></div>)}</DialogContent></Dialog>
      <Dialog open={signId !== null} onOpenChange={() => setSignId(null)}>
        <DialogContent><DialogHeader><DialogTitle>Sign Meeting Minutes</DialogTitle></DialogHeader>
          <div className="space-y-3"><div><label className="text-xs font-medium">Your Full Name</label><input className="w-full border rounded px-3 py-2 text-sm mt-1" value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Enter your full name" /></div>
            <div><label className="text-xs font-medium">Signature</label><div className="mt-1"><SignaturePad onSignatureChange={(v) => setSignature(v || "")} /></div></div></div>
          <DialogFooter><Button variant="outline" onClick={() => setSignId(null)}>Cancel</Button>
            <Button onClick={() => { if (signId && clientName && signature) signMut.mutate({ id: signId, clientName, clientSignature: signature }); }}
              disabled={signMut.isPending || !clientName || !signature} style={{ background: "#c9a96e" }}>{signMut.isPending ? "Signing..." : "Sign Minutes"}</Button></DialogFooter></DialogContent></Dialog>
    </div>
  );
}
