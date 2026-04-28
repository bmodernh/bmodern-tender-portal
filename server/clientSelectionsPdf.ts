/**
 * Client Selections Summary PDF
 * Generates a professional PDF showing the full tender (base inclusions + upgrades)
 * with proper text wrapping, page breaks, and signature spots.
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
const FOOTER_ZONE = 44; // reserved space at bottom for footer
const SAFE_BOTTOM = PAGE_H - FOOTER_ZONE; // nothing should render below this Y

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

function drawPageBackground(doc: PDFKit.PDFDocument) {
  doc.rect(0, 0, PAGE_W, PAGE_H).fill(WHITE);
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

/**
 * Pre-calculate the height a block of text will occupy at a given font/size/width.
 * Uses PDFKit's heightOfString which accounts for word wrapping.
 */
function textHeight(doc: PDFKit.PDFDocument, text: string, font: string, size: number, width: number, lineGap = 0): number {
  doc.font(font).fontSize(size);
  return doc.heightOfString(text, { width, lineGap });
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
  baseInclusions: Array<{
    categoryName: string;
    items: Array<{
      id: number;
      name: string;
      description: string | null;
      qty: string | null;
      unit: string;
    }>;
  }>;
  exclusions: Array<{ description: string }>;
  pcItems: Array<{ description: string; allowance: string | null; notes: string | null }>;
  provisionalSums: Array<{ description: string; amount: string | null; notes: string | null }>;
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
  signoff: {
    name: string;
    signature: string;
    signedAt: Date;
    ip: string;
    userAgent: string;
    documentRefId: string;
  } | null;
  termsAndConditions: string | null;
  upgradeMap: Record<string, { selectedTier: number; tierLabel: string; tierName: string }>;
  inclusionToOverrideKey: Record<string, string>;
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

// ─── Column layout constants ─────────────────────────────────────────────────
// Base inclusions table: ITEM (28%) | DESCRIPTION (45%) | QTY (14%) | UNIT (13%)
const BI_ITEM_X = MARGIN + 8;
const BI_ITEM_W = CONTENT_W * 0.26;
const BI_DESC_X = MARGIN + CONTENT_W * 0.28;
const BI_DESC_W = CONTENT_W * 0.44;
const BI_QTY_X = MARGIN + CONTENT_W * 0.74;
const BI_QTY_W = CONTENT_W * 0.12;
const BI_UNIT_X = MARGIN + CONTENT_W * 0.87;
const BI_UNIT_W = CONTENT_W * 0.13;

// Tier upgrade table: ITEM (25%) | TIER (18%) | SELECTION (32%) | COST (15%)
const TU_ITEM_X = MARGIN + 8;
const TU_ITEM_W = CONTENT_W * 0.24;
const TU_TIER_X = MARGIN + CONTENT_W * 0.26;
const TU_TIER_W = CONTENT_W * 0.17;
const TU_SEL_X = MARGIN + CONTENT_W * 0.44;
const TU_SEL_W = CONTENT_W * 0.34;
const TU_COST_X = MARGIN + CONTENT_W * 0.8;
const TU_COST_W = CONTENT_W * 0.2;

// ─── Main generator ───────────────────────────────────────────────────────────
export async function generateClientSelectionsPdf(data: ClientSelectionsPdfData): Promise<Buffer> {
  const { project, baseInclusions, exclusions: exclList, pcItems: pcList, provisionalSums: psList, tierSelections, plusOptions, totals, company, submittedAt, upgradeMap, inclusionToOverrideKey } = data;

  const logoBuffer = await tryFetchImage(company?.logoUrl || null);

  const doc = new PDFDocument({
    size: "A4",
    margin: 0,
    bufferPages: true,
    info: {
      Title: `Tender & Selections — ${project.clientName}`,
      Author: "B Modern Homes",
    },
  });

  const chunks: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));

  let pageNum = 1;

  /** Add a new content page with header, return starting Y */
  const newPage = (): number => {
    doc.addPage();
    pageNum++;
    drawPageBackground(doc);
    drawHeader(doc, logoBuffer);
    return 70;
  };

  /** Ensure enough vertical space; if not, finish page and start new one */
  const ensureSpace = (y: number, needed: number): number => {
    if (y + needed > SAFE_BOTTOM) {
      drawFooter(doc, pageNum);
      return newPage();
    }
    return y;
  };

  // ─── Cover / Title Page ────────────────────────────────────────────────────
  drawPageBackground(doc);
  doc.rect(0, 0, PAGE_W, 6).fill(PETROL);

  if (logoBuffer) {
    try { doc.image(logoBuffer, MARGIN, 24, { height: 32, fit: [180, 32] }); } catch {
      doc.fillColor(PETROL).fontSize(16).font("Helvetica-Bold").text("B MODERN HOMES", MARGIN, 28);
    }
  } else {
    doc.fillColor(PETROL).fontSize(16).font("Helvetica-Bold").text("B MODERN HOMES", MARGIN, 28);
  }

  doc.moveTo(MARGIN, 68).lineTo(PAGE_W - MARGIN, 68).strokeColor(BORDER).lineWidth(0.5).stroke();

  let y = 90;
  doc.fillColor(PETROL).fontSize(9).font("Helvetica").text("TENDER & SELECTIONS SUMMARY", MARGIN, y, { characterSpacing: 2 });
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

  // Grand Total Summary Box
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

  // ─── Base Inclusions ──────────────────────────────────────────────────────
  if (baseInclusions.length > 0) {
    drawFooter(doc, pageNum);
    y = newPage();
    y = sectionTitle(doc, "Base Inclusions", y);

    for (const cat of baseInclusions) {
      // Category header needs ~30px
      y = ensureSpace(y, 50);

      doc.rect(MARGIN, y, CONTENT_W, 20).fill("#EEF2F4");
      doc.fillColor(PETROL).fontSize(9).font("Helvetica-Bold")
        .text(cat.categoryName.toUpperCase(), MARGIN + 8, y + 5, { width: CONTENT_W - 16, characterSpacing: 0.5 });
      y += 24;

      // Table header
      doc.fillColor(MID).fontSize(7).font("Helvetica-Bold");
      doc.text("ITEM", BI_ITEM_X, y, { width: BI_ITEM_W });
      doc.text("DESCRIPTION", BI_DESC_X, y, { width: BI_DESC_W });
      doc.text("QTY", BI_QTY_X, y, { width: BI_QTY_W, align: "right" });
      doc.text("UNIT", BI_UNIT_X, y, { width: BI_UNIT_W, align: "right" });
      y += 12;
      doc.moveTo(BI_ITEM_X, y).lineTo(PAGE_W - MARGIN, y).strokeColor(BORDER).lineWidth(0.3).stroke();
      y += 4;

      for (const item of cat.items) {
        // Check for upgrade
        const overrideKey = inclusionToOverrideKey[`${item.id}`];
        const upgrade = overrideKey ? upgradeMap[overrideKey] : undefined;
        const displayDesc = upgrade ? upgrade.tierLabel : (item.description || "\u2014");

        // Pre-calculate row height
        const nameH = textHeight(doc, item.name, "Helvetica-Bold", 8, BI_ITEM_W);
        let descH: number;
        if (upgrade) {
          const badgeH = textHeight(doc, `UPGRADED >> ${upgrade.tierName}`, "Helvetica-Bold", 7, BI_DESC_W);
          const descTextH = textHeight(doc, displayDesc, "Helvetica", 7.5, BI_DESC_W);
          descH = badgeH + descTextH;
        } else {
          descH = textHeight(doc, displayDesc, "Helvetica", 7.5, BI_DESC_W);
        }
        const rowH = Math.max(nameH, descH, 12) + 10; // +10 for padding + separator

        y = ensureSpace(y, rowH);

        const startY = y;

        // Item name (bold, left column)
        doc.fillColor(DARK).fontSize(8).font("Helvetica-Bold")
          .text(item.name, BI_ITEM_X, startY, { width: BI_ITEM_W });
        const nameEndY = doc.y;

        // Description column
        if (upgrade) {
          doc.fillColor(upgrade.selectedTier === 3 ? PURPLE : AMBER).fontSize(7).font("Helvetica-Bold")
            .text(`UPGRADED >> ${upgrade.tierName}`, BI_DESC_X, startY, { width: BI_DESC_W });
          const badgeEndY = doc.y;
          doc.fillColor(DARK).fontSize(7.5).font("Helvetica")
            .text(displayDesc, BI_DESC_X, badgeEndY, { width: BI_DESC_W });
        } else {
          doc.fillColor(MID).fontSize(7.5).font("Helvetica")
            .text(displayDesc, BI_DESC_X, startY, { width: BI_DESC_W });
        }
        const descEndY = doc.y;

        // QTY and UNIT (single line, top-aligned)
        doc.fillColor(DARK).fontSize(8).font("Helvetica")
          .text(item.qty || "\u2014", BI_QTY_X, startY, { width: BI_QTY_W, align: "right" });
        doc.fillColor(MID).fontSize(7.5).font("Helvetica")
          .text(item.unit, BI_UNIT_X, startY, { width: BI_UNIT_W, align: "right" });

        y = Math.max(nameEndY, descEndY, startY + 12) + 4;
        doc.moveTo(BI_ITEM_X, y).lineTo(PAGE_W - MARGIN, y).strokeColor(BORDER).lineWidth(0.15).stroke();
        y += 4;
      }
      y += 6;
    }
  }

  // ─── Exclusions ───────────────────────────────────────────────────────────
  if (exclList.length > 0) {
    y = ensureSpace(y, 60);
    y = sectionTitle(doc, "Exclusions", y);
    y += 4;
    for (const excl of exclList) {
      const h = textHeight(doc, `\u2022  ${excl.description}`, "Helvetica", 8, CONTENT_W - 16, 1.5);
      y = ensureSpace(y, h + 6);
      doc.fillColor(DARK).fontSize(8).font("Helvetica")
        .text(`\u2022  ${excl.description}`, MARGIN + 8, y, { width: CONTENT_W - 16, lineGap: 1.5 });
      y = doc.y + 4;
    }
    y += 6;
  }

  // ─── PC Items (Prime Cost) ────────────────────────────────────────────────
  if (pcList.length > 0) {
    y = ensureSpace(y, 60);
    y = sectionTitle(doc, "Prime Cost Items", y);
    y += 4;

    doc.fillColor(MID).fontSize(7).font("Helvetica-Bold");
    doc.text("DESCRIPTION", MARGIN + 8, y, { width: CONTENT_W * 0.5 });
    doc.text("ALLOWANCE", MARGIN + CONTENT_W * 0.5, y, { width: CONTENT_W * 0.2, align: "right" });
    doc.text("NOTES", MARGIN + CONTENT_W * 0.72, y, { width: CONTENT_W * 0.28 });
    y += 12;
    doc.moveTo(MARGIN + 8, y).lineTo(PAGE_W - MARGIN, y).strokeColor(BORDER).lineWidth(0.3).stroke();
    y += 4;

    for (const pc of pcList) {
      const h = textHeight(doc, pc.description, "Helvetica", 8, CONTENT_W * 0.48);
      y = ensureSpace(y, h + 10);
      const startY = y;
      doc.fillColor(DARK).fontSize(8).font("Helvetica")
        .text(pc.description, MARGIN + 8, y, { width: CONTENT_W * 0.48 });
      const descEndY = doc.y;
      doc.fillColor(DARK).fontSize(8).font("Helvetica-Bold")
        .text(pc.allowance ? fmt(pc.allowance) : "\u2014", MARGIN + CONTENT_W * 0.5, startY, { width: CONTENT_W * 0.2, align: "right" });
      doc.fillColor(MID).fontSize(7.5).font("Helvetica")
        .text(pc.notes || "\u2014", MARGIN + CONTENT_W * 0.72, startY, { width: CONTENT_W * 0.28 });
      y = Math.max(descEndY, startY + 12) + 4;
      doc.moveTo(MARGIN + 8, y).lineTo(PAGE_W - MARGIN, y).strokeColor(BORDER).lineWidth(0.15).stroke();
      y += 4;
    }
    y += 6;
  }

  // ─── Provisional Sums ─────────────────────────────────────────────────────
  if (psList.length > 0) {
    y = ensureSpace(y, 60);
    y = sectionTitle(doc, "Provisional Sums", y);
    y += 4;

    doc.fillColor(MID).fontSize(7).font("Helvetica-Bold");
    doc.text("DESCRIPTION", MARGIN + 8, y, { width: CONTENT_W * 0.5 });
    doc.text("AMOUNT", MARGIN + CONTENT_W * 0.5, y, { width: CONTENT_W * 0.2, align: "right" });
    doc.text("NOTES", MARGIN + CONTENT_W * 0.72, y, { width: CONTENT_W * 0.28 });
    y += 12;
    doc.moveTo(MARGIN + 8, y).lineTo(PAGE_W - MARGIN, y).strokeColor(BORDER).lineWidth(0.3).stroke();
    y += 4;

    for (const ps of psList) {
      const h = textHeight(doc, ps.description, "Helvetica", 8, CONTENT_W * 0.48);
      y = ensureSpace(y, h + 10);
      const startY = y;
      doc.fillColor(DARK).fontSize(8).font("Helvetica")
        .text(ps.description, MARGIN + 8, y, { width: CONTENT_W * 0.48 });
      const descEndY = doc.y;
      doc.fillColor(DARK).fontSize(8).font("Helvetica-Bold")
        .text(ps.amount ? fmt(ps.amount) : "\u2014", MARGIN + CONTENT_W * 0.5, startY, { width: CONTENT_W * 0.2, align: "right" });
      doc.fillColor(MID).fontSize(7.5).font("Helvetica")
        .text(ps.notes || "\u2014", MARGIN + CONTENT_W * 0.72, startY, { width: CONTENT_W * 0.28 });
      y = Math.max(descEndY, startY + 12) + 4;
      doc.moveTo(MARGIN + 8, y).lineTo(PAGE_W - MARGIN, y).strokeColor(BORDER).lineWidth(0.15).stroke();
      y += 4;
    }
    y += 6;
  }

  // ─── Tier Upgrade Selections ───────────────────────────────────────────────
  if (tierSelections.length > 0) {
    y = ensureSpace(y, 80);
    y = sectionTitle(doc, "Upgrade Selections by Category", y);

    for (const group of tierSelections) {
      y = ensureSpace(y, 60);

      doc.rect(MARGIN, y, CONTENT_W, 20).fill("#EEF2F4");
      doc.fillColor(PETROL).fontSize(9).font("Helvetica-Bold")
        .text(group.category.toUpperCase(), MARGIN + 8, y + 5, { width: CONTENT_W - 16, characterSpacing: 0.5 });
      y += 24;

      doc.fillColor(MID).fontSize(7).font("Helvetica-Bold");
      doc.text("ITEM", TU_ITEM_X, y, { width: TU_ITEM_W });
      doc.text("SELECTED TIER", TU_TIER_X, y, { width: TU_TIER_W });
      doc.text("SELECTION", TU_SEL_X, y, { width: TU_SEL_W });
      doc.text("COST", TU_COST_X, y, { width: TU_COST_W, align: "right" });
      y += 12;
      doc.moveTo(TU_ITEM_X, y).lineTo(PAGE_W - MARGIN, y).strokeColor(BORDER).lineWidth(0.3).stroke();
      y += 4;

      for (const item of group.items) {
        const tierName = TIER_NAMES[item.selectedTier] || `Tier ${item.selectedTier}`;
        const tierColor = TIER_COLORS[item.selectedTier] || DARK;
        const isBase = item.selectedTier === project.startingTier;
        const selectedLabel = item.selectedTier === 1 ? item.tier1Label : item.selectedTier === 2 ? item.tier2Label : item.tier3Label;

        // Pre-calculate row height from all columns
        const labelH = textHeight(doc, item.label, "Helvetica", 8, TU_ITEM_W);
        const selH = textHeight(doc, selectedLabel || "\u2014", "Helvetica", 7.5, TU_SEL_W);
        const rowH = Math.max(labelH, selH, 12) + 10;

        y = ensureSpace(y, rowH);

        const startY = y;
        doc.fillColor(DARK).fontSize(8).font("Helvetica")
          .text(item.label, TU_ITEM_X, startY, { width: TU_ITEM_W });
        const labelEndY = doc.y;

        doc.fillColor(tierColor).fontSize(8).font("Helvetica-Bold")
          .text(tierName, TU_TIER_X, startY, { width: TU_TIER_W });
        const tierEndY = doc.y;

        doc.fillColor(MID).fontSize(7.5).font("Helvetica")
          .text(selectedLabel || "\u2014", TU_SEL_X, startY, { width: TU_SEL_W });
        const selEndY = doc.y;

        if (isBase) {
          doc.fillColor(GREEN).fontSize(8).font("Helvetica-Bold")
            .text("Included", TU_COST_X, startY, { width: TU_COST_W, align: "right" });
        } else if (item.relativeDelta > 0) {
          doc.fillColor(AMBER).fontSize(8).font("Helvetica-Bold")
            .text(`+${fmt(item.relativeDelta)}`, TU_COST_X, startY, { width: TU_COST_W, align: "right" });
        } else {
          doc.fillColor(GREEN).fontSize(8).font("Helvetica-Bold")
            .text("Included", TU_COST_X, startY, { width: TU_COST_W, align: "right" });
        }
        const costEndY = doc.y;

        y = Math.max(labelEndY, tierEndY, selEndY, costEndY, startY + 12) + 4;
        doc.moveTo(TU_ITEM_X, y).lineTo(PAGE_W - MARGIN, y).strokeColor(BORDER).lineWidth(0.15).stroke();
        y += 4;
      }

      // Category subtotal
      const catTotal = group.items.reduce((sum, i) => sum + i.relativeDelta, 0);
      if (catTotal > 0) {
        y = ensureSpace(y, 24);
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
    y = ensureSpace(y, 80);
    y = sectionTitle(doc, "Plus Options Selected", y);

    for (const group of plusOptions) {
      const selectedOpts = group.options.filter(o => o.selected);
      if (selectedOpts.length === 0) continue;

      y = ensureSpace(y, 40);
      doc.fillColor(PETROL).fontSize(10).font("Helvetica-Bold").text(group.groupName, MARGIN, y, { width: CONTENT_W });
      y = doc.y + 6;

      for (const opt of selectedOpts) {
        const optH = textHeight(doc, opt.name, "Helvetica-Bold", 9, CONTENT_W * 0.7) +
          (opt.description ? textHeight(doc, opt.description, "Helvetica", 7.5, CONTENT_W - 8, 1) : 0) + 14;
        y = ensureSpace(y, optH);

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
  y = ensureSpace(y, 80);
  y += 10;
  doc.rect(MARGIN, y, CONTENT_W, 60).fill(PETROL);
  doc.fillColor(WHITE).fontSize(9).font("Helvetica").text("UPDATED CONTRACT TOTAL", MARGIN + 16, y + 12, { characterSpacing: 1.5 });
  doc.fillColor(WHITE).fontSize(28).font("Helvetica-Bold").text(fmt(totals.grandTotal), MARGIN + 16, y + 28, { width: CONTENT_W - 32 });

  const breakdownX = MARGIN + CONTENT_W * 0.55;
  doc.fillColor("#A0B4C0").fontSize(7).font("Helvetica");
  doc.text(`Base: ${fmt(totals.basePrice)}`, breakdownX, y + 14, { width: CONTENT_W * 0.4 });
  doc.text(`Upgrades: ${totals.upgradeTotal >= 0 ? "+" : ""}${fmt(totals.upgradeTotal)}`, breakdownX, y + 26, { width: CONTENT_W * 0.4 });
  doc.text(`Plus Options: ${totals.plusOptionsTotal >= 0 ? "+" : ""}${fmt(totals.plusOptionsTotal)}`, breakdownX, y + 38, { width: CONTENT_W * 0.4 });

  y += 76;

  // ─── Terms & Conditions ──────────────────────────────────────────────────
  if (data.termsAndConditions) {
    drawFooter(doc, pageNum);
    y = newPage();
    y = sectionTitle(doc, "Terms & Conditions", y);
    y += 4;

    const tcParagraphs = data.termsAndConditions.split(/\n+/).filter(p => p.trim());
    for (const para of tcParagraphs) {
      const h = textHeight(doc, para.trim(), "Helvetica", 8, CONTENT_W, 1.5);
      y = ensureSpace(y, h + 8);
      doc.fillColor(DARK).fontSize(8).font("Helvetica")
        .text(para.trim(), MARGIN, y, { width: CONTENT_W, lineGap: 1.5 });
      y = doc.y + 6;
    }

    y += 8;
    y = ensureSpace(y, 30);
    doc.rect(MARGIN, y, CONTENT_W, 24).fill("#F8F6F1");
    doc.fillColor(PETROL).fontSize(7.5).font("Helvetica-Bold")
      .text("By signing below, the client acknowledges they have read and agree to the Terms & Conditions set out above.", MARGIN + 12, y + 7, { width: CONTENT_W - 24 });
    y += 32;
  }

  // ─── Signed Tender Certificate ──────────────────────────────────────────────
  if (data.signoff) {
    drawFooter(doc, pageNum);
    y = newPage();

    y = sectionTitle(doc, "Signed Tender Certificate", y);
    y += 4;

    // Document Reference Box
    doc.rect(MARGIN, y, CONTENT_W, 36).fill("#F8F6F1");
    doc.fillColor(MID).fontSize(7).font("Helvetica").text("DOCUMENT REFERENCE", MARGIN + 12, y + 6, { characterSpacing: 1 });
    doc.fillColor(PETROL).fontSize(14).font("Helvetica-Bold").text(data.signoff.documentRefId, MARGIN + 12, y + 18, { width: CONTENT_W * 0.4 });
    doc.fillColor(MID).fontSize(7).font("Helvetica").text("SIGNED DATE & TIME", MARGIN + CONTENT_W * 0.5, y + 6, { characterSpacing: 1 });
    doc.fillColor(PETROL).fontSize(11).font("Helvetica-Bold")
      .text(fmtDate(data.signoff.signedAt) + " at " + new Date(data.signoff.signedAt).toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit", hour12: true }),
        MARGIN + CONTENT_W * 0.5, y + 18, { width: CONTENT_W * 0.5 });
    y += 46;

    // Declaration
    doc.fillColor(PETROL).fontSize(9).font("Helvetica-Bold").text("Declaration", MARGIN, y);
    y = doc.y + 4;
    doc.fillColor(DARK).fontSize(8).font("Helvetica")
      .text("I confirm that I have reviewed all upgrade selections and optional extras listed in this document. " +
        "I understand that these selections are subject to final pricing confirmation by B Modern Homes. " +
        "The estimated total shown is indicative and may vary upon final review. " +
        "I acknowledge that once submitted, changes may require a new submission. " +
        "I agree that my digital signature on this document is legally binding and equivalent to a handwritten signature.",
        MARGIN, y, { width: CONTENT_W, lineGap: 2 });
    y = doc.y + 16;

    // Signatory Details
    doc.fillColor(PETROL).fontSize(9).font("Helvetica-Bold").text("Signatory", MARGIN, y);
    y = doc.y + 6;
    doc.fillColor(DARK).fontSize(10).font("Helvetica-Bold").text(data.signoff.name, MARGIN, y);
    y = doc.y + 12;

    // Signature Image
    if (data.signoff.signature && data.signoff.signature.startsWith("data:image")) {
      try {
        const base64Data = data.signoff.signature.split(",")[1];
        const sigBuffer = Buffer.from(base64Data, "base64");
        doc.rect(MARGIN, y, CONTENT_W * 0.5, 80).lineWidth(0.5).strokeColor(BORDER).stroke();
        doc.image(sigBuffer, MARGIN + 8, y + 4, { fit: [CONTENT_W * 0.5 - 16, 72] });
        y += 88;
      } catch {
        doc.fillColor(MID).fontSize(8).font("Helvetica").text("[Signature on file]", MARGIN, y);
        y = doc.y + 12;
      }
    } else {
      doc.fillColor(MID).fontSize(8).font("Helvetica").text("[Signature on file]", MARGIN, y);
      y = doc.y + 12;
    }

    doc.moveTo(MARGIN, y).lineTo(MARGIN + CONTENT_W * 0.5, y).strokeColor(DARK).lineWidth(0.5).stroke();
    doc.fillColor(MID).fontSize(7).font("Helvetica").text("Authorised Signature", MARGIN, y + 3);
    y += 20;

    // Audit Trail
    y += 8;
    doc.rect(MARGIN, y, CONTENT_W, 0.5).fill(BORDER);
    y += 8;
    doc.fillColor(PETROL).fontSize(8).font("Helvetica-Bold").text("Audit Trail", MARGIN, y);
    y = doc.y + 6;

    const auditItems = [
      ["Document Reference", data.signoff.documentRefId],
      ["Signed By", data.signoff.name],
      ["Date & Time", fmtDate(data.signoff.signedAt) + " at " + new Date(data.signoff.signedAt).toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true })],
      ["IP Address", data.signoff.ip],
      ["Browser", data.signoff.userAgent.length > 80 ? data.signoff.userAgent.substring(0, 80) + "..." : data.signoff.userAgent],
    ];

    for (const [label, value] of auditItems) {
      doc.fillColor(MID).fontSize(7).font("Helvetica-Bold").text(label.toUpperCase(), MARGIN + 4, y, { width: CONTENT_W * 0.25, characterSpacing: 0.5 });
      doc.fillColor(DARK).fontSize(7.5).font("Helvetica").text(value, MARGIN + CONTENT_W * 0.25, y, { width: CONTENT_W * 0.75 });
      y = Math.max(doc.y, y) + 6;
    }

    y += 10;
    doc.rect(MARGIN, y, CONTENT_W, 28).fill("#F0FDF4");
    doc.fillColor(GREEN).fontSize(7.5).font("Helvetica-Bold")
      .text("This document has been digitally signed and is a legally binding record of the client\u2019s upgrade selections.", MARGIN + 12, y + 8, { width: CONTENT_W - 24 });
    y += 36;
  } else {
    // No sign-off yet — show signature spots for manual signing
    drawFooter(doc, pageNum);
    y = newPage();

    y = sectionTitle(doc, "Acceptance & Sign-Off", y);
    y += 8;

    // Declaration text
    doc.fillColor(DARK).fontSize(8.5).font("Helvetica")
      .text("I/We confirm that I/we have reviewed all upgrade selections and optional extras listed in this document. " +
        "I/We understand that these selections are subject to final pricing confirmation by B Modern Homes. " +
        "The estimated total shown is indicative and may vary upon final review. " +
        "I/We acknowledge that once submitted, changes may require a new submission.",
        MARGIN, y, { width: CONTENT_W, lineGap: 2 });
    y = doc.y + 24;

    // Helper to draw a signature block
    const drawSigBlock = (title: string, nameLabel: string) => {
      y = ensureSpace(y, 110);
      doc.fillColor(PETROL).fontSize(10).font("Helvetica-Bold").text(title, MARGIN, y);
      y = doc.y + 16;

      // Name line
      doc.moveTo(MARGIN, y + 14).lineTo(MARGIN + CONTENT_W * 0.6, y + 14).strokeColor(DARK).lineWidth(0.5).stroke();
      doc.fillColor(MID).fontSize(7).font("Helvetica").text(nameLabel, MARGIN, y + 18);
      y += 40;

      // Signature + Date line
      doc.moveTo(MARGIN, y + 14).lineTo(MARGIN + CONTENT_W * 0.6, y + 14).strokeColor(DARK).lineWidth(0.5).stroke();
      doc.fillColor(MID).fontSize(7).font("Helvetica").text("Signature", MARGIN, y + 18);
      doc.moveTo(MARGIN + CONTENT_W * 0.65, y + 14).lineTo(MARGIN + CONTENT_W, y + 14).strokeColor(DARK).lineWidth(0.5).stroke();
      doc.fillColor(MID).fontSize(7).font("Helvetica").text("Date", MARGIN + CONTENT_W * 0.65, y + 18);
      y += 50;
    };

    drawSigBlock("Client / Owner", "Full Name (print)");
    drawSigBlock("Client / Owner (2nd signatory, if applicable)", "Full Name (print)");

    // Divider
    doc.moveTo(MARGIN, y).lineTo(PAGE_W - MARGIN, y).strokeColor(BORDER).lineWidth(0.5).stroke();
    y += 16;

    drawSigBlock("Builder \u2014 B Modern Homes", "Authorised Representative (print)");

    doc.moveTo(MARGIN, y).lineTo(PAGE_W - MARGIN, y).strokeColor(BORDER).lineWidth(0.5).stroke();
    y += 16;

    drawSigBlock("Witness", "Full Name (print)");

    // Disclaimer
    y += 8;
    doc.fillColor(MID).fontSize(7).font("Helvetica")
      .text("This document summarises the client\u2019s upgrade selections. Final pricing is subject to confirmation by B Modern Homes.", MARGIN, y, { width: CONTENT_W, lineGap: 2 });
  }

  // Footer on last page
  drawFooter(doc, pageNum);

  doc.end();

  return new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });
}
