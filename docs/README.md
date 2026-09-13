# Thai Watsadu Wholesale & Direct Sales (WDS) Documentation Portal

```
+===================================================================================================================+
|                                    THAI WATSADU WDS ARCHITECTURE DOCUMENTATION PORTAL                             |
|                               Enterprise B2B Wholesale & Omnichannel Commerce Platform                           |
+===================================================================================================================+
| Organization : CRC Thai Watsadu Company Limited (Central Retail Corporation)                                      |
| Purpose      : Unified Documentation Portal & Repository Master Navigation Guide                                 |
| Platform     : Modular Monolith (NestJS 10 Fastify) + Kafka Transactional Outbox + Mobile Offline-First SQLite  |
| Persistence  : PostgreSQL 16+ (ICU Thai th-TH-x-icu), Redis Cluster 7.2                                           |
| Statutory    : Thai Revenue Department (RD Section 86/4, 86/5, 86/10), ETDA TIS 1102-2559 e-Tax, PDPA B.E. 2562  |
| Status       : Enterprise Production Baseline (100% Verified & Approved)                                          |
+===================================================================================================================+
```

---

## 1. Executive Introduction & Welcome

Welcome to the **Thai Watsadu Wholesale & Direct Sales (WDS) System Documentation Portal**. 

Thai Watsadu (ไทวัสดุ), operating under Central Retail Corporation (CRC), is Thailand's leading home improvement and commercial building materials retail and distribution powerhouse. With more than 80 mega-stores across Thailand, specialized distribution centers including the Wang Noi Central Distribution Center (CDC), and direct-from-mill manufacturer supply networks, Thai Watsadu serves both retail consumers and large-scale commercial builders.

While Thai Watsadu's existing retail Point-of-Sale (POS) infrastructure excels in B2C transactions, commercial contractor, property developer, and infrastructure builder sales demand a dedicated B2B direct sales engine. The **Wholesale & Direct Sales (WDS) Platform** powers this high-value commercial commerce, handling:
- Multi-million Baht commercial transactions with multi-tier volume breaks, dynamic zone freight, and margin floor price guards.
- Mobile jobsite surveying, GPS geofenced check-ins ($\le 500$m), structural Bill of Quantities (BoQ) logging, and offline data capture.
- Real-time credit evaluation, aging debt hard stops ($>30$ days late), and Post-Dated Cheque (PDC) vault management.
- High-contention Available-To-Promise (ATP) stock reservations with two-phase locking (15-min TTL) and FEFO allocation for perishable cement lots.
- Full statutory compliance under Revenue Department of Thailand Section 86/4 (gapless sequential invoice numbering, satang rounding `ROUND_HALF_UP`, Thai Baht Text transcription, and post-posting immutability triggers).

---

## 2. Repository Documentation Architecture

The documentation repository is structured into two complementary architectural packages reflecting the initial system baseline and the follow-up omnichannel lead-to-delivery expansion:

```
c:/atgv/wds/
├── ORIGINAL_REQUEST.md                          # Initial Mandate (2026-09-09) & Follow-up Mandate (2026-09-11)
├── PROJECT.md                                   # Root Project Blueprint, Feature Catalog & Architecture Standards
├── README.md                                    # Root Repository Portal & Engineering Quick-Start Guide
│
└── docs/
    ├── README.md                                # [THIS DOCUMENT] Unified Documentation Portal Guide
    ├── 00_master_architecture_index.md          # Master Architecture Index, Traceability Matrix & Synthesis
    │
    ├── [ PACKAGE A: OMNICHANNEL LEAD-TO-DELIVERY SUITE (Follow-up Mandate — 2026-09-11) ]
    ├── 01_sow_business_process_and_delivery_framework.md  # Deliverable 01: SOW, 5 FSMs, RACI, WBS, S0-S12 (PM)
    ├── 02_system_architecture_and_integration_blueprint.md# Deliverable 02: C4 Model, 5 Sequences, Sync, NFRs (SA)
    ├── 03_technical_specifications_and_api_contracts.md   # Deliverable 03: 12 DDLs, OpenAPI Specs, 4 Tests (Dev)
    │
    └── [ PACKAGE B: WDS CORE BASELINE SPECIFICATIONS (Initial Mandate — 2026-09-09) ]
        ├── 01_project_management_delivery_framework.md    # Baseline PM Framework, 12 Epics & Drop List Protocol
        ├── 02_system_architecture_high_level_design.md    # Baseline System Architecture HLD & Interfaces I0a-I0e
        └── 03_technical_specifications_implementation_guidelines.md # Baseline DDLs, APIs & Testing Guidelines
```

