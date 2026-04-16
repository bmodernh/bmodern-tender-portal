import { TRPCError } from "@trpc/server";
import * as bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { z } from "zod";
import { invokeLLM } from "./_core/llm";
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
  createPricingRule,
  deletePricingRule,
  updatePricingRule,
  calculatePackagePrices,
  getClientSelections,
  upsertClientSelection,
  createBoqDocument,
  getBoqDocumentsByProject,
  getBoqDocument,
  updateBoqDocumentStatus,
  getBoqItemsByDocument,
  getBoqItemsByProject,
  updateBoqItem,
  deleteBoqItemsByDocument,
  confirmAllBoqItems,
  getTermsAndConditions,
  upsertTermsAndConditions,
  hasAcknowledgedTc,
  recordTcAcknowledgement,
  getInclusionCategoriesByProject,
  createInclusionCategory,
  updateInclusionCategory,
  deleteInclusionCategory,
  getInclusionItemsByProject,
  getInclusionItemsByCategory,
  upsertInclusionItem,
  deleteInclusionItem,
  bulkUpsertInclusionItems,
  updateInclusionItemQtyByBoqField,
  deleteBoqImportedItemsByProject,
  createCustomItemRequest,
  getCustomItemRequestsByProject,
  getCustomItemRequestsByToken,
  updateCustomItemRequest,
  getAllCustomItemRequests,
  respondToSubmission,
  getSubmissionById,
  createProjectMessage,
  getProjectMessages,
  updateInclusionItemImage,
  getPcItemsByProject,
  createPcItem,
  updatePcItem,
  deletePcItem,
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
      startingTier: z.number().min(1).max(3).optional(),
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
        startingTier: input.startingTier ?? 1,
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
      startingTier: z.number().min(1).max(3).optional(),
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
  uploadSignedContract: publicProcedure
    .input(z.object({ projectId: z.number(), contractUrl: z.string().url() }))
    .mutation(async ({ input, ctx }) => {
      await requireAdmin(ctx);
      await updateProject(input.projectId, {
        signedContractUrl: input.contractUrl,
        signedContractUploadedAt: new Date(),
        status: "contract_signed",
      });
      return { success: true };
    }),
  removeSignedContract: publicProcedure
    .input(z.object({ projectId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      await requireAdmin(ctx);
      await updateProject(input.projectId, {
        signedContractUrl: null,
        signedContractUploadedAt: null,
      });
      return { success: true };
    }),

  // Update project milestones (admin sets construction progress dates)
  updateMilestones: publicProcedure
    .input(z.object({
      projectId: z.number(),
      constructionStartedAt: z.string().nullable().optional(),
      framingCompletedAt: z.string().nullable().optional(),
      lockupCompletedAt: z.string().nullable().optional(),
      fixoutCompletedAt: z.string().nullable().optional(),
      completedAt: z.string().nullable().optional(),
      handoverAt: z.string().nullable().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      await requireAdmin(ctx);
      const { projectId, ...milestones } = input;
      const update: Record<string, Date | null | undefined> = {};
      for (const [key, val] of Object.entries(milestones)) {
        if (val === undefined) continue;
        update[key] = val ? new Date(val) : null;
      }
      if (Object.keys(update).length > 0) {
        await updateProject(projectId, update as any);
      }
      return { success: true };
    }),

  // Get project timeline (public — used by client portal)
  getTimeline: publicProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const project = await getProjectById(input.projectId);
      if (!project) return null;

      // Check if tender is signed (any submission with signedOffAt)
      const submissions = await getAllUpgradeSubmissions(input.projectId);
      const signedSubmission = submissions.find((s: any) => s.signedOffAt);

      return {
        portalOpened: project.createdAt,
        tenderSigned: signedSubmission?.signedOffAt || null,
        contractUploaded: project.signedContractUploadedAt || null,
        constructionStarted: project.constructionStartedAt || null,
        framingCompleted: project.framingCompletedAt || null,
        lockupCompleted: project.lockupCompletedAt || null,
        fixoutCompleted: project.fixoutCompletedAt || null,
        completed: project.completedAt || null,
        handover: project.handoverAt || null,
      };
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
      // New fields
      acZonesQty: z.number().optional().nullable(),
      acKw: z.string().optional().nullable(),
      facadeCladdingM2: z.string().optional().nullable(),
      insulationCeilingR: z.string().optional().nullable(),
      insulationWallR: z.string().optional().nullable(),
      laundryJoineryQty: z.number().optional().nullable(),
      applianceSetsQty: z.number().optional().nullable(),
      // Scalable upgrade qty fields
      mainFloorTileM2: z.string().optional().nullable(),
      bathroomQty: z.number().optional().nullable(),
      drivewayM2: z.string().optional().nullable(),
      wallPlasterM2: z.string().optional().nullable(),
      ceilingPlasterM2: z.string().optional().nullable(),
      corniceLm: z.string().optional().nullable(),
      squareSetQty: z.number().optional().nullable(),
      garageDoorQty: z.number().optional().nullable(),
      ceilingInsulationM2: z.string().optional().nullable(),
      wallInsulationM2: z.string().optional().nullable(),
      acousticInsulationM2: z.string().optional().nullable(),
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

  // Custom item requests management
  listCustomItemRequests: publicProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input, ctx }) => {
      await requireAdmin(ctx);
      return getCustomItemRequestsByProject(input.projectId);
    }),

  listAllCustomItemRequests: publicProcedure
    .query(async ({ ctx }) => {
      await requireAdmin(ctx);
      return getAllCustomItemRequests();
    }),

  updateCustomItemRequest: publicProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["submitted", "under_review", "priced", "approved", "declined"]).optional(),
      adminPrice: z.string().optional(),
      adminNotes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      await requireAdmin(ctx);
      const { id, ...data } = input;
      await updateCustomItemRequest(id, data);
      return { success: true };
    }),

  // Admin responds to a submission with final price
  listSubmissions: publicProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input, ctx }) => {
      await requireAdmin(ctx);
      return getAllUpgradeSubmissions(input.projectId);
    }),

  respondToSubmission: publicProcedure
    .input(z.object({
      submissionId: z.number(),
      adminResponsePrice: z.string(),
      adminResponseNotes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      await requireAdmin(ctx);
      await respondToSubmission(input.submissionId, input.adminResponsePrice, input.adminResponseNotes);
      return { success: true };
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
      // Allow draft projects to be viewed (portal shows a draft preview banner)
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
        startingTier: project.startingTier ?? 1,
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
  // Base Inclusions (contract schedule from inclusionItems)
  getBaseInclusions: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const tokenRecord = await getClientTokenRecord(input.token);
      if (!tokenRecord) throw new TRPCError({ code: "NOT_FOUND" });
      const projectId = tokenRecord.projectId;
      const categories = await getInclusionCategoriesByProject(projectId);
      const items = await getInclusionItemsByProject(projectId);
      return categories.map(cat => ({
        ...cat,
        items: items.filter(i => i.categoryId === cat.id && i.included),
      })).filter(cat => cat.items.length > 0);
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
    .input(z.object({
      token: z.string(),
      totalUpgradeCost: z.string(),
      notes: z.string().optional(),
      signoffName: z.string().min(1, "Full name is required"),
      signoffSignature: z.string().min(1, "Signature is required"),
      userAgent: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const tokenRecord = await getClientTokenRecord(input.token);
      if (!tokenRecord) throw new TRPCError({ code: "NOT_FOUND" });
      const project = await getProjectById(tokenRecord.projectId);
      if (!project) throw new TRPCError({ code: "NOT_FOUND" });
      if (project.portalLockedAt) throw new TRPCError({ code: "FORBIDDEN", message: "This portal has been locked" });
      // Capture IP from request headers
      const ip = (ctx as any).req?.headers?.["x-forwarded-for"]?.toString()?.split(",")[0]?.trim()
        || (ctx as any).req?.headers?.["x-real-ip"]
        || (ctx as any).req?.socket?.remoteAddress
        || "unknown";
      const { documentRefId } = await createUpgradeSubmission({
        projectId: tokenRecord.projectId,
        clientToken: input.token,
        totalUpgradeCost: input.totalUpgradeCost,
        notes: input.notes,
        signoffName: input.signoffName,
        signoffSignature: input.signoffSignature,
        signoffIp: ip,
        signoffUserAgent: input.userAgent || "unknown",
      });
      // Send notifications
      await notifyUpgradeSubmission(
        project.id,
        project.projectAddress,
        project.clientName,
        project.clientEmail,
        input.totalUpgradeCost
      );
       return { success: true, documentRefId };
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

  getTerms: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const tokenRecord = await getClientTokenRecord(input.token);
      if (!tokenRecord) throw new TRPCError({ code: "NOT_FOUND" });
      const terms = await getTermsAndConditions();
      return terms || { content: null };
    }),

  hasAcknowledgedTerms: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const tokenRecord = await getClientTokenRecord(input.token);
      if (!tokenRecord) throw new TRPCError({ code: "NOT_FOUND" });
      const acknowledged = await hasAcknowledgedTc(tokenRecord.projectId, input.token);
      return { acknowledged };
    }),

  acknowledgeTerms: publicProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const tokenRecord = await getClientTokenRecord(input.token);
      if (!tokenRecord) throw new TRPCError({ code: "NOT_FOUND" });
      const ipAddress = ctx.req.headers["x-forwarded-for"]?.toString() || ctx.req.socket?.remoteAddress;
      await recordTcAcknowledgement(tokenRecord.projectId, input.token, ipAddress);
      return { success: true };
    }),

  // Custom item requests — client asks for items not on the upgrade list
  submitCustomItemRequest: publicProcedure
    .input(z.object({
      token: z.string(),
      itemName: z.string().min(1),
      description: z.string().optional(),
      preferredBrand: z.string().optional(),
      referenceUrl: z.string().optional(),
      quantity: z.number().optional(),
      room: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const tokenRecord = await getClientTokenRecord(input.token);
      if (!tokenRecord) throw new TRPCError({ code: "NOT_FOUND" });
      const project = await getProjectById(tokenRecord.projectId);
      if (!project) throw new TRPCError({ code: "NOT_FOUND" });
      if (project.portalLockedAt) throw new TRPCError({ code: "FORBIDDEN", message: "Portal is locked" });
      const id = await createCustomItemRequest({
        projectId: tokenRecord.projectId,
        clientToken: input.token,
        itemName: input.itemName,
        description: input.description,
        preferredBrand: input.preferredBrand,
        referenceUrl: input.referenceUrl,
        quantity: input.quantity,
        room: input.room,
      });
      // Notify admin
      await notifyChangeRequest(project.projectAddress, project.clientName, "Custom Item Request", `${input.itemName}${input.description ? ': ' + input.description : ''}`);
      return { success: true, id };
    }),

  getMyCustomItemRequests: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const tokenRecord = await getClientTokenRecord(input.token);
      if (!tokenRecord) throw new TRPCError({ code: "NOT_FOUND" });
      return getCustomItemRequestsByToken(tokenRecord.projectId, input.token);
    }),

  // Get admin response on submission (client-facing)
  getAdminResponse: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const tokenRecord = await getClientTokenRecord(input.token);
      if (!tokenRecord) throw new TRPCError({ code: "NOT_FOUND" });
      const sub = await getUpgradeSubmission(tokenRecord.projectId, input.token);
      if (!sub) return null;
      return {
        submittedAt: sub.submittedAt,
        totalUpgradeCost: sub.totalUpgradeCost,
        adminResponsePrice: sub.adminResponsePrice ?? null,
        adminResponseNotes: sub.adminResponseNotes ?? null,
        adminRespondedAt: sub.adminRespondedAt ?? null,
      };
    }),

  // Chat: list messages (client side)
  listMessages: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const tokenRecord = await getClientTokenRecord(input.token);
      if (!tokenRecord) throw new TRPCError({ code: "NOT_FOUND" });
      return getProjectMessages(tokenRecord.projectId);
    }),

  // Chat: send message (client side)
  sendMessage: publicProcedure
    .input(z.object({ token: z.string(), message: z.string().min(1), senderName: z.string().default("Client") }))
    .mutation(async ({ input }) => {
      const tokenRecord = await getClientTokenRecord(input.token);
      if (!tokenRecord) throw new TRPCError({ code: "NOT_FOUND" });
      return createProjectMessage({
        projectId: tokenRecord.projectId,
        senderType: "client",
        senderName: input.senderName,
        message: input.message,
      });
    }),

  // Get project timeline for client portal
  getTimeline: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const tokenRecord = await getClientTokenRecord(input.token);
      if (!tokenRecord) throw new TRPCError({ code: "NOT_FOUND" });
      const project = await getProjectById(tokenRecord.projectId);
      if (!project) throw new TRPCError({ code: "NOT_FOUND" });

      // Check if tender is signed
      const submissions = await getAllUpgradeSubmissions(tokenRecord.projectId);
      const signedSubmission = submissions.find((s: any) => s.signedOffAt);

      return {
        portalOpened: project.createdAt,
        tenderSigned: signedSubmission?.signedOffAt || null,
        contractUploaded: project.signedContractUploadedAt || null,
        constructionStarted: project.constructionStartedAt || null,
        framingCompleted: project.framingCompletedAt || null,
        lockupCompleted: project.lockupCompletedAt || null,
        fixoutCompleted: project.fixoutCompletedAt || null,
        completed: project.completedAt || null,
        handover: project.handoverAt || null,
      };
    }),

  // PC Items for client portal
  getPcItems: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const tokenRecord = await getClientTokenRecord(input.token);
      if (!tokenRecord) throw new TRPCError({ code: "NOT_FOUND" });
      return getPcItemsByProject(tokenRecord.projectId);
    }),

  // Provisional Sums for client portal
  getProvisionalSums: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const tokenRecord = await getClientTokenRecord(input.token);
      if (!tokenRecord) throw new TRPCError({ code: "NOT_FOUND" });
      return getProvisionalSumsByProject(tokenRecord.projectId);
    }),

  // Exclusions for client portal
  getExclusions: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const tokenRecord = await getClientTokenRecord(input.token);
      if (!tokenRecord) throw new TRPCError({ code: "NOT_FOUND" });
      return getExclusionsByProject(tokenRecord.projectId);
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

  create: publicProcedure
    .input(z.object({
      itemKey: z.string().min(1),
      label: z.string().min(1),
      category: z.string().min(1),
      unit: z.enum(["each", "lm", "m2", "fixed"]).default("each"),
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
      position: z.number().default(0),
    }))
    .mutation(async ({ input, ctx }) => {
      await requireAdmin(ctx);
      const id = await createPricingRule(input as any);
      return { id };
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      await requireAdmin(ctx);
      await deletePricingRule(input.id);
      return { success: true };
    }),

  update: publicProcedure
    .input(z.object({
      id: z.number(),
      label: z.string().optional(),
      tier1Label: z.string().optional().nullable(),
      tier1ImageUrl: z.string().optional().nullable(),
      tier2Label: z.string().optional().nullable(),
      tier2CostPerUnit: z.string().optional(),
      tier2ImageUrl: z.string().optional().nullable(),
      tier2Description: z.string().optional().nullable(),
      tier2Qty: z.number().int().optional().nullable(),
      tier3Label: z.string().optional().nullable(),
      tier3CostPerUnit: z.string().optional(),
      tier3ImageUrl: z.string().optional().nullable(),
      tier3Description: z.string().optional().nullable(),
      tier3Qty: z.number().int().optional().nullable(),
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

// ─── PC Items Router ────────────────────────────────────────────────────────────────────────────────
const pcItemsRouter = router({
  list: publicProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input, ctx }) => { await requireAdmin(ctx); return getPcItemsByProject(input.projectId); }),
  create: publicProcedure
    .input(z.object({ projectId: z.number(), description: z.string().min(1), allowance: z.string().optional().nullable(), notes: z.string().optional().nullable(), position: z.number().default(0) }))
    .mutation(async ({ input, ctx }) => { await requireAdmin(ctx); await createPcItem(input); return { success: true }; }),
  update: publicProcedure
    .input(z.object({ id: z.number(), description: z.string().optional(), allowance: z.string().optional().nullable(), notes: z.string().optional().nullable(), position: z.number().optional() }))
    .mutation(async ({ input, ctx }) => { await requireAdmin(ctx); const { id, ...data } = input; await updatePcItem(id, data); return { success: true }; }),
  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => { await requireAdmin(ctx); await deletePcItem(input.id); return { success: true }; }),
});

