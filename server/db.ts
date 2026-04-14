import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  adminCredentials,
  changeRequests,
  clientFiles,
  clientTokens,
  companySettings,
  exclusions,
  inclusionSections,
  masterPackageItems,
  masterPackages,
  planImages,
  projects,
  provisionalSums,
  quantities,
  upgradeGroups,
  upgradeOptions,
  upgradeSelections,
  upgradeSubmissions,
  upgradePricingRules,
  clientItemSelections,
  boqDocuments,
  boqItems,
  termsAndConditions,
  portalTcAcknowledgements,
  users,
  inclusionCategories,
  inclusionItems,
  customItemRequests,
  projectMessages,
  pcItems,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  type TextField = (typeof textFields)[number];
  const assignNullable = (field: TextField) => {
    const value = user[field];
    if (value === undefined) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  };
  textFields.forEach(assignNullable);
  if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
  if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
  else if (user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Admin Credentials ────────────────────────────────────────────────────────
export async function getAdminCredentials(username: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(adminCredentials).where(eq(adminCredentials.username, username)).limit(1);
  return result[0];
}

export async function upsertAdminCredentials(username: string, passwordHash: string) {
  const db = await getDb();
  if (!db) return;
  await db.insert(adminCredentials).values({ username, passwordHash }).onDuplicateKeyUpdate({ set: { passwordHash } });
}

// ─── Projects ─────────────────────────────────────────────────────────────────
export async function getAllProjects() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(projects).orderBy(desc(projects.createdAt));
}

export async function getProjectById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  return result[0];
}

export async function createProject(data: Omit<typeof projects.$inferInsert, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(projects).values(data);
  return result[0];
}

export async function updateProject(id: number, data: Partial<typeof projects.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(projects).set(data).where(eq(projects.id, id));
}

export async function deleteProject(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(projects).where(eq(projects.id, id));
}

// ─── Client Tokens ────────────────────────────────────────────────────────────
export async function createClientToken(projectId: number, token: string, expiresAt?: Date) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(clientTokens).values({ projectId, token, expiresAt });
}

export async function getClientTokenRecord(token: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(clientTokens).where(eq(clientTokens.token, token)).limit(1);
  return result[0];
}

export async function getClientTokensByProject(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(clientTokens).where(eq(clientTokens.projectId, projectId));
}

export async function updateClientTokenLastAccess(token: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(clientTokens).set({ lastAccessedAt: new Date() }).where(eq(clientTokens.token, token));
}

// ─── Inclusion Sections ───────────────────────────────────────────────────────
export async function getInclusionsByProject(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(inclusionSections).where(eq(inclusionSections.projectId, projectId)).orderBy(inclusionSections.position);
}

export async function createInclusionSection(data: Omit<typeof inclusionSections.$inferInsert, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(inclusionSections).values(data);
}

export async function updateInclusionSection(id: number, data: Partial<typeof inclusionSections.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(inclusionSections).set(data).where(eq(inclusionSections.id, id));
}

export async function deleteInclusionSection(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(inclusionSections).where(eq(inclusionSections.id, id));
}

// ─── Quantities ───────────────────────────────────────────────────────────────
export async function getQuantitiesByProject(projectId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(quantities).where(eq(quantities.projectId, projectId)).limit(1);
  return result[0];
}

export async function upsertQuantities(projectId: number, data: Partial<typeof quantities.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(quantities).values({ projectId, ...data }).onDuplicateKeyUpdate({ set: data });
}

// ─── Upgrade Groups ───────────────────────────────────────────────────────────
export async function getUpgradeGroupsByProject(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(upgradeGroups).where(eq(upgradeGroups.projectId, projectId)).orderBy(upgradeGroups.position);
}

export async function createUpgradeGroup(data: Omit<typeof upgradeGroups.$inferInsert, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(upgradeGroups).values(data);
}

export async function updateUpgradeGroup(id: number, data: Partial<typeof upgradeGroups.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(upgradeGroups).set(data).where(eq(upgradeGroups.id, id));
}

export async function deleteUpgradeGroup(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(upgradeGroups).where(eq(upgradeGroups.id, id));
  await db.delete(upgradeOptions).where(eq(upgradeOptions.groupId, id));
}