---

### 2.1 Package A: Omnichannel Lead-to-Delivery Architecture Suite (Authoritative)

Codified under the follow-up mandate of **2026-09-11T06:17:28Z**, this suite provides complete end-to-end specifications for omnichannel commercial operations:

| Document Path | Document Title | Primary Role | Scope & Core Artifacts |
|---|---|---|---|
| **`00_master_architecture_index.md`** | **Master Architecture Index & Omnichannel Traceability** | Master Synthesis (M4) | Executive synthesis uniting PM, SA, and Dev; Master 29-Feature Traceability Matrix; 7 Architectural Invariants deep-dive; Enterprise Integration Topology; 7 Transferred M2 challenge resolutions; Governance stage-gates. |
| **`01_sow_business_process_and_delivery_framework.md`** | **Scope of Work (SOW), Business Process & Delivery Framework** | Project Manager (M1) | Wholesale business process definition across 5 operational phases; 5 Decoupled State Machines (Lead, Visit, QT, Credit, Delivery); 28-Activity RACI Matrix; WBS 1.0–6.0 & INT-01–08; 26-week S0–S12 roadmap (9 FTEs); CP1–CP5 Gates; P01–P09 Risk Matrix; 20-Item Drop List Protocol (§2.3); DoR/DoD & 5 Weekly Metrics. |
| **`02_system_architecture_and_integration_blueprint.md`** | **System Architecture & Flexible Integration Blueprint** | Solution Architect (M2) | Hybrid Modular Monolith + Event-Driven Outbox topology; C4 System Context, Container & Component diagrams; Enterprise Integration Architecture (INT-01–08 & I0a–I0e); 5 Core Sequence Flows; Offline-First WatermelonDB delta sync; Distributed Redis Idempotency FSM; Kafka Outbox + Debezium CDC; 5-Role RBAC; PDPA masking; HMAC SHA-256 Audit Trail. |
| **`03_technical_specifications_and_api_contracts.md`** | **Technical Specifications, Data Contracts & Concrete Test Suites** | Senior Technical Lead (M3) | Zero-Float engineering rules (`NUMERIC(18,4)`, `decimal.js`); 12 Production PostgreSQL 16+ DDL schemas with triggers and indexes; Complete OpenAPI 3.0 / RESTful contracts with RFC 7807 error envelopes; AST Zero-Float linter rule; Git commit regex `[FR-xx-xxx]`; 5-Gate CI/CD Pipeline; 4 Executable TypeScript/Jest Test Suites (Happy Path, Credit Block, Geofence Security, Inventory Concurrency); Resolution of 7 M2 technical challenges. |

---

### 2.2 Package B: WDS Core Baseline Architecture Suite

Codified under the initial baseline mandate of **2026-09-09T03:17:57Z**, these documents represent the foundational core engine specifications:

| Document Path | Document Title | Primary Role | Scope & Core Artifacts |
|---|---|---|---|
| **`01_project_management_delivery_framework.md`** | **Project Management & Delivery Architecture Framework** | Baseline PM | Foundational 26-week sprint schedule (S0–S12), 9-engineer capacity model (440 SP + 40 SP Buffer), Stage-Gates CP1–CP5, baseline 20-Item Drop List (§2.3), Risks P01–P09, RACI decision matrix, and 5 weekly metrics. |
| **`02_system_architecture_high_level_design.md`** | **System Architecture & High-Level Design (HLD)** | Baseline SA | Baseline C4 Architecture, Enterprise Interfaces I0a through I0e (Catalog feed, Store stock, CRM, POS, SAP S/4HANA), Core Domain Deep-Dives (Pricing, Credit, Inventory ATP, FEFO Cement Lots V2, Revenue Dept Tax Invoicing). |
| **`03_technical_specifications_implementation_guidelines.md`** | **Technical Specifications & Implementation Guidelines** | Baseline Dev | Baseline Tech Stack (NestJS 10, PostgreSQL 16, Redis 7.2, Kafka 3.6), Baseline DDL schemas, OpenAPI contracts, Coding standards, and Unit Test suites ($\ge 80\%$ coverage). |

---

## 3. Audience Navigation Guide & Role-Based Reading Paths

To maximize efficiency, stakeholders should navigate the documentation according to their role:

