/**
 * Client Selections Summary PDF
 * Generates a PDF showing the client's upgrade selections and updated tender total.
 */
import PDFDocument from "pdfkit";
import https from "https";
import http from "http";

// ─── Colour palette ───────────────────────────────────────────────────────────
const PETROL = "#203E4A";
const CREAM = "#F5F2EE";
const BORDER = "#DDD8D0";
const DARK = "#1A1A1A";
const MID = "#6D7E94";
const WHITE = "#FFFFFF";
const AMBER = "#b45309";
const PURPLE = "#6b21a8";
const GREEN = "#2E7D32";

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 48;
const CONTENT_W = PAGE_W - MARGIN * 2;

function fmt(n: number | string | null): string {
  const num = typeof n === "string" ? parseFloat(n) : n;
  if (num == null || isNaN(num)) return "$0";
  return `$${num.toLocaleString("en-AU", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function fmtDate(d: Date | null): string {
  return d ? new Date(d).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" }) : "";
}

function fetchImageBuffer(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith("https") ? https : http;
    lib.get(url, (res) => {
      if (res.statusCode !== 200) { reject(new Error(`Image fetch failed: ${res.statusCode}`)); return; }
      const chunks: Buffer[] = [];
      res.on("data", (chunk: Buffer) => chunks.push(chunk));
      res.on("end", () => resolve(Buffer.concat(chunks)));
      res.on("error", reject);
    }).on("error", reject);
  });
}

async function tryFetchImage(url: string | null): Promise<Buffer | null> {
  if (!url) return null;
  try { return await fetchImageBuffer(url); } catch { return null; }
}

function drawPageBackground(doc: PDFKit.PDFDocument, color = WHITE) {
  doc.rect(0, 0, PAGE_W, PAGE_H).fill(color);
}

function drawHeader(doc: PDFKit.PDFDocument, logoBuffer: Buffer | null) {
  doc.rect(0, 0, PAGE_W, 6).fill(PETROL);
  if (logoBuffer) {
    try { doc.image(logoBuffer, MARGIN, 18, { height: 28, fit: [160, 28] }); } catch {
      doc.fillColor(PETROL).fontSize(14).font("Helvetica-Bold").text("B MODERN HOMES", MARGIN, 22);
    }
  } else {
    doc.fillColor(PETROL).fontSize(14).font("Helvetica-Bold").text("B MODERN HOMES", MARGIN, 22);
  }
  doc.moveTo(MARGIN, 54).lineTo(PAGE_W - MARGIN, 54).strokeColor(BORDER).lineWidth(0.5).stroke();
}

function drawFooter(doc: PDFKit.PDFDocument, pageNum: number) {
  const y = PAGE_H - 32;
  doc.moveTo(MARGIN, y - 8).lineTo(PAGE_W - MARGIN, y - 8).strokeColor(BORDER).lineWidth(0.5).stroke();
  doc.fillColor(MID).fontSize(7.5).font("Helvetica");
  doc.text("bmodernhomes.com.au", MARGIN, y, { width: CONTENT_W / 2 });
  doc.text(`Page ${pageNum}`, MARGIN, y, { align: "right", width: CONTENT_W });
}

function sectionTitle(doc: PDFKit.PDFDocument, title: string, y: number): number {
  doc.rect(MARGIN, y, CONTENT_W, 26).fill(PETROL);
  doc.fillColor(WHITE).fontSize(9).font("Helvetica-Bold")
    .text(title.toUpperCase(), MARGIN + 12, y + 8, { width: CONTENT_W - 24 });
  return y + 34;
}

// ─── Types ───────────────────────────────────────────────────────────────────
export interface ClientSelectionsPdfData {
  project: {
    clientName: string;
    projectAddress: string;
    proposalNumber: string | null;
    baseContractPrice: string | null;
    startingTier: number;
    heroImageUrl: string | null;
  };
  tierSelections: Array<{
    category: string;
    items: Array<{
      label: string;
      unit: string;
      qty: number;
      selectedTier: number;
      tier1Label: string | null;
      tier2Label: string | null;
      tier3Label: string | null;
      relativeDelta: number;
    }>;
  }>;
  plusOptions: Array<{
    groupName: string;
    options: Array<{
      name: string;
      description: string | null;
      selected: boolean;
      isIncluded: boolean;
      priceDelta: number;
    }>;
  }>;
  totals: {
    basePrice: number;
    upgradeTotal: number;
    plusOptionsTotal: number;
    grandTotal: number;
  };
  company: {
    logoUrl: string | null;
    phone: string | null;
    email: string | null;
  } | null;
  submittedAt: Date | null;
}

const TIER_NAMES: Record<number, string> = {
  1: "Built for Excellence",
  2: "Tailored Living",
  3: "Signature Series",
};

const TIER_COLORS: Record<number, string> = {
  1: PETROL,
  2: AMBER,
  3: PURPLE,
};

// ─── Main generator ───────────────────────────────────────────────────────────
export async function generateClientSelectionsPdf(data: ClientSelectionsPdfData): Promise<Buffer> {
  const { project, tierSelections, plusOptions, totals, company, submittedAt } = data;

  const logoBuffer = await tryFetchImage(company?.logoUrl || null);

  const doc = new PDFDocument({
    size: "A4",
    margin: 0,
    bufferPages: true,
    info: {
      Title: `Upgrade Selections — ${project.clientName}`,
      Author: "B Modern Homes",
    },
  });

  const chunks: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));

  let pageNum = 1;

  const startContentPage = () => {
    doc.addPage();
    pageNum++;
    drawPageBackground(doc, WHITE);
    drawHeader(doc, logoBuffer);
    return 70;
  };

  // ─── Cover / Title Page ────────────────────────────────────────────────────
  drawPageBackground(doc, WHITE);
  doc.rect(0, 0, PAGE_W, 6).fill(PETROL);

  // Logo
  if (logoBuffer) {
    try { doc.image(logoBuffer, MARGIN, 24, { height: 32, fit: [180, 32] }); } catch {
      doc.fillColor(PETROL).fontSize(16).font("Helvetica-Bold").text("B MODERN HOMES", MARGIN, 28);
    }
  } else {
    doc.fillColor(PETROL).fontSize(16).font("Helvetica-Bold").text("B MODERN HOMES", MARGIN, 28);
  }

  doc.moveTo(MARGIN, 68).lineTo(PAGE_W - MARGIN, 68).strokeColor(BORDER).lineWidth(0.5).stroke();

  // Title
  let y = 90;
  doc.fillColor(PETROL).fontSize(9).font("Helvetica").text("UPGRADE SELECTIONS SUMMARY", MARGIN, y, { characterSpacing: 2 });
  y += 18;
  doc.fillColor(PETROL).fontSize(24).font("Helvetica-Bold").text(project.clientName.toUpperCase(), MARGIN, y, { width: CONTENT_W });
  y = doc.y + 6;
  doc.fillColor(MID).fontSize(11).font("Helvetica").text(project.projectAddress, MARGIN, y, { width: CONTENT_W });
  y = doc.y + 20;

  // Info row
  const infoItems = [
    ["Proposal No.", project.proposalNumber || "—"],
    ["Base Contract", fmt(project.baseContractPrice)],
    ["Starting Tier", TIER_NAMES[project.startingTier] || "Tier 1"],
    ["Date", submittedAt ? fmtDate(submittedAt) : fmtDate(new Date())],
  ];

  doc.rect(MARGIN, y, CONTENT_W, 50).fill("#F8F6F1");
  const colW = CONTENT_W / 4;
  infoItems.forEach(([label, value], i) => {
    const cx = MARGIN + i * colW + 12;
    doc.fillColor(MID).fontSize(7).font("Helvetica").text(label.toUpperCase(), cx, y + 10, { characterSpacing: 0.8 });
    doc.fillColor(DARK).fontSize(10).font("Helvetica-Bold").text(value, cx, y + 22, { width: colW - 16 });
  });
  y += 64;

  // ─── Grand Total Summary Box ───────────────────────────────────────────────
  doc.rect(MARGIN, y, CONTENT_W, 80).fill(PETROL);
  doc.fillColor(WHITE).fontSize(8).font("Helvetica").text("UPDATED TENDER SUMMARY", MARGIN + 16, y + 12, { characterSpacing: 1.5 });

  const summaryY = y + 30;
  const sCol = CONTENT_W / 4;
  const summaryItems = [
    ["Base Contract", fmt(totals.basePrice)],
    ["Tier Upgrades", totals.upgradeTotal > 0 ? `+${fmt(totals.upgradeTotal)}` : fmt(totals.upgradeTotal)],
    ["Plus Options", totals.plusOptionsTotal > 0 ? `+${fmt(totals.plusOptionsTotal)}` : fmt(totals.plusOptionsTotal)],
    ["GRAND TOTAL", fmt(totals.grandTotal)],
  ];
  summaryItems.forEach(([label, value], i) => {
    const cx = MARGIN + i * sCol + 16;
    doc.fillColor("#A0B4C0").fontSize(7).font("Helvetica").text(label.toUpperCase(), cx, summaryY, { characterSpacing: 0.5 });
    doc.fillColor(WHITE).fontSize(i === 3 ? 16 : 12).font("Helvetica-Bold").text(value, cx, summaryY + 12, { width: sCol - 24 });
  });
  y += 96;

  // ─── Tier Upgrade Selections ───────────────────────────────────────────────
  if (tierSelections.length > 0) {
    if (y > PAGE_H - 120) { drawFooter(doc, pageNum); y = startContentPage(); }
    y = sectionTitle(doc, "Upgrade Selections by Category", y);

    for (const group of tierSelections) {
      if (y > PAGE_H - 80) { drawFooter(doc, pageNum); y = startContentPage(); }

      // Category header
      doc.rect(MARGIN, y, CONTENT_W, 20).fill("#EEF2F4");
      doc.fillColor(PETROL).fontSize(9).font("Helvetica-Bold")
        .text(group.category.toUpperCase(), MARGIN + 8, y + 5, { width: CONTENT_W - 16, characterSpacing: 0.5 });
      y += 24;

      // Table header
      doc.fillColor(MID).fontSize(7).font("Helvetica-Bold");
      doc.text("ITEM", MARGIN + 8, y, { width: CONTENT_W * 0.3 });
      doc.text("SELECTED TIER", MARGIN + CONTENT_W * 0.3, y, { width: CONTENT_W * 0.25 });
      doc.text("SELECTION", MARGIN + CONTENT_W * 0.55, y, { width: CONTENT_W * 0.25 });
      doc.text("COST", MARGIN + CONTENT_W * 0.8, y, { width: CONTENT_W * 0.2, align: "right" });
      y += 12;
      doc.moveTo(MARGIN + 8, y).lineTo(PAGE_W - MARGIN, y).strokeColor(BORDER).lineWidth(0.3).stroke();
      y += 4;

      for (const item of group.items) {
        if (y > PAGE_H - 50) { drawFooter(doc, pageNum); y = startContentPage(); }

        const tierName = TIER_NAMES[item.selectedTier] || `Tier ${item.selectedTier}`;
        const tierColor = TIER_COLORS[item.selectedTier] || DARK;
        const isBase = item.selectedTier === project.startingTier;
        const selectedLabel = item.selectedTier === 1 ? item.tier1Label : item.selectedTier === 2 ? item.tier2Label : item.tier3Label;

        doc.fillColor(DARK).fontSize(8.5).font("Helvetica").text(item.label, MARGIN + 8, y, { width: CONTENT_W * 0.3 - 8 });
        const textY = y;
        doc.fillColor(tierColor).fontSize(8).font("Helvetica-Bold").text(tierName, MARGIN + CONTENT_W * 0.3, textY, { width: CONTENT_W * 0.25 });
        doc.fillColor(MID).fontSize(7.5).font("Helvetica").text(selectedLabel || "—", MARGIN + CONTENT_W * 0.55, textY, { width: CONTENT_W * 0.25 });

        if (isBase) {
          doc.fillColor(GREEN).fontSize(8).font("Helvetica-Bold").text("Included", MARGIN + CONTENT_W * 0.8, textY, { width: CONTENT_W * 0.2, align: "right" });
        } else if (item.relativeDelta > 0) {
          doc.fillColor(AMBER).fontSize(8).font("Helvetica-Bold").text(`+${fmt(item.relativeDelta)}`, MARGIN + CONTENT_W * 0.8, textY, { width: CONTENT_W * 0.2, align: "right" });
        } else {
          doc.fillColor(GREEN).fontSize(8).font("Helvetica-Bold").text("Included", MARGIN + CONTENT_W * 0.8, textY, { width: CONTENT_W * 0.2, align: "right" });
        }

        y = Math.max(doc.y, textY) + 6;
        doc.moveTo(MARGIN + 8, y).lineTo(PAGE_W - MARGIN, y).strokeColor(BORDER).lineWidth(0.15).stroke();
        y += 4;
      }

      // Category subtotal
      const catTotal = group.items.reduce((sum, i) => sum + i.relativeDelta, 0);
      if (catTotal > 0) {
        doc.rect(MARGIN, y, CONTENT_W, 18).fill("#FFF7ED");
        doc.fillColor(AMBER).fontSize(8).font("Helvetica-Bold")
          .text(`${group.category} Upgrade Total: +${fmt(catTotal)}`, MARGIN + 8, y + 4, { width: CONTENT_W - 16, align: "right" });
        y += 24;
      }
      y += 6;
    }
  }

  // ─── Plus Options ──────────────────────────────────────────────────────────
  if (plusOptions.length > 0 && plusOptions.some(g => g.options.some(o => o.selected))) {
    if (y > PAGE_H - 120) { drawFooter(doc, pageNum); y = startContentPage(); }
    y = sectionTitle(doc, "Plus Options Selected", y);

    for (const group of plusOptions) {
      const selectedOpts = group.options.filter(o => o.selected);
      if (selectedOpts.length === 0) continue;

      if (y > PAGE_H - 60) { drawFooter(doc, pageNum); y = startContentPage(); }

      doc.fillColor(PETROL).fontSize(10).font("Helvetica-Bold").text(group.groupName, MARGIN, y, { width: CONTENT_W });
      y = doc.y + 6;

      for (const opt of selectedOpts) {
        if (y > PAGE_H - 50) { drawFooter(doc, pageNum); y = startContentPage(); }

        const badge = opt.isIncluded ? "INCLUDED" : `+${fmt(opt.priceDelta)}`;
        const badgeColor = opt.isIncluded ? GREEN : AMBER;

        doc.fillColor(DARK).fontSize(9).font("Helvetica-Bold").text(opt.name, MARGIN + 8, y, { width: CONTENT_W * 0.7 });
        doc.fillColor(badgeColor).fontSize(8).font("Helvetica-Bold")
          .text(badge, MARGIN + CONTENT_W * 0.7, y, { width: CONTENT_W * 0.3, align: "right" });

        if (opt.description) {
          doc.fillColor(MID).fontSize(7.5).font("Helvetica").text(opt.description, MARGIN + 8, doc.y + 2, { width: CONTENT_W - 8, lineGap: 1 });
        }
        y = doc.y + 8;
        doc.moveTo(MARGIN + 8, y - 2).lineTo(PAGE_W - MARGIN, y - 2).strokeColor(BORDER).lineWidth(0.15).stroke();
      }
      y += 6;
    }
  }

  // ─── Final Total Box ───────────────────────────────────────────────────────
  if (y > PAGE_H - 100) { drawFooter(doc, pageNum); y = startContentPage(); }

  y += 10;
  doc.rect(MARGIN, y, CONTENT_W, 60).fill(PETROL);
  doc.fillColor(WHITE).fontSize(9).font("Helvetica").text("UPDATED CONTRACT TOTAL", MARGIN + 16, y + 12, { characterSpacing: 1.5 });
  doc.fillColor(WHITE).fontSize(28).font("Helvetica-Bold").text(fmt(totals.grandTotal), MARGIN + 16, y + 28, { width: CONTENT_W - 32 });

  // Right side breakdown
  const breakdownX = MARGIN + CONTENT_W * 0.55;
  doc.fillColor("#A0B4C0").fontSize(7).font("Helvetica");
  doc.text(`Base: ${fmt(totals.basePrice)}`, breakdownX, y + 14, { width: CONTENT_W * 0.4 });
  doc.text(`Upgrades: ${totals.upgradeTotal >= 0 ? "+" : ""}${fmt(totals.upgradeTotal)}`, breakdownX, y + 26, { width: CONTENT_W * 0.4 });
  doc.text(`Plus Options: ${totals.plusOptionsTotal >= 0 ? "+" : ""}${fmt(totals.plusOptionsTotal)}`, breakdownX, y + 38, { width: CONTENT_W * 0.4 });

  y += 76;

  // Disclaimer
  doc.fillColor(MID).fontSize(7).font("Helvetica")
    .text("This document summarises the client's upgrade selections. Final pricing is subject to confirmation by B Modern Homes.", MARGIN, y, { width: CONTENT_W, lineGap: 2 });

  // Footer on last page
  drawFooter(doc, pageNum);

  doc.end();

  return new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });
}