// ─── Upgrade Options ──────────────────────────────────────────────────────────
export async function getUpgradeOptionsByProject(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(upgradeOptions).where(eq(upgradeOptions.projectId, projectId)).orderBy(upgradeOptions.position);
}

export async function getUpgradeOptionsByGroup(groupId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(upgradeOptions).where(eq(upgradeOptions.groupId, groupId)).orderBy(upgradeOptions.position);
}

export async function createUpgradeOption(data: Omit<typeof upgradeOptions.$inferInsert, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(upgradeOptions).values(data);
}

export async function updateUpgradeOption(id: number, data: Partial<typeof upgradeOptions.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(upgradeOptions).set(data).where(eq(upgradeOptions.id, id));
}

export async function deleteUpgradeOption(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(upgradeOptions).where(eq(upgradeOptions.id, id));
}

// ─── Upgrade Selections ───────────────────────────────────────────────────────
export async function getUpgradeSelections(projectId: number, clientToken: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(upgradeSelections).where(and(eq(upgradeSelections.projectId, projectId), eq(upgradeSelections.clientToken, clientToken)));
}

export async function upsertUpgradeSelection(projectId: number, clientToken: string, upgradeOptionId: number, selected: boolean) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(upgradeSelections).values({ projectId, clientToken, upgradeOptionId, selected }).onDuplicateKeyUpdate({ set: { selected } });
}

export async function getUpgradeSubmission(projectId: number, clientToken: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(upgradeSubmissions).where(and(eq(upgradeSubmissions.projectId, projectId), eq(upgradeSubmissions.clientToken, clientToken))).limit(1);
  return result[0] ?? null;
}

export async function createUpgradeSubmission(data: {
  projectId: number;
  clientToken: string;
  totalUpgradeCost: string;
  notes?: string;
  signoffName: string;
  signoffSignature: string;
  signoffIp: string;
  signoffUserAgent: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  // Generate unique document reference: BM-YYYY-XXXX
  const year = new Date().getFullYear();
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  const documentRefId = `BM-${year}-${rand}`;
  await db.insert(upgradeSubmissions).values({
    projectId: data.projectId,
    clientToken: data.clientToken,
    totalUpgradeCost: data.totalUpgradeCost,
    notes: data.notes ?? null,
    signoffName: data.signoffName,
    signoffSignature: data.signoffSignature,
    signedOffAt: new Date(),
    signoffIp: data.signoffIp,
    signoffUserAgent: data.signoffUserAgent,
    documentRefId,
  });
  return { documentRefId };
}

export async function getAllUpgradeSubmissions(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(upgradeSubmissions).where(eq(upgradeSubmissions.projectId, projectId)).orderBy(desc(upgradeSubmissions.submittedAt));
}

// ─── Client Files ─────────────────────────────────────────────────────────────
export async function getClientFilesByProject(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(clientFiles).where(eq(clientFiles.projectId, projectId)).orderBy(desc(clientFiles.uploadedAt));
}

export async function createClientFile(data: Omit<typeof clientFiles.$inferInsert, "id" | "uploadedAt">) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(clientFiles).values(data);
}

// ─── Change Requests ──────────────────────────────────────────────────────────
export async function getAllChangeRequests() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(changeRequests).orderBy(desc(changeRequests.createdAt));
}

export async function getChangeRequestsByProject(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(changeRequests).where(eq(changeRequests.projectId, projectId)).orderBy(desc(changeRequests.createdAt));
}

export async function createChangeRequest(data: Omit<typeof changeRequests.$inferInsert, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(changeRequests).values(data);
}

export async function updateChangeRequestStatus(id: number, status: "pending" | "reviewed" | "actioned", adminNotes?: string) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(changeRequests).set({ status, adminNotes }).where(eq(changeRequests.id, id));
}

// ─── Exclusions ──────────────────────────────────────────────────────────────
export async function getExclusionsByProject(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(exclusions).where(eq(exclusions.projectId, projectId)).orderBy(exclusions.position);
}
export async function createExclusion(data: { projectId: number; description: string; position: number }) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(exclusions).values(data);
}
export async function updateExclusion(id: number, data: { description?: string; position?: number }) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(exclusions).set(data).where(eq(exclusions.id, id));
}
export async function deleteExclusion(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(exclusions).where(eq(exclusions.id, id));
}