```
+===================================================================================================================+
|                                        STAKEHOLDER ROLE NAVIGATION GUIDE                                          |
+===================================================================================================================+
|  STAKEHOLDER ROLE          | PRIMARY READING PATH                                | RECOMMENDED ARTIFACTS          |
+----------------------------+-----------------------------------------------------+--------------------------------+
|  Executive Steering        | 1. docs/00_master_architecture_index.md (§1)        | - Executive Summary            |
|  Committee & Sponsors      | 2. docs/01_sow_business_process_and_delivery_... (§1)| - 26-Week Timebox & Capacity   |
|                            | 3. docs/README.md                                   | - Pilot Launch (3 Branches)    |
+----------------------------+-----------------------------------------------------+--------------------------------+
|  Project Managers &        | 1. docs/01_sow_business_process_and_delivery_...    | - S0–S12 Sprint Plan & WBS     |
|  Scrum Masters             | 2. docs/00_master_architecture_index.md (§3, §8)    | - Stage-Gates CP1–CP5          |
|                            | 3. docs/01_project_management_delivery_framework.md | - 20-Item Drop List Protocol   |
|                            |                                                     | - RACI Matrix & Weekly Metrics |
+----------------------------+-----------------------------------------------------+--------------------------------+
|  Enterprise Solution       | 1. docs/02_system_architecture_and_integration_...  | - C4 Context & Container Models|
|  Architects                | 2. docs/00_master_architecture_index.md (§4, §5, §6)| - 5 Sequence Diagrams          |
|                            | 3. docs/02_system_architecture_high_level_design.md | - INT-01–08 & I0a–I0e Adapters |
|                            |                                                     | - Transactional Outbox & CDC   |
+----------------------------+-----------------------------------------------------+--------------------------------+
|  Backend & Core Platform   | 1. docs/03_technical_specifications_and_api_...    | - 12 PostgreSQL DDL Schemas    |
|  Engineers                 | 2. docs/00_master_architecture_index.md (§4, §7)    | - OpenAPI 3.0 REST Contracts   |
|                            | 3. apps/wds-core/src/                               | - Redis Idempotency Lua FSM    |
|                            |                                                     | - Canonical Lock Ordering      |
+----------------------------+-----------------------------------------------------+--------------------------------+
|  Mobile & Frontend         | 1. docs/03_technical_specifications_and_api_... (§3)| - Mobile Sync APIs (/pull, /push|
|  Engineers                 | 2. docs/02_system_architecture_and_integration_... (§4)| - WatermelonDB SQLite Schemas  |
|                            | 3. apps/visit-mobile/                               | - Offline e-PoD & OTP Protocol |
|                            |                                                     | - Sign-on-Glass Capture        |
+----------------------------+-----------------------------------------------------+--------------------------------+
|  QA Automation & DevOps    | 1. docs/03_technical_specifications_and_api_... (§4,§5)|- 4 Concrete Test Suites      |
|  Engineers                 | 2. docs/00_master_architecture_index.md (§8.4)      | - 5-Gate CI/CD Pipeline        |
|                            | 3. docker-compose.yml                               | - Commit Regex [FR-xx-xxx]     |
|                            |                                                     | - AST Zero-Float Checker       |
+----------------------------+-----------------------------------------------------+--------------------------------+
|  Statutory Compliance &    | 1. docs/00_master_architecture_index.md (§4.5, §4.7)| - RD Sec 86/4 Gapless Invoicing|
|  Financial Auditors        | 2. docs/03_technical_specifications_and_api_... (§2.4)| - Immutability Trigger Checks  |
|                            | 3. docs/02_system_architecture_and_integration_... (§4)| - HMAC SHA-256 Audit Trail    |
|                            |                                                     | - Satang Banker's Rounding     |
+===================================================================================================================+
```

---

## 4. The Omnichannel Lead-to-Delivery Process Overview

The WDS platform powers an integrated, five-phase commercial continuum designed to remove operational silos between digital customer channels, field surveyors, commercial pricing, store inventories, and delivery logistics:

