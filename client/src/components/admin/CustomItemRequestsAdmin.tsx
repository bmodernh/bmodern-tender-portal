import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, Edit, ExternalLink, Loader2 } from "lucide-react";

export function CustomItemRequestsAdmin({ projectId }: { projectId: number }) {
  const utils = trpc.useUtils();
  const { data: requests } = trpc.inbox.listCustomItemRequests.useQuery({ projectId });
  const updateMut = trpc.inbox.updateCustomItemRequest.useMutation({
    onSuccess: () => { utils.inbox.listCustomItemRequests.invalidate(); toast.success("Updated"); },
    onError: (e: any) => toast.error(e.message),
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editPrice, setEditPrice] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editStatus, setEditStatus] = useState("");

  if (!requests || requests.length === 0) return null;

  const startEdit = (req: any) => {
    setEditingId(req.id);
    setEditPrice(req.adminPrice || "");
    setEditNotes(req.adminNotes || "");
    setEditStatus(req.status || "submitted");
  };

  return (
    <div className="bg-card border rounded p-4" style={{ borderColor: "var(--border)" }}>
      <h3 className="text-sm font-medium mb-3" style={{ fontFamily: "Lato, sans-serif", color: "var(--bm-petrol)" }}>Custom Item Requests</h3>
      <div className="space-y-3">
        {requests.map((req: any) => {
          const isEditing = editingId === req.id;
          return (
            <div key={req.id} className="bg-secondary rounded px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-sm font-medium" style={{ fontFamily: "Lato, sans-serif" }}>{req.itemName}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                      req.status === "priced" ? "bg-green-100 text-green-800" :
                      req.status === "approved" ? "bg-emerald-100 text-emerald-800" :
                      req.status === "declined" ? "bg-red-100 text-red-800" :
                      req.status === "under_review" ? "bg-amber-100 text-amber-800" :
                      "bg-blue-100 text-blue-800"
                    }`} style={{ fontFamily: "Lato, sans-serif" }}>{req.status?.replace("_", " ")}</span>
                  </div>
                  {req.description && <p className="text-xs text-muted-foreground" style={{ fontFamily: "Lato, sans-serif" }}>{req.description}</p>}
                  <div className="flex flex-wrap gap-3 mt-1 text-[11px] text-muted-foreground" style={{ fontFamily: "Lato, sans-serif" }}>
                    {req.preferredBrand && <span>Brand: {req.preferredBrand}</span>}
                    {req.room && <span>Room: {req.room}</span>}
                    {req.quantity && <span>Qty: {req.quantity}</span>}
                    {req.referenceUrl && <a href={req.referenceUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-0.5 text-blue-600 hover:underline"><ExternalLink size={10} /> Reference</a>}
                  </div>
                </div>
                {!isEditing && (
                  <Button size="sm" variant="outline" onClick={() => startEdit(req)} className="gap-1 text-xs shrink-0" style={{ fontFamily: "Lato, sans-serif" }}>
                    <Edit size={12} /> Review
                  </Button>
                )}
              </div>

              {isEditing && (
                <div className="mt-3 bg-white border rounded p-3 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs" style={{ fontFamily: "Lato, sans-serif" }}>Status</Label>
                      <Select value={editStatus} onValueChange={setEditStatus}>
                        <SelectTrigger className="h-9 text-xs mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="submitted">Submitted</SelectItem>
                          <SelectItem value="under_review">Under Review</SelectItem>
                          <SelectItem value="priced">Priced</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="declined">Declined</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs" style={{ fontFamily: "Lato, sans-serif" }}>Price ($)</Label>
                      <Input type="number" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} placeholder="e.g. 2500" className="h-9 text-sm mt-1" style={{ fontFamily: "Lato, sans-serif" }} />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs" style={{ fontFamily: "Lato, sans-serif" }}>Response Notes</Label>
                    <Textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} placeholder="Notes to the client..." rows={2} className="text-sm mt-1 resize-none" style={{ fontFamily: "Lato, sans-serif" }} />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => {
                      updateMut.mutate({ id: req.id, status: editStatus as any, adminPrice: editPrice || undefined, adminNotes: editNotes || undefined });
                      setEditingId(null);
                    }} disabled={updateMut.isPending} className="gap-1.5 text-xs" style={{ background: "var(--bm-petrol)", fontFamily: "Lato, sans-serif" }}>
                      {updateMut.isPending ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Save
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} className="text-xs" style={{ fontFamily: "Lato, sans-serif" }}>Cancel</Button>
                  </div>
                </div>
              )}

              {!isEditing && req.adminPrice && (
                <div className="mt-2 bg-green-50 border border-green-200 rounded p-2 flex items-center justify-between">
                  <span className="text-xs text-green-800" style={{ fontFamily: "Lato, sans-serif" }}>Quoted: ${Number(req.adminPrice).toLocaleString("en-AU")}</span>
                  {req.adminNotes && <span className="text-xs text-muted-foreground" style={{ fontFamily: "Lato, sans-serif" }}>{req.adminNotes}</span>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
