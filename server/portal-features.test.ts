import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./db", () => ({
  getSiteUpdatesByProject: vi.fn(),
  createSiteUpdate: vi.fn(),
  addSiteUpdateComment: vi.fn(),
  getApprovalsByProject: vi.fn(),
  createApprovalRequest: vi.fn(),
  respondToApprovalRequest: vi.fn(),
  getVariationsByProject: vi.fn(),
  getVariationById: vi.fn(),
  createVariation: vi.fn(),
  updateVariationStatus: vi.fn(),
  getDocumentsByProject: vi.fn(),
  createProjectDocument: vi.fn(),
  signDocument: vi.fn(),
  deleteProjectDocument: vi.fn(),
  getMeetingMinutesByProject: vi.fn(),
  getMeetingMinutesById: vi.fn(),
  createMeetingMinutes: vi.fn(),
  updateMeetingMinutes: vi.fn(),
  signMeetingMinutes: vi.fn(),
  getAdminByUsername: vi.fn(),
  getProjects: vi.fn(),
  getProjectById: vi.fn(),
  createProject: vi.fn(),
  updateProject: vi.fn(),
  deleteProject: vi.fn(),
  getInclusionSections: vi.fn(),
  createInclusionSection: vi.fn(),
  updateInclusionSection: vi.fn(),
  deleteInclusionSection: vi.fn(),
  createInclusionOption: vi.fn(),
  updateInclusionOption: vi.fn(),
  deleteInclusionOption: vi.fn(),
  reorderInclusionSections: vi.fn(),
  reorderInclusionOptions: vi.fn(),
  getQuantitySchedule: vi.fn(),
  upsertQuantityRow: vi.fn(),
  deleteQuantityRow: vi.fn(),
  getUpgradeGroups: vi.fn(),
  createUpgradeGroup: vi.fn(),
  updateUpgradeGroup: vi.fn(),
  deleteUpgradeGroup: vi.fn(),
  createUpgradeOption: vi.fn(),
  updateUpgradeOption: vi.fn(),
  deleteUpgradeOption: vi.fn(),
  reorderUpgradeGroups: vi.fn(),
  reorderUpgradeOptions: vi.fn(),
  createUpgradeSubmission: vi.fn(),
  getUpgradeSubmissions: vi.fn(),
  createClientToken: vi.fn(),
  getClientTokens: vi.fn(),
  getProjectByToken: vi.fn(),
  lockPortal: vi.fn(),
  createClientFile: vi.fn(),
  getClientFiles: vi.fn(),
  createChangeRequest: vi.fn(),
  getChangeRequests: vi.fn(),
  respondToChangeRequest: vi.fn(),
  getExclusions: vi.fn(),
  createExclusion: vi.fn(),
  updateExclusion: vi.fn(),
  deleteExclusion: vi.fn(),
  reorderExclusions: vi.fn(),
  getPcItems: vi.fn(),
  createPcItem: vi.fn(),
  updatePcItem: vi.fn(),
  deletePcItem: vi.fn(),
  reorderPcItems: vi.fn(),
  getProvisionalSums: vi.fn(),
  createProvisionalSum: vi.fn(),
  updateProvisionalSum: vi.fn(),
  deleteProvisionalSum: vi.fn(),
  reorderProvisionalSums: vi.fn(),
  getPlanImages: vi.fn(),
  createPlanImage: vi.fn(),
  updatePlanImage: vi.fn(),
  deletePlanImage: vi.fn(),
  reorderPlanImages: vi.fn(),
  getCompanySettings: vi.fn(),
  upsertCompanySettings: vi.fn(),
  getPackages: vi.fn(),
  createPackage: vi.fn(),
  updatePackage: vi.fn(),
  deletePackage: vi.fn(),
  reorderPackages: vi.fn(),
  getPricingRules: vi.fn(),
  createPricingRule: vi.fn(),
  updatePricingRule: vi.fn(),
  deletePricingRule: vi.fn(),
  getProjectPricingOverrides: vi.fn(),
  upsertProjectPricingOverride: vi.fn(),
  deleteProjectPricingOverride: vi.fn(),
  seedProjectPricingOverrides: vi.fn(),
  toggleCategoryOverrides: vi.fn(),
  getBoqDocuments: vi.fn(),
  createBoqDocument: vi.fn(),
  getBoqItemsByDocument: vi.fn(),
  upsertBoqItem: vi.fn(),
  deleteBoqItem: vi.fn(),
  updateBoqDocumentStatus: vi.fn(),
  deleteBoqItemsByDocument: vi.fn(),
  deleteBoqDocument: vi.fn(),
  getTerms: vi.fn(),
  upsertTerms: vi.fn(),
  getInclusionMasterItems: vi.fn(),
  createInclusionMasterItem: vi.fn(),
  updateInclusionMasterItem: vi.fn(),
  deleteInclusionMasterItem: vi.fn(),
  getChatMessages: vi.fn(),
  createChatMessage: vi.fn(),
  createCustomItemRequest: vi.fn(),
  getCustomItemRequests: vi.fn(),
  updateCustomItemRequest: vi.fn(),
  respondToSubmission: vi.fn(),
  updateProjectMilestones: vi.fn(),
  uploadSignedContract: vi.fn(),
  removeSignedContract: vi.fn(),
}));

vi.mock("./_core/llm", () => ({ invokeLLM: vi.fn() }));
vi.mock("./_core/notification", () => ({ notifyOwner: vi.fn() }));
vi.mock("./_core/jwt", () => ({
  signJwt: vi.fn().mockResolvedValue("mock-jwt-token"),
  verifyJwt: vi.fn().mockResolvedValue({ adminId: 1, username: "bmodern", role: "admin" }),
}));

