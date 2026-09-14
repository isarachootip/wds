# Project: WDS Lead Management & CRM Pipeline

## Architecture
- **Framework & Runtime**: Next.js 15 App Router (`apps/web`), React 19, Fastify/NestJS (`apps/api`), Drizzle ORM (`@wds/db`), PostgreSQL / Supabase, Tailwind CSS, Radix UI, Lucide Icons.
- **Monetary Precision**: Strictly zero-float, integer Satang (`bigint`) with THB currency formatting.
- **Data Flow**:
  1. Omnichannel Ingestion (LINE OA, CTI Call, Store Walk-in, Web Desk) -> Deduplication -> Lead (`new`).
  2. Qualification & Follow-up -> Contacted -> Qualified -> Site Visit Requested.
  3. Site Visit Lifecycle -> Appointment Booking -> Travel Approval -> Site On (GPS check-in) -> Work Notes -> Check-out (Signature).
  4. E-ordering Integration -> BoQ conversion -> Quotation (`QT-YYYYMM-NNNN`) -> Attached to Lead -> Lead (`quoted`).
  5. Deal Closing:
     - **Close Win**: Lead (`won`) -> Sales Order (`SO-YYYYMM-NNNN`) -> Dynamic Credit Check (`awaiting_payment` or `credit_hold`) -> Payment & Delivery handoff.
     - **Close Lost**: Lead (`lost`) -> Mandatory Lost Reason validation (`LOST_REASONS` enum).
- **Presentation Layer**: Unified Leads Hub at `/wds/leads` (View Switcher: [Kanban | Table], quick search, multi-facet filters) and Lead Detail Workbench at `/wds/leads/[id]` (Progress Stepper, Activity Logger, Unified Timeline, Site Visit Card, Quotation Card, Close Win/Lost Modals).

---

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| F01 | Omnichannel Inbound Lead Capture | Capture leads from LINE OA, Telephony, Store Walk-in, and Web Desk with source tags | M2 | R1, SOW §2.2 |
| F02 | Compound Deduplication | Prevent duplicate leads using `(taxId, phoneNumber, postalCode)` | M2 | SOW §2.2 |
| F03 | Unified Leads Hub View Switcher | Toggle between Kanban Pipeline and Data Table view at `/wds/leads` without leaving page | M2 | AC 1, vsite.online/leads |
| F04 | Multi-facet Search & Filtering | Quick debounced text search, status pills, source filter, AE owner, and stale (>7d) toggle | M2 | AC 1, R1 |
| F05 | Enhanced Kanban Pipeline | Stage deal value sums, lead counts, draggable cards with customer details and urgency | M2 | AC 1, R1 |
| F06 | Leads Data Table | Responsive table with status badges, Thai formatting, quick call action, and detail links | M2 | AC 1, R1 |
| F07 | Lead Detail Query Extension | Fetch lead with attached quotations, site visits, appointments, and job check-in metrics | M1 | Backend Survey |
| F08 | Visual Stage Progress Stepper | Interactive stepper (`[New] -> [Contacted] -> [Qualified] -> [Site Visit] -> [Quoted] -> [Won/Lost]`) | M3 | AC 2, R2 |
| F09 | Quick Activity Logger | One-click logging for phone call outcomes, LINE chats, and internal AE notes | M1, M3 | AC 2, R2 |
| F10 | Chronological Unified Timeline | Combined timeline of activities, call logs, follow-up due dates, and stage changes | M3 | AC 2, R2 |
| F11 | Follow-up Task Scheduling | Set next action date/time, channel (Phone, LINE, Meeting), and assigned AE | M3 | R2 |
| F12 | Site Visit Scheduling & Assignment | Book site visit appointment from lead detail and assign surveyor/AE | M1, M3 | AC 3, R3 |
| F13 | Site Visit Travel Approval | Branch Manager approval workflow for surveyor travel authorization | M1, M3 | AC 3, R3 |
| F14 | Field Check-in (Site On) Status | Record and display GPS coordinates, timestamp, and geofence validation | M1, M3 | AC 3, R3 |
| F15 | Field Work Notes & Requirements | Record on-site BoQ findings, truck clearance category, and photo count | M1, M3 | AC 3, R3 |
| F16 | Field Check-out & Signature | Complete site visit with check-out timestamp and sign-on-glass customer signature | M1, M3 | AC 3, R3 |
| F17 | E-ordering Quotation Reference Attachment | Form & action to link Quotation Number, Total Amount (satang), and Issue Date to Lead | M1, M3 | AC 4, R4 |
| F18 | Auto-transition to Quoted | Automatically transition lead to `quoted` status upon quotation attachment | M1 | R4 |
| F19 | Close Win Action & SO Generation | Close lead as `won`, generate Sales Order (`SO-YYYYMM-NNNN`), and bind quotation | M1, M3 | AC 5, R4 |
| F20 | WDS Credit Check Handshake | Trigger automated credit check on Close Win (`awaiting_payment` or `credit_hold`) | M1 | AC 5, R4 |
| F21 | WDS Payment & Delivery Handoff | Emit events and display status for downstream payment capture and ATP delivery dispatch | M1, M3 | AC 5, R4 |
| F22 | Close Lost Modal with Mandatory Reason | Enforce selection of valid loss reason (`PRICE_HIGH`, `COMPETITOR_CHOSEN`, etc.) | M1, M2, M3 | AC 5, R4 |
| F23 | State Machine Transition Verification | 100% automated test coverage for valid and invalid CRM state transitions | M4 | AC 6 |
| F24 | Zero Type & Lint Error Build Verification | Ensure `pnpm build` in `apps/web` compiles cleanly in standalone mode | M4 | AC 7 |

