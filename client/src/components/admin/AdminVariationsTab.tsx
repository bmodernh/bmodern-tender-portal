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
import { ArrowUpDown, Plus, Loader2, DollarSign } from "lucide-react";

const STATUS_BADGE: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pending", variant: "secondary" },
  approved: { label: "Approved", variant: "default" },
  declined: { label: "Declined", variant: "destructive" },
};

export default function AdminVariationsTab({ projectId }: { projectId: number }) {
  const { data: variations, isLoading } = trpc.variations.list.useQuery({ projectId });
  const utils = trpc.useUtils();
  const createMut = trpc.variations.create.useMutation({
    onSuccess: () => { utils.variations.list.invalidate({ projectId }); toast.success("Variation created"); setOpen(false); resetForm(); },
    onError: (e) => toast.error(e.message),
  });

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [costImpact, setCostImpact] = useState("");
  const [builderName, setBuilderName] = useState("");
  const [builderSignature, setBuilderSignature] = useState("");

  const resetForm = () => { setTitle(""); setDescription(""); setCostImpact(""); setBuilderName(""); setBuilderSignature(""); };

  const handleCreate = () => {
    if (!title.trim()) { toast.error("Title is required"); return; }
    createMut.mutate({
      projectId, title: title.trim(), description: description.trim() || undefined,
      costImpact: costImpact || undefined,
      builderName: builderName.trim() || undefined, builderSignature: builderSignature || undefined,
    });
  };

  const fmt = (v: string | null) => {
    if (!v) return "$0";
    const n = parseFloat(v);
    return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", minimumFractionDigits: 0 }).format(n);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#203E4A]">Variations</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm" className="gap-1.5" style={{ background: "#203E4A" }}><Plus size={14} /> New Variation</Button></DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Raise Variation</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Title *" value={title} onChange={e => setTitle(e.target.value)} />
              <Textarea placeholder="Description — what is being varied and why" value={description} onChange={e => setDescription(e.target.value)} rows={3} />
              <div>
                <p className="text-xs font-medium mb-1">Cost Impact (AUD)</p>
                <div className="relative">
                  <DollarSign size={14} className="absolute left-2.5 top-2.5 text-muted-foreground" />
                  <Input placeholder="0" value={costImpact} onChange={e => setCostImpact(e.target.value)} className="pl-8" type="number" step="0.01" />
                </div>
              </div>
              <Input placeholder="Builder Name" value={builderName} onChange={e => setBuilderName(e.target.value)} />
              <div>
                <p className="text-xs font-medium mb-1">Builder Signature</p>
                <SignaturePad onSignatureChange={(v) => setBuilderSignature(v || "")} />
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
      ) : !variations?.length ? (
        <Card><CardContent className="py-8 text-center text-sm text-muted-foreground"><ArrowUpDown size={24} className="mx-auto mb-2 opacity-40" />No variations yet.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {variations.map((v: any) => {
            const s = STATUS_BADGE[v.status] || STATUS_BADGE.pending;
            return (
              <Card key={v.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-[#203E4A]">{v.title}</h4>
                      <span className="text-xs text-muted-foreground">{new Date(v.createdAt).toLocaleDateString("en-AU")}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold" style={{ color: parseFloat(v.costImpact || "0") > 0 ? "#16a34a" : parseFloat(v.costImpact || "0") < 0 ? "#dc2626" : "#6b7280" }}>
                        {parseFloat(v.costImpact || "0") > 0 ? "+" : ""}{fmt(v.costImpact)}
                      </span>
                      <Badge variant={s.variant}>{s.label}</Badge>
                    </div>
                  </div>
                  {v.description && <p className="text-xs text-muted-foreground mt-2 whitespace-pre-wrap">{v.description}</p>}
                  {v.clientSignature && (
                    <div className="mt-3 p-2 rounded bg-green-50 text-xs">
                      <span className="font-medium text-green-700">Signed by {v.clientName}</span>
                      <span className="text-muted-foreground ml-1">on {new Date(v.clientSignedAt).toLocaleDateString("en-AU")}</span>
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
