# Handoff Report — SA Scope Specification Miner (`spec_miner_sa_p0_2`)

**Handoff Type**: Hard (Task Complete)  
**Date**: 2026-09-09T03:23:00Z  
**From**: `spec_miner_sa_p0_2` (SA Scope Specification Miner)  
**To**: Orchestrator (`teamwork_preview_orchestrator_1` / `b66adf46-3638-4354-91a2-bd063dc403fb`)  
**Artifacts Produced**:
- `c:\atgv\wds\.agents\spec_miner_sa_p0_2\sa_scoping_report.md`
- `c:\atgv\wds\.agents\spec_miner_sa_p0_2\DISPATCH.md`
- `c:\atgv\wds\.agents\spec_miner_sa_p0_2\BRIEFING.md`
- `c:\atgv\wds\.agents\spec_miner_sa_p0_2\progress.md`

---

## 1. Observation

1. **Authoritative Request Mandate**:
   - `c:\atgv\wds\ORIGINAL_REQUEST.md`, Lines 18–27 explicitly require the SA role to design:
     > "R2. System Architecture & High-Level Design (SA Role)
     > ออกแบบสถาปัตยกรรมระบบรวมและ Data Flow ตามข้อกำหนดและมาตรฐานวิศวกรรม:
     > - สถาปัตยกรรมระบบ (System Architecture & Component Diagrams) และ Integration Architecture กับระบบภายนอก (Interfaces I0a–I0e: Merchandising Item Feed 100k items, Retail Stock, CRM, POS, GL/Finance)
     > - การออกแบบโมดูลหลักและโดเมนธุรกิจ (Core Domains):
     >   * E01/E13: Master Data (Maker-Checker), RBAC & Immutable Audit Log
     >   * E02: Pricing Engine (Volume Breaks, Zone Freight, Floor Price, Discount Authority, Effective-dated VAT Config)
     >   * E03: Credit & Cheque Control Engine (Credit Limit, Credit Blocking, Cheque Register, Release Workflow)
     >   * E07/E04: Inventory Management (FEFO Cement Lots, ATP, Branch Stock Reservation/Contention Handling)
     >   * E10: Billing & Revenue-Department-Compliant Tax Invoice (Immutability after posting, Output VAT, Credit Note)
     > - แนวนโยบายด้านความปลอดภัยและ NFRs (OWASP Top 10, Masked Synthetic Data ใน Non-Prod, Collation/Sort ภาษาไทย, UTC/Asia-Bangkok, Decimal Precision Rule)"
2. **Context & Environment**:
   - Windows environment, powershell shell, active workspace `c:\atgv\wds`.
   - The workspace initially contains `ORIGINAL_REQUEST.md` and `.agents/` directory structure.
   - Requirement strictly specifies read-only exploration and zero floating-point arithmetic.

---

## 2. Logic Chain

1. **Architecture Modeling**:
   - Starting from the user request, the enterprise ecosystem consists of B2B contractors, sales reps, store fulfillment, credit teams, and 5 external platforms.
   - Decomposing using the C4 Model yields:
     - Level 1 Context: Clear enterprise boundaries, defining interactions between WDS and Merchandising ERP, Retail Stock, CRM, POS, and SAP GL ERP.
     - Level 2 Container: Web SPA, Mobile Web PWA, Store Fulfillment Station, API Gateway, 6 modular domain microservices, PostgreSQL (RDBMS with ICU collation), Redis (caching & Redlock), Kafka/RabbitMQ (EDA Outbox), and S3 object storage for e-Tax documents.
     - Level 3 Component: Detailed internal components for Pricing Engine, Inventory Allocation & ATP, Credit Check & Cheque Register, and Tax Invoicing.
2. **Integration Architecture (I0a – I0e)**:
   - I0a (Merchandising Feed): 100,000 SKUs require daily SFTP full bulk sync via binary `COPY` into staging tables with SHA-256 hash change detection, complemented by Kafka delta event streams.
   - I0b (Retail Stock ATP): Multi-branch sub-second queries require Redis caching backed by gRPC mTLS connections to store nodes, featuring a two-phase reservation system with a 30-minute soft TTL and 60-second background reaper.
   - I0c (CRM): Bi-directional synchronization for 13-digit Thai corporate Tax IDs, 5-digit Branch codes, and tier credit assignments.
   - I0d (POS): Direct store collection with multi-tender split settlement (Cash, Credit Card, PromptPay B2B) and cashier barcode release triggers.
   - I0e (GL / Finance ERP): Real-time double-entry journal posting via Transactional Outbox pattern with nightly reconciliation comparing daily sales registers against ERP GL balances at 23:59:59 Asia/Bangkok.