// ─── Provisional Sums ─────────────────────────────────────────────────────────
export async function getProvisionalSumsByProject(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(provisionalSums).where(eq(provisionalSums.projectId, projectId)).orderBy(provisionalSums.position);
}
export async function createProvisionalSum(data: { projectId: number; description: string; amount?: string | null; notes?: string | null; position: number }) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(provisionalSums).values(data);
}
export async function updateProvisionalSum(id: number, data: { description?: string; amount?: string | null; notes?: string | null; position?: number }) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(provisionalSums).set(data).where(eq(provisionalSums.id, id));
}
export async function deleteProvisionalSum(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(provisionalSums).where(eq(provisionalSums.id, id));
}

// ─── PC Items (Prime Cost) ───────────────────────────────────────────────────
export async function getPcItemsByProject(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(pcItems).where(eq(pcItems.projectId, projectId)).orderBy(pcItems.position);
}
export async function createPcItem(data: { projectId: number; description: string; allowance?: string | null; notes?: string | null; position: number }) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(pcItems).values(data);
}
export async function updatePcItem(id: number, data: { description?: string; allowance?: string | null; notes?: string | null; position?: number }) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(pcItems).set(data).where(eq(pcItems.id, id));
}
export async function deletePcItem(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(pcItems).where(eq(pcItems.id, id));
}

// ─── Plan Images ──────────────────────────────────────────────────────────────
export async function getPlanImagesByProject(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(planImages).where(eq(planImages.projectId, projectId)).orderBy(planImages.position);
}
export async function createPlanImage(data: { projectId: number; title?: string | null; imageUrl: string; fileKey?: string | null; position: number }) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(planImages).values(data);
}
export async function deletePlanImage(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(planImages).where(eq(planImages.id, id));
}

// ─── Company Settings ──────────────────────────────────────────────────────────────
export async function getCompanySettings() {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(companySettings).limit(1);
  return rows[0] ?? null;
}
export async function upsertCompanySettings(data: {
  aboutUs?: string | null;
  tagline?: string | null;
  credentials?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  address?: string | null;
  logoUrl?: string | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const existing = await getCompanySettings();
  if (existing) {
    await db.update(companySettings).set(data).where(eq(companySettings.id, existing.id));
  } else {
    await db.insert(companySettings).values(data);
  }
}

// --- Master Packages -----------------------------------------------------------
export async function getAllMasterPackages() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(masterPackages).orderBy(masterPackages.position);
}

export async function getMasterPackageWithItems(packageId: number) {
  const db = await getDb();
  if (!db) return null;
  const [pkg] = await db.select().from(masterPackages).where(eq(masterPackages.id, packageId));
  if (!pkg) return null;
  const items = await db.select().from(masterPackageItems)
    .where(eq(masterPackageItems.packageId, packageId))
    .orderBy(masterPackageItems.section, masterPackageItems.position);
  return { ...pkg, items };
}

export async function applyMasterPackageToProject(projectId: number, packageId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  // Get all items from the master package
  const items = await db.select().from(masterPackageItems)
    .where(eq(masterPackageItems.packageId, packageId))
    .orderBy(masterPackageItems.section, masterPackageItems.position);
  // Group by section using a plain object
  const sectionObj: Record<string, Array<{ item: string; imageUrl: string | null }>> = {};
  for (const row of items) {
    if (!sectionObj[row.section]) sectionObj[row.section] = [];
    sectionObj[row.section].push({ item: row.item, imageUrl: row.imageUrl });
  }
  const sections = Object.entries(sectionObj);
  let position = 0;
  for (const [section, sectionItems] of sections) {
    const description = sectionItems.map((i: { item: string; imageUrl: string | null }) => i.item).join("\n");
    const imageUrl = sectionItems.find((i: { item: string; imageUrl: string | null }) => i.imageUrl)?.imageUrl ?? null;
    await db.insert(inclusionSections).values({
      projectId,
      title: section,
      description,
      imageUrl,
      position: position++,
    });
  }
  return { sectionsCreated: sections.length };
}

// ─── Upgrade Pricing Rules (Global — set once, applies to every job) ──────────
export async function getAllPricingRules() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(upgradePricingRules).orderBy(upgradePricingRules.position);
}

export async function updatePricingRule(id: number, data: Partial<typeof upgradePricingRules.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(upgradePricingRules).set(data).where(eq(upgradePricingRules.id, id));
}

