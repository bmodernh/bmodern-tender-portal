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
  signoff: {
    name: string;
    signature: string; // base64 data URL
    signedAt: Date;
    ip: string;
    userAgent: string;
    documentRefId: string;
  } | null;
  termsAndConditions: string | null;
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

  // ─── Terms & Conditions ──────────────────────────────────────────────────
  if (data.termsAndConditions) {
    drawFooter(doc, pageNum);
    y = startContentPage();
    y = sectionTitle(doc, "Terms & Conditions", y);
    y += 4;

    // Split T&C content into paragraphs and render with page breaks
    const tcParagraphs = data.termsAndConditions.split(/\n+/).filter(p => p.trim());
    for (const para of tcParagraphs) {
      if (y > PAGE_H - 60) { drawFooter(doc, pageNum); y = startContentPage(); }
      doc.fillColor(DARK).fontSize(8).font("Helvetica")
        .text(para.trim(), MARGIN, y, { width: CONTENT_W, lineGap: 1.5 });
      y = doc.y + 6;
    }

    // Acknowledgement line at the bottom of T&C
    y += 8;
    if (y > PAGE_H - 60) { drawFooter(doc, pageNum); y = startContentPage(); }
    doc.rect(MARGIN, y, CONTENT_W, 24).fill("#F8F6F1");
    doc.fillColor(PETROL).fontSize(7.5).font("Helvetica-Bold")
      .text("By signing below, the client acknowledges they have read and agree to the Terms & Conditions set out above.", MARGIN + 12, y + 7, { width: CONTENT_W - 24 });
    y += 32;
  }

  // ─── Signed Tender Certificate ──────────────────────────────────────────────
  if (data.signoff) {
    // Always start signature block on a new page for formality
    drawFooter(doc, pageNum);
    y = startContentPage();

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
    doc.rect(MARGIN, y, CONTENT_W, 0).fill(WHITE);
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

    // Signature line
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
      .text("\u2713 This document has been digitally signed and is a legally binding record of the client\u2019s upgrade selections.", MARGIN + 12, y + 8, { width: CONTENT_W - 24 });
    y += 36;
  } else {
    // No sign-off yet — show signature spots for manual signing
    // Start signature block on a new page for formality
    drawFooter(doc, pageNum);
    y = startContentPage();

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

    // ── Client Signature Block ──
    doc.fillColor(PETROL).fontSize(10).font("Helvetica-Bold").text("Client / Owner", MARGIN, y);
    y = doc.y + 16;

    // Name line
    doc.moveTo(MARGIN, y + 14).lineTo(MARGIN + CONTENT_W * 0.6, y + 14).strokeColor(DARK).lineWidth(0.5).stroke();
    doc.fillColor(MID).fontSize(7).font("Helvetica").text("Full Name (print)", MARGIN, y + 18);
    y += 40;

    // Signature line
    doc.moveTo(MARGIN, y + 14).lineTo(MARGIN + CONTENT_W * 0.6, y + 14).strokeColor(DARK).lineWidth(0.5).stroke();
    doc.fillColor(MID).fontSize(7).font("Helvetica").text("Signature", MARGIN, y + 18);
    // Date line (right side)
    doc.moveTo(MARGIN + CONTENT_W * 0.65, y + 14).lineTo(MARGIN + CONTENT_W, y + 14).strokeColor(DARK).lineWidth(0.5).stroke();
    doc.fillColor(MID).fontSize(7).font("Helvetica").text("Date", MARGIN + CONTENT_W * 0.65, y + 18);
    y += 50;

    // ── Second Client / Joint Owner Signature Block ──
    doc.fillColor(PETROL).fontSize(10).font("Helvetica-Bold").text("Client / Owner (2nd signatory, if applicable)", MARGIN, y);
    y = doc.y + 16;

    // Name line
    doc.moveTo(MARGIN, y + 14).lineTo(MARGIN + CONTENT_W * 0.6, y + 14).strokeColor(DARK).lineWidth(0.5).stroke();
    doc.fillColor(MID).fontSize(7).font("Helvetica").text("Full Name (print)", MARGIN, y + 18);
    y += 40;

    // Signature line
    doc.moveTo(MARGIN, y + 14).lineTo(MARGIN + CONTENT_W * 0.6, y + 14).strokeColor(DARK).lineWidth(0.5).stroke();
    doc.fillColor(MID).fontSize(7).font("Helvetica").text("Signature", MARGIN, y + 18);
    // Date line
    doc.moveTo(MARGIN + CONTENT_W * 0.65, y + 14).lineTo(MARGIN + CONTENT_W, y + 14).strokeColor(DARK).lineWidth(0.5).stroke();
    doc.fillColor(MID).fontSize(7).font("Helvetica").text("Date", MARGIN + CONTENT_W * 0.65, y + 18);
    y += 50;

    // Divider
    doc.moveTo(MARGIN, y).lineTo(PAGE_W - MARGIN, y).strokeColor(BORDER).lineWidth(0.5).stroke();
    y += 16;

    // ── Builder Signature Block ──
    doc.fillColor(PETROL).fontSize(10).font("Helvetica-Bold").text("Builder — B Modern Homes", MARGIN, y);
    y = doc.y + 16;

    // Name line
    doc.moveTo(MARGIN, y + 14).lineTo(MARGIN + CONTENT_W * 0.6, y + 14).strokeColor(DARK).lineWidth(0.5).stroke();
    doc.fillColor(MID).fontSize(7).font("Helvetica").text("Authorised Representative (print)", MARGIN, y + 18);
    y += 40;

    // Signature line
    doc.moveTo(MARGIN, y + 14).lineTo(MARGIN + CONTENT_W * 0.6, y + 14).strokeColor(DARK).lineWidth(0.5).stroke();
    doc.fillColor(MID).fontSize(7).font("Helvetica").text("Signature", MARGIN, y + 18);
    // Date line
    doc.moveTo(MARGIN + CONTENT_W * 0.65, y + 14).lineTo(MARGIN + CONTENT_W, y + 14).strokeColor(DARK).lineWidth(0.5).stroke();
    doc.fillColor(MID).fontSize(7).font("Helvetica").text("Date", MARGIN + CONTENT_W * 0.65, y + 18);
    y += 50;

    // Witness block
    doc.moveTo(MARGIN, y).lineTo(PAGE_W - MARGIN, y).strokeColor(BORDER).lineWidth(0.5).stroke();
    y += 16;
    doc.fillColor(PETROL).fontSize(10).font("Helvetica-Bold").text("Witness", MARGIN, y);
    y = doc.y + 16;

    // Name line
    doc.moveTo(MARGIN, y + 14).lineTo(MARGIN + CONTENT_W * 0.6, y + 14).strokeColor(DARK).lineWidth(0.5).stroke();
    doc.fillColor(MID).fontSize(7).font("Helvetica").text("Full Name (print)", MARGIN, y + 18);
    y += 40;

    // Signature line
    doc.moveTo(MARGIN, y + 14).lineTo(MARGIN + CONTENT_W * 0.6, y + 14).strokeColor(DARK).lineWidth(0.5).stroke();
    doc.fillColor(MID).fontSize(7).font("Helvetica").text("Signature", MARGIN, y + 18);
    // Date line
    doc.moveTo(MARGIN + CONTENT_W * 0.65, y + 14).lineTo(MARGIN + CONTENT_W, y + 14).strokeColor(DARK).lineWidth(0.5).stroke();
    doc.fillColor(MID).fontSize(7).font("Helvetica").text("Date", MARGIN + CONTENT_W * 0.65, y + 18);
    y += 50;

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