import { appRouter } from "./routers";
import * as db from "./db";

const adminCtx = {
  user: { id: 1, openId: "admin-1", name: "Admin", role: "admin" as const },
  req: { cookies: { bm_admin_session: "mock-jwt-token" } } as any,
  res: { cookie: vi.fn(), clearCookie: vi.fn() } as any,
};
const publicCtx = {
  user: null,
  req: { cookies: {} } as any,
  res: { cookie: vi.fn(), clearCookie: vi.fn() } as any,
};

const caller = appRouter.createCaller(adminCtx as any);
const publicCaller = appRouter.createCaller(publicCtx as any);

beforeEach(() => vi.clearAllMocks());

describe("siteUpdates router", () => {
  it("lists site updates", async () => {
    (db.getSiteUpdatesByProject as any).mockResolvedValue([{ id: 1, title: "Frame done" }]);
    const r = await caller.siteUpdates.list({ projectId: 100 });
    expect(r).toHaveLength(1);
    expect(db.getSiteUpdatesByProject).toHaveBeenCalledWith(100);
  });
  it("creates a site update", async () => {
    (db.createSiteUpdate as any).mockResolvedValue({ id: 1 });
    const r = await caller.siteUpdates.create({ projectId: 100, title: "Slab poured" });
    expect(r).toEqual({ id: 1 });
    expect(db.createSiteUpdate).toHaveBeenCalledWith(expect.objectContaining({ createdBy: "B Modern Team" }));
  });
  it("adds a comment", async () => {
    (db.addSiteUpdateComment as any).mockResolvedValue(undefined);
    const r = await caller.siteUpdates.addComment({ siteUpdateId: 1, authorName: "Client", authorType: "client", comment: "Nice!" });
    expect(r.success).toBe(true);
  });
});

describe("approvals router", () => {
  it("lists approvals", async () => {
    (db.getApprovalsByProject as any).mockResolvedValue([{ id: 1, status: "pending" }]);
    const r = await caller.approvals.list({ projectId: 100 });
    expect(r).toHaveLength(1);
  });
  it("creates an approval", async () => {
    (db.createApprovalRequest as any).mockResolvedValue({ id: 1 });
    const r = await caller.approvals.create({ projectId: 100, title: "Mixer location" });
    expect(r).toEqual({ id: 1 });
  });
  it("responds to an approval", async () => {
    (db.respondToApprovalRequest as any).mockResolvedValue(undefined);
    const r = await publicCaller.approvals.respond({ id: 1, status: "approved" });
    expect(r.success).toBe(true);
  });
});

describe("variations router", () => {
  it("lists variations", async () => {
    (db.getVariationsByProject as any).mockResolvedValue([{ id: 1, costImpact: "250" }]);
    const r = await caller.variations.list({ projectId: 100 });
    expect(r).toHaveLength(1);
  });
  it("creates a variation", async () => {
    (db.createVariation as any).mockResolvedValue({ id: 1 });
    const r = await caller.variations.create({ projectId: 100, title: "Extra GPO", costImpact: "250" });
    expect(r).toEqual({ id: 1 });
  });
  it("responds to a variation", async () => {
    (db.updateVariationStatus as any).mockResolvedValue(undefined);
    const r = await publicCaller.variations.respond({ id: 1, status: "approved", clientName: "John" });
    expect(r.success).toBe(true);
  });
});

describe("documents router", () => {
  it("lists documents", async () => {
    (db.getDocumentsByProject as any).mockResolvedValue([{ id: 1, category: "Contract" }]);
    const r = await caller.documents.list({ projectId: 100 });
    expect(r).toHaveLength(1);
  });
  it("creates a document", async () => {
    (db.createProjectDocument as any).mockResolvedValue({ id: 1 });
    const r = await caller.documents.create({ projectId: 100, title: "Contract", category: "Contract", fileUrl: "https://x.com/f.pdf", fileKey: "f.pdf" });
    expect(r).toEqual({ id: 1 });
  });
  it("signs a document", async () => {
    (db.signDocument as any).mockResolvedValue(undefined);
    const r = await publicCaller.documents.sign({ id: 1, clientSignature: "sig", clientSignedName: "John" });
    expect(r.success).toBe(true);
  });
  it("deletes a document", async () => {
    (db.deleteProjectDocument as any).mockResolvedValue(undefined);
    const r = await caller.documents.delete({ id: 1 });
    expect(r.success).toBe(true);
  });
});

describe("meetingMinutes router", () => {
  it("lists meeting minutes", async () => {
    (db.getMeetingMinutesByProject as any).mockResolvedValue([{ id: 1, location: "On site" }]);
    const r = await caller.meetingMinutes.list({ projectId: 100 });
    expect(r).toHaveLength(1);
  });
  it("creates meeting minutes", async () => {
    (db.createMeetingMinutes as any).mockResolvedValue({ id: 1 });
    const r = await caller.meetingMinutes.create({ projectId: 100, meetingDate: "2026-04-15", location: "On site" });
    expect(r).toEqual({ id: 1 });
  });
  it("updates meeting minutes", async () => {
    (db.updateMeetingMinutes as any).mockResolvedValue(undefined);
    const r = await caller.meetingMinutes.update({ id: 1, notes: "Updated" });
    expect(r.success).toBe(true);
  });
  it("client signs meeting minutes", async () => {
    (db.signMeetingMinutes as any).mockResolvedValue(undefined);
    const r = await publicCaller.meetingMinutes.clientSign({ id: 1, clientName: "Sarah", clientSignature: "sig" });
    expect(r.success).toBe(true);
  });
});
