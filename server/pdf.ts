/**
 * PDF Generation for B Modern Tender Portal
 * Generates a branded proposal PDF using puppeteer-core + system chromium.
 */
import puppeteer from "puppeteer";

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
const BLUEGUM = "#6D7E94";
const CREAM = "#F5F2EE";
const BLACK = "#1A1A1A";
const WHITE = "#FFFFFF";
const BORDER = "#DDD8D0";

// ─── HTML Template ────────────────────────────────────────────────────────────
function buildHtml(data: PdfData): string {
  const { project, inclusions, exclusions, provisionalSums, upgradeGroups, planImages, company } = data;

  const fmt = (n: string | null) => n ? `$${Number(n).toLocaleString("en-AU")}` : "";
  const fmtDate = (d: Date | null) => d ? new Date(d).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" }) : "";

  // ─── Cover Page ─────────────────────────────────────────────────────────────
  const coverHero = project.heroImageUrl
    ? `<div class="cover-hero" style="background-image:url('${project.heroImageUrl}')"></div>`
    : `<div class="cover-hero cover-hero--blank"></div>`;

  const logoSrc = company?.logoUrl
    ? company.logoUrl
    : "https://d2xsxph8kpxj0f.cloudfront.net/310519663548387177/imEXQJppF9z2GgJphACuNv/B-Modern-Homes_Logo_Horizontal-Monochrome_RGB_ec48343d.jpg";

  // ─── Inclusions ─────────────────────────────────────────────────────────────
  const inclusionCards = inclusions.map((inc) => `
    <div class="inclusion-card">
      ${inc.imageUrl ? `<div class="inclusion-img" style="background-image:url('${inc.imageUrl}')"></div>` : ""}
      <div class="inclusion-body">
        <div class="inclusion-title">${inc.title}</div>
        ${inc.description ? `<div class="inclusion-desc">${inc.description}</div>` : ""}
      </div>
    </div>
  `).join("");

  // ─── Exclusions ─────────────────────────────────────────────────────────────
  const exclusionRows = exclusions.map((e) => `<li class="list-item">${e.description}</li>`).join("");

  // ─── Provisional Sums ───────────────────────────────────────────────────────
  const psRows = provisionalSums.map((ps) => `
    <tr>
      <td class="ps-desc">${ps.description}</td>
      <td class="ps-amount">${ps.amount ? fmt(ps.amount) : "TBC"}</td>
      <td class="ps-notes">${ps.notes || ""}</td>
    </tr>
  `).join("");

  // ─── Upgrades ───────────────────────────────────────────────────────────────
  const upgradeSection = upgradeGroups.map((group) => `
    <div class="upgrade-group">
      <div class="upgrade-group-title">${group.category}</div>
      <table class="upgrade-table">
        <thead>
          <tr>
            <th>Option</th>
            <th>Description</th>
            <th>Price Adjustment</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${group.options.map((opt) => `
            <tr>
              <td class="opt-name">${opt.name}</td>
              <td class="opt-desc">${opt.description || ""}</td>
              <td class="opt-price">${opt.priceDelta ? (Number(opt.priceDelta) >= 0 ? `+${fmt(opt.priceDelta)}` : fmt(opt.priceDelta)) : "—"}</td>
              <td class="opt-status ${opt.isIncluded ? "included" : "upgrade"}">${opt.isIncluded ? "Included" : "Upgrade"}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `).join("");

  // ─── Plan Images ────────────────────────────────────────────────────────────
  const planGrid = planImages.map((img) => `
    <div class="plan-img-wrap">
      <img src="${img.imageUrl}" class="plan-img" alt="${img.title || "Plan"}" />
      ${img.title ? `<div class="plan-img-caption">${img.title}</div>` : ""}
    </div>
  `).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display+SC:wght@400;700&family=Lato:wght@300;400;700&display=swap" rel="stylesheet" />
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { font-size: 10pt; }
  body { font-family: 'Lato', sans-serif; color: ${BLACK}; background: ${WHITE}; }

  /* ─── Page breaks ─── */
  .page { page-break-after: always; min-height: 100vh; }
  .page:last-child { page-break-after: avoid; }

  /* ─── Cover ─── */
  .cover { display: flex; flex-direction: column; height: 100vh; }
  .cover-hero {
    flex: 1;
    background-size: cover;
    background-position: center;
    position: relative;
  }
  .cover-hero--blank { background: ${PETROL}; }
  .cover-hero::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.55) 100%);
  }
  .cover-logo-overlay {
    position: absolute;
    bottom: 48px;
    left: 48px;
    z-index: 2;
  }
  .cover-logo-overlay img {
    height: 36px;
    filter: brightness(0) invert(1);
  }
  .cover-footer {
    background: ${PETROL};
    color: ${WHITE};
    padding: 32px 48px;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
  }
  .cover-footer-left {}
  .cover-client { font-family: 'Playfair Display SC', serif; font-size: 22pt; font-weight: 400; margin-bottom: 4px; }
  .cover-address { font-size: 10pt; font-weight: 300; opacity: 0.85; margin-bottom: 12px; }
  .cover-label { font-size: 7pt; letter-spacing: 0.12em; text-transform: uppercase; opacity: 0.6; margin-bottom: 2px; }
  .cover-value { font-size: 9pt; font-weight: 300; }
  .cover-footer-right { text-align: right; }
  .cover-proposal-num { font-family: 'Playfair Display SC', serif; font-size: 13pt; opacity: 0.9; }
  .cover-date { font-size: 8pt; font-weight: 300; opacity: 0.65; margin-top: 4px; }

  /* ─── Section pages ─── */
  .section-page { padding: 48px; }
  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1.5px solid ${PETROL};
    padding-bottom: 12px;
    margin-bottom: 28px;
  }
  .section-title { font-family: 'Playfair Display SC', serif; font-size: 18pt; color: ${PETROL}; font-weight: 400; }
  .section-logo img { height: 22px; opacity: 0.7; }

  /* ─── About Us ─── */
  .about-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }
  .about-block {}
  .about-label { font-size: 7pt; letter-spacing: 0.12em; text-transform: uppercase; color: ${BLUEGUM}; margin-bottom: 6px; }
  .about-text { font-size: 9.5pt; line-height: 1.65; color: ${BLACK}; font-weight: 300; }
  .about-tagline { font-family: 'Playfair Display SC', serif; font-size: 13pt; color: ${PETROL}; margin-bottom: 16px; }
  .contact-row { display: flex; gap: 8px; align-items: center; margin-bottom: 5px; font-size: 9pt; font-weight: 300; }
  .contact-label { color: ${BLUEGUM}; font-size: 7.5pt; width: 52px; flex-shrink: 0; }

  /* ─── Project Summary ─── */
  .summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px 32px; margin-bottom: 28px; }
  .summary-item {}
  .summary-label { font-size: 7pt; letter-spacing: 0.12em; text-transform: uppercase; color: ${BLUEGUM}; margin-bottom: 3px; }
  .summary-value { font-size: 10pt; font-weight: 400; }
  .price-box {
    background: ${PETROL};
    color: ${WHITE};
    padding: 20px 28px;
    border-radius: 4px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 16px;
  }
  .price-box-label { font-size: 8pt; letter-spacing: 0.1em; text-transform: uppercase; opacity: 0.75; }
  .price-box-amount { font-family: 'Playfair Display SC', serif; font-size: 20pt; }

  /* ─── Inclusions ─── */
  .inclusion-card {
    display: flex;
    gap: 16px;
    padding: 16px 0;
    border-bottom: 1px solid ${BORDER};
  }
  .inclusion-card:last-child { border-bottom: none; }
  .inclusion-img {
    width: 100px;
    height: 70px;
    background-size: cover;
    background-position: center;
    border-radius: 3px;
    flex-shrink: 0;
  }
  .inclusion-body { flex: 1; }
  .inclusion-title { font-family: 'Playfair Display SC', serif; font-size: 11pt; color: ${PETROL}; margin-bottom: 5px; }
  .inclusion-desc { font-size: 8.5pt; line-height: 1.6; color: #444; font-weight: 300; }

  /* ─── Exclusions ─── */
  .list-item {
    font-size: 9pt;
    font-weight: 300;
    line-height: 1.7;
    padding-left: 4px;
    color: ${BLACK};
  }
  .exclusions-list { padding-left: 18px; }

  /* ─── Provisional Sums ─── */
  .ps-table { width: 100%; border-collapse: collapse; font-size: 9pt; }
  .ps-table th {
    text-align: left;
    font-size: 7pt;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: ${BLUEGUM};
    padding: 6px 8px;
    border-bottom: 1px solid ${BORDER};
    font-weight: 400;
  }
  .ps-table td { padding: 10px 8px; border-bottom: 1px solid ${BORDER}; vertical-align: top; }
  .ps-desc { font-weight: 400; width: 45%; }
  .ps-amount { font-weight: 700; color: ${PETROL}; width: 20%; }
  .ps-notes { color: #666; font-weight: 300; font-size: 8.5pt; }

  /* ─── Upgrades ─── */
  .upgrade-group { margin-bottom: 28px; }
  .upgrade-group-title {
    font-family: 'Playfair Display SC', serif;
    font-size: 12pt;
    color: ${PETROL};
    margin-bottom: 10px;
    padding-bottom: 6px;
    border-bottom: 1px solid ${BORDER};
  }
  .upgrade-table { width: 100%; border-collapse: collapse; font-size: 8.5pt; }
  .upgrade-table th {
    text-align: left;
    font-size: 7pt;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: ${BLUEGUM};
    padding: 5px 8px;
    border-bottom: 1px solid ${BORDER};
    font-weight: 400;
  }
  .upgrade-table td { padding: 8px; border-bottom: 1px solid ${BORDER}; vertical-align: top; }
  .opt-name { font-weight: 600; width: 22%; }
  .opt-desc { color: #555; font-weight: 300; width: 40%; }
  .opt-price { font-weight: 700; color: ${PETROL}; width: 18%; }
  .opt-status { width: 12%; }
  .included { color: #2E7D32; font-weight: 600; }
  .upgrade { color: ${BLUEGUM}; font-weight: 400; }

  /* ─── Plan Images ─── */
  .plan-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  .plan-img-wrap {}
  .plan-img { width: 100%; height: 200px; object-fit: cover; border-radius: 3px; display: block; }
  .plan-img-caption { font-size: 8pt; color: ${BLUEGUM}; margin-top: 5px; text-align: center; }

  /* ─── Footer ─── */
  .page-footer {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 48px;
    font-size: 7pt;
    color: ${BLUEGUM};
    border-top: 1px solid ${BORDER};
    background: ${WHITE};
  }
</style>
</head>
<body>

<!-- ═══════════════════════════════════════════════════════════════════════════
     COVER PAGE
═══════════════════════════════════════════════════════════════════════════ -->
<div class="page cover">
  <div class="cover-hero" style="${project.heroImageUrl ? `background-image:url('${project.heroImageUrl}')` : `background:${PETROL}`}">
    <div class="cover-logo-overlay">
      <img src="${logoSrc}" alt="B Modern Homes" />
    </div>
  </div>
  <div class="cover-footer">
    <div class="cover-footer-left">
      <div class="cover-client">${project.clientName}</div>
      <div class="cover-address">${project.projectAddress}</div>
      ${project.projectType ? `<div class="cover-label">Project Type</div><div class="cover-value">${project.projectType}${project.buildType ? ` — ${project.buildType}` : ""}</div>` : ""}
    </div>
    <div class="cover-footer-right">
      <div class="cover-label">Tender Proposal</div>
      ${project.proposalNumber ? `<div class="cover-proposal-num">${project.proposalNumber}</div>` : ""}
      ${project.tenderExpiry ? `<div class="cover-date">Valid until ${fmtDate(project.tenderExpiry)}</div>` : ""}
    </div>
  </div>
</div>

<!-- ═══════════════════════════════════════════════════════════════════════════
     ABOUT US
═══════════════════════════════════════════════════════════════════════════ -->
${company ? `
<div class="page section-page">
  <div class="section-header">
    <div class="section-title">About B Modern Homes</div>
    <div class="section-logo"><img src="${logoSrc}" alt="B Modern Homes" /></div>
  </div>
  <div class="about-grid">
    <div class="about-block">
      ${company.tagline ? `<div class="about-tagline">${company.tagline}</div>` : ""}
      ${company.aboutUs ? `<div class="about-label">Who We Are</div><div class="about-text">${company.aboutUs}</div>` : ""}
    </div>
    <div class="about-block">
      ${company.credentials ? `<div class="about-label">Credentials &amp; Experience</div><div class="about-text" style="margin-bottom:20px">${company.credentials}</div>` : ""}
      <div class="about-label">Contact</div>
      ${company.phone ? `<div class="contact-row"><span class="contact-label">Phone</span>${company.phone}</div>` : ""}
      ${company.email ? `<div class="contact-row"><span class="contact-label">Email</span>${company.email}</div>` : ""}
      ${company.website ? `<div class="contact-row"><span class="contact-label">Web</span>${company.website}</div>` : ""}
      ${company.address ? `<div class="contact-row"><span class="contact-label">Office</span>${company.address}</div>` : ""}
    </div>
  </div>
</div>
` : ""}

<!-- ═══════════════════════════════════════════════════════════════════════════
     PROJECT SUMMARY
═══════════════════════════════════════════════════════════════════════════ -->
<div class="page section-page">
  <div class="section-header">
    <div class="section-title">Project Summary</div>
    <div class="section-logo"><img src="${logoSrc}" alt="B Modern Homes" /></div>
  </div>
  <div class="summary-grid">
    <div class="summary-item">
      <div class="summary-label">Client</div>
      <div class="summary-value">${project.clientName}</div>
    </div>
    <div class="summary-item">
      <div class="summary-label">Project Address</div>
      <div class="summary-value">${project.projectAddress}</div>
    </div>
    ${project.proposalNumber ? `<div class="summary-item"><div class="summary-label">Proposal Number</div><div class="summary-value">${project.proposalNumber}</div></div>` : ""}
    ${project.projectType ? `<div class="summary-item"><div class="summary-label">Project Type</div><div class="summary-value">${project.projectType}</div></div>` : ""}
    ${project.buildType ? `<div class="summary-item"><div class="summary-label">Build Type</div><div class="summary-value">${project.buildType}</div></div>` : ""}
    ${project.tenderExpiry ? `<div class="summary-item"><div class="summary-label">Tender Valid Until</div><div class="summary-value">${fmtDate(project.tenderExpiry)}</div></div>` : ""}
  </div>
  ${project.baseContractPrice ? `
  <div class="price-box">
    <div class="price-box-label">Base Contract Price</div>
    <div class="price-box-amount">${fmt(project.baseContractPrice)}</div>
  </div>
  ` : ""}
</div>

<!-- ═══════════════════════════════════════════════════════════════════════════
     BASE INCLUSIONS
═══════════════════════════════════════════════════════════════════════════ -->
${inclusions.length > 0 ? `
<div class="page section-page">
  <div class="section-header">
    <div class="section-title">Base Inclusions</div>
    <div class="section-logo"><img src="${logoSrc}" alt="B Modern Homes" /></div>
  </div>
  ${inclusionCards}
</div>
` : ""}

<!-- ═══════════════════════════════════════════════════════════════════════════
     EXCLUSIONS
═══════════════════════════════════════════════════════════════════════════ -->
${exclusions.length > 0 ? `
<div class="page section-page">
  <div class="section-header">
    <div class="section-title">Exclusions</div>
    <div class="section-logo"><img src="${logoSrc}" alt="B Modern Homes" /></div>
  </div>
  <p style="font-size:9pt;color:#666;margin-bottom:16px;font-weight:300;">The following items are explicitly excluded from the base contract scope and will be subject to separate quotation or variation if required.</p>
  <ul class="exclusions-list">
    ${exclusionRows}
  </ul>
</div>
` : ""}

<!-- ═══════════════════════════════════════════════════════════════════════════
     PROVISIONAL SUMS
═══════════════════════════════════════════════════════════════════════════ -->
${provisionalSums.length > 0 ? `
<div class="page section-page">
  <div class="section-header">
    <div class="section-title">Provisional Sums</div>
    <div class="section-logo"><img src="${logoSrc}" alt="B Modern Homes" /></div>
  </div>
  <p style="font-size:9pt;color:#666;margin-bottom:16px;font-weight:300;">The following provisional sums (PS) are included in the contract as estimated allowances for work that cannot be fully defined at tender stage. Actual costs will be adjusted by variation once the scope is confirmed.</p>
  <table class="ps-table">
    <thead>
      <tr>
        <th>Description</th>
        <th>Allowance</th>
        <th>Notes</th>
      </tr>
    </thead>
    <tbody>
      ${psRows}
    </tbody>
  </table>
</div>
` : ""}

<!-- ═══════════════════════════════════════════════════════════════════════════
     UPGRADE OPTIONS
═══════════════════════════════════════════════════════════════════════════ -->
${upgradeGroups.length > 0 ? `
<div class="page section-page">
  <div class="section-header">
    <div class="section-title">Upgrade Options</div>
    <div class="section-logo"><img src="${logoSrc}" alt="B Modern Homes" /></div>
  </div>
  <p style="font-size:9pt;color:#666;margin-bottom:20px;font-weight:300;">The following upgrade options are available for your consideration. Price adjustments shown are additions to the base contract price.</p>
  ${upgradeSection}
</div>
` : ""}

<!-- ═══════════════════════════════════════════════════════════════════════════
     PLAN IMAGES
═══════════════════════════════════════════════════════════════════════════ -->
${planImages.length > 0 ? `
<div class="page section-page">
  <div class="section-header">
    <div class="section-title">Plans &amp; Drawings</div>
    <div class="section-logo"><img src="${logoSrc}" alt="B Modern Homes" /></div>
  </div>
  <div class="plan-grid">
    ${planGrid}
  </div>
</div>
` : ""}

<!-- ═══════════════════════════════════════════════════════════════════════════
     BACK PAGE
═══════════════════════════════════════════════════════════════════════════ -->
<div class="page" style="background:${PETROL};display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;gap:24px;">
  <img src="${logoSrc}" alt="B Modern Homes" style="height:42px;filter:brightness(0) invert(1);" />
  ${company?.tagline ? `<div style="font-family:'Lato',sans-serif;font-size:10pt;color:rgba(255,255,255,0.65);letter-spacing:0.08em;font-weight:300;">${company.tagline}</div>` : ""}
  <div style="width:40px;height:1px;background:rgba(255,255,255,0.3);"></div>
  <div style="font-family:'Lato',sans-serif;font-size:8pt;color:rgba(255,255,255,0.5);text-align:center;line-height:1.8;">
    ${company?.phone ? `${company.phone}<br/>` : ""}
    ${company?.email ? `${company.email}<br/>` : ""}
    ${company?.website ? `${company.website}` : ""}
  </div>
  <div style="font-family:'Lato',sans-serif;font-size:7pt;color:rgba(255,255,255,0.3);margin-top:16px;">
    This proposal is confidential and prepared exclusively for ${project.clientName}.
    ${project.tenderExpiry ? `Valid until ${fmtDate(project.tenderExpiry)}.` : ""}
  </div>
</div>

</body>
</html>`;
}

// ─── PDF Generator ────────────────────────────────────────────────────────────
export async function generateProposalPdf(data: PdfData): Promise<Buffer> {
  const html = buildHtml(data);

  const browser = await puppeteer.launch({
    executablePath: "/usr/bin/chromium",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--font-render-hinting=none",
    ],
    headless: true,
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0", timeout: 30000 });

    // Wait for fonts to load
    await page.evaluateHandle("document.fonts.ready");

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
      displayHeaderFooter: false,
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}
