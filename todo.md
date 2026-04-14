# B Modern Tender Portal — TODO

## Database Schema
- [x] Admin credentials table (shared username/password)
- [x] Projects table (all project fields + status + expiry)
- [x] Project inclusions sections table (room sections with title, text, image, position)
- [x] Quantities questionnaire table (all tile/fixture/joinery/electrical/flooring/stone fields)
- [x] Upgrade groups table
- [x] Upgrade options table (name, image, description, included/upgrade, price delta)
- [x] Client access tokens table (per-project magic-link style tokens)
- [x] Client upgrade selections table (with 14-day lock logic)
- [x] Client uploaded files table
- [x] Change requests table (admin inbox)

## Admin Backend
- [x] Admin login page (shared username + password, JWT session)
- [x] Admin dashboard — project list with status badges
- [x] Create/edit project form (all fields including hero image upload)
- [x] Project status workflow (Draft → Presented → Under Review → Accepted → Contract Creation → Contract Signed → Post Contract)
- [x] Tender expiry date field per project
- [x] Room-by-room inclusions builder (add/edit/reorder sections, image upload per section)
- [x] Quantities & allowances questionnaire form (tiles, fixtures, joinery, doors, electrical, flooring, stone, allowances)
- [x] Upgrade options builder (groups + options with image, description, price delta)
- [x] Generate client access link per project
- [x] Admin inbox — view change requests with project/client context
- [x] View client upgrade selections per project
- [x] Lock/unlock client portal per project

## Client Portal
- [x] Client access via unique token URL (per-project, no login required)
- [x] Premium hero section with project name, address, proposal number, base contract price
- [x] Room-by-room inclusions display (expandable accordion per room, images)
- [x] Upgrade selection flow (show description + price delta first, reveal image on click)
- [x] Running upgrade total summary
- [x] Submit upgrade selections (with 14-day / tender-lock enforcement)
- [x] File upload section (post-contract plan amendments)
- [x] Change request form (category selector + free-text)
- [x] Confirmation display after upgrade submission

## Notifications & Email
- [x] Email to operations@bmodernhomes.com.au on upgrade submission
- [x] Email confirmation to client on upgrade submission
- [x] Email to operations@bmodernhomes.com.au on file upload
- [x] Email to operations@bmodernhomes.com.au on change request submission