```
[ Phase 1: Inbound Lead Intake ]
  - Ingest from Line OA (INT-01), CTI Telephony (INT-02), or Walk-in Sales Desk (INT-03).
  - Perform Modulo 11 Thai Tax ID Check & Triple-Key De-dup (Tax ID, Phone, Postcode).
  - Trigger 2-Hour SLA Countdown & Store Catchment Sales Assignment.
             |
             v
[ Phase 2: Jobsite Survey & Mobility ]
  - Dispatch Site Visit to Surveyor Mobile App (INT-04).
  - Enforce GPS Geofencing Check-in (Haversine <=500m, high-risk <=200m). Reject Mock GPS.
  - Record Laser BLE Measurements, Structural BoQ, Road Clearances, and Photos offline.
  - Capture Customer Sign-on-Glass Digital Signature & Emit Closed-Loop Callback.
             |
             +---------------------------------------+
             |                                       |
             v                                       v
[ Branch A: Custom Quoting ]              [ Branch B: Field Check-out ]
  - Transform BoQ into E-ordering QT (INT-05). - Zero discretionary discount applied.
  - Calculate Dynamic Volume Breaks (E02).     - Instant site checkout closure.
  - Compute Zone Freight Matrix (4 Trucks).    - Transmit order directly to Credit
  - Apply Absolute Cost-Floor Margin Guard.      and Payment Settlement.
  - Enforce 4-Tier DOFA Approval Matrix.                     |
             |                                               |
             +-----------------------+-----------------------+
                                     |
                                     v
[ Phase 4: Instant Credit & Multi-Tender Settlement ]
  - Calculate Real-time Dynamic Exposure: AR + Orders + Reservations - PDC - CN.
  - Enforce Automated Soft/Hard Blocking (>100% credit limit or >30 days overdue).
  - Process Multi-Tender Payment: Trade Credit, Store POS Cash/Card, PromptPay QR, PDC.
  - Apply Upfront Cash ERP Settlement Flag (`ORDER_FULFILLMENT` vs `HISTORICAL_AR`).
                                     |
                                     v
[ Phase 5: High-Contention ATP & Delivery Dispatch ]
  - Sub-second Available-To-Promise (ATP) Reservation (15-min soft lease TTL).
  - Execute Canonical Lock Ordering (`ORDER BY sku ASC`) to eliminate SQL deadlocks.
  - Allocate FEFO Portland Cement Lots V2 (Broken pallets first, full pallets, aging trap free).
  - Assign Truck Manifest via 3rd-Party Carrier TMS (INT-08); record Weighbridge Tare/Gross.
  - Complete Driver Mobile e-PoD with 6-digit Customer OTP & 3 mandatory photos.
  - Generate Statutory Thai Revenue Code Section 86/4 Gapless e-Tax Invoice & SAP GL Outbox.
```

---

## 5. Core Engineering Invariants Summary

All engineers, reviewers, and automated CI/CD gates must strictly enforce the **Seven Core Architectural Invariants**:

1. **Zero-Float Precision Standard**:
   - Strictly ban IEEE 754 floating-point types (`FLOAT`, `DOUBLE`, JavaScript `number`) on monetary and physical amounts.
   - Use `NUMERIC(18,4)` for unit prices/surcharges, `NUMERIC(18,2)` for invoice totals/VAT, `NUMERIC(14,4)` for weights/quantities, and `NUMERIC(10,7)` for GPS coordinates.
   - Mandate `decimal.js` with Banker's Half-Up Rounding (`ROUND_HALF_UP`) and string-serialized JSON transfer.
   - Enforce via automated AST linter rule in CI/CD Gate 1.
2. **Distributed Idempotency Everywhere**:
   - Require `X-Idempotency-Key: <UUIDv4>` on all mutating endpoints.
   - Atomic Redis 7.2 Lua state machine managing `PENDING`, `COMPLETED`, and `FAILED` transitions with 24-hour TTL and HTTP 409 conflict guards.
3. **Event-Driven Transactional Outbox**:
   - Commit domain mutations and outbox records in the same atomic PostgreSQL transaction.
   - Stream events via Debezium CDC and Kafka 3.7+ with partition-key preservation and consumer idempotency.
4. **Offline-First Mobile Mobility**:
   - SQLite persistence via WatermelonDB on React Native field devices.
   - Bi-directional delta synchronization (Pull/Push) with deterministic conflict resolution and offline HMAC OTP verification.
5. **Cryptographic Audit Ledger**:
   - Append-only `audit_event_logs` with application-level `UPDATE`/`DELETE` revocation.
   - Stream-partitioned HMAC SHA-256 hash chaining allowing 100% parallel writes across independent aggregates.
6. **Temporal & Thai Locale Normalization**:
   - UTC storage (`TIMESTAMPTZ`), `Asia/Bangkok` (UTC+7) presentation rendering.
   - PostgreSQL ICU collation `th-TH-x-icu` for Royal Institute Thai alphabetical sorting.
