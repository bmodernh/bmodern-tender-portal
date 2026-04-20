import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { SignaturePad } from "@/components/SignaturePad";
import { ClipboardList, Plus, Loader2, ChevronDown, ChevronUp, FileSignature, Users, MapPin, Calendar } from "lucide-react";

export default function AdminMeetingMinutesTab({ projectId }: { projectId: number }) {
  const { data: minutes, isLoading } = trpc.meetingMinutes.list.useQuery({ projectId });
  const utils = trpc.useUtils();
  const createMut = trpc.meetingMinutes.create.useMutation({
    onSuccess: () => { utils.meetingMinutes.list.invalidate({ projectId }); toast.success("Meeting minutes created"); setOpen(false); resetForm(); },
    onError: (e) => toast.error(e.message),
  });

  const [open, setOpen] = useState(false);
  const [meetingDate, setMeetingDate] = useState(new Date().toISOString().split("T")[0]);
  const [location, setLocation] = useState("");
  const [attendees, setAttendees] = useState("");
  const [agenda, setAgenda] = useState("");
  const [notes, setNotes] = useState("");
  const [actionItems, setActionItems] = useState("");
  const [builderName, setBuilderName] = useState("");
  const [builderSignature, setBuilderSignature] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const resetForm = () => { setMeetingDate(new Date().toISOString().split("T")[0]); setLocation(""); setAttendees(""); setAgenda(""); setNotes(""); setActionItems(""); setBuilderName(""); setBuilderSignature(""); };

  const handleCreate = () => {
    if (!meetingDate) { toast.error("Meeting date is required"); return; }
    createMut.mutate({
      projectId, meetingDate, location: location.trim() || undefined,
      attendees: attendees.trim() || undefined, agenda: agenda.trim() || undefined,
      notes: notes.trim() || undefined, actionItems: actionItems.trim() || undefined,
      builderName: builderName.trim() || undefined, builderSignature: builderSignature || undefined,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#203E4A]">Meeting Minutes</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm" className="gap-1.5" style={{ background: "#203E4A" }}><Plus size={14} /> New Minutes</Button></DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Create Meeting Minutes</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-medium mb-1">Meeting Date *</p>
                  <Input type="date" value={meetingDate} onChange={e => setMeetingDate(e.target.value)} />
                </div>
                <div>
                  <p className="text-xs font-medium mb-1">Location</p>
                  <Input placeholder="e.g. On site" value={location} onChange={e => setLocation(e.target.value)} />
                </div>
              </div>
              <div>
                <p className="text-xs font-medium mb-1">Attendees</p>
                <Input placeholder="e.g. John Smith, Jane Doe" value={attendees} onChange={e => setAttendees(e.target.value)} />
              </div>
              <div>
                <p className="text-xs font-medium mb-1">Agenda</p>
                <Textarea placeholder="Meeting agenda items..." value={agenda} onChange={e => setAgenda(e.target.value)} rows={2} />
              </div>
              <div>
                <p className="text-xs font-medium mb-1">Notes</p>
                <Textarea placeholder="Discussion notes and decisions..." value={notes} onChange={e => setNotes(e.target.value)} rows={4} />
              </div>
              <div>
                <p className="text-xs font-medium mb-1">Action Items</p>
                <Textarea placeholder="List action items, one per line..." value={actionItems} onChange={e => setActionItems(e.target.value)} rows={3} />
              </div>
              <hr />
              <Input placeholder="Builder Name (for signature)" value={builderName} onChange={e => setBuilderName(e.target.value)} />
              <div>
                <p className="text-xs font-medium mb-1">Builder Signature</p>
                <SignaturePad onSignatureChange={(v) => setBuilderSignature(v || "")} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <DialogClose asChild><Button variant="outline" size="sm">Cancel</Button></DialogClose>
                <Button size="sm" onClick={handleCreate} disabled={createMut.isPending} style={{ background: "#203E4A" }}>
                  {createMut.isPending ? <Loader2 size={14} className="animate-spin mr-1" /> : null} Save Minutes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : !minutes?.length ? (
        <Card><CardContent className="py-8 text-center text-sm text-muted-foreground"><ClipboardList size={24} className="mx-auto mb-2 opacity-40" />No meeting minutes yet.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {minutes.map((m: any) => (
            <Card key={m.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between cursor-pointer" onClick={() => setExpandedId(expandedId === m.id ? null : m.id)}>
                  <div>
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-[#203E4A]" />
                      <h4 className="text-sm font-semibold text-[#203E4A]">
                        {new Date(m.meetingDate).toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                      </h4>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      {m.location && <span className="flex items-center gap-1"><MapPin size={10} />{m.location}</span>}
                      {m.attendees && <span className="flex items-center gap-1"><Users size={10} />{m.attendees.split(",").length} attendees</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {m.clientSignature
                      ? <Badge variant="default" className="gap-1 text-[10px]"><FileSignature size={10} />Client Signed</Badge>
                      : <Badge variant="secondary" className="gap-1 text-[10px]"><FileSignature size={10} />Awaiting</Badge>
                    }
                    {expandedId === m.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </div>
                </div>
                {expandedId === m.id && (
                  <div className="mt-3 pt-3 border-t space-y-3">
                    {m.attendees && <div><p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Attendees</p><p className="text-xs mt-0.5">{m.attendees}</p></div>}
                    {m.agenda && <div><p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Agenda</p><p className="text-xs mt-0.5 whitespace-pre-wrap">{m.agenda}</p></div>}
                    {m.notes && <div><p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Notes</p><p className="text-xs mt-0.5 whitespace-pre-wrap">{m.notes}</p></div>}
                    {m.actionItems && <div><p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Action Items</p><p className="text-xs mt-0.5 whitespace-pre-wrap">{m.actionItems}</p></div>}
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div>
                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Builder</p>
                        {m.builderSignature ? (
                          <div className="mt-1"><img src={m.builderSignature} alt="Builder signature" className="h-10 object-contain" /><p className="text-[10px] text-muted-foreground">{m.builderName}</p></div>
                        ) : <p className="text-xs text-muted-foreground mt-1">Not signed</p>}
                      </div>
                      <div>
                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Client</p>
                        {m.clientSignature ? (
                          <div className="mt-1"><img src={m.clientSignature} alt="Client signature" className="h-10 object-contain" /><p className="text-[10px] text-muted-foreground">{m.clientName}</p></div>
                        ) : <p className="text-xs text-muted-foreground mt-1">Awaiting signature</p>}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
