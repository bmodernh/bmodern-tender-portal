import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

// Admin pages
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProjectDetail from "./pages/admin/AdminProjectDetail";
import AdminProjectForm from "./pages/admin/AdminProjectForm";
import AdminInbox from "./pages/admin/AdminInbox";
import AdminCompanySettings from "./pages/admin/AdminCompanySettings";

// Client portal pages
import ClientPortal from "./pages/portal/ClientPortal";

function Router() {
  return (
    <Switch>
      {/* Admin routes */}
      <Route path="/" component={AdminLogin} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/projects/new" component={AdminProjectForm} />
      <Route path="/admin/projects/:id/edit" component={AdminProjectForm} />
      <Route path="/admin/projects/:id" component={AdminProjectDetail} />
      <Route path="/admin/inbox" component={AdminInbox} />
      <Route path="/admin/settings" component={AdminCompanySettings} />

      {/* Client portal */}
      <Route path="/portal/:token" component={ClientPortal} />

      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster richColors position="top-right" />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