// ─── Packages Router ────────────────────────────────────────────────────────────────────────────────
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

// ─── BOQ Router ────────────────────────────────────────────────────────────────────────────────
const boqRouter = router({
  listDocuments: publicProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input, ctx }) => {
      await requireAdmin(ctx);
      return getBoqDocumentsByProject(input.projectId);
    }),

  getItems: publicProcedure
    .input(z.object({ boqDocumentId: z.number() }))
    .query(async ({ input, ctx }) => {
      await requireAdmin(ctx);
      return getBoqItemsByDocument(input.boqDocumentId);
    }),

  updateItem: publicProcedure
    .input(z.object({
      id: z.number(),
      category: z.string().optional(),
      description: z.string().optional(),
      unit: z.string().optional(),
      quantity: z.string().optional(),
      isConfirmed: z.boolean().optional(),
      mappedQuantityField: z.string().nullable().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      await requireAdmin(ctx);
      const { id, ...data } = input;
      await updateBoqItem(id, {
        ...data,
        mappedQuantityField: data.mappedQuantityField ?? undefined,
      });
      return { success: true };
    }),

  confirmAll: publicProcedure
    .input(z.object({ boqDocumentId: z.number(), projectId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      await requireAdmin(ctx);
      await confirmAllBoqItems(input.boqDocumentId);
      await updateBoqDocumentStatus(input.boqDocumentId, "confirmed");
      return { success: true };
    }),

  autoFillQuantities: publicProcedure
    .input(z.object({ boqDocumentId: z.number(), projectId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      await requireAdmin(ctx);
      const items = await getBoqItemsByDocument(input.boqDocumentId);
      // Build quantities update from mapped fields
      const quantityUpdate: Record<string, number> = {};
      for (const item of items) {
        if (item.mappedQuantityField && item.quantity) {
          const val = parseFloat(item.quantity);
          if (!isNaN(val)) {
            quantityUpdate[item.mappedQuantityField] = val;
          }
        }
      }
      if (Object.keys(quantityUpdate).length > 0) {
        // Update legacy quantities table
        await upsertQuantities(input.projectId, quantityUpdate);
        // Also push into Base Inclusions items that have matching boqFieldKey
        for (const [fieldKey, qty] of Object.entries(quantityUpdate)) {
          await updateInclusionItemQtyByBoqField(input.projectId, fieldKey, qty);
        }
      }
      return { success: true, filledCount: Object.keys(quantityUpdate).length };
    }),

  deleteDocument: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      await requireAdmin(ctx);
      await deleteBoqItemsByDocument(input.id);
      return { success: true };
    }),

  // Import BOQ items from a document into Base Inclusions
  importToInclusions: publicProcedure
    .input(z.object({ boqDocumentId: z.number(), projectId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      await requireAdmin(ctx);
      const items = await getBoqItemsByDocument(input.boqDocumentId);
      if (!items || items.length === 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No BOQ items found for this document" });
      }

      // Remove previous BOQ-imported items so re-import is clean
      await deleteBoqImportedItemsByProject(input.projectId);

      // Group extracted items by category
      const categoryMap = new Map<string, typeof items>();
      for (const item of items) {
        const cat = item.category || "General";
        if (!categoryMap.has(cat)) categoryMap.set(cat, []);
        categoryMap.get(cat)!.push(item);
      }

      // Get existing categories so we can reuse them
      const existingCats = await getInclusionCategoriesByProject(input.projectId);
      const existingCatMap = new Map(existingCats.map(c => [c.name.toLowerCase(), c.id]));

      let catPos = existingCats.length;
      let importedCount = 0;
      for (const [catName, catItems] of Array.from(categoryMap.entries())) {
        let catId = existingCatMap.get(catName.toLowerCase());
        if (!catId) {
          catId = await createInclusionCategory({ projectId: input.projectId, name: catName, position: catPos++ }) ?? undefined;
        }
        if (!catId) continue;
        const existingItems = await getInclusionItemsByProject(input.projectId);
        const existingInCat = existingItems.filter(i => i.categoryId === catId);
        let itemPos = existingInCat.length;
        for (const boqItem of catItems) {
          await upsertInclusionItem({
            categoryId: catId,
            projectId: input.projectId,
            name: boqItem.description,
            qty: boqItem.quantity != null ? String(boqItem.quantity) : undefined,
            unit: boqItem.unit || "item",
            description: boqItem.description,
            boqFieldKey: boqItem.mappedQuantityField || undefined,
            isBoqImported: true,
            included: true,
            position: itemPos++,
          });
          importedCount++;
        }
      }

      return { success: true, importedCount };
    }),
});

