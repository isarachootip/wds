# Technical Specifications & Implementation Guidelines (R3 Blueprint)
## Wholesale & Direct Sales (WDS) — Thai Watsadu System Architecture & Engineering Standard

**Document ID**: WDS-TECH-SPEC-R3-V1.0  
**Target Release**: Release 1 (249 Requirements across 26 Weeks, 9 In-House Engineers)  
**Author**: Senior Developer Technical Explorer (`explorer_dev_p0_3`)  
**Status**: APPROVED / PRODUCTION READY  
**Classification**: Central Retail / Thai Watsadu Internal Engineering Specification  

---

## Executive Summary

This specification establishes the technical implementation blueprint for the Wholesale & Direct Sales (WDS) platform for Thai Watsadu. Designed to handle high-concurrency B2B wholesale ordering, multi-branch inventory contention, dynamic tiered pricing, real-time credit risk management, and strict Revenue Department (RD) compliant tax invoicing, this document provides the engineering foundations, exact database schemas (DDL), API contracts (OpenAPI 3.0), and automated governance pipelines required for the 9-engineer delivery team to execute Sprints S0 through S12 with zero architectural ambiguity.

---

## Table of Contents
1. [Enterprise-Grade Technology Stack Architecture](#1-enterprise-grade-technology-stack-architecture)
   - 1.1 Architecture Paradigm: Modular Monolith vs. Microservices
   - 1.2 Backend Framework & Runtime Selection
   - 1.3 Frontend Web & Mobile Architecture
   - 1.4 Primary Relational Database Engine & HA Topology
   - 1.5 Caching, Session, & Distributed Concurrency Management
   - 1.6 Message Queue & Asynchronous Event Streaming Backbone
   - 1.7 Tech Stack Matrix & Trade-off Evaluation
2. [Data Model & Database Schema Specifications](#2-data-model--database-schema-specifications)
   - 2.1 Entity Relationship Diagram (ERD) Structure
   - 2.2 Strict Data Type & Precision Rules (Monetary & Inventory)
   - 2.3 Collation, Localization, and Temporal Standards
   - 2.4 Complete DDL Schema Implementation
   - 2.5 Audit Trail Architecture (Immutable Hash-Chained Ledger)
   - 2.6 Maker-Checker Staging & Approval Workflow Schema
3. [API Specifications & Data Contracts (RESTful / OpenAPI 3.0)](#3-api-specifications--data-contracts-restful--openapi-30)
   - 3.1 Global Standards (Idempotency, Error Envelope RFC 7807, Pagination)
   - 3.2 Endpoint 1: Dynamic Pricing Calculation (`POST /api/v1/pricing/calculate`)
   - 3.3 Endpoint 2: Order Submission & Validation (`POST /api/v1/orders/validate-and-submit`)
   - 3.4 Endpoint 3: Real-Time Credit & Cheque Check (`POST /api/v1/credit/realtime-check`)
   - 3.5 Endpoint 4: Stock Reservation & ATP Commitment (`POST /api/v1/inventory/reserve-atp`)
   - 3.6 Endpoint 5: Tax Invoice Generation & Posting (`POST /api/v1/billing/tax-invoices/generate-and-post`)
4. [Engineering Standards & Quality Assurance Specifications](#4-engineering-standards--quality-assurance-specifications)
   - 4.1 Git Commit Convention with Requirement ID Enforcement
   - 4.2 Git Hooks Implementation (`commit-msg` Validation)
   - 4.3 Definition of Ready (DoR) and Definition of Done (DoD)
   - 4.4 CI/CD Pipeline Automated Gates & Static Quality Thresholds
   - 4.5 Unit & Integration Testing Architecture (>=80% Coverage Standard)
   - 4.6 Verification & Test Suites (Pricing, Credit, ATP Contention, Tax Invoicing)

---

# 1. Enterprise-Grade Technology Stack Architecture

### 1.1 Architecture Paradigm: Modular Monolith with Hexagonal Domain Boundaries

Given the delivery constraints (9 in-house software engineers, 26 weeks, 249 Release 1 requirements across 12 Epics), adopting a distributed microservices architecture on Day 1 introduces prohibitive distributed-transaction overhead (two-phase commit / saga orchestrations) across tightly coupled domains such as Pricing, Inventory ATP, Credit Limits, and RD-Compliant Billing.

**Architectural Decision**: Implement a **Modular Monolith** employing **Hexagonal Architecture (Ports and Adapters)** and **Domain-Driven Design (DDD)** packaged in a single deployable artifact (or co-deployed worker containers) backed by a single primary PostgreSQL 16+ cluster with logically isolated schemas.
- **Modularity**: Domain modules (`modules/pricing`, `modules/credit`, `modules/inventory`, `modules/orders`, `modules/billing`, `modules/masterdata`) communicate internally via strongly typed in-memory interfaces and domain events.
- **Microservice Extraction Path**: Each module enforces strict boundary encapsulation; no cross-schema database queries are permitted. If a specific domain (e.g., Inventory ATP or Catalog Feed) requires independent horizontal scaling in Year 2, it can be extracted cleanly into an independent microservice without refactoring business logic.

```
+---------------------------------------------------------------------------------------+
|                                    WDS Modular Monolith                               |
|                                                                                       |
|   +------------------+  +------------------+  +------------------+  +-------------+   |
|   |  E01/E13 Master  |  |   E02 Pricing    |  |  E03 Credit &    |  | E07/E04     |   |
|   |  Data & RBAC     |  |   Engine         |  |  Cheque Control  |  | Inventory   |   |
|   |  (Maker-Checker) |  |   (Volume/Zone)  |  |  (Risk Exposure) |  | (FEFO/ATP)  |   |
|   +--------+---------+  +--------+---------+  +--------+---------+  +------+------+   |
|            |                     |                     |                   |          |
|            +---------------------+----------+----------+-------------------+          |
|                                             |                                         |
|                                  [ Domain Event Bus ]                                 |
|                                             |                                         |
|                                 +-----------+-----------+                             |
|                                 |                       |                             |
|                        +--------+---------+   +---------+--------+                    |
|                        |   E10 Billing &  |   |   E08/E12 Orders |                    |
|                        |   RD Tax Invoice |   |   & Fulfillment  |                    |
|                        +--------+---------+   +---------+--------+                    |
|                                 |                       |                             |
|   +-----------------------------v-----------------------v-------------------------+   |
|   |                           Transactional Outbox Pattern                        |   |
+---+-----------------------------------------+-------------------------------------+---+
                                              |
                          +-------------------v-------------------+
                          |     Apache Kafka / Debezium CDC       |
                          +-------------------+-------------------+
                                              |
                   +--------------------------+--------------------------+
                   |                          |                          |
        +----------v----------+    +----------v----------+    +----------v----------+
        |   I0a Merchandising |    |    I0d POS Store    |    |   I0e SAP GL /      |
        |   (100k Item Feed)  |    |    Direct Sync      |    |   Corporate Finance |
        +---------------------+    +---------------------+    +---------------------+
```

### 1.2 Backend Framework & Runtime Selection

- **Runtime**: **Node.js 20 LTS (Iron)** or **Node.js 22 LTS**.
- **Framework**: **NestJS 10.x (TypeScript Enterprise)**.
  - *Rationale*: Provides enterprise-grade dependency injection, modular encapsulation, unified architectural scaffolding across junior/senior developers, and first-class OpenAPI (Swagger) decorators that auto-generate API contracts directly from TypeScript DTOs.
  - *Execution Engine*: Fastify adapter underneath NestJS (`@nestjs/platform-fastify`) to achieve up to 30,000 req/sec per node with ultra-low latency (<15ms P99) under high concurrent B2B checkouts.
  - *Data Access Layer*: **Kysely** (Type-safe SQL Query Builder) combined with raw SQL migration scripts or **Prisma** for schema validation. Kysely provides zero-overhead, fully typed compile-time SQL with explicit support for Postgres row-locking (`FOR UPDATE SKIP LOCKED`), CTEs, and exact decimal casting.
  - *Strict Type Safety*: TypeScript `tsconfig.json` enforces `"strict": true`, `"noImplicitAny": true`, `"strictNullChecks": true`, and `"exactOptionalPropertyTypes": true`.

### 1.3 Frontend Web & Mobile Architecture

- **Technology**: **React 18+ (SPA)** powered by **Vite 5+** and **TypeScript**.
- **State Management & Data Fetching**: **TanStack Query v5 (React Query)** + **Zustand** for local client state.
- **UI Component Framework**: **Tailwind CSS** + **Ant Design 5.x** / **shadcn/ui**.
  - *Rationale*: Internal wholesale operations (sales reps in branch stores, credit managers, central pricing directors) require dense, data-heavy tabular interfaces with complex inline edits, multi-tier approvals, Excel imports/exports, and barcode scanner inputs. Ant Design provides out-of-the-box accessible, highly customizable data grids, tree-selects, and filter builders.
- **Offline & Low-Bandwidth Resilience**: Service Worker cache for product catalogs and offline price lookups when sales reps visit remote construction sites with unstable 4G/5G connections.

### 1.4 Primary Relational Database Engine & HA Topology

- **Database Engine**: **PostgreSQL 16.2+**.
  - *Transactional Guarantees*: Full ACID compliance, robust Write-Ahead Logging (WAL), native JSONB support for dynamic approval snapshots, and declarative table partitioning.
  - *High Concurrency Lock Handling*: Native support for `SELECT ... FOR UPDATE SKIP LOCKED` and `SELECT ... FOR UPDATE NOWAIT`—critical for zero-deadlock branch inventory reservation and concurrent credit line drawdown.
  - *Collation*: Native ICU collation configured with `th-TH-x-icu` to ensure correct Thai alphabetical sorting and dictionary-based collation in accordance with Thai commercial documentation rules.
  - *Text Search*: `pg_trgm` extension for sub-millisecond fuzzy search across 100,000+ Thai/English construction material SKUs.
- **High Availability & Clustering Topology**:
  - 1 Primary Read-Write Node + 2 Synchronous Read Replicas (Patroni / Zalando Postgres Operator or AWS Aurora PostgreSQL Multi-AZ).
  - **Connection Pooling**: **PgBouncer** configured in `transaction` pooling mode, supporting 5,000+ concurrent application connections with a database server pool of 150 active connections.

### 1.5 Caching, Session, & Distributed Concurrency Management

- **Technology**: **Redis 7.2+ Cluster** (3 Primary + 3 Replica nodes).
- **Caching Tiers**:
  - **Tier 1 (L1 Application In-Memory)**: LRU in-process cache (via `lru-cache` in Node.js) for static system configs, active VAT rates, and user RBAC permission sets (TTL: 60 seconds).
  - **Tier 2 (L2 Distributed Redis)**:
    - Active price tier lists, customer credit balance fast-reads, product metadata (TTL: 15–60 minutes, invalidated via Kafka/Redis PubSub).
    - Session management via Redis Sentinel / Cluster.
- **Distributed Concurrency & Locking**:
  - **Redlock / Atomic Lua Scripts**: For atomic stock reservation leases during the 15-minute checkout window and distributed mutexes on customer credit accounts to prevent double-drawdown race conditions.

### 1.6 Message Queue & Asynchronous Event Streaming Backbone

- **Technology**: **Apache Kafka 3.6+** (KRaft mode, 3 brokers) or **Redpanda**.
- **Transactional Consistency (Outbox Pattern)**:
  - All domain events (e.g., `OrderPlacedEvent`, `CreditHoldReleasedEvent`, `TaxInvoicePostedEvent`) are committed synchronously within the same PostgreSQL ACID transaction into an `outbox_events` table.
  - A lightweight CDC (Change Data Capture) pipeline via **Debezium** or a dedicated NestJS Outbox Publisher reads the WAL / outbox table and streams events into Kafka topics with `at-least-once` delivery and idempotent consumer deduplication via message keys.
- **External System Integration Support (I0a–I0e)**:
  - `wds.masterdata.item-feed` (I0a Merchandising Item Feed: 100k items, batch partitioned by category).
  - `wds.inventory.branch-stock-sync` (I0b Retail Stock delta sync).
  - `wds.finance.tax-invoice-posted` (I0e SAP GL / Corporate Finance sync).

### 1.7 Tech Stack Matrix & Trade-off Evaluation

| Tier | Chosen Technology | Evaluated Alternatives | Decisive Justification for 9 Engineers / 26 Weeks |
| :--- | :--- | :--- | :--- |
| **Backend API** | **NestJS 10 (TypeScript)** | Go (Fiber), Java (Spring Boot 3), .NET 8 | Highest velocity; full TypeScript code sharing with frontend; out-of-the-box OpenAPI generation; rich validation decorators. |
| **Frontend SPA** | **React 18 + Vite + AntD** | Next.js 14 App Router, Angular 17 | Zero SSR hydration overhead for internal B2B intranet; AntD provides the richest data-grid ecosystem for complex ERP forms. |
| **Database** | **PostgreSQL 16+** | MySQL 8.0, Oracle DB, MongoDB | Best-in-class `FOR UPDATE SKIP LOCKED` for inventory contention; ICU Thai collation; declarative partitioning; zero license fees. |
| **Cache & Locks** | **Redis 7.2 Cluster** | Memcached, Hazelcast | Universal support for atomic Lua scripts, Redlock distributed locking, and BullMQ background task processing. |
| **Event Bus** | **Apache Kafka + Outbox** | RabbitMQ, AWS SQS | Replayability of master item feed (100k items); strict partition ordering by `customer_id` and `sku`; audit event streaming. |
| **Object Storage** | **MinIO / AWS S3** | Local SAN / NFS | S3-compliant immutable bucket storage for signed e-Tax PDF/A-3 and XML files with Object Lock retention. |

---

# 2. Data Model & Database Schema Specifications

### 2.1 Entity Relationship Diagram (ERD) Structure

The following diagram illustrates the relational topology across Core Domains: Master Data, Pricing Engine, Credit Control, Inventory ATP, Order Management, Tax Invoicing, Maker-Checker, and Audit Trails.

```
 +------------------------+              +------------------------------+
 |       customers        |1           1 |   customer_credit_profiles   |
 |------------------------+<-------------+------------------------------|
 | customer_id (PK)       |              | profile_id (PK)              |
 | tax_id, branch_number  |              | customer_id (FK, Unique)     |
 | company_name (Thai)    |              | credit_limit_thb             |
 | is_active, is_blocked  |              | current_exposure_thb         |
 +-----------+------------+              | blocked_due_to_cheque_bounce |
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
 | order_status           |              | due_date, clearing_status    |
 | total_payable_thb      |              +------------------------------+
 +-----------+------------+
             |1
             |
             +-----------------------+-----------------------+
             |*                      |1                      |1
 +-----------v------------+  +-------v--------------+  +-----v------------------------+
 |      order_items       |  |  tax_invoices        |  |  maker_checker_requests      |
 |------------------------+  |----------------------|  |------------------------------|
 | item_id (PK)           |  | invoice_id (PK)      |  | request_id (PK)              |
 | order_id (FK)          |  | invoice_number (UQ)  |  | entity_name, entity_id       |
 | product_id (FK)        |  | order_id (FK)        |  | action_type, payload_json    |
 | quantity, uom          |  | is_posted, is_void   |  | status, maker_id, checker_id |
 | unit_price_thb         |  | output_vat_thb       |  +------------------------------+
 | discount_amount_thb    |  | digital_signature    |
 | line_total_thb         |  +----------------------+
 +-----------+------------+
             |*
             |
             |*
 +-----------v------------+              +------------------------------+
 |        products        |1           * |  inventory_cement_lots (FEFO)|
 |------------------------+<-------------+------------------------------|
 | product_id (PK)        |              | lot_id (PK)                  |
 | sku_code (Unique)      |              | product_id (FK)              |
 | name_th, name_en       |              | branch_id (FK)               |
 | base_uom               |              | batch_number                 |
 | is_cement_bag          |              | manufacturing_date           |
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
 | min_qty, max_qty       |
 | base_price_thb         |
 | floor_price_thb        |
 | effective_start_date   |
 | effective_end_date     |
 +------------------------+
```

### 2.2 Strict Data Type & Precision Rules (Monetary & Inventory)

**Absolute Rule**: In compliance with Thai Watsadu financial architecture and Revenue Department audit standards, floating-point data types (`FLOAT`, `DOUBLE`, `REAL`) are **STRICTLY PROHIBITED** across all schemas, DTOs, and application code.

1. **Monetary Values (Currency)**:
   - Must use `NUMERIC(18, 4)` for all intermediate calculation fields (unit prices, tiered discounts, freight surcharges, unrounded VAT).
   - Must use `NUMERIC(15, 2)` for finalized billing, general ledger postings, line total amounts, and tax invoice totals.
   - ISO-4217 Currency Code: `VARCHAR(3)` default `'THB'`.
2. **Inventory Quantities & Stock Units**:
   - Must use `NUMERIC(12, 4)` for all inventory quantities, stock levels, and order line quantities to accurately support fractional quantities (e.g., `12.5000` metric tons of bulk cement, `45.7500` linear meters of steel rebar, `2.5000` cubic meters of timber).
3. **Tax Rates & Percentages**:
   - Must use `NUMERIC(5, 4)` for tax rates (e.g., `0.0700` for 7.00% VAT, `0.1000` for 10.00% VAT).
   - Must use `NUMERIC(5, 2)` for commercial discount percentages (e.g., `15.50` for 15.5%).
4. **Rounding Standard**:
   - **Banker's Rounding / Half-to-Even** (`ROUND_HALF_EVEN`) is enforced for financial intermediate computations to prevent statistical accumulation bias.
   - Final line-item and invoice tax computations follow Revenue Department Clause 4: Half-up rounding (`ROUND_HALF_UP`) to 2 decimal places.

### 2.3 Collation, Localization, and Temporal Standards

1. **Database Collation**:
   - Primary database and text fields storing customer names, product descriptions, and Thai addresses are created with collation `COLLATE "th-TH-x-icu"`.
   - Ensures correct Thai dictionary sorting (e.g., vowels preceding consonants like `เ`, `แ`, `โ` are sorted according to Royal Institute Thai lexicographical standards).
2. **Temporal Standard (UTC Storage & Asia/Bangkok Display)**:
   - All database columns storing timestamps must use `TIMESTAMPTZ` (Timestamp with time zone) and store values exclusively in **UTC**.
   - Application layers convert to `Asia/Bangkok` (`UTC+07:00`) strictly at the presentation, export, and official RD tax invoice rendering boundaries.

---

### 2.4 Complete DDL Schema Implementation

```sql
-- =============================================================================
-- Thai Watsadu Wholesale & Direct Sales (WDS) Schema DDL
-- Release 1.0 (PostgreSQL 16+)
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- -----------------------------------------------------------------------------
-- DOMAIN ENUMS
-- -----------------------------------------------------------------------------
CREATE TYPE order_status_enum AS ENUM (
    'DRAFT',
    'PENDING_CREDIT_CHECK',
    'PENDING_FLOOR_PRICE_APPROVAL',
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

-- -----------------------------------------------------------------------------
-- 1. E01/E13: MASTER DATA & CUSTOMER CREDIT DOMAIN
-- -----------------------------------------------------------------------------
CREATE TABLE customers (
    customer_id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_code           VARCHAR(32) NOT NULL UNIQUE,
    tax_id                  VARCHAR(13) NOT NULL, -- Thai 13-digit Juristic/Personal Tax ID
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
    current_exposure_thb    NUMERIC(15, 2) NOT NULL DEFAULT 0.00, -- AR + Unbilled Orders
    temporary_limit_thb     NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    temp_limit_expiry       TIMESTAMPTZ,
    payment_term_days       INTEGER NOT NULL DEFAULT 30,
    allow_cheque_payment    BOOLEAN NOT NULL DEFAULT FALSE,
    cheque_credit_limit_thb NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    current_cheque_exposure NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    has_bounced_cheque      BOOLEAN NOT NULL DEFAULT FALSE,
    last_credit_review_date TIMESTAMPTZ,
    version                 BIGINT NOT NULL DEFAULT 1, -- Optimistic locking
    created_at              TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_credit_limit_positive CHECK (credit_limit_thb >= 0),
    CONSTRAINT chk_payment_terms_valid CHECK (payment_term_days >= 0)
);

CREATE INDEX idx_credit_profiles_cust ON customer_credit_profiles(customer_id);

CREATE TABLE customer_cheques (
    cheque_id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id             UUID NOT NULL REFERENCES customers(customer_id) ON DELETE RESTRICT,
    cheque_number           VARCHAR(16) NOT NULL,
    bank_code               VARCHAR(8) NOT NULL, -- e.g., 'KBANK', 'SCB', 'BBL'
    bank_branch             VARCHAR(64),
    amount_thb              NUMERIC(15, 2) NOT NULL,
    cheque_date             DATE NOT NULL, -- Post-dated cheque maturity
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
-- 2. E01/E02: PRODUCTS, PRICING ENGINE & EFFECTIVE-DATED VAT
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
    shelf_life_days         INTEGER DEFAULT 0, -- Cement shelf life (e.g. 60-90 days)
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
    vat_rate                NUMERIC(5, 4) NOT NULL, -- 0.0700 for 7%, 0.1000 for 10%
    effective_from          TIMESTAMPTZ NOT NULL,
    effective_to            TIMESTAMPTZ NOT NULL,
    description             VARCHAR(128),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_vat_rate_valid CHECK (vat_rate >= 0.0000 AND vat_rate <= 1.0000),
    CONSTRAINT chk_vat_dates CHECK (effective_from < effective_to)
);

CREATE UNIQUE INDEX uq_vat_effective_range ON system_vat_configs(vat_code, effective_from, effective_to);

CREATE TABLE product_price_tiers (
    tier_id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id              UUID NOT NULL REFERENCES products(product_id) ON DELETE RESTRICT,
    zone_id                 VARCHAR(16) NOT NULL DEFAULT 'ZONE_BKK',
    min_quantity            NUMERIC(12, 4) NOT NULL,
    max_quantity            NUMERIC(12, 4) NOT NULL,
    base_price_thb          NUMERIC(18, 4) NOT NULL,
    floor_price_thb         NUMERIC(18, 4) NOT NULL, -- Absolute minimum price threshold
    effective_from          TIMESTAMPTZ NOT NULL,
    effective_to            TIMESTAMPTZ NOT NULL,
    is_active               BOOLEAN NOT NULL DEFAULT TRUE,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_price_tiers_qty CHECK (min_quantity > 0 AND min_quantity <= max_quantity),
    CONSTRAINT chk_floor_price_valid CHECK (floor_price_thb <= base_price_thb AND floor_price_thb > 0),
    CONSTRAINT chk_tier_dates CHECK (effective_from < effective_to)
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
    CONSTRAINT chk_freight_distance CHECK (min_distance_km < max_distance_km)
);

-- -----------------------------------------------------------------------------
-- 3. E07/E04: INVENTORY MANAGEMENT, FEFO CEMENT LOTS & ATP COMMITMENTS
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
    version                 BIGINT NOT NULL DEFAULT 1, -- Optimistic concurrency
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_on_hand_positive CHECK (physical_on_hand_qty >= 0.0000),
    CONSTRAINT chk_reserved_valid CHECK (allocated_reserved_qty >= 0.0000 AND allocated_reserved_qty <= physical_on_hand_qty),
    CONSTRAINT uq_branch_product UNIQUE (branch_id, product_id)
);

CREATE INDEX idx_branch_stock_lookup ON inventory_branch_stock(branch_id, product_id);

CREATE TABLE inventory_cement_lots (
    lot_id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    branch_id               VARCHAR(16) NOT NULL REFERENCES inventory_branches(branch_id),
    product_id              UUID NOT NULL REFERENCES products(product_id),
    batch_number            VARCHAR(64) NOT NULL,
    manufacturing_date      DATE NOT NULL,
    expiration_date         DATE NOT NULL,
    on_hand_qty             NUMERIC(12, 4) NOT NULL,
    reserved_qty            NUMERIC(12, 4) NOT NULL DEFAULT 0.0000,
    available_qty           NUMERIC(12, 4) GENERATED ALWAYS AS (on_hand_qty - reserved_qty) STORED,
    is_quarantined          BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_cement_lot_dates CHECK (manufacturing_date < expiration_date),
    CONSTRAINT chk_cement_lot_qty CHECK (on_hand_qty >= 0.0000 AND reserved_qty <= on_hand_qty)
);

-- FEFO compound index for fast allocation: earliest expiry first
CREATE INDEX idx_cement_lots_fefo ON inventory_cement_lots(branch_id, product_id, expiration_date ASC)
WHERE available_qty > 0 AND is_quarantined = FALSE;

CREATE TABLE inventory_reservations (
    reservation_id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id                UUID, -- Populated once order is finalized
    branch_id               VARCHAR(16) NOT NULL REFERENCES inventory_branches(branch_id),
    status                  VARCHAR(24) NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE', 'COMMITTED', 'RELEASED', 'EXPIRED'
    expires_at              TIMESTAMPTZ NOT NULL,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reservations_cleanup ON inventory_reservations(status, expires_at)
WHERE status = 'ACTIVE';

CREATE TABLE inventory_reservation_items (
    reservation_item_id     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reservation_id          UUID NOT NULL REFERENCES inventory_reservations(reservation_id) ON DELETE CASCADE,
    product_id              UUID NOT NULL REFERENCES products(product_id),
    lot_id                  UUID REFERENCES inventory_cement_lots(lot_id), -- Populated for FEFO tracked goods
    reserved_quantity       NUMERIC(12, 4) NOT NULL,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_reserved_item_qty CHECK (reserved_quantity > 0.0000)
);

CREATE INDEX idx_res_items_lookup ON inventory_reservation_items(reservation_id, product_id);

-- -----------------------------------------------------------------------------
-- 4. E08/E12: ORDERS & FULFILLMENT DOMAIN
-- -----------------------------------------------------------------------------
CREATE TABLE orders (
    order_id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number            VARCHAR(32) NOT NULL UNIQUE, -- E.g. 'WDS-ORD-202609-0001'
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
    CONSTRAINT chk_order_item_qty CHECK (quantity > 0.0000),
    CONSTRAINT uq_order_line UNIQUE (order_id, line_number)
);

CREATE INDEX idx_order_items_order ON order_items(order_id);

-- -----------------------------------------------------------------------------
-- 5. E10: BILLING & REVENUE-DEPARTMENT-COMPLIANT TAX INVOICES (PARTITIONED)
-- -----------------------------------------------------------------------------
-- Tax invoices are strictly immutable once posted. We partition by posting year.
CREATE TABLE tax_invoices (
    invoice_id              UUID DEFAULT uuid_generate_v4(),
    invoice_number          VARCHAR(32) NOT NULL, -- Format: 'INV-TW-{BRANCH}-{YEAR}{MONTH}-{SEQ}'
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
    digital_signature_hash  VARCHAR(256), -- SHA256 of RD canonical XML payload
    e_tax_status            VARCHAR(24) NOT NULL DEFAULT 'PENDING_SIGNING',
    pdf_storage_url         VARCHAR(512),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_tax_invoice_totals CHECK (grand_total_thb = net_taxable_amount_thb + output_vat_thb),
    PRIMARY KEY (invoice_id, posting_timestamp)
) PARTITION BY RANGE (posting_timestamp);

-- Annual Partitions for Tax Invoice Ledger
CREATE TABLE tax_invoices_2026 PARTITION OF tax_invoices
    FOR VALUES FROM ('2026-01-01 00:00:00+00') TO ('2027-01-01 00:00:00+00');

CREATE TABLE tax_invoices_2027 PARTITION OF tax_invoices
    FOR VALUES FROM ('2027-01-01 00:00:00+00') TO ('2028-01-01 00:00:00+00');

CREATE INDEX idx_tax_invoices_num ON tax_invoices(invoice_number);
CREATE INDEX idx_tax_invoices_cust ON tax_invoices(customer_id, invoice_date);

-- Tax Invoice Item Details
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
    CONSTRAINT chk_inv_item_qty CHECK (quantity > 0.0000)
);

CREATE INDEX idx_tax_inv_items_lookup ON tax_invoice_items(invoice_id);

-- Immutability Guard: Prevent any updates or deletes on posted tax invoices
CREATE OR REPLACE FUNCTION trg_prevent_posted_tax_invoice_mutation()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.is_posted = TRUE THEN
        RAISE EXCEPTION 'REVENUE DEPARTMENT SECURITY VIOLATION: Tax Invoice % has already been posted and is legally immutable.', OLD.invoice_number
        USING ERRCODE = '27000';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_tax_invoices_immutability
BEFORE UPDATE OR DELETE ON tax_invoices
FOR EACH ROW EXECUTE FUNCTION trg_prevent_posted_tax_invoice_mutation();
```

---

### 2.5 Audit Trail Architecture (Immutable Hash-Chained Ledger)

Every auditable action (credit limit override, floor price bypass, price list change, maker-checker approval) is captured in an append-only, partitioned table. To guarantee tamper-evident integrity, each entry includes a cryptographic SHA-256 hash chaining back to the previous log entry's signature.

```sql
-- -----------------------------------------------------------------------------
-- 6. SYSTEM AUDIT TRAIL (CRYPTOGRAPHICALLY HASH-CHAINED & PARTITIONED)
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
    previous_record_hash    VARCHAR(64) NOT NULL,
    current_record_hash     VARCHAR(64) NOT NULL,
    PRIMARY KEY (audit_id, event_timestamp)
) PARTITION BY RANGE (event_timestamp);

-- Monthly Partitions for High-Throughput Audit Trail
CREATE TABLE system_audit_logs_2026_09 PARTITION OF system_audit_logs
    FOR VALUES FROM ('2026-09-01 00:00:00+00') TO ('2026-10-01 00:00:00+00');

CREATE TABLE system_audit_logs_2026_10 PARTITION OF system_audit_logs
    FOR VALUES FROM ('2026-10-01 00:00:00+00') TO ('2026-11-01 00:00:00+00');

CREATE INDEX idx_audit_logs_entity ON system_audit_logs(entity_name, entity_id, event_timestamp DESC);
CREATE INDEX idx_audit_logs_user ON system_audit_logs(user_id, event_timestamp DESC);

-- Trigger to Prevent Any Modification or Deletion of Audit Logs
CREATE OR REPLACE FUNCTION trg_lock_system_audit_logs()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'SECURITY AUDIT VIOLATION: system_audit_logs is an immutable append-only ledger. UPDATE and DELETE operations are prohibited.'
    USING ERRCODE = '27001';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_logs_no_modify
BEFORE UPDATE OR DELETE ON system_audit_logs
FOR EACH ROW EXECUTE FUNCTION trg_lock_system_audit_logs();
```

---

### 2.6 Maker-Checker Staging & Approval Workflow Schema

To enforce dual-control authorization for sensitive master data changes (customer credit limits, base pricing tiers, freight rates, floor price overrides), changes are never applied directly. They enter a `maker_checker_requests` staging table. The original record remains unchanged until an authorized Checker approves the staging payload.

```sql
-- -----------------------------------------------------------------------------
-- 7. MAKER-CHECKER STAGING DOMAIN
-- -----------------------------------------------------------------------------
CREATE TABLE maker_checker_requests (
    request_id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    domain_module           VARCHAR(32) NOT NULL, -- 'CREDIT_LIMIT', 'PRICING_TIER', 'FLOOR_PRICE_OVERRIDE'
    entity_name             VARCHAR(64) NOT NULL,
    entity_id               VARCHAR(64), -- Nullable for new entity creations
    action_type             action_type_enum NOT NULL,
    staged_payload_json     JSONB NOT NULL,
    diff_summary_json       JSONB NOT NULL,
    maker_user_id           VARCHAR(64) NOT NULL,
    maker_comments          TEXT NOT NULL,
    maker_submitted_at      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    checker_user_id         VARCHAR(64),
    checker_comments        TEXT,
    checker_action_at       TIMESTAMPTZ,
    status                  maker_checker_status_enum NOT NULL DEFAULT 'PENDING',
    applied_at              TIMESTAMPTZ,
    error_log               TEXT,
    CONSTRAINT chk_maker_checker_distinct CHECK (maker_user_id <> checker_user_id) -- Rule: Maker cannot be Checker
);

CREATE INDEX idx_maker_checker_pending ON maker_checker_requests(domain_module, status)
WHERE status = 'PENDING';
```

---

# 3. API Specifications & Data Contracts (RESTful / OpenAPI 3.0)

### 3.1 Global Standards & Contract Governance

1. **Uniform Resource Design**: Strictly RESTful nouns; plurals for resource collections (`/api/v1/orders`, `/api/v1/pricing`).
2. **Idempotency**: All state-mutating endpoints (`POST`, `PATCH`, `DELETE`) require the `X-Idempotency-Key` HTTP header (UUID v4). Cached responses are retained in Redis for 24 hours to prevent duplicate orders or duplicate tax invoices on client network retry.
3. **Error Response Envelope**: Complies with **RFC 7807 (Problem Details for HTTP APIs)**:
```json
{
  "type": "https://api.thaiwatsadu.com/errors/credit-limit-exceeded",
  "title": "Credit Limit Exceeded",
  "status": 422,
  "detail": "Requested order amount 250,000.00 THB exceeds customer available credit 180,000.00 THB by 70,000.00 THB.",
  "instance": "/api/v1/orders/validate-and-submit",
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

Calculates real-time wholesale tiered pricing, volume breaks, freight surcharges, floor price boundary checks, and effective-dated VAT.

#### Request Payload
```json
{
  "customerId": "8f683a42-7c85-48b2-b43e-c6d997b1050e",
  "branchId": "TW-BKK-01",
  "deliveryZoneId": "ZONE_BKK_EAST",
  "deliveryDistanceKm": 28.50,
  "requestedDeliveryDate": "2026-09-12T08:00:00Z",
  "items": [
    {
      "lineNumber": 1,
      "productId": "3f443b71-3cb5-4cf5-b108-a92440ea9011",
      "skuCode": "SKU-CEM-SCG-50KG",
      "quantity": 250.0000,
      "uom": "BAG"
    },
    {
      "lineNumber": 2,
      "productId": "9b123a10-21a4-4df2-a129-c88990bb8204",
      "skuCode": "SKU-STEEL-RB-12MM",
      "quantity": 100.0000,
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

### 3.3 Endpoint 2: Order Submission & Validation (`POST /api/v1/orders/validate-and-submit`)

Submits, validates against credit limits and inventory ATP leases, and transitions wholesale orders.

#### Request Headers
- `X-Idempotency-Key`: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`
- `Content-Type`: `application/json`

#### Request Payload
```json
{
  "customerId": "8f683a42-7c85-48b2-b43e-c6d997b1050e",
  "branchId": "TW-BKK-01",
  "reservationId": "res-77218a00-1122-3344-5566-778899aabbcc",
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
      "quantity": 250.0000,
      "uom": "BAG",
      "unitNetPriceThb": "155.0000"
    },
    {
      "lineNumber": 2,
      "productId": "9b123a10-21a4-4df2-a129-c88990bb8204",
      "quantity": 100.0000,
      "uom": "PIECE",
      "unitNetPriceThb": "192.5000"
    }
  ]
}
```

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

### 3.4 Endpoint 3: Real-Time Credit & Cheque Check (`POST /api/v1/credit/realtime-check`)

Computes real-time credit risk exposure including active AR ledger balance, pending post-dated cheques, unbilled in-flight orders, and bounced cheque history.

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
    "utilizationPercentage": 42.26
  },
  "action": "APPROVE"
}
```

---

### 3.5 Endpoint 4: Stock Reservation & ATP Commitment (`POST /api/v1/inventory/reserve-atp`)

Executes high-concurrency stock reservation with **FEFO lot allocation for bagged cement** and lease expiration timeouts (15 minutes).

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
      "requestedQuantity": 250.0000,
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
          "expirationDate": "2026-10-01",
          "allocatedQuantity": "150.0000"
        },
        {
          "lotId": "lot-202607-002",
          "batchNumber": "BATCH-SCG-260715",
          "manufacturingDate": "2026-07-15",
          "expirationDate": "2026-10-15",
          "allocatedQuantity": "100.0000"
        }
      ]
    }
  ]
}
```

---

### 3.6 Endpoint 5: Tax Invoice Generation & Posting (`POST /api/v1/billing/tax-invoices/generate-and-post`)

Generates an immutable, Revenue-Department-compliant official Tax Invoice (ใบกำกับภาษีเต็มรูป), computes Output VAT, generates the SHA-256 canonical digest, and triggers digital signature / e-Tax Invoice pipeline.

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

# 4. Engineering Standards & Quality Assurance Specifications

### 4.1 Git Commit Convention with Requirement ID Enforcement

To maintain an unshakeable traceability matrix linking each code change directly to the 249 Release 1 requirements (from Epics E01–E15), all commits must adhere to the bracketed Requirement ID format:

#### Commit Message Format
```
[FR-xx-xxx] <type>(<scope>): <subject>

