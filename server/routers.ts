import { TRPCError } from "@trpc/server";
import * as bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { parse as parseCookieHeader } from "cookie";

// Helper to read a cookie from the raw request headers (works without cookie-parser middleware)
// v2 - uses 'cookie' npm package for reliable parsing
function getCookieFromRequest(req: { headers?: { cookie?: string }; cookies?: Record<string, string> }, name: string): string | undefined {
  // Try req.cookies first (if cookie-parser is present)
  if (req.cookies?.[name]) return req.cookies[name];
  // Fall back to manual parsing from raw header
  const cookieHeader = req.headers?.cookie;
  if (!cookieHeader) return undefined;
  const parsed = parseCookieHeader(cookieHeader);
  return parsed[name];
};
import {
  createChangeRequest,
  createClientFile,
  createClientToken,
  createExclusion,
  createInclusionSection,
  createPlanImage,
  createProject,
  createProvisionalSum,
  createUpgradeGroup,
  createUpgradeOption,
  createUpgradeSubmission,
  deleteExclusion,
  deleteInclusionSection,
  deletePlanImage,
  deleteProject,
  deleteProvisionalSum,
  deleteUpgradeGroup,
  deleteUpgradeOption,
  getAdminCredentials,
  getAllChangeRequests,
  getAllProjects,
  getAllUpgradeSubmissions,
  getChangeRequestsByProject,
  getClientFilesByProject,
  getClientTokenRecord,
  getClientTokensByProject,
  getCompanySettings,
  getExclusionsByProject,
  getInclusionsByProject,
  getPlanImagesByProject,
  getProjectById,
  getProvisionalSumsByProject,
  getQuantitiesByProject,
  getUpgradeGroupsByProject,
  getUpgradeOptionsByProject,
  getUpgradeSelections,
  getUpgradeSubmission,
  upsertAdminCredentials,
  upsertCompanySettings,
  upsertQuantities,
  upsertUpgradeSelection,
  updateChangeRequestStatus,
  updateExclusion,
  updateInclusionSection,
  updateProject,
  updateProvisionalSum,
  updateUpgradeGroup,
  updateUpgradeOption,
  updateClientTokenLastAccess,
  getUserByOpenId,
  upsertUser,
  getAllMasterPackages,
  getMasterPackageWithItems,
  applyMasterPackageToProject,
  getAllPricingRules,
  updatePricingRule,
  calculatePackagePrices,
  getClientSelections,
  upsertClientSelection,
} from "./db";
import { storagePut } from "./storage";
import {
  notifyChangeRequest,
  notifyFileUpload,
  notifyUpgradeSubmission,
} from "./email";
import { signJwt, verifyJwt } from "./_core/jwt";

