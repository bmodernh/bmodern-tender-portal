/**
 * PDF Generation for B Modern Tender Portal
 * Uses pdfkit (pure Node.js) — no Chromium required.
 */
import PDFDocument from "pdfkit";
import https from "https";
import http from "http";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface PdfProject {
  clientName: string;
  projectAddress: string;
  proposalNumber: string | null;
  projectType: string | null;
  buildType: string | null;
  baseContractPrice: string | null;
  status: string;
  tenderExpiry: Date | null;
  heroImageUrl: string | null;
}

export interface PdfInclusion {
  title: string;
  description: string | null;
  imageUrl: string | null;
}

export interface PdfExclusion {
  description: string;
}

export interface PdfProvisionalSum {
  description: string;
  amount: string | null;
  notes: string | null;
}

export interface PdfUpgradeGroup {
  category: string;
  options: {
    name: string;
    description: string | null;
    priceDelta: string | null;
    isIncluded: boolean;
  }[];
}

export interface PdfPlanImage {
  title: string | null;
  imageUrl: string;
}

export interface PdfCompanySettings {
  aboutUs: string | null;
  tagline: string | null;
  credentials: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  logoUrl: string | null;
}

export interface PdfData {
  project: PdfProject;
  inclusions: PdfInclusion[];
  exclusions: PdfExclusion[];
  provisionalSums: PdfProvisionalSum[];
  upgradeGroups: PdfUpgradeGroup[];
  planImages: PdfPlanImage[];
  company: PdfCompanySettings | null;
}

// ─── Colour palette ───────────────────────────────────────────────────────────
const PETROL = "#203E4A";
const CREAM = "#F5F2EE";
const BORDER = "#DDD8D0";
const DARK = "#1A1A1A";
const MID = "#6D7E94";
const WHITE = "#FFFFFF";

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmt(n: string | null): string {
  return n ? `$${Number(n).toLocaleString("en-AU")}` : "";
}

function fmtDate(d: Date | null): string {
  return d ? new Date(d).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" }) : "";
}