// ─── Terms & Conditions Router ────────────────────────────────────────────────────────
// ─── Inclusion Master (Base Inclusions tab) ─────────────────────────────────
const inclusionMasterRouter = router({
  // List all categories with their items for a project
  listCategories: publicProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const categories = await getInclusionCategoriesByProject(input.projectId);
      const items = await getInclusionItemsByProject(input.projectId);
      return categories.map(cat => ({
        ...cat,
        items: items.filter(i => i.categoryId === cat.id),
      }));
    }),

  // Add a new category
  addCategory: publicProcedure
    .input(z.object({
      projectId: z.number(),
      name: z.string().min(1),
      imageUrl: z.string().optional(),
      position: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      return createInclusionCategory({
        projectId: input.projectId,
        name: input.name,
        imageUrl: input.imageUrl,
        position: input.position ?? 0,
      });
    }),

  // Update a category (name, image, position)
  updateCategory: publicProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      imageUrl: z.string().nullable().optional(),
      position: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateInclusionCategory(id, data);
      return { success: true };
    }),

  // Delete a category and all its items
  deleteCategory: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteInclusionCategory(input.id);
      return { success: true };
    }),

  // Upsert a single item (create if no id, update if id provided)
  upsertItem: publicProcedure
    .input(z.object({
      id: z.number().optional(),
      categoryId: z.number(),
      projectId: z.number(),
      name: z.string().min(1),
      qty: z.string().nullable().optional(),
      unit: z.string().optional(),
      description: z.string().nullable().optional(),
      specLevel: z.string().nullable().optional(),
      upgradeEligible: z.boolean().optional(),
      included: z.boolean().optional(),
      boqFieldKey: z.string().nullable().optional(),
      position: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const id = await upsertInclusionItem({
        ...input,
        qty: input.qty ?? undefined,
        description: input.description ?? undefined,
        specLevel: input.specLevel ?? undefined,
        boqFieldKey: input.boqFieldKey ?? undefined,
        position: input.position ?? 0,
      });
      return { id };
    }),

  // Delete a single item
  deleteItem: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteInclusionItem(input.id);
      return { success: true };
    }),

  // Seed default categories and items for a new project (from pricing rules)
  seedDefaults: publicProcedure
    .input(z.object({ projectId: z.number(), tier: z.number().min(1).max(3).optional() }))
    .mutation(async ({ input }) => {
      // Check if pricing-rule-based categories already exist (non-BOQ)
      const existing = await getInclusionCategoriesByProject(input.projectId);
      const existingItems = await getInclusionItemsByProject(input.projectId);
      // Only skip if there are already non-BOQ items (i.e. seeded items)
      const hasSeededItems = existingItems.some(i => !i.isBoqImported);
      if (hasSeededItems) return { skipped: true, message: "Standard inclusions already seeded. Delete them first to re-seed." };

      // Use the provided tier override, or fall back to project's starting tier
      const project = await getProjectById(input.projectId);
      const startingTier = input.tier ?? project?.startingTier ?? 1; // 1=Built for Excellence, 2=Tailored Living, 3=Signature Series

      // Pull all pricing rules to get tier-specific descriptions
      const pricingRules = await getAllPricingRules();
      const rulesByKey = new Map(pricingRules.map(r => [r.itemKey, r]));

      // Helper: get the correct tier label for a pricing rule
      const getTierLabel = (rule: typeof pricingRules[0]) => {
        if (startingTier === 3) return rule.tier3Label || rule.tier2Label || rule.tier1Label || "";
        if (startingTier === 2) return rule.tier2Label || rule.tier1Label || "";
        return rule.tier1Label || "";
      };

      // Helper: get the correct tier image for a pricing rule
      const getTierImage = (rule: typeof pricingRules[0]) => {
        if (startingTier === 3) return rule.tier3ImageUrl || rule.tier2ImageUrl || rule.tier1ImageUrl || null;
        if (startingTier === 2) return rule.tier2ImageUrl || rule.tier1ImageUrl || null;
        return rule.tier1ImageUrl || null;
      };

      // Map itemKey → boqFieldKey for quantity linking
      const ITEM_BOQ_MAP: Record<string, string | undefined> = {
        // Joinery
        kitchen_laundry_joinery: "kitchenBaseCabinetryLm",
        vanities: "vanityQty",
        wardrobes: "wardrobeLm",
        // Tiles & Stone
        stone_benchtops: "kitchenBenchtopArea",
        main_floor_tiles: "mainFloorTileM2",
        wet_area_tiles: "floorTileM2",
        timber_flooring: "timberHybridM2",
        // Bathroom & Kitchen Fixtures
        bathroom_fixtures: "bathroomQty",
        bathroom_accessories: "bathroomQty",
        // Door Hardware
        door_hardware: "doorHandlesQty",
        // Appliances
        kitchen_appliances: undefined,  // fixed lump sum (one kitchen)
        // Driveway
        driveway: "drivewayM2",
        // Electrical
        downlights: "downlightsQty",
        power_points: "powerPointsQty",
        data_points: "dataPointsQty",
        pendant_points: "pendantPointsQty",
        // Plasterboard
        plasterboard_walls: "wallPlasterM2",
        plasterboard_ceilings: "ceilingPlasterM2",
        cornice: "corniceLm",
        square_set: "squareSetQty",
        // Fixout Material
        skirting_boards: "skirtingLm",
        architraves: "internalDoorsQty",
        internal_doors: "internalDoorsQty",
        door_handles_fixout: "doorHandlesQty",
        // Air Conditioning
        air_conditioning: "acZonesQty",
        // Garage Doors
        garage_doors: "garageDoorQty",
        // Staircases — fixed lump sum
        staircase: undefined,
        balustrade: undefined,
        // Insulation
        ceiling_insulation: "ceilingInsulationM2",
        wall_insulation: "wallInsulationM2",
        acoustic_insulation: "acousticInsulationM2",
      };

      // Build categories from pricing rules, grouped by their category field
      const categoryOrder = [
        "Joinery", "Tiles & Stone", "Bathroom & Kitchen Fixtures", "Door Hardware",
        "Appliances", "Driveway", "Electrical", "Plasterboard", "Fixout Material",
        "Air Conditioning", "Garage Doors", "Staircases", "Insulation", "Preliminaries"
      ];

      // Group pricing rules by category
      const rulesByCategory = new Map<string, typeof pricingRules>();
      for (const rule of pricingRules) {
        const cat = rule.category;
        if (!rulesByCategory.has(cat)) rulesByCategory.set(cat, []);
        rulesByCategory.get(cat)!.push(rule);
      }

      let catPosition = 0;
      for (const catName of categoryOrder) {
        const rules = rulesByCategory.get(catName);
        if (!rules || rules.length === 0) {
          // Add Preliminaries even without pricing rules
          if (catName === "Preliminaries") {
            const catId = await createInclusionCategory({ projectId: input.projectId, name: catName, position: catPosition++ });
            if (!catId) continue;
            const prelims = [
              { name: "Site Supervisor", unit: "each" },
              { name: "Builders Insurance", unit: "each" },
              { name: "Long Service Levy", unit: "each" },
              { name: "Engineering Plans", unit: "each" },
              { name: "Survey & Set Out", unit: "each" },
              { name: "Scaffolding", unit: "each" },
              { name: "Temporary Fencing", unit: "each" },
            ];
            for (let i = 0; i < prelims.length; i++) {
              await upsertInclusionItem({
                categoryId: catId, projectId: input.projectId,
                name: prelims[i].name, unit: prelims[i].unit,
                included: true, position: i, upgradeEligible: false,
              });
            }
          }
          continue;
        }

        const catId = await createInclusionCategory({ projectId: input.projectId, name: catName, position: catPosition++ });
        if (!catId) continue;

        for (let i = 0; i < rules.length; i++) {
          const rule = rules[i];
          const tierLabel = getTierLabel(rule);
          const tierImage = getTierImage(rule);
          const boqFieldKey = ITEM_BOQ_MAP[rule.itemKey];
          const unitMap: Record<string, string> = { each: "each", lm: "lm", m2: "m²", fixed: "item" };

          await upsertInclusionItem({
            categoryId: catId,
            projectId: input.projectId,
            name: rule.label,
            unit: unitMap[rule.unit] || "each",
            description: tierLabel || undefined,
            imageUrl: tierImage,
            boqFieldKey: boqFieldKey,
            upgradeEligible: true,
            included: true,
            position: i,
          });
        }
      }
      return { seeded: true };
    }),

  // AI wording suggestion for a single inclusion item
  suggestWording: publicProcedure
    .input(z.object({
      itemName: z.string(),
      categoryName: z.string(),
      qty: z.string().optional(),
      unit: z.string().optional(),
      currentDescription: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      await requireAdmin(ctx);
      const qtyContext = input.qty && input.unit
        ? `Quantity: ${input.qty} ${input.unit}.`
        : input.qty
        ? `Quantity: ${input.qty}.`
        : "";
      const currentContext = input.currentDescription
        ? `Current description: "${input.currentDescription}".`
        : "";
      const prompt = `You are a professional construction tender writer for a premium Australian home builder called B Modern Homes.

Generate 3 distinct professional tender specification descriptions for the following inclusion item:

Category: ${input.categoryName}
Item: ${input.itemName}
${qtyContext}
${currentContext}

Requirements:
- Write in formal Australian construction tender language
- Each description should be 1–3 sentences, precise and specific
- Include relevant standards, finishes, or specifications where appropriate (e.g. AS/NZS standards, brand tiers, installation method)
- Vary the length and focus: one brief/concise, one medium with spec detail, one comprehensive with full scope
- Do NOT include pricing or cost references
- Do NOT use bullet points — write as flowing specification text
- Suitable for inclusion in a formal Head Contract or Tender document

Return ONLY a JSON object with this exact structure:
{
  "suggestions": [
    { "label": "Concise", "text": "..." },
    { "label": "Standard", "text": "..." },
    { "label": "Comprehensive", "text": "..." }
  ]
}`;
      const response = await invokeLLM({
        messages: [
          { role: "system", content: "You are a professional construction tender specification writer. Always respond with valid JSON only." },
          { role: "user", content: prompt },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "wording_suggestions",
            strict: true,
            schema: {
              type: "object",
              properties: {
                suggestions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      label: { type: "string" },
                      text: { type: "string" },
                    },
                    required: ["label", "text"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["suggestions"],
              additionalProperties: false,
            },
          },
        },
      });
      const rawContent = response.choices?.[0]?.message?.content;
      const content = typeof rawContent === "string" ? rawContent : null;
      if (!content) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "No response from AI" });
      const parsed = JSON.parse(content) as { suggestions: { label: string; text: string }[] };
      return parsed;
    }),
  // Bulk update quantities from BOQ field keys
  applyBoqQuantities: publicProcedure
    .input(z.object({
      projectId: z.number(),
      quantities: z.record(z.string(), z.number()),  // { downlightsQty: 45, floorTileM2: 120, ... }
    }))
    .mutation(async ({ input }) => {
      let updated = 0;
      for (const [fieldKey, qty] of Object.entries(input.quantities)) {
        await updateInclusionItemQtyByBoqField(input.projectId, fieldKey, qty);
        updated++;
      }
      return { updated };
    }),
  // Update item image
  updateItemImage: publicProcedure
    .input(z.object({ id: z.number(), imageUrl: z.string().nullable() }))
    .mutation(async ({ input }) => {
      await updateInclusionItemImage(input.id, input.imageUrl);
      return { success: true };
    }),
});

