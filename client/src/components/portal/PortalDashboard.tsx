import { trpc } from "@/lib/trpc";
import { Camera, CheckSquare, ArrowUpDown, FileText, ClipboardList, AlertCircle, Clock, Loader2 } from "lucide-react";
import type { PortalTab } from "./PortalLayout";

interface Props { projectId: number; onNavigate: (tab: PortalTab) => void; }

export default function PortalDashboard({ projectId, onNavigate }: Props) {
  const { data: updates } = trpc.siteUpdates.list.useQuery({ projectId });
  const { data: approvals } = trpc.approvals.list.useQuery({ projectId });
  const { data: vars } = trpc.variations.list.useQuery({ projectId });
  const { data: docs } = trpc.documents.list.useQuery({ projectId });
  const { data: minutes } = trpc.meetingMinutes.list.useQuery({ projectId });

  const pendingApprovals = approvals?.filter((a: any) => a.status === "pending").length ?? 0;
  const pendingVariations = vars?.filter((v: any) => v.status === "pending").length ?? 0;
  const unsignedDocs = docs?.filter((d: any) => d.requiresSignature && !d.clientSignedAt).length ?? 0;
  const unsignedMinutes = minutes?.filter((m: any) => !m.clientSignedAt).length ?? 0;
  const totalActions = pendingApprovals + pendingVariations + unsignedDocs + unsignedMinutes;

  return (
    <div className="space-y-6 max-w-4xl">
      {totalActions > 0 && (
        <div className="rounded-lg p-4 flex items-start gap-3" style={{ background: "#fef3cd", border: "1px solid #f0d78c" }}>
          <AlertCircle size={18} className="shrink-0 mt-0.5" style={{ color: "#856404" }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: "#856404" }}>{totalActions} item{totalActions > 1 ? "s" : ""} require your attention</p>
            <ul className="text-xs mt-1 space-y-0.5" style={{ color: "#856404" }}>
              {pendingApprovals > 0 && <li>{pendingApprovals} approval{pendingApprovals > 1 ? "s" : ""} pending</li>}
              {pendingVariations > 0 && <li>{pendingVariations} variation{pendingVariations > 1 ? "s" : ""} to review</li>}
              {unsignedDocs > 0 && <li>{unsignedDocs} document{unsignedDocs > 1 ? "s" : ""} to sign</li>}
              {unsignedMinutes > 0 && <li>{unsignedMinutes} meeting minute{unsignedMinutes > 1 ? "s" : ""} to sign</li>}
            </ul>
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {([
          { key: "site-updates" as PortalTab, label: "Site Updates", count: updates?.length ?? 0, icon: Camera, color: "#3b82f6" },
          { key: "approvals" as PortalTab, label: "Approvals", count: pendingApprovals, icon: CheckSquare, color: pendingApprovals > 0 ? "#f59e0b" : "#22c55e", sub: pendingApprovals > 0 ? "Pending" : "All clear" },
          { key: "variations" as PortalTab, label: "Variations", count: vars?.length ?? 0, icon: ArrowUpDown, color: "#8b5cf6" },
          { key: "documents" as PortalTab, label: "Documents", count: docs?.length ?? 0, icon: FileText, color: "#06b6d4" },
          { key: "minutes" as PortalTab, label: "Minutes", count: minutes?.length ?? 0, icon: ClipboardList, color: "#ec4899" },
        ]).map(({ key, label, count, icon: Icon, color, sub }) => (
          <button key={key} onClick={() => onNavigate(key)} className="bg-white rounded-lg p-4 text-left border hover:shadow-md transition-shadow" style={{ borderColor: "#e5e5e3" }}>
            <div className="flex items-center gap-2 mb-2"><div className="p-1.5 rounded" style={{ background: `${color}15` }}><Icon size={14} style={{ color }} /></div></div>
            <p className="text-2xl font-bold" style={{ color: "#1a2b3c" }}>{count}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
            {sub && <p className="text-[10px] mt-0.5" style={{ color }}>{sub}</p>}
          </button>
        ))}
      </div>
      <div className="bg-white rounded-lg border p-4" style={{ borderColor: "#e5e5e3" }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold" style={{ color: "#1a2b3c" }}>Recent Site Updates</h3>
          <button onClick={() => onNavigate("site-updates")} className="text-xs hover:underline" style={{ color: "#c9a96e" }}>View all</button>
        </div>
        {!updates ? (
          <div className="flex justify-center py-4"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
        ) : updates.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">No site updates yet</p>
        ) : (
          <div className="space-y-2">
            {updates.slice(0, 3).map((u: any) => (
              <div key={u.id} className="flex items-start gap-3 p-2 rounded hover:bg-gray-50">
                {u.photos?.[0] ? (
                  <img src={u.photos[0].imageUrl} alt="" className="w-12 h-12 rounded object-cover shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded bg-gray-100 flex items-center justify-center shrink-0"><Camera size={16} className="text-gray-400" /></div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: "#1a2b3c" }}>{u.title}</p>
                  <p className="text-xs text-muted-foreground">{new Date(u.createdAt).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}</p>
                  {u.stage && <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">{u.stage}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {(pendingApprovals > 0 || pendingVariations > 0) && (
        <div className="bg-white rounded-lg border p-4" style={{ borderColor: "#e5e5e3" }}>
          <h3 className="text-sm font-semibold mb-3" style={{ color: "#1a2b3c" }}>Pending Actions</h3>
          <div className="space-y-2">
            {approvals?.filter((a: any) => a.status === "pending").slice(0, 3).map((a: any) => (
              <div key={`a-${a.id}`} className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer" onClick={() => onNavigate("approvals")}>
                <Clock size={14} className="text-amber-500 shrink-0" />
                <div className="flex-1 min-w-0"><p className="text-sm truncate">{a.title}</p><p className="text-[10px] text-muted-foreground">Approval needed</p></div>
              </div>
            ))}
            {vars?.filter((v: any) => v.status === "pending").slice(0, 3).map((v: any) => (
              <div key={`v-${v.id}`} className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer" onClick={() => onNavigate("variations")}>
                <ArrowUpDown size={14} className="text-purple-500 shrink-0" />
                <div className="flex-1 min-w-0"><p className="text-sm truncate">{v.title}</p><p className="text-[10px] text-muted-foreground">Variation — ${Number(v.costImpact || 0).toLocaleString()}</p></div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
