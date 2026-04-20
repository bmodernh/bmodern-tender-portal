import { useState, type ReactNode } from "react";
import {
  LayoutDashboard, Camera, CheckSquare, FileText, MessageSquare,
  ClipboardList, Package, Menu, X, ChevronRight, ArrowUpDown,
} from "lucide-react";

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "selections", label: "Selections", icon: Package },
  { key: "site-updates", label: "Site Updates", icon: Camera },
  { key: "approvals", label: "Approvals", icon: CheckSquare },
  { key: "variations", label: "Variations", icon: ArrowUpDown },
  { key: "documents", label: "Documents", icon: FileText },
  { key: "messages", label: "Messages", icon: MessageSquare },
  { key: "minutes", label: "Meeting Minutes", icon: ClipboardList },
] as const;

export type PortalTab = (typeof NAV_ITEMS)[number]["key"];

interface PortalLayoutProps {
  activeTab: PortalTab;
  onTabChange: (tab: PortalTab) => void;
  projectName: string;
  clientName?: string;
  children: ReactNode;
  badges?: Partial<Record<PortalTab, number>>;
}

export default function PortalLayout({ activeTab, onTabChange, projectName, clientName, children, badges }: PortalLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex" style={{ background: "#f8f8f6", fontFamily: "Lato, sans-serif" }}>
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-200 ease-in-out
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static lg:inset-auto`}
        style={{ background: "#1a2b3c" }}
      >
        <div className="flex flex-col h-full">
          <div className="p-5 border-b" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
            <h2 className="text-white text-sm font-bold tracking-wide uppercase">Client Portal</h2>
            <p className="text-xs mt-1 truncate" style={{ color: "rgba(255,255,255,0.6)" }}>{projectName}</p>
            {clientName && <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.4)" }}>Welcome, {clientName}</p>}
          </div>
          <nav className="flex-1 py-3 overflow-y-auto">
            {NAV_ITEMS.map(({ key, label, icon: Icon }) => {
              const isActive = activeTab === key;
              const badge = badges?.[key];
              return (
                <button
                  key={key}
                  onClick={() => { onTabChange(key); setMobileOpen(false); }}
                  className={`w-full flex items-center gap-3 px-5 py-2.5 text-sm transition-colors ${
                    isActive ? "text-white" : "text-white/60 hover:text-white/90 hover:bg-white/5"
                  }`}
                  style={isActive ? { background: "rgba(255,255,255,0.1)", borderLeft: "3px solid #c9a96e" } : { borderLeft: "3px solid transparent" }}
                >
                  <Icon size={16} />
                  <span className="flex-1 text-left">{label}</span>
                  {badge && badge > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: "#c9a96e", color: "#1a2b3c" }}>
                      {badge}
                    </span>
                  )}
                  {isActive && <ChevronRight size={14} className="opacity-60" />}
                </button>
              );
            })}
          </nav>
          <div className="p-4 border-t text-center" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
            <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>Powered by B Modern Homes</p>
          </div>
        </div>
      </aside>
      {mobileOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setMobileOpen(false)} />}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3 bg-white border-b shadow-sm" style={{ borderColor: "#e5e5e3" }}>
          <button className="lg:hidden p-1.5 rounded hover:bg-gray-100" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <h1 className="text-sm font-semibold truncate" style={{ color: "#1a2b3c" }}>
            {NAV_ITEMS.find(n => n.key === activeTab)?.label ?? "Portal"}
          </h1>
        </header>
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