7. **Revenue Department Section 86/4 Gapless Tax Invoicing**:
   - Dedicated `tax_invoice_counters` table with pessimistic row locks (`SELECT ... FOR UPDATE`).
   - Format: `INV-{Branch}-{YYYYMM}-{Seq06d}`.
   - Database trigger rejecting any mutation on `POSTED` invoices; certified Thai Baht Text transcription.

---

## 6. Developer Quick-Start & Testing Guide

### 6.1 Prerequisites
- **Node.js**: `v20.x LTS` (Iron)
- **Package Manager**: `pnpm v9.x`
- **Container Runtime**: Docker & Docker Compose v2.x
- **Databases**: PostgreSQL 16+ (with `icu` enabled) & Redis 7.2
- **Message Broker**: Apache Kafka 3.7+ (KRaft mode)

### 6.2 Local Development Environment Setup
```bash
# 1. Clone repository and install dependencies
git clone https://github.com/crc-thaiwatsadu/wds.git
cd wds
pnpm install

# 2. Start local infrastructure containers (PostgreSQL ICU, Redis, Kafka)
docker-compose up -d

# 3. Apply database schemas and seed test data
pnpm --filter @wds/db migrate:up
pnpm --filter @wds/db seed

# 4. Start WDS Core in development mode
pnpm --filter @wds/core start:dev
```

### 6.3 Executing Concrete Production Test Suites
The WDS codebase includes four production test suites validating the most critical commercial hazards:

```bash
# Run all test suites
pnpm test

# Run Test Suite 1: Happy Path Omnichannel E2E Flow
pnpm test apps/wds-core/test/omnichannel-happy-path.spec.ts

# Run Test Suite 2: Credit Limit Exceeded & Aging Debt Hard Block
pnpm test apps/wds-core/test/credit-risk-engine.spec.ts

# Run Test Suite 3: GPS Geofencing Mismatch & Mock Spoofing Rejection
pnpm test apps/wds-core/test/geofence-security.spec.ts

# Run Test Suite 4: High-Concurrency Stock Booking Contention (Canonical Lock Ordering)
pnpm test apps/wds-core/test/inventory-concurrency.spec.ts
```

### 6.4 Git Commit Conventions & Automated Quality Gates
Every Git commit must link directly to an approved Requirement ID from SRS v1.1:

```bash
# Valid Commit Message Format:
git commit -m "[FR-01-001] Implement Modulo 11 Thai Tax ID checksum validator"
git commit -m "[FR-07-001] Add canonical SKU sorting to prevent PostgreSQL row deadlocks"

# Invalid Commit Messages (Blocked by Husky pre-commit hook):
git commit -m "Fix inventory deadlock bug"        # Fails: Missing [FR-xx-xxx] tag
git commit -m "[BUG-12] Updated pricing calculation" # Fails: Non-standard bracket tag
```

The CI/CD pipeline enforces 5 automated quality gates on every pull request:
1. **Gate 1 (Static Analysis)**: `pnpm lint` (ESLint AST Zero-Float rule & TypeScript strict check).
2. **Gate 2 (Unit & Domain)**: `pnpm test:unit` (Domain rules, Pricing engine, Credit formula; $\ge 80\%$ coverage).
3. **Gate 3 (Integration)**: `pnpm test:integration` (Testcontainers PostgreSQL 16 ICU & Redis concurrency).
4. **Gate 4 (Statutory Tax)**: `pnpm test:compliance` (Revenue Department Section 86/4 XML validation & BahtText).
5. **Gate 5 (Security & Build)**: Container vulnerability scan (Zero High/Critical CVEs) & Helm chart lint.

---

## 7. Documentation Governance & Version Control

- **Master Document Index**: Always consult `docs/00_master_architecture_index.md` for end-to-end traceability across all 29 features, state machine choreography, and transferred challenge resolutions.
- **Architectural Changes**: Any modification to database schemas, API contracts, or state machine transitions requires an approved Architectural Change Request (ACR) submitted to the Enterprise Architecture Review Board (ARB).
- **Compliance Certification**: Any change touching `TaxBillingModule` or `tax_invoices` must be reviewed and countersigned by the Corporate Financial Controller and Statutory Tax Officer.

---
*Maintained by the WDS Enterprise Architecture & Engineering Team — CRC Thai Watsadu Company Limited.*