// ─── Pricing Engine ───────────────────────────────────────────────────────────
// Maps itemKey → quantities field name so the engine can look up the project qty.
const ITEM_QTY_MAP: Record<string, string | null> = {
  downlights: "downlightsQty",
  power_points: "powerPointsQty",
  switch_plates: "switchPlatesQty",
  data_points: "dataPointsQty",
  pendant_points: "pendantPointsQty",
  exhaust_fans: "exhaustFansQty",
  basin_mixers: "basinMixersQty",
  shower_sets: "showerSetsQty",
  baths: "bathtubsQty",
  toilets: "toiletsQty",
  kitchen_benchtop: "kitchenBenchtopArea",
  kitchen_cabinetry: "kitchenBaseCabinetryLm",
  splashback: "stoneSplashbackArea",
  timber_hybrid_flooring: "timberHybridM2",
  carpet: "carpetM2",
  vanity_stone: "vanityStoneTopQty",
  wardrobe_joinery: "wardrobeLm",
  internal_doors: "internalDoorsQty",
  door_handles: "doorHandlesQty",
  // New items from tier PDFs
  basins: "basinsQty",
  kitchen_sink: null,          // fixed per project (1 kitchen sink)
  kitchen_laundry_mixer: null, // fixed per project
  laundry_sink: null,          // fixed per project
  bathroom_floor_tiles: "floorTileM2",
  bathroom_wall_tiles: "wallTileM2",
  laundry_floor_tiles: null,   // fixed cost
  main_floor_tiles: null,      // fixed cost (covered by timber/hybrid)
  skirting_boards: "skirtingLm",
  architraves: null,           // fixed cost
  wall_lights: null,           // fixed cost (8 lights as per spec)
  // fixed-cost items (unit = "fixed") — qty is always 1
  appliances: null,
  laundry_joinery: null,
  facade_cladding: null,
  insulation: null,
  air_conditioning: null,
  external_render: null,
  render_finish: null,
  face_brick: null,
  smoke_detectors: null,
  home_automation: null,
  sound_insulation: null,
  plasterboard_walls: null,
  plasterboard_ceilings: null,
  cornice: null,
  square_set_windows_doors: null,
  linen_cupboard: null,
  staircase: null,
  balustrade: null,
};

export type PackagePriceResult = {
  startingTier: number;
  tier1Total: number;
  tier2Total: number;
  tier3Total: number;
  lineItems: Array<{
    itemKey: string;
    label: string;
    category: string;
    unit: string;
    qty: number;
    tier2Qty: number | null;
    tier3Qty: number | null;
    tier1Label: string | null;
    tier1ImageUrl: string | null;
    tier2Label: string | null;
    tier2Delta: number;
    tier2ImageUrl: string | null;
    tier2Description: string | null;
    tier3Label: string | null;
    tier3Delta: number;
    tier3ImageUrl: string | null;
    tier3Description: string | null;
  }>;
};