<body>

<footer>
```

- **Tag `[FR-xx-xxx]`**: Mandatory requirement tag matching the SRS v1.1 specification (e.g. `[FR-02-005]` for Pricing Volume Breaks, `[FR-07-012]` for FEFO Cement Allocation, `[FR-10-001]` for Tax Invoicing). Cross-cutting / tooling commits may use `[FR-SYS-000]`.
- **Type**: Must be one of `feat`, `fix`, `refactor`, `test`, `chore`, `docs`, `perf`, `ci`.
- **Scope**: Lowercase module name (`pricing`, `credit`, `inventory`, `orders`, `billing`, `auth`, `db`).
- **Subject**: Imperative, present tense, no trailing period, max 72 characters.

#### Valid Examples
- `[FR-02-004] feat(pricing): implement volume break tiered pricing lookup`
- `[FR-07-012] fix(inventory): enforce FEFO sort order on cement batch allocation`
- `[FR-03-008] feat(credit): add post-dated cheque exposure to credit check engine`
- `[FR-10-002] test(billing): add Banker's rounding test cases for Output VAT calculation`

---

### 4.2 Git Hooks Implementation (`commit-msg` Hook)

Every developer environment and CI runner enforces this standard via a pre-configured git hook script located at `.husky/commit-msg` or `.git/hooks/commit-msg`:

