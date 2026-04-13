import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Lock } from "lucide-react";

export default function AdminLogin() {
  const [, navigate] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const loginMutation = trpc.adminAuth.login.useMutation({
    onSuccess: () => {
      // Use hard redirect so the browser fully commits the session cookie
      // before the admin dashboard loads and checks auth
      window.location.href = "/admin";
    },
    onError: (err) => {
      toast.error(err.message || "Invalid credentials. Please check your username and password.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) { toast.error("Please enter your credentials"); return; }
    loginMutation.mutate({ username, password });
  };

  return (
    <div className="min-h-screen flex" style={{ background: "var(--bm-petrol)" }}>
      {/* Left panel — brand */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-16" style={{ background: "var(--bm-petrol-dark, oklch(18% 0.04 220))" }}>
        <div>
          <img
            src="https://d2xsxph8kpxj0f.cloudfront.net/310519663548387177/imEXQJppF9z2GgJphACuNv/B-Modern-Homes_Logo_Horizontal-White_RGB_82d45951.png"
            alt="B Modern Homes"
            className="h-10 mb-12 opacity-90"
          />
          <h1 className="text-white text-4xl leading-tight mb-6" style={{ fontFamily: "'Playfair Display SC', Georgia, serif", fontWeight: 400 }}>
            Tender<br />Portal
          </h1>
          <p className="text-white/60 text-sm leading-relaxed max-w-xs" style={{ fontFamily: "Lato, sans-serif", fontWeight: 300 }}>
            The internal management system for B Modern Homes proposals, client inclusions, and upgrade selections.
          </p>
        </div>
        <div className="text-white/30 text-xs" style={{ fontFamily: "Lato, sans-serif" }}>
          © {new Date().getFullYear()} B Modern Homes
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex items-center justify-center p-8" style={{ background: "var(--bm-cream, oklch(97% 0.005 80))" }}>
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden mb-10 text-center">
            <div className="text-xs tracking-[0.3em] uppercase mb-1" style={{ color: "var(--bm-petrol)", fontFamily: "Lato, sans-serif" }}>B Modern Homes</div>
            <div className="w-8 h-px mx-auto" style={{ background: "var(--bm-petrol)" }} />
          </div>

          <div className="mb-8">
            <h2 className="text-2xl mb-2" style={{ fontFamily: "'Playfair Display SC', Georgia, serif", color: "var(--bm-petrol)", fontWeight: 400 }}>
              Admin Access
            </h2>
            <p className="text-sm" style={{ color: "var(--bm-bluegum)", fontFamily: "Lato, sans-serif" }}>
              Sign in to manage projects and proposals
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-xs tracking-wider uppercase" style={{ color: "var(--bm-petrol)", fontFamily: "Lato, sans-serif" }}>
                Username
              </Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                autoComplete="username"
                className="h-11 border-0 border-b-2 rounded-none bg-transparent focus-visible:ring-0 focus-visible:border-[var(--bm-petrol)] transition-colors"
                style={{ borderColor: "var(--border)", fontFamily: "Lato, sans-serif" }}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs tracking-wider uppercase" style={{ color: "var(--bm-petrol)", fontFamily: "Lato, sans-serif" }}>
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  autoComplete="current-password"
                  className="h-11 border-0 border-b-2 rounded-none bg-transparent focus-visible:ring-0 focus-visible:border-[var(--bm-petrol)] pr-10 transition-colors"
                  style={{ borderColor: "var(--border)", fontFamily: "Lato, sans-serif" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                disabled={loginMutation.isPending}
                className="w-full h-11 text-xs tracking-[0.2em] uppercase font-normal"
                style={{ background: "var(--bm-petrol)", fontFamily: "Lato, sans-serif" }}
              >
                {loginMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing In
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Lock size={14} />
                    Sign In
                  </span>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
