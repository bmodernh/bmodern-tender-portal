import { describe, it, expect, vi, beforeEach } from "vitest";
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
  // Inclusion master
  getInclusionCategoriesByProject: vi.fn().mockResolvedValue([]),
  createInclusionCategory: vi.fn(),
  updateInclusionCategory: vi.fn().mockResolvedValue(undefined),
  deleteInclusionCategory: vi.fn().mockResolvedValue(undefined),
  getInclusionItemsByProject: vi.fn().mockResolvedValue([]),
  getInclusionItemsByCategory: vi.fn().mockResolvedValue([]),
  upsertInclusionItem: vi.fn().mockResolvedValue(1),
  deleteInclusionItem: vi.fn().mockResolvedValue(undefined),
  bulkUpsertInclusionItems: vi.fn().mockResolvedValue(undefined),
  updateInclusionItemQtyByBoqField: vi.fn().mockResolvedValue(undefined),
  // Pricing rules
  getAllPricingRules: vi.fn().mockResolvedValue([]),
  upsertPricingRule: vi.fn().mockResolvedValue(undefined),
  deletePricingRule: vi.fn().mockResolvedValue(undefined),
  // BOQ
  getBoqDocumentsByProject: vi.fn().mockResolvedValue([]),
  getBoqDocument: vi.fn().mockResolvedValue(null),
  createBoqDocument: vi.fn().mockResolvedValue(1),
  updateBoqDocument: vi.fn().mockResolvedValue(undefined),
  getBoqItemsByDocument: vi.fn().mockResolvedValue([]),
  getBoqItemsByProject: vi.fn().mockResolvedValue([]),
  createBoqItem: vi.fn().mockResolvedValue(1),
  updateBoqItem: vi.fn().mockResolvedValue(undefined),
  deleteBoqItem: vi.fn().mockResolvedValue(undefined),
  // Terms
  getTermsAndConditions: vi.fn().mockResolvedValue(null),
  upsertTermsAndConditions: vi.fn().mockResolvedValue(undefined),
  getPortalTcAcknowledgement: vi.fn().mockResolvedValue(null),
  createPortalTcAcknowledgement: vi.fn().mockResolvedValue(undefined),
  // Client selections
  getClientSelections: vi.fn().mockResolvedValue([]),
  upsertClientItemSelection: vi.fn().mockResolvedValue(undefined),
  // Custom items
  getCustomItemRequestsByProject: vi.fn().mockResolvedValue([]),
  createCustomItemRequest: vi.fn().mockResolvedValue(1),
  updateCustomItemRequest: vi.fn().mockResolvedValue(undefined),
  // Chat
  getProjectMessages: vi.fn().mockResolvedValue([]),
  createProjectMessage: vi.fn().mockResolvedValue(undefined),
  // Plus options
  getPlusOptionsByProject: vi.fn().mockResolvedValue([]),
  createPlusOption: vi.fn().mockResolvedValue(1),
  updatePlusOption: vi.fn().mockResolvedValue(undefined),
  deletePlusOption: vi.fn().mockResolvedValue(undefined),
  getPlusSelections: vi.fn().mockResolvedValue([]),
  upsertPlusSelection: vi.fn().mockResolvedValue(undefined),
  // Upgrade submission
  updateUpgradeSubmission: vi.fn().mockResolvedValue(undefined),
  getBaseInclusions: vi.fn().mockResolvedValue({ categories: [], items: [] }),
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

vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({ choices: [{ message: { content: "[]" } }] }),
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