---

## Milestones

| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Core Data & CRM Backend Handshake | Query extensions (`getLeadById`), `attachQuotationToLeadAction`, `closeWinLeadAction`, `closeLostLeadAction`, `logLeadActivityAction` | None | DONE |
| M2 | Lead Management Hub UI (vsite.online style) | `/wds/leads`: View Switcher [Kanban \| Table], Quick Search, Multi-facet Filter Bar, Enhanced Kanban Board & Table View | M1 | DONE |
| M3 | Lead Detail Workbench, Timeline & Site Visit | `/wds/leads/[id]`: Stage Progress Stepper, Quick Activity Logger, Unified Timeline, Site Visit Card, Quotation Card, Close Win/Lost Modals | M1 | DONE |
| M4 | Final Integration, Test Suite & Build Pass | Full state machine automated test suite, E2E test suite pass (100%), Tier 5 Adversarial Coverage Hardening, and clean `next build` | M1, M2, M3 | DONE |

---

## Interface Contracts

### M1 ↔ M2 / M3: Server Actions & Query Contracts
- `getLeadById(id: string): Promise<LeadDetailWithRelations | null>`
  - Returns: Lead attributes + `activities[]` + `followUps[]` + `quotations[]` + `siteVisits[]` (with appointment and job check-in metrics).
- `attachQuotationToLeadAction(leadId: string, data: { quotationNumber: string, totalSatang: number, quotationDate: string, validUntil?: string }): Promise<{ success: boolean, quotationId?: string, error?: string }>`
  - Associates quotation with lead and transitions status from `qualified` or `site_visit_requested` to `quoted`.
- `closeWinLeadAction(leadId: string, quotationId?: string): Promise<{ success: boolean, orderId?: string, orderNumber?: string, creditStatus?: string, error?: string }>`
  - Sets lead status to `won`.
  - Creates Sales Order in `orders` (`SO-YYYYMM-NNNN`).
  - Calls `runAutoCreditCheckAction`.
- `closeLostLeadAction(leadId: string, lostReason: string, note?: string): Promise<{ success: boolean, error?: string }>`
  - Validates `lostReason` is in `LOST_REASONS` enum. Rejects empty string.
  - Updates `leads.status = 'lost'` and `leads.lostReason = lostReason`.
- `logLeadActivityAction(leadId: string, type: 'call' | 'line' | 'visit' | 'note', note: string): Promise<{ success: boolean, activityId?: string, error?: string }>`
  - Appends activity log and updates lead timestamp.

---

## Code Layout

```
apps/web/src/
├── app/(wds)/wds/
│   ├── leads/
│   │   ├── page.tsx                    # M2: Unified Leads Hub (Kanban + Table + Search + Filters)
│   │   ├── new/page.tsx                # Lead capture form
│   │   └── [id]/
│   │       ├── page.tsx                # M3: Lead Detail Workbench
│   │       ├── components/
│   │       │   ├── StageProgressStepper.tsx   # M3: Visual sales stage stepper
│   │       │   ├── QuickActivityLogger.tsx    # M3: Fast call/line/note logging
│   │       │   ├── QuotationCard.tsx          # M3: Attached E-ordering quotation reference & modal
│   │       │   ├── SiteVisitCard.tsx          # M3: Site visit appointment & field check-in status
│   │       │   └── CloseDealModals.tsx        # M3: Close Win and Close Lost modal dialogs
│   ├── pipeline/
│   │   └── KanbanBoard.tsx             # M2: Enhanced Kanban Board with stage sums & drop modals
├── modules/crm/
│   ├── actions.ts                      # M1: Server actions (attach quotation, close win, close lost, activity)
│   ├── queries.ts                      # M1: Query extensions (getLeadById with quotations & site visits)
│   ├── lead-machine.ts                 # State machine definition & guard conditions
│   └── lead-machine.test.ts            # M4: Automated unit & integration tests
packages/db/src/schema/
├── crm.ts                              # leads, leadActivities, followUps, siteVisits
├── ordering.ts                         # quotations, orders
└── billing.ts                          # customerCredit, creditChecks, deliveries
```