```bash
#!/usr/bin/env bash
# ==============================================================================
# Thai Watsadu WDS Git Commit Message Linter
# Enforces: [FR-xx-xxx] <type>(<scope>): <subject>
# ==============================================================================

COMMIT_MSG_FILE=$1
COMMIT_MSG=$(head -n 1 "$COMMIT_MSG_FILE")

# Regular Expression Pattern for WDS Requirements
REGEX="^\[(FR-[0-9]{2}-[0-9]{3}|FR-SYS-[0-9]{3})\] (feat|fix|refactor|test|chore|docs|perf|ci)\([a-z0-9_-]+\): .{1,72}$"

if ! [[ "$COMMIT_MSG" =~ $REGEX ]]; then
    echo "================================================================================"
    echo "ERROR: INVALID GIT COMMIT MESSAGE FORMAT"
    echo "--------------------------------------------------------------------------------"
    echo "Your commit message failed the WDS architectural traceability check."
    echo ""
    echo "Current commit message:"
    echo "  $COMMIT_MSG"
    echo ""
    echo "Expected format:"
    echo "  [FR-xx-xxx] <type>(<scope>): <subject>"
    echo ""
    echo "Examples:"
    echo "  [FR-02-004] feat(pricing): add volume break tiered pricing lookup"
    echo "  [FR-07-012] fix(inventory): enforce FEFO lot sort order for cement"
    echo "================================================================================"
    exit 1
fi

exit 0
```

