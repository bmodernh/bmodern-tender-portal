/**
 * Email notification helper for B Modern Tender Portal.
 * Uses the Manus built-in notification API to send emails.
 */

const OPERATIONS_EMAIL = "operations@bmodernhomes.com.au";

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

async function sendEmail(payload: EmailPayload): Promise<boolean> {
  try {
    const apiUrl = process.env.BUILT_IN_FORGE_API_URL;
    const apiKey = process.env.BUILT_IN_FORGE_API_KEY;
    if (!apiUrl || !apiKey) {
      console.warn("[Email] API credentials not configured, skipping email send");
      return false;
    }
    const response = await fetch(`${apiUrl}/v1/email/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
      }),
    });
    if (!response.ok) {
      console.warn("[Email] Failed to send:", response.status, await response.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error("[Email] Error sending email:", err);
    return false;
  }
}

function brandedEmailTemplate(title: string, body: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Georgia, serif; background: #f5f5f0; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background: #ffffff; }
    .header { background: #203E4A; padding: 32px 40px; }
    .header h1 { color: #ffffff; font-size: 22px; margin: 0; letter-spacing: 2px; font-weight: 400; }
    .header p { color: #6D7E94; font-size: 12px; margin: 4px 0 0; letter-spacing: 1px; }
    .body { padding: 40px; color: #1a1a1a; line-height: 1.7; }
    .body h2 { color: #203E4A; font-size: 18px; margin-top: 0; }
    .footer { background: #f0ede8; padding: 20px 40px; font-size: 12px; color: #888; text-align: center; }
    .divider { border: none; border-top: 1px solid #e0ddd8; margin: 24px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>B MODERN HOMES</h1>
      <p>TENDER PORTAL NOTIFICATION</p>
    </div>
    <div class="body">
      <h2>${title}</h2>
      ${body}
    </div>
    <div class="footer">
      B Modern Homes &bull; Inner West Sydney &bull; bmodernhomes.com.au
    </div>
  </div>
</body>
</html>`;
}

// ─── Notification Functions ───────────────────────────────────────────────────

export async function notifyUpgradeSubmission(
  projectId: number,
  projectAddress: string,
  clientName: string,
  clientEmail: string | null | undefined,
  totalUpgradeCost: string
) {
  const adminHtml = brandedEmailTemplate(
    "New Upgrade Selection Submitted",
    `<p>A client has submitted their upgrade selections for review.</p>
     <hr class="divider">
     <p><strong>Project:</strong> ${projectAddress}</p>
     <p><strong>Client:</strong> ${clientName}</p>
     <p><strong>Proposal ID:</strong> #${projectId}</p>
     <p><strong>Total Upgrade Value:</strong> $${Number(totalUpgradeCost).toLocaleString("en-AU", { minimumFractionDigits: 2 })}</p>
     <hr class="divider">
     <p>Please log in to the admin portal to review the selections.</p>`
  );
  await sendEmail({ to: OPERATIONS_EMAIL, subject: `Upgrade Submission — ${clientName} | ${projectAddress}`, html: adminHtml });

  if (clientEmail) {
    const clientHtml = brandedEmailTemplate(
      "Your Upgrade Selections Have Been Received",
      `<p>Dear ${clientName},</p>
       <p>Thank you for submitting your upgrade selections for your B Modern Homes project.</p>
       <hr class="divider">
       <p><strong>Project Address:</strong> ${projectAddress}</p>
       <p><strong>Total Upgrade Value:</strong> $${Number(totalUpgradeCost).toLocaleString("en-AU", { minimumFractionDigits: 2 })}</p>
       <hr class="divider">
       <p>Our team will review your selections and be in touch shortly. If you have any questions, please contact us at <a href="mailto:${OPERATIONS_EMAIL}">${OPERATIONS_EMAIL}</a>.</p>
       <p>Warm regards,<br><strong>B Modern Homes Team</strong></p>`
    );
    await sendEmail({ to: clientEmail, subject: "Your Upgrade Selections — B Modern Homes", html: clientHtml });
  }
}

export async function notifyFileUpload(
  projectAddress: string,
  clientName: string,
  fileName: string
) {
  const html = brandedEmailTemplate(
    "New File Uploaded by Client",
    `<p>A client has uploaded a new file to their project portal.</p>
     <hr class="divider">
     <p><strong>Project:</strong> ${projectAddress}</p>
     <p><strong>Client:</strong> ${clientName}</p>
     <p><strong>File:</strong> ${fileName}</p>
     <hr class="divider">
     <p>Please log in to the admin portal to review the uploaded file.</p>`
  );
  await sendEmail({ to: OPERATIONS_EMAIL, subject: `New File Upload — ${clientName} | ${projectAddress}`, html });
}

export async function notifyChangeRequest(
  projectAddress: string,
  clientName: string,
  category: string,
  description: string
) {
  const html = brandedEmailTemplate(
    "New Change Request Submitted",
    `<p>A client has submitted a change request for review.</p>
     <hr class="divider">
     <p><strong>Project:</strong> ${projectAddress}</p>
     <p><strong>Client:</strong> ${clientName}</p>
     <p><strong>Category:</strong> ${category}</p>
     <p><strong>Description:</strong></p>
     <blockquote style="border-left: 3px solid #203E4A; padding-left: 16px; color: #444;">${description}</blockquote>
     <hr class="divider">
     <p>Please log in to the admin portal to review and respond to this request.</p>`
  );
  await sendEmail({ to: OPERATIONS_EMAIL, subject: `Change Request — ${clientName} | ${projectAddress}`, html });
}
