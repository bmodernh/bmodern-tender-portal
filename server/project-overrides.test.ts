import { describe, it, expect, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import * as db from "./db";

// ─── Mock DB helpers ──────────────────────────────────────────────────────────
vi.mock("./db", () => ({
  getAdminCredentials: vi.fn(),
  upsertAdminCredentials: vi.fn(),
  getAllProjects: vi.fn().mockResolvedValue([]),
  getProjectById: vi.fn(),
  createProject: vi.fn().mockResolvedValue(undefined),
  updateProject: vi.fn().mockResolvedValue(undefined),
  deleteProject: vi.fn().mockResolvedValue(undefined),
  createClientToken: vi.fn().mockResolvedValue(undefined),
  getClientTokensByProject: vi.fn().mockResolvedValue([]),
  getClientTokenRecord: vi.fn(),
  updateClientTokenLastAccess: vi.fn().mockResolvedValue(undefined),
  getInclusionsByProject: vi.fn().mockResolvedValue([]),
  createInclusionSection: vi.fn().mockResolvedValue(undefined),
  updateInclusionSection: vi.fn().mockResolvedValue(undefined),
  deleteInclusionSection: vi.fn().mockResolvedValue(undefined),
  getQuantitiesByProject: vi.fn().mockResolvedValue(null),
  upsertQuantities: vi.fn().mockResolvedValue(undefined),
  getUpgradeGroupsByProject: vi.fn().mockResolvedValue([]),
  createUpgradeGroup: vi.fn().mockResolvedValue(undefined),
  updateUpgradeGroup: vi.fn().mockResolvedValue(undefined),
  deleteUpgradeGroup: vi.fn().mockResolvedValue(undefined),
  getUpgradeOptionsByProject: vi.fn().mockResolvedValue([]),
  createUpgradeOption: vi.fn().mockResolvedValue(undefined),
  updateUpgradeOption: vi.fn().mockResolvedValue(undefined),
  deleteUpgradeOption: vi.fn().mockResolvedValue(undefined),
  getUpgradeSelections: vi.fn().mockResolvedValue([]),
  upsertUpgradeSelection: vi.fn().mockResolvedValue(undefined),
  getUpgradeSubmission: vi.fn().mockResolvedValue(null),
  createUpgradeSubmission: vi.fn().mockResolvedValue(undefined),
  getAllUpgradeSubmissions: vi.fn().mockResolvedValue([]),
  getAllChangeRequests: vi.fn().mockResolvedValue([]),
  getChangeRequestsByProject: vi.fn().mockResolvedValue([]),
  createChangeRequest: vi.fn().mockResolvedValue(undefined),
  updateChangeRequestStatus: vi.fn().mockResolvedValue(undefined),
  getClientFilesByProject: vi.fn().mockResolvedValue([]),
  createClientFile: vi.fn().mockResolvedValue(undefined),
  getUserByOpenId: vi.fn(),
  upsertUser: vi.fn(),
  getAllMasterPackages: vi.fn().mockResolvedValue([]),
  getMasterPackageWithItems: vi.fn().mockResolvedValue({ id: 1, name: "Test", items: [] }),
  applyMasterPackageToProject: vi.fn().mockResolvedValue({ sectionsCreated: 0, itemsCreated: 0 }),
  getExclusionsByProject: vi.fn().mockResolvedValue([]),
  createExclusion: vi.fn().mockResolvedValue(undefined),
  updateExclusion: vi.fn().mockResolvedValue(undefined),
  deleteExclusion: vi.fn().mockResolvedValue(undefined),
  getProvisionalSumsByProject: vi.fn().mockResolvedValue([]),
  createProvisionalSum: vi.fn().mockResolvedValue(undefined),
  updateProvisionalSum: vi.fn().mockResolvedValue(undefined),
  deleteProvisionalSum: vi.fn().mockResolvedValue(undefined),
  getPlanImagesByProject: vi.fn().mockResolvedValue([]),
  createPlanImage: vi.fn().mockResolvedValue(undefined),
  deletePlanImage: vi.fn().mockResolvedValue(undefined),
  getCompanySettings: vi.fn().mockResolvedValue(null),
  upsertCompanySettings: vi.fn().mockResolvedValue(undefined),
  getAllPricingRules: vi.fn().mockResolvedValue([]),
  createPricingRule: vi.fn().mockResolvedValue(undefined),
  deletePricingRule: vi.fn().mockResolvedValue(undefined),
  updatePricingRule: vi.fn().mockResolvedValue(undefined),
  calculatePackagePrices: vi.fn().mockResolvedValue(null),
  getClientSelections: vi.fn().mockResolvedValue([]),
  upsertClientSelection: vi.fn().mockResolvedValue(undefined),
  getTermsAndConditions: vi.fn().mockResolvedValue(null),
  hasAcknowledgedTc: vi.fn().mockResolvedValue(false),
  recordTcAcknowledgement: vi.fn().mockResolvedValue(undefined),
  createCustomItemRequest: vi.fn().mockResolvedValue(1),
  getCustomItemRequestsByToken: vi.fn().mockResolvedValue([]),
  getCustomItemRequestsByProject: vi.fn().mockResolvedValue([]),
  updateCustomItemRequest: vi.fn().mockResolvedValue(undefined),
  getAllCustomItemRequests: vi.fn().mockResolvedValue([]),
  respondToSubmission: vi.fn().mockResolvedValue(undefined),
  getSubmissionById: vi.fn().mockResolvedValue(null),
  createProjectMessage: vi.fn().mockResolvedValue(undefined),
  getProjectMessages: vi.fn().mockResolvedValue([]),
  updateInclusionItemImage: vi.fn().mockResolvedValue(undefined),
  getBoqDocumentsByProject: vi.fn().mockResolvedValue([]),
  getBoqItemsByDocument: vi.fn().mockResolvedValue([]),
  updateBoqItem: vi.fn().mockResolvedValue(undefined),
  getUpgradeOptionsByGroup: vi.fn().mockResolvedValue([]),
  getPcItemsByProject: vi.fn().mockResolvedValue([]),
  createPcItem: vi.fn().mockResolvedValue(undefined),
  updatePcItem: vi.fn().mockResolvedValue(undefined),
  deletePcItem: vi.fn().mockResolvedValue(undefined),
  // Project pricing overrides
  getProjectPricingOverrides: vi.fn().mockResolvedValue([]),
  upsertProjectPricingOverride: vi.fn().mockResolvedValue(1),
  deleteProjectPricingOverride: vi.fn().mockResolvedValue(undefined),
  toggleProjectPricingOverride: vi.fn().mockResolvedValue(undefined),
  toggleCategoryOverrides: vi.fn().mockResolvedValue(undefined),
  seedProjectPricingOverrides: vi.fn().mockResolvedValue({ seeded: true }),
  // Inclusion categories & items
  getInclusionCategoriesByProject: vi.fn().mockResolvedValue([]),
  createInclusionCategory: vi.fn().mockResolvedValue(undefined),
  updateInclusionCategory: vi.fn().mockResolvedValue(undefined),
  deleteInclusionCategory: vi.fn().mockResolvedValue(undefined),
  getInclusionItemsByProject: vi.fn().mockResolvedValue([]),
  getInclusionItemsByCategory: vi.fn().mockResolvedValue([]),
  upsertInclusionItem: vi.fn().mockResolvedValue(undefined),
  deleteInclusionItem: vi.fn().mockResolvedValue(undefined),
  bulkUpsertInclusionItems: vi.fn().mockResolvedValue(undefined),
  updateInclusionItemQtyByBoqField: vi.fn().mockResolvedValue(undefined),
  deleteBoqImportedItemsByProject: vi.fn().mockResolvedValue(undefined),
  // BOQ
  createBoqDocument: vi.fn().mockResolvedValue(undefined),
  getBoqDocument: vi.fn().mockResolvedValue(null),
  updateBoqDocumentStatus: vi.fn().mockResolvedValue(undefined),
  getBoqItemsByProject: vi.fn().mockResolvedValue([]),
  deleteBoqItemsByDocument: vi.fn().mockResolvedValue(undefined),
  confirmAllBoqItems: vi.fn().mockResolvedValue(undefined),
  saveBoqItems: vi.fn().mockResolvedValue(undefined),
  // T&C
  upsertTermsAndConditions: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("./email", () => ({
  notifyUpgradeSubmission: vi.fn().mockResolvedValue(undefined),
  notifyFileUpload: vi.fn().mockResolvedValue(undefined),
  notifyChangeRequest: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({ url: "https://cdn.example.com/test.jpg", key: "test.jpg" }),
}));

vi.mock("./_core/jwt", () => ({
  signJwt: vi.fn().mockResolvedValue("mock-jwt-token"),
  verifyJwt: vi.fn().mockResolvedValue({ adminId: 1, username: "bmodern", role: "admin" }),
}));

// ─── Context helpers ──────────────────────────────────────────────────────────
function makeAdminCtx(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
      cookies: { bm_admin_session: "mock-jwt-token" },
    } as TrpcContext["req"],
    res: {
      cookie: vi.fn(),
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function makePublicCtx(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
      cookies: {},
    } as TrpcContext["req"],
    res: {
      cookie: vi.fn(),
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────
describe("projectOverrides", () => {
  it("lists project pricing overrides for an admin", async () => {
    const mockOverrides = [
      { id: 1, projectId: 1, itemKey: "downlights", category: "Electrical", label: "Downlights", enabled: true, position: 1 },
      { id: 2, projectId: 1, itemKey: "power_points", category: "Electrical", label: "Power Points", enabled: true, position: 2 },
      { id: 3, projectId: 1, itemKey: "kitchen_cabinetry", category: "Joinery", label: "Kitchen Cabinetry", enabled: false, position: 10 },
    ];
    vi.mocked(db.getProjectPricingOverrides).mockResolvedValueOnce(mockOverrides as any);
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.projectOverrides.list({ projectId: 1 });
    expect(result).toHaveLength(3);
    expect(db.getProjectPricingOverrides).toHaveBeenCalledWith(1);
  });

  it("seeds overrides from library for a project (fresh seed)", async () => {
    vi.mocked(db.seedProjectPricingOverrides).mockResolvedValueOnce({ seeded: true, count: 31, added: 31, updated: 0, removed: 0 });
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.projectOverrides.seed({ projectId: 1 });
    expect(result).toEqual({ seeded: true, count: 31, added: 31, updated: 0, removed: 0 });
    expect(db.seedProjectPricingOverrides).toHaveBeenCalledWith(1);
  });

  it("re-syncs existing overrides from library (updates + adds + removes)", async () => {
    vi.mocked(db.seedProjectPricingOverrides).mockResolvedValueOnce({ seeded: true, count: 30, added: 2, updated: 27, removed: 1 });
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.projectOverrides.seed({ projectId: 1 });
    expect(result.seeded).toBe(true);
    expect(result.updated).toBe(27);
    expect(result.added).toBe(2);
    expect(result.removed).toBe(1);
  });

  it("re-sync preserves per-project data (calls seed, which preserves baseQty and enabled)", async () => {
    vi.mocked(db.seedProjectPricingOverrides).mockResolvedValueOnce({ seeded: true, count: 31, added: 0, updated: 31, removed: 0 });
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.projectOverrides.seed({ projectId: 5 });
    expect(result.added).toBe(0);
    expect(result.updated).toBe(31);
    expect(db.seedProjectPricingOverrides).toHaveBeenCalledWith(5);
  });

  it("upserts a single override", async () => {
    vi.mocked(db.upsertProjectPricingOverride).mockResolvedValueOnce(42);
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.projectOverrides.upsert({
      projectId: 1,
      itemKey: "downlights",
      label: "Downlights",
      category: "Electrical",
      unit: "each",
      tier1Label: "Standard LED",
      tier2CostPerUnit: "50",
      baseQty: "30",
      enabled: true,
    });
    expect(result).toEqual({ id: 42 });
    expect(db.upsertProjectPricingOverride).toHaveBeenCalledWith(expect.objectContaining({
      projectId: 1,
      itemKey: "downlights",
      baseQty: "30",
    }));
  });

  it("deletes an override", async () => {
    vi.mocked(db.deleteProjectPricingOverride).mockResolvedValueOnce(undefined);
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.projectOverrides.delete({ id: 5 });
    expect(result).toEqual({ success: true });
    expect(db.deleteProjectPricingOverride).toHaveBeenCalledWith(5);
  });

  it("toggles a single override enabled/disabled", async () => {
    vi.mocked(db.toggleProjectPricingOverride).mockResolvedValueOnce(undefined);
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.projectOverrides.toggle({ id: 3, enabled: false });
    expect(result).toEqual({ success: true });
    expect(db.toggleProjectPricingOverride).toHaveBeenCalledWith(3, false);
  });

  it("toggles all items in a category enabled", async () => {
    vi.mocked(db.toggleCategoryOverrides).mockResolvedValueOnce(undefined);
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.projectOverrides.toggleCategory({
      projectId: 1,
      category: "Electrical",
      enabled: true,
    });
    expect(result).toEqual({ success: true });
    expect(db.toggleCategoryOverrides).toHaveBeenCalledWith(1, "Electrical", true);
  });

  it("toggles all items in a category disabled", async () => {
    vi.mocked(db.toggleCategoryOverrides).mockResolvedValueOnce(undefined);
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.projectOverrides.toggleCategory({
      projectId: 1,
      category: "Joinery",
      enabled: false,
    });
    expect(result).toEqual({ success: true });
    expect(db.toggleCategoryOverrides).toHaveBeenCalledWith(1, "Joinery", false);
  });

  it("rejects toggleCategory when not admin", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    await expect(
      caller.projectOverrides.toggleCategory({ projectId: 1, category: "Electrical", enabled: true })
    ).rejects.toThrow();
  });

  it("rejects list when not admin", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    await expect(
      caller.projectOverrides.list({ projectId: 1 })
    ).rejects.toThrow();
  });

  it("rejects seed when not admin", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    await expect(
      caller.projectOverrides.seed({ projectId: 1 })
    ).rejects.toThrow();
  });
});