// ─── Admin Auth ───────────────────────────────────────────────────────────────
const adminAuthRouter = router({
  login: publicProcedure
    .input(z.object({ username: z.string(), password: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const cred = await getAdminCredentials(input.username);
      if (!cred) throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid credentials" });
      const valid = await bcrypt.compare(input.password, cred.passwordHash);
      if (!valid) throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid credentials" });
      const token = await signJwt({ adminId: cred.id, username: cred.username, role: "admin" });
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie("bm_admin_session", token, { ...cookieOptions, maxAge: 60 * 60 * 24 * 7 * 1000 });
      return { success: true, username: cred.username };
    }),

  logout: publicProcedure.mutation(({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie("bm_admin_session", { ...cookieOptions, maxAge: -1 });
    return { success: true };
  }),

  me: publicProcedure.query(async ({ ctx }) => {
    const token = getCookieFromRequest(ctx.req, "bm_admin_session");
    if (!token) return null;
    try {
      const payload = await verifyJwt(token);
      return payload as { adminId: number; username: string; role: string };
    } catch {
      return null;
    }
  }),

  setup: publicProcedure
    .input(z.object({ username: z.string(), password: z.string(), setupKey: z.string() }))
    .mutation(async ({ input }) => {
      if (input.setupKey !== "bmodern2024setup") throw new TRPCError({ code: "FORBIDDEN" });
      const hash = await bcrypt.hash(input.password, 12);
      await upsertAdminCredentials(input.username, hash);
      return { success: true };
    }),

  changePassword: publicProcedure
    .input(z.object({ username: z.string(), currentPassword: z.string(), newPassword: z.string() }))
    .mutation(async ({ input }) => {
      const cred = await getAdminCredentials(input.username);
      if (!cred) throw new TRPCError({ code: "UNAUTHORIZED" });
      const valid = await bcrypt.compare(input.currentPassword, cred.passwordHash);
      if (!valid) throw new TRPCError({ code: "UNAUTHORIZED", message: "Current password is incorrect" });
      const hash = await bcrypt.hash(input.newPassword, 12);
      await upsertAdminCredentials(input.username, hash);
      return { success: true };
    }),
});

// ─── Admin middleware ─────────────────────────────────────────────────────────
async function requireAdmin(ctx: { req: { cookies?: Record<string, string>; headers?: { cookie?: string } } }) {
  const token = getCookieFromRequest(ctx.req, "bm_admin_session");
  if (!token) throw new TRPCError({ code: "UNAUTHORIZED", message: "Admin authentication required" });
  try {
    const payload = await verifyJwt(token);
    return payload as { adminId: number; username: string; role: string };
  } catch {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid or expired session" });
  }
}

// ─── Projects ─────────────────────────────────────────────────────────────────
const projectsRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    await requireAdmin(ctx);
    return getAllProjects();
  }),

  get: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      await requireAdmin(ctx);
      const project = await getProjectById(input.id);
      if (!project) throw new TRPCError({ code: "NOT_FOUND" });
      return project;
    }),

  create: publicProcedure
    .input(z.object({
      clientName: z.string().min(1),
      clientEmail: z.string().email().optional(),
      projectAddress: z.string().min(1),
      proposalNumber: z.string().min(1),
      projectType: z.string().optional(),
      buildType: z.string().optional(),
      baseContractPrice: z.string().optional(),
      preliminaryEstimateMin: z.string().optional(),
      preliminaryEstimateMax: z.string().optional(),
      heroImageUrl: z.string().optional(),
      tenderExpiryDate: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      await requireAdmin(ctx);
      const result = await createProject({
        clientName: input.clientName,
        clientEmail: input.clientEmail,
        projectAddress: input.projectAddress,
        proposalNumber: input.proposalNumber,
        projectType: input.projectType,
        buildType: input.buildType,
        baseContractPrice: input.baseContractPrice,
        preliminaryEstimateMin: input.preliminaryEstimateMin,
        preliminaryEstimateMax: input.preliminaryEstimateMax,
        heroImageUrl: input.heroImageUrl,
        tenderExpiryDate: input.tenderExpiryDate ? new Date(input.tenderExpiryDate) : undefined,
        notes: input.notes,
        status: "draft",
      });
      const newId = (result as any).insertId ?? null;
      return { success: true, id: newId };
    }),

  update: publicProcedure
    .input(z.object({
      id: z.number(),
      clientName: z.string().optional(),
      clientEmail: z.string().email().optional().nullable(),
      projectAddress: z.string().optional(),
      proposalNumber: z.string().optional(),
      projectType: z.string().optional().nullable(),
      buildType: z.string().optional().nullable(),
      baseContractPrice: z.string().optional().nullable(),
      preliminaryEstimateMin: z.string().optional().nullable(),
      preliminaryEstimateMax: z.string().optional().nullable(),
      heroImageUrl: z.string().optional().nullable(),
      tenderExpiryDate: z.string().optional().nullable(),
      status: z.enum(["draft", "presented", "under_review", "accepted", "contract_creation", "contract_signed", "post_contract"]).optional(),
      notes: z.string().optional().nullable(),
      portalLockedAt: z.string().optional().nullable(),
    }))
    .mutation(async ({ input, ctx }) => {
      await requireAdmin(ctx);
      const { id, tenderExpiryDate, portalLockedAt, ...rest } = input;
      await updateProject(id, {
        ...rest,
        tenderExpiryDate: tenderExpiryDate ? new Date(tenderExpiryDate) : tenderExpiryDate === null ? null : undefined,
        portalLockedAt: portalLockedAt ? new Date(portalLockedAt) : portalLockedAt === null ? null : undefined,
      });
      return { success: true };
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      await requireAdmin(ctx);
      await deleteProject(input.id);
      return { success: true };
    }),

  generateClientLink: publicProcedure
    .input(z.object({ projectId: z.number(), origin: z.string() }))
    .mutation(async ({ input, ctx }) => {
      await requireAdmin(ctx);
      const token = nanoid(48);
      await createClientToken(input.projectId, token);
      const url = `${input.origin}/portal/${token}`;
      return { url, token };
    }),

  getClientTokens: publicProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input, ctx }) => {
      await requireAdmin(ctx);
      return getClientTokensByProject(input.projectId);
    }),

  lockPortal: publicProcedure
    .input(z.object({ id: z.number(), lock: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      await requireAdmin(ctx);
      await updateProject(input.id, { portalLockedAt: input.lock ? new Date() : null });
      return { success: true };
    }),
});

