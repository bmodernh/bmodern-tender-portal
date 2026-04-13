import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Check, Edit, Loader2, Download, FileSignature, Shield, Clock, Globe, Monitor, Upload } from "lucide-react";

export function SubmissionResponseCard({ submission, projectId }: { submission: any; projectId: number }) {
  const utils = trpc.useUtils();
  const [showRespond, setShowRespond] = useState(false);
  const [price, setPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [showSignoff, setShowSignoff] = useState(false);
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
  const hasSigned = !!submission.signoffName;

  return (
    <div className="bg-secondary rounded-lg px-4 py-3 space-y-3">
      {/* Header Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium" style={{ fontFamily: "Lato, sans-serif" }}>
            {new Date(submission.submittedAt).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}
          </span>
          {hasSigned && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
              style={{ background: "#dcfce7", color: "#166534", fontFamily: "Lato, sans-serif" }}>
              <FileSignature size={10} /> Signed Tender
            </span>
          )}
          {submission.documentRefId && (
            <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: "#f1f5f9", color: "#475569", fontFamily: "monospace" }}>
              {submission.documentRefId}
            </span>
          )}
        </div>
        <span className="font-medium text-sm" style={{ fontFamily: "Lato, sans-serif", color: "var(--bm-petrol)" }}>
          Upgrade: ${Number(submission.totalUpgradeCost).toLocaleString("en-AU")}
        </span>
      </div>

      {submission.notes && <p className="text-xs text-muted-foreground" style={{ fontFamily: "Lato, sans-serif" }}>{submission.notes}</p>}

      {/* Signed Tender Details (expandable) */}
      {hasSigned && (
        <div>
          <button
            onClick={() => setShowSignoff(!showSignoff)}
            className="text-xs font-medium flex items-center gap-1.5 hover:underline"
            style={{ color: "var(--bm-petrol)", fontFamily: "Lato, sans-serif" }}
          >
            <Shield size={12} />
            {showSignoff ? "Hide" : "View"} Sign-Off Details
          </button>

          {showSignoff && (
            <div className="mt-2 border rounded-lg p-4 bg-white space-y-3">
              {/* Signatory & Signature */}
              <div className="flex gap-6">
                <div className="flex-1">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1" style={{ fontFamily: "Lato, sans-serif" }}>Signed By</p>
                  <p className="text-sm font-bold" style={{ fontFamily: "Lato, sans-serif", color: "var(--bm-petrol)" }}>{submission.signoffName}</p>
                </div>
                {submission.signoffSignature && submission.signoffSignature.startsWith("data:image") && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1" style={{ fontFamily: "Lato, sans-serif" }}>Signature</p>
                    <div className="border rounded p-1 bg-white" style={{ width: 180, height: 60 }}>
                      <img src={submission.signoffSignature} alt="Signature" className="w-full h-full object-contain" />
                    </div>
                  </div>
                )}
              </div>

              {/* Audit Trail */}
              <div className="border-t pt-3">
                <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-2" style={{ fontFamily: "Lato, sans-serif" }}>Audit Trail</p>
                <div className="grid grid-cols-2 gap-2 text-xs" style={{ fontFamily: "Lato, sans-serif" }}>
                  {submission.documentRefId && (
                    <div className="flex items-center gap-1.5">
                      <FileSignature size={11} className="text-muted-foreground" />
                      <span className="text-muted-foreground">Ref:</span>
                      <span className="font-mono font-medium">{submission.documentRefId}</span>
                    </div>
                  )}
                  {submission.signedOffAt && (
                    <div className="flex items-center gap-1.5">
                      <Clock size={11} className="text-muted-foreground" />
                      <span className="text-muted-foreground">Signed:</span>
                      <span>{new Date(submission.signedOffAt).toLocaleString("en-AU", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                  )}
                  {submission.signoffIp && (
                    <div className="flex items-center gap-1.5">
                      <Globe size={11} className="text-muted-foreground" />
                      <span className="text-muted-foreground">IP:</span>
                      <span className="font-mono">{submission.signoffIp}</span>
                    </div>
                  )}
                  {submission.signoffUserAgent && (
                    <div className="flex items-center gap-1.5 col-span-2">
                      <Monitor size={11} className="text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground shrink-0">Browser:</span>
                      <span className="truncate">{submission.signoffUserAgent.length > 100 ? submission.signoffUserAgent.substring(0, 100) + "..." : submission.signoffUserAgent}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Download Signed Tender PDF */}
      {submission.clientToken && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => window.open(`/api/pdf/selections/${submission.clientToken}`, "_blank")}
          className="gap-1.5 text-xs"
          style={{ fontFamily: "Lato, sans-serif" }}
        >
          <Download size={12} /> Download {hasSigned ? "Signed Tender" : "Selections"} PDF
        </Button>
      )}

      {/* Admin Response */}
      {hasResponse ? (
        <div className="bg-green-50 border border-green-200 rounded p-3">
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
        <div>
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