describe("seedDefaults with pricing rules", () => {
  const getInclusionCategoriesByProject = vi.mocked(db.getInclusionCategoriesByProject);
  const getInclusionItemsByProject = vi.mocked(db.getInclusionItemsByProject);
  const getProjectById = vi.mocked(db.getProjectById);
  const getAllPricingRules = vi.mocked(db.getAllPricingRules);
  const createInclusionCategory = vi.mocked(db.createInclusionCategory);
  const upsertInclusionItem = vi.mocked(db.upsertInclusionItem);

  beforeEach(() => {
    vi.clearAllMocks();
    createInclusionCategory.mockResolvedValue(100);
    getInclusionItemsByProject.mockResolvedValue([]);
  });

  it("skips seeding when non-BOQ items already exist", async () => {
    getInclusionCategoriesByProject.mockResolvedValue([{ id: 1, projectId: 1, name: "Existing", position: 0, imageUrl: null, createdAt: new Date(), updatedAt: new Date() }]);
    getInclusionItemsByProject.mockResolvedValue([{ id: 1, categoryId: 1, projectId: 1, name: "Downlights", qty: null, unit: null, description: null, specLevel: null, upgradeEligible: false, included: true, boqFieldKey: null, position: 0, imageUrl: null, rate: null, amount: null, isBoqImported: false, createdAt: new Date(), updatedAt: new Date() }] as any);
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.inclusionMaster.seedDefaults({ projectId: 1 });
    expect(result).toEqual({ skipped: true, message: "Standard inclusions already seeded. Delete them first to re-seed." });
    expect(createInclusionCategory).not.toHaveBeenCalled();
  });

  it("seeds categories from pricing rules using tier 1 labels when startingTier=1", async () => {
    getInclusionCategoriesByProject.mockResolvedValue([]);
    getProjectById.mockResolvedValue({
      id: 1, clientName: "Test", projectAddress: "123 St", proposalNumber: "P001",
      status: "draft", startingTier: 1, createdAt: new Date(), updatedAt: new Date(),
    } as any);
    getAllPricingRules.mockResolvedValue([
      {
        id: 1, itemKey: "downlights", label: "Downlights", category: "Electrical",
        unit: "each", position: 0,
        tier1Label: "25 LED downlights", tier1ImageUrl: null,
        tier2Label: "40 LED downlights", tier2CostPerUnit: "50", tier2ImageUrl: null, tier2Description: null, tier2Qty: 40,
        tier3Label: "50 LED smart downlights", tier3CostPerUnit: "100", tier3ImageUrl: null, tier3Description: null, tier3Qty: 50,
        createdAt: new Date(), updatedAt: new Date(),
      },
    ] as any);

    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.inclusionMaster.seedDefaults({ projectId: 1 });
    expect(result).toEqual({ seeded: true });
    expect(createInclusionCategory).toHaveBeenCalled();
    // Should use tier1Label as description
    expect(upsertInclusionItem).toHaveBeenCalledWith(
      expect.objectContaining({
        description: "25 LED downlights",
        name: "Downlights",
        upgradeEligible: true,
      })
    );
  });

  it("uses tier 2 labels when startingTier=2", async () => {
    getInclusionCategoriesByProject.mockResolvedValue([]);
    getProjectById.mockResolvedValue({
      id: 1, clientName: "Test", projectAddress: "123 St", proposalNumber: "P001",
      status: "draft", startingTier: 2, createdAt: new Date(), updatedAt: new Date(),
    } as any);
    getAllPricingRules.mockResolvedValue([
      {
        id: 1, itemKey: "downlights", label: "Downlights", category: "Electrical",
        unit: "each", position: 0,
        tier1Label: "25 LED downlights", tier1ImageUrl: null,
        tier2Label: "40 LED downlights", tier2CostPerUnit: "50", tier2ImageUrl: null, tier2Description: null, tier2Qty: 40,
        tier3Label: "50 LED smart downlights", tier3CostPerUnit: "100", tier3ImageUrl: null, tier3Description: null, tier3Qty: 50,
        createdAt: new Date(), updatedAt: new Date(),
      },
    ] as any);

    const caller = appRouter.createCaller(makePublicCtx());
    await caller.inclusionMaster.seedDefaults({ projectId: 1 });
    expect(upsertInclusionItem).toHaveBeenCalledWith(
      expect.objectContaining({
        description: "40 LED downlights",
      })
    );
  });

  it("uses tier 3 labels when startingTier=3", async () => {
    getInclusionCategoriesByProject.mockResolvedValue([]);
    getProjectById.mockResolvedValue({
      id: 1, clientName: "Test", projectAddress: "123 St", proposalNumber: "P001",
      status: "draft", startingTier: 3, createdAt: new Date(), updatedAt: new Date(),
    } as any);
    getAllPricingRules.mockResolvedValue([
      {
        id: 1, itemKey: "downlights", label: "Downlights", category: "Electrical",
        unit: "each", position: 0,
        tier1Label: "25 LED downlights", tier1ImageUrl: null,
        tier2Label: "40 LED downlights", tier2CostPerUnit: "50", tier2ImageUrl: null, tier2Description: null, tier2Qty: 40,
        tier3Label: "50 LED smart downlights", tier3CostPerUnit: "100", tier3ImageUrl: null, tier3Description: null, tier3Qty: 50,
        createdAt: new Date(), updatedAt: new Date(),
      },
    ] as any);

    const caller = appRouter.createCaller(makePublicCtx());
    await caller.inclusionMaster.seedDefaults({ projectId: 1 });
    expect(upsertInclusionItem).toHaveBeenCalledWith(
      expect.objectContaining({
        description: "50 LED smart downlights",
      })
    );
  });

  it("creates Preliminaries category even without pricing rules", async () => {
    getInclusionCategoriesByProject.mockResolvedValue([]);
    getProjectById.mockResolvedValue({
      id: 1, clientName: "Test", projectAddress: "123 St", proposalNumber: "P001",
      status: "draft", startingTier: 1, createdAt: new Date(), updatedAt: new Date(),
    } as any);
    getAllPricingRules.mockResolvedValue([]);

    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.inclusionMaster.seedDefaults({ projectId: 1 });
    expect(result).toEqual({ seeded: true });
    // Should create at least Preliminaries
    expect(createInclusionCategory).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Preliminaries" })
    );
  });
});

