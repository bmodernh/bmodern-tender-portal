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