// ─── Inclusions ───────────────────────────────────────────────────────────────
const inclusionsRouter = router({
  list: publicProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input, ctx }) => {
      await requireAdmin(ctx);
      return getInclusionsByProject(input.projectId);
    }),

  create: publicProcedure
    .input(z.object({
      projectId: z.number(),
      title: z.string().min(1),
      description: z.string().optional(),
      imageUrl: z.string().optional(),
      position: z.number().default(0),
    }))
    .mutation(async ({ input, ctx }) => {
      await requireAdmin(ctx);
      await createInclusionSection(input);
      return { success: true };
    }),

  update: publicProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().optional(),
      description: z.string().optional().nullable(),
      imageUrl: z.string().optional().nullable(),
      position: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      await requireAdmin(ctx);
      const { id, ...data } = input;
      await updateInclusionSection(id, data);
      return { success: true };
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      await requireAdmin(ctx);
      await deleteInclusionSection(input.id);
      return { success: true };
    }),

  reorder: publicProcedure
    .input(z.object({ items: z.array(z.object({ id: z.number(), position: z.number() })) }))
    .mutation(async ({ input, ctx }) => {
      await requireAdmin(ctx);
      for (const item of input.items) {
        await updateInclusionSection(item.id, { position: item.position });
      }
      return { success: true };
    }),
});

// ─── Quantities ───────────────────────────────────────────────────────────────
const quantitiesRouter = router({
  get: publicProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input, ctx }) => {
      await requireAdmin(ctx);
      return getQuantitiesByProject(input.projectId);
    }),

  upsert: publicProcedure
    .input(z.object({
      projectId: z.number(),
      floorTileM2: z.string().optional().nullable(),
      wallTileM2: z.string().optional().nullable(),
      showerWallTileM2: z.string().optional().nullable(),
      splashbackTileM2: z.string().optional().nullable(),
      featureTileM2: z.string().optional().nullable(),
      tileWastagePct: z.string().optional().nullable(),
      baseTileAllowancePerM2: z.string().optional().nullable(),
      basinMixersQty: z.number().optional().nullable(),
      showerSetsQty: z.number().optional().nullable(),
      bathFillersQty: z.number().optional().nullable(),
      kitchenMixersQty: z.number().optional().nullable(),
      laundryMixersQty: z.number().optional().nullable(),
      toiletsQty: z.number().optional().nullable(),
      basinsQty: z.number().optional().nullable(),
      bathtubsQty: z.number().optional().nullable(),
      kitchenBaseCabinetryLm: z.string().optional().nullable(),
      kitchenOverheadCabinetryLm: z.string().optional().nullable(),
      pantryUnitsQty: z.number().optional().nullable(),
      potDrawerStacksQty: z.number().optional().nullable(),
      utilityDrawerStacksQty: z.number().optional().nullable(),
      binPulloutQty: z.number().optional().nullable(),
      vanityQty: z.number().optional().nullable(),
      vanityWidthMm: z.number().optional().nullable(),
      wardrobeLm: z.string().optional().nullable(),
      robeDrawerPacksQty: z.number().optional().nullable(),
      internalDoorsQty: z.number().optional().nullable(),
      externalDoorsQty: z.number().optional().nullable(),
      doorHandlesQty: z.number().optional().nullable(),
      entranceHardwareQty: z.number().optional().nullable(),
      downlightsQty: z.number().optional().nullable(),
      pendantPointsQty: z.number().optional().nullable(),
      powerPointsQty: z.number().optional().nullable(),
      switchPlatesQty: z.number().optional().nullable(),
      dataPointsQty: z.number().optional().nullable(),
      exhaustFansQty: z.number().optional().nullable(),
      timberHybridM2: z.string().optional().nullable(),
      carpetM2: z.string().optional().nullable(),
      skirtingLm: z.string().optional().nullable(),
      kitchenBenchtopArea: z.string().optional().nullable(),
      islandBenchtopArea: z.string().optional().nullable(),
      vanityStoneTopQty: z.number().optional().nullable(),
      stoneSplashbackArea: z.string().optional().nullable(),
      floorTileAllowancePerM2: z.string().optional().nullable(),
      wallTileAllowancePerM2: z.string().optional().nullable(),
      tapwareAllowance: z.string().optional().nullable(),
      sanitarywareAllowance: z.string().optional().nullable(),
      joineryAllowance: z.string().optional().nullable(),
      stoneAllowance: z.string().optional().nullable(),
      appliancesAllowance: z.string().optional().nullable(),
    }))
    .mutation(async ({ input, ctx }) => {
      await requireAdmin(ctx);
      const { projectId, ...data } = input;
      await upsertQuantities(projectId, data as any);
      return { success: true };
    }),
});

