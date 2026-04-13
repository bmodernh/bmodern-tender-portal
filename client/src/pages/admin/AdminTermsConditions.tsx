import React, { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Save, FileText, Info } from "lucide-react";

const DEFAULT_TC = `TENDER TERMS & CONDITIONS

1. VALIDITY
This tender is valid for 30 days from the date of issue. B Modern Homes reserves the right to withdraw or amend this tender at any time prior to formal acceptance.

2. SCOPE OF WORKS
The scope of works is limited to those items specifically described in this proposal. Any works not expressly included are excluded. Variations to the scope must be agreed in writing prior to commencement.

3. PRELIMINARY & GENERAL
Preliminary and general costs are based on the construction program and site conditions as understood at the time of tender. Any changes to the program or site conditions may result in additional costs.

4. STRUCTURAL & ENGINEERING
All structural elements are based on standard engineering assumptions. Specific engineering documentation will be required prior to construction. Any variations from standard conditions (rock, fill, reactive soils, etc.) may result in additional costs.

5. PROVISIONAL SUMS
Items marked as Provisional Sums (PS) are estimates only. Final costs will be adjusted based on actual selections and quantities. B Modern Homes will provide updated costings when selections are finalised.

6. EXCLUSIONS
Unless specifically stated, this proposal excludes: council fees and charges, development application costs, occupation certificate fees, utility connection fees, landscaping beyond the scope described, furniture and loose items, and any works outside the property boundary.

7. VARIATIONS
Any changes to the scope of works, materials, or specifications after contract execution will be treated as variations and charged accordingly. All variations must be approved in writing by the client prior to execution.

8. PAYMENT TERMS
Payment terms will be as per the HIA or MBA building contract. Progress payments are due within 5 business days of invoice.

9. INSURANCE
B Modern Homes carries appropriate builders warranty insurance, public liability insurance, and workers compensation insurance as required by law.

10. DISPUTE RESOLUTION
Any disputes arising from this tender or subsequent contract shall be resolved in accordance with the relevant state building legislation and, where applicable, through the relevant building dispute resolution body.

By proceeding with this proposal, the client acknowledges they have read, understood, and agreed to these terms and conditions.`;

export default function AdminTermsConditions() {
  const { data: terms, isLoading } = trpc.terms.get.useQuery();
  const updateMutation = trpc.terms.update.useMutation({
    onSuccess: () => toast.success("Terms & Conditions saved"),
    onError: (e) => toast.error(e.message),
  });

  const [content, setContent] = useState("");
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (terms?.content) {
      setContent(terms.content);
    } else if (!isLoading && !terms) {
      setContent(DEFAULT_TC);
      setIsDirty(true);
    }
  }, [terms, isLoading]);

  function handleChange(val: string) {
    setContent(val);
    setIsDirty(true);
  }

  function handleSave() {
    updateMutation.mutate({ content });
    setIsDirty(false);
  }

  function handleReset() {
    setContent(DEFAULT_TC);
    setIsDirty(true);
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold" style={{ fontFamily: "Cormorant Garamond, serif" }}>
              Terms & Conditions
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              These terms are displayed to clients on the portal before they can interact with their proposal. Clients must scroll and acknowledge before proceeding.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleReset} className="text-xs">
              Reset to Default
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!isDirty || updateMutation.isPending}
              className="text-xs"
              style={{ background: "var(--bm-petrol)" }}
            >
              <Save className="w-3 h-3 mr-1" />
              {updateMutation.isPending ? "Saving..." : "Save T&Cs"}
            </Button>
          </div>
        </div>

        {/* Info banner */}
        <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-50 border border-blue-200 text-sm text-blue-800">
          <Info className="w-4 h-4 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">How this works</p>
            <p className="mt-0.5 text-xs">
              When a client opens their portal link for the first time, they will see a full-screen T&Cs acknowledgement screen. They must scroll to the bottom and click "I Agree" before accessing their proposal. Their acknowledgement is recorded with a timestamp and IP address for your records.
            </p>
          </div>
        </div>

        {/* Editor */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Terms Content</span>
            {isDirty && <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded">Unsaved changes</span>}
          </div>
          <Textarea
            value={content}
            onChange={(e) => handleChange(e.target.value)}
            className="min-h-[600px] font-mono text-xs leading-relaxed resize-y"
            placeholder="Enter your terms and conditions..."
          />
          <p className="text-xs text-muted-foreground">
            {content.length} characters · Plain text only. Use numbered sections and blank lines for readability.
          </p>
        </div>

        {/* Preview */}
        <div className="space-y-2">
          <span className="text-sm font-medium">Preview (as clients will see it)</span>
          <div className="border rounded-lg p-6 bg-background max-h-96 overflow-y-auto">
            <pre className="whitespace-pre-wrap text-xs leading-relaxed text-foreground font-sans">
              {content || "No content yet"}
            </pre>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
