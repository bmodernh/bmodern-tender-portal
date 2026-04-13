import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Inbox, Clock, CheckCircle, AlertCircle, MapPin } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700",
  reviewed: "bg-blue-50 text-blue-700",
  actioned: "bg-green-50 text-green-700",
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  pending: <Clock size={12} />,
  reviewed: <AlertCircle size={12} />,
  actioned: <CheckCircle size={12} />,
};

export default function AdminInbox() {
  const [selected, setSelected] = useState<any>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [newStatus, setNewStatus] = useState<string>("");

  const { data: requests, isLoading, refetch } = trpc.inbox.listAll.useQuery();
  const updateMutation = trpc.inbox.updateStatus.useMutation({
    onSuccess: () => { toast.success("Status updated"); refetch(); setSelected(null); },
    onError: (e) => toast.error(e.message),
  });

  const openRequest = (req: any) => {
    setSelected(req);
    setAdminNotes(req.adminNotes || "");
    setNewStatus(req.status);
  };

  const handleUpdate = () => {
    if (!selected) return;
    updateMutation.mutate({ id: selected.id, status: newStatus as any, adminNotes });
  };

  const pending = requests?.filter((r) => r.status === "pending").length || 0;

  return (
    <AdminLayout breadcrumbs={[{ label: "Dashboard", href: "/admin" }, { label: "Inbox" }]}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl mb-1" style={{ fontFamily: "'Playfair Display SC', Georgia, serif", color: "var(--bm-petrol)" }}>
            Change Requests
          </h1>
          <p className="text-sm text-muted-foreground" style={{ fontFamily: "Lato, sans-serif" }}>
            {pending > 0 ? `${pending} pending request${pending !== 1 ? "s" : ""}` : "All requests reviewed"}
          </p>
        </div>
        {pending > 0 && (
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: "var(--bm-petrol)" }}>
            {pending}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-card border rounded animate-pulse" style={{ borderColor: "var(--border)" }} />)}
        </div>
      ) : !requests?.length ? (
        <div className="text-center py-20">
          <Inbox size={40} className="mx-auto mb-4 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground" style={{ fontFamily: "Lato, sans-serif" }}>No change requests yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {requests.map((req) => (
            <div
              key={req.id}
              className="bg-card border rounded p-4 cursor-pointer hover:border-[var(--bm-petrol)] transition-colors"
              style={{ borderColor: req.status === "pending" ? "var(--bm-petrol)" : "var(--border)" }}
              onClick={() => openRequest(req)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-medium text-sm" style={{ fontFamily: "Lato, sans-serif" }}>{req.category}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${STATUS_COLORS[req.status]}`} style={{ fontFamily: "Lato, sans-serif" }}>
                      {STATUS_ICONS[req.status]}
                      {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2" style={{ fontFamily: "Lato, sans-serif" }}>{req.description}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span>Project #{req.projectId}</span>
                    <span>{new Date(req.createdAt).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail dialog */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "'Playfair Display SC', Georgia, serif", color: "var(--bm-petrol)" }}>
              Change Request
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="bg-secondary rounded p-3 space-y-2">
                <div className="text-xs text-muted-foreground" style={{ fontFamily: "Lato, sans-serif" }}>Category</div>
                <div className="font-medium text-sm" style={{ fontFamily: "Lato, sans-serif" }}>{selected.category}</div>
              </div>
              <div className="bg-secondary rounded p-3 space-y-2">
                <div className="text-xs text-muted-foreground" style={{ fontFamily: "Lato, sans-serif" }}>Description</div>
                <div className="text-sm" style={{ fontFamily: "Lato, sans-serif" }}>{selected.description}</div>
              </div>
              <div className="text-xs text-muted-foreground" style={{ fontFamily: "Lato, sans-serif" }}>
                Submitted: {new Date(selected.createdAt).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
              </div>
              <div className="space-y-1.5">
                <label className="text-xs tracking-wider uppercase" style={{ color: "var(--bm-petrol)", fontFamily: "Lato, sans-serif" }}>Status</label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger className="h-9 text-sm" style={{ fontFamily: "Lato, sans-serif" }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="reviewed">Reviewed</SelectItem>
                    <SelectItem value="actioned">Actioned</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs tracking-wider uppercase" style={{ color: "var(--bm-petrol)", fontFamily: "Lato, sans-serif" }}>Admin Notes</label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add internal notes..."
                  rows={3}
                  className="text-sm resize-none"
                  style={{ fontFamily: "Lato, sans-serif" }}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleUpdate}
                  disabled={updateMutation.isPending}
                  className="flex-1 text-xs tracking-wider uppercase"
                  style={{ background: "var(--bm-petrol)", fontFamily: "Lato, sans-serif" }}
                >
                  {updateMutation.isPending ? "Saving..." : "Save"}
                </Button>
                <Button variant="outline" onClick={() => setSelected(null)} className="text-xs" style={{ fontFamily: "Lato, sans-serif" }}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