3. **Core Domain Business Rules**:
   - Master Data (E01/E13): Dual-authorization Maker-Checker with visual diffs, 9 RBAC roles, and append-only tamper-evident audit ledger chained with SHA-256 HMACs.
   - Pricing Engine (E02): Math formulas for Tiered Base Price, Volume Breaks (stepped vs all-units), Zone Freight Surcharge with truck weight categories, Floor Price guard based on Moving Average Cost, DOFA approval matrix (3%, 5%, 8%, 15%), and temporal effective-dated VAT resolution (7.0000%).
   - Credit & Cheque Control (E03): Comprehensive exposure formula incorporating AR, committed orders, current cart, and uncleared cheques. Hard block (>100% or >30d overdue) vs soft block (>90% or 1–15d overdue). Full cheque lifecycle tracking, automated lockdown on bounced cheques, and multi-signature 24-hour emergency release tokens.
   - Inventory Management (E07/E04): FEFO algorithm allocating earliest expiring lots while preserving full pallets for cement/chemicals, combined with multi-store ATP routing and optimistic concurrency locking.
   - Billing & Tax Invoicing (E10): Full compliance with Thai Revenue Code Sections 86/4, 86/5, 86/9, and 86/10. Strictly continuous branch/year/month numbering, database triggers enforcing absolute immutability after `POSTED` status, Credit Note generation with legal reason codes, and ETDA/UN/CEFACT XML with PDF/A-3 digital signatures.
4. **Security & Non-Functional Requirements**:
   - OWASP Top 10 mapped against specific Thai Watsadu WDS risks with architectural mitigations.
   - Non-prod data masking pipeline for Thai Citizen IDs (valid synthetic Modulo 11 check digits), company names, and phone numbers.
   - Thai alphabetical collation (`th-TH-x-icu`) enforcing pre-posed vowel reordering (เ, แ, โ, ใ, ไ under consonant).
   - Strict UTC database storage (`TIMESTAMPTZ`) with `Asia/Bangkok` (UTC+7) presentation and fiscal day boundary handling at 16:59:59 UTC.
   - Absolute prohibition of floating point arithmetic: `NUMERIC(18,4)` for money/prices, `NUMERIC(14,4)` for quantities, `ROUND_HALF_UP` rounding, and document-level VAT reconciliation.

---

## 3. Caveats

1. **Physical External Network Latencies**: Physical network latency between store branches across provincial Thailand and central cloud depends on local SD-WAN links; local edge caching and fallback quotas have been designed to maintain offline resilience.
2. **Third-Party RD e-Tax Provider SLA**: e-Tax invoice submission via third-party service providers (Service Provider mode) is subject to RD gateway availability; an asynchronous retry queue ensures invoices are safely acknowledged.
3. **No Implementation Code Written**: Per specification miner guidelines, this report defines the architectural and domain specification without implementing application source code.

---

## 4. Conclusion

The SA scoping report (`sa_scoping_report.md`) provides a complete, exhaustive, and rigorously detailed architectural specification for R2: System Architecture & High-Level Design. It features:
- Complete C4 Context, Container, and Component specifications.
- Deep integration protocols and contracts for interfaces I0a through I0e.
- Fully formulated mathematical models, state machines, and business rules for Master Data, Pricing, Credit Control, Inventory FEFO/ATP, and Tax Invoicing.
- Comprehensive security and NFR frameworks (OWASP Top 10, Thai PII masking, Thai collation, UTC/Bangkok time, and strict decimal precision).
- A 40-item **Features Discovered** table and a 20-item **Edge Cases & Resilience Matrix**.

The deliverable is ready for immediate consumption by the Senior Developer team (`explorer_dev_p0_3`), Project Management team (`spec_miner_pm_p0_1`), and Orchestrator.

---

## 5. Verification Method

1. **Inspect Report Content**:
   - Path: `c:\atgv\wds\.agents\spec_miner_sa_p0_2\sa_scoping_report.md`
   - Verify presence of Section 2 (C4 Models), Section 3 (Interfaces I0a–I0e), Section 4 (Core Domains), Section 5 (Security & NFRs), Section 6 (Features Discovered Table), Section 7 (Edge Cases Table), and Section 8 (Architectural Risks).
2. **Verify Feature Count & Coverage**:
   - Ensure all 5 interfaces (I0a, I0b, I0c, I0d, I0e) are fully specified.
   - Ensure all 5 core domains (Master Data, Pricing, Credit, Inventory, Tax Invoicing) are specified with exact domain formulas.
   - Confirm 40 features enumerated in Section 6.
   - Confirm 20 edge cases enumerated in Section 7.
3. **Verify Constraints**:
   - Check that float/double primitives are strictly prohibited and `NUMERIC(18,4)` / `NUMERIC(14,4)` are mandated.
   - Check that Thai collation specifies `th-TH-x-icu` with pre-posed vowel reordering.
   - Check that UTC storage and `Asia/Bangkok` presentation rules are documented.
