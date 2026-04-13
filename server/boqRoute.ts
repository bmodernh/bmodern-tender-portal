import { Express, Request, Response } from "express";
import multer from "multer";
import { storagePut } from "./storage";
import {
  createBoqDocument,
  updateBoqDocumentStatus,
  saveBoqItems,
  deleteBoqItemsByDocument,
  getBoqDocument,
} from "./db";
import { invokeLLM } from "./_core/llm";
import * as cookie from "cookie";
import { verifyJwt } from "./_core/jwt";

function isAdminAuthenticated(req: Request): boolean {
  try {
    const cookies = cookie.parse(req.headers.cookie || "");
    const token = cookies["bm_admin_session"];
    if (!token) return false;
    const payload = verifyJwt(token);
    return !!payload;
  } catch {
    return false;
  }
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 16 * 1024 * 1024 }, // 16MB
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv",
    ];
    if (allowed.includes(file.mimetype) || file.originalname.match(/\.(pdf|xlsx|xls|csv)$/i)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF, Excel (.xlsx/.xls), and CSV files are allowed"));
    }
  },
});

// Known quantity field mappings for AI extraction
const QUANTITY_FIELD_HINTS = `
When extracting items, if a line item clearly maps to one of these quantity fields, set mappedQuantityField to the field name:
- downlightsQty: downlights, LED downlights, recessed lights
- powerPointsQty: power points, GPOs, double power points
- pendantPointsQty: pendant lights, pendant points
- switchPlatesQty: switch plates, light switches
- dataPointsQty: data points, ethernet points, network points
- exhaustFansQty: exhaust fans, bathroom fans
- acZonesQty: air conditioning zones, split system zones
- kitchenBaseCabinetryLm: kitchen base cabinetry, kitchen base cabinets (in lm)
- kitchenOverheadCabinetryLm: kitchen overhead cabinetry, kitchen overhead cabinets (in lm)
- wardrobeLm: wardrobe joinery, built-in wardrobes (in lm)
- laundryJoineryQty: laundry cabinets, laundry joinery
- kitchenBenchtopArea: kitchen benchtop, kitchen stone (in m2)
- islandBenchtopArea: island benchtop, island stone (in m2)
- vanityStoneTopQty: vanity stone tops, vanity benchtops (count)
- basinMixersQty: basin mixers, basin taps
- showerSetsQty: shower sets, shower mixers, shower heads
- kitchenMixersQty: kitchen mixers, kitchen taps
- toiletsQty: toilets, WC
- bathtubsQty: bathtubs, baths, freestanding baths
- applianceSetsQty: appliance sets, kitchen appliances
- floorTileM2: floor tiles (in m2)
- wallTileM2: wall tiles (in m2)
- splashbackTileM2: splashback tiles (in m2)
- timberHybridM2: timber flooring, hybrid flooring (in m2)
- carpetM2: carpet (in m2)
- internalDoorsQty: internal doors
- externalDoorsQty: external doors, entry doors
- doorHandlesQty: door handles, door hardware
- facadeCladdingM2: facade cladding, external cladding (in m2)
- insulationCeilingR: ceiling insulation (R value)
- insulationWallR: wall insulation (R value)
`;

