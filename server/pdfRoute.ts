/**
 * Express route for PDF generation.
 * GET /api/pdf/proposal/:projectId  — admin download (requires bm_admin_session cookie)
 * GET /api/pdf/portal/:token        — client download (uses portal token)
 */
import type { Express, Request, Response } from "express";
import { getDb } from "./db";
import { generateProposalPdf, type PdfData } from "./pdf";
import {
  projects,
  inclusionCategories,
  inclusionItems,
  exclusions,
  provisionalSums,
  upgradeGroups,
  upgradeOptions,
  planImages,
  companySettings,
  clientTokens,
} from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { verifyJwt } from "./_core/jwt";
import { parse as parseCookieHeader } from "cookie";

async function buildPdfData(projectId: number): Promise<PdfData | null> {
  const db = await getDb();
  if (!db) return null;

  const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
  if (!project) return null;

  const [categories, items, excls, ps, groups, opts, imgs, [company]] = await Promise.all([
    db.select().from(inclusionCategories)
      .where(eq(inclusionCategories.projectId, projectId))
      .orderBy(inclusionCategories.position),
    db.select().from(inclusionItems)
      .where(eq(inclusionItems.projectId, projectId))
      .orderBy(inclusionItems.categoryId, inclusionItems.position),
    db.select().from(exclusions).where(eq(exclusions.projectId, projectId)).orderBy(exclusions.id),
    db.select().from(provisionalSums).where(eq(provisionalSums.projectId, projectId)).orderBy(provisionalSums.id),
    db.select().from(upgradeGroups).where(eq(upgradeGroups.projectId, projectId)).orderBy(upgradeGroups.id),
    db.select().from(upgradeOptions).where(eq(upgradeOptions.projectId, projectId)).orderBy(upgradeOptions.id),
    db.select().from(planImages).where(eq(planImages.projectId, projectId)).orderBy(planImages.position),
    db.select().from(companySettings).limit(1),
  ]);

  // Build category+items structure (only included items)
  const inclusionsData = categories.map(cat => ({
    title: cat.name,
    description: null as string | null,
    imageUrl: cat.imageUrl,
    items: items
      .filter(i => i.categoryId === cat.id && i.included)
      .map(i => ({
        name: i.description || i.name,
        qty: i.qty,
        unit: i.unit,
      })),
  })).filter(cat => cat.items.length > 0);

  // Group upgrade options by group
  const upgradeGroupsWithOptions = groups.map((g) => ({
    category: g.category,
    options: opts
      .filter((o) => o.groupId === g.id)
      .map((o) => ({
        name: o.optionName,
        description: o.description,
        priceDelta: o.priceDelta,
        isIncluded: o.isIncluded === true,
      })),
  }));

  return {
    project: {
      clientName: project.clientName,
      projectAddress: project.projectAddress,
      proposalNumber: project.proposalNumber,
      projectType: project.projectType,
      buildType: project.buildType,
      baseContractPrice: project.baseContractPrice,
      status: project.status,
      tenderExpiry: project.tenderExpiryDate,
      heroImageUrl: project.heroImageUrl,
    },
    inclusions: inclusionsData.map((cat) => ({
      title: cat.title,
      description: cat.description,
      imageUrl: cat.imageUrl,
      items: cat.items,
    })),
    exclusions: excls.map((e) => ({ description: e.description })),
    provisionalSums: ps.map((p) => ({
      description: p.description,
      amount: p.amount,
      notes: p.notes,
    })),
    upgradeGroups: upgradeGroupsWithOptions,
    planImages: imgs.map((i) => ({
      title: i.title,
      imageUrl: i.imageUrl,
    })),
    company: company
      ? {
          aboutUs: company.aboutUs,
          tagline: company.tagline,
          credentials: company.credentials,
          phone: company.phone,
          email: company.email,
          website: company.website,
          address: company.address,
          logoUrl: company.logoUrl,
        }
      : null,
  };
}

export function registerPdfRoute(app: Express) {
  // Admin: GET /api/pdf/proposal/:projectId  (requires admin session cookie)
  app.get("/api/pdf/proposal/:projectId", async (req: Request, res: Response) => {
    try {
      // Verify admin session via cookie (use cookie package for reliable parsing)
      const cookieHeader = req.headers.cookie || "";
      const cookies = parseCookieHeader(cookieHeader);
      const sessionToken = cookies["bm_admin_session"];
      if (!sessionToken) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      let payload: Record<string, unknown>;
      try {
        payload = await verifyJwt(sessionToken);
      } catch {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      if (!payload) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        res.status(400).json({ error: "Invalid project ID" });
        return;
      }

      const data = await buildPdfData(projectId);
      if (!data) {
        res.status(404).json({ error: "Project not found" });
        return;
      }

      const pdfBuffer = await generateProposalPdf(data);
      const filename = `B-Modern-Proposal-${data.project.proposalNumber || projectId}.pdf`;

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.setHeader("Content-Length", pdfBuffer.length);
      res.send(pdfBuffer);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[PDF] Admin generation error:", msg, err);
      res.status(500).json({ error: `PDF generation failed: ${msg}` });
    }
  });

  // Client portal: GET /api/pdf/portal/:token
  app.get("/api/pdf/portal/:token", async (req: Request, res: Response) => {
    try {
      const db = await getDb();
      if (!db) {
        res.status(500).json({ error: "Database unavailable" });
        return;
      }

      const [tokenRow] = await db
        .select()
        .from(clientTokens)
        .where(eq(clientTokens.token, req.params.token))
        .limit(1);

      if (!tokenRow) {
        res.status(404).json({ error: "Invalid portal link" });
        return;
      }

      // Check expiry
      if (tokenRow.expiresAt && new Date(tokenRow.expiresAt) < new Date()) {
        res.status(403).json({ error: "Portal link has expired" });
        return;
      }

      const data = await buildPdfData(tokenRow.projectId);
      if (!data) {
        res.status(404).json({ error: "Project not found" });
        return;
      }

      const pdfBuffer = await generateProposalPdf(data);
      const filename = `B-Modern-Proposal-${data.project.proposalNumber || tokenRow.projectId}.pdf`;

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.setHeader("Content-Length", pdfBuffer.length);
      res.send(pdfBuffer);
    } catch (err) {
      console.error("[PDF] Portal generation error:", err);
      res.status(500).json({ error: "PDF generation failed" });
    }
  });
}
