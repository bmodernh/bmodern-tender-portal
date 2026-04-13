import { useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Search,
  MapPin,
  Calendar,
  ChevronRight,
  Building2,
} from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  presented: "Presented",
  under_review: "Under Review",
  accepted: "Accepted",
  contract_creation: "Contract Creation",
  contract_signed: "Contract Signed",
  post_contract: "Post Contract",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  presented: "bg-blue-50 text-blue-700",
  under_review: "bg-amber-50 text-amber-700",
  accepted: "bg-green-50 text-green-700",
  contract_creation: "bg-purple-50 text-purple-700",
  contract_signed: "bg-teal-50 text-teal-700",
  post_contract: "bg-slate-100 text-slate-700",
};

export default function AdminDashboard() {
  const [search, setSearch] = useState("");
  const [, navigate] = useLocation();

  const { data: projects, isLoading } = trpc.projects.list.useQuery();

  const filtered = projects?.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.clientName.toLowerCase().includes(q) ||
      p.projectAddress.toLowerCase().includes(q) ||
      p.proposalNumber.toLowerCase().includes(q)
    );
  });

  const stats = {
    total: projects?.length || 0,
    active: projects?.filter((p) => !["draft", "post_contract"].includes(p.status)).length || 0,
    draft: projects?.filter((p) => p.status === "draft").length || 0,
    signed: projects?.filter((p) => p.status === "contract_signed" || p.status === "post_contract").length || 0,
  };

  return (
    <AdminLayout
      title="Projects"
      breadcrumbs={[{ label: "Dashboard" }]}
    >
      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Projects", value: stats.total },
          { label: "Active", value: stats.active },
          { label: "Drafts", value: stats.draft },
          { label: "Signed", value: stats.signed },
        ].map((stat) => (
          <div key={stat.label} className="bg-card border rounded p-4" style={{ borderColor: "var(--border)" }}>
            <div className="text-2xl font-light mb-1" style={{ fontFamily: "'Playfair Display SC', Georgia, serif", color: "var(--bm-petrol)" }}>
              {stat.value}
            </div>
            <div className="text-xs tracking-wider uppercase" style={{ color: "var(--bm-bluegum)", fontFamily: "Lato, sans-serif" }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by client, address or proposal number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm"
            style={{ fontFamily: "Lato, sans-serif" }}
          />
        </div>
        <Button
          onClick={() => navigate("/admin/projects/new")}
          className="h-9 text-xs tracking-wider uppercase gap-2 shrink-0"
          style={{ background: "var(--bm-petrol)", fontFamily: "Lato, sans-serif" }}
        >
          <Plus size={14} />
          New Project
        </Button>
      </div>

      {/* Project list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-card border rounded animate-pulse" style={{ borderColor: "var(--border)" }} />
          ))}
        </div>
      ) : filtered?.length === 0 ? (
        <div className="text-center py-20">
          <Building2 size={40} className="mx-auto mb-4 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground" style={{ fontFamily: "Lato, sans-serif" }}>
            {search ? "No projects match your search" : "No projects yet. Create your first project."}
          </p>
          {!search && (
            <Button
              onClick={() => navigate("/admin/projects/new")}
              variant="outline"
              className="mt-4 text-xs tracking-wider uppercase gap-2"
              style={{ fontFamily: "Lato, sans-serif" }}
            >
              <Plus size={14} />
              Create Project
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered?.map((project) => (
            <Link key={project.id} href={`/admin/projects/${project.id}`}>
              <div className="bg-card border rounded p-4 hover:border-[var(--bm-petrol)] transition-colors cursor-pointer group" style={{ borderColor: "var(--border)" }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                      <span className="font-medium text-sm" style={{ fontFamily: "Lato, sans-serif" }}>
                        {project.clientName}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[project.status] || "bg-gray-100 text-gray-600"}`}
                        style={{ fontFamily: "Lato, sans-serif" }}
                      >
                        {STATUS_LABELS[project.status] || project.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1">
                        <MapPin size={11} />
                        {project.projectAddress}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="opacity-60">#{project.proposalNumber}</span>
                      </span>
                      {project.tenderExpiryDate && (
                        <span className="flex items-center gap-1">
                          <Calendar size={11} />
                          Expires {new Date(project.tenderExpiryDate).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {project.baseContractPrice && (
                      <div className="text-right hidden sm:block">
                        <div className="text-xs text-muted-foreground mb-0.5" style={{ fontFamily: "Lato, sans-serif" }}>Base Contract</div>
                        <div className="text-sm font-medium" style={{ fontFamily: "Lato, sans-serif", color: "var(--bm-petrol)" }}>
                          ${Number(project.baseContractPrice).toLocaleString("en-AU")}
                        </div>
                      </div>
                    )}
                    <ChevronRight size={16} className="text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