// ─── Chat Router (admin side) ─────────────────────────────────────────────────
const chatRouter = router({
  listMessages: publicProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => getProjectMessages(input.projectId)),

  sendMessage: publicProcedure
    .input(z.object({ projectId: z.number(), message: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      const user = ctx.user;
      const senderName = user?.name || "B Modern Team";
      return createProjectMessage({
        projectId: input.projectId,
        senderType: "admin",
        senderName,
        message: input.message,
      });
    }),
});

const termsRouter = router({
  get: publicProcedure
    .query(async () => getTermsAndConditions()),

  update: publicProcedure
    .input(z.object({ content: z.string() }))
    .mutation(async ({ input, ctx }) => {
      await requireAdmin(ctx);
      await upsertTermsAndConditions(input.content);
      return { success: true };
    }),
});

// ─── App Router ────────────────────────────────────────────────────────────────────────────────
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
  pcItems: pcItemsRouter,
  provisionalSums: provisionalSumsRouter,
  planImages: planImagesRouter,
  companySettings: companySettingsRouter,
  packages: packagesRouter,
  pricingRules: pricingRulesRouter,
  boq: boqRouter,
  terms: termsRouter,
  inclusionMaster: inclusionMasterRouter,
  chat: chatRouter,
});
export type AppRouter = typeof appRouter;
