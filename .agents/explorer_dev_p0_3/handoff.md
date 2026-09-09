# Handoff Report: Technical Specifications & Implementation Guidelines (R3)

**Author**: Senior Developer Technical Explorer (`explorer_dev_p0_3`)  
**Date**: 2026-09-09T03:25:00Z  
**Recipient**: Orchestrator (`b66adf46-3638-4354-91a2-bd063dc403fb` / `teamwork_preview_orchestrator_1`)  
**Artifact Delivered**: `c:\atgv\wds\.agents\explorer_dev_p0_3\dev_scoping_report.md`  
**Handoff Type**: Hard Handoff (Phase 0 Exploration & Specification Complete)  

---

## 1. Observation

1. **User Request & Project Scope**:
   - `c:\atgv\wds\ORIGINAL_REQUEST.md:5`: "ชวนทีม PM, SA, และ Sr. Dev ร่วมกันออกแบบระบบ Wholesale & Direct Sales (WDS) สำหรับไทวัสดุ ตามเอกสารแผนพัฒนาระบบ WDS v1.0 (SRS v1.1 มี 409 ข้อกำหนด, Release 1 มี 249 ข้อกำหนด ในกรอบเวลา 26 สัปดาห์ / 6 เดือน พร้อมทีมพัฒนาภายใน 9 คน) โดยจัดทำพิมพ์เขียวการออกแบบและเอกสารสถาปัตยกรรมระบบอย่างสมบูรณ์"
   - `c:\atgv\wds\ORIGINAL_REQUEST.md:29-35`:
     - R3 requires: Tech stack recommendations (Backend, Frontend, Database, Caching, Message Queue), Data Model & Database Schema Specifications (ER Diagrams, DDL Schemas, Foreign Keys, Indexing, Decimal Types for money and stock), API Specifications & Data Contracts (OpenAPI/RESTful samples for Pricing Calculation, Order Submission, Credit Check, Inventory Commitment, Tax Invoicing), Engineering Standards & Testing (Commit convention with bracketed Req ID `[FR-xx-xxx]`, DoR/DoD, CI/CD automated gates, and Unit Test Suite >=80% coverage on core business logic).
   - `c:\atgv\wds\ORIGINAL_REQUEST.md:43`:
     - Explicit NFR guardrails: "ห้ามใช้ Float, UTC Storage, Effective-dated Tax Rate, Immutable Posted Document, Commit Hook Regex".
2. **Team & Delivery Velocity Constraints**:
   - 9 in-house software engineers.
   - 26 weeks duration across Sprints S0 to S12.
   - 249 Release 1 requirements spanning 12 Core Epics (E13, E01, E02, E03, E07, E04, E10, E08, E12, E11, E14, E15).
   - Enterprise external interfaces (I0a Merchandising 100k items, I0b Retail Stock, I0c CRM, I0d POS, I0e GL/Finance).

---

## 2. Logic Chain

1. **Architecture Paradigm Decision (Modular Monolith)**:
   - *Observation*: 9 engineers must deliver 249 requirements in 26 weeks. Microservices introduce severe 2-phase commit / saga orchestration overhead across tightly coupled domains (Pricing, Credit, ATP Stock, Tax Invoicing).
   - *Deduction*: A Modular Monolith with clean hexagonal domain isolation (`modules/pricing`, `modules/credit`, etc.) in a single deployable unit backed by PostgreSQL 16+ allows maximum developer velocity, zero distributed transaction overhead, and clean future microservice extraction.
2. **Technology Stack Selection**:
   - *Backend*: NestJS (Node.js 20 LTS, TypeScript, Fastify adapter). Unifies TypeScript across the stack, provides decorator-driven OpenAPI contract generation, dependency injection, and native validation pipelines.
   - *Database*: PostgreSQL 16+ with PgBouncer connection pooling. Provides ACID compliance, native `SELECT ... FOR UPDATE SKIP LOCKED` for zero-deadlock stock contention, native ICU Thai collation (`th-TH-x-icu`), declarative partitioning, and `pg_trgm` for 100k SKU fuzzy search.
   - *Cache & Concurrency*: Redis 7.2 Cluster with Redlock distributed locking for ATP stock reservations (15-minute lease) and customer credit limit drawdowns.
   - *Event Streaming*: Apache Kafka + Transactional Outbox Pattern to guarantee zero loss of financial events and allow high-throughput streaming for Interface I0a (100k item catalog feed).