export async function calculatePackagePrices(projectId: number): Promise<PackagePriceResult | null> {
  const db = await getDb();
  if (!db) return null;

  const [project] = await db.select().from(projects).where(eq(projects.id, projectId));
  if (!project) return null;

  const basePrice = parseFloat(project.baseContractPrice ?? "0");
  const startingTier = project.startingTier ?? 1;

  // Get quantities for this project
  const [qty] = await db.select().from(quantities).where(eq(quantities.projectId, projectId));

  // Get all pricing rules
  const rules = await db.select().from(upgradePricingRules).orderBy(upgradePricingRules.position);

  let tier2Delta = 0;
  let tier3Delta = 0;
  const lineItems: PackagePriceResult["lineItems"] = [];

  for (const rule of rules) {
    const qtyFieldName = ITEM_QTY_MAP[rule.itemKey];
    let itemQty = 1; // default for fixed items

    if (qtyFieldName && qty) {
      const rawQty = (qty as Record<string, unknown>)[qtyFieldName];
      itemQty = rawQty != null ? parseFloat(String(rawQty)) || 0 : 0;
    }

    // For electrical items with upgrade quantities set:
    // Tier 2 cost = (tier2Qty - base_qty) * tier2CostPerUnit  (extra units only)
    // Tier 3 cost = tier3Qty * tier3CostPerUnit  (premium hardware, full count)
    // For all other items: cost = itemQty * costPerUnit (unchanged)
    const t2Qty = rule.tier2Qty ?? 0;
    const t3Qty = rule.tier3Qty ?? 0;
    const hasElecQty = rule.category.toLowerCase() === "electrical" && (t2Qty > 0 || t3Qty > 0);

    let t2Cost: number;
    let t3Cost: number;
    if (hasElecQty) {
      // Extra units above base for Tier 2
      const extraT2 = Math.max(0, t2Qty - itemQty);
      t2Cost = parseFloat(rule.tier2CostPerUnit ?? "0") * extraT2;
      // Full premium hardware count for Tier 3
      const t3Count = t3Qty > 0 ? t3Qty : t2Qty;
      t3Cost = parseFloat(rule.tier3CostPerUnit ?? "0") * t3Count;
    } else {
      t2Cost = parseFloat(rule.tier2CostPerUnit ?? "0") * itemQty;
      t3Cost = parseFloat(rule.tier3CostPerUnit ?? "0") * itemQty;
    }

    tier2Delta += t2Cost;
    tier3Delta += t3Cost;

    lineItems.push({
      itemKey: rule.itemKey,
      label: rule.label,
      category: rule.category,
      unit: rule.unit,
      qty: itemQty,
      tier2Qty: t2Qty || null,
      tier3Qty: t3Qty || null,
      tier1Label: rule.tier1Label ?? null,
      tier1ImageUrl: rule.tier1ImageUrl ?? null,
      tier2Label: rule.tier2Label ?? null,
      tier2Delta: t2Cost,
      tier2ImageUrl: rule.tier2ImageUrl ?? null,
      tier2Description: rule.tier2Description ?? null,
      tier3Label: rule.tier3Label ?? null,
      tier3Delta: t3Cost,
      tier3ImageUrl: rule.tier3ImageUrl ?? null,
      tier3Description: rule.tier3Description ?? null,
    });
  }

  return {
    startingTier,
    tier1Total: basePrice,
    tier2Total: basePrice + tier2Delta,
    tier3Total: basePrice + tier3Delta,
    lineItems,
  };
}

// ─── Client Item Selections ───────────────────────────────────────────────────
export async function getClientSelections(projectId: number, clientToken: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(clientItemSelections)
    .where(and(
      eq(clientItemSelections.projectId, projectId),
      eq(clientItemSelections.clientToken, clientToken),
    ));
}

export async function upsertClientSelection(
  projectId: number,
  clientToken: string,
  itemKey: string,
  selectedTier: number,
) {
  const db = await getDb();
  if (!db) return;
  const [existing] = await db.select().from(clientItemSelections)
    .where(and(
      eq(clientItemSelections.projectId, projectId),
      eq(clientItemSelections.clientToken, clientToken),
      eq(clientItemSelections.itemKey, itemKey),
    ));
  if (existing) {
    await db.update(clientItemSelections)
      .set({ selectedTier })
      .where(eq(clientItemSelections.id, existing.id));
  } else {
    await db.insert(clientItemSelections).values({ projectId, clientToken, itemKey, selectedTier });
  }
}

// ─── BOQ Documents ─────────────────────────────────────────────────────────────

export async function createBoqDocument(data: {
  projectId: number;
  fileName: string;
  fileKey: string;
  fileUrl: string;
  mimeType: string;
}) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(boqDocuments).values({
    ...data,
    status: "uploaded",
  });
  return (result as any).insertId as number;
}

export async function getBoqDocumentsByProject(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(boqDocuments).where(eq(boqDocuments.projectId, projectId));
}

export async function getBoqDocument(id: number) {
  const db = await getDb();
  if (!db) return null;
  const [doc] = await db.select().from(boqDocuments).where(eq(boqDocuments.id, id));
  return doc ?? null;
}

export async function updateBoqDocumentStatus(
  id: number,
  status: "uploaded" | "extracting" | "extracted" | "confirmed" | "error",
  extractionError?: string,
) {
  const db = await getDb();
  if (!db) return;
  await db.update(boqDocuments)
    .set({
      status,
      ...(extractionError ? { extractionError } : {}),
      ...(status === "extracted" || status === "confirmed" ? { extractedAt: new Date() } : {}),
    })
    .where(eq(boqDocuments.id, id));
}

