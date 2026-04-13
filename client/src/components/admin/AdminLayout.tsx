import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  LayoutDashboard,
  FolderOpen,
  Inbox,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Settings,
  TrendingUp,
  ScrollText,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
  breadcrumbs?: { label: string; href?: string }[];
}

const navItems = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Projects", href: "/admin", icon: FolderOpen },
  { label: "Inbox", href: "/admin/inbox", icon: Inbox },
  { label: "Pricing Rules", href: "/admin/pricing-rules", icon: TrendingUp },
  { label: "Terms & Conditions", href: "/admin/terms", icon: ScrollText },
  { label: "Company Settings", href: "/admin/settings", icon: Settings },
];

export default function AdminLayout({ children, title, breadcrumbs }: AdminLayoutProps) {
  const [, navigate] = useLocation();
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [authChecked, setAuthChecked] = useState(false);
  const meQuery = trpc.adminAuth.me.useQuery(undefined, {
    retry: 2,
    retryDelay: 500,
    staleTime: 0,
  });
  const logoutMutation = trpc.adminAuth.logout.useMutation({
    onSuccess: () => { window.location.href = "/"; },
  });

  useEffect(() => {
    if (!meQuery.isLoading) {
      setAuthChecked(true);
    }
  }, [meQuery.isLoading]);

  useEffect(() => {
    if (authChecked && meQuery.data === null) {
      window.location.href = "/";
    }
  }, [authChecked, meQuery.data]);

  if (meQuery.isLoading || !authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bm-cream)" }}>
        <div className="w-6 h-6 border-2 border-[var(--bm-petrol)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-8 border-b" style={{ borderColor: "var(--sidebar-border)" }}>
        <img
          src="https://d2xsxph8kpxj0f.cloudfront.net/310519663548387177/imEXQJppF9z2GgJphACuNv/B-Modern-Homes_Logo_Horizontal-Monochrome_RGB_233b3af0.png"
          alt="B Modern Homes"
          className="h-8 mb-3"
        />
        <div className="text-xs tracking-wider" style={{ color: "var(--bm-bluegum)", fontFamily: "Lato, sans-serif", fontWeight: 300 }}>
          Tender Portal
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href || (item.href !== "/admin" && location.startsWith(item.href));
          return (
            <Link key={item.label} href={item.href}>
              <div
                className={`flex items-center gap-3 px-3 py-2.5 rounded text-sm cursor-pointer transition-all ${
                  isActive
                    ? "text-white"
                    : "text-foreground/70 hover:text-foreground hover:bg-secondary"
                }`}
                style={isActive ? { background: "var(--bm-petrol)", fontFamily: "Lato, sans-serif" } : { fontFamily: "Lato, sans-serif" }}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon size={16} />
                {item.label}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="px-4 py-4 border-t" style={{ borderColor: "var(--sidebar-border)" }}>
        <div className="flex items-center justify-between px-3 py-2">
          <div>
            <div className="text-xs font-medium" style={{ fontFamily: "Lato, sans-serif" }}>
              {meQuery.data?.username || "Admin"}
            </div>
            <div className="text-xs" style={{ color: "var(--bm-bluegum)", fontFamily: "Lato, sans-serif" }}>Administrator</div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => logoutMutation.mutate()}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
          >
            <LogOut size={15} />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex" style={{ background: "var(--bm-cream)" }}>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-56 flex-col border-r bg-card" style={{ borderColor: "var(--sidebar-border)" }}>
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-64 flex flex-col bg-card border-r z-50" style={{ borderColor: "var(--sidebar-border)" }}>
            <button
              className="absolute top-4 right-4 p-1 text-muted-foreground"
              onClick={() => setSidebarOpen(false)}
            >
              <X size={18} />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-14 flex items-center gap-4 px-6 border-b bg-card" style={{ borderColor: "var(--border)" }}>
          <button
            className="lg:hidden p-1 text-muted-foreground"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} />
          </button>

          {/* Breadcrumbs */}
          <div className="flex items-center gap-1.5 text-sm min-w-0">
            {breadcrumbs ? (
              breadcrumbs.map((crumb, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  {i > 0 && <ChevronRight size={12} className="text-muted-foreground" />}
                  {crumb.href ? (
                    <Link href={crumb.href}>
                      <span className="text-muted-foreground hover:text-foreground cursor-pointer" style={{ fontFamily: "Lato, sans-serif" }}>
                        {crumb.label}
                      </span>
                    </Link>
                  ) : (
                    <span className="font-medium truncate" style={{ fontFamily: "Lato, sans-serif" }}>{crumb.label}</span>
                  )}
                </span>
              ))
            ) : title ? (
              <span className="font-medium" style={{ fontFamily: "Lato, sans-serif" }}>{title}</span>
            ) : null}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
