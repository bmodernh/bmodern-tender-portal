import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Check, Edit, Loader2 } from "lucide-react";

export function SubmissionResponseCard({ submission, projectId }: { submission: any; projectId: number }) {
  const utils = trpc.useUtils();
  const [showRespond, setShowRespond] = useState(false);
  const [price, setPrice] = useState("");
  const [notes, setNotes] = useState("");
  const respondMut = trpc.inbox.respondToSubmission.useMutation({
    onSuccess: () => {
      utils.inbox.listSubmissions.invalidate();
      utils.upgrades.getSubmissions.invalidate();
      toast.success("Price response sent to client");
      setShowRespond(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const hasResponse = !!submission.adminResponsePrice;

  return (
    <div className="bg-secondary rounded px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <div>
          <span className="text-sm font-medium" style={{ fontFamily: "Lato, sans-serif" }}>
            {new Date(submission.submittedAt).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}
          </span>
          {submission.notes && <p className="text-xs text-muted-foreground mt-0.5" style={{ fontFamily: "Lato, sans-serif" }}>{submission.notes}</p>}
        </div>
        <span className="font-medium text-sm" style={{ fontFamily: "Lato, sans-serif", color: "var(--bm-petrol)" }}>
          Upgrade: ${Number(submission.totalUpgradeCost).toLocaleString("en-AU")}
        </span>
      </div>

      {hasResponse ? (
        <div className="bg-green-50 border border-green-200 rounded p-3 mt-2">
          <div className="flex items-center gap-2 mb-1">
            <Check size={14} className="text-green-600" />
            <span className="text-xs font-medium text-green-800" style={{ fontFamily: "Lato, sans-serif" }}>Price Sent</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold" style={{ fontFamily: "Lato, sans-serif", color: "var(--bm-petrol)" }}>
              ${Number(submission.adminResponsePrice).toLocaleString("en-AU")}
            </span>
            {submission.adminResponseNotes && (
              <span className="text-xs text-muted-foreground" style={{ fontFamily: "Lato, sans-serif" }}>{submission.adminResponseNotes}</span>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-2">
          {!showRespond ? (
            <Button size="sm" onClick={() => setShowRespond(true)} className="gap-1.5 text-xs" style={{ background: "var(--bm-petrol)", fontFamily: "Lato, sans-serif" }}>
              <Edit size={12} /> Respond with Price
            </Button>
          ) : (
            <div className="bg-white border rounded p-3 space-y-3">
              <div>
                <Label className="text-xs" style={{ fontFamily: "Lato, sans-serif" }}>Confirmed Total Price ($)</Label>
                <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="e.g. 535000" className="h-9 text-sm mt-1" style={{ fontFamily: "Lato, sans-serif" }} />
              </div>
              <div>
                <Label className="text-xs" style={{ fontFamily: "Lato, sans-serif" }}>Notes (optional)</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any notes about the pricing..." rows={2} className="text-sm mt-1 resize-none" style={{ fontFamily: "Lato, sans-serif" }} />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => respondMut.mutate({ submissionId: submission.id, adminResponsePrice: price, adminResponseNotes: notes || undefined })}
                  disabled={!price || respondMut.isPending} className="gap-1.5 text-xs" style={{ background: "var(--bm-petrol)", fontFamily: "Lato, sans-serif" }}>
                  {respondMut.isPending ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Send Price
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowRespond(false)} className="text-xs" style={{ fontFamily: "Lato, sans-serif" }}>Cancel</Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