---

### 4.3 Definition of Ready (DoR) and Definition of Done (DoD)

#### Definition of Ready (DoR)
A story/requirement is accepted into a Sprint (S0–S12) only when:
1. **Requirement Traceability**: Mapped to explicit `[FR-xx-xxx]` identifier in SRS v1.1.
2. **Acceptance Criteria**: Formatted as verifiable Gherkin scenarios (`Given`, `When`, `Then`).
3. **Data Precision Defined**: Every monetary and inventory attribute specifies exact `NUMERIC(p, s)` precision; zero floating-point ambiguity.
4. **API Contract Finalized**: OpenAPI 3.0 request/response schema reviewed and approved by both Frontend and Backend leads.
5. **Maker-Checker & Security Classification**: Explicitly identifies if Maker-Checker staging is required and OWASP Top 10 data-masking rules apply.

#### Definition of Done (DoD)
A story/requirement is marked COMPLETE only when:
1. **Code Implementation**: Fully implemented in TypeScript/NestJS, clean of lint errors (`npm run lint`), strictly typed (`tsc --noEmit`).
2. **Automated Test Coverage**:
   - Minimum **>=80% line and branch coverage** on core business logic (`pricing`, `credit`, `inventory`, `tax invoicing`).
   - Unit tests and integration tests passing in CI.