// ─── Upgrade Groups & Options ─────────────────────────────────────────────────
const upgradesRouter = router({
  listGroups: publicProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input, ctx }) => {
      await requireAdmin(ctx);
      return getUpgradeGroupsByProject(input.projectId);
    }),

  createGroup: publicProcedure
    .input(z.object({ projectId: z.number(), category: z.string().min(1), position: z.number().default(0) }))
    .mutation(async ({ input, ctx }) => {
      await requireAdmin(ctx);
      await createUpgradeGroup(input);
      return { success: true };
    }),

  updateGroup: publicProcedure
    .input(z.object({ id: z.number(), category: z.string().optional(), position: z.number().optional() }))
    .mutation(async ({ input, ctx }) => {
      await requireAdmin(ctx);
      const { id, ...data } = input;
      await updateUpgradeGroup(id, data);
      return { success: true };
    }),

  deleteGroup: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      await requireAdmin(ctx);
      await deleteUpgradeGroup(input.id);
      return { success: true };
    }),

  listOptions: publicProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input, ctx }) => {
      await requireAdmin(ctx);
      return getUpgradeOptionsByProject(input.projectId);
    }),

  createOption: publicProcedure
    .input(z.object({
      groupId: z.number(),
      projectId: z.number(),
      optionName: z.string().min(1),
      description: z.string().optional(),
      imageUrl: z.string().optional(),
      isIncluded: z.boolean().default(false),
      priceDelta: z.string().default("0"),
      position: z.number().default(0),
    }))
    .mutation(async ({ input, ctx }) => {
      await requireAdmin(ctx);
      await createUpgradeOption(input);
      return { success: true };
    }),

  updateOption: publicProcedure
    .input(z.object({
      id: z.number(),
      optionName: z.string().optional(),
      description: z.string().optional().nullable(),
      imageUrl: z.string().optional().nullable(),
      isIncluded: z.boolean().optional(),
      priceDelta: z.string().optional(),
      position: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      await requireAdmin(ctx);
      const { id, ...data } = input;
      await updateUpgradeOption(id, data as any);
      return { success: true };
    }),

  deleteOption: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      await requireAdmin(ctx);
      await deleteUpgradeOption(input.id);
      return { success: true };
    }),

  getSubmissions: publicProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input, ctx }) => {
      await requireAdmin(ctx);
      return getAllUpgradeSubmissions(input.projectId);
    }),
});