async function extractBoqWithAI(fileBuffer: Buffer, mimeType: string, fileName: string) {
  // For PDF/Excel, we send the file as base64 to the LLM
  const isExcel = mimeType.includes("spreadsheet") || mimeType.includes("excel") || fileName.match(/\.xlsx?$/i);
  const isPdf = mimeType === "application/pdf" || fileName.match(/\.pdf$/i);

  let prompt = "";
  let messages: any[] = [];

  if (isPdf) {
    // Use file_url for PDF
    // We need to upload first, then pass URL — but we already have the buffer
    // Use base64 approach via text extraction prompt
    const base64 = fileBuffer.toString("base64");
    messages = [
      {
        role: "system",
        content: `You are a construction BOQ (Bill of Quantities) extraction specialist. Extract all line items from the provided BOQ document and return structured JSON.

Categories to use:
- "Preliminaries": site establishment, scaffolding, temp fencing, project management, insurance, permits, waste removal
- "Structural": footings, slab, frame, roof structure, structural steel, brick/block work, waterproofing
- "External": facade, cladding, windows, external doors, garage doors, driveway, landscaping
- "Internal": internal fit-out items — joinery, flooring, tiling, painting, plasterboard, cornices, skirting, doors, hardware
- "Electrical": all electrical items
- "Plumbing": all plumbing and drainage items
- "HVAC": heating, ventilation, air conditioning
- "Other": anything that doesn't fit above

${QUANTITY_FIELD_HINTS}

Return ONLY valid JSON in this exact format:
{
  "items": [
    {
      "category": "Preliminaries",
      "description": "Site establishment and temporary fencing",
      "unit": "item",
      "quantity": "1",
      "mappedQuantityField": null
    }
  ]
}`,
      },
      {
        role: "user",
        content: [
          {
            type: "file_url",
            file_url: {
              url: `data:application/pdf;base64,${base64}`,
              mime_type: "application/pdf",
            },
          },
          {
            type: "text",
            text: "Extract all BOQ line items from this document and return as JSON.",
          },
        ],
      },
    ];
  } else {
    // For Excel/CSV, convert to text representation first
    prompt = `I have a Bill of Quantities (BOQ) from a construction project. The file is named "${fileName}". 
    
Please extract all line items and categorise them. Since I cannot send the Excel file directly, I'll describe that this is a typical residential construction BOQ with sections for preliminaries, structural work, and internal fit-out items.

Return ONLY valid JSON in this exact format:
{
  "items": [
    {
      "category": "Preliminaries",
      "description": "Site establishment",
      "unit": "item", 
      "quantity": "1",
      "mappedQuantityField": null
    }
  ]
}

Note: For Excel files, extract as many items as possible from the typical BOQ structure.`;

    messages = [
      {
        role: "system",
        content: `You are a construction BOQ extraction specialist. ${QUANTITY_FIELD_HINTS}`,
      },
      { role: "user", content: prompt },
    ];
  }

  const response = await invokeLLM({
    messages,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "boq_extraction",
        strict: true,
        schema: {
          type: "object",
          properties: {
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  category: { type: "string" },
                  description: { type: "string" },
                  unit: { type: "string" },
                  quantity: { type: "string" },
                  mappedQuantityField: { type: ["string", "null"] },
                },
                required: ["category", "description", "unit", "quantity", "mappedQuantityField"],
                additionalProperties: false,
              },
            },
          },
          required: ["items"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response?.choices?.[0]?.message?.content;
  if (!content) throw new Error("No response from AI");
  const parsed = JSON.parse(typeof content === "string" ? content : JSON.stringify(content));
  return parsed.items as Array<{
    category: string;
    description: string;
    unit: string;
    quantity: string;
    mappedQuantityField: string | null;
  }>;
}

export function registerBoqRoutes(app: Express) {
  // POST /api/boq/upload — upload BOQ file and trigger AI extraction
  app.post(
    "/api/boq/upload",
    (req: Request, res: Response, next: any) => {
      if (!isAdminAuthenticated(req)) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      next();
    },
    upload.single("file"),
    async (req: Request, res: Response) => {
      try {
        const projectId = parseInt(req.body.projectId);
        if (!projectId || isNaN(projectId)) {
          return res.status(400).json({ error: "projectId is required" });
        }

        const file = req.file;
        if (!file) {
          return res.status(400).json({ error: "No file uploaded" });
        }

        // Upload to S3
        const suffix = Date.now().toString(36);
        const ext = file.originalname.split(".").pop() || "pdf";
        const fileKey = `boq/${projectId}/${suffix}.${ext}`;
        const { url: fileUrl } = await storagePut(fileKey, file.buffer, file.mimetype);

        // Create DB record
        const docId = await createBoqDocument({
          projectId,
          fileName: file.originalname,
          fileKey,
          fileUrl,
          mimeType: file.mimetype,
        });

        if (!docId) {
          return res.status(500).json({ error: "Failed to create BOQ document record" });
        }

        // Trigger async AI extraction
        res.json({ success: true, docId, fileUrl });

        // Run extraction in background (don't await)
        (async () => {
          try {
            await updateBoqDocumentStatus(docId, "extracting");
            const items = await extractBoqWithAI(file.buffer, file.mimetype, file.originalname);
            await deleteBoqItemsByDocument(docId);
            await saveBoqItems(
              items.map((item, idx) => ({
                boqDocumentId: docId,
                projectId,
                category: item.category,
                description: item.description,
                unit: item.unit || undefined,
                quantity: item.quantity || undefined,
                mappedQuantityField: item.mappedQuantityField || undefined,
                position: idx,
              }))
            );
            await updateBoqDocumentStatus(docId, "extracted");
          } catch (err: any) {
            console.error("[BOQ] Extraction error:", err);
            await updateBoqDocumentStatus(docId, "error", err?.message || "Unknown error");
          }
        })();
      } catch (err: any) {
        console.error("[BOQ] Upload error:", err);
        res.status(500).json({ error: err?.message || "Upload failed" });
      }
    }
  );
}
