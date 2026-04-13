/**
 * Express route for PDF generation.
 * GET /api/pdf/proposal/:projectId  — admin download (requires bm_admin_session cookie)
 * GET /api/pdf/portal/:token        — client download (uses portal token)
 */
import type { Express, Request, Response } from "express";
import { getDb } from "./db";
import { generateProposalPdf, type PdfData } from "./pdf";
import { generateClientSelectionsPdf, type ClientSelectionsPdfData } from "./clientSelectionsPdf";
import {
  projects,
  inclusionCategories,
  inclusionItems,
  exclusions,
  provisionalSums,
  upgradeGroups,
  upgradeOptions,
  upgradeSelections,
  clientItemSelections,
  planImages,
  companySettings,
  clientTokens,
} from "../drizzle/schema";
import { calculatePackagePrices } from "./db";
import { eq, and } from "drizzle-orm";
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

  // Client selections summary: GET /api/pdf/selections/:token
  app.get("/api/pdf/selections/:token", async (req: Request, res: Response) => {
    try {
      const db = await getDb();
      if (!db) { res.status(500).json({ error: "Database unavailable" }); return; }

      const [tokenRow] = await db.select().from(clientTokens)
        .where(eq(clientTokens.token, req.params.token)).limit(1);
      if (!tokenRow) { res.status(404).json({ error: "Invalid portal link" }); return; }
      if (tokenRow.expiresAt && new Date(tokenRow.expiresAt) < new Date()) {
        res.status(403).json({ error: "Portal link has expired" }); return;
      }

      const projectId = tokenRow.projectId;
      const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
      if (!project) { res.status(404).json({ error: "Project not found" }); return; }

      // Get pricing data
      const priceData = await calculatePackagePrices(projectId);
      if (!priceData) { res.status(500).json({ error: "Could not calculate prices" }); return; }

      const startingTier = project.startingTier ?? 1;

      // Get client tier selections
      const tierSels = await db.select().from(clientItemSelections)
        .where(and(
          eq(clientItemSelections.projectId, projectId),
          eq(clientItemSelections.clientToken, tokenRow.token),
        ));
      const selMap: Record<string, number> = {};
      for (const s of tierSels) selMap[s.itemKey] = s.selectedTier;

      // Calculate relative deltas
      const getRelativeDelta = (item: typeof priceData.lineItems[0], targetTier: number) => {
        if (targetTier <= startingTier) return 0;
        const baseDelta = startingTier === 1 ? 0 : startingTier === 2 ? Number(item.tier2Delta || 0) : Number(item.tier3Delta || 0);
        const targetDelta = targetTier === 1 ? 0 : targetTier === 2 ? Number(item.tier2Delta || 0) : Number(item.tier3Delta || 0);
        return targetDelta - baseDelta;
      };

      // Group line items by category
      const catMap = new Map<string, typeof priceData.lineItems>();
      for (const item of priceData.lineItems) {
        if (!catMap.has(item.category)) catMap.set(item.category, []);
        catMap.get(item.category)!.push(item);
      }

      let upgradeTotal = 0;
      const tierSelections: ClientSelectionsPdfData["tierSelections"] = [];
      for (const [category, items] of Array.from(catMap.entries())) {
        const catItems = items.map((item: any) => {
          const selectedTier = selMap[item.itemKey] ?? startingTier;
          const relativeDelta = getRelativeDelta(item, selectedTier);
          upgradeTotal += relativeDelta;
          return {
            label: item.label,
            unit: item.unit,
            qty: item.qty,
            selectedTier,
            tier1Label: item.tier1Label,
            tier2Label: item.tier2Label,
            tier3Label: item.tier3Label,
            relativeDelta,
          };
        });
        tierSelections.push({ category, items: catItems });
      }

      // Get plus options selections
      const [groups, opts, plusSels] = await Promise.all([
        db.select().from(upgradeGroups).where(eq(upgradeGroups.projectId, projectId)).orderBy(upgradeGroups.id),
        db.select().from(upgradeOptions).where(eq(upgradeOptions.projectId, projectId)).orderBy(upgradeOptions.id),
        db.select().from(upgradeSelections).where(and(
          eq(upgradeSelections.projectId, projectId),
          eq(upgradeSelections.clientToken, tokenRow.token),
        )),
      ]);
      const plusSelSet = new Set(plusSels.filter(s => s.selected).map(s => s.upgradeOptionId));

      let plusOptionsTotal = 0;
      const plusOptions: ClientSelectionsPdfData["plusOptions"] = groups.map(g => {
        const groupOpts = opts.filter(o => o.groupId === g.id).map(o => {
          const selected = plusSelSet.has(o.id);
          if (selected && !o.isIncluded) plusOptionsTotal += parseFloat(String(o.priceDelta) || "0");
          return {
            name: o.optionName,
            description: o.description,
            selected,
            isIncluded: o.isIncluded,
            priceDelta: parseFloat(String(o.priceDelta) || "0"),
          };
        });
        return { groupName: g.category, options: groupOpts };
      });

      const basePrice = parseFloat(project.baseContractPrice ?? "0");
      const [company] = await db.select().from(companySettings).limit(1);

      const pdfData: ClientSelectionsPdfData = {
        project: {
          clientName: project.clientName,
          projectAddress: project.projectAddress,
          proposalNumber: project.proposalNumber,
          baseContractPrice: project.baseContractPrice,
          startingTier,
          heroImageUrl: project.heroImageUrl,
        },
        tierSelections,
        plusOptions,
        totals: {
          basePrice,
          upgradeTotal,
          plusOptionsTotal,
          grandTotal: basePrice + upgradeTotal + plusOptionsTotal,
        },
        company: company ? {
          logoUrl: company.logoUrl,
          phone: company.phone,
          email: company.email,
        } : null,
        submittedAt: new Date(),
      };

      const pdfBuffer = await generateClientSelectionsPdf(pdfData);
      const filename = `B-Modern-Selections-${project.proposalNumber || projectId}.pdf`;

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.setHeader("Content-Length", pdfBuffer.length);
      res.send(pdfBuffer);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[PDF] Client selections generation error:", msg, err);
      res.status(500).json({ error: `PDF generation failed: ${msg}` });
    }
  });
}