export async function saveBoqItems(items: Array<{
  boqDocumentId: number;
  projectId: number;
  category: string;
  description: string;
  unit?: string;
  quantity?: string;
  mappedQuantityField?: string;
  position: number;
}>) {
  const db = await getDb();
  if (!db) return;
  if (items.length === 0) return;
  await db.insert(boqItems).values(items.map(i => ({
    ...i,
    isConfirmed: false,
  })));
}

export async function getBoqItemsByDocument(boqDocumentId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(boqItems)
    .where(eq(boqItems.boqDocumentId, boqDocumentId))
    .orderBy(boqItems.position);
}

export async function getBoqItemsByProject(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(boqItems)
    .where(and(eq(boqItems.projectId, projectId), eq(boqItems.isConfirmed, true)))
    .orderBy(boqItems.category, boqItems.position);
}

export async function updateBoqItem(id: number, data: {
  category?: string;
  description?: string;
  unit?: string;
  quantity?: string;
  isConfirmed?: boolean;
  mappedQuantityField?: string;
}) {
  const db = await getDb();
  if (!db) return;
  await db.update(boqItems).set(data).where(eq(boqItems.id, id));
}

export async function deleteBoqItemsByDocument(boqDocumentId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(boqItems).where(eq(boqItems.boqDocumentId, boqDocumentId));
}

export async function confirmAllBoqItems(boqDocumentId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(boqItems)
    .set({ isConfirmed: true })
    .where(eq(boqItems.boqDocumentId, boqDocumentId));
}

// ─── Terms & Conditions ────────────────────────────────────────────────────────

export async function getTermsAndConditions() {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.select().from(termsAndConditions);
  return row ?? null;
}

export async function upsertTermsAndConditions(content: string) {
  const db = await getDb();
  if (!db) return;
  const [existing] = await db.select().from(termsAndConditions);
  if (existing) {
    await db.update(termsAndConditions).set({ content }).where(eq(termsAndConditions.id, existing.id));
  } else {
    await db.insert(termsAndConditions).values({ content });
  }
}

// ─── Portal T&C Acknowledgements ───────────────────────────────────────────────

export async function hasAcknowledgedTc(projectId: number, clientToken: string) {
  const db = await getDb();
  if (!db) return false;
  const [row] = await db.select().from(portalTcAcknowledgements)
    .where(and(
      eq(portalTcAcknowledgements.projectId, projectId),
      eq(portalTcAcknowledgements.clientToken, clientToken),
    ));
  return !!row;
}

export async function recordTcAcknowledgement(projectId: number, clientToken: string, ipAddress?: string) {
  const db = await getDb();
  if (!db) return;
  await db.insert(portalTcAcknowledgements).values({ projectId, clientToken, ipAddress });
}

// ─── Inclusion Categories ──────────────────────────────────────────────────────
export async function getInclusionCategoriesByProject(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(inclusionCategories)
    .where(eq(inclusionCategories.projectId, projectId))
    .orderBy(inclusionCategories.position);
}

export async function createInclusionCategory(data: Omit<typeof inclusionCategories.$inferInsert, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(inclusionCategories).values(data);
  return (result as any).insertId as number;
}

export async function updateInclusionCategory(id: number, data: Partial<typeof inclusionCategories.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(inclusionCategories).set(data).where(eq(inclusionCategories.id, id));
}

export async function deleteInclusionCategory(id: number) {
  const db = await getDb();
  if (!db) return;
  // Delete all items in this category first
  await db.delete(inclusionItems).where(eq(inclusionItems.categoryId, id));
  await db.delete(inclusionCategories).where(eq(inclusionCategories.id, id));
}

// ─── Inclusion Items ───────────────────────────────────────────────────────────
export async function getInclusionItemsByProject(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(inclusionItems)
    .where(eq(inclusionItems.projectId, projectId))
    .orderBy(inclusionItems.categoryId, inclusionItems.position);
}

export async function getInclusionItemsByCategory(categoryId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(inclusionItems)
    .where(eq(inclusionItems.categoryId, categoryId))
    .orderBy(inclusionItems.position);
}

export async function upsertInclusionItem(data: Omit<typeof inclusionItems.$inferInsert, "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) return null;
  if (data.id) {
    const { id, ...rest } = data;
    await db.update(inclusionItems).set(rest).where(eq(inclusionItems.id, id));
    return id;
  } else {
    const [result] = await db.insert(inclusionItems).values(data);
    return (result as any).insertId as number;
  }
}