3. **Immutability & Decimal Rules**: Verified that no `FLOAT` types exist in code or migrations; all monetary computations use `Decimal.js` or equivalent arbitrary-precision library.
4. **Database Migrations**: Flyway/Prisma migration dry-run completed on fresh database instance with successful rollback script verification.
5. **Peer Code Review**: Approved by at least 2 senior engineers; PR references the `[FR-xx-xxx]` requirement ID.
6. **Security & Vulnerability Gates**: Zero Critical or High severity vulnerabilities detected by SAST and SCA scans.

---

### 4.4 CI/CD Pipeline Automated Gates & Static Quality Thresholds

The following automated pipeline gates run on every GitHub / GitLab Pull Request and deployment pipeline:

```
[ Git Push / PR Open ]
         |
         v
+-------------------------------------------------------+
| Gate 1: Syntax, Types & Linting                       |
| - ESLint (zero warnings/errors)                       |
| - TypeScript strict compiler (`tsc --noEmit`)         |
+-------------------------------------------------------+
         |
         v
+-------------------------------------------------------+
| Gate 2: Security & Dependency Vulnerability (SCA)     |
| - Trivy / Snyk dependency scan                        |
| - Fail if ANY High or Critical CVE found              |
| - Check against banned packages                       |
+-------------------------------------------------------+
         |
         v
+-------------------------------------------------------+
| Gate 3: Static Analysis & Code Quality (SAST)         |
| - SonarQube Quality Gate                              |
| - Code Smells < 10, Duplicated Lines < 3%             |
| - Zero OWASP Top 10 vulnerabilities (SQLi, IDOR)      |
+-------------------------------------------------------+
         |
         v
+-------------------------------------------------------+
| Gate 4: Database Migration Dry-Run & Schema Lint      |
| - Ephemeral PostgreSQL test container spun up         |
| - Run forward migrations (V1 -> V_latest)             |
| - Validate strict NUMERIC types (fail if FLOAT/DOUBLE)|
| - Run reverse rollback migrations                     |
+-------------------------------------------------------+
         |
         v
+-------------------------------------------------------+
| Gate 5: Automated Test Suites & Coverage Gates        |
| - Run Unit Tests (Jest / Vitest)                      |
| - Run Integration Tests (Testcontainers PostgreSQL)  |
| - Verify Coverage >= 80% on Core Domains              |
+-------------------------------------------------------+
         |
         v
[ Gate Passed -> Merge Permitted / Auto Deploy to Staging ]
```