describe("project milestones", () => {
  const getProjectById = vi.mocked(db.getProjectById);
  const updateProject = vi.mocked(db.updateProject);
  const getAllUpgradeSubmissions = vi.mocked(db.getAllUpgradeSubmissions);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates milestone dates when admin sets them", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    await caller.projects.updateMilestones({
      projectId: 1,
      constructionStartedAt: "2026-03-15",
    });
    expect(updateProject).toHaveBeenCalledWith(1, expect.objectContaining({
      constructionStartedAt: expect.any(Date),
    }));
  });

  it("clears milestone date when set to null", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    await caller.projects.updateMilestones({
      projectId: 1,
      constructionStartedAt: null,
    });
    expect(updateProject).toHaveBeenCalledWith(1, expect.objectContaining({
      constructionStartedAt: null,
    }));
  });

  it("returns timeline data for a project", async () => {
    getProjectById.mockResolvedValue({
      id: 1, clientName: "Test", projectAddress: "123 St", proposalNumber: "P001",
      status: "draft", startingTier: 1,
      createdAt: new Date("2026-01-01"),
      updatedAt: new Date(),
      signedContractUploadedAt: new Date("2026-02-15"),
      constructionStartedAt: new Date("2026-03-01"),
      framingCompletedAt: null,
      lockupCompletedAt: null,
      fixoutCompletedAt: null,
      completedAt: null,
      handoverAt: null,
    } as any);
    getAllUpgradeSubmissions.mockResolvedValue([
      { id: 1, signedOffAt: new Date("2026-02-01") },
    ] as any);

    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.projects.getTimeline({ projectId: 1 });
    expect(result).not.toBeNull();
    expect(result!.portalOpened).toEqual(new Date("2026-01-01"));
    expect(result!.tenderSigned).toEqual(new Date("2026-02-01"));
    expect(result!.contractUploaded).toEqual(new Date("2026-02-15"));
    expect(result!.constructionStarted).toEqual(new Date("2026-03-01"));
    expect(result!.framingCompleted).toBeNull();
    expect(result!.completed).toBeNull();
    expect(result!.handover).toBeNull();
  });

  it("returns null when project not found", async () => {
    getProjectById.mockResolvedValue(undefined);
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.projects.getTimeline({ projectId: 999 });
    expect(result).toBeNull();
  });

  it("portal getTimeline requires valid token", async () => {
    const getClientTokenRecord = vi.mocked(db.getClientTokenRecord);
    getClientTokenRecord.mockResolvedValue(null);
    const caller = appRouter.createCaller(makePublicCtx());
    await expect(caller.portal.getTimeline({ token: "invalid" })).rejects.toThrow();
  });

  it("portal getTimeline returns timeline for valid token", async () => {
    const getClientTokenRecord = vi.mocked(db.getClientTokenRecord);
    getClientTokenRecord.mockResolvedValue({
      id: 1, projectId: 1, token: "valid-token",
      expiresAt: null, lastAccessedAt: null, createdAt: new Date(),
    });
    getProjectById.mockResolvedValue({
      id: 1, clientName: "Test", projectAddress: "123 St", proposalNumber: "P001",
      status: "presented", startingTier: 1,
      createdAt: new Date("2026-01-01"),
      updatedAt: new Date(),
      signedContractUploadedAt: null,
      constructionStartedAt: null,
      framingCompletedAt: null,
      lockupCompletedAt: null,
      fixoutCompletedAt: null,
      completedAt: null,
      handoverAt: null,
    } as any);
    getAllUpgradeSubmissions.mockResolvedValue([]);

    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.portal.getTimeline({ token: "valid-token" });
    expect(result).not.toBeNull();
    expect(result!.portalOpened).toEqual(new Date("2026-01-01"));
    expect(result!.tenderSigned).toBeNull();
    expect(result!.constructionStarted).toBeNull();
  });
});