// ─── File Upload (Admin) ──────────────────────────────────────────────────────
const uploadRouter = router({
  getUploadUrl: publicProcedure
    .input(z.object({
      fileName: z.string(),
      mimeType: z.string(),
      fileData: z.string(), // base64
      folder: z.string().default("uploads"),
    }))
    .mutation(async ({ input, ctx }) => {
      await requireAdmin(ctx);
      const suffix = nanoid(8);
      const ext = input.fileName.split(".").pop() || "bin";
      const key = `${input.folder}/${Date.now()}-${suffix}.${ext}`;
      const buffer = Buffer.from(input.fileData, "base64");
      const { url } = await storagePut(key, buffer, input.mimeType);
      return { url, key };
    }),
});

// ─── Admin Inbox ──────────────────────────────────────────────────────────────
const inboxRouter = router({
  listAll: publicProcedure.query(async ({ ctx }) => {
    await requireAdmin(ctx);
    return getAllChangeRequests();
  }),

  listByProject: publicProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input, ctx }) => {
      await requireAdmin(ctx);
      return getChangeRequestsByProject(input.projectId);
    }),

  updateStatus: publicProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["pending", "reviewed", "actioned"]),
      adminNotes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      await requireAdmin(ctx);
      await updateChangeRequestStatus(input.id, input.status, input.adminNotes);
      return { success: true };
    }),

  listFiles: publicProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input, ctx }) => {
      await requireAdmin(ctx);
      return getClientFilesByProject(input.projectId);
    }),
});

