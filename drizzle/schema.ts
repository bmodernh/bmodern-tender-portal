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
  selectedPackageId: int("selectedPackageId"),
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
  // Air Conditioning
  acZonesQty: int("acZonesQty"),                          // number of AC zones
  acKw: decimal("acKw", { precision: 6, scale: 2 }),       // total kW capacity
  // Facade & External
  facadeCladdingM2: decimal("facadeCladdingM2", { precision: 8, scale: 2 }),
  // Insulation
  insulationCeilingR: decimal("insulationCeilingR", { precision: 4, scale: 1 }),  // e.g. 2.5
  insulationWallR: decimal("insulationWallR", { precision: 4, scale: 1 }),        // e.g. 1.5
  // Laundry Joinery
  laundryJoineryQty: int("laundryJoineryQty"),             // number of laundry cabinets
  // Appliances
  applianceSetsQty: int("applianceSetsQty"),               // number of full appliance sets (oven+cooktop+rangehood+DW)
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

// ─── Exclusions ──────────────────────────────────────────────────────────────
export const exclusions = mysqlTable("exclusions", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  description: text("description").notNull(),
  position: int("position").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── Provisional Sums ─────────────────────────────────────────────────────────
export const provisionalSums = mysqlTable("provisional_sums", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }),
  notes: text("notes"),
  position: int("position").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── Plan Images ──────────────────────────────────────────────────────────────
