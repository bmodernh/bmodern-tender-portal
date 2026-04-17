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
  getAllMasterPackages: vi.fn().mockResolvedValue([
    { id: 1, name: "Built for Excellence", tier: "entry", tagline: "Quality foundations", description: "Entry package", isRecommended: false, position: 1, heroImageUrl: null },
    { id: 2, name: "Tailored Living", tier: "mid", tagline: "Elevated style", description: "Mid package", isRecommended: true, position: 2, heroImageUrl: null },
    { id: 3, name: "Signature Series", tier: "premium", tagline: "Uncompromising luxury", description: "Premium package", isRecommended: false, position: 3, heroImageUrl: null },
  ]),
  getMasterPackageWithItems: vi.fn().mockResolvedValue({ id: 1, name: "Built for Excellence", items: [] }),
  applyMasterPackageToProject: vi.fn().mockResolvedValue({ sectionsCreated: 5, itemsCreated: 30 }),
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
  seedProjectPricingOverrides: vi.fn().mockResolvedValue({ seeded: true, count: 19, added: 19, updated: 0, removed: 0 }),
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
describe("adminAuth", () => {
  it("returns admin payload for me when session cookie is valid", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.adminAuth.me();
    expect(result).toMatchObject({ adminId: 1, username: "bmodern", role: "admin" });
  });

  it("returns null for me when no session cookie", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.adminAuth.me();
    expect(result).toBeNull();
  });

  it("clears cookie on logout", async () => {
    const ctx = makeAdminCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.adminAuth.logout();
    expect(result).toEqual({ success: true });
    expect((ctx.res.clearCookie as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith(
      "bm_admin_session",
      expect.objectContaining({ maxAge: -1 })
    );
  });
});

describe("projects", () => {
  it("lists projects when admin is authenticated", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.projects.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("throws UNAUTHORIZED when listing projects without admin session", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    await expect(caller.projects.list()).rejects.toThrow();
  });
});

describe("portal", () => {
  const getClientTokenRecord = vi.mocked(db.getClientTokenRecord);
  const getProjectById = vi.mocked(db.getProjectById);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws NOT_FOUND when token is invalid", async () => {
    getClientTokenRecord.mockResolvedValue(null);
    const caller = appRouter.createCaller(makePublicCtx());
    await expect(caller.portal.getProject({ token: "invalid-token" })).rejects.toThrow();
  });

  it("returns project data for draft status (draft preview allowed with banner)", async () => {
    getClientTokenRecord.mockResolvedValue({
      id: 1,
      projectId: 1,
      token: "valid-token",
      expiresAt: null,
      lastAccessedAt: null,
      createdAt: new Date(),
    });
    getProjectById.mockResolvedValue({
      id: 1,
      clientName: "Test Client",
      projectAddress: "123 Test St",
      proposalNumber: "P001",
      status: "draft",
      heroImageUrl: null,
      baseContractPrice: "500000",
      tenderExpiryDate: null,
      portalLockedAt: null,
      projectType: null,
      buildType: null,
      notes: null,
    });
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.portal.getProject({ token: "valid-token" });
    expect(result.clientName).toBe("Test Client");
    expect(result.status).toBe("draft");
  });

  it("returns project data when token is valid and project is presented", async () => {
    getClientTokenRecord.mockResolvedValue({
      id: 1,
      projectId: 1,
      token: "valid-token",
      expiresAt: null,
      lastAccessedAt: null,
      createdAt: new Date(),
    });
    getProjectById.mockResolvedValue({
      id: 1,
      clientName: "Test Client",
      projectAddress: "123 Test St",
      proposalNumber: "P001",
      status: "presented",
      heroImageUrl: null,
      baseContractPrice: "500000",
      tenderExpiryDate: null,
      portalLockedAt: null,
      projectType: "Residential",
      buildType: "New Build",
      notes: null,
    });
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.portal.getProject({ token: "valid-token" });
    expect(result.clientName).toBe("Test Client");
    expect(result.proposalNumber).toBe("P001");
    // notes field is included but clientEmail should not be exposed
    expect((result as any).clientEmail).toBeUndefined();
  });
});

describe("inclusions", () => {
  it("lists inclusions for a project when admin is authenticated", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.inclusions.list({ projectId: 1 });
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("upgrades", () => {
  it("lists upgrade groups for a project when admin is authenticated", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.upgrades.listGroups({ projectId: 1 });
    expect(Array.isArray(result)).toBe(true);
  });

  it("lists upgrade options for a project when admin is authenticated", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.upgrades.listOptions({ projectId: 1 });
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("inbox", () => {
  it("lists all change requests when admin is authenticated", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.inbox.listAll();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("packages", () => {
  it("lists all master packages when admin is authenticated", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.packages.list();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(3);
    expect(result[1].isRecommended).toBe(true); // Tailored Living is recommended
  });

  it("throws UNAUTHORIZED when listing packages without admin session", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    await expect(caller.packages.list()).rejects.toThrow();
  });

  it("applies a package to a project when admin is authenticated", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.packages.applyPackage({ projectId: 1, packageId: 1 });
    expect(result).toMatchObject({ sectionsCreated: 5, itemsCreated: 30 });
  });
});

describe("portal package selection", () => {
  beforeEach(() => {
    (db.getClientTokenRecord as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 1, projectId: 42, token: "valid-token", expiresAt: null, lastAccessedAt: null,
    });
    (db.getProjectById as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 42, clientName: "Test Client", projectAddress: "123 Test St",
      proposalNumber: "P-001", projectType: "Residential", buildType: "New Build",
      baseContractPrice: "500000", status: "presented", heroImageUrl: null,
      tenderExpiryDate: null, portalLockedAt: null, notes: null, selectedPackageId: null,
    });
  });

  it("returns packages for a valid portal token", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.portal.getPackages({ token: "valid-token" });
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(3);
  });

  it("saves selectedPackageId when client selects a package", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.portal.selectPackage({ token: "valid-token", packageId: 2 });
    expect(result).toEqual({ success: true });
    expect((db.updateProject as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith(42, { selectedPackageId: 2 });
  });

  it("returns selectedPackageId in getProject response", async () => {
    (db.getProjectById as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 42, clientName: "Test Client", projectAddress: "123 Test St",
      proposalNumber: "P-001", projectType: "Residential", buildType: "New Build",
      baseContractPrice: "500000", status: "presented", heroImageUrl: null,
      tenderExpiryDate: null, portalLockedAt: null, notes: null, selectedPackageId: 2,
    });
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.portal.getProject({ token: "valid-token" });
    expect((result as any).selectedPackageId).toBe(2);
  });
});
