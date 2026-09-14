# TEST_READY: WDS Lead Management & CRM Pipeline Test Suite

**Status**: ✅ READY (All Tests Passing)  
**Date**: 2026-09-13T12:06:00Z  
**Target File**: `apps/web/src/modules/crm/lead-pipeline.test.ts`  
**Test Runner**: Vitest v2.1.9 (`pnpm --filter @wds/app test`)  
**TypeScript Verification**: `tsc --noEmit` (Zero errors)  

---

## 1. Test Suite Summary

- **Total Test Files**: 17 passed (17)
- **Total Tests Across App**: 220 passed (220)
- **Lead Pipeline Specific Tests**: 73 passed (73)
- **Execution Time**: ~1.67s total runtime (Lead Pipeline: ~117ms)
- **Pass Rate**: 100%

---

## 2. 4-Tier Test Coverage Breakdown

### Tier 1: Feature Coverage (Happy Path in Isolation)
- **Feature 1.1: Lead State Machine Transitions (7 tests)**
  - `new` → `contacted` upon customer engagement.
  - `contacted` → `qualified` upon scope & budget validation.
  - `qualified` → `site_visit_requested` when field survey required.
  - `site_visit_requested` → `quoted` upon BoQ conversion.
  - `qualified` → `quoted` (direct catalog purchase skipping site survey).
  - `quoted` → `won` upon customer deal closing.
  - Any state (`new`, `contacted`, `qualified`, `site_visit_requested`, `quoted`) → `lost` with valid reason.
  - Audit log immutability and metadata tracking verified across all transitions.
- **Feature 1.2: Quotation Attachment Linking to Lead (5 tests)**
  - Sequential quotation numbering formatting (`QT-YYYYMM-NNNN`) and parsing.
  - Attachment from `qualified` state transitions lead to `quoted`.
  - Attachment from `site_visit_requested` state transitions lead to `quoted`.
  - Attaching quotation sets standard 30-day validity period (`validUntil`).
  - Quotation attachment automatically generates `quote_sent` activity log.
- **Feature 1.3: Activity Logging (5 tests)**
  - `call` activity logging with call notes and duration.
  - `line` activity logging with chat exchange summary.
  - `visit` activity logging with field survey observations and truck clearance.
  - `note` activity logging for internal sales memos.
  - Chronological ordering verified (activities stored and sorted descending).
- **Feature 1.4: Follow-up Task Scheduling (5 tests)**
  - Automated 24-hour initial follow-up generation on new lead creation.
  - Custom follow-up task creation with assignee, target datetime, and channel.
  - Follow-up state machine: `open` → `done` with completion note and `doneAt` timestamp.
  - Follow-up state machine: `open` → `skipped` when customer is unreachable.
  - Follow-up state machine validation rejecting invalid transitions (`done` → `open`).

### Tier 2: Boundary & Corner Cases (Adversarial & Edge Cases)
- **Boundary 2.1: Disallow Invalid State Transitions (9 tests)**
  - Direct skip `new` → `won` strictly rejected (`InvalidTransitionError`).
  - Direct skip `new` → `site_visit_requested` strictly rejected.
  - Direct skip `contacted` → `won` strictly rejected.
  - Backward transition `contacted` → `new` strictly rejected.
  - Backward transition `quoted` → `new` strictly rejected.
  - Terminal state `won` cannot transition to `lost` or `quoted`.
  - Terminal state `lost` cannot transition to `new` or `won`.
  - Backward transition `site_visit_requested` → `contacted` rejected.
  - Zero audit logs written on rejected transitions.
- **Boundary 2.2: Mandatory Lost Reason Validation (7 tests)**
  - Empty string `""` rejected with validation error.
  - Whitespace string `"   "` rejected with validation error.
  - `null` and `undefined` rejected with validation error.
  - Unrecognized/unlisted reason string rejected.
  - Valid standard Thai reasons in `LOST_REASONS` accepted.
  - Standard uppercase enum codes (`PRICE_HIGH`, `COMPETITOR_CHOSEN`, etc.) accepted.
  - Lead's original state preserved on invalid submission.
- **Boundary 2.3: Minimum Budget Boundary for Site Visit & Qualification (6 tests)**
  - Budget < 50,000 THB (4,999,999 satang) ineligible for site survey.
  - Boundary value exactly 50,000 THB (5,000,000 satang) eligible.
  - Budget > 50,000 THB eligible.
  - Zero satang and negative satang budgets rejected.
  - New customer credit threshold at 50,000 THB (5,000,000 satang) requires credit hold.
- **Boundary 2.4: Mock GPS & Distance Calculation Handling (6 tests)**
  - Surveyor within $\le 300\text{m}$ allowed to check in.
  - Boundary distance at exactly $300\text{m}$ allowed.
  - Distance $> 300\text{m}$ (e.g. $650\text{m}$) rejected with `GEO_DISTANCE_EXCEEDED`.
  - Distance $> 300\text{m}$ with Branch Manager supervisor override allowed but flagged.
  - Mock GPS detected (`isMockLocationEnabled = true`) strictly hard-blocked (`HTTP 403 ERR_GPS_SPOOFING_DETECTED`).
  - Format distance helper verified (<1km in meters, $\ge 1\text{km}$ in km).
- **Boundary 2.5: Quotation Satang Amount Boundary & VAT Rounding (6 tests)**
  - Zero satang quotation rejected.
  - Negative satang quotation rejected.
  - 7% VAT exclusive rounding at 1 satang $\to$ 0 satang VAT, total = 1 satang.
  - 7% VAT exclusive rounding boundary: 7 satang rounds down (0 satang VAT), 8 satang rounds up (1 satang VAT).
  - 7% VAT inclusive extraction: 107 satang extracts exactly 7 satang VAT.
  - Excessive bill discount safely capped at subtotal (cannot produce negative total).

