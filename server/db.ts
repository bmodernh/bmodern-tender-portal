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
  planImages,
  projects,
  provisionalSums,
  quantities,
  upgradeGroups,
  upgradeOptions,
  upgradeSelections,
  upgradeSubmissions,
  users,
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
  if (!db) return undefined;
  const result = await db.select().from(upgradeSubmissions).where(and(eq(upgradeSubmissions.projectId, projectId), eq(upgradeSubmissions.clientToken, clientToken))).limit(1);
  return result[0];
}

export async function createUpgradeSubmission(projectId: number, clientToken: string, totalUpgradeCost: string, notes?: string) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(upgradeSubmissions).values({ projectId, clientToken, totalUpgradeCost, notes });
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