function fetchImageBuffer(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith("https") ? https : http;
    lib.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Image fetch failed: ${res.statusCode} ${url}`));
        return;
      }
      const chunks: Buffer[] = [];
      res.on("data", (chunk: Buffer) => chunks.push(chunk));
      res.on("end", () => resolve(Buffer.concat(chunks)));
      res.on("error", reject);
    }).on("error", reject);
  });
}

async function tryFetchImage(url: string | null): Promise<Buffer | null> {
  if (!url) return null;
  try {
    return await fetchImageBuffer(url);
  } catch {
    return null;
  }
}

// ─── Page helpers ─────────────────────────────────────────────────────────────
const PAGE_W = 595.28; // A4 pt
const PAGE_H = 841.89;
const MARGIN = 48;
const CONTENT_W = PAGE_W - MARGIN * 2;

function drawPageBackground(doc: PDFKit.PDFDocument, color = WHITE) {
  doc.rect(0, 0, PAGE_W, PAGE_H).fill(color);
}

function drawHeader(doc: PDFKit.PDFDocument, logoBuffer: Buffer | null, company: PdfCompanySettings | null) {
  // Thin petrol top bar
  doc.rect(0, 0, PAGE_W, 6).fill(PETROL);

  // Logo or company name
  if (logoBuffer) {
    try {
      doc.image(logoBuffer, MARGIN, 18, { height: 28, fit: [160, 28] });
    } catch {
      doc.fillColor(PETROL).fontSize(14).font("Helvetica-Bold").text("B MODERN HOMES", MARGIN, 22);
    }
  } else {
    doc.fillColor(PETROL).fontSize(14).font("Helvetica-Bold").text(company?.tagline || "B MODERN HOMES", MARGIN, 22);
  }

  // Right side: company contact
  if (company?.phone || company?.email) {
    const contact = [company.phone, company.email].filter(Boolean).join("  |  ");
    doc.fillColor(MID).fontSize(8).font("Helvetica").text(contact, MARGIN, 26, { align: "right", width: CONTENT_W });
  }

  // Divider
  doc.moveTo(MARGIN, 54).lineTo(PAGE_W - MARGIN, 54).strokeColor(BORDER).lineWidth(0.5).stroke();
}

function drawFooter(doc: PDFKit.PDFDocument, pageNum: number, company: PdfCompanySettings | null) {
  const y = PAGE_H - 32;
  doc.moveTo(MARGIN, y - 8).lineTo(PAGE_W - MARGIN, y - 8).strokeColor(BORDER).lineWidth(0.5).stroke();
  doc.fillColor(MID).fontSize(7.5).font("Helvetica");
  const left = company?.website || "bmodernhomes.com.au";
  doc.text(left, MARGIN, y, { width: CONTENT_W / 2 });
  doc.text(`Page ${pageNum}`, MARGIN, y, { align: "right", width: CONTENT_W });
}

function sectionTitle(doc: PDFKit.PDFDocument, title: string, y: number): number {
  doc.rect(MARGIN, y, CONTENT_W, 26).fill(PETROL);
  doc.fillColor(WHITE).fontSize(9).font("Helvetica-Bold")
    .text(title.toUpperCase(), MARGIN + 12, y + 8, { width: CONTENT_W - 24 });
  return y + 34;
}

// ─── Main generator ───────────────────────────────────────────────────────────
export async function generateProposalPdf(data: PdfData): Promise<Buffer> {
  const { project, inclusions, exclusions, provisionalSums, upgradeGroups, planImages, company } = data;

  // Pre-fetch images
  const logoBuffer = await tryFetchImage(company?.logoUrl || null);
  const heroBuffer = await tryFetchImage(project.heroImageUrl);

  const doc = new PDFDocument({
    size: "A4",
    margin: 0,
    bufferPages: true,
    info: {
      Title: `Proposal — ${project.clientName}`,
      Author: company?.tagline || "B Modern Homes",
    },
  });

  const chunks: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));

  let pageNum = 1;

  // ─── Cover Page ─────────────────────────────────────────────────────────────
  drawPageBackground(doc, PETROL);

  // Hero image (full bleed top half)
  if (heroBuffer) {
    try {
      doc.image(heroBuffer, 0, 0, { width: PAGE_W, height: PAGE_H * 0.55, cover: [PAGE_W, PAGE_H * 0.55] });
    } catch { /* skip if image fails */ }
  }

  // Dark overlay on hero
  doc.rect(0, 0, PAGE_W, PAGE_H * 0.55).fillOpacity(0.35).fill("#000000").fillOpacity(1);

  // Logo on cover
  if (logoBuffer) {
    try {
      doc.image(logoBuffer, MARGIN, MARGIN, { height: 36, fit: [200, 36] });
    } catch { /* skip */ }
  } else {
    doc.fillColor(WHITE).fontSize(16).font("Helvetica-Bold").text("B MODERN HOMES", MARGIN, MARGIN + 8);
  }

  // Cover text block
  const coverY = PAGE_H * 0.58;
  doc.fillColor(WHITE).fontSize(9).font("Helvetica").text("PROPOSAL", MARGIN, coverY, { characterSpacing: 3 });
  doc.fillColor(WHITE).fontSize(32).font("Helvetica-Bold")
    .text(project.clientName.toUpperCase(), MARGIN, coverY + 16, { width: CONTENT_W });

  const afterName = doc.y + 8;
  doc.fillColor(CREAM).fontSize(12).font("Helvetica").text(project.projectAddress, MARGIN, afterName, { width: CONTENT_W });

  const afterAddr = doc.y + 20;
  // Info grid
  const col = CONTENT_W / 3;
  const infoItems = [
    ["Proposal No.", project.proposalNumber || "—"],
    ["Project Type", project.projectType || "—"],
    ["Base Contract", fmt(project.baseContractPrice) || "—"],
    ["Build Type", project.buildType || "—"],
    ["Status", project.status.charAt(0).toUpperCase() + project.status.slice(1)],
    ["Tender Expiry", fmtDate(project.tenderExpiry) || "—"],
  ];

  infoItems.forEach(([label, value], i) => {
    const cx = MARGIN + (i % 3) * col;
    const cy = afterAddr + Math.floor(i / 3) * 44;
    doc.fillColor(MID).fontSize(7).font("Helvetica").text(label.toUpperCase(), cx, cy, { characterSpacing: 1 });
    doc.fillColor(WHITE).fontSize(11).font("Helvetica-Bold").text(value, cx, cy + 10, { width: col - 8 });
  });

  // ─── Page 2+: content pages ─────────────────────────────────────────────────
  const startContentPage = () => {
    doc.addPage();
    pageNum++;
    drawPageBackground(doc, WHITE);
    drawHeader(doc, logoBuffer, company);
    return 70; // starting Y after header
  };

  let y = startContentPage();

  // ─── About / Intro ──────────────────────────────────────────────────────────
  if (company?.aboutUs || company?.tagline) {
    y = sectionTitle(doc, "About B Modern Homes", y);
    if (company.tagline) {
      doc.fillColor(PETROL).fontSize(13).font("Helvetica-Bold").text(company.tagline, MARGIN, y, { width: CONTENT_W });
      y = doc.y + 8;
    }
    if (company.aboutUs) {
      doc.fillColor(DARK).fontSize(9.5).font("Helvetica").text(company.aboutUs, MARGIN, y, { width: CONTENT_W, lineGap: 3 });
      y = doc.y + 16;
    }
  }

  // ─── Inclusions ─────────────────────────────────────────────────────────────
  if (inclusions.length > 0) {
    if (y > PAGE_H - 150) { drawFooter(doc, pageNum, company); y = startContentPage(); }
    y = sectionTitle(doc, "Inclusions", y);

    for (const inc of inclusions) {
      if (y > PAGE_H - 100) { drawFooter(doc, pageNum, company); y = startContentPage(); }

      // Inclusion row: optional image left, text right
      const incImgBuf = await tryFetchImage(inc.imageUrl);
      const imgW = 80;
      const textX = incImgBuf ? MARGIN + imgW + 10 : MARGIN;
      const textW = incImgBuf ? CONTENT_W - imgW - 10 : CONTENT_W;

      const rowStartY = y;
      if (incImgBuf) {
        try {
          doc.image(incImgBuf, MARGIN, y, { width: imgW, height: 60, cover: [imgW, 60] });
        } catch { /* skip */ }
      }

      doc.fillColor(PETROL).fontSize(10).font("Helvetica-Bold").text(inc.title, textX, rowStartY, { width: textW });
      if (inc.description) {
        doc.fillColor(DARK).fontSize(8.5).font("Helvetica").text(inc.description, textX, doc.y + 2, { width: textW, lineGap: 2 });
      }

      const rowEndY = Math.max(doc.y, rowStartY + (incImgBuf ? 64 : 0));
      y = rowEndY + 12;

      // Thin divider
      doc.moveTo(MARGIN, y - 4).lineTo(PAGE_W - MARGIN, y - 4).strokeColor(BORDER).lineWidth(0.3).stroke();
    }
    y += 8;
  }

  // ─── Exclusions ─────────────────────────────────────────────────────────────
  if (exclusions.length > 0) {
    if (y > PAGE_H - 120) { drawFooter(doc, pageNum, company); y = startContentPage(); }
    y = sectionTitle(doc, "Exclusions", y);

    for (const excl of exclusions) {
      if (y > PAGE_H - 60) { drawFooter(doc, pageNum, company); y = startContentPage(); }
      doc.fillColor(DARK).fontSize(9).font("Helvetica")
        .text(`• ${excl.description}`, MARGIN + 8, y, { width: CONTENT_W - 8, lineGap: 2 });
      y = doc.y + 6;
    }
    y += 8;
  }

  // ─── Provisional Sums ───────────────────────────────────────────────────────
  if (provisionalSums.length > 0) {
    if (y > PAGE_H - 120) { drawFooter(doc, pageNum, company); y = startContentPage(); }
    y = sectionTitle(doc, "Provisional Sums", y);

    // Table header
    doc.fillColor(MID).fontSize(7.5).font("Helvetica-Bold");
    doc.text("DESCRIPTION", MARGIN, y, { width: CONTENT_W * 0.55 });
    doc.text("AMOUNT", MARGIN + CONTENT_W * 0.55, y, { width: CONTENT_W * 0.2, align: "right" });
    doc.text("NOTES", MARGIN + CONTENT_W * 0.75, y, { width: CONTENT_W * 0.25 });
    y += 14;
    doc.moveTo(MARGIN, y).lineTo(PAGE_W - MARGIN, y).strokeColor(BORDER).lineWidth(0.4).stroke();
    y += 4;

    for (const ps of provisionalSums) {
      if (y > PAGE_H - 60) { drawFooter(doc, pageNum, company); y = startContentPage(); }
      const rowY = y;
      doc.fillColor(DARK).fontSize(9).font("Helvetica").text(ps.description, MARGIN, rowY, { width: CONTENT_W * 0.55 });
      doc.text(ps.amount ? fmt(ps.amount) : "TBC", MARGIN + CONTENT_W * 0.55, rowY, { width: CONTENT_W * 0.2, align: "right" });
      if (ps.notes) doc.fillColor(MID).fontSize(8).text(ps.notes, MARGIN + CONTENT_W * 0.75, rowY, { width: CONTENT_W * 0.25 });
      y = Math.max(doc.y, rowY) + 8;
      doc.moveTo(MARGIN, y - 2).lineTo(PAGE_W - MARGIN, y - 2).strokeColor(BORDER).lineWidth(0.2).stroke();
    }
    y += 8;
  }

  // ─── Upgrade Options ────────────────────────────────────────────────────────
  if (upgradeGroups.length > 0) {
    if (y > PAGE_H - 120) { drawFooter(doc, pageNum, company); y = startContentPage(); }
    y = sectionTitle(doc, "Upgrade Options", y);

    for (const group of upgradeGroups) {
      if (y > PAGE_H - 80) { drawFooter(doc, pageNum, company); y = startContentPage(); }

      // Category sub-heading
      doc.fillColor(PETROL).fontSize(10).font("Helvetica-Bold").text(group.category, MARGIN, y, { width: CONTENT_W });
      y = doc.y + 6;

      for (const opt of group.options) {
        if (y > PAGE_H - 60) { drawFooter(doc, pageNum, company); y = startContentPage(); }
        const rowY = y;
        const badge = opt.isIncluded ? "✓ INCLUDED" : opt.priceDelta ? `+ ${fmt(opt.priceDelta)}` : "";
        doc.fillColor(DARK).fontSize(9).font("Helvetica-Bold").text(opt.name, MARGIN + 8, rowY, { width: CONTENT_W * 0.65 });
        if (badge) {
          doc.fillColor(opt.isIncluded ? "#2E7D32" : PETROL).fontSize(8).font("Helvetica-Bold")
            .text(badge, MARGIN + CONTENT_W * 0.65, rowY, { width: CONTENT_W * 0.35, align: "right" });
        }
        if (opt.description) {
          doc.fillColor(MID).fontSize(8).font("Helvetica").text(opt.description, MARGIN + 8, doc.y + 2, { width: CONTENT_W - 8, lineGap: 1 });
        }
        y = doc.y + 8;
      }
      y += 4;
    }
  }

  // ─── Plan Images ────────────────────────────────────────────────────────────
  for (const img of planImages) {
    const imgBuf = await tryFetchImage(img.imageUrl);
    if (!imgBuf) continue;
    drawFooter(doc, pageNum, company);
    y = startContentPage();
    if (img.title) {
      y = sectionTitle(doc, img.title, y);
    }
    const maxH = PAGE_H - y - 60;
    try {
      doc.image(imgBuf, MARGIN, y, { fit: [CONTENT_W, maxH] });
    } catch { /* skip */ }
  }

  // ─── Final page: Terms summary ───────────────────────────────────────────────
  if (company?.credentials) {
    drawFooter(doc, pageNum, company);
    y = startContentPage();
    y = sectionTitle(doc, "Credentials & Certifications", y);
    doc.fillColor(DARK).fontSize(9.5).font("Helvetica").text(company.credentials, MARGIN, y, { width: CONTENT_W, lineGap: 3 });
    y = doc.y + 16;
  }

  // Footer on last page
  drawFooter(doc, pageNum, company);

  doc.end();

  return new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });
}