// ─── Client Portal ────────────────────────────────────────────────────────────
const portalRouter = router({
  // Validate token and get project data
  getProject: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const tokenRecord = await getClientTokenRecord(input.token);
      if (!tokenRecord) throw new TRPCError({ code: "NOT_FOUND", message: "Invalid access link" });
      if (tokenRecord.expiresAt && tokenRecord.expiresAt < new Date()) {
        throw new TRPCError({ code: "FORBIDDEN", message: "This access link has expired" });
      }
      const project = await getProjectById(tokenRecord.projectId);
      if (!project) throw new TRPCError({ code: "NOT_FOUND" });
      if (project.status === "draft") throw new TRPCError({ code: "FORBIDDEN", message: "This proposal is not yet available" });
      await updateClientTokenLastAccess(input.token);
      // Return project without sensitive fields
      return {
        id: project.id,
        clientName: project.clientName,
        projectAddress: project.projectAddress,
        proposalNumber: project.proposalNumber,
        projectType: project.projectType,
        buildType: project.buildType,
        baseContractPrice: project.baseContractPrice,
        status: project.status,
        heroImageUrl: project.heroImageUrl,
        tenderExpiryDate: project.tenderExpiryDate,
        portalLockedAt: project.portalLockedAt,
        notes: project.notes,
        selectedPackageId: project.selectedPackageId ?? null,
      };
    }),

  // Client selects a package from the portal
  selectPackage: publicProcedure
    .input(z.object({ token: z.string(), packageId: z.number() }))
    .mutation(async ({ input }) => {
      const tokenRecord = await getClientTokenRecord(input.token);
      if (!tokenRecord) throw new TRPCError({ code: "NOT_FOUND" });
      const project = await getProjectById(tokenRecord.projectId);
      if (!project) throw new TRPCError({ code: "NOT_FOUND" });
      if (project.portalLockedAt) throw new TRPCError({ code: "FORBIDDEN", message: "This portal has been locked" });
      await updateProject(tokenRecord.projectId, { selectedPackageId: input.packageId });
      return { success: true };
    }),

  // Get all packages for the portal package selection screen
  getPackages: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const tokenRecord = await getClientTokenRecord(input.token);
      if (!tokenRecord) throw new TRPCError({ code: "NOT_FOUND" });
      return getAllMasterPackages();
    }),

  // Get a single package with items for the portal
  getPackageDetail: publicProcedure
    .input(z.object({ token: z.string(), packageId: z.number() }))
    .query(async ({ input }) => {
      const tokenRecord = await getClientTokenRecord(input.token);
      if (!tokenRecord) throw new TRPCError({ code: "NOT_FOUND" });
      return getMasterPackageWithItems(input.packageId);
    }),

  getInclusions: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const tokenRecord = await getClientTokenRecord(input.token);
      if (!tokenRecord) throw new TRPCError({ code: "NOT_FOUND" });
      return getInclusionsByProject(tokenRecord.projectId);
    }),

  getUpgradeGroups: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const tokenRecord = await getClientTokenRecord(input.token);
      if (!tokenRecord) throw new TRPCError({ code: "NOT_FOUND" });
      return getUpgradeGroupsByProject(tokenRecord.projectId);
    }),

  getUpgradeOptions: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const tokenRecord = await getClientTokenRecord(input.token);
      if (!tokenRecord) throw new TRPCError({ code: "NOT_FOUND" });
      return getUpgradeOptionsByProject(tokenRecord.projectId);
    }),

  getMySelections: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const tokenRecord = await getClientTokenRecord(input.token);
      if (!tokenRecord) throw new TRPCError({ code: "NOT_FOUND" });
      return getUpgradeSelections(tokenRecord.projectId, input.token);
    }),

  saveSelection: publicProcedure
    .input(z.object({ token: z.string(), upgradeOptionId: z.number(), selected: z.boolean() }))
    .mutation(async ({ input }) => {
      const tokenRecord = await getClientTokenRecord(input.token);
      if (!tokenRecord) throw new TRPCError({ code: "NOT_FOUND" });
      const project = await getProjectById(tokenRecord.projectId);
      if (!project) throw new TRPCError({ code: "NOT_FOUND" });
      // Check lock conditions
      if (project.portalLockedAt) throw new TRPCError({ code: "FORBIDDEN", message: "This portal has been locked" });
      if (project.status === "contract_signed" || project.status === "post_contract") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Selections are locked after contract signing" });
      }
      // Check 14-day window from first submission
      const submission = await getUpgradeSubmission(tokenRecord.projectId, input.token);
      if (submission) {
        const daysSinceSubmission = (Date.now() - submission.submittedAt.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceSubmission > 14) throw new TRPCError({ code: "FORBIDDEN", message: "The 14-day selection window has expired" });
      }
      await upsertUpgradeSelection(tokenRecord.projectId, input.token, input.upgradeOptionId, input.selected);
      return { success: true };
    }),

  submitSelections: publicProcedure
    .input(z.object({ token: z.string(), totalUpgradeCost: z.string(), notes: z.string().optional() }))
    .mutation(async ({ input }) => {
      const tokenRecord = await getClientTokenRecord(input.token);
      if (!tokenRecord) throw new TRPCError({ code: "NOT_FOUND" });
      const project = await getProjectById(tokenRecord.projectId);
      if (!project) throw new TRPCError({ code: "NOT_FOUND" });
      if (project.portalLockedAt) throw new TRPCError({ code: "FORBIDDEN", message: "This portal has been locked" });
      await createUpgradeSubmission(tokenRecord.projectId, input.token, input.totalUpgradeCost, input.notes);
      // Send notifications
      await notifyUpgradeSubmission(
        project.id,
        project.projectAddress,
        project.clientName,
        project.clientEmail,
        input.totalUpgradeCost
      );
      return { success: true };
    }),

  getSubmission: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const tokenRecord = await getClientTokenRecord(input.token);
      if (!tokenRecord) throw new TRPCError({ code: "NOT_FOUND" });
      return getUpgradeSubmission(tokenRecord.projectId, input.token);
    }),

  uploadFile: publicProcedure
    .input(z.object({
      token: z.string(),
      fileName: z.string(),
      mimeType: z.string(),
      fileData: z.string(), // base64
      fileSizeBytes: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const tokenRecord = await getClientTokenRecord(input.token);
      if (!tokenRecord) throw new TRPCError({ code: "NOT_FOUND" });
      const project = await getProjectById(tokenRecord.projectId);
      if (!project) throw new TRPCError({ code: "NOT_FOUND" });
      const suffix = nanoid(8);
      const ext = input.fileName.split(".").pop() || "bin";
      const key = `client-files/${tokenRecord.projectId}/${Date.now()}-${suffix}.${ext}`;
      const buffer = Buffer.from(input.fileData, "base64");
      const { url } = await storagePut(key, buffer, input.mimeType);
      await createClientFile({
        projectId: tokenRecord.projectId,
        clientToken: input.token,
        fileName: input.fileName,
        fileUrl: url,
        fileKey: key,
        mimeType: input.mimeType,
        fileSizeBytes: input.fileSizeBytes,
      });
      await notifyFileUpload(project.projectAddress, project.clientName, input.fileName);
      return { success: true, url };
    }),

  submitChangeRequest: publicProcedure
    .input(z.object({
      token: z.string(),
      category: z.string().min(1),
      description: z.string().min(10),
    }))
    .mutation(async ({ input }) => {
      const tokenRecord = await getClientTokenRecord(input.token);
      if (!tokenRecord) throw new TRPCError({ code: "NOT_FOUND" });
      const project = await getProjectById(tokenRecord.projectId);
      if (!project) throw new TRPCError({ code: "NOT_FOUND" });
      await createChangeRequest({
        projectId: tokenRecord.projectId,
        clientToken: input.token,
        category: input.category,
        description: input.description,
        status: "pending",
      });
      await notifyChangeRequest(project.projectAddress, project.clientName, input.category, input.description);
      return { success: true };
    }),

  getMyFiles: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const tokenRecord = await getClientTokenRecord(input.token);
      if (!tokenRecord) throw new TRPCError({ code: "NOT_FOUND" });
      return getClientFilesByProject(tokenRecord.projectId);
    }),

  // 3-tier pricing engine — returns all 3 package totals + line items for this project
  getPackagePrices: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const tokenRecord = await getClientTokenRecord(input.token);
      if (!tokenRecord) throw new TRPCError({ code: "NOT_FOUND", message: "Invalid access link" });
      return calculatePackagePrices(tokenRecord.projectId);
    }),

  // Get client's current item-level tier selections
  getItemSelections: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const tokenRecord = await getClientTokenRecord(input.token);
      if (!tokenRecord) throw new TRPCError({ code: "NOT_FOUND" });
      return getClientSelections(tokenRecord.projectId, input.token);
    }),

  // Client selects a tier for a specific item (mix-and-match)
  selectItem: publicProcedure
    .input(z.object({ token: z.string(), itemKey: z.string(), selectedTier: z.number().min(1).max(3) }))
    .mutation(async ({ input }) => {
      const tokenRecord = await getClientTokenRecord(input.token);
      if (!tokenRecord) throw new TRPCError({ code: "NOT_FOUND" });
      const project = await getProjectById(tokenRecord.projectId);
      if (!project) throw new TRPCError({ code: "NOT_FOUND" });
      if (project.portalLockedAt) throw new TRPCError({ code: "FORBIDDEN", message: "This portal has been locked" });
      await upsertClientSelection(tokenRecord.projectId, input.token, input.itemKey, input.selectedTier);
      return { success: true };
    }),
});
// ─── Exclusions Router ──────────────────────────────────────────────────────────────
const exclusionsRouter = router({
  list: publicProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input, ctx }) => { await requireAdmin(ctx); return getExclusionsByProject(input.projectId); }),
  create: publicProcedure
    .input(z.object({ projectId: z.number(), description: z.string().min(1), position: z.number().default(0) }))
    .mutation(async ({ input, ctx }) => { await requireAdmin(ctx); await createExclusion(input); return { success: true }; }),
  update: publicProcedure
    .input(z.object({ id: z.number(), description: z.string().optional(), position: z.number().optional() }))
    .mutation(async ({ input, ctx }) => { await requireAdmin(ctx); const { id, ...data } = input; await updateExclusion(id, data); return { success: true }; }),
  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => { await requireAdmin(ctx); await deleteExclusion(input.id); return { success: true }; }),
});