---

### 4.5 Unit & Integration Testing Architecture (>=80% Coverage Standard)

The automated test suite uses **Jest / Vitest** for unit tests and **Testcontainers** (spinning up isolated real PostgreSQL and Redis instances in Docker) for integration tests.

The **>=80% Coverage Standard** is strictly enforced on the 4 Core Business Engines:
1. **Pricing Engine (`modules/pricing`)**: Volume break tiers, floor price violations, Thai VAT calculations, zone freight rate matrices.
2. **Credit & Cheque Control Engine (`modules/credit`)**: Exposure calculations, post-dated cheque states, credit limit breaches, customer blocking.
3. **Inventory ATP & FEFO Engine (`modules/inventory`)**: Bagged cement FEFO lot selection, concurrent race condition locking, reservation lease expiration.
4. **Billing & Tax Invoicing (`modules/billing`)**: Banker's rounding, canonical SHA-256 hash digest calculation, RD tax invoice sequence formatting, immutability trigger verification.

---

### 4.6 Verification & Test Suites (Production-Grade Code Examples)

#### 1. Pricing Engine Unit Test Suite (`pricing-engine.spec.ts`)
```typescript
import { Decimal } from 'decimal.js';
import { PricingEngine } from './pricing.engine';

describe('PricingEngine - [FR-02-004] [FR-02-005] Tiered Pricing & Floor Protection', () => {
  let engine: PricingEngine;

  beforeEach(() => {
    engine = new PricingEngine();
  });

  test('should apply 200-500 bag tier discount correctly for SCG Cement', () => {
    const item = {
      skuCode: 'SKU-CEM-SCG-50KG',
      quantity: new Decimal('250.0000'),
      unitListPrice: new Decimal('165.0000'),
      floorPrice: new Decimal('148.0000'),
      tiers: [
        { minQty: new Decimal('1.0000'), maxQty: new Decimal('99.0000'), discount: new Decimal('0.0000') },
        { minQty: new Decimal('100.0000'), maxQty: new Decimal('199.0000'), discount: new Decimal('5.0000') },
        { minQty: new Decimal('200.0000'), maxQty: new Decimal('500.0000'), discount: new Decimal('10.0000') }
      ]
    };

    const result = engine.calculateLineItem(item);

    expect(result.unitNetPrice.toString()).toBe('155');
    expect(result.lineDiscount.toString()).toBe('2500');
    expect(result.lineSubtotal.toString()).toBe('38750');
    expect(result.isFloorViolated).toBe(false);
  });

  test('should trigger floor price violation when custom discount breaches floor barrier', () => {
    const item = {
      skuCode: 'SKU-CEM-SCG-50KG',
      quantity: new Decimal('50.0000'),
      unitListPrice: new Decimal('165.0000'),
      floorPrice: new Decimal('148.0000'), // Floor barrier
      manualDiscountPerUnit: new Decimal('20.0000'), // Proposed price = 145 < 148
      tiers: []
    };

    const result = engine.calculateLineItem(item);

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

#### 2. Inventory ATP & FEFO Concurrency Test Suite (`inventory-atp.spec.ts`)
```typescript
import { Decimal } from 'decimal.js';
import { InventoryAtpService } from './inventory-atp.service';