export const planImages = mysqlTable("plan_images", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  title: varchar("title", { length: 256 }),
  imageUrl: text("imageUrl").notNull(),
  fileKey: varchar("fileKey", { length: 512 }),
  position: int("position").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Company Settings (About Us / PDF branding) ───────────────────────────────
export const companySettings = mysqlTable("company_settings", {
  id: int("id").autoincrement().primaryKey(),
  aboutUs: text("aboutUs"),
  tagline: varchar("tagline", { length: 512 }),
  credentials: text("credentials"),
  phone: varchar("phone", { length: 64 }),
  email: varchar("email", { length: 320 }),
  website: varchar("website", { length: 256 }),
  address: text("address"),
  logoUrl: text("logoUrl"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── Master Package Templates ───────────────────────────────────────────────
export const masterPackages = mysqlTable("master_packages", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 256 }).notNull(),
  tier: mysqlEnum("tier", ["entry", "mid", "premium"]).notNull(),
  tagline: varchar("tagline", { length: 512 }),
  description: text("description"),
  isRecommended: boolean("isRecommended").default(false).notNull(),
  position: int("position").default(0).notNull(),
  heroImageUrl: text("heroImageUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const masterPackageItems = mysqlTable("master_package_items", {
  id: int("id").autoincrement().primaryKey(),
  packageId: int("packageId").notNull(),
  section: varchar("section", { length: 128 }).notNull(), // e.g. "PC Items", "Electrical", "Tiles"
  item: text("item").notNull(),
  imageUrl: text("imageUrl"),
  position: int("position").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Upgrade Pricing Rules (Global — set once, applies to every job) ────────────
// Each row represents one line item (e.g. Downlights) with tier 2 and tier 3 upgrade costs.
// tier2CostPerUnit / tier3CostPerUnit are the EXTRA cost vs tier 1 per unit (each/lm/m2/fixed).
// The quantities table provides the per-project count; engine multiplies qty × costPerUnit.
export const upgradePricingRules = mysqlTable("upgrade_pricing_rules", {
  id: int("id").autoincrement().primaryKey(),
  itemKey: varchar("itemKey", { length: 64 }).notNull().unique(), // e.g. "downlights"
  label: varchar("label", { length: 128 }).notNull(),             // e.g. "Downlights"
  category: varchar("category", { length: 64 }).notNull(),        // e.g. "Electrical"
  unit: mysqlEnum("unit", ["each", "lm", "m2", "fixed"]).default("each").notNull(),
  // Tier 1 (Built for Excellence) — baseline description only
  tier1Label: varchar("tier1Label", { length: 256 }),             // e.g. "25 LED downlights"
  tier1ImageUrl: text("tier1ImageUrl"),
  // Tier 2 (Tailored Living)
  tier2Label: varchar("tier2Label", { length: 256 }),             // e.g. "40 LED downlights"
  tier2CostPerUnit: decimal("tier2CostPerUnit", { precision: 10, scale: 2 }).default("0"),
  tier2ImageUrl: text("tier2ImageUrl"),
  tier2Description: text("tier2Description"),
  // For electrical items: Tier 2 upgraded quantity (e.g. 40 downlights vs 25 base)
  // Cost = (tier2Qty - base_qty) * tier2CostPerUnit
  tier2Qty: int("tier2Qty").default(0),
  // Tier 3 (Signature Series)
  tier3Label: varchar("tier3Label", { length: 256 }),             // e.g. "50 LED + smart scenes"
  tier3CostPerUnit: decimal("tier3CostPerUnit", { precision: 10, scale: 2 }).default("0"),
  tier3ImageUrl: text("tier3ImageUrl"),
  tier3Description: text("tier3Description"),
  // For electrical items: Tier 3 upgraded quantity (usually same as tier2Qty)
  // Cost = tier3Qty * tier3CostPerUnit (premium hardware, full count)
  tier3Qty: int("tier3Qty").default(0),
  position: int("position").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── Client Item Selections (which tier each client chose per line item) ─────────
export const clientItemSelections = mysqlTable("client_item_selections", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  clientToken: varchar("clientToken", { length: 128 }).notNull(),
  itemKey: varchar("itemKey", { length: 64 }).notNull(),  // matches upgradePricingRules.itemKey
  selectedTier: int("selectedTier").default(1).notNull(), // 1, 2, or 3
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── BOQ Documents (per-project Bill of Quantities uploads) ─────────────────────
export const boqDocuments = mysqlTable("boq_documents", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  fileName: varchar("fileName", { length: 256 }).notNull(),
  fileKey: text("fileKey").notNull(),
  fileUrl: text("fileUrl").notNull(),
  mimeType: varchar("mimeType", { length: 128 }).notNull(),
  status: mysqlEnum("status", ["uploaded", "extracting", "extracted", "confirmed", "error"]).default("uploaded").notNull(),
  extractionError: text("extractionError"),
  uploadedAt: timestamp("uploadedAt").defaultNow().notNull(),
  extractedAt: timestamp("extractedAt"),
});

// ─── BOQ Items (AI-extracted line items from a BOQ document) ─────────────────────
export const boqItems = mysqlTable("boq_items", {
  id: int("id").autoincrement().primaryKey(),
  boqDocumentId: int("boqDocumentId").notNull(),
  projectId: int("projectId").notNull(),
  category: varchar("category", { length: 64 }).notNull(), // "Preliminaries" | "Structural" | "Internal" | "External" | "Other"
  description: text("description").notNull(),
  unit: varchar("unit", { length: 32 }),          // e.g. "m2", "lm", "each", "item"
  quantity: decimal("quantity", { precision: 10, scale: 2 }),
  isConfirmed: boolean("isConfirmed").default(false).notNull(),
  // Mapped quantity field — if this item maps to a known quantities column
  mappedQuantityField: varchar("mappedQuantityField", { length: 64 }),
  position: int("position").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Inclusion Categories (master control — per project) ────────────────────────
export const inclusionCategories = mysqlTable("inclusion_categories", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  name: varchar("name", { length: 128 }).notNull(),  // e.g. "Electrical"
  imageUrl: text("imageUrl"),
  position: int("position").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── Inclusion Items (child rows under each category) ────────────────────────
export const inclusionItems = mysqlTable("inclusion_items", {
  id: int("id").autoincrement().primaryKey(),
  categoryId: int("categoryId").notNull(),
  projectId: int("projectId").notNull(),
  name: varchar("name", { length: 256 }).notNull(),       // e.g. "Downlights"
  qty: decimal("qty", { precision: 10, scale: 2 }),       // editable quantity
  unit: varchar("unit", { length: 32 }).default("each"),  // each / lm / m2 / item
  description: text("description"),                       // e.g. "LED downlights throughout home"
  specLevel: varchar("specLevel", { length: 128 }),       // e.g. "Builder Range"
  upgradeEligible: boolean("upgradeEligible").default(false).notNull(),
  included: boolean("included").default(true).notNull(),  // include/exclude checkbox
  boqFieldKey: varchar("boqFieldKey", { length: 64 }),    // matches quantities column e.g. "downlightsQty"
  rate: decimal("rate", { precision: 12, scale: 2 }),      // unit rate (for contract pricing)
  amount: decimal("amount", { precision: 12, scale: 2 }), // total amount (qty * rate or fixed)
  isBoqImported: boolean("isBoqImported").default(false).notNull(), // true = came from BOQ upload
  position: int("position").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── Terms & Conditions (global, single row, editable by admin) ──────────────────
export const termsAndConditions = mysqlTable("terms_and_conditions", {
  id: int("id").autoincrement().primaryKey(),
  content: text("content").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── Portal T&C Acknowledgements (client has read and accepted T&Cs) ─────────────
export const portalTcAcknowledgements = mysqlTable("portal_tc_acknowledgements", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  clientToken: varchar("clientToken", { length: 128 }).notNull(),
  acknowledgedAt: timestamp("acknowledgedAt").defaultNow().notNull(),
  ipAddress: varchar("ipAddress", { length: 64 }),
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