// ─── Provisional Sums Router ──────────────────────────────────────────────────────────────
const provisionalSumsRouter = router({
  list: publicProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input, ctx }) => { await requireAdmin(ctx); return getProvisionalSumsByProject(input.projectId); }),
  create: publicProcedure
    .input(z.object({ projectId: z.number(), description: z.string().min(1), amount: z.string().optional().nullable(), notes: z.string().optional().nullable(), position: z.number().default(0) }))
    .mutation(async ({ input, ctx }) => { await requireAdmin(ctx); await createProvisionalSum(input); return { success: true }; }),
  update: publicProcedure
    .input(z.object({ id: z.number(), description: z.string().optional(), amount: z.string().optional().nullable(), notes: z.string().optional().nullable(), position: z.number().optional() }))
    .mutation(async ({ input, ctx }) => { await requireAdmin(ctx); const { id, ...data } = input; await updateProvisionalSum(id, data); return { success: true }; }),
  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => { await requireAdmin(ctx); await deleteProvisionalSum(input.id); return { success: true }; }),
});

// ─── Plan Images Router ──────────────────────────────────────────────────────────────
const planImagesRouter = router({
  list: publicProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input, ctx }) => { await requireAdmin(ctx); return getPlanImagesByProject(input.projectId); }),
  create: publicProcedure
    .input(z.object({ projectId: z.number(), title: z.string().optional().nullable(), imageUrl: z.string(), fileKey: z.string().optional().nullable(), position: z.number().default(0) }))
    .mutation(async ({ input, ctx }) => { await requireAdmin(ctx); await createPlanImage(input); return { success: true }; }),
  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => { await requireAdmin(ctx); await deletePlanImage(input.id); return { success: true }; }),
});

