# E2E Test Infra: WDS Lead Management & CRM Pipeline

## Test Philosophy
- Opaque-box, requirement-driven. Derives from `ORIGINAL_REQUEST.md` (Update 2026-09-13T11:49:44Z) and user acceptance criteria.
- Methodology: Category-Partition + Boundary Value Analysis (BVA) + Pairwise Combinatorial Testing + Real-World Workload Testing.

---

## Feature Inventory & Test Mapping

| # | Feature | Source | Tier 1 (Feature) | Tier 2 (Boundary) | Tier 3 (Cross-Feature) |
|---|---------|--------|:----------------:|:-----------------:|:---------------------:|
| F01 | Omnichannel Inbound Capture | ORIGINAL_REQUEST R1 | 5 | 5 | ✓ |
| F02 | Compound Deduplication | SOW §2.2 | 5 | 5 | ✓ |
| F03 | Unified Leads Hub View Switcher | AC 1, vsite.online/leads | 5 | 5 | ✓ |
| F04 | Multi-facet Search & Filtering | AC 1, R1 | 5 | 5 | ✓ |
| F05 | Enhanced Kanban Pipeline | AC 1, R1 | 5 | 5 | ✓ |
| F06 | Leads Data Table | AC 1, R1 | 5 | 5 | ✓ |
| F07 | Lead Detail Query Extension | Backend Survey | 5 | 5 | ✓ |
| F08 | Visual Stage Progress Stepper | AC 2, R2 | 5 | 5 | ✓ |
| F09 | Quick Activity Logger | AC 2, R2 | 5 | 5 | ✓ |
| F10 | Chronological Unified Timeline | AC 2, R2 | 5 | 5 | ✓ |
| F11 | Follow-up Task Scheduling | R2 | 5 | 5 | ✓ |
| F12 | Site Visit Scheduling & Assignment | AC 3, R3 | 5 | 5 | ✓ |
| F13 | Site Visit Travel Approval | AC 3, R3 | 5 | 5 | ✓ |
| F14 | Field Check-in (Site On) Status | AC 3, R3 | 5 | 5 | ✓ |
| F15 | Field Work Notes & Requirements | AC 3, R3 | 5 | 5 | ✓ |
| F16 | Field Check-out & Signature | AC 3, R3 | 5 | 5 | ✓ |
| F17 | E-ordering Quotation Attachment | AC 4, R4 | 5 | 5 | ✓ |
| F18 | Auto-transition to Quoted | R4 | 5 | 5 | ✓ |
| F19 | Close Win Action & SO Generation | AC 5, R4 | 5 | 5 | ✓ |
| F20 | WDS Credit Check Handshake | AC 5, R4 | 5 | 5 | ✓ |
| F21 | WDS Payment & Delivery Handoff | AC 5, R4 | 5 | 5 | ✓ |
| F22 | Close Lost Modal with Mandatory Reason | AC 5, R4 | 5 | 5 | ✓ |
| F23 | State Machine Transition Verification | AC 6 | 5 | 5 | ✓ |
| F24 | Zero Type & Lint Error Build Verification | AC 7 | 5 | 5 | ✓ |

---

## Test Architecture
- **Test Runner**: Vitest 2.1.9 (`pnpm --filter @wds/app test`) for unit/integration state machine & action tests; Playwright for browser UI flow validation.
- **Test Locations**:
  - `apps/web/src/modules/crm/lead-pipeline.test.ts`: CRM state transitions, quotation attachment, close win/lost actions, and credit check triggering.
  - `apps/web/src/modules/crm/lead-machine.test.ts`: Complete transition matrix and audit logging.
  - `apps/web/e2e/crm-lead-pipeline.spec.ts`: End-to-end browser tests for Kanban, Table, Modals, Site Visit, and Quotation.

---

## Real-World Application Scenarios (Tier 4)
| # | Scenario | Features Exercised | Complexity |
|---|----------|--------------------|------------|
| 1 | **Omnichannel Walk-in Lead to Close Win**: Store walk-in contractor -> Lead creation with dedupe -> AE contact -> Qualified -> Site visit booked & approved -> Mobile GPS check-in & check-out -> E-ordering QT attached -> Close Win -> SO generated -> Credit check passes -> Ready for Payment & Delivery | F01, F02, F08, F12, F13, F14, F15, F16, F17, F18, F19, F20, F21 | High |
| 2 | **LINE OA Inbound to Close Lost**: Customer inquires via LINE -> Inbound lead -> AE calls & logs activity -> Qualified -> Quotation sent -> Customer declines due to competitor price -> Close Lost with mandatory reason `PRICE_HIGH` -> Audit log recorded | F01, F09, F10, F17, F18, F22 | Medium |
| 3 | **High-Value Lead with Credit Hold**: Enterprise contractor -> Site survey completed -> Quotation 2,500,000 THB -> Close Win -> Customer credit exposure exceeded -> Order marked `credit_hold` -> Escalation to Branch Manager | F07, F12, F14, F16, F17, F19, F20 | High |
| 4 | **AE Daily Follow-up Workbench (vsite.online style)**: Sales rep filters leads by "My Leads" + "Stale >7d", opens quick call logger, logs conversation outcome, schedules next follow-up, drags card across Kanban stages | F03, F04, F05, F09, F10, F11 | Medium |
| 5 | **Direct Field Survey Check-out with Instant E-ordering QT**: Surveyor completes field laser measure, records truck clearance (10W), captures sign-on-glass, attaches E-ordering QT-202609-0042, lead auto-promotes to `quoted` | F12, F14, F15, F16, F17, F18 | Medium |

---

## Coverage Thresholds
- Tier 1: ≥5 test cases per feature (Happy-path isolation)
- Tier 2: ≥5 test cases per feature (Boundaries, empty inputs, invalid transitions, mock GPS rejection)
- Tier 3: Pairwise coverage across state transitions and module handshakes
- Tier 4: ≥5 realistic end-to-end application scenarios
