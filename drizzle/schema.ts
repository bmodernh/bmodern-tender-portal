import {
  boolean,
  decimal,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

// ─── Users (Manus OAuth, kept for system compatibility) ───────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

// ─── Admin Credentials (shared username/password for B Modern staff) ──────────
export const adminCredentials = mysqlTable("admin_credentials", {
  id: int("id").autoincrement().primaryKey(),
  username: varchar("username", { length: 128 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 256 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── Projects ─────────────────────────────────────────────────────────────────
export const projects = mysqlTable("projects", {
  id: int("id").autoincrement().primaryKey(),
  clientName: varchar("clientName", { length: 256 }).notNull(),
  clientEmail: varchar("clientEmail", { length: 320 }),
  projectAddress: text("projectAddress").notNull(),
  proposalNumber: varchar("proposalNumber", { length: 64 }).notNull(),
  projectType: varchar("projectType", { length: 128 }),
  buildType: varchar("buildType", { length: 128 }),
  baseContractPrice: decimal("baseContractPrice", { precision: 12, scale: 2 }),
  preliminaryEstimateMin: decimal("preliminaryEstimateMin", { precision: 12, scale: 2 }),
  preliminaryEstimateMax: decimal("preliminaryEstimateMax", { precision: 12, scale: 2 }),
  status: mysqlEnum("status", [
    "draft",
    "presented",
    "under_review",
    "accepted",
    "contract_creation",
    "contract_signed",
    "post_contract",
  ])
    .default("draft")
    .notNull(),
  heroImageUrl: text("heroImageUrl"),
  tenderExpiryDate: timestamp("tenderExpiryDate"),
  portalLockedAt: timestamp("portalLockedAt"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── Client Access Tokens (per-project portal access) ─────────────────────────
export const clientTokens = mysqlTable("client_tokens", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  token: varchar("token", { length: 128 }).notNull().unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt"),
  lastAccessedAt: timestamp("lastAccessedAt"),
});

// ─── Inclusion Sections (room-by-room) ────────────────────────────────────────
export const inclusionSections = mysqlTable("inclusion_sections", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  description: text("description"),
  imageUrl: text("imageUrl"),
  position: int("position").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── Quantities Questionnaire ─────────────────────────────────────────────────
export const quantities = mysqlTable("quantities", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull().unique(),
  // Tiles
  floorTileM2: decimal("floorTileM2", { precision: 8, scale: 2 }),
  wallTileM2: decimal("wallTileM2", { precision: 8, scale: 2 }),
  showerWallTileM2: decimal("showerWallTileM2", { precision: 8, scale: 2 }),
  splashbackTileM2: decimal("splashbackTileM2", { precision: 8, scale: 2 }),
  featureTileM2: decimal("featureTileM2", { precision: 8, scale: 2 }),
  tileWastagePct: decimal("tileWastagePct", { precision: 5, scale: 2 }),
  baseTileAllowancePerM2: decimal("baseTileAllowancePerM2", { precision: 8, scale: 2 }),
  // Fixtures
  basinMixersQty: int("basinMixersQty"),
  showerSetsQty: int("showerSetsQty"),
  bathFillersQty: int("bathFillersQty"),
  kitchenMixersQty: int("kitchenMixersQty"),
  laundryMixersQty: int("laundryMixersQty"),
  toiletsQty: int("toiletsQty"),
  basinsQty: int("basinsQty"),
  bathtubsQty: int("bathtubsQty"),
  // Joinery
  kitchenBaseCabinetryLm: decimal("kitchenBaseCabinetryLm", { precision: 8, scale: 2 }),
  kitchenOverheadCabinetryLm: decimal("kitchenOverheadCabinetryLm", { precision: 8, scale: 2 }),
  pantryUnitsQty: int("pantryUnitsQty"),
  potDrawerStacksQty: int("potDrawerStacksQty"),
  utilityDrawerStacksQty: int("utilityDrawerStacksQty"),
  binPulloutQty: int("binPulloutQty"),
  vanityQty: int("vanityQty"),
  vanityWidthMm: int("vanityWidthMm"),
  wardrobeLm: decimal("wardrobeLm", { precision: 8, scale: 2 }),
  robeDrawerPacksQty: int("robeDrawerPacksQty"),
  // Doors & Hardware
  internalDoorsQty: int("internalDoorsQty"),
  externalDoorsQty: int("externalDoorsQty"),
  doorHandlesQty: int("doorHandlesQty"),
  entranceHardwareQty: int("entranceHardwareQty"),
  // Electrical
  downlightsQty: int("downlightsQty"),
  pendantPointsQty: int("pendantPointsQty"),
  powerPointsQty: int("powerPointsQty"),
  switchPlatesQty: int("switchPlatesQty"),
  dataPointsQty: int("dataPointsQty"),
  exhaustFansQty: int("exhaustFansQty"),
  // Flooring
  timberHybridM2: decimal("timberHybridM2", { precision: 8, scale: 2 }),
  carpetM2: decimal("carpetM2", { precision: 8, scale: 2 }),
  skirtingLm: decimal("skirtingLm", { precision: 8, scale: 2 }),
  // Stone / Benchtops
  kitchenBenchtopArea: decimal("kitchenBenchtopArea", { precision: 8, scale: 2 }),
  islandBenchtopArea: decimal("islandBenchtopArea", { precision: 8, scale: 2 }),
  vanityStoneTopQty: int("vanityStoneTopQty"),
  stoneSplashbackArea: decimal("stoneSplashbackArea", { precision: 8, scale: 2 }),
  // Allowances
  floorTileAllowancePerM2: decimal("floorTileAllowancePerM2", { precision: 8, scale: 2 }),
  wallTileAllowancePerM2: decimal("wallTileAllowancePerM2", { precision: 8, scale: 2 }),
  tapwareAllowance: decimal("tapwareAllowance", { precision: 10, scale: 2 }),
  sanitarywareAllowance: decimal("sanitarywareAllowance", { precision: 10, scale: 2 }),
  joineryAllowance: decimal("joineryAllowance", { precision: 10, scale: 2 }),
  stoneAllowance: decimal("stoneAllowance", { precision: 10, scale: 2 }),
  appliancesAllowance: decimal("appliancesAllowance", { precision: 10, scale: 2 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── Upgrade Groups ───────────────────────────────────────────────────────────
export const upgradeGroups = mysqlTable("upgrade_groups", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  category: varchar("category", { length: 128 }).notNull(),
  position: int("position").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── Upgrade Options ──────────────────────────────────────────────────────────
export const upgradeOptions = mysqlTable("upgrade_options", {
  id: int("id").autoincrement().primaryKey(),
  groupId: int("groupId").notNull(),
  projectId: int("projectId").notNull(),
  optionName: varchar("optionName", { length: 256 }).notNull(),
  description: text("description"),
  imageUrl: text("imageUrl"),
  isIncluded: boolean("isIncluded").default(false).notNull(),
  priceDelta: decimal("priceDelta", { precision: 10, scale: 2 }).default("0"),
  position: int("position").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── Client Upgrade Selections ────────────────────────────────────────────────
export const upgradeSelections = mysqlTable("upgrade_selections", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  clientToken: varchar("clientToken", { length: 128 }).notNull(),
  upgradeOptionId: int("upgradeOptionId").notNull(),
  selected: boolean("selected").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── Upgrade Submissions ──────────────────────────────────────────────────────
export const upgradeSubmissions = mysqlTable("upgrade_submissions", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  clientToken: varchar("clientToken", { length: 128 }).notNull(),
  totalUpgradeCost: decimal("totalUpgradeCost", { precision: 12, scale: 2 }),
  submittedAt: timestamp("submittedAt").defaultNow().notNull(),
  lockedAt: timestamp("lockedAt"),
  notes: text("notes"),
});

// ─── Client Uploaded Files ────────────────────────────────────────────────────
export const clientFiles = mysqlTable("client_files", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  clientToken: varchar("clientToken", { length: 128 }).notNull(),
  fileName: varchar("fileName", { length: 512 }).notNull(),
  fileUrl: text("fileUrl").notNull(),
  fileKey: varchar("fileKey", { length: 512 }).notNull(),
  mimeType: varchar("mimeType", { length: 128 }),
  fileSizeBytes: int("fileSizeBytes"),
  uploadedAt: timestamp("uploadedAt").defaultNow().notNull(),
});

// ─── Change Requests ──────────────────────────────────────────────────────────
export const changeRequests = mysqlTable("change_requests", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  clientToken: varchar("clientToken", { length: 128 }).notNull(),
  category: varchar("category", { length: 128 }).notNull(),
  description: text("description").notNull(),
  status: mysqlEnum("status", ["pending", "reviewed", "actioned"]).default("pending").notNull(),
  adminNotes: text("adminNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── Types ────────────────────────────────────────────────────────────────────
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;
export type InclusionSection = typeof inclusionSections.$inferSelect;
export type UpgradeGroup = typeof upgradeGroups.$inferSelect;
export type UpgradeOption = typeof upgradeOptions.$inferSelect;
export type ChangeRequest = typeof changeRequests.$inferSelect;
export type ClientFile = typeof clientFiles.$inferSelect;
export type Quantities = typeof quantities.$inferSelect;