// ─── Company Settings Router ──────────────────────────────────────────────────────────────
const companySettingsRouter = router({
  get: publicProcedure
    .query(async ({ ctx }) => { await requireAdmin(ctx); return getCompanySettings(); }),
  upsert: publicProcedure
    .input(z.object({
      aboutUs: z.string().optional().nullable(),
      tagline: z.string().optional().nullable(),
      credentials: z.string().optional().nullable(),
      phone: z.string().optional().nullable(),
      email: z.string().optional().nullable(),
      website: z.string().optional().nullable(),
      address: z.string().optional().nullable(),
      logoUrl: z.string().optional().nullable(),
    }))
    .mutation(async ({ input, ctx }) => { await requireAdmin(ctx); await upsertCompanySettings(input); return { success: true }; }),
});

// ─── Pricing Rules Router (Global, admin-only) ─────────────────────────────────────────────────────────────────────────────
const pricingRulesRouter = router({
  list: publicProcedure
    .query(async ({ ctx }) => { await requireAdmin(ctx); return getAllPricingRules(); }),

  update: publicProcedure
    .input(z.object({
      id: z.number(),
      tier1Label: z.string().optional().nullable(),
      tier1ImageUrl: z.string().optional().nullable(),
      tier2Label: z.string().optional().nullable(),
      tier2CostPerUnit: z.string().optional(),
      tier2ImageUrl: z.string().optional().nullable(),
      tier2Description: z.string().optional().nullable(),
      tier3Label: z.string().optional().nullable(),
      tier3CostPerUnit: z.string().optional(),
      tier3ImageUrl: z.string().optional().nullable(),
      tier3Description: z.string().optional().nullable(),
    }))
    .mutation(async ({ input, ctx }) => {
      await requireAdmin(ctx);
      const { id, ...data } = input;
      await updatePricingRule(id, data);
      return { success: true };
    }),

  getPackagePrices: publicProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input, ctx }) => {
      await requireAdmin(ctx);
      return calculatePackagePrices(input.projectId);
    }),
});

// ─── Packages Router ─────────────────────────────────────────────────────────────────────────────
const packagesRouter = router({
  list: publicProcedure
    .query(async ({ ctx }) => { await requireAdmin(ctx); return getAllMasterPackages(); }),

  get: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => { await requireAdmin(ctx); return getMasterPackageWithItems(input.id); }),

  applyPackage: publicProcedure
    .input(z.object({ projectId: z.number(), packageId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      await requireAdmin(ctx);
      const result = await applyMasterPackageToProject(input.projectId, input.packageId);
      return result;
    }),
});

// ─── App Router ────────────────────────────────────────────────────────────────────
export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  adminAuth: adminAuthRouter,
  projects: projectsRouter,
  inclusions: inclusionsRouter,
  quantities: quantitiesRouter,
  upgrades: upgradesRouter,
  upload: uploadRouter,
  inbox: inboxRouter,
   portal: portalRouter,
  exclusions: exclusionsRouter,
  provisionalSums: provisionalSumsRouter,
  planImages: planImagesRouter,
  companySettings: companySettingsRouter,
  packages: packagesRouter,
  pricingRules: pricingRulesRouter,
});
export type AppRouter = typeof appRouter;