### Tier 3: Cross-Feature Combinations (Pairwise Coverage)
- **Combination 3.1: Omnichannel Lead to Close Win (4 tests)**
  - Tested across all 4 channels: `store` (Walk-in), `line` (LINE OA), `phone` (Telephony CTI), and `other` (Web Desk).
  - Full handshake: Ingestion $\to$ 24h follow-up $\to$ Contacted $\to$ Qualified $\to$ Site Visit $\to$ Quotation Attached $\to$ Close Win $\to$ Sales Order generation $\to$ Credit check pass $\to$ `awaiting_payment`.
- **Combination 3.2: Omnichannel Lead to Close Lost (3 tests)**
  - Tested customer decline reasons: `PRICE_HIGH`, `COMPETITOR_CHOSEN`, `PROJECT_CANCELLED`.
  - Verifies status transition to `lost`, `lostReason` stored, and automatic cancellation of pending follow-ups.
- **Combination 3.3: Close Win with Credit Check Evaluation (5 tests)**
  - Scenario A (Credit Pass): Headroom sufficient $\to$ order created with status `awaiting_payment`.
  - Scenario B (Credit Hold - Limit Exceeded): Order total exceeds available credit $\to$ order created with status `credit_hold`.
  - Scenario C (Credit Hold - Overdue Invoices): Overdue balance $> 0$ $\to$ order created with status `credit_hold`.
  - Scenario D (Credit Reject - Frozen Account): `onHold = true` $\to$ credit `reject`, order status `credit_hold`.
  - Scenario E (Credit Soft Warn): Exposure between 80% and 100% $\to$ `soft_warn` alert emitted.

### Tier 4: Real-World Scenarios (5 Realistic Scenarios)
1. **Scenario 1: Omnichannel Walk-in Lead to Close Win (Full Lifecycle)**
   - Walk-in contractor at Mega-store Bangna (branch '0012').
   - Modulo 11 13-digit Tax ID validation and compound deduplication `(TaxID, Phone, PostalCode)`.
   - AE logs phone contact, marks `contacted`.
   - Budget 2,500,000 THB verified, marked `qualified`.
   - Site visit requested & BM travel approved.
   - Surveyor arrives: GPS verified within 85m (`isMockLocation = false`) $\to$ `checked_in`.
   - Field checklist, BoQ (cement & steel), 3 photos, touchscreen customer signature $\to$ `checked_out`.
   - Quotation calculated: Net 2,000,000 THB + VAT 7% = 2,140,000 THB $\to$ attached to lead $\to$ `quoted`.
   - Contractor OTP sign-off $\to$ Close Win $\to$ Sales Order `SO-202609-0012` $\to$ Credit check pass $\to$ `awaiting_payment`.
2. **Scenario 2: LINE OA Inbound to Close Lost (Declined with Reason)**
   - LINE OA customer inquiry for lightweight AAC blocks.
   - Lead created with `source: 'line'` and auto 24h follow-up.
   - AE calls within SLA, logs call activity, moves to `contacted` $\to$ `qualified`.
   - Standard order: skips site visit, generates direct quotation for 62,500 THB $\to$ `quoted`.
   - Follow-up call: customer found 5% lower price from local competitor.
   - Close Lost executed with mandatory reason `PRICE_HIGH`, notes recorded, open follow-up marked skipped.
3. **Scenario 3: High-Value Lead with Credit Hold**
   - Enterprise contractor for infrastructure project with 3,000,000 THB budget.
   - Qualified $\to$ site visit $\to$ Quotation issued for 2,500,000 THB.
   - Customer accepts quotation $\to$ Close Win executed.
   - Credit check evaluated: Credit limit 2,000,000 THB, outstanding 500,000 THB $\to$ available 1,500,000 THB. Order of 2,500,000 THB exceeds headroom by 1,000,000 THB.
   - Credit check returns `hold`, Order created with `status: 'credit_hold'`.
   - Order machine verifies `credit_hold` $\to$ `awaiting_payment` transition after approval.
4. **Scenario 4: AE Daily Follow-up Workbench (vsite.online style)**
   - Sales rep filters leads by "My Leads" and "Stale > 7 days".
   - Stale lead in `contacted` stage identified.
   - Quick Activity Logger: AE calls contractor, logs phone call outcome.
   - Follow-up scheduled for tomorrow 10:00 AM via LINE.
   - `updatedAt` touched, clearing stale flag.
   - Kanban board card advanced to `qualified`.
5. **Scenario 5: Direct Field Survey Check-out with Instant E-ordering QT Attached**
   - Surveyor assigned to site inspection in Nonthaburi.
   - GPS check-in verified at 45m distance without mock location.
   - Road clearance verified for 6-wheel crane truck.
   - BoQ lines entered (cement + fiber cement boards): 43,000 THB + 7% VAT (3,010 THB) = 46,010 THB.
   - Customer touchscreen signature captured $\to$ check-out completed.
   - Instant E-ordering quotation `QT-202609-0042` attached $\to$ lead auto-promoted to `quoted`.

---

## 3. Verification Commands

```bash
# Run the complete test suite
pnpm --filter @wds/app test

# Run TypeScript typecheck
pnpm --filter @wds/app typecheck
```

Both commands exit with code `0` and 0 errors.