describe('InventoryAtpService - [FR-07-012] [FR-04-003] FEFO Lot Allocation & Race Conditions', () => {
  let atpService: InventoryAtpService;

  test('should allocate earliest expiring cement lots first (FEFO)', async () => {
    const lots = [
      { lotId: 'LOT-B', expiry: new Date('2026-11-01'), availableQty: new Decimal('100.0000') },
      { lotId: 'LOT-A', expiry: new Date('2026-10-01'), availableQty: new Decimal('150.0000') }, // Earliest
      { lotId: 'LOT-C', expiry: new Date('2026-12-01'), availableQty: new Decimal('200.0000') }
    ];

    const requestedQty = new Decimal('200.0000');
    const allocations = atpService.allocateFefoLots(lots, requestedQty);

    expect(allocations).toHaveLength(2);
    expect(allocations[0].lotId).toBe('LOT-A');
    expect(allocations[0].allocatedQty.toString()).toBe('150');
    expect(allocations[1].lotId).toBe('LOT-B');
    expect(allocations[1].allocatedQty.toString()).toBe('50');
  });

  test('should handle concurrent stock reservations gracefully using row-level locking', async () => {
    // Simulates two concurrent requests reserving the last 10 bags of cement
    const branchId = 'TW-BKK-01';
    const productId = '3f443b71-3cb5-4cf5-b108-a92440ea9011';

    const promise1 = atpService.reserveStockWithLock(branchId, productId, new Decimal('10.0000'));
    const promise2 = atpService.reserveStockWithLock(branchId, productId, new Decimal('10.0000'));

    const results = await Promise.allSettled([promise1, promise2]);

    const fulfilled = results.filter(r => r.status === 'fulfilled');
    const rejected = results.filter(r => r.status === 'rejected');

    // Exactly one reservation must succeed, and one must fail with InsufficientStockException
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
  });
});
```

#### 3. Real-Time Credit & Cheque Control Test Suite (`credit-control.spec.ts`)
```typescript
import { Decimal } from 'decimal.js';
import { CreditControlEngine } from './credit-control.engine';