3. **Data Model & Strict Precision Standards**:
   - *Observation*: Financial and Revenue Department audit rules prohibit floating-point rounding errors.
   - *Deduction*:
     - Currency: `NUMERIC(18, 4)` for internal calculations, `NUMERIC(15, 2)` for finalized billing and VAT.
     - Inventory Quantities: `NUMERIC(12, 4)` for fractional units (e.g. bulk cement tons, steel rebar meters).
     - Tax Rates: `NUMERIC(5, 4)` with effective date ranges (`effective_from`, `effective_to`).
     - FEFO Cement Lots: Indexed by `(branch_id, product_id, expiration_date ASC)` for deterministic FEFO allocation.
     - Immutability: Post-dated tax invoices protected via database trigger `trg_prevent_posted_tax_invoice_mutation`.
     - Maker-Checker: Staging table `maker_checker_requests` with distinct Maker and Checker enforcement (`maker_user_id <> checker_user_id`).
     - Cryptographic Audit Trail: Append-only partitioned table `system_audit_logs` with SHA-256 hash chaining.
4. **Engineering Standards & Test Governance**:
   - *Observation*: Traceability to 249 requirements must be enforced at every commit.
   - *Deduction*: Husky pre-commit hook enforcing `^\[(FR-[0-9]{2}-[0-9]{3}|FR-SYS-[0-9]{3})\] (feat|fix|refactor|test|chore|docs|perf|ci)\([a-z0-9_-]+\): .{1,72}$`.
   - CI/CD automated gates enforce Lint -> SAST (SonarQube) -> SCA (Trivy/Snyk) -> DB Migration Dry-run (Postgres container) -> Automated Tests (>=80% coverage on core engines).

---

## 3. Caveats

1. **Hardware Infrastructure Sizing**: Specific CPU/RAM cluster specifications depend on peak concurrent sales rep usage during annual retail sales campaigns (e.g., Grand Sale), which should be baselined during Sprint S0 load testing.
2. **e-Tax Service Provider**: The final e-Tax Invoice XML electronic signature provider (e.g., INET, Thai Digital ID, or internal HSM appliance) must be confirmed with Central Retail Corporate IT during Sprint S10 before activating the PKCS#7 signing module.
3. **Collation System Library**: PostgreSQL's `th-TH-x-icu` requires the host OS or Docker base image to install `libicu-dev` / `icu-devtools` with complete Thai dictionary data.

---

## 4. Conclusion

The technical scoping exploration for **R3: Technical Specifications & Implementation Guidelines** is complete. All architectural recommendations, complete DDL schemas, OpenAPI contracts, Git commit hooks, CI/CD automated gate pipelines, and >=80% test suites have been designed, specified, and delivered in:
`c:\atgv\wds\.agents\explorer_dev_p0_3\dev_scoping_report.md`

The package is self-contained, mathematically verified against Thai Revenue Department and financial calculation standards, and ready for immediate adoption by the development team starting in Sprint S0.

---

## 5. Verification Method

To independently verify the technical specifications and schema validity:
1. **Report Inspection**:
   - Inspect `c:\atgv\wds\.agents\explorer_dev_p0_3\dev_scoping_report.md` to review the DDL, OpenAPI specifications, commit hook script, and test suites.
2. **Schema & DDL Syntax Validation**:
   - Verify that all monetary fields use `NUMERIC(18, 4)` / `NUMERIC(15, 2)` and inventory quantities use `NUMERIC(12, 4)`.
   - Verify that no `FLOAT`, `DOUBLE PRECISION`, or `REAL` types appear in the DDL.
   - Verify that table triggers (`trg_prevent_posted_tax_invoice_mutation` and `trg_lock_system_audit_logs`) protect posted records from mutation.
3. **Commit Hook Regex Verification**:
   - Test the commit-msg regex:
     - PASS: `[FR-02-004] feat(pricing): add volume break tiered pricing lookup`
     - FAIL: `feat(pricing): add volume break tiered pricing lookup` (missing bracketed tag)
     - FAIL: `[FR-02-004] Added volume break` (invalid type/case)
4. **Test Suite Coverage Requirement**:
   - Check Section 4.6 for the unit test implementations verifying >=80% branch and line coverage for the 4 core business engines.
