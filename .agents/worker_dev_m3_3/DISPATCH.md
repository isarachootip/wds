## 2026-09-09T03:23:46Z
You are the Senior Technical Lead / Dev Architect for the Wholesale & Direct Sales (WDS) system for Thai Watsadu.
Your working directory is: c:\atgv\wds\.agents\worker_dev_m3_3
You MUST read the authoritative user request at: c:\atgv\wds\ORIGINAL_REQUEST.md
You MUST also read the scoping report at: c:\atgv\wds\.agents\explorer_dev_p0_3\dev_scoping_report.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

WRITE OWNERSHIP:
You EXCLUSIVELY own and MUST write the deliverable file at:
c:\atgv\wds\docs\03_technical_specifications_implementation_guidelines.md

Your mission:
Write an exhaustive, enterprise-grade, production-ready Technical Specifications & Implementation Guidelines Markdown document covering all aspects of R3:
1. Enterprise Technology Stack:
   - Backend: Modular Monolith in NestJS 10 (TypeScript 5.x, Fastify adapter) designed for eventual microservice extraction.
   - Frontend: React 18 + Vite SPA with TypeScript and Ant Design Enterprise components.
   - Database: PostgreSQL 16+ with ICU Thai collation (`th-TH-x-icu`), native row-level locking (`FOR UPDATE SKIP LOCKED`), and declarative table partitioning.
   - Caching & Locking: Redis 7.2 Cluster with Redlock distributed locking for ATP leases and credit reservation.
   - Message Broker & Event Streaming: Apache Kafka with Transactional Outbox Pattern for interfaces I0a–I0e.
2. Complete Data Model & Production DDL Schemas:
   - Exact SQL DDL schemas for PostgreSQL 16+ with strict monetary types (`NUMERIC(18,4)` and `NUMERIC(15,2)`), inventory types (`NUMERIC(12,4)`), zero floats.
   - Primary keys, foreign keys, check constraints, and compound indexes (including FEFO cement lot index: `idx_inv_lots_fefo` on `(sku_id, branch_id, expiry_date ASC, remaining_qty DESC)`).
   - Maker-Checker staging schema (`maker_checker_requests`) with JSONB change payloads.
   - Immutable audit trail schema (`system_audit_logs`) with SHA-256 HMAC hash chaining.
   - PostgreSQL trigger (`trg_tax_invoice_immutable`) enforcing strict immutability on POSTED tax invoices.
3. Production-Ready API Specifications & Data Contracts (OpenAPI 3.0 / REST):
   - Fully detailed endpoints with complete JSON request and response payloads:
     a. Dynamic Pricing Calculation (`POST /api/v1/pricing/calculate`)
     b. Order Submission & Validation (`POST /api/v1/orders`)
     c. Real-Time Credit Check (`POST /api/v1/credit/check`)
     d. Stock Reservation / ATP Commitment (`POST /api/v1/inventory/reserve`)
     e. Tax Invoice Generation & Posting (`POST /api/v1/tax-invoices/post`).
4. Engineering Standards & Testing Guidelines:
   - Git commit convention enforcing bracketed requirement IDs: `[FR-xx-xxx]` with executable Husky `commit-msg` hook script and regex pattern `^\[FR-[A-Z0-9]{2,4}-[0-9]{3,4}\] (feat|fix|refactor|test|chore|docs)(\([a-z0-9-]+\))?: .+$`.
   - Definition of Ready (DoR) and Definition of Done (DoD) checklists.
   - Automated CI/CD 5-gate pipeline (Lint & Secret Scan, Unit Tests >=80%, DB Migration Dry-Run, Static Analysis & Mutation Testing, Security Pen-Test & License Audit).
   - Unit & Integration test specifications using Jest/Vitest requiring >=80% branch and statement coverage on core business logic (Pricing, Credit, Inventory ATP, Tax Invoicing).

Ensure the document is structured with a professional Table of Contents, complete SQL DDL, production-ready JSON payloads, and concrete engineering code templates ready for immediate implementation.

When completed, write your handoff summary to c:\atgv\wds\.agents\worker_dev_m3_3\handoff.md and send a message back to the orchestrator.