export async function deleteInclusionItem(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(inclusionItems).where(eq(inclusionItems.id, id));
}

export async function bulkUpsertInclusionItems(items: Omit<typeof inclusionItems.$inferInsert, "createdAt" | "updatedAt">[]) {
  const db = await getDb();
  if (!db || items.length === 0) return;
  for (const item of items) {
    if (item.id) {
      const { id, ...rest } = item;
      await db.update(inclusionItems).set(rest).where(eq(inclusionItems.id, id));
    } else {
      await db.insert(inclusionItems).values(item);
    }
  }
}

export async function updateInclusionItemQtyByBoqField(projectId: number, boqFieldKey: string, qty: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(inclusionItems)
    .set({ qty: qty.toString() })
    .where(and(
      eq(inclusionItems.projectId, projectId),
      eq(inclusionItems.boqFieldKey, boqFieldKey),
    ));
}

export async function deleteBoqImportedItemsByProject(projectId: number) {
  const db = await getDb();
  if (!db) return;
  // Delete all BOQ-imported items for this project
  const cats = await db.select().from(inclusionCategories).where(eq(inclusionCategories.projectId, projectId));
  for (const cat of cats) {
    await db.delete(inclusionItems).where(
      and(eq(inclusionItems.categoryId, cat.id), eq(inclusionItems.isBoqImported, true))
    );
  }
  // Also delete categories that are now empty and were BOQ-sourced (name ends with BOQ marker)
  // We mark BOQ-sourced categories with isBoqImported flag — need to add that too
}


// ─── Custom Item Requests ─────────────────────────────────────────────────────
export async function createCustomItemRequest(data: {
  projectId: number;
  clientToken: string;
  itemName: string;
  description?: string;
  preferredBrand?: string;
  referenceUrl?: string;
  quantity?: number;
  room?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [result] = await db.insert(customItemRequests).values(data);
  return (result as any).insertId as number;
}

export async function getCustomItemRequestsByProject(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(customItemRequests)
    .where(eq(customItemRequests.projectId, projectId))
    .orderBy(desc(customItemRequests.createdAt));
}

export async function getCustomItemRequestsByToken(projectId: number, clientToken: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(customItemRequests)
    .where(and(
      eq(customItemRequests.projectId, projectId),
      eq(customItemRequests.clientToken, clientToken),
    ))
    .orderBy(desc(customItemRequests.createdAt));
}

export async function updateCustomItemRequest(id: number, data: {
  status?: "submitted" | "under_review" | "priced" | "approved" | "declined";
  adminPrice?: string;
  adminNotes?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(customItemRequests).set({
    ...data,
    ...(data.adminPrice !== undefined || data.adminNotes !== undefined ? { adminRespondedAt: new Date() } : {}),
  }).where(eq(customItemRequests.id, id));
}

export async function getAllCustomItemRequests() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(customItemRequests).orderBy(desc(customItemRequests.createdAt));
}

// ─── Admin Price Response on Submissions ──────────────────────────────────────
export async function respondToSubmission(id: number, adminResponsePrice: string, adminResponseNotes?: string) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(upgradeSubmissions).set({
    adminResponsePrice,
    adminResponseNotes,
    adminRespondedAt: new Date(),
  }).where(eq(upgradeSubmissions.id, id));
}

export async function getSubmissionById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const [sub] = await db.select().from(upgradeSubmissions).where(eq(upgradeSubmissions.id, id));
  return sub ?? null;
}


// ─── Project Messages (Admin-to-Client Chat) ──────────────────────────────────
export async function createProjectMessage(data: { projectId: number; senderType: "admin" | "client"; senderName: string; message: string }) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [result] = await db.insert(projectMessages).values(data);
  return { id: result.insertId };
}

export async function getProjectMessages(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(projectMessages)
    .where(eq(projectMessages.projectId, projectId))
    .orderBy(projectMessages.createdAt);
}

// ─── Inclusion Item Image Update ──────────────────────────────────────────────
export async function updateInclusionItemImage(id: number, imageUrl: string | null) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(inclusionItems).set({ imageUrl }).where(eq(inclusionItems.id, id));
}
