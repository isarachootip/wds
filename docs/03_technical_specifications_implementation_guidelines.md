# Technical Specifications & Implementation Guidelines (R3 Blueprint)
## Wholesale & Direct Sales (WDS) — Thai Watsadu System Architecture & Engineering Standard

**Document Identifier**: WDS-TECH-SPEC-R3-V1.0  
**Target Release**: Release 1 (249 Requirements, 26 Sprints S0–S12, 9 In-House Engineers)  
**System**: Wholesale & Direct Sales (WDS) Platform  
**Target Organization**: Central Retail Corporation / Thai Watsadu Co., Ltd.  
**Author**: Senior Technical Lead / Dev Architect (`worker_dev_m3_3`)  
**Status**: APPROVED / PRODUCTION READY  
**Classification**: Central Retail Enterprise Confidential  

---

## Executive Summary

This document defines the authoritative technical specifications, production database DDL schemas, OpenAPI 3.0 data contracts, and automated engineering governance pipelines for the Wholesale & Direct Sales (WDS) platform at Thai Watsadu. 

The WDS platform powers mission-critical B2B wholesale commerce across nationwide Thai Watsadu branches and distribution centers. It addresses extreme business complexities including high-concurrency inventory reservation across physical branches, multi-tier volume pricing with freight surcharges and floor-price enforcement, real-time credit risk exposure management with post-dated cheque controls, and strict Revenue Department (RD) compliant tax invoicing with digital signatures and legal immutability.

Designed specifically for an execution squad of **9 in-house software engineers** delivering **249 Release 1 requirements** across **26 weeks (S0–S12)**, this specification eliminates architectural ambiguity, mandates exact data representations (forbidding all floating-point representations), and provides concrete, copy-paste production code artifacts for immediate implementation.

---

## Table of Contents

