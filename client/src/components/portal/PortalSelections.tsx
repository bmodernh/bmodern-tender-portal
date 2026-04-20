/**
 * PortalSelections — wraps the existing tender presentation (inclusions, upgrades, etc.)
 * inside the new portal layout. We render the same sections that were previously
 * the entire ClientPortal page.
 *
 * This component receives the token and project from the parent ClientPortal
 * and renders all the tender-related sections.
 */

import { useState } from "react";
import { Sparkles } from "lucide-react";

// We import these from the parent file — they're co-located in ClientPortal.tsx
// Since those are internal functions, we'll pass them as render props or re-export.
// For now, we'll just signal that the selections tab should render the original content.

interface Props {
  token: string;
  project: any;
  children: React.ReactNode;
}

export default function PortalSelections({ token, project, children }: Props) {
  return (
    <div className="space-y-0">
      {children}
    </div>
  );
}
