## 2026-09-09T03:23:46Z
You are the Chief System Architect for the Wholesale & Direct Sales (WDS) system for Thai Watsadu.
Your working directory is: c:\atgv\wds\.agents\worker_sa_m2_2
You MUST read the authoritative user request at: c:\atgv\wds\ORIGINAL_REQUEST.md
You MUST also read the scoping report at: c:\atgv\wds\.agents\spec_miner_sa_p0_2\sa_scoping_report.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

WRITE OWNERSHIP:
You EXCLUSIVELY own and MUST write the deliverable file at:
c:\atgv\wds\docs\02_system_architecture_high_level_design.md

Your mission:
Write an exhaustive, enterprise-grade, production-ready System Architecture & High-Level Design Markdown document covering all aspects of R2:
1. System Architecture & C4 Topology:
   - C4 Level 1: System Context Diagram (Actors: Contractors, Sales Reps/KAM, Store Warehouse, Credit Team, Finance Officers; External Systems: Merchandising, POS, CRM, ERP, RD e-Tax).
   - C4 Level 2: Container Topology (Client Apps, API Gateway, 6 Domain Services, PostgreSQL with ICU collation, Redis Cluster, Kafka Event Bus, e-Tax Document Archive).
   - C4 Level 3: Component Diagrams for Pricing Engine, Inventory ATP, Credit Check, and Tax Invoicing.
2. Integration Architecture for Interfaces I0a through I0e:
   - I0a: Merchandising Item Feed (100k items, daily full sync via SFTP + Kafka delta streaming, SHA-256 attribute checksums, quarantine pattern).
   - I0b: Retail Store Stock (sub-second multi-store ATP queries over gRPC mTLS, Redis edge caching, 2-phase reservations with 30-min TTL, Redlock concurrency, 60s reaper).
   - I0c: CRM (bidirectional sync for 13-digit Thai corporate Tax IDs with Modulo 11 validation, 5-digit Branch codes, credit tier profiling).
   - I0d: Retail POS (direct store collection, split-tender settlement: Cash, Card, PromptPay B2B, cashier barcode release token).
   - I0e: GL / Finance ERP (real-time double-entry journal posting via Transactional Outbox, nightly 23:59:59 reconciliation).
3. Core Business Domains Deep-Dive:
   - Master Data (Maker-Checker dual approval with visual diffs, 9 RBAC roles, append-only SHA-256 HMAC chained audit log).
   - Pricing Engine (Base price, volume breaks - stepped vs all-units, zone freight surcharge by truck class, floor price guard on moving average cost, DOFA approval matrix 3%/5%/8%/15%, effective-dated temporal VAT resolution at 7.0000%).
   - Credit & Cheque Control (Instantaneous exposure calculation, hard block vs soft block thresholds, 6-stage cheque lifecycle, lockdown on bounced cheques, 24h emergency release tokens).
   - Inventory Management (FEFO lot allocation for cement/chemicals preserving full pallets, multi-store ATP routing, optimistic concurrency).
   - Billing & Tax Invoicing (RD Sections 86/4, 86/5, 86/9, 86/10 compliance, branch/year/month continuous numbering, database trigger immutability enforcement on POSTED status, Credit Notes with legal reason codes, ETDA XML + PDF/A-3).
4. Security Policies & Non-Functional Requirements (NFRs):
   - OWASP Top 10 mitigation matrix for B2B enterprise threats.
   - Non-prod data masking pipeline (synthetic Thai Citizen/Tax IDs with valid Modulo 11 check digits, masked customer names, masked phones).
   - Thai alphabetical collation (`th-TH-x-icu`) handling pre-posed vowels (เ, แ, โ, ใ, ไ).
   - Strict UTC database storage (`TIMESTAMPTZ`) with `Asia/Bangkok` (UTC+7) presentation and fiscal day boundary handling at 16:59:59 UTC.
   - Strict decimal precision rules: `NUMERIC(18,4)` for money, `NUMERIC(14,4)` for quantities, `ROUND_HALF_UP`, document-level VAT reconciliation, absolute ban on floats.

Ensure the document is structured with a professional Table of Contents, precise architectural diagrams (in clean ASCII/Mermaid), and comprehensive engineering specifications ready for immediate implementation.

When completed, write your handoff summary to c:\atgv\wds\.agents\worker_sa_m2_2\handoff.md and send a message back to the orchestrator.