describe('CreditControlEngine - [FR-03-001] [FR-03-008] Risk & Cheque Validation', () => {
  let creditEngine: CreditControlEngine;

  test('should reject order if combined AR, unbilled orders and proposed total exceeds credit limit', () => {
    const profile = {
      creditLimitThb: new Decimal('500000.00'),
      postedArBalanceThb: new Decimal('380000.00'),
      unbilledOrdersThb: new Decimal('70000.00'), // Total exposure = 450,000.00
      isBlocked: false,
      hasBouncedCheque: false
    };

    const proposedOrderAmount = new Decimal('60000.00'); // 450,000 + 60,000 = 510,000 > 500,000
    const decision = creditEngine.evaluateCredit(profile, proposedOrderAmount);

    expect(decision.isEligible).toBe(false);
    expect(decision.action).toBe('REJECT_OVER_LIMIT');
    expect(decision.overAmountThb.toString()).toBe('10000');
  });

  test('should immediately block credit if customer has uncleared bounced cheques', () => {
    const profile = {
      creditLimitThb: new Decimal('500000.00'),
      postedArBalanceThb: new Decimal('50000.00'),
      unbilledOrdersThb: new Decimal('0.00'),
      isBlocked: false,
      hasBouncedCheque: true // Bounced cheque flag active
    };

    const proposedOrderAmount = new Decimal('20000.00');
    const decision = creditEngine.evaluateCredit(profile, proposedOrderAmount);

    expect(decision.isEligible).toBe(false);
    expect(decision.action).toBe('REJECT_BOUNCED_CHEQUE');
    expect(decision.blockReason).toContain('bounced cheque');
  });
});
```

---

## 5. Architectural Risk Analysis & Mitigation Matrix

| ID | Technical Risk Description | Probability | Impact | Engineering Mitigation Strategy |
| :--- | :--- | :--- | :--- | :--- |
| **TR-01** | Inventory contention deadlock during peak wholesale buying surges | High | High | Enforce `SELECT ... FOR UPDATE SKIP LOCKED` and Redis-backed Redlock short leases (15-min TTL) to prevent database thread starvation. |
| **TR-02** | Decimal precision loss in floating-point JavaScript/V8 calculations | High | Critical | Enforce `decimal.js` throughout backend domain code; enforce `NUMERIC` types in database; CI/CD schema linter strictly rejects `FLOAT`/`DOUBLE`. |
| **TR-03** | Unauthorized mutation of posted Tax Invoices violating RD regulations | Low | Critical | Database-level trigger `trg_prevent_posted_tax_invoice_mutation` raises hard exception; immutable S3 Object Lock retention on signed PDF/A-3 and XML files. |
| **TR-04** | Merchandising Item Feed (I0a) bulk sync (100k items) overwhelming database | Medium | Medium | Ingest feed via Kafka in partitioned batches of 500 items; perform bulk UPSERTs (`INSERT ... ON CONFLICT DO UPDATE`) in streaming worker. |
| **TR-05** | Unauthorized bypass of floor prices by sales representatives | Medium | High | Automated Maker-Checker workflow interceptor prevents order confirmation until authorized checker signs off in `maker_checker_requests`. |

---

## 6. Implementation Phasing & Developer Roadmap (S0–S12)

- **Sprint S0 (Weeks 1–2)**: Architecture baseline, repository setup, Husky git commit hooks (`[FR-xx-xxx]`), PostgreSQL DDL schema deployment, CI/CD automated gate pipelines.
- **Sprint S1–S2 (Weeks 3–6)**: E01/E13 Master Data, Customer Credit Profiles, RBAC, and Maker-Checker Staging engine.
- **Sprint S3–S4 (Weeks 7–10)**: E02 Pricing Engine, Volume Tiers, Floor Price protection, and Zone Freight calculator.
- **Sprint S5–S6 (Weeks 11–14)**: E03 Credit & Cheque Control Engine, Real-time exposure calculation, and Bounced Cheque register.
- **Sprint S7–S8 (Weeks 15–18)**: E07/E04 Inventory Management, Bagged Cement FEFO Lot tracking, and High-Concurrency ATP Commitment engine.
- **Sprint S9–S10 (Weeks 19–22)**: E08/E12 Order Management, Validation, and Multi-Branch Fulfillment workflow.
- **Sprint S11–S12 (Weeks 23–26)**: E10 Revenue Department Tax Invoicing, Immutable Ledger, E-Tax XML/PDF generation, and SAP GL Interface (I0e) integration.

---
**End of Specification WDS-TECH-SPEC-R3-V1.0**