## Branding & Design
- [x] Playfair Display SC for all headings (Google Fonts)
- [x] Brand colour palette applied (Petrol Blue #203E4A, Black, White, Bluegum #6D7E94)
- [x] Premium proposal/brochure feel on client portal
- [x] Full mobile responsiveness (admin + client)
- [x] B Modern logo in admin sidebar and login page

## Tests
- [x] Admin auth test (me, logout, unauthorised access)
- [x] Project CRUD test (list with auth, list without auth)
- [x] Portal access tests (invalid token, draft blocked, valid token)
- [x] Inclusions, upgrades, inbox tests
- [x] 13 total tests passing

## Phase 2 — Portal Polish & PDF Export
- [x] Audit and fix admin login, dashboard, project form
- [x] Audit and fix inclusions builder, quantities, upgrade options
- [x] Audit and fix client portal — hero, inclusions, upgrade flow, file upload, change request
- [x] Polish client portal to premium brochure quality (full-bleed hero, typography, spacing)
- [x] Polish upgrade selection cards — reveal-on-click images, running total, mobile layout
- [x] Build branded PDF export — inclusions + upgrade summary + pricing
- [x] Add PDF download button to client portal
- [x] Add PDF generation to admin project view
- [x] Final mobile responsiveness pass

## Phase 2B — PDF Proposal Enhancements
- [x] Extend quantities questionnaire to include Exclusions list (items not in contract)
- [x] Extend quantities questionnaire to include PC Items (Prime Cost items with description + allowance amount)
- [x] Extend quantities questionnaire to include Provisional Sums (PS items with description + amount)
- [x] Add Plan Images upload tab to admin project detail
- [x] Add Company / About Us settings page in admin (description, credentials, contact details)
- [x] Build PDF generation server endpoint using puppeteer + chromium
- [x] PDF: Cover page with hero image and project details
- [x] PDF: About Us / Company section
- [x] PDF: Project Summary (address, type, base contract price, expiry)
- [x] PDF: Base Inclusions (room by room)
- [x] PDF: Exclusions section
- [x] PDF: PC Items section
- [x] PDF: Provisional Sums section
- [x] PDF: Upgrade Options summary
- [x] PDF: Plan Images page
- [x] Add PDF download button to client portal
- [x] Add PDF download button to admin project view
- [x] PWA: web app manifest with B Modern branding and icons
- [x] PWA: service worker for offline support
- [x] PWA: iOS and Android home screen install support for admin and client portal
- [x] PWA: splash screen and app icon using B Modern logo

## Bug Fixes
- [x] Fix admin login — sign in button does nothing on published URL (bmodernportal-imexqjpp.manus.space)

## Phase 3 — Future Enhancements
- [ ] Preliminary estimate calculator (port from bmodernhomes.com.au/get-a-quote/)
- [ ] Buildxact BOQ integration
- [ ] Client email + password login option
- [ ] Multi-project client accounts

## Phase 3 — Master Package Library

- [x] Add master_packages and master_package_items tables to DB schema
- [x] Seed 3 master packages: Built for Excellence, Tailored Living, Signature Series with all items
- [x] Add tRPC procedures: list packages, get package detail, applyPackage to project
- [x] Admin: "Apply Standard Package" button on Inclusions tab — opens modal to select package and apply
- [x] Applying a package creates editable project-level inclusions (does NOT link back to master template)
- [x] Client portal: package selection screen as first step (shows key inclusions, visuals, key differences)
- [x] Mark "Tailored Living" as Recommended on client portal
- [x] Find and upload product images for each package (Caroma, ABI, Westinghouse, SMEG, Fisher & Paykel)
- [x] Store package images in DB and display on client portal package cards
- [x] Add selectedPackageId to projects table for persistent client selection
- [x] Add portal.getPackages, portal.selectPackage, portal.getPackageDetail procedures
- [x] Package comparison table on client portal (all 10 key differences)

## Phase 4 — Full System Refactor (Category → Child Items → Options)

### Database
- [ ] Add `categories` table (parent sections per project: Kitchen, Bathrooms, Electrical, etc.)
- [ ] Add `line_items` table (child items under each category: Downlights, Basin Mixers, etc.)
- [ ] Add `item_options` table (options under each line item: Standard / Upgrade 1 / Upgrade 2 / Custom)
- [ ] Add `custom_product_requests` table (client custom requests with admin status workflow)
- [ ] Add `client_item_selections` table (which option the client selected per line item)

### Backend
- [ ] Auto-populate new project with Built for Excellence baseline categories + items + options on creation
- [ ] tRPC procedures: categories CRUD, line_items CRUD, item_options CRUD (admin)
- [ ] tRPC procedures: portal.getCategories, portal.getLineItems, portal.getItemOptions
- [ ] tRPC procedures: portal.selectOption (client selects an option), portal.getMySelections
- [ ] tRPC procedures: portal.submitCustomRequest, admin.listCustomRequests, admin.priceCustomRequest
- [ ] Remove old package selection screen from client portal (Built for Excellence is always baseline)

### Admin UI
- [ ] Admin project detail: Categories tab replaces Inclusions tab (category → items → options tree)
- [ ] Admin can add/edit/delete categories, line items, and options per project
- [ ] Admin custom product request inbox: list requests, set price, change status
- [ ] When admin prices a custom request, it updates the client portal total

### Client Portal
- [ ] Fix client portal access link (invalid/expired page — highest priority)
- [ ] Page 1: Welcome / Proposal Summary (branding, client name, address, base price, hero image)
- [ ] Page 2: Room-by-room selections (expandable categories → child items → option cards with image/description/price delta)
- [ ] Page 3: Live running total panel (base contract + selected upgrades + custom requests + revised total)
- [ ] Custom product request form per line item (product name, brand, supplier link, image upload, qty, room, notes)
- [ ] Custom request status visible to client (submitted / under review / priced / approved / declined)
- [ ] When custom request is priced and approved, it updates the live total

## Phase 5 — 3-Tier Pricing Engine

### Pricing Rules (Global, Set Once)
- [ ] Add `upgrade_pricing_rules` table: itemKey, label, category, unit (each/lm/m2/fixed), tier1Qty, tier2Qty, tier3Qty, tier2CostPerUnit, tier3CostPerUnit, tier2Description, tier3Description, tier2ImageUrl, tier3ImageUrl
- [ ] Seed default pricing rules for all line items (Downlights, Power Points, Tapware, Appliances, Benchtop, Joinery, etc.)
- [ ] Admin: Global Pricing Rules page — table view of all rules, editable inline (cost per unit, descriptions, images)
- [ ] Admin nav: add "Pricing Rules" link in sidebar

### Pricing Engine (Per Project)
- [ ] Add `client_item_selections` table: projectId, clientToken, itemKey, selectedTier (1/2/3), createdAt
- [ ] Server function: calculatePackagePrices(projectId) — reads base price + quantities + pricing rules → returns { tier1Total, tier2Total, tier3Total, lineItems[] }
- [ ] tRPC procedure: projects.getPackagePrices(projectId) — admin view of calculated totals
- [ ] tRPC procedure: portal.getPackagePrices(token) — client view of 3 package totals + all line items with tier options
- [ ] tRPC procedure: portal.saveItemSelection(token, itemKey, tier) — client selects a tier for an item
- [ ] tRPC procedure: portal.getMySelections(token) — returns client's current selections + custom total

### Client Portal Rebuild
- [ ] Remove package selection first screen (replace with 3-price comparison on welcome page)
- [ ] Page 1: Welcome + 3 package price cards (Base / Tailored / Signature with auto-calculated totals) + "Start from this package" CTA
- [ ] Page 2: Room-by-room item selection — categories expand to show line items, each item shows 3 tier options (Standard included / Tier 2 upgrade / Tier 3 upgrade) with price delta, image, description
- [ ] Page 3: Live running total panel (sticky sidebar or bottom bar) — base price + upgrade deltas + revised total, updates instantly on selection
- [ ] Client can submit their final selections
- [ ] Fix client portal access link (invalid/expired page bug)

## Phase 6 — Job Creation Wizard

- [ ] Rebuild AdminProjectForm as a 3-step wizard (Step 1: Client & Project, Step 2: Pricing & Quantities, Step 3: Hero Image & Notes)
- [ ] Step progress indicator at top with visual stepper (Step 1 of 3, etc.)
- [ ] Per-step validation: required fields must be filled before advancing to next step
- [ ] Step 1: Client Name, Client Email, Project Address, Proposal Number, Project Type, Build Type, Tender Expiry
- [ ] Step 2: Base Contract Price, Estimate Min/Max, Quantities (downlights, power points, AC kW, joinery LM, etc.)
- [ ] Step 3: Hero Image upload, Internal Notes, Status selector
- [ ] On completion: auto-apply Built for Excellence baseline inclusions to the new project
- [ ] Edit mode: all fields accessible (no wizard restriction)

## Phase 7 — BOQ Upload + AI Extraction

- [ ] Add boq_documents table to schema (projectId, fileKey, fileUrl, fileName, mimeType, status, extractedAt)
- [ ] Add boq_items table (boqDocumentId, category, description, unit, quantity, isConfirmed)
- [ ] Add S3 upload endpoint for BOQ files (PDF/Excel, max 16MB)
- [ ] Add AI extraction tRPC procedure (server-side, reads file from S3, calls LLM to extract items)
- [ ] LLM extracts: category (Preliminaries/Structural/Internal), description, unit, quantity
- [ ] LLM also maps extracted quantities to known quantity fields (downlights, tiles m², etc.)
- [ ] Admin review UI: upload BOQ → show extracted items table → edit/confirm → save
- [ ] "Auto-fill Quantities" button: applies extracted quantities to project Quantities tab
- [ ] Client portal: Base Specification section showing confirmed BOQ items by category (non-editable)
- [ ] Add BOQ tab to admin project detail page

## Phase 8 — Terms & Conditions

- [ ] Add terms_and_conditions table to schema (content, updatedAt) — single row
- [ ] Add admin tRPC procedures: getTerms, updateTerms
- [ ] Add T&Cs editor page in admin settings (rich text editor)
- [ ] Add T&Cs acknowledgement gate on client portal (must scroll + tick before accessing proposal)
- [ ] Add portal_tc_acknowledgements table (projectToken, acknowledgedAt, ipAddress)
- [ ] Include T&Cs in PDF proposal export

## Phase 9 — Electrical Upgrade Quantities in Pricing Rules

- [ ] Add tier2Qty and tier3Qty columns to upgrade_pricing_rules table (for per-unit items)
- [ ] Update Pricing Rules UI to show Tier 2 qty and Tier 3 qty fields for electrical items
- [ ] Update pricing engine: T2 uplift = (T2qty - T1qty) × T2unitPrice; T3 uplift = T3qty × T3unitPrice
- [ ] Update portal getPackagePrices to use new quantity-based calculation for electrical

## Base Inclusions Restructure (HIGHEST PRIORITY)

- [ ] Add `inclusionCategories` table (id, projectId, name, position, imageUrl)
- [ ] Add `inclusionItems` table (id, categoryId, projectId, name, qty, unit, description, specLevel, upgradeEligible, included, boqFieldKey, position)
- [ ] Generate and apply migration SQL for new tables
- [ ] Add tRPC procedures: listInclusionCategories, upsertInclusionItem, deleteInclusionItem, addInclusionCategory, deleteInclusionCategory, reorderItems
- [ ] Add BOQ auto-population: after BOQ extraction push mapped quantities into inclusionItems
- [ ] Build Base Inclusions master screen UI with category cards and child item rows
- [ ] Inline editing for qty, description, spec, unit on each item row
- [ ] Include/exclude checkbox toggle per item
- [ ] Add custom inclusion item button per category
- [ ] Add custom category button
- [ ] Update upgrade engine to read quantities only from checked inclusionItems
- [ ] Update client portal to display Base Inclusions categories and items
- [ ] Update PDF to use inclusionItems as inclusions schedule
- [ ] Phase out Quantities tab (hide from nav, keep data)

## Phase 7 — Wizard BOQ Upload Step

- [ ] Add Step 4 (BOQ Upload) to the new project creation wizard — upload PDF/Excel BOQ right after creating the project
- [ ] Step 4 is optional (can skip) but shows the upload UI immediately after project is saved
- [ ] After BOQ upload in wizard, trigger AI extraction and show a preview before finishing

## BOQ as Contract Items (PRIORITY)

- [ ] Add `rate` and `amount` columns to inclusionItems table
- [ ] Update BOQ extraction to import ALL line items into inclusionItems grouped by BOQ category
- [ ] BOQ import: create category per BOQ category, create child item per BOQ line item (with qty, unit, description)
- [ ] Allow re-import: re-running BOQ upload merges/updates items (does not duplicate)
- [ ] Update BaseInclusionsTab to show rate and amount columns with inline editing
- [ ] Update client portal to render full contract schedule from inclusionItems
- [ ] Update PDF to render full contract schedule from inclusionItems

## AI Wording Suggestions for Base Inclusions

- [x] Backend: Add `inclusionMaster.suggestWording` tRPC procedure — takes item name, category, qty/unit and returns 3 professional tender-quality description options
- [x] Frontend: Add "AI Suggest" sparkle button next to description field in BaseInclusionsTab item editor
- [x] Frontend: Show inline suggestion panel with 3 AI-generated wording options, each with "Use this" button
- [x] Frontend: Clicking "Use this" populates the description field and closes the panel
- [x] Frontend: Show loading spinner while AI is generating suggestions
- [x] Update client portal to use getBaseInclusions (inclusionItems/inclusionCategories) instead of old inclusions
- [x] Update PDF generator to pull from inclusionItems/inclusionCategories tables

## Bug Fix: BOQ-to-Base-Inclusions Pipeline
- [x] Verify isBoqImported column exists in live DB, apply migration if not
- [x] Fix BOQ extraction delete query that fails on isBoqImported column
- [x] BOQ upload should populate Base Inclusions as "Built for Excellence" (Tier 1) base package items
- [x] Added "Import to Base Inclusions" button in BOQ tab for re-importing existing extracted items
- [x] Ensure Base Inclusions tab displays BOQ-imported items after upload — verified 82 items across 7 categories
- [x] Verify AI wording suggestion button works on BOQ-imported items — tested with Long Service Levy, 3 options generated

## Client Portal Rebuild — Polished B Modern Branded Experience
- [x] Remove package selection gate screen — go straight to main portal
- [x] Show Base Inclusions (Built for Excellence Tier 1) FIRST as the base tender presentation
- [x] Rework Upgrades section: show tier-based items with cross-tier pick-and-choose
- [x] Each upgrade item shows price delta (+ or -) and clients can select from any tier
- [x] Sticky running total bar always visible: Base Contract + Selected Upgrades = Estimated Total
- [x] Add "Request Custom Item" form for items not on the list
- [x] Submit selections for review sends to admin with notification
- [x] Admin can respond to submissions with a final price
- [x] Client sees admin's price response on their portal
- [x] DB schema: add custom_item_requests table
- [x] DB schema: add adminResponsePrice and adminResponseNotes to upgrade_submissions
- [x] Polished B Modern branding throughout (Playfair Display SC, Lato, petrol/cream palette)
- [x] Interactive and responsive design (mobile + desktop)
- [x] Smooth animations and micro-interactions

## Admin-to-Client Chat Feature
- [x] Add `project_messages` DB table (projectId, senderType admin/client, senderName, message, createdAt)
- [x] Add backend tRPC procedures: sendMessage, listMessages (both admin and portal routers)
- [x] Build chat panel in admin project detail (Client Portal tab)
- [x] Build chat panel in client portal (floating button + drawer)
- [x] Messages timestamped and attributed (B Modern team vs Client)
- [x] Polling for new messages (5s admin, 10s client)

## Admin UI Fixes
- [x] Wire SubmissionResponseCard into AdminProjectDetail
- [x] Wire CustomItemRequestsAdmin into AdminProjectDetail

## Product Images on Every Inclusion Item
- [x] Add `imageUrl` column to `inclusion_items` table
- [x] Update BaseInclusionsTab admin UI: add image upload button per item row
- [x] Admin can upload product photos for taps, basins, downlights, cornices, appliances, etc.
- [x] Client portal: display product images alongside each inclusion item (visual card layout)
- [x] Upgrade items also show product images for visual comparison
- [x] Gallery-style interactive layout — items as visual cards, not just text rows

## Complete Pricing Audit + Plus Options
- [x] Audit all 3 upgrade tiers — all 24 rules have T2 and T3 pricing complete
- [x] Verify master packages have complete item lists (36, 34, 35 items respectively)
- [x] Ensure pricing rules cover all 10 categories (Electrical, Bathrooms, Kitchen, Flooring, Stone, Joinery, Doors, Facade, Insulation, AC)
- [x] Seed quantities for project 120001 so pricing engine calculates correctly
- [ ] Add "Plus" options — additional add-on items clients can select beyond the 3 tiers
- [ ] Admin UI for managing Plus options with pricing
- [ ] Client portal shows Plus options alongside tier upgrades
- [x] Update logos throughout: white logo for dark backgrounds, monochrome for light backgrounds

## Phase 10 — Remaining Work (Context Continuation)
- [ ] Wire Plus Options into client portal (upgrade_groups/upgrade_options from admin CRUD)
- [ ] Plus Options: client can toggle individual options on/off with price delta
- [ ] Plus Options: include in running total calculation
- [ ] Fix AdminPricingRules mutation bug: tier2Qty/tier3Qty not sent in payload
- [x] Verify end-to-end flow and run all tests
- [ ] Final UI polish pass

## Pricing Rules Audit — Missing Categories from Tier PDFs
- [x] Audit all 3 tier PDFs against current pricing rules — identify every missing category/item
- [x] Add missing category: Plasterboard (Walls, Ceilings, Cornice, Square Set Windows/Doors)
- [x] Add missing category: Render (External Walls, Finish, Face Brick)
- [x] Add missing category: Staircase (Staircase type, Balustrade)
- [x] Add missing category: Fixout Material (Doors, Door Hardware, Skirting Boards, Architraves)
- [x] Add missing category: Insulation (Ceiling, Walls, Sound Insulation)
- [x] Add missing items: PC Items — all tapware/sanitaryware individual items (Basin, Toilets, Shower, Baths, Kitchen Sink, Laundry Sink, Kitchen/Laundry Mixer)
- [x] Add missing items: Electrical — Wall Lights, Data Points, Switches, Smoke Detectors, Exhaust Fans, Automation
- [x] Add missing items: Tiles — Kitchen Splashback (T1 only), all tile allowance levels
- [x] Verify all tier descriptions match the PDF specifications exactly
- [x] Update pricing engine to handle new categories

## Bug Report — Admin Inclusions Section Regression
- [ ] Investigate admin inclusions section — AI wording feature may be broken/missing
- [x] Fix any regressions in the inclusions section
- [x] Verify AI wording generation works end-to-end

## Bug — Inclusions Tab & Quantities Tab
- [x] Remove "Quantities" tab from AdminProjectDetail — quantities come from BOQ
- [x] Ensure Inclusions tab uses BaseInclusionsTab component (with AI wording, categories, BOQ import)
- [x] Verify the deployed version matches the dev version after checkpoint

## Client Portal Preview Screen
- [x] Add preview button/mode in admin Client Portal tab
- [x] Build preview that shows exactly what the client will see (inclusions, upgrades, plus options, running total)
- [x] Preview should be read-only (no submit, no actual selections saved)
- [x] Allow admin to close preview and return to admin view

## Starting Tier Per Project
- [x] Add startingTier field to projects schema (enum: tier1, tier2, tier3, default tier1)
- [x] Run migration to add the column
- [x] Add starting tier selector to project create/edit form
- [x] Pass startingTier to client portal via getProject response
- [x] Filter upgrade selections in client portal to only show tiers >= startingTier
- [x] Update pricing engine to calculate deltas from the starting tier (not always from tier1)

## Client Selections PDF Summary
- [x] Build server-side PDF generation for client selections summary
- [x] PDF should show: base inclusions, selected upgrades with tier names and pricing, plus options, final total
- [x] Add download button in client portal after submission (and in admin response view)
- [x] PDF available at all stages: pre-submit, under review, and after admin response

## Bug Fix — Description Column Too Short
- [x] Extend inclusion_items.description from varchar(255) to TEXT for long descriptive tender wording
- [x] Also check inclusion_items.name column length — extended to TEXT
- [x] Also check upgrade_pricing_rules description columns — tier labels extended to TEXT, label to varchar(512)

## Client Sign-Off Feature (DocuSign-Level)
- [x] Add signoff fields to upgrade_submissions table (signoffName, signoffSignature, signedOffAt)
- [x] Add full audit trail fields: signoffIp, signoffUserAgent, documentRefId (unique hash)
- [x] Build multi-step guided sign-off flow: Step 1 Review Selections → Step 2 Accept Terms → Step 3 Draw Signature
- [x] Legal declaration text with explicit checkbox acknowledgement
- [x] Digital signature pad (draw signature with stylus/finger/mouse)
- [x] Capture IP address and browser user agent on server side
- [x] Generate unique document reference ID (e.g. BM-2026-XXXX) for each signed submission
- [x] Build signed PDF certificate: selections summary + signature block + audit trail + document ref + timestamp
- [x] Lock portal after signing — no modifications possible
- [x] Admin can see full sign-off details (name, signature, IP, timestamp, document ref)
- [ ] Email confirmation to client with signed PDF attached (future enhancement)

## Signed Contract Upload (Admin)
- [x] Add signedContractUrl and signedContractUploadedAt fields to projects table
- [x] Add "Signed Contract" upload section in admin project detail
- [x] Admin can upload the signed building contract PDF
- [ ] Client portal shows signed contract status/download when available (future enhancement)

## Client Portal Status Timeline
- [x] Build visual status timeline component for client portal
- [x] Show key stages: Proposal Issued → Tender Signed → Contract Signed → Construction Started → Frame → Lock-Up → Fix-Out → Practical Completion → Handover
- [x] Highlight current stage and show completed stages with checkmarks
- [x] Show dates for completed stages where available
- [x] Integrate timeline into the client portal page (visible after hero section)
- [x] Ensure timeline data comes from project status, submission fields, and new milestone columns
- [x] Add milestone management UI in admin Client Portal tab (set construction progress dates)
- [x] Add milestone columns to projects table (constructionStartedAt, framingCompletedAt, lockupCompletedAt, fixoutCompletedAt, completedAt, handoverAt)
- [x] Add admin updateMilestones and getTimeline tRPC procedures
- [x] Add portal getTimeline tRPC procedure for client access
- [x] Auto-derived milestones: Proposal Issued (createdAt), Tender Signed (signedOffAt), Contract Signed (signedContractUploadedAt)
- [x] Manual milestones: Construction Started, Frame, Lock-Up, Fix-Out, Practical Completion, Handover
- [x] Write vitest tests for milestones (11 tests passing)

## Inclusions Pre-Population from Starting Tier
- [x] When "Seed Standard Inclusions" is clicked, pre-populate inclusions based on the project's starting tier
- [x] Starting tier determines which tier description from pricing rules is used as the default inclusion wording
- [x] BOQ items merge with tier-based inclusions to form the complete tender
- [x] Ensure the inclusions tab reflects the correct tier specifications automatically
- [x] seedDefaults procedure reads pricing rules and uses tier1Label/tier2Label/tier3Label based on startingTier
- [x] Items marked as upgradeEligible for cross-tier selection in client portal
- [x] Write vitest tests for seed defaults with pricing rules (4 tests passing)
