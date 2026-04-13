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

## Phase 2 — Future Enhancements
- [ ] Preliminary estimate calculator (port from bmodernhomes.com.au/get-a-quote/)
- [ ] Buildxact BOQ integration
- [ ] Client email + password login option
- [ ] PDF proposal export
- [ ] Multi-project client accounts
