# Plan — Wholesale & Direct Sales (WDS) Thai Watsadu Blueprint

## Objective
Deliver a comprehensive, production-ready system design package covering Project Management (PM), System Architecture (SA), and Senior Developer (Sr. Dev) technical specifications for Thai Watsadu WDS v1.0 (Release 1: 249 requirements across 26 weeks, 9 in-house engineers).

## Milestones & Work Breakdown
1. **Phase 0: Survey & Technical Scoping**
   - Dispatch Explorers / Spec Miners to deep-dive into the 12 Epics, 409 SRS requirements (249 in R1), 20-item Drop List protocol, Thai fiscal / RD regulations, and enterprise integration touchpoints (I0a-I0e).
   - Produce unified project architecture mapping (`PROJECT.md`).

2. **Phase 1: Domain Blueprints (Parallel Dispatch)**
   - **Workstream 1 (PM Role)**:
     * Sprint Breakdown S0-S12 mapped to 12 Epics (E13, E01, E02, E03, E07, E04, E10, E08, E12, E11, E14, E15) for 9 engineers / 26 weeks.
     * Checkpoints CP1-CP5 & 20-item Drop List protocol at CP3 (Sprint 5).
     * Risk Register (P01-P09), RACI Matrix, Governance model, 5 Weekly Metrics.
   - **Workstream 2 (SA Role)**:
     * Architecture & C4 Component Diagrams, Integration Architecture (I0a-I0e: Item Feed 100k items, Retail Stock, CRM, POS, GL/Finance).
     * Core Domains: Master Data (Maker-Checker, RBAC, immutable audit log), Pricing Engine (volume breaks, zone freight, floor price, discount authority, effective-dated VAT), Credit & Cheque Control (limits, blocking, cheque register, release workflow), Inventory Management (FEFO cement lots, ATP, branch contention handling), RD-Compliant Tax Invoicing (immutable after posting, Output VAT, Credit Notes).
     * Security & NFRs: OWASP Top 10, Masked Synthetic Data in non-prod, Thai collation/sort, UTC/Asia-Bangkok, Decimal Precision Rule.
   - **Workstream 3 (Sr. Dev Role)**:
     * Enterprise Tech Stack (Backend, Frontend, Database, Caching, Message Queue).
     * Data Model & Database Schema Specifications (ER diagrams, DDL schemas, foreign keys, indexing, decimal types for money and stock).
     * API Specifications & Data Contracts (OpenAPI/RESTful samples for Pricing Calculation, Order Submission, Credit Check, Stock Commitment, Tax Invoicing).
     * Engineering Standards & Testing: Commit convention with bracketed Req ID `[FR-xx-xxx]`, DoR/DoD, CI/CD automated gates, Unit test suite (>=80% coverage on core business logic).

3. **Phase 2: Review, Verification & Forensic Audit**
   - Dispatch Reviewers & Challengers for technical validation, edge case stress testing, and consistency.
   - Dispatch Forensic Auditor to ensure zero cheating, genuine implementation, and total adherence to constraints.

4. **Phase 3: Final Synthesis & Presentation**
   - Synthesize all deliverables into a coherent documentation hierarchy in `c:\atgv\wds\docs\`.
   - Update `PROJECT.md`, `GATE_STATUS.md`, and report back with executive summary.