1. [Enterprise-Grade Technology Stack Architecture](#1-enterprise-grade-technology-stack-architecture)
   - 1.1 [Architectural Pattern: Modular Monolith with Hexagonal Boundaries](#11-architectural-pattern-modular-monolith-with-hexagonal-boundaries)
   - 1.2 [Backend Framework & Runtime: NestJS 10 on Fastify](#12-backend-framework--runtime-nestjs-10-on-fastify)
   - 1.3 [Frontend Web Architecture: React 18 SPA + Vite + Ant Design](#13-frontend-web-architecture-react-18-spa--vite--ant-design)
   - 1.4 [Primary Relational Database: PostgreSQL 16+ with ICU Thai Collation](#14-primary-relational-database-postgresql-16-with-icu-thai-collation)
   - 1.5 [Caching, Distributed Locking & Session Management: Redis 7.2 Cluster](#15-caching-distributed-locking--session-management-redis-72-cluster)
   - 1.6 [Message Broker & Asynchronous Event Streaming: Apache Kafka & Outbox Pattern](#16-message-broker--asynchronous-event-streaming-apache-kafka--outbox-pattern)
   - 1.7 [Technology Stack Evaluation & Decision Matrix](#17-technology-stack-evaluation--decision-matrix)
2. [Complete Data Model & Production DDL Schemas](#2-complete-data-model--production-ddl-schemas)
   - 2.1 [Entity Relationship Diagram & Relational Topology](#21-entity-relationship-diagram--relational-topology)
   - 2.2 [Strict Data Type & Precision Rules (Absolute Ban on Floats)](#22-strict-data-type--precision-rules-absolute-ban-on-floats)
   - 2.3 [Collation, Localization, and Temporal Storage Standards](#23-collation-localization-and-temporal-storage-standards)
   - 2.4 [Production SQL DDL Schemas (PostgreSQL 16+)](#24-production-sql-ddl-schemas-postgresql-16)
     - 2.4.1 [Enums and Extensions](#241-enums-and-extensions)
     - 2.4.2 [Customer & Credit Control Domain](#242-customer--credit-control-domain)
     - 2.4.3 [Product, Pricing & Freight Domain](#243-product-pricing--freight-domain)
     - 2.4.4 [Inventory, FEFO Cement Lots & ATP Reservation Domain](#244-inventory-fefo-cement-lots--atp-reservation-domain)
     - 2.4.5 [Orders & Line Items Domain](#245-orders--line-items-domain)
     - 2.4.6 [Revenue Department Compliant Tax Invoicing Domain (Partitioned)](#246-revenue-department-compliant-tax-invoicing-domain-partitioned)
     - 2.4.7 [Statutory Credit Notes (Thai Revenue Code Section 86/10)](#247-statutory-credit-notes-thai-revenue-code-section-8610)
     - 2.4.8 [Concurrency-Safe Gapless Tax Invoice Sequence Generator](#248-concurrency-safe-gapless-tax-invoice-sequence-generator)
   - 2.5 [Maker-Checker Staging & Dual-Control Schema](#25-maker-checker-staging--dual-control-schema)
   - 2.6 [Immutable Hash-Chained Audit Trail Schema (SHA-256 Ledger)](#26-immutable-hash-chained-audit-trail-schema-sha-256-ledger)
   - 2.7 [PostgreSQL Triggers: Tax Invoice Strict Immutability Guards](#27-postgresql-triggers-tax-invoice-strict-immutability-guards)
3. [Production-Ready API Specifications & Data Contracts (RESTful / OpenAPI 3.0)](#3-production-ready-api-specifications--data-contracts-restful--openapi-30)
   - 3.1 [Global API Conventions, Headers & RFC 7807 Error Envelope](#31-global-api-conventions-headers--rfc-7807-error-envelope)
   - 3.2 [Endpoint 1: Dynamic Pricing Calculation (`POST /api/v1/pricing/calculate`)](#32-endpoint-1-dynamic-pricing-calculation-post-apiv1pricingcalculate)
   - 3.3 [Endpoint 2: Order Submission & Validation (`POST /api/v1/orders`)](#33-endpoint-2-order-submission--validation-post-apiv1orders)
   - 3.4 [Endpoint 3: Real-Time Credit Check (`POST /api/v1/credit/check`)](#34-endpoint-3-real-time-credit-check-post-apiv1creditcheck)
   - 3.5 [Endpoint 4: Stock Reservation / ATP Commitment (`POST /api/v1/inventory/reserve`)](#35-endpoint-4-stock-reservation--atp-commitment-post-apiv1inventoryreserve)
   - 3.6 [Endpoint 5: Tax Invoice Generation & Posting (`POST /api/v1/tax-invoices/post`)](#36-endpoint-5-tax-invoice-generation--posting-post-apiv1tax-invoicespost)
4. [Engineering Standards & Testing Guidelines](#4-engineering-standards--testing-guidelines)
   - 4.1 [Git Commit Convention with Requirement ID Enforcement](#41-git-commit-convention-with-requirement-id-enforcement)
   - 4.2 [Executable Husky `commit-msg` Hook Script](#42-executable-husky-commit-msg-hook-script)
   - 4.3 [Definition of Ready (DoR) and Definition of Done (DoD) Checklists](#43-definition-of-ready-dor-and-definition-of-done-dod-checklists)
   - 4.4 [Automated CI/CD 5-Gate Quality Pipeline](#44-automated-cicd-5-gate-quality-pipeline)
   - 4.5 [Unit & Integration Testing Guidelines (>=80% Coverage Standard)](#45-unit--integration-testing-guidelines-80-coverage-standard)
   - 4.6 [Production-Grade Test Suites (TypeScript / Jest / Vitest)](#46-production-grade-test-suites-typescript--jest--vitest)
     - 4.6.1 [Pricing Engine Test Suite (`pricing-engine.spec.ts`)](#461-pricing-engine-test-suite-pricing-enginespects)
     - 4.6.2 [Real-Time Credit Check Test Suite (`credit-control.spec.ts`)](#462-real-time-credit-check-test-suite-credit-controlspects)
     - 4.6.3 [Inventory ATP & FEFO Concurrency Test Suite (`inventory-atp.spec.ts`)](#463-inventory-atp--fefo-concurrency-test-suite-inventory-atpspects)
     - 4.6.4 [Tax Invoicing Immutability & Hash Chain Test Suite (`tax-invoicing.spec.ts`)](#464-tax-invoicing-immutability--hash-chain-test-suite-tax-invoicingspects)
5. [Architectural Risk Analysis & Mitigation Playbook](#5-architectural-risk-analysis--mitigation-playbook)
6. [Sprint-by-Sprint Implementation Roadmap (S0–S12)](#6-sprint-by-sprint-implementation-roadmap-s0s12)
   - 6.1 [Sprint Velocity & Milestone Summary Table](#61-sprint-velocity--milestone-summary-table)

---

# 1. Enterprise-Grade Technology Stack Architecture

### 1.1 Architectural Pattern: Modular Monolith with Hexagonal Boundaries

The primary architectural mandate for Thai Watsadu WDS Release 1 is delivering 249 functional requirements within a strict 26-week timeline using a dedicated in-house team of 9 engineers. Under these operational constraints, adopting a distributed microservices architecture on Day 1 is an anti-pattern. Distributed sagas, distributed 2-phase commits, cross-network serialization, and distributed observability would consume upwards of 40% of the team's engineering velocity.

Instead, WDS adopts an **Enterprise Modular Monolith** utilizing **Hexagonal Architecture (Ports and Adapters)** and **Domain-Driven Design (DDD)**.

```
+===================================================================================================+
|                                    WDS MODULAR MONOLITH BACKEND                                    |
|                                                                                                   |
|  [ Inbound Ports / HTTP REST / OpenAPI 3.0 / Fastify Controller Layer ]                           |
|       |                     |                     |                     |                         |
|  +----v-------------+  +----v-------------+  +----v-------------+  +----v-------------+       |
|  |  modules/master  |  |  modules/pricing |  |  modules/credit  |  |  modules/inv     |       |
|  |  (Maker-Checker) |  |  (Volume/Zone)   |  |  (Exposure/Cheque|  |  (FEFO/ATP)      |       |
|  +----+-------------+  +----+-------------+  +----+-------------+  +----+-------------+       |
|       |                     |                     |                     |                         |
|       +---------------------+----------+----------+---------------------+                         |
|                                        |                                                          |
|                             [ Internal Domain Event Bus ]                                         |
|                                        |                                                          |
|                       +----------------+----------------+                                         |
|                       |                                 |                                         |
|              +--------v---------+             +---------v--------+                                |
|              |  modules/orders  |             |  modules/billing |                                |
|              |  (Fulfillment)   |             |  (RD Tax Invoice)|                                |
|              +--------+---------+             +---------+--------+                                |
|                       |                                 |                                         |
|  [ Outbound Ports / Adapters Layer ]                    |                                         |
|       |                                                 |                                         |
|       +-----------------------+-------------------------+                                         |
|                               |                                                                   |
|              +----------------v-----------------+                                                 |
|              | Transactional Outbox Table Store |                                                 |
+==============+================+=================+=================================================+
                                |
               +----------------v-----------------+
               | Apache Kafka / Debezium CDC Bus  |
               +----------------+-----------------+
                                |
     +--------------------------+--------------------------+
     |                          |                          |
+----v-----------------+  +-----v----------------+   +-----v----------------+
| I0a Merchandising    |  | I0d POS Direct Sync  |   | I0e SAP GL /         |
| (100k Item Feed)     |  | (Store Till Sync)    |   | Corporate Finance    |
+----------------------+  +----------------------+   +----------------------+
```

#### Core Boundary Rules
1. **Module Autonomy**: Each domain module (`masterdata`, `pricing`, `credit`, `inventory`, `orders`, `billing`) possesses its own private internal models, services, and repositories.
2. **Zero Cross-Schema Database Joins**: No module may execute SQL `JOIN` queries across another module's dedicated database tables. Cross-module data retrieval occurs exclusively via strongly typed In-Memory Domain Services or asynchronous Domain Events.
3. **Microservice Extraction Path**: Because module boundaries are strictly isolated via interfaces and schemas, any module experiencing disproportionate scaling demands (e.g., `inventory` ATP checks during massive promotional surges) can be extracted into an independent microservice container in Release 2 with zero refactoring of the core business logic.

---

### 1.2 Backend Framework & Runtime: NestJS 10 on Fastify

- **Runtime**: **Node.js 20 LTS (Iron)** or **Node.js 22 LTS**.
- **Application Framework**: **NestJS 10.x** operating with `@nestjs/platform-fastify`.
  - *Performance Justification*: While NestJS defaults to Express, the Fastify adapter provides a low-overhead HTTP engine capable of processing up to 30,000 requests/sec per container instance, achieving sub-15ms P99 latency during peak store checkout rushes.
  - *Architectural Scaffolding*: NestJS enforces unified dependency injection, module encapsulation, pipeline interceptors, and declarative validation pipes (`class-validator` and `class-transformer`).
  - *OpenAPI Synchronization*: Direct decoration of DTOs with `@ApiProperty()` guarantees that TypeScript interfaces and OpenAPI 3.0 JSON specifications remain in 100% lockstep without manual documentation drift.
- **Type Safety & Data Access**:
  - **Kysely**: Type-safe TypeScript SQL query builder combined with native PostgreSQL drivers (`pg`). Kysely provides zero-overhead, compile-time checked SQL statements without the performance penalties, memory leaks, and query generation obscurities of traditional heavy ORMs.
  - Full native support for PostgreSQL CTEs, `FOR UPDATE SKIP LOCKED`, declarative partition pruning, and exact decimal string casting.
- **Strict TypeScript Compiler Standard (`tsconfig.json`)**:
  ```json
  {
    "compilerOptions": {
      "target": "ES2022",
      "module": "commonjs",
      "lib": ["ES2022"],
      "strict": true,
      "noImplicitAny": true,
      "strictNullChecks": true,
      "strictFunctionTypes": true,
      "strictBindCallApply": true,
      "strictPropertyInitialization": true,
      "noImplicitThis": true,
      "alwaysStrict": true,
      "noUnusedLocals": true,
      "noUnusedParameters": true,
      "exactOptionalPropertyTypes": true,
      "noImplicitReturns": true,
      "noFallthroughCasesInSwitch": true,
      "experimentalDecorators": true,
      "emitDecoratorMetadata": true
    }
  }
  ```

---

### 1.3 Frontend Web Architecture: React 18 SPA + Vite + Ant Design

- **Core Framework**: **React 18.2+ Single Page Application (SPA)** initialized and built via **Vite 5+**.
- **State Management & Server Synchronization**:
  - **TanStack Query v5 (React Query)**: Handles all server-state caching, optimistic mutations, background window re-fetching, and cache invalidation.
  - **Zustand**: Lightweight, boilerplate-free state store for transient client-side state (e.g., active shopping cart, POS scanner input buffers, active UI modals).
- **Enterprise UI Component System**:
  - **Ant Design 5.x (Enterprise)** combined with **Tailwind CSS**.
  - *Wholesale Operations Rationale*: Thai Watsadu wholesale counter staff, branch credit controllers, and central merchandisers require data-dense, high-efficiency tabular interfaces. Ant Design provides out-of-the-box keyboard-accessible data tables, inline batch editing, virtualized scrolling for 1,000+ line orders, tree-select category pickers, and integrated Excel export/import utilities.
- **Offline Resilience & Field Operation**:
  - Service Worker layer utilizing Workbox for offline PWA caching of construction SKU catalogs, pricing tier matrices, and branch stock snapshots. Sales representatives visiting remote construction sites with poor 4G/5G mobile coverage can generate draft quotations offline, which automatically sync upon network re-establishment.

---

### 1.4 Primary Relational Database: PostgreSQL 16+ with ICU Thai Collation

- **Database Engine**: **PostgreSQL 16.2+**.
- **Thai Collation (`th-TH-x-icu`)**:
  - The database cluster and text columns containing Thai names, addresses, and product descriptions are configured with `COLLATE "th-TH-x-icu"`.
  - *Regulatory & Commercial Rationale*: Standard C or UTF-8 collations fail Thai alphabetical sorting rules (e.g., leading vowels such as `เ`, `แ`, `โ`, `ใ`, `ไ` must be collated based on the following consonant according to Royal Institute dictionary standards). ICU collation guarantees 100% legal compliance for Revenue Department tax reports and sorting of customer names.
- **High-Concurrency Stock Allocation**:
  - Employs native `SELECT ... FOR UPDATE SKIP LOCKED` inside inventory reservation transactions. This completely eliminates lock contention deadlocks during simultaneous checkout surges across 80+ branches.
- **Declarative Table Partitioning**:
  - High-velocity transactional tables (`tax_invoices`, `system_audit_logs`) use PostgreSQL declarative RANGE partitioning by year and month to maintain constant-time query indexing and enable instantaneous partition dropping for historical data archiving.
- **HA Topology & Connection Pooling**:
  - **Topology**: 1 Primary Read/Write instance + 2 Synchronous Read Replicas managed via Patroni / Zalando PG Operator.
  - **PgBouncer**: Configured in `transaction` pooling mode. Allows up to 5,000 client application connections while capping database backend connections at 150 to preserve memory and prevent CPU thread starvation.

---

### 1.5 Caching, Distributed Locking & Session Management: Redis 7.2 Cluster

- **Engine**: **Redis 7.2+ Cluster** (3 Master + 3 Replica nodes across availability zones).
- **Multi-Tier Caching Architecture**:
  - **Tier 1 (L1 In-Memory Application Cache)**: Process-local LRU cache (`lru-cache` in Node.js) for ultra-static system metadata, active VAT rate configurations, and user RBAC permission sets (TTL: 60 seconds).
  - **Tier 2 (L2 Distributed Cluster Cache)**: Distributed caching of customer credit balance fast-reads, product pricing tiers, and active branch inventory snapshots (TTL: 15–60 minutes, invalidated via Redis PubSub/Kafka).
- **Distributed Locking & Concurrency Leases**:
  - **Redlock Algorithm**: Enforces distributed mutual exclusion across application instances during customer credit limit modifications to eliminate double-drawdown race conditions.
  - **Atomic Stock Reservation Leases**: Employs Redis atomic Lua scripts to issue 15-minute expiring reservation locks (`TTL 900s`) during B2B online checkouts, automatically releasing inventory if an order is abandoned.

---

### 1.6 Message Broker & Asynchronous Event Streaming: Apache Kafka & Outbox Pattern

- **Broker**: **Apache Kafka 3.6+** running in KRaft mode (3 brokers).
- **Guaranteed Consistency: Transactional Outbox Pattern**:
  - To prevent dual-write inconsistencies between the PostgreSQL database and Kafka, the application never publishes directly to Kafka within a user HTTP transaction.
  - Instead, domain events (`OrderCreatedEvent`, `CreditReservedEvent`, `TaxInvoicePostedEvent`) are written to an `outbox_events` table inside the exact same ACID database transaction that updates business state.
  - A high-throughput Debezium CDC connector (or dedicated NestJS outbox worker) reads the PostgreSQL Write-Ahead Log (WAL) and streams events to Kafka with strict `at-least-once` delivery and partition key ordering.
- **External Interfaces Integration Map (I0a–I0e)**:
  - `wds.masterdata.item-feed` (**I0a**): Merchandising item master feed (100,000 SKUs streamed in category-partitioned batches).
  - `wds.inventory.branch-stock-delta` (**I0b**): Real-time store till inventory sync.
  - `wds.crm.customer-sync` (**I0c**): B2B customer tier and tax profile synchronization.
  - `wds.pos.orders-outbound` (**I0d**): Direct store fulfillment sync.
  - `wds.finance.gl-posting` (**I0e**): Real-time financial ledger sync with SAP S/4HANA Finance.

---

### 1.7 Technology Stack Evaluation & Decision Matrix

| Tier / Component | Selected Technology | Evaluated Alternatives | Decisive Justification for WDS (9 Engineers / 26 Weeks) |
| :--- | :--- | :--- | :--- |
| **Backend API** | **NestJS 10 (Fastify)** | Go (Fiber), Spring Boot 3, Express.js | Highest team velocity; shared TypeScript types with frontend; automated OpenAPI generation; Fastify yields 30k req/s. |
| **Frontend Web** | **React 18 + Vite + AntD** | Next.js 14, Angular 17, Vue 3 | Zero SSR overhead for enterprise intranet; AntD provides richest data-table ecosystem for complex ERP forms. |
| **Primary Database** | **PostgreSQL 16.2+** | MySQL 8.0, Oracle 19c, MongoDB | Native `FOR UPDATE SKIP LOCKED`; ICU Thai collation (`th-TH-x-icu`); declarative partitioning; zero license fees. |
| **Query Layer** | **Kysely Query Builder** | TypeORM, Prisma, Raw `pg` | Full compile-time type safety without ORM performance drag; explicit support for CTEs, locking, and exact numeric types. |
| **Distributed Cache** | **Redis 7.2 Cluster** | Memcached, Hazelcast, KeyDB | Atomic Lua execution, Redlock distributed locking, built-in Redis Cluster failover, BullMQ queue integration. |
| **Event Streaming** | **Apache Kafka 3.6+ (KRaft)** | RabbitMQ, AWS SQS, NATS | High throughput for 100k SKU feed; message replayability; strict partition ordering by `customer_id` and `sku_code`. |
| **Audit Storage** | **PostgreSQL Partitioned + S3** | Elasticsearch, Cassandra | Relational consistency with business data; SHA-256 HMAC hash chaining; S3 Object Lock for immutable signed PDF/A-3. |

---

# 2. Complete Data Model & Production DDL Schemas

### 2.1 Entity Relationship Diagram & Relational Topology

```
+------------------------+              +------------------------------+
|       customers        |1           1 |   customer_credit_profiles   |
|------------------------+<-------------+------------------------------|
| customer_id (PK)       |              | profile_id (PK)              |
| tax_id, branch_number  |              | customer_id (FK, Unique)     |
| company_name_th (ICU)  |              | credit_limit_thb             |
| is_active, is_blocked  |              | current_exposure_thb         |
+-----------+------------+              | has_bounced_cheque           |
            |                           +--------------+---------------+
            |1                                         |1
            |                                          |
            |*                                         |*
+-----------v------------+              +--------------v---------------+
|         orders         |              |       customer_cheques       |
|------------------------+              |------------------------------|
| order_id (PK)          |              | cheque_id (PK)               |
| order_number (Unique)  |              | customer_id (FK)             |
| customer_id (FK)       |              | cheque_number, bank_code     |
| branch_id (FK)         |              | amount_thb                   |
| order_status           |              | clearing_status              |
| total_payable_thb      |              +------------------------------+
+-----------+------------+
            |1
            |
            +-----------------------+-----------------------+
            |*                      |1                      |1
+-----------v------------+  +-------v--------------+  +-----v------------------------+
|      order_items       |  |  tax_invoices        |  |  maker_checker_requests      |
|------------------------+  |  (PARTITIONED)       |  |------------------------------|
| item_id (PK)           |  |----------------------|  | request_id (PK)              |
| order_id (FK)          |  | invoice_id (PK)      |  | domain_module, action_type   |
| product_id (FK)        |  | invoice_number (UQ)  |  | staged_payload_json          |
| quantity, uom          |  | is_posted, is_void   |  | status, maker_id, checker_id |
| unit_net_price_thb     |  | output_vat_thb       |  +------------------------------+
| line_total_thb         |  | digital_signature    |
+-----------+------------+  +----------------------+
            |*
            |
            |*
+-----------v------------+              +------------------------------+
|        products        |1           * |  inventory_cement_lots (FEFO)|
|------------------------+<-------------+------------------------------|
| product_id (PK)        |              | lot_id (PK)                  |
| sku_code (Unique)      |              | product_id (FK)              |
| name_th (ICU), name_en |              | branch_id (FK)               |
| is_cement_bag          |              | batch_number                 |
| shelf_life_days        |              | expiration_date              |
+-----------+------------+              | on_hand_qty, reserved_qty    |
            |                           +------------------------------+
            |1
            |*
+-----------v------------+
|   product_price_tiers  |
|------------------------+
| tier_id (PK)           |
| product_id (FK)        |
| min_quantity           |
| max_quantity           |
| base_price_thb         |
| floor_price_thb        |
+------------------------+
```

---

### 2.2 Strict Data Type & Precision Rules (Absolute Ban on Floats)

To ensure zero financial discrepancies and maintain strict audit compliance with Central Retail Internal Audit and the Thai Revenue Department, floating-point representations (`FLOAT`, `REAL`, `DOUBLE PRECISION`, and JavaScript native `Number` for arithmetic) are **STRICTLY PROHIBITED** across all DDL schemas, DTO interfaces, and application code.

1. **Monetary Precision Standards**:
   - **Intermediate Pricing & Unit Rates**: `NUMERIC(18, 4)` is enforced for all intermediate unit prices, tier discount amounts, distance-based freight surcharges, and raw VAT portions before final line accumulation.
   - **Finalized Billing & Ledgers**: `NUMERIC(15, 2)` is enforced for all finalized line totals, invoice grand totals, tax liabilities, customer credit limits, and accounts receivable balances.
   - **Currency Standard**: ISO-4217 code `VARCHAR(3)` default `'THB'`.
2. **Inventory Quantity Precision Standards**:
   - **Stock & Order Quantities**: `NUMERIC(12, 4)` is enforced across all inventory balances, lot reservations, and order items. This guarantees exact representation of bulk fractional construction materials (e.g., `25.5000` metric tons of gravel, `14.2500` cubic meters of ready-mix concrete, `3.7500` linear meters of structural steel).
3. **Tax Rates and Percentages**:
   - **VAT Rates**: `NUMERIC(5, 4)` (e.g., `0.0700` for 7.00% VAT, `0.1000` for 10.00% VAT).
   - **Discount Percentages**: `NUMERIC(5, 2)` (e.g., `12.50` for 12.50%).
4. **Rounding Rules**:
   - **Intermediate Computations**: **Banker's Rounding / Half-to-Even** (`ROUND_HALF_EVEN`) is used in Node.js via `decimal.js` to eliminate statistical accumulation bias over large multi-line wholesale orders.
   - **Final Tax Invoice Totals**: **Half-Up Rounding** (`ROUND_HALF_UP`) to 2 decimal places is enforced in compliance with Revenue Department Regulation Paw. 86/2542.

---

### 2.3 Collation, Localization, and Temporal Storage Standards

1. **ICU Thai Collation**:
   - All text columns storing Thai entity names (`customers.company_name_th`, `products.name_th`, `inventory_branches.branch_name_th`, and Thai addresses) are explicitly configured with `COLLATE "th-TH-x-icu"`.
   - Guarantees sorting conforms to the Thai Royal Institute standard where vowels preceding consonants (`เ`, `แ`, `โ`, `ใ`, `ไ`) sort after their phonetic root consonant.
2. **Temporal Storage Standard**:
   - All date-time columns are stored as `TIMESTAMPTZ` in pure **UTC**.
   - Time zone offsets are applied strictly at the presentation boundary, converting to `Asia/Bangkok` (`UTC+07:00`) during UI rendering and official RD Tax Invoice PDF/XML generation.

---

### 2.4 Production SQL DDL Schemas (PostgreSQL 16+)

```sql
-- =============================================================================
-- THAI WATSADU WHOLESALE & DIRECT SALES (WDS) PLATFORM
-- PRODUCTION DDL SPECIFICATION - RELEASE 1.0
-- Database: PostgreSQL 16.2+
-- Collation: th-TH-x-icu
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- -----------------------------------------------------------------------------
-- 2.4.1 ENUMS AND EXTENSIONS
-- -----------------------------------------------------------------------------

CREATE TYPE order_status_enum AS ENUM (
    'DRAFT',
    'PENDING_CREDIT_CHECK',
    'PENDING_FLOOR_APPROVAL',
    'CONFIRMED',
    'ALLOCATED',
    'PARTIALLY_DELIVERED',
    'COMPLETED',
    'CANCELLED'
);

CREATE TYPE cheque_status_enum AS ENUM (
    'REGISTERED',
    'PENDING_CLEARING',
    'CLEARED',
    'BOUNCED',
    'RETURNED'
);

CREATE TYPE maker_checker_status_enum AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED',
    'CANCELLED'
);

CREATE TYPE action_type_enum AS ENUM (
    'INSERT',
    'UPDATE',
    'DELETE',
    'POST',
    'VOID'
);

CREATE TYPE credit_note_reason_enum AS ENUM (
    'GOODS_RETURN',              -- 1. สินค้าส่งคืนเนื่องจากชำรุดหรือผิดข้อกำหนด
    'PRICE_REDUCTION_DEFECT',    -- 2. ลดราคาสินค้าเนื่องจากชำรุดบกพร่อง
    'CALCULATION_ERROR',         -- 3. คำนวณราคาสินค้าผิดพลาดสูงกว่าความเป็นจริง
    'DISCOUNT_COMMERCIAL',       -- 4. ส่วนลดการค้าหรือเงินชดเชยภายหลังการขาย
    'ORDER_CANCELLED'            -- 5. บอกเลิกสัญญาการซื้อขาย
);

-- -----------------------------------------------------------------------------
-- 2.4.2 CUSTOMER & CREDIT CONTROL DOMAIN
-- -----------------------------------------------------------------------------

CREATE TABLE customers (
    customer_id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_code           VARCHAR(32) NOT NULL UNIQUE,
    tax_id                  VARCHAR(13) NOT NULL, -- 13-digit Juristic/Personal Tax ID
    branch_number           VARCHAR(5) NOT NULL DEFAULT '00000', -- '00000' = Head Office
    company_name_th         VARCHAR(255) COLLATE "th-TH-x-icu" NOT NULL,
    company_name_en         VARCHAR(255),
    registered_address_th   TEXT COLLATE "th-TH-x-icu" NOT NULL,
    postal_code             VARCHAR(5) NOT NULL,
    phone_number            VARCHAR(32) NOT NULL,
    email                   VARCHAR(128),
    is_active               BOOLEAN NOT NULL DEFAULT TRUE,
    is_credit_blocked       BOOLEAN NOT NULL DEFAULT FALSE,
    block_reason            TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_tax_id_format CHECK (tax_id ~ '^[0-9]{13}$'),
    CONSTRAINT chk_branch_format CHECK (branch_number ~ '^[0-9]{5}$')
);

CREATE INDEX idx_customers_tax_branch ON customers(tax_id, branch_number);
CREATE INDEX idx_customers_code ON customers(customer_code);
CREATE INDEX idx_customers_name_trgm ON customers USING gin(company_name_th gin_trgm_ops);

CREATE TABLE customer_credit_profiles (
    profile_id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id             UUID NOT NULL UNIQUE REFERENCES customers(customer_id) ON DELETE RESTRICT,
    credit_limit_thb        NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    current_exposure_thb    NUMERIC(15, 2) NOT NULL DEFAULT 0.00, -- AR Ledger + In-Flight Unbilled
    temporary_limit_thb     NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    temp_limit_expiry       TIMESTAMPTZ,
    payment_term_days       INTEGER NOT NULL DEFAULT 30,
    allow_cheque_payment    BOOLEAN NOT NULL DEFAULT FALSE,
    cheque_credit_limit_thb NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    current_cheque_exposure NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    has_bounced_cheque      BOOLEAN NOT NULL DEFAULT FALSE,
    last_credit_review_date TIMESTAMPTZ,
    version                 BIGINT NOT NULL DEFAULT 1, -- Optimistic concurrency control
    created_at              TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_credit_limit_non_negative CHECK (credit_limit_thb >= 0.00),
    CONSTRAINT chk_current_exposure_non_negative CHECK (current_exposure_thb >= 0.00),
    CONSTRAINT chk_payment_terms_positive CHECK (payment_term_days >= 0)
);

CREATE INDEX idx_credit_profiles_customer ON customer_credit_profiles(customer_id);

CREATE TABLE customer_cheques (
    cheque_id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id             UUID NOT NULL REFERENCES customers(customer_id) ON DELETE RESTRICT,
    cheque_number           VARCHAR(16) NOT NULL,
    bank_code               VARCHAR(8) NOT NULL, -- 'KBANK', 'SCB', 'BBL', 'KTB'
    bank_branch             VARCHAR(64),
    amount_thb              NUMERIC(15, 2) NOT NULL,
    cheque_date             DATE NOT NULL, -- Maturity date
    received_date           DATE NOT NULL DEFAULT CURRENT_DATE,
    clearing_status         cheque_status_enum NOT NULL DEFAULT 'REGISTERED',
    clearing_date           TIMESTAMPTZ,
    bounced_reason          VARCHAR(255),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_cheque_amount_positive CHECK (amount_thb > 0.00)
);

CREATE INDEX idx_customer_cheques_lookup ON customer_cheques(customer_id, clearing_status, cheque_date);

-- -----------------------------------------------------------------------------
-- 2.4.3 PRODUCT, PRICING & FREIGHT DOMAIN
-- -----------------------------------------------------------------------------

CREATE TABLE products (
    product_id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku_code                VARCHAR(32) NOT NULL UNIQUE,
    barcode                 VARCHAR(32),
    name_th                 VARCHAR(255) COLLATE "th-TH-x-icu" NOT NULL,
    name_en                 VARCHAR(255) NOT NULL,
    category_id             VARCHAR(32) NOT NULL,
    base_uom                VARCHAR(16) NOT NULL, -- 'BAG', 'TON', 'PIECE', 'METER'
    is_cement_bag           BOOLEAN NOT NULL DEFAULT FALSE,
    shelf_life_days         INTEGER NOT NULL DEFAULT 0, -- Cement shelf life (typically 60-90 days)
    weight_kg               NUMERIC(10, 4) NOT NULL DEFAULT 0.0000,
    is_active               BOOLEAN NOT NULL DEFAULT TRUE,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_products_sku ON products(sku_code);
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_name_trgm ON products USING gin(name_th gin_trgm_ops);

CREATE TABLE system_vat_configs (
    vat_config_id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vat_code                VARCHAR(16) NOT NULL, -- 'VAT_STANDARD', 'VAT_EXEMPT'
    vat_rate                NUMERIC(5, 4) NOT NULL, -- 0.0700 = 7%, 0.1000 = 10%
    effective_from          TIMESTAMPTZ NOT NULL,
    effective_to            TIMESTAMPTZ NOT NULL,
    description             VARCHAR(128),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_vat_rate_range CHECK (vat_rate >= 0.0000 AND vat_rate <= 1.0000),
    CONSTRAINT chk_vat_effective_dates CHECK (effective_from < effective_to)
);

CREATE UNIQUE INDEX uq_vat_effective_range ON system_vat_configs(vat_code, effective_from, effective_to);

CREATE TABLE product_price_tiers (
    tier_id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id              UUID NOT NULL REFERENCES products(product_id) ON DELETE RESTRICT,
    zone_id                 VARCHAR(16) NOT NULL DEFAULT 'ZONE_BKK',
    min_quantity            NUMERIC(12, 4) NOT NULL,
    max_quantity            NUMERIC(12, 4) NOT NULL,
    base_price_thb          NUMERIC(18, 4) NOT NULL,
    floor_price_thb         NUMERIC(18, 4) NOT NULL, -- Strict floor barrier
    effective_from          TIMESTAMPTZ NOT NULL,
    effective_to            TIMESTAMPTZ NOT NULL,
    is_active               BOOLEAN NOT NULL DEFAULT TRUE,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_tier_qty_range CHECK (min_quantity > 0.0000 AND min_quantity <= max_quantity),
    CONSTRAINT chk_floor_price_le_base CHECK (floor_price_thb <= base_price_thb AND floor_price_thb > 0.0000),
    CONSTRAINT chk_tier_date_range CHECK (effective_from < effective_to)
);

CREATE INDEX idx_price_tiers_lookup ON product_price_tiers(product_id, zone_id, is_active, effective_from, effective_to);

CREATE TABLE zone_freight_rates (
    freight_rate_id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    zone_id                 VARCHAR(16) NOT NULL,
    min_distance_km         NUMERIC(8, 2) NOT NULL DEFAULT 0.00,
    max_distance_km         NUMERIC(8, 2) NOT NULL,
    truck_type              VARCHAR(16) NOT NULL, -- '4_WHEEL', '6_WHEEL', '10_WHEEL', 'TRAILER'
    rate_per_trip_thb       NUMERIC(15, 2) NOT NULL,
    rate_per_ton_km_thb     NUMERIC(15, 4) NOT NULL DEFAULT 0.0000,
    is_active               BOOLEAN NOT NULL DEFAULT TRUE,
    effective_from          TIMESTAMPTZ NOT NULL,
    effective_to            TIMESTAMPTZ NOT NULL,
    CONSTRAINT chk_freight_distance_range CHECK (min_distance_km < max_distance_km),
    CONSTRAINT chk_freight_date_range CHECK (effective_from < effective_to)
);

-- -----------------------------------------------------------------------------
-- 2.4.4 INVENTORY, FEFO CEMENT LOTS & ATP RESERVATION DOMAIN
-- -----------------------------------------------------------------------------

CREATE TABLE inventory_branches (
    branch_id               VARCHAR(16) PRIMARY KEY, -- 'TW-BKK-01', 'TW-CMI-02'
    branch_name_th          VARCHAR(128) COLLATE "th-TH-x-icu" NOT NULL,
    is_distribution_center  BOOLEAN NOT NULL DEFAULT FALSE,
    is_active               BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE inventory_branch_stock (
    stock_id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    branch_id               VARCHAR(16) NOT NULL REFERENCES inventory_branches(branch_id),
    product_id              UUID NOT NULL REFERENCES products(product_id),
    physical_on_hand_qty    NUMERIC(12, 4) NOT NULL DEFAULT 0.0000,
    allocated_reserved_qty  NUMERIC(12, 4) NOT NULL DEFAULT 0.0000,
    available_to_promise_qty NUMERIC(12, 4) GENERATED ALWAYS AS (physical_on_hand_qty - allocated_reserved_qty) STORED,
    version                 BIGINT NOT NULL DEFAULT 1,
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_on_hand_non_negative CHECK (physical_on_hand_qty >= 0.0000),
    CONSTRAINT chk_reserved_lte_on_hand CHECK (allocated_reserved_qty >= 0.0000 AND allocated_reserved_qty <= physical_on_hand_qty),
    CONSTRAINT uq_branch_product UNIQUE (branch_id, product_id)
);

CREATE INDEX idx_branch_stock_lookup ON inventory_branch_stock(branch_id, product_id);

CREATE TABLE inventory_cement_lots (
    lot_id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku_id                  UUID NOT NULL REFERENCES products(product_id), -- Aligns with sku_id / product_id
    branch_id               VARCHAR(16) NOT NULL REFERENCES inventory_branches(branch_id),
    batch_number            VARCHAR(64) NOT NULL,
    manufacturing_date      DATE NOT NULL,
    expiry_date             DATE NOT NULL, -- Shelf life expiration
    remaining_qty           NUMERIC(12, 4) NOT NULL, -- Physical available in this lot
    allocated_qty           NUMERIC(12, 4) NOT NULL DEFAULT 0.0000,
    is_quarantined          BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_cement_lot_dates CHECK (manufacturing_date < expiry_date),
    CONSTRAINT chk_cement_remaining_qty CHECK (remaining_qty >= 0.0000),
    CONSTRAINT chk_cement_allocated_qty CHECK (allocated_qty >= 0.0000 AND allocated_qty <= remaining_qty)
);

-- Mandatory FEFO Compound Index for High-Concurrency Cement Allocation
CREATE INDEX idx_inv_lots_fefo ON inventory_cement_lots (sku_id, branch_id, expiry_date ASC, remaining_qty DESC);

CREATE TABLE inventory_reservations (
    reservation_id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id                UUID, -- Associated once order header is generated
    branch_id               VARCHAR(16) NOT NULL REFERENCES inventory_branches(branch_id),
    status                  VARCHAR(24) NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE', 'COMMITTED', 'RELEASED', 'EXPIRED'
    expires_at              TIMESTAMPTZ NOT NULL, -- Standard 15-minute lease (TTL 900s)
    created_at              TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reservations_cleanup ON inventory_reservations(status, expires_at)
WHERE status = 'ACTIVE';

CREATE TABLE inventory_reservation_items (
    reservation_item_id     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reservation_id          UUID NOT NULL REFERENCES inventory_reservations(reservation_id) ON DELETE CASCADE,
    product_id              UUID NOT NULL REFERENCES products(product_id),
    lot_id                  UUID REFERENCES inventory_cement_lots(lot_id), -- Populated for FEFO lots
    reserved_quantity       NUMERIC(12, 4) NOT NULL,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_reserved_qty_positive CHECK (reserved_quantity > 0.0000)
);

CREATE INDEX idx_reservation_items_lookup ON inventory_reservation_items(reservation_id, product_id);

-- -----------------------------------------------------------------------------
-- 2.4.5 ORDERS & LINE ITEMS DOMAIN
-- -----------------------------------------------------------------------------

CREATE TABLE orders (
    order_id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number            VARCHAR(32) NOT NULL UNIQUE, -- 'WDS-ORD-202609-0001'
    customer_id             UUID NOT NULL REFERENCES customers(customer_id) ON DELETE RESTRICT,
    branch_id               VARCHAR(16) NOT NULL REFERENCES inventory_branches(branch_id),
    reservation_id          UUID REFERENCES inventory_reservations(reservation_id),
    order_status            order_status_enum NOT NULL DEFAULT 'DRAFT',
    payment_method          VARCHAR(24) NOT NULL, -- 'CREDIT_TERM', 'CHEQUE', 'BANK_TRANSFER'
    payment_term_days       INTEGER NOT NULL DEFAULT 30,
    delivery_method         VARCHAR(24) NOT NULL, -- 'BRANCH_PICKUP', 'DIRECT_DELIVERY'
    delivery_address_th     TEXT COLLATE "th-TH-x-icu",
    delivery_zone_id        VARCHAR(16),
    subtotal_before_tax_thb NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    freight_charge_thb      NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    discount_total_thb      NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    vat_rate                NUMERIC(5, 4) NOT NULL DEFAULT 0.0700,
    vat_total_thb           NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    total_payable_thb       NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    requires_floor_override BOOLEAN NOT NULL DEFAULT FALSE,
    floor_override_approved BOOLEAN NOT NULL DEFAULT FALSE,
    floor_override_approver VARCHAR(64),
    created_by              VARCHAR(64) NOT NULL,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_orders_customer_status ON orders(customer_id, order_status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

CREATE TABLE order_items (
    item_id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id                UUID NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    line_number             INTEGER NOT NULL,
    product_id              UUID NOT NULL REFERENCES products(product_id),
    quantity                NUMERIC(12, 4) NOT NULL,
    uom                     VARCHAR(16) NOT NULL,
    unit_base_price_thb     NUMERIC(18, 4) NOT NULL,
    unit_floor_price_thb    NUMERIC(18, 4) NOT NULL,
    unit_discount_thb       NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    unit_net_price_thb      NUMERIC(18, 4) NOT NULL,
    line_subtotal_thb       NUMERIC(15, 2) NOT NULL,
    line_vat_thb            NUMERIC(15, 2) NOT NULL,
    line_total_thb          NUMERIC(15, 2) NOT NULL,
    is_below_floor_price    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_order_item_qty_pos CHECK (quantity > 0.0000),
    CONSTRAINT uq_order_line UNIQUE (order_id, line_number)
);

CREATE INDEX idx_order_items_order ON order_items(order_id);

-- -----------------------------------------------------------------------------
-- 2.4.6 REVENUE DEPARTMENT COMPLIANT TAX INVOICING DOMAIN (PARTITIONED)
-- -----------------------------------------------------------------------------

CREATE TABLE tax_invoices (
    invoice_id              UUID DEFAULT uuid_generate_v4(),
    invoice_number          VARCHAR(32) NOT NULL, -- 'INV-TW-{BRANCH}-{YYYYMM}-{SEQ}'
    order_id                UUID NOT NULL,
    customer_id             UUID NOT NULL,
    branch_id               VARCHAR(16) NOT NULL,
    seller_tax_id           VARCHAR(13) NOT NULL DEFAULT '0107553000107', -- Thai Watsadu Tax ID
    seller_branch_code      VARCHAR(5) NOT NULL,
    customer_tax_id         VARCHAR(13) NOT NULL,
    customer_branch_code    VARCHAR(5) NOT NULL,
    customer_name_th        VARCHAR(255) COLLATE "th-TH-x-icu" NOT NULL,
    customer_address_th     TEXT COLLATE "th-TH-x-icu" NOT NULL,
    invoice_date            DATE NOT NULL,
    posting_timestamp       TIMESTAMPTZ NOT NULL,
    subtotal_thb            NUMERIC(15, 2) NOT NULL,
    discount_thb            NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    freight_thb             NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    net_taxable_amount_thb  NUMERIC(15, 2) NOT NULL,
    vat_rate                NUMERIC(5, 4) NOT NULL,
    output_vat_thb          NUMERIC(15, 2) NOT NULL,
    grand_total_thb         NUMERIC(15, 2) NOT NULL,
    is_posted               BOOLEAN NOT NULL DEFAULT FALSE,
    is_cancelled            BOOLEAN NOT NULL DEFAULT FALSE,
    cancelled_reason        VARCHAR(255),
    digital_signature_hash  VARCHAR(256), -- SHA-256 canonical XML digest
    e_tax_status            VARCHAR(24) NOT NULL DEFAULT 'PENDING_SIGNING',
    pdf_storage_url         VARCHAR(512),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_tax_invoice_math CHECK (grand_total_thb = net_taxable_amount_thb + output_vat_thb),
    PRIMARY KEY (invoice_id, posting_timestamp)
) PARTITION BY RANGE (posting_timestamp);

-- Declarative Yearly Partitions
CREATE TABLE tax_invoices_2026 PARTITION OF tax_invoices
    FOR VALUES FROM ('2026-01-01 00:00:00+00') TO ('2027-01-01 00:00:00+00');

CREATE TABLE tax_invoices_2027 PARTITION OF tax_invoices
    FOR VALUES FROM ('2027-01-01 00:00:00+00') TO ('2028-01-01 00:00:00+00');

CREATE INDEX idx_tax_invoices_num ON tax_invoices(invoice_number);
CREATE INDEX idx_tax_invoices_cust ON tax_invoices(customer_id, invoice_date);

CREATE TABLE tax_invoice_items (
    invoice_item_id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id              UUID NOT NULL,
    posting_timestamp       TIMESTAMPTZ NOT NULL,
    line_number             INTEGER NOT NULL,
    product_id              UUID NOT NULL,
    sku_code                VARCHAR(32) NOT NULL,
    item_description_th     VARCHAR(255) COLLATE "th-TH-x-icu" NOT NULL,
    quantity                NUMERIC(12, 4) NOT NULL,
    uom                     VARCHAR(16) NOT NULL,
    unit_price_thb          NUMERIC(18, 4) NOT NULL,
    discount_thb            NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    net_line_amount_thb     NUMERIC(15, 2) NOT NULL,
    vat_amount_thb          NUMERIC(15, 2) NOT NULL,
    CONSTRAINT chk_inv_item_qty_pos CHECK (quantity > 0.0000)
);

CREATE INDEX idx_tax_inv_items_lookup ON tax_invoice_items(invoice_id);

-- -----------------------------------------------------------------------------
-- 2.4.7 STATUTORY CREDIT NOTES (THAI REVENUE CODE SECTION 86/10)
-- -----------------------------------------------------------------------------

CREATE TABLE credit_notes (
    credit_note_id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    credit_note_number              VARCHAR(32) NOT NULL UNIQUE, -- 'CN-TW-{BRANCH}-{YYYYMM}-{SEQ}'
    original_invoice_id             UUID NOT NULL REFERENCES tax_invoices(invoice_id),
    original_invoice_number         VARCHAR(32) NOT NULL,
    branch_code                     VARCHAR(5) NOT NULL,
    issue_date                      DATE NOT NULL,
    posting_timestamp               TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reason_code                     credit_note_reason_enum NOT NULL,
    reason_description_th           VARCHAR(500) COLLATE "th-TH-x-icu" NOT NULL,
    original_invoice_amount_thb     NUMERIC(15, 2) NOT NULL,
    correct_amount_thb              NUMERIC(15, 2) NOT NULL,
    difference_taxable_amount_thb   NUMERIC(15, 2) NOT NULL, -- Net reduction in tax base
    difference_vat_amount_thb       NUMERIC(15, 2) NOT NULL, -- 7% VAT reduction
    difference_total_amount_thb     NUMERIC(15, 2) NOT NULL, -- Total credit note value
    vat_rate_percent                NUMERIC(5, 2) NOT NULL DEFAULT 7.00,
    customer_id                     UUID NOT NULL REFERENCES customers(customer_id),
    customer_tax_id                 VARCHAR(13) NOT NULL,
    customer_branch_code            VARCHAR(5) NOT NULL,
    is_posted                       BOOLEAN NOT NULL DEFAULT FALSE,
    digital_signature_pades_id      VARCHAR(255),
    created_by                      UUID NOT NULL,
    approved_by                     UUID,
    created_at                      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_cn_amounts CHECK (
        original_invoice_amount_thb > correct_amount_thb AND
        difference_taxable_amount_thb = (original_invoice_amount_thb - correct_amount_thb) AND
        difference_total_amount_thb = (difference_taxable_amount_thb + difference_vat_amount_thb)
    )
);

CREATE INDEX idx_credit_notes_num ON credit_notes(credit_note_number);
CREATE INDEX idx_credit_notes_orig ON credit_notes(original_invoice_id);
CREATE INDEX idx_credit_notes_cust ON credit_notes(customer_id, issue_date);

CREATE TABLE credit_note_items (
    credit_note_item_id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    credit_note_id              UUID NOT NULL REFERENCES credit_notes(credit_note_id) ON DELETE CASCADE,
    line_number                 INTEGER NOT NULL,
    original_invoice_item_id    UUID,
    product_id                  UUID NOT NULL REFERENCES products(product_id),
    sku_code                    VARCHAR(32) NOT NULL,
    item_description_th         VARCHAR(255) COLLATE "th-TH-x-icu" NOT NULL,
    return_quantity             NUMERIC(12, 4) NOT NULL,
    uom                         VARCHAR(16) NOT NULL,
    unit_price_thb              NUMERIC(18, 4) NOT NULL,
    adjusted_line_amount_thb    NUMERIC(15, 2) NOT NULL,
    adjusted_vat_amount_thb     NUMERIC(15, 2) NOT NULL,
    adjusted_total_amount_thb   NUMERIC(15, 2) NOT NULL,
    CONSTRAINT chk_cn_item_qty CHECK (return_quantity > 0.0000)
);

CREATE INDEX idx_cn_items_parent ON credit_note_items(credit_note_id);

-- Immutability Guard for Credit Notes (Section 86/10)
CREATE OR REPLACE FUNCTION trg_prevent_posted_credit_note_mutation()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.is_posted = TRUE THEN
        RAISE EXCEPTION 'REVENUE DEPARTMENT SECURITY VIOLATION: Credit Note % has already been posted and is legally immutable per Thai Revenue Code Section 86/10.', OLD.credit_note_number
        USING ERRCODE = '27000';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_credit_notes_immutable
BEFORE UPDATE OR DELETE ON credit_notes
FOR EACH ROW EXECUTE FUNCTION trg_prevent_posted_credit_note_mutation();

-- -----------------------------------------------------------------------------
-- 2.4.8 CONCURRENCY-SAFE GAPLESS TAX INVOICE SEQUENCE GENERATOR
-- -----------------------------------------------------------------------------

CREATE TABLE tax_invoice_sequences (
    branch_code             VARCHAR(5) NOT NULL,
    fiscal_year_be          INTEGER NOT NULL,
    fiscal_month            INTEGER NOT NULL,
    last_assigned_sequence  INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (branch_code, fiscal_year_be, fiscal_month)
);

CREATE OR REPLACE FUNCTION fn_get_next_tax_invoice_number(
    p_branch VARCHAR(5),
    p_year_be INTEGER,
    p_month INTEGER
) RETURNS VARCHAR(32) AS $$
DECLARE
    v_next_seq INTEGER;
    v_doc_number VARCHAR(32);
BEGIN
    -- Atomic Upsert with increment guarantees gapless sequence with zero race conditions
    INSERT INTO tax_invoice_sequences (branch_code, fiscal_year_be, fiscal_month, last_assigned_sequence)
    VALUES (p_branch, p_year_be, p_month, 1)
    ON CONFLICT (branch_code, fiscal_year_be, fiscal_month)
    DO UPDATE SET last_assigned_sequence = tax_invoice_sequences.last_assigned_sequence + 1
    RETURNING last_assigned_sequence INTO v_next_seq;

    v_doc_number := 'INV-' || p_branch || '-' || p_year_be || '-' || LPAD(p_month::TEXT, 2, '0') || '-' || LPAD(v_next_seq::TEXT, 6, '0');
    RETURN v_doc_number;
END;
$$ LANGUAGE plpgsql;
```

---

### 2.5 Maker-Checker Staging & Dual-Control Schema

To satisfy Central Retail governance regulations, all high-impact operational mutations (adjustments to customer credit limits, floor-price overrides, and modifications to volume price tiers) are prevented from direct execution. They are captured in the `maker_checker_requests` staging schema. 

```sql
-- -----------------------------------------------------------------------------
-- 2.5 MAKER-CHECKER STAGING SCHEMA
-- -----------------------------------------------------------------------------

CREATE TABLE maker_checker_requests (
    request_id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    domain_module           VARCHAR(32) NOT NULL, -- 'CREDIT_LIMIT', 'PRICING_TIER', 'FLOOR_OVERRIDE'
    entity_name             VARCHAR(64) NOT NULL, -- e.g. 'customer_credit_profiles'
    entity_id               VARCHAR(64), -- Target record ID (NULL for INSERT)
    action_type             action_type_enum NOT NULL,
    staged_payload_json     JSONB NOT NULL, -- Proposed new state
    diff_summary_json       JSONB NOT NULL, -- Before/After delta for auditor review
    maker_user_id           VARCHAR(64) NOT NULL,
    maker_comments          TEXT NOT NULL,
    maker_submitted_at      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    checker_user_id         VARCHAR(64),
    checker_comments        TEXT,
    checker_action_at       TIMESTAMPTZ,
    status                  maker_checker_status_enum NOT NULL DEFAULT 'PENDING',
    applied_at              TIMESTAMPTZ,
    error_log               TEXT,
    -- Maker-Checker Invariant: Maker can never approve their own request
    CONSTRAINT chk_maker_checker_distinct CHECK (maker_user_id <> checker_user_id)
);

CREATE INDEX idx_maker_checker_pending ON maker_checker_requests(domain_module, status)
WHERE status = 'PENDING';
CREATE INDEX idx_maker_checker_entity ON maker_checker_requests(entity_name, entity_id);
```

---

### 2.6 Immutable Hash-Chained Audit Trail Schema (SHA-256 Ledger)

All security-relevant actions across WDS are written to `system_audit_logs`. To prevent tampering even by privileged database administrators, every audit record includes a cryptographic SHA-256 HMAC digest chaining directly to the previous entry's signature, forming a tamper-evident hash ledger.

```sql
-- -----------------------------------------------------------------------------
-- 2.6 IMMUTABLE HASH-CHAINED AUDIT TRAIL SCHEMA (PARTITIONED)
-- -----------------------------------------------------------------------------

CREATE TABLE system_audit_logs (
    audit_id                BIGSERIAL,
    event_timestamp         TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    trace_id                VARCHAR(64) NOT NULL,
    user_id                 VARCHAR(64) NOT NULL,
    user_ip_address         INET NOT NULL,
    domain_module           VARCHAR(32) NOT NULL, -- 'PRICING', 'CREDIT', 'INVENTORY', 'BILLING'
    action_type             action_type_enum NOT NULL,
    entity_name             VARCHAR(64) NOT NULL,
    entity_id               VARCHAR(64) NOT NULL,
    old_state_json          JSONB,
    new_state_json          JSONB,
    previous_record_hash    VARCHAR(64) NOT NULL, -- SHA-256 of preceding audit record
    current_record_hash     VARCHAR(64) NOT NULL, -- SHA-256(payload + previous_record_hash)
    PRIMARY KEY (audit_id, event_timestamp)
) PARTITION BY RANGE (event_timestamp);

-- Monthly Partitions for Audit Trail
CREATE TABLE system_audit_logs_2026_09 PARTITION OF system_audit_logs
    FOR VALUES FROM ('2026-09-01 00:00:00+00') TO ('2026-10-01 00:00:00+00');

CREATE TABLE system_audit_logs_2026_10 PARTITION OF system_audit_logs
    FOR VALUES FROM ('2026-10-01 00:00:00+00') TO ('2026-11-01 00:00:00+00');

CREATE INDEX idx_audit_logs_entity ON system_audit_logs(entity_name, entity_id, event_timestamp DESC);
CREATE INDEX idx_audit_logs_user ON system_audit_logs(user_id, event_timestamp DESC);

-- Trigger to Prohibit Any Mutation or Deletion of Audit Logs
CREATE OR REPLACE FUNCTION trg_lock_system_audit_logs()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'SECURITY AUDIT VIOLATION: system_audit_logs is an immutable append-only ledger. UPDATE and DELETE operations are strictly forbidden.'
    USING ERRCODE = '27001';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_logs_no_modify
BEFORE UPDATE OR DELETE ON system_audit_logs
FOR EACH ROW EXECUTE FUNCTION trg_lock_system_audit_logs();
```

---

### 2.7 PostgreSQL Triggers: Tax Invoice Strict Immutability Guards

Thai Revenue Department regulations (Revenue Code Sections 86/4 and 86/10) strictly forbid the alteration, tampering, or deletion of a Tax Invoice once it has been legally posted and assigned an official sequence number. Any price adjustments, returns, or billing cancellations must be executed via official Credit Notes (Section 86/10) or Debit Notes (Section 86/9), leaving the historical tax invoice ledger intact.

Two coordinated database triggers enforce this immutability at the storage engine level:
1. **Parent Header Guard (`trg_tax_invoice_immutable`)**: Halts any `UPDATE` or `DELETE` on posted tax invoices, and strictly guards the posting transition (`OLD.is_posted = FALSE AND NEW.is_posted = TRUE`) to guarantee that no financial figures, tax IDs, branch codes, customer identifiers, or order links are manipulated during the status transition statement.
2. **Child Item Guard (`trg_tax_invoice_items_immutable`)**: Prevents any `INSERT`, `UPDATE`, or `DELETE` on line items in `tax_invoice_items` whenever the parent invoice has `is_posted = TRUE`.

```sql
-- -----------------------------------------------------------------------------
-- 2.7.1 POSTED TAX INVOICE HEADER IMMUTABILITY TRIGGER
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION trg_prevent_posted_tax_invoice_mutation()
RETURNS TRIGGER AS $$
BEGIN
    -- 1. If already posted, completely block any UPDATE or DELETE operation
    IF TG_OP = 'DELETE' THEN
        IF OLD.is_posted = TRUE THEN
            RAISE EXCEPTION 'REVENUE DEPARTMENT SECURITY VIOLATION: Tax Invoice % has been legally posted and cannot be deleted per Section 86/4. Issue a Section 86/10 Credit Note.', OLD.invoice_number
            USING ERRCODE = '27000';
        END IF;
        RETURN OLD;
    END IF;

    IF TG_OP = 'UPDATE' THEN
        IF OLD.is_posted = TRUE THEN
            RAISE EXCEPTION 'REVENUE DEPARTMENT SECURITY VIOLATION: Tax Invoice % has already been posted and is legally immutable per Thai Revenue Code Section 86/4. Issue a Section 86/10 Credit Note for adjustments.', OLD.invoice_number
            USING ERRCODE = '27000';
        END IF;

        -- 2. Guard the posting transition (OLD.is_posted = FALSE AND NEW.is_posted = TRUE)
        -- Prevent tampering with statutory, financial, customer, or order fields upon posting
        IF OLD.is_posted = FALSE AND NEW.is_posted = TRUE THEN
            IF (OLD.subtotal_thb IS DISTINCT FROM NEW.subtotal_thb) OR
               (OLD.discount_thb IS DISTINCT FROM NEW.discount_thb) OR
               (OLD.freight_thb IS DISTINCT FROM NEW.freight_thb) OR
               (OLD.net_taxable_amount_thb IS DISTINCT FROM NEW.net_taxable_amount_thb) OR
               (OLD.output_vat_thb IS DISTINCT FROM NEW.output_vat_thb) OR
               (OLD.grand_total_thb IS DISTINCT FROM NEW.grand_total_thb) OR
               (OLD.customer_id IS DISTINCT FROM NEW.customer_id) OR
               (OLD.customer_tax_id IS DISTINCT FROM NEW.customer_tax_id) OR
               (OLD.customer_branch_code IS DISTINCT FROM NEW.customer_branch_code) OR
               (OLD.seller_tax_id IS DISTINCT FROM NEW.seller_tax_id) OR
               (OLD.seller_branch_code IS DISTINCT FROM NEW.seller_branch_code) OR
               (OLD.vat_rate IS DISTINCT FROM NEW.vat_rate) OR
               (OLD.order_id IS DISTINCT FROM NEW.order_id) OR
               (OLD.branch_id IS DISTINCT FROM NEW.branch_id) THEN
                RAISE EXCEPTION 'REVENUE DEPARTMENT SECURITY VIOLATION: Financial, statutory, customer, and tax fields cannot be modified during posting transition for invoice %.', NEW.invoice_number
                USING ERRCODE = '27001';
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_tax_invoice_immutable
BEFORE UPDATE OR DELETE ON tax_invoices
FOR EACH ROW EXECUTE FUNCTION trg_prevent_posted_tax_invoice_mutation();

-- -----------------------------------------------------------------------------
-- 2.7.2 CHILD TAX INVOICE ITEMS IMMUTABILITY TRIGGER
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION trg_prevent_posted_tax_invoice_items_mutation()
RETURNS TRIGGER AS $$
DECLARE
    v_is_posted BOOLEAN;
    v_inv_num VARCHAR(32);
    v_target_invoice_id UUID;
BEGIN
    IF TG_OP = 'INSERT' THEN
        v_target_invoice_id := NEW.invoice_id;
    ELSE
        v_target_invoice_id := OLD.invoice_id;
    END IF;

    -- Query parent tax invoice status
    SELECT is_posted, invoice_number INTO v_is_posted, v_inv_num
    FROM tax_invoices
    WHERE invoice_id = v_target_invoice_id;

    IF v_is_posted = TRUE THEN
        RAISE EXCEPTION 'REVENUE DEPARTMENT SECURITY VIOLATION: Line items for posted Tax Invoice % are legally immutable per Thai Revenue Code Section 86/4. Issue a Section 86/10 Credit Note for adjustments.', v_inv_num
        USING ERRCODE = '27000';
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_tax_invoice_items_immutable
BEFORE INSERT OR UPDATE OR DELETE ON tax_invoice_items
FOR EACH ROW EXECUTE FUNCTION trg_prevent_posted_tax_invoice_items_mutation();
```

---

# 3. Production-Ready API Specifications & Data Contracts (RESTful / OpenAPI 3.0)

### 3.1 Global API Conventions, Headers & RFC 7807 Error Envelope

1. **Protocol & Content Type**: HTTPS TLS 1.3 only; `application/json; charset=utf-8`.
2. **Idempotency Guard**: All mutating endpoints (`POST`, `PATCH`, `DELETE`) mandate the `X-Idempotency-Key` HTTP header with a client-generated UUID v4. The backend stores response snapshots in Redis with a 24-hour TTL, ensuring network retries return the exact original response without duplicate order creation or double credit deductions.
3. **Security Headers**:
   - `Authorization: Bearer <JWT_ACCESS_TOKEN>`
   - `X-Trace-Id: <UUID_V4>`
   - `X-Client-Branch-Id: TW-BKK-01`
4. **RFC 7807 Problem Details Error Envelope**:
   ```json
   {
     "type": "https://api.thaiwatsadu.com/errors/credit-limit-exceeded",
     "title": "Credit Limit Exceeded",
     "status": 422,
     "detail": "Requested order amount 250,000.00 THB exceeds customer available credit 180,000.00 THB by 70,000.00 THB.",
     "instance": "/api/v1/orders",
     "traceId": "c4b8e21a-493a-449e-b9b5-6fbfef6a811d",
     "timestamp": "2026-09-09T03:20:00Z",
     "invalidParams": [
       {
         "name": "total_payable_thb",
         "reason": "Exceeds available credit line"
       }
     ]
   }
   ```

---

### 3.2 Endpoint 1: Dynamic Pricing Calculation (`POST /api/v1/pricing/calculate`)

Calculates wholesale multi-tier volume discounts, delivery zone freight surcharges, floor-price barrier validations, and effective-dated Thai VAT (7.00%).

#### Request Headers
- `Content-Type: application/json`
- `Authorization: Bearer <JWT>`

#### Request Payload
```json
{
  "customerId": "8f683a42-7c85-48b2-b43e-c6d997b1050e",
  "branchId": "TW-BKK-01",
  "deliveryZoneId": "ZONE_BKK_EAST",
  "deliveryDistanceKm": "28.50",
  "requestedDeliveryDate": "2026-09-12T08:00:00Z",
  "items": [
    {
      "lineNumber": 1,
      "productId": "3f443b71-3cb5-4cf5-b108-a92440ea9011",
      "skuCode": "SKU-CEM-SCG-50KG",
      "quantity": "250.0000",
      "uom": "BAG"
    },
    {
      "lineNumber": 2,
      "productId": "9b123a10-21a4-4df2-a129-c88990bb8204",
      "skuCode": "SKU-STEEL-RB-12MM",
      "quantity": "100.0000",
      "uom": "PIECE"
    }
  ]
}
```

#### Response Payload (HTTP 200 OK)
```json
{
  "calculationId": "calc-99214b60-3129-450b-810a-2009a7b9c104",
  "currency": "THB",
  "vatRate": "0.0700",
  "pricingSummary": {
    "grossSubtotalThb": "58750.00",
    "totalVolumeDiscountThb": "3250.00",
    "freightChargeThb": "1800.00",
    "netTaxableAmountThb": "57300.00",
    "vatTotalThb": "4011.00",
    "totalPayableThb": "61311.00"
  },
  "floorPriceCheck": {
    "hasFloorViolation": false,
    "approvalRequired": false
  },
  "items": [
    {
      "lineNumber": 1,
      "skuCode": "SKU-CEM-SCG-50KG",
      "quantity": "250.0000",
      "uom": "BAG",
      "unitListPriceThb": "165.0000",
      "volumeTierApplied": {
        "tierId": "tier-552",
        "minQty": "200.0000",
        "maxQty": "500.0000",
        "discountPerUnitThb": "10.0000"
      },
      "unitFloorPriceThb": "148.0000",
      "unitNetPriceThb": "155.0000",
      "lineDiscountThb": "2500.00",
      "lineSubtotalThb": "38750.00",
      "lineVatThb": "2712.50",
      "lineTotalThb": "41462.50",
      "isFloorViolated": false
    },
    {
      "lineNumber": 2,
      "skuCode": "SKU-STEEL-RB-12MM",
      "quantity": "100.0000",
      "uom": "PIECE",
      "unitListPriceThb": "200.0000",
      "volumeTierApplied": {
        "tierId": "tier-811",
        "minQty": "50.0000",
        "maxQty": "200.0000",
        "discountPerUnitThb": "7.5000"
      },
      "unitFloorPriceThb": "185.0000",
      "unitNetPriceThb": "192.5000",
      "lineDiscountThb": "750.00",
      "lineSubtotalThb": "19250.00",
      "lineVatThb": "1347.50",
      "lineTotalThb": "20597.50",
      "isFloorViolated": false
    }
  ]
}
```

---

### 3.3 Endpoint 2: Order Submission & Validation (`POST /api/v1/orders`)

Validates commercial credit limits, verifies that the inventory reservation lease is active and committed, checks for floor price breaches, and transitions the order state into `CONFIRMED`.

#### Request Headers
- `Content-Type: application/json`
- `X-Idempotency-Key: a1b2c3d4-e5f6-7890-abcd-ef1234567890`
- `Authorization: Bearer <JWT>`

#### Request Payload
```json
{
  "customerId": "8f683a42-7c85-48b2-b43e-c6d997b1050e",
  "branchId": "TW-BKK-01",
  "reservationId": "res-77218a00-1122-3344-5566-778899aabbcc",
  "floorOverrideRequestId": "req-99214b60-3129-450b-810a-2009a7b9c104",
  "paymentMethod": "CREDIT_TERM",
  "paymentTermDays": 30,
  "deliveryMethod": "DIRECT_DELIVERY",
  "deliveryAddressTh": "99/1 หมู่ 4 ตำบลบางพลีใหญ่ อำเภอบางพลี จังหวัดสมุทรปราการ 10540",
  "deliveryZoneId": "ZONE_BKK_EAST",
  "expectedTotalPayableThb": "61311.00",
  "items": [
    {
      "lineNumber": 1,
      "productId": "3f443b71-3cb5-4cf5-b108-a92440ea9011",
      "quantity": "250.0000",
      "uom": "BAG",
      "unitNetPriceThb": "155.0000"
    },
    {
      "lineNumber": 2,
      "productId": "9b123a10-21a4-4df2-a129-c88990bb8204",
      "quantity": "100.0000",
      "uom": "PIECE",
      "unitNetPriceThb": "192.5000"
    }
  ]
}
```

> **Contract Governance Rule**: If any line item is priced below the minimum floor margin, the order is rejected with `422 Unprocessable Entity: FLOOR_PRICE_BREACH` unless `floorOverrideRequestId` (UUID) is supplied and references an approved record in `maker_checker_requests` (`status = 'APPROVED'`) authorized by a Level-4 Commercial VP.

#### Response Payload (HTTP 201 Created)
```json
{
  "orderId": "ord-339900aa-bbcc-ddee-ff00-112233445566",
  "orderNumber": "WDS-ORD-202609-0001",
  "orderStatus": "CONFIRMED",
  "customerId": "8f683a42-7c85-48b2-b43e-c6d997b1050e",
  "financialSummary": {
    "currency": "THB",
    "subtotalBeforeTaxThb": "58000.00",
    "freightChargeThb": "1800.00",
    "discountTotalThb": "3250.00",
    "netTaxableAmountThb": "57300.00",
    "vatTotalThb": "4011.00",
    "totalPayableThb": "61311.00"
  },
  "creditHold": {
    "isHeld": false,
    "currentExposureThb": "211311.00",
    "remainingCreditLimitThb": "288689.00"
  },
  "inventoryReservation": {
    "reservationId": "res-77218a00-1122-3344-5566-778899aabbcc",
    "status": "COMMITTED"
  },
  "createdAt": "2026-09-09T03:20:00Z"
}
```

---

### 3.4 Endpoint 3: Real-Time Credit Check (`POST /api/v1/credit/check`)

Evaluates customer creditworthiness in real time. Aggregates posted Accounts Receivable ledger balances, unbilled in-flight orders, uncleared post-dated cheques, and historical bounced cheque flags against the effective credit limit.

#### Request Headers
- `Content-Type: application/json`
- `Authorization: Bearer <JWT>`

#### Request Payload
```json
{
  "customerId": "8f683a42-7c85-48b2-b43e-c6d997b1050e",
  "proposedOrderAmountThb": "61311.00",
  "paymentMethod": "CREDIT_TERM",
  "includePendingCheques": true
}
```

#### Response Payload (HTTP 200 OK)
```json
{
  "customerId": "8f683a42-7c85-48b2-b43e-c6d997b1050e",
  "customerNameTh": "บริษัท สยาม คอนสตรัคชั่น จำกัด (มหาชน)",
  "isEligible": true,
  "creditBlockStatus": {
    "isBlocked": false,
    "blockReason": null,
    "hasBouncedCheque": false
  },
  "exposureDetails": {
    "baseCreditLimitThb": "500000.00",
    "temporaryCreditLimitThb": "0.00",
    "effectiveCreditLimitThb": "500000.00",
    "postedArBalanceThb": "120000.00",
    "unbilledCommittedOrdersThb": "30000.00",
    "unclearedChequesThb": "25000.00",
    "currentTotalExposureThb": "150000.00",
    "projectedTotalExposureThb": "211311.00",
    "remainingAvailableCreditThb": "288689.00",
    "utilizationPercentage": "42.26"
  },
  "action": "APPROVE"
}
```

---

### 3.5 Endpoint 4: Stock Reservation / ATP Commitment (`POST /api/v1/inventory/reserve`)

Executes high-concurrency Available-to-Promise stock allocation. For bagged cement, it enforces **FEFO (First-Expired, First-Out)** lot assignment using row-level locking (`SELECT ... FOR UPDATE SKIP LOCKED`), returning a 15-minute lease reservation ID.

#### Request Headers
- `Content-Type: application/json`
- `X-Idempotency-Key: b2c3d4e5-f6a7-8901-bcde-f12345678901`
- `Authorization: Bearer <JWT>`

#### Request Payload
```json
{
  "branchId": "TW-BKK-01",
  "reservationTtlSeconds": 900,
  "orderReference": "TEMP-QUOTE-88912",
  "items": [
    {
      "productId": "3f443b71-3cb5-4cf5-b108-a92440ea9011",
      "skuCode": "SKU-CEM-SCG-50KG",
      "requestedQuantity": "250.0000",
      "requiresFefo": true
    }
  ]
}
```

#### Response Payload (HTTP 200 OK)
```json
{
  "reservationId": "res-77218a00-1122-3344-5566-778899aabbcc",
  "branchId": "TW-BKK-01",
  "status": "ACTIVE",
  "expiresAt": "2026-09-09T03:35:00Z",
  "allocatedItems": [
    {
      "productId": "3f443b71-3cb5-4cf5-b108-a92440ea9011",
      "skuCode": "SKU-CEM-SCG-50KG",
      "requestedQuantity": "250.0000",
      "allocatedQuantity": "250.0000",
      "isFullyAllocated": true,
      "fefoLotSplits": [
        {
          "lotId": "lot-202607-001",
          "batchNumber": "BATCH-SCG-260701",
          "manufacturingDate": "2026-07-01",
          "expiryDate": "2026-10-01",
          "allocatedQuantity": "150.0000"
        },
        {
          "lotId": "lot-202607-002",
          "batchNumber": "BATCH-SCG-260715",
          "manufacturingDate": "2026-07-15",
          "expiryDate": "2026-10-15",
          "allocatedQuantity": "100.0000"
        }
      ]
    }
  ]
}
```

---

### 3.6 Endpoint 5: Tax Invoice Generation & Posting (`POST /api/v1/tax-invoices/post`)

Generates an official Revenue Department Full Tax Invoice (ใบกำกับภาษีเต็มรูป), computes Output VAT with half-up rounding, generates the SHA-256 canonical XML digest, and transitions the invoice to an immutable `POSTED` state.

#### Request Headers
- `Content-Type: application/json`
- `X-Idempotency-Key: c3d4e5f6-a7b8-9012-cdef-123456789012`
- `Authorization: Bearer <JWT>`

#### Request Payload
```json
{
  "orderId": "ord-339900aa-bbcc-ddee-ff00-112233445566",
  "branchId": "TW-BKK-01",
  "invoiceDate": "2026-09-09",
  "deliveryReceiptNumber": "DO-TW-202609-0012"
}
```

#### Response Payload (HTTP 201 Created)
```json
{
  "invoiceId": "inv-55112233-4455-6677-8899-aabbccddeeff",
  "invoiceNumber": "INV-TW-BKK01-202609-00812",
  "isPosted": true,
  "postingTimestamp": "2026-09-09T03:20:00Z",
  "legalEntity": {
    "seller": {
      "nameTh": "บริษัท ซีอาร์ซี ไทวัสดุ จำกัด",
      "taxId": "0107553000107",
      "branchCode": "00001",
      "branchNameTh": "สาขาบางนา"
    },
    "buyer": {
      "customerCode": "CUST-B2B-0089",
      "nameTh": "บริษัท สยาม คอนสตรัคชั่น จำกัด (มหาชน)",
      "taxId": "0105558012345",
      "branchCode": "00000",
      "branchNameTh": "สำนักงานใหญ่",
      "addressTh": "99/1 หมู่ 4 ตำบลบางพลีใหญ่ อำเภอบางพลี จังหวัดสมุทรปราการ 10540"
    }
  },
  "financialBreakdown": {
    "currency": "THB",
    "subtotalThb": "58000.00",
    "freightThb": "1800.00",
    "discountThb": "3250.00",
    "netTaxableAmountThb": "57300.00",
    "vatRate": "0.0700",
    "outputVatThb": "4011.00",
    "grandTotalThb": "61311.00",
    "grandTotalThaiBahtText": "หกหมื่นหนึ่งพันสามร้อยสิบเอ็ดบาทถ้วน"
  },
  "compliance": {
    "digitalSignatureHash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "eTaxStatus": "PENDING_ETAX_TRANSMISSION",
    "isLegallyImmutable": true
  },
  "documentUrls": {
    "pdfDownloadUrl": "https://cdn.thaiwatsadu.com/invoices/2026/09/INV-TW-BKK01-202609-00812.pdf",
    "xmlDataUrl": "https://cdn.thaiwatsadu.com/invoices/2026/09/INV-TW-BKK01-202609-00812.xml"
  }
}
```

---

# 4. Engineering Standards & Testing Guidelines

### 4.1 Git Commit Convention with Requirement ID Enforcement

To ensure an unbroken audit traceability matrix connecting every single commit in the codebase back to the 249 Release 1 requirements in the SRS v1.1, all engineers must format their commit messages according to the following standard:

```
[FR-xx-xxx] <type>(<scope>): <subject>

[optional body]

[optional footer]
```

#### Specification Rules
1. **Bracketed Requirement Tag `[FR-xx-xxx]`**:
   - Must match the official SRS v1.1 requirement ID format (e.g. `[FR-02-005]`, `[FR-07-012]`, `[FR-10-001]`).
   - Cross-cutting, infrastructure, or CI/CD commits must use `[FR-SYS-001]` through `[FR-SYS-999]`.
2. **Type**: Must be one of `feat`, `fix`, `refactor`, `test`, `chore`, `docs`.
3. **Scope (Optional)**: Specific domain module in snake_case or kebab-case (`pricing_engine`, `credit`, `inventory`, `orders`, `billing`, `db`, `auth`).
4. **Subject**: Imperative mood, present tense, lowercase start, no trailing period, maximum 72 characters.
5. **Enforcement Regex Pattern**:
   ```regex
   ^\[FR-[A-Z0-9]{2,4}-[0-9]{3,4}\] (feat|fix|refactor|test|chore|docs)(\([a-z0-9_-]+\))?: [a-z0-9][a-zA-Z0-9 _-]{1,70}[^.]$
   ```

#### Valid Examples
- `[FR-02-004] feat(pricing_engine): implement volume break tiered pricing`
- `[FR-07-012] fix(inventory): enforce fefo sort order on cement allocation`
- `[FR-03-008] test(credit): add test cases for post-dated cheque clearing`
- `[FR-SYS-001] chore(ci): configure automated 5-gate pipeline in github actions`

---

### 4.2 Executable Husky `commit-msg` Hook Script

The following executable script is installed in the repository at `.husky/commit-msg` (or `.git/hooks/commit-msg`). It verifies commit messages locally before allowing the commit to be recorded:

```bash
#!/usr/bin/env bash
# ==============================================================================
# Thai Watsadu WDS Git Commit Message Linter Hook
# Location: .husky/commit-msg
# Pattern: ^\[FR-[A-Z0-9]{2,4}-[0-9]{3,4}\] (feat|fix|refactor|test|chore|docs)(\([a-z0-9_-]+\))?: [a-z0-9][a-zA-Z0-9 _-]{1,70}[^.]$
# ==============================================================================

set -e

COMMIT_MSG_FILE=$1
COMMIT_MSG=$(head -n 1 "$COMMIT_MSG_FILE")

# Official WDS Requirement Traceability Pattern
PATTERN="^\[FR-[A-Z0-9]{2,4}-[0-9]{3,4}\] (feat|fix|refactor|test|chore|docs)(\([a-z0-9_-]+\))?: [a-z0-9][a-zA-Z0-9 _-]{1,70}[^.]$"

if ! [[ "$COMMIT_MSG" =~ $PATTERN ]]; then
    echo "================================================================================"
    echo "❌ ERROR: GIT COMMIT MESSAGE REJECTED BY WDS ARCHITECTURAL POLICY"
    echo "--------------------------------------------------------------------------------"
    echo "Your commit message does not conform to the required traceability standard."
    echo ""
    echo "Violations detected in:"
    echo "   \"$COMMIT_MSG\""
    echo ""
    echo "Policy Rules Enforced:"
    echo "   1. Must start with bracketed Requirement ID: [FR-xx-xxx] or [FR-SYS-xxx]"
    echo "   2. Type must be: feat, fix, refactor, test, chore, docs"
    echo "   3. Scope is optional in parentheses supporting snake_case: e.g. (pricing_engine), (tax), (fefo)"
    echo "   4. Subject MUST start with a lowercase character"
    echo "   5. Subject MUST NOT end with a period"
    echo "   6. Subject line must be concise (maximum 72 characters after colon)"
    echo ""
    echo "Valid Examples:"
    echo "   [FR-02-004] feat(pricing_engine): implement volume break tiered pricing"
    echo "   [FR-07-012] fix(inventory): enforce fefo sort order on cement allocation"
    echo "   [FR-03-008] test(credit): add test cases for post-dated cheque clearing"
    echo "   [FR-SYS-001] chore(ci): configure automated 5-gate pipeline in github actions"
    echo "================================================================================"
    exit 1
fi

# Explicit check on subject portion length (max 72 chars)
SUBJECT=$(echo "$COMMIT_MSG" | sed -E 's/^\[FR-[A-Z0-9]{2,4}-[0-9]{3,4}\] (feat|fix|refactor|test|chore|docs)(\([a-z0-9_-]+\))?: //')
if [ ${#SUBJECT} -gt 72 ]; then
    echo "❌ ERROR: Commit subject is too long (${#SUBJECT} chars). Maximum allowed is 72 characters."
    exit 1
fi

echo "✅ Git commit message conforms to WDS requirement traceability standard."
exit 0
```

---

### 4.3 Definition of Ready (DoR) and Definition of Done (DoD) Checklists

#### Definition of Ready (DoR)
A user story or requirement is admitted into a 2-week development Sprint (S0–S12) only when all of the following criteria are satisfied:
- [ ] **Traceability**: Explicitly mapped to a valid `[FR-xx-xxx]` identifier from the SRS v1.1.
- [ ] **Acceptance Criteria**: Formatted as unambiguous, executable Gherkin scenarios (`Given`, `When`, `Then`).
- [ ] **Precision Specification**: All monetary and inventory fields specify exact `NUMERIC(p, s)` definitions. No floating-point types permitted.
- [ ] **API Contract Reviewed**: OpenAPI 3.0 request/response JSON payload schemas agreed upon and approved by both frontend and backend leads.
- [ ] **Maker-Checker & Governance Classification**: Explicitly identifies whether mutations require Maker-Checker staging and logs data masking rules.
- [ ] **Dependency Clearance**: All upstream schema migrations or interface feeds (I0a–I0e) are available or stubbed via WireMock.

#### Definition of Done (DoD)
A story or requirement is declared COMPLETE and accepted into the release branch only when all of the following criteria are satisfied:
- [ ] **Code Implementation**: Fully implemented in TypeScript 5.x / NestJS 10, passing strict compiler checks (`tsc --noEmit`) with zero ESLint warnings.
- [ ] **Zero Float Rule Verified**: Static analysis confirms that no `FLOAT`, `DOUBLE`, or native JS floating arithmetic was used in monetary or inventory pathways.
- [ ] **Automated Test Coverage**:
  - Minimum **>=80% line and branch coverage** on core business modules (`pricing`, `credit`, `inventory`, `billing`).
  - Unit tests and integration tests passing in the CI pipeline.
- [ ] **Database Migration Dry-Run**: Forward migrations and reverse rollback scripts successfully executed on an ephemeral PostgreSQL 16 instance.
- [ ] **Dual Peer Review**: Pull Request approved by at least 2 senior engineers; PR description links to the `[FR-xx-xxx]` task.
- [ ] **Immutability & Security Verification**: DB triggers for posted tax invoices and audit trails verified against unauthorized mutations.
- [ ] **CI/CD Quality Gates Passed**: Passed all 5 automated CI/CD pipeline gates with zero High/Critical security vulnerabilities.

---

### 4.4 Automated CI/CD 5-Gate Quality Pipeline

All code pushed to pull requests and main branches must pass through the **5-Gate CI/CD Quality Pipeline**:

```
[ Git Push / Pull Request ]
             |
             v
+-------------------------------------------------------------+
| GATE 1: Syntax, Lint & Secret Scan                          |
| - ESLint strict check (0 warnings, 0 errors)                |
| - TypeScript compiler verification (tsc --noEmit)           |
| - Gitleaks / TruffleHog secret scanning (zero exposed keys) |
+-------------------------------------------------------------+
             |
             v
+-------------------------------------------------------------+
| GATE 2: Unit & Component Testing                            |
| - Jest / Vitest test runner                                 |
| - Code coverage check (>= 80% line & branch on core engines)|
| - Fail build if coverage drops below 80% threshold          |
+-------------------------------------------------------------+
             |
             v
+-------------------------------------------------------------+
| GATE 3: Database Migration Dry-Run & Schema Linter          |
| - Spin up ephemeral PostgreSQL 16 testcontainer             |
| - Execute forward migrations (V1 -> V_latest)               |
| - Run SQL schema linter (FAIL if any FLOAT/DOUBLE found)    |
| - Execute rollback migrations to verify down-migration      |
+-------------------------------------------------------------+
             |
             v
+-------------------------------------------------------------+
| GATE 4: Static Analysis & Mutation Testing                  |
| - SonarQube Quality Gate (Maintainability A, Duplication<3%)|
| - Stryker mutation testing on pricing & credit (score >=70%)|
| - Zero OWASP Top 10 vulnerabilities (SQLi, IDOR)            |
+-------------------------------------------------------------+
             |
             v
+-------------------------------------------------------------+
| GATE 5: Security Pen-Test & License Audit                   |
| - Snyk / Trivy dependency CVE scanning (0 High / Critical)  |
| - FOSSA open-source license audit (GPL/Copyleft prohibited) |
| - OWASP ZAP baseline API scan on staging environment        |
+-------------------------------------------------------------+
             |
             v
[ All 5 Gates Passed -> Approved for Production Deployment ]
```

---

### 4.5 Unit & Integration Testing Guidelines (>=80% Coverage Standard)

The testing pyramid for WDS enforces the following testing levels:
1. **Unit Tests (Jest / Vitest)**: Fast, in-memory execution covering pure business logic engines (`PricingEngine`, `CreditControlEngine`, `FefoAllocationStrategy`, `TaxVatCalculator`). Mocks are limited to boundary adapters.
2. **Integration Tests (Testcontainers)**: Spawns real PostgreSQL 16 and Redis 7.2 Docker containers to verify database transactions, `SELECT ... FOR UPDATE SKIP LOCKED` race conditions, database triggers, and outbox event streaming.
3. **Core Engine Coverage Standards**:
   - `modules/pricing`: **>= 85% Statement & Branch Coverage**
   - `modules/credit`: **>= 85% Statement & Branch Coverage**
   - `modules/inventory`: **>= 85% Statement & Branch Coverage**
   - `modules/billing`: **>= 90% Statement & Branch Coverage**

---

### 4.6 Production-Grade Test Suites (TypeScript / Jest / Vitest)

#### 4.6.1 Pricing Engine Test Suite (`pricing-engine.spec.ts`)
```typescript
import { Decimal } from 'decimal.js';

// Configuration: Enforce Banker's Rounding for intermediate financial computations
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_EVEN });

interface PriceTier {
  minQty: Decimal;
  maxQty: Decimal;
  discountPerUnit: Decimal;
}

interface PricingLineInput {
  skuCode: string;
  quantity: Decimal;
  unitListPrice: Decimal;
  unitFloorPrice: Decimal;
  manualDiscountPerUnit?: Decimal;
  tiers: PriceTier[];
}

export class PricingEngine {
  public calculateLineItem(input: PricingLineInput) {
    let appliedDiscount = new Decimal(0);

    // 1. Locate qualifying volume tier
    for (const tier of input.tiers) {
      if (input.quantity.gte(tier.minQty) && input.quantity.lte(tier.maxQty)) {
        appliedDiscount = tier.discountPerUnit;
        break;
      }
    }

    // 2. Add manual discount if specified
    if (input.manualDiscountPerUnit) {
      appliedDiscount = appliedDiscount.plus(input.manualDiscountPerUnit);
    }

    // 3. Compute net price
    const unitNetPrice = input.unitListPrice.minus(appliedDiscount);
    const isFloorViolated = unitNetPrice.lt(input.unitFloorPrice);

    const lineDiscount = appliedDiscount.times(input.quantity);
    const lineSubtotal = unitNetPrice.times(input.quantity);

    return {
      unitNetPrice,
      lineDiscount,
      lineSubtotal,
      isFloorViolated,
      requiresMakerCheckerOverride: isFloorViolated,
    };
  }

  public calculateVat(taxableAmount: Decimal, vatRate: Decimal): Decimal {
    // Revenue Department half-up rounding for final VAT
    return taxableAmount.times(vatRate).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  }
}

describe('PricingEngine - [FR-02-004] [FR-02-005] Tiered Pricing & Floor Protection', () => {
  let engine: PricingEngine;

  beforeEach(() => {
    engine = new PricingEngine();
  });

  test('should apply 200-500 bag volume discount correctly for SCG Cement', () => {
    const input: PricingLineInput = {
      skuCode: 'SKU-CEM-SCG-50KG',
      quantity: new Decimal('250.0000'),
      unitListPrice: new Decimal('165.0000'),
      unitFloorPrice: new Decimal('148.0000'),
      tiers: [
        { minQty: new Decimal('1.0000'), maxQty: new Decimal('99.0000'), discountPerUnit: new Decimal('0.0000') },
        { minQty: new Decimal('100.0000'), maxQty: new Decimal('199.0000'), discountPerUnit: new Decimal('5.0000') },
        { minQty: new Decimal('200.0000'), maxQty: new Decimal('500.0000'), discountPerUnit: new Decimal('10.0000') },
      ],
    };

    const result = engine.calculateLineItem(input);

    expect(result.unitNetPrice.toString()).toBe('155');
    expect(result.lineDiscount.toString()).toBe('2500');
    expect(result.lineSubtotal.toString()).toBe('38750');
    expect(result.isFloorViolated).toBe(false);
  });

  test('should detect floor price breach when custom discount exceeds floor boundary', () => {
    const input: PricingLineInput = {
      skuCode: 'SKU-CEM-SCG-50KG',
      quantity: new Decimal('50.0000'),
      unitListPrice: new Decimal('165.0000'),
      unitFloorPrice: new Decimal('148.0000'), // Floor price threshold
      manualDiscountPerUnit: new Decimal('20.0000'), // Net = 145 < 148
      tiers: [],
    };

    const result = engine.calculateLineItem(input);

    expect(result.unitNetPrice.toString()).toBe('145');
    expect(result.isFloorViolated).toBe(true);
    expect(result.requiresMakerCheckerOverride).toBe(true);
  });

  test('should compute Revenue Department 7% VAT using ROUND_HALF_UP', () => {
    const taxableAmount = new Decimal('57300.00');
    const vatRate = new Decimal('0.0700');

    const vatAmount = engine.calculateVat(taxableAmount, vatRate);

    expect(vatAmount.toString()).toBe('4011');
  });
});
```

#### 4.6.2 Real-Time Credit Check Test Suite (`credit-control.spec.ts`)
```typescript
import { Decimal } from 'decimal.js';

interface CreditProfile {
  creditLimitThb: Decimal;
  postedArBalanceThb: Decimal;
  unbilledOrdersThb: Decimal;
  unclearedChequesThb: Decimal;
  isBlocked: boolean;
  hasBouncedCheque: boolean;
}

export class CreditControlEngine {
  public evaluateCredit(profile: CreditProfile, proposedAmount: Decimal) {
    if (profile.isBlocked) {
      return { isEligible: false, action: 'REJECT_BLOCKED', reason: 'Customer account is administratively blocked.' };
    }

    if (profile.hasBouncedCheque) {
      return { isEligible: false, action: 'REJECT_BOUNCED_CHEQUE', reason: 'Customer has uncleared bounced cheques on file.' };
    }

    const currentTotalExposure = profile.postedArBalanceThb
      .plus(profile.unbilledOrdersThb)
      .plus(profile.unclearedChequesThb);

    const projectedTotalExposure = currentTotalExposure.plus(proposedAmount);

    if (projectedTotalExposure.gt(profile.creditLimitThb)) {
      const overAmount = projectedTotalExposure.minus(profile.creditLimitThb);
      return {
        isEligible: false,
        action: 'REJECT_OVER_LIMIT',
        currentTotalExposure,
        projectedTotalExposure,
        overAmountThb: overAmount,
        reason: `Proposed order exceeds credit limit by ${overAmount.toString()} THB.`,
      };
    }

    return {
      isEligible: true,
      action: 'APPROVE',
      currentTotalExposure,
      projectedTotalExposure,
      remainingAvailableCreditThb: profile.creditLimitThb.minus(projectedTotalExposure),
    };
  }
}

describe('CreditControlEngine - [FR-03-001] [FR-03-008] Risk & Cheque Validation', () => {
  let engine: CreditControlEngine;

  beforeEach(() => {
    engine = new CreditControlEngine();
  });

  test('should reject order if combined AR, unbilled orders, cheques and proposed order exceed limit', () => {
    const profile: CreditProfile = {
      creditLimitThb: new Decimal('500000.00'),
      postedArBalanceThb: new Decimal('380000.00'),
      unbilledOrdersThb: new Decimal('50000.00'),
      unclearedChequesThb: new Decimal('20000.00'), // Total current = 450,000.00
      isBlocked: false,
      hasBouncedCheque: false,
    };

    const proposedAmount = new Decimal('60000.00'); // 450k + 60k = 510k > 500k
    const decision = engine.evaluateCredit(profile, proposedAmount);

    expect(decision.isEligible).toBe(false);
    expect(decision.action).toBe('REJECT_OVER_LIMIT');
    expect(decision.overAmountThb?.toString()).toBe('10000');
  });

  test('should immediately block credit if customer has uncleared bounced cheques', () => {
    const profile: CreditProfile = {
      creditLimitThb: new Decimal('500000.00'),
      postedArBalanceThb: new Decimal('50000.00'),
      unbilledOrdersThb: new Decimal('0.00'),
      unclearedChequesThb: new Decimal('0.00'),
      isBlocked: false,
      hasBouncedCheque: true, // Flagged due to bounced cheque
    };

    const proposedAmount = new Decimal('20000.00');
    const decision = engine.evaluateCredit(profile, proposedAmount);

    expect(decision.isEligible).toBe(false);
    expect(decision.action).toBe('REJECT_BOUNCED_CHEQUE');
    expect(decision.reason).toContain('bounced cheques');
  });
});
```

#### 4.6.3 Inventory ATP & FEFO Concurrency Test Suite (`inventory-atp.spec.ts`)
```typescript
import { Decimal } from 'decimal.js';

interface CementLot {
  lotId: string;
  expiryDate: Date;
  remainingQty: Decimal;
}

interface LotAllocation {
  lotId: string;
  allocatedQty: Decimal;
}

export class InventoryAtpService {
  public allocateFefoLots(lots: CementLot[], requestedQty: Decimal): LotAllocation[] {
    // 1. Sort strictly by earliest expiry date first (FEFO)
    const sortedLots = [...lots].sort((a, b) => a.expiryDate.getTime() - b.expiryDate.getTime());

    let qtyRemainingToAllocate = new Decimal(requestedQty);
    const allocations: LotAllocation[] = [];

    for (const lot of sortedLots) {
      if (qtyRemainingToAllocate.lte(0)) break;
      if (lot.remainingQty.lte(0)) continue;

      const takeQty = Decimal.min(lot.remainingQty, qtyRemainingToAllocate);
      allocations.push({
        lotId: lot.lotId,
        allocatedQty: takeQty,
      });

      qtyRemainingToAllocate = qtyRemainingToAllocate.minus(takeQty);
    }

    if (qtyRemainingToAllocate.gt(0)) {
      throw new Error(`Insufficient stock: unable to allocate remaining ${qtyRemainingToAllocate.toString()}`);
    }

    return allocations;
  }
}

describe('InventoryAtpService - [FR-07-012] [FR-04-003] FEFO Cement Lot Allocation', () => {
  let atpService: InventoryAtpService;

  beforeEach(() => {
    atpService = new InventoryAtpService();
  });

  test('should allocate cement lots strictly in order of earliest expiration (FEFO)', () => {
    const lots: CementLot[] = [
      { lotId: 'LOT-NOV', expiryDate: new Date('2026-11-01'), remainingQty: new Decimal('100.0000') },
      { lotId: 'LOT-OCT', expiryDate: new Date('2026-10-01'), remainingQty: new Decimal('150.0000') }, // Earliest
      { lotId: 'LOT-DEC', expiryDate: new Date('2026-12-01'), remainingQty: new Decimal('200.0000') },
    ];

    const requestedQty = new Decimal('200.0000');
    const result = atpService.allocateFefoLots(lots, requestedQty);

    expect(result).toHaveLength(2);
    expect(result[0].lotId).toBe('LOT-OCT');
    expect(result[0].allocatedQty.toString()).toBe('150');
    expect(result[1].lotId).toBe('LOT-NOV');
    expect(result[1].allocatedQty.toString()).toBe('50');
  });

  test('should throw InsufficientStockException when requested quantity exceeds total lot inventory', () => {
    const lots: CementLot[] = [
      { lotId: 'LOT-OCT', expiryDate: new Date('2026-10-01'), remainingQty: new Decimal('50.0000') },
    ];

    const requestedQty = new Decimal('100.0000');
    expect(() => atpService.allocateFefoLots(lots, requestedQty)).toThrow(/Insufficient stock/);
  });
});
```

#### 4.6.4 Tax Invoicing Immutability & Hash Chain Test Suite (`tax-invoicing.spec.ts`)
```typescript
import * as crypto from 'crypto';

interface AuditRecord {
  auditId: number;
  entityName: string;
  entityId: string;
  actionType: string;
  payloadJson: object;
  previousRecordHash: string;
}

export class TaxInvoiceAuditService {
  public computeAuditRecordHash(record: AuditRecord): string {
    const serializedPayload = JSON.stringify(record.payloadJson);
    const dataToHash = `${record.auditId}|${record.entityName}|${record.entityId}|${record.actionType}|${serializedPayload}|${record.previousRecordHash}`;
    return crypto.createHash('sha256').update(dataToHash).digest('hex');
  }

  public verifyAuditChain(records: (AuditRecord & { currentRecordHash: string })[]): boolean {
    for (let i = 0; i < records.length; i++) {
      const current = records[i];
      const recalculatedHash = this.computeAuditRecordHash(current);

      if (recalculatedHash !== current.currentRecordHash) {
        return false; // Current record was tampered with
      }

      if (i > 0) {
        const previous = records[i - 1];
        if (current.previousRecordHash !== previous.currentRecordHash) {
          return false; // Chain linkage broken
        }
      }
    }
    return true;
  }
}

describe('TaxInvoiceAuditService - [FR-10-001] [FR-13-005] Immutability & SHA-256 Hash Chain', () => {
  let auditService: TaxInvoiceAuditService;

  beforeEach(() => {
    auditService = new TaxInvoiceAuditService();
  });

  test('should generate and verify unbroken cryptographic hash chain across audit entries', () => {
    const genesisHash = '0000000000000000000000000000000000000000000000000000000000000000';

    const record1: AuditRecord = {
      auditId: 1,
      entityName: 'tax_invoices',
      entityId: 'INV-TW-BKK01-001',
      actionType: 'POST',
      payloadJson: { invoiceTotalThb: '61311.00', vatThb: '4011.00' },
      previousRecordHash: genesisHash,
    };
    const hash1 = auditService.computeAuditRecordHash(record1);

    const record2: AuditRecord = {
      auditId: 2,
      entityName: 'tax_invoices',
      entityId: 'INV-TW-BKK01-002',
      actionType: 'POST',
      payloadJson: { invoiceTotalThb: '125000.00', vatThb: '8175.00' },
      previousRecordHash: hash1,
    };
    const hash2 = auditService.computeAuditRecordHash(record2);

    const chain = [
      { ...record1, currentRecordHash: hash1 },
      { ...record2, currentRecordHash: hash2 },
    ];

    expect(auditService.verifyAuditChain(chain)).toBe(true);
  });

  test('should detect tampering if payload in historic audit log is modified', () => {
    const genesisHash = '0000000000000000000000000000000000000000000000000000000000000000';

    const record1: AuditRecord = {
      auditId: 1,
      entityName: 'tax_invoices',
      entityId: 'INV-TW-BKK01-001',
      actionType: 'POST',
      payloadJson: { invoiceTotalThb: '61311.00' },
      previousRecordHash: genesisHash,
    };
    const hash1 = auditService.computeAuditRecordHash(record1);

    // Tampered payload
    const tamperedRecord = {
      ...record1,
      payloadJson: { invoiceTotalThb: '50000.00' }, // Altered value
      currentRecordHash: hash1,
    };

    expect(auditService.verifyAuditChain([tamperedRecord])).toBe(false);
  });
});
```

---

# 5. Architectural Risk Analysis & Mitigation Playbook

| Risk ID | Failure Mode & Scenario | Probability | Impact | Mitigation Engineering Implementation |
| :--- | :--- | :--- | :--- | :--- |
| **TR-01** | **Inventory Contention Deadlock**: Multiple sales reps reserve the same batch of cement simultaneously. | High | High | Enforce `SELECT ... FOR UPDATE SKIP LOCKED` in PostgreSQL. Active checkout holds use Redis Redlock with 15-minute expiring lease (`TTL 900s`). |
| **TR-02** | **Floating-Point Precision Loss**: Rounding drift across 1,000+ line items causes tax invoice total discrepancies. | High | Critical | Ban `FLOAT`/`DOUBLE` across DDL and code. Intermediate calculations use `NUMERIC(18,4)` + `decimal.js` Banker's Rounding; tax uses Half-Up. |
| **TR-03** | **Unauthorized Mutation of Posted Tax Invoice**: Accidental update violates Revenue Department legal compliance. | Low | Critical | Database-level trigger `trg_tax_invoice_immutable` halts any `UPDATE` or `DELETE` on records with `is_posted = TRUE`. Signed PDFs stored in S3 Object Lock. |
| **TR-04** | **Item Master Feed (I0a) Thundering Herd**: Ingesting 100,000 SKUs from merchandising locks the product table. | Medium | Medium | Ingest feed via partitioned Kafka topic (`wds.masterdata.item-feed`). Worker writes in micro-batches of 500 records via `INSERT ... ON CONFLICT DO UPDATE`. |
| **TR-05** | **Floor Price Bypass**: Sales representative attempts to confirm an order priced below floor barrier without approval. | Medium | High | Domain model rejects confirmation unless an authorized Checker approval ID is present in `maker_checker_requests` staging table. |

---

# 6. Sprint-by-Sprint Implementation Roadmap (S0–S12)

The 26-week delivery roadmap is structured for the 9-engineer delivery unit (6.5 Coding FTE, 2.5 Supporting FTE) to implement and deploy the 249 Release 1 requirements across 12 Epics:

- **Sprint S0 (Weeks 1–2) — Architecture Foundations & Tooling Baseline (E13, E15) [25 SP]**:
  - Provision Neon PostgreSQL 16.2+ (`th-TH-x-icu`), Redis 7.2 Cluster, and Apache Kafka 3.6+.
  - Setup NestJS 10 (Fastify) modular monolith repository with strict TypeScript and Husky commit linter (`[FR-xx-xxx]`).
  - Implement base RBAC schemas, JWT authentication with token revocation, and SHA-256 HMAC audit log.
  - Implement automated 5-Gate CI/CD pipeline in GitHub Actions with mandatory automated gates.
- **Sprint S1 (Weeks 3–4) — Master Data & Maker-Checker Staging Engine (E01, E13, E15) [38 SP]**:
  - Implement Customer, Product, Branch tables with `NUMERIC(18,4)` and Maker-Checker staging schema (`maker_checker_requests`).
  - Deploy I0a Merchandising catalog batch parser worker for 100k SKU ingestion.
  - Deliver Back-Office Admin UI for Maker-Checker queue and customer profile management.
- **Sprint S2 (Weeks 5–6) — Dynamic Pricing Engine Core & Catalog Ingestion (E02, E01, E15) [42 SP] [Checkpoint CP2]**:
  - Implement Tiered Volume Breaks, Customer Trade Tier discounts, and Zone Freight calculation matrix.
  - Implement Absolute Floor Price Guardrail and effective-dated VAT configuration engine (`system_vat_configs`).
  - Deliver `POST /api/v1/pricing/calculate` API endpoint and Interactive Pricing Calculator UI.
- **Sprint S3 (Weeks 7–8) — Credit Headroom Engine & Cheque Control (E03, E02) [40 SP]**:
  - Implement dynamic credit exposure ledger with two-phase credit reservations (`credit_reservations`).
  - Implement 6-stage Post-Dated Cheque (PDC) register and automatic credit hold on bounced cheque events.
  - Deliver `POST /api/v1/credit/check` API endpoint and Credit Risk Desk UI.
- **Sprint S4 (Weeks 9–10) — Inventory FEFO Engine & Credit Exception Overrides (E07, E03, E15) [40 SP]**:
  - Implement First-Expired, First-Out (FEFO) cement lot allocation algorithm (`idx_inv_lots_fefo`).
  - Implement 15-day shelf-life quarantine rule and HMAC-signed 24-hour Credit Exception Override token.
  - Deploy Interface I0b Retail Store Stock sync worker.
  - Deliver FEFO Lot Inspector & Credit Release Portal UI.
- **Sprint S5 (Weeks 11–12) — Order Management, ATP Engine & Contention Resolution (E04, E07) [42 SP] [Checkpoint CP3 Gate]**:
  - Implement Available-to-Promise (ATP) engine with Redis Redlock and PostgreSQL `SELECT ... FOR UPDATE SKIP LOCKED`.
  - Implement 15-minute stock reservation lease (`stock_reservations`, TTL 900s) and multi-store split fulfillment.
  - Deliver `POST /api/v1/orders` API endpoint and Sales Order Desk UI.
- **Sprint S6 (Weeks 13–14) — Statutory Tax Invoicing & Thai Revenue Dept Engine (E10, E04) [40 SP]**:
  - Implement gapless tax sequence allocation (`fn_get_next_tax_invoice_number`) and Output VAT reconciliation.
  - Implement legal immutability database triggers on `tax_invoices` (`trg_tax_invoice_immutable`) and `tax_invoice_items` (`trg_tax_invoice_items_immutable`).
  - Deliver `POST /api/v1/tax-invoices/post` API endpoint and Invoice Viewer/Print Station UI.
- **Sprint S7 (Weeks 15–16) — Warehouse Fulfillment, Dispatch & Financial Credit Notes (E08, E10) [38 SP]**:
  - Implement heavy material pick-list generator, Delivery Order (DO), and Gate Pass generation with weighbridge logging.
  - Implement statutory Credit Note Engine (`credit_notes`, `credit_note_items`) under Thai Revenue Code Section 86/10.
  - Deliver Warehouse Dispatch Station UI and Financial Adjustment Desk.
- **Sprint S8 (Weeks 17–18) — Return Merchandise Authorization (RMA) & Integration Stubs (E12, E15) [38 SP] [Checkpoint CP4 Freeze]**:
  - Implement RMA workflow with inspection grading (Grade A restock to ATP, Grade B clearance markdown).
  - Build integration test harnesses and production stubs for Interface I0d (POS) and Interface I0e (SAP GL).
  - Deliver RMA Return Processing UI.
- **Sprint S9 (Weeks 19–20) — Direct Ship Integration, Sales Mobility & Proof of Delivery (E11, E08) [36 SP]**:
  - Implement Direct Ship supplier EDI integration (Interface I11) for direct-to-site dispatch.
  - Deliver Responsive Mobile B2B Sales Web App for field sales representatives.
  - Implement Driver Proof of Delivery (POD) mobile module for signature and photo capture.
- **Sprint S10 (Weeks 21–22) — Operational BI Reporting & Statutory ภ.พ.30 Dashboards (E14, E15) [35 SP]**:
  - Implement Statutory Monthly VAT Output Report (รายงานภาษีขาย ภ.พ.30) and AR Aging Matrix.
  - Deliver Executive Compliance Dashboard with CSV/Excel/PDF export.
- **Sprint S11 (Weeks 23–24) — UAT Hardening, OWASP Pen-Test & Concurrency Stress (E15) [26 SP] [Checkpoint CP5 Go/No-Go]**:
  - Execute 500 concurrent user stress testing on ATP reservation locks.
  - Complete OWASP Top 10 remediation, penetration testing, and disaster recovery rehearsal.
  - Complete 100% of commercial and financial business acceptance testing.
- **Sprint S12 (Weeks 25–26) — Production Cutover, Delta Migration & 3-Branch Pilot Launch (E15) [20 SP]**:
  - Final master data delta migration, cutover dry run, and 3-branch live pilot deployment.
  - Establish 24/7 engineering hypercare bridge and handover operational runbooks.

---

### 6.1 Sprint Velocity & Milestone Summary Table

| Sprint | Weeks | Primary Epics | Velocity (SP) | Key Milestone / Delivery Gate | Primary Deliverable Artifacts |
|:---:|:---:|:---:|:---:|:---:|---|
| **S0** | W1–W2 | E13, E15 | 25 SP | Platform Foundations | DB cluster, Redis Redlock, CI/CD 5 gates, Husky regex, Base RBAC |
| **S1** | W3–W4 | E01, E13, E15 | 38 SP | Master Data Baseline | Customer/Product/Branch DDL, Maker-Checker staging, I0a 100k SKU parser |
| **S2** | W5–W6 | E02, E01, E15 | 42 SP | Checkpoint CP2 | Volume breaks, zone freight matrix, floor price guardrail, `POST /pricing/calculate` |
| **S3** | W7–W8 | E03, E02 | 40 SP | Credit Risk Baseline | Credit exposure ledger, 2-phase credit reservation, PDC register, `POST /credit/check` |
| **S4** | W9–W10 | E07, E03, E15 | 40 SP | Perishable Control | Cement FEFO allocator (`idx_inv_lots_fefo`), 15d quarantine, credit override token |
| **S5** | W11–W12 | E04, E07 | 42 SP | Checkpoint CP3 Gate | High-contention ATP engine, 15m lease TTL, `POST /orders`, Order Desk UI |
| **S6** | W13–W14 | E10, E04 | 40 SP | Tax Compliance Core | Gapless sequence generator, `trg_tax_invoice_immutable`, `POST /tax-invoices/post` |
| **S7** | W15–W16 | E08, E10 | 38 SP | Fulfillment & Adjustments | Heavy goods pick-slip, Gate Pass/weighbridge, Section 86/10 Credit Notes DDL |
| **S8** | W17–W18 | E12, E15 | 38 SP | Checkpoint CP4 Freeze | RMA return grading (Grade A/B), restock to ATP, I0d (POS) & I0e (SAP GL) stubs |
| **S9** | W19–W20 | E11, E08 | 36 SP | Mobility & Direct Ship | Supplier EDI I11 direct ship, Mobile B2B Sales Web App, Driver e-POD module |
| **S10** | W21–W22 | E14, E15 | 35 SP | Financial Compliance | Statutory ภ.พ.30 report generator, AR aging matrix, Executive BI dashboard |
| **S11** | W23–W24 | E15 | 26 SP | Checkpoint CP5 Go/No-Go | 500-VU stress test, OWASP pen-test remediation, DR failover drill, UAT sign-off |
| **S12** | W25–W26 | E15 | 20 SP | Production Cutover | 100k SKU delta ETL, 3-store live pilot (Bangna, etc.), 24/7 hypercare bridge |
| **TOTAL** | **26 Weeks** | **12 Epics** | **440 SP** | **100% Release 1 Scope** | **249 Requirements Delivered Across 13 Sprints (S0–S12)** |

---
**End of Technical Specifications & Implementation Guidelines (R3 Blueprint)**
