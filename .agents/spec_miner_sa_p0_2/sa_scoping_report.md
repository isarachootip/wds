# System Architecture & High-Level Design (SA Scoping Report)
## Wholesale & Direct Sales (WDS) System — Thai Watsadu v1.0

**Document Reference**: WDS-SA-R2-SPEC-001  
**Author**: SA Scope Specification Miner (`spec_miner_sa_p0_2`)  
**Date**: 2026-09-09  
**Status**: Formal Architectural Specification Baseline  
**Scope**: R2 System Architecture, C4 Models, Integration Interfaces (I0a–I0e), Core Domains, Security & NFRs  

---

## 1. Executive Summary & Architectural Strategy

The Wholesale & Direct Sales (WDS) platform is Thai Watsadu's mission-critical enterprise engine for B2B trade, catering to commercial contractors, property developers, government entities, and large-scale builders. Unlike standard B2C retail POS systems, WDS manages multi-million Baht credit facilities, multi-store cross-branch inventory reservations, complex tiered pricing algorithms with freight surcharges, strict Thai Revenue Department (RD) legal compliance for tax invoicing, and seamless synchronization with 5 major enterprise touchpoints (I0a–I0e).

### Core Architectural Principles
1. **Financial Precision Guarantee**: Zero-tolerance for IEEE 754 floating-point inaccuracies. All monetary and stock figures utilize arbitrary-precision fixed-point math (`DECIMAL`/`NUMERIC`) across storage, domain logic, and API payloads.
2. **Auditability & Regulatory Strictness**: Every financial and inventory state transition is append-only, immutable, and fully traceable with maker-checker dual controls, meeting Thai Revenue Code Sections 86/4, 86/5, and 86/9.
3. **High-Availability Distributed Inventory**: Sub-second multi-store Available-to-Promise (ATP) queries and two-phase reservation mechanics prevent stock contention across 80+ branches and central distribution centers (CDCs).
4. **Time & Locale Standardization**: Strict UTC storage with seamless localized presentation in `Asia/Bangkok` (UTC+7) and Royal Institute Thai collation (`th-TH-x-icu`).

---

## 2. C4 Architecture Specification

### 2.1 C4 Level 1: System Context Diagram

```
+----------------------------------------------------------------------------------------------------+
|                                      THAI WATSADU ENTERPRISE CONTEXT                                |
+----------------------------------------------------------------------------------------------------+

                   +-----------------------------+       +-----------------------------+
                   |   Wholesale Customer / B2B  |       |   Direct Sales Rep / KAM    |
                   |   (Contractor / Developer)  |       |   (Field & Key Account)     |
                   +--------------+--------------+       +--------------+--------------+
                                  |                                     |
                                  | Web Portal / Quotes                 | Mobile Tablet / CRM Orders
                                  v                                     v
+------------------+     +-------------------------------------------------------------+     +--------------------+
|   Store Staff /  |     |                                                             |     | Credit & Risk Team |
| Store Warehouse  |---->|            WHOLESALE & DIRECT SALES (WDS) SYSTEM            |<----| (Credit Analyst,   |
| (Pick/Pack/ATP)  |     |                                                             |     |  Finance Director) |
+------------------+     +-------------------------------------------------------------+     +--------------------+
                                  |                     |                      |
                                  | I0a, I0b            | I0c, I0d             | I0e, RD e-Tax
                                  v                     v                      v
+------------------+     +------------------+  +------------------+  +------------------+   +--------------------+
| I0a: Merchandis- |     | I0b: Retail      |  | I0c: Enterprise  |  | I0d: Retail POS  |   | I0e: GL / ERP      |
| ing ERP (100k    |     | Store Stock      |  | CRM (Customer /  |  | (Direct Store    |   | (AR Sub-ledger,    |
| Items Feed)      |     | (Real-time ATP)  |  | Tiers / Credit)  |  | Cash Collection) |   | Tax Posting)       |
+------------------+     +------------------+  +------------------+  +------------------+   +---------+----------+
                                                                                                      |
                                                                                                      v
                                                                                            +--------------------+
                                                                                            | RD e-Tax Invoice   |
                                                                                            | Gateway (ETDA/RD)  |
                                                                                            +--------------------+
```

### 2.2 C4 Level 2: Container Diagram

```
+-------------------------------------------------------------------------------------------------------------+
|                                    WDS PLATFORM CONTAINER ARCHITECTURE                                      |
+-------------------------------------------------------------------------------------------------------------+

  [ Clients & Channels ]
  +--------------------------+  +--------------------------+  +--------------------------+
  |  B2B Contractor Web SPA  |  |  Sales Rep Mobile Web App|  | Store Fulfillment Portal |
  |  (React / TypeScript)    |  |  (PWA / Responsive)      |  | (Barcode / RFID Station) |
  +-------------+------------+  +-------------+------------+  +-------------+------------+
                |                             |                             |
                +-----------------------------+-----------------------------+
                                              | HTTPS / WSS / TLS 1.3
                                              v
  [ API Gateway & Ingress Layer ]
  +--------------------------------------------------------------------------------------+
  | API Gateway & Security Ingress (Reverse Proxy, OAuth2/OIDC, Rate Limiting, WAF)      |
  +-------------------------------------------+------------------------------------------+
                                              |
                                              v
  [ Core Domain Services (Modular Monolith / Domain Microservices) ]
  +--------------------+ +--------------------+ +--------------------+ +--------------------+
  | Master Data        | | Pricing Engine     | | Credit & Cheque    | | Inventory & ATP    |
  | Service (E01/E13)  | | Service (E02)      | | Control (E03)      | | Service (E07/E04)  |
  +--------------------+ +--------------------+ +--------------------+ +--------------------+
  +--------------------+ +--------------------+ +--------------------+ +--------------------+
  | Order & Quotation  | | Billing & Tax      | | Integration Broker | | Audit & Compliance |
  | Service (E08/E12)  | | Invoicing (E10)    | | (I0a - I0e Adapters)| | Service            |
  +--------------------+ +--------------------+ +--------------------+ +--------------------+
            |                      |                      |                      |
            +----------------------+----------------------+----------------------+
                                   |                      |
                                   v                      v
  [ Data & Message Infrastructure ]
  +-----------------------------------------+  +-----------------------------------------+
  | Relational Primary Store (PostgreSQL)   |  | In-Memory Cache & Lock Store (Redis)    |
  | - Master Data, Orders, Invoices, AR     |  | - Real-time ATP fast cache              |
  | - Row-Level Security, Immutable Triggers|  | - Redlock distributed locks             |
  | - ICU Collation "th-TH-x-icu"           |  | - User session states                   |
  +-----------------------------------------+  +-----------------------------------------+
  +-----------------------------------------+  +-----------------------------------------+
  | Event Bus & Messaging (RabbitMQ/Kafka)  |  | Document & Object Archive (S3 / MinIO)  |
  | - Outbox pattern publisher              |  | - RD e-Tax XML & Signed PDF/A-3         |
  | - Asynchronous integration events       |  | - Attached POs & Cheque Scans           |
  +-----------------------------------------+  +-----------------------------------------+
```

### 2.3 C4 Level 3: Component Diagrams for Critical Subsystems

#### Pricing Engine Subsystem Components (E02)
- **PriceResolutionCoordinator**: Orchestrates the pricing pipeline across pricing rules.
- **BasePriceFinder**: Retrieves base SKU prices mapped to the customer's Wholesale Tier.
- **VolumeBreakCalculator**: Evaluates quantity bands (stepped vs block volume discount).
- **FreightZoneCalculator**: Determines delivery zone logistics surcharge based on postal code/coordinates, truck classification (4-wheel, 6-wheel, 10-wheel, 22-wheel trailer), and weight/volume constraints.
- **FloorPriceEnforcer**: Compares calculated line prices against SKU minimum margin floor; triggers mandatory approval workflow if breached.
- **DiscountAuthorityValidator**: Validates requested manual discounts against the submitter's Role Limit in the Delegation of Financial Authority (DOFA) matrix.
- **EffectiveVatCalculator**: Computes 7.0000% Output VAT (or applicable historical/future rate) with Banker's Rounding (`ROUND_HALF_UP`) to 2 decimal places.

#### Inventory & ATP Subsystem Components (E07/E04)
- **ATPQueryEngine**: Aggregates On-Hand, Committed, Inbound, and Safety stocks across store locations.
- **FEFOLotPicker**: Filters stock batches for expiration-dated items (e.g. cement, chemicals, paint), prioritizing earliest expiry date while optimizing pallet picks.
- **DistributedReservationManager**: Employs Redis Redlock and database row-versioning (`xmin` / `version`) to manage soft reservations (30-min TTL) and prevent overselling.
- **StoreStockAllocationRouter**: Determines optimal fulfillment routing (Single Branch pickup, Multi-Store Split Delivery, or CDC drop-ship) based on inventory proximity and customer cost.

#### Credit & Cheque Control Components (E03)
- **ExposureCalculator**: Computes instantaneous financial exposure: `Exposure = AR_Unpaid + Orders_InFlight + PDC_Unpresented - Available_Balance`.
- **CreditBlockGuard**: Applies Hard Block (Order creation blocked) or Soft Block (Order routed to Credit Committee).
- **ChequeRegisterManager**: Tracks cheque lifecycle: `RECEIVED` -> `VAULT` -> `DEPOSITED` -> `CLEARING` -> `HONORED` / `BOUNCED`.
- **BouncedChequeProtocolHandler**: Executes immediate account freeze, sets terms to Cash-Before-Delivery (CBD), and posts reversal journals.
- **EmergencyReleaseWorkflow**: Handles multi-signature approval (Credit Manager + Finance Director) for high-priority overrides with time-bound release tokens.

---

## 3. Enterprise Integration Architecture (I0a – I0e)

| Interface ID | Connected System | Protocol & Transport | Payload Format | Sync Frequency & SLA | Consistency Pattern |
|--------------|------------------|----------------------|----------------|----------------------|---------------------|
| **I0a** | Merchandising ERP | SFTP Batch (Full) + Kafka / Webhook (Delta) | JSON / Apache Avro (Gzip compressed) | Daily Full (01:00 UTC, 100k items) + Delta Every 5 mins (SLA < 15s) | Staging Table Upsert with Checksum Hash |
| **I0b** | Retail Store Stock | gRPC / REST over mTLS + Redis Cache Sync | Protocol Buffers (gRPC) / JSON | Real-time Query (P99 < 150ms); Reservation (P99 < 300ms) | Two-Phase Soft Reservation with 30-min TTL |
| **I0c** | Enterprise CRM | REST API + Outbox Webhooks (mTLS) | JSON (OpenAPI 3.0) | Bidirectional Near-Realtime (< 5s for Tier/Limit changes) | Event-Driven Idempotent Consumer |
| **I0d** | Retail Store POS | REST API / WebSocket (Store Edge LAN) | JSON (Encrypted JWE) | Real-time POS settlement & cashier notification (< 500ms) | Distributed Transaction / Saga with Compensating Actions |
| **I0e** | GL / Finance ERP | REST API + Nightly Reconciliation SFTP | JSON / ISO 20022 Financial Records | Near-Realtime posting (< 2s) + Nightly Batch at 23:59:59 BKK | Double-Entry Balancing with Outbox Retry |

### 3.1 Interface I0a: Merchandising Item Feed (100k Items)
- **Volume & Characteristics**: 100,000 active SKUs, 4-level catalog taxonomy (Department, Sub-Department, Class, Sub-Class), complex UOM conversions (e.g., 1 Bag = 50 kg, 1 Pallet = 40 Bags = 2,000 kg), packaging dimensions, weight, barcodes (EAN-13), hazardous/perishable indicators.
- **Ingestion Pipeline**:
  1. Full Catalog Sync (Daily at 01:00 UTC / 08:00 Asia/Bangkok): High-performance bulk streaming into PostgreSQL staging table `stg_merchandising_items` using `COPY` binary protocol.
  2. Delta Feed: Streamed via Kafka topic `erp.merchandising.item-updates`.
  3. Change Detection: SHA-256 hash computed over normalized attributes (`sku_code`, `uom`, `tax_category`, `is_perishable`, `shelf_life_days`, `dimensions`, `weight_kg`). If hash matches current production record, update is skipped.
  4. Validation Engine: Strict schema check (reject invalid barcode, missing tax category, negative weight, or malformed UOM conversion ratios). Errors isolated to `merchandising_feed_errors` table without aborting the entire batch.

### 3.2 Interface I0b: Retail Store Stock (Real-Time ATP & Reservation)
- **Topology**: Connects WDS Central Engine to 80+ Thai Watsadu retail stores and Central Distribution Centers (CDCs).
- **Protocol**: High-speed gRPC with keep-alive over dedicated corporate SD-WAN/mTLS.
- **Workflow**:
  1. **Query ATP**: WDS queries localized store stock cache in Redis (refreshed via CDC/Store event stream). If cache misses or requires fresh guarantee, falls back to direct store gRPC query.
  2. **Soft Reservation (`RESERVE_STOCK`)**:
     - Locks quantity at branch `branch_id` for SKU `sku_code` with a reservation token and a 30-minute expiration TTL.
     - Decrements `available_qty` and increments `soft_reserved_qty`.
  3. **Hard Commitment (`COMMIT_STOCK`)**:
     - Invoked upon credit clearance / payment confirmation.
     - Transitions `soft_reserved_qty` to `hard_committed_qty` with order ID binding.
  4. **Release / Expiry (`RELEASE_STOCK`)**:
     - Triggered automatically if reservation TTL expires or quotation is cancelled. Quantity returned to available pool.

### 3.3 Interface I0c: Enterprise CRM (Customer Master & Credit Profile)
- **Bi-directional Sync**:
  - CRM to WDS: Inbound customer creation, Tax ID, Head Office / Branch code (5 digits), contact persons, billing addresses, approved credit terms (e.g. Net 30, Net 60), credit limits, assigned wholesale tier (Tier 1–4).
  - WDS to CRM: Outbound sales volume metrics, average payment period (DSO - Days Sales Outstanding), returned cheques count, current credit exposure.
- **Thai Legal Entity Validation**:
  - Thai National ID (13 digits with Modulo 11 validation).
  - Corporate Tax ID (13 digits) + Branch Number (5 digits: `00000` = สำนักงานใหญ่, `00001`+ = สาขาย่อย).

### 3.4 Interface I0d: Retail Store POS (Store Collection & Settlement)
- **Use Case**: Direct sales customer places wholesale order online or via sales rep, but collects goods at a specific store branch and pays at the store POS cash register (or pays cash on collection).
- **Interaction Contract**:
  - WDS pushes collection order to POS gateway: `OrderRef`, `CustomerTaxId`, `PayableAmount`, `BranchId`.
  - Cashier scans order barcode on customer dispatch sheet; POS prompts amount.
  - Split Settlement: Supports Cash, Corporate Credit Card, QR PromptPay B2B, or Bank Transfer slip upload.
  - Upon settlement, POS emits `pos.payment.settled` event to WDS; WDS triggers stock release from store warehouse and generates the RD Tax Invoice.

### 3.5 Interface I0e: GL / Finance ERP (AR & Tax Sub-Ledger)
- **Financial Integration Standard**:
  - Real-time event-driven journal posting via Outbox Pattern.
  - Exact double-entry book-keeping entries:
    - **Sales Order Invoiced**:
      - `DR`: Accounts Receivable - Trade Wholesale (Account #113100) = Total Invoice Amount
      - `CR`: Revenue from Direct Sales (Account #411200) = Net Taxable Subtotal
      - `CR`: Output VAT - Undue / Due (Account #213100) = Output VAT 7%
    - **Customer Payment / Cheque Cleared**:
      - `DR`: Bank Account / Cash in Transit (Account #111200) = Collected Amount
      - `CR`: Accounts Receivable - Trade Wholesale (Account #113100) = Collected Amount
  - Nightly Batch Reconciliation: Extracts daily sales journal, calculates hash totals of Debits and Credits, and matches against WDS invoice register at 23:59:59 Asia/Bangkok. Discrepancies alert the Finance Operations Center within 15 minutes.

---

## 4. Core Domains Architecture & Business Logic

### 4.1 Master Data Management & Governance (E01/E13)
- **Maker-Checker Approval Pattern**:
  - High-impact changes (Credit Limit updates, Wholesale Base Price adjustments, Customer Tier reassignments, Discount Matrix alterations) CANNOT be applied by a single user.
  - **Maker**: Submits proposed change. System stores proposed record in `pending_changes` table in `DRAFT_PENDING_APPROVAL` status, recording `maker_user_id`, timestamp, diff snapshot (Old JSON vs New JSON).
  - **Checker**: Authorized supervisory user (independent from Maker) reviews the visual diff and either `APPROVES` (atomically applied to production table) or `REJECTS` (with mandatory rejection reason).
- **Fine-Grained Role-Based Access Control (RBAC)**:
  - Subject -> Role -> Permission (`resource:action:scope`).
  - Roles defined:
    1. `SALES_REP`: Create quotes, view assigned customers, request discounts <= 3%.
    2. `SALES_MANAGER`: Approve quotes, request discounts <= 8%, view branch pipeline.
    3. `COMMERCIAL_VP`: Approve discounts <= 15% or floor price overrides.
    4. `CREDIT_CONTROLLER`: Review credit applications, log cheques, recommend limit changes (Maker).
    5. `CREDIT_MANAGER`: Approve credit limits <= 5M THB, approve soft-block release.
    6. `FINANCE_DIRECTOR`: Approve credit limits > 5M THB, approve hard-block emergency release.
    7. `STORE_DISPATCHER`: Fulfill ATP reservations, scan lot barcodes, print delivery slips.
    8. `TAX_ACCOUNTANT`: Review posted tax invoices, issue credit notes, export RD tax reports.
    9. `SYSTEM_ADMIN`: Platform operations, role assignments (subject to Maker-Checker).
- **Immutable Audit Logging**:
  - Write-only audit log table: `audit_event_logs`.
  - Captures: `event_id` (UUIDv7), `tenant_id`, `entity_type`, `entity_id`, `action` (INSERT, UPDATE, DELETE, STATE_TRANSITION), `actor_id`, `actor_role`, `client_ip`, `user_agent`, `correlation_id`, `pre_image` (JSONB), `post_image` (JSONB), `created_at` (UTC).
  - Row tampering prevention: Database trigger calculates SHA-256 HMAC of `(event_id || actor_id || entity_id || pre_image || post_image || prev_row_hash)` forming a cryptographically chained tamper-evident ledger. PostgreSQL table permissions revoke `UPDATE` and `DELETE` on this table from all application users.

### 4.2 Pricing Engine (E02)
- **Price Calculation Formula**:
  $$\text{Final Line Net} = (\text{Base Price}_{\text{Tier}} \times (1 - \text{Vol Discount \%}) - \text{Manual Discount Amount}) + \text{Freight Surcharge}_{\text{Zone}}$$
  $$\text{Line VAT} = \text{ROUND\_HALF\_UP}(\text{Final Line Net} \times \text{VAT Rate}, 2)$$
  $$\text{Total Invoice Payable} = \sum \text{Final Line Net} + \sum \text{Line VAT}$$
- **Tiered Volume Breaks**:
  - Model supports Step-Pricing (each bracket priced separately) and Whole-Order Volume Pricing (entire quantity gets the reached bracket price). Configurable per category.
  - Bracket Definition: Min Qty, Max Qty, Discount Type (Percentage or Fixed THB per Unit).
- **Zone Freight Surcharge**:
  - Distance & accessibility matrix mapped by Thai Sub-district (Tambon) / District (Amphur) / Postal Code.
  - Vehicle Type Surcharges: 4-wheel pick-up (max 1.5 tons), 6-wheel medium truck (max 5 tons), 10-wheel heavy truck (max 15 tons), 22-wheel trailer (max 32 tons).
  - Island / High-Altitude Remote Surcharge (e.g. Koh Samui, Phuket, Chiang Rai mountain sites): Flat ferry/mountain fee added to standard distance rate.
  - Free Delivery Threshold: B2B wholesale orders exceeding specified Net Amount (e.g. >= 50,000 THB) within Zone 1 (Bangkok & Vicinity) qualify for automated freight waiver.
- **Floor Price Control & Minimum Margin**:
  - Each SKU has a strictly enforced `floor_price` calculated as `Moving Average Cost (MAC) * (1 + Min Margin %)`.
  - If calculated price after volume and manual discounts drops below `floor_price`, the system intercepts the quotation.
  - Cannot be checked out without Level 3 DOFA approval (Commercial VP / Managing Director).
- **Delegation of Financial Authority (DOFA) Matrix**:
  | Role | Max Discretionary Discount | Floor Price Override Allowed? |
  |------|---------------------------|-------------------------------|
  | Sales Representative | 3.00% | No |
  | Area Sales Supervisor | 5.00% | No |
  | Regional Sales Manager | 8.00% | No |
  | Commercial Director / VP | 15.00% | Yes (with documented justification) |
  | CEO / Executive Committee | > 15.00% | Yes |
- **Effective-Dated VAT Rates**:
  - VAT rates stored with temporal validity: `valid_from` (inclusive) to `valid_to` (exclusive).
  - Default rate: 7.0000% (Kingdom of Thailand Royal Decree).
  - Calculation engine queries the VAT rate matching the `tax_point_date` (not order submission date).
  - Zero-rated items (exports) and tax-exempt items (fertilizer, cement raw limestone, agricultural produce) dynamically resolved via SKU tax category flags.

### 4.3 Credit & Cheque Control Engine (E03)
- **Real-Time Credit Exposure Formula**:
  $$\text{Total Exposure} = \text{AR}_{\text{Unpaid Invoices}} + \text{Orders}_{\text{Committed / In Fulfillment}} + \text{Cart}_{\text{Current Checkout}} + \text{PDC}_{\text{Uncleared}} - \text{Credit Notes}_{\text{Unapplied}}$$
- **Credit Blocking Mechanics**:
  - **Soft Block**:
    - Triggered when `Total Exposure > 90% of Approved Credit Limit` OR any invoice is 1–15 days past due.
    - System warns user, disallows auto-confirmation, but allows Credit Controller to approve release with 1 click.
  - **Hard Block**:
    - Triggered when `Total Exposure > 100% of Approved Credit Limit` OR any invoice is > 30 days past due OR customer has >= 1 bounced cheque in the last 90 days.
    - System strictly blocks order submission, warehouse picking, and dispatch. Order enters `CREDIT_HOLD` status.
- **Cheque Register & Lifecycle**:
  - Cheque Attributes: Bank Code (3 digits e.g. 002 BBL, 004 KBANK, 014 SCB), Branch Code, Cheque Number (8 digits), Due Date (Post-Dated Cheque - PDC), Amount, Drawer Account Name, Front/Back Scan URI.
  - State Machine:
    1. `RECEIVED`: Cheque physically in possession of sales rep/store cashier.
    2. `IN_VAULT`: Stored in Central / Branch safe custody.
    3. `DEPOSITED`: Sent to clearing bank on or after maturity date.
    4. `UNDER_CLEARING`: In BOT ICAS (Interbank Cheque Clearing System).
    5. `HONORED`: Funds cleared into Thai Watsadu bank account. AR settled.
    6. `BOUNCED`: Cheque dishonored by drawee bank (insufficient funds, signature mismatch, account closed).
- **Bounced Cheque Emergency Protocol**:
  1. Instant notification dispatched to Credit Risk Team, CFO, and Assigned Sales Rep.
  2. Customer status automatically set to `CREDIT_FROZEN` and `TERMS_REVOKED`.
  3. All pending delivery dispatches halted immediately across all stores.
  4. Legal notice countdown timer initiated (Thai Cheque Offence Act B.E. 2534: notice within 3 months of dishonor).
- **Exception Release Multi-Signature Workflow**:
  - Emergency release of a blocked order requires dual digital signatures: Credit Manager AND Finance Director.
  - Prerequisite: Signed Collateral Pledge, Bank Guarantee confirmation, or Promissory Note.
  - System generates a cryptographically signed one-time `CreditReleaseToken` valid for exactly 24 hours and bound strictly to the specific Order ID.

### 4.4 Inventory Management (FEFO & ATP) (E07/E04)
- **FEFO (First Expired, First Out) for Perishables**:
  - Perishable products: Bagged Portland cement (degrades from humidity/air exposure, shelf-life 60–90 days), chemical grouts, tile adhesives, paints, silicones/sealants.
  - Each inventory lot tracked with `lot_number`, `manufacturing_date`, and `expiry_date`.
  - Allocation Algorithm:
    - Filters candidate lots where `expiry_date - CURRENT_DATE >= minimum_acceptable_customer_shelf_life`.
    - Sorts ascending by `expiry_date`.
    - Optimizes for Pallet Preservation: Favors full intact pallets from the earliest expiring lot, splitting only 1 partial pallet to satisfy odd quantities.
- **Available-to-Promise (ATP) Multi-Store Formulation**:
  $$\text{ATP}_{\text{Branch}} = \text{On-Hand} - \text{Hard-Committed} - \text{Soft-Reserved} - \text{Safety Stock} - \text{Damaged/Hold} + \text{Inbound Confirmed PO}_{\le 24\text{h}}$$
- **Branch Stock Contention & Concurrency Resolution**:
  - High contention scenario: Multiple sales reps quoting large contractor orders simultaneously against limited regional store stock (e.g. 5,000 bags of cement at Bang Bua Thong branch).
  - Concurrency Mechanism:
    1. **Distributed Reservation Lock**: Redis key `lock:stock:reservation:{branch_id}:{sku_code}` acquired with 2,000ms timeout using Redlock.
    2. **Database Version Check**: `SELECT available_qty, version FROM branch_stock WHERE branch_id = :b AND sku_code = :sku FOR UPDATE`.
    3. If requested quantity <= `available_qty`, reserve and record `soft_reservation` record with timestamp and 30-minute expiration.
    4. Background Cron Worker runs every 60 seconds: identifies expired soft reservations, atomically restores stock, and emits `stock.reservation.expired` event.

### 4.5 Billing & Revenue-Department-Compliant Tax Invoicing (E10)
- **Thai Revenue Code Legal Compliance**:
  - Mandated by Sections 86/4, 86/5, 86/9, and 86/10 of the Thai Revenue Code (ประมวลรัษฎากร) and Director-General Notifications on VAT.
  - **Required Document Inscription**:
    - Clearly display "ใบเสร็จรับเงิน/ใบกำกับภาษี" (Receipt/Tax Invoice) or "ใบส่งของ/ใบกำกับภาษี" (Delivery Order/Tax Invoice).
    - Seller Header: Thai Watsadu Co., Ltd. (บริษัท ซีอาร์ซี ไทวัสดุ จำกัด), 13-digit Tax ID `0105553043125`, Head Office (`00000`) or Branch Code (`000XX`), Registered Address.
    - Buyer Header: Full Registered Corporate Name, 13-digit Tax ID, Head Office ("สำนักงานใหญ่") or Branch Number ("สาขาที่ XXXXX"), Registered Tax Address.
    - Sequential Running Number: Structured format `INV-{BranchCode}-{FiscalYearBuddhist}-{Month}-{Running6Digits}` (e.g. `INV-00012-2569-09-000142`). No gaps allowed by law.
    - Document Date: Must reflect the true Tax Point Date (วันจุดความรับผิดในการเสียภาษีมูลค่าเพิ่ม): Delivery Date for goods, or Payment Date for services/advance deposits.
- **Immutable State Machine After Posting**:
  ```
  [ DRAFT ] ---> [ PENDING_POSTING ] ---> [ POSTED (IMMUTABLE) ]
                                                   |
                                     +-------------+-------------+
                                     |                           |
                                     v                           v
                           [ ISSUED_CREDIT_NOTE ]      [ FORMAL_CANCELLATION ]
  ```
  - Once status = `POSTED`, database trigger `trg_prevent_tax_invoice_mutation` prevents any `UPDATE` or `DELETE` statement.
  - Attempted mutations raise SQL Exception `ERR-RD-TAX-001: Posted Tax Invoices are legally immutable per Thai Revenue Code`.
- **Credit Note (CN - ใบลดหนี้) Specification**:
  - Mandated under Section 86/10 of the Thai Revenue Code.
  - Permitted legal reason codes:
    1. `CN_REASON_RETURN`: Customer returned defective or non-conforming goods.
    2. `CN_REASON_PRICE_ADJUST`: Price reduction agreed post-sale due to damaged goods.
    3. `CN_REASON_DISCOUNT`: Post-invoice trade discount / rebate granted under commercial terms.
    4. `CN_REASON_CALC_ERROR`: Calculation error discovered on original invoice.
  - Mandatory References on Credit Note:
    - Original Tax Invoice Number & Date.
    - Original Invoice Total Amount.
    - Corrected Total Amount.
    - Difference Amount (มูลค่าที่ลดลง).
    - Output VAT Reduction (7%).
    - Thai Baht Text string of the difference amount.
- **Electronic Tax Invoice (e-Tax Invoice by Email / XML per ETDA standard)**:
  - Document formatted in UN/CEFACT XML standard (TIS 1102-2559 / ETDA Standard on e-Tax Invoice).
  - Embedded in PDF/A-3 container with digital signature using Thai Watsadu PKI Certificate (PKCS#7 / PAdES-LTV).
  - Automatic submission to Revenue Department e-Tax Service Provider gateway within the legal window (by the 15th of the following calendar month).

---

## 5. Security Policies & Non-Functional Requirements (NFRs)

### 5.1 OWASP Top 10 Mitigation Matrix

| OWASP Vulnerability | Thai Watsadu WDS Risk | Applied Architectural Mitigation |
|---------------------|-----------------------|----------------------------------|
| **A01: Broken Access Control** | Unauthorized discount approval, cross-branch order hijacking, viewing competitor contractor pricing | Attribute-Based Access Control (ABAC) enforced at API Gateway and domain boundaries; verifies User Role, Branch ID, Customer Assignment, and DOFA Limit on every request. |
| **A02: Cryptographic Failures** | Interception of pricing matrices, customer financial limits, or cheque scans | TLS 1.3 in transit with HSTS; AES-256-GCM Transparent Data Encryption (TDE) at rest; KMS automated key rotation; sensitive scan images stored encrypted in private S3 buckets. |
| **A03: Injection** | SQL injection in product search or credit reporting | Strict ORM / Parameterized query enforcement; no raw string concatenation; GraphQL/REST input validation using JSON Schema and Zod; PostgreSQL input sanitization. |
| **A04: Insecure Design** | Circumvention of credit limits by splitting carts | Centralized atomic credit reservation transaction; idempotency keys (`Idempotency-Key` header) required on all financial order submissions. |
| **A05: Security Misconfiguration** | Exposure of debug endpoints or internal error stack traces | Hardened minimal distroless Docker containers; production profiles strip stack traces; strict CSP headers and CORS whitelisting of approved Thai Watsadu subdomains. |
| **A06: Vulnerable Components** | Outdated NPM/Go/Java libraries in microservices | Continuous Software Composition Analysis (SCA) with Snyk/Trivy in CI/CD pipeline; blocking builds on CVSS >= 7.0; automated daily Dependabot scans. |
| **A07: Identification & Auth** | Credential stuffing on sales rep logins | Enterprise OIDC integration with Corporate Azure AD / Okta; mandatory Multi-Factor Authentication (MFA) for credit override and discount authority actions; JWT TTL = 15 mins. |
| **A08: Software & Data Integrity** | Tampering with Merchandising feed (I0a) or price master files | Cryptographic HMAC-SHA256 signature verification on batch feeds; CI/CD pipeline artifact signing with Sigstore/Cosign. |
| **A09: Logging & Monitoring** | Undetected financial or credit override anomalies | Centralized SIEM ingestion; immutable append-only audit trail; real-time anomaly detection alerts on consecutive high discounts or off-hours credit releases. |
| **A10: Server-Side Request Forgery** | Webhook manipulation in CRM (I0c) or ERP integration | Strict egress firewall; dedicated outbound proxy for external webhooks with strict IP/domain allowlists; prohibition of internal metadata/loopback IPs. |

### 5.2 Masked Synthetic Data in Non-Production Environments
- **PII Protection Mandate**: Thai Personal Data Protection Act (PDPA B.E. 2562) compliance. Production customer data, financial balances, and personal information must NEVER be exported directly to Development, Testing, or UAT environments.
- **Automated Masking Pipeline**:
  - Runs as an automated ETL sanitation job when refreshing Staging DB from Production snapshot:
  - **Thai Citizen ID (13 digits)**: Replaced with synthetic 13-digit numbers possessing valid Modulo 11 check digits using an internal algorithm, preventing false-positive test validation errors.
  - **Thai Corporate Tax ID**: Seeded with dummy format `099555XXXXXXX`.
  - **Company Names**: Replaced with synthetic Thai contractor names from a dictionary (e.g. "บริษัท ตัวอย่างงานช่าง จำกัด", "หจก. ก้าวหน้ารุ่งเรืองการช่าง").
  - **Contact Names**: Anonymized using realistic Thai mock first/last names.
  - **Phone Numbers**: Converted to dummy format `089-999-XXXX`.
  - **Addresses**: Sanitized to generic Thai provincial addresses while preserving valid Tambon/Amphur/Province combinations to avoid breaking the Freight Zone Engine.
  - **Financial Balances & Cheques**: Randomized within realistic variance brackets (+/- 20% of median) with dummy bank account and cheque numbers.

### 5.3 Thai Collation and Alphabetical Sorting Rules
- **Linguistic Rules**:
  - Thai alphabetical order per the Royal Institute Dictionary:
    - Consonants: ก ข ฃ ค ฅ ฆ ง จ ฉ ช ซ ฌ ญ ฎ ฏ ฐ ฑ ฒ ณ ด ต ถ ท ธ น บ ป ผ ฝ พ ฟ ภ ม ย ร ฤ ฤๅ ล ฦ ฦๅ ว ศ ษ ส ห ฬ อ ฮ.
    - Vowels: ะ ั า ำ ิ ี ึ ื ุ ู เ แ โ ใ ไ.
    - Tone marks and diacritics ( ่  ้  ๊  ๋  ็  ์  ๎ ) do not dictate primary sort order; they act as secondary/tertiary weights.
  - **Leading Vowel Reordering**: Pre-posed vowels (เ, แ, โ, ใ, ไ) are written before the initial consonant but pronounced after it. In standard Thai alphabetical collation, words starting with leading vowels must sort under their consonant (e.g., "เกษม" must be sorted under "ก", AFTER "กวาด" and BEFORE "ขจร", not before "ก").
- **Database & Application Implementation**:
  - PostgreSQL Database Collation: `COLLATE "th-TH-x-icu"` configured on all text columns involving Thai product names, customer legal names, and categories.
  - Application Sorting: ICU4J / Node.js `Intl.Collator('th-TH', { sensitivity: 'accent', numeric: true })`.

### 5.4 UTC Storage and Asia/Bangkok Presentation Timezone
- **Temporal Standard**:
  - **Storage**: All database temporal fields strictly defined as `TIMESTAMPTZ` (Timestamp with Time Zone) and persisted in UTC (`+00:00`).
  - **Application Runtime**: Server system clock and JVM/Node runtimes set to `TZ=UTC`.
  - **API Wire Format**: ISO-8601 extended format with explicit UTC designator `Z` (e.g., `2026-09-09T03:19:32.124Z`).
  - **Presentation Layer**: Client apps (SPA, Mobile) convert UTC timestamps to `Asia/Bangkok` (UTC+07:00) for display, formatted according to Thai locale conventions (e.g. `วว/ดด/ปปปป ฮฮ:นน:วว`).
  - **Fiscal Day Boundary Rule**:
    - The Thai business day ends at 23:59:59 Asia/Bangkok, which corresponds to 16:59:59 UTC.
    - Daily sales registers, VAT sales reports (รายงานภาษีขาย ภ.พ.30), and daily journal vouchers must be grouped using:
      `WHERE created_at >= '2026-09-08 17:00:00+00' AND created_at <= '2026-09-09 16:59:59.999999+00'`.
  - **Buddhist Calendar Representation**: User-facing reports and tax invoices display the Buddhist Era year ($BE = CE + 543$, e.g., $2026 + 543 = 2569$). The underlying database always stores standard Gregorian dates.

### 5.5 Strict Decimal Precision Rules (Absolute Float Prohibition)
- **Zero Floating-Point Tolerance**: The use of IEEE 754 floating-point primitives (`float`, `double`, `Float32Array`, `Float64Array`) is **strictly prohibited** in any calculation involving currency, pricing, discounts, freight fees, tax amounts, credit limits, or inventory quantities.
- **Database Type Specifications**:
  | Domain Field | PostgreSQL Data Type | Precision / Scale | Example / Range |
  |--------------|----------------------|-------------------|-----------------|
  | Unit Prices (Base & Cost) | `NUMERIC(18, 4)` | 18 digits, 4 decimals | `1,250.5000 THB` |
  | Extended Line Amounts | `NUMERIC(18, 4)` | 18 digits, 4 decimals | `125,050.0000 THB` |
  | Final Invoice Totals & VAT | `NUMERIC(18, 2)` | 18 digits, 2 decimals | `133,803.50 THB` |
  | Tax / Discount Percentages | `NUMERIC(8, 4)` | 8 digits, 4 decimals | `7.0000%`, `3.2500%` |
  | SKU Quantities (Discrete) | `NUMERIC(14, 4)` | 14 digits, 4 decimals | `40.0000 Bags`, `1.0000 Pallet` |
  | SKU Quantities (Bulk/Weight)| `NUMERIC(14, 4)` | 14 digits, 4 decimals | `24.7500 Tons`, `12.3500 Meters` |
  | Currency Conversion Rates | `NUMERIC(12, 6)` | 12 digits, 6 decimals | `35.452300 THB/USD` |
- **Language-Level Precision Binding**:
  - Backend (Go): `github.com/shopspring/decimal` with fixed precision operations.
  - Backend (Java/Kotlin): `java.math.BigDecimal` using `RoundingMode.HALF_UP`.
  - Backend (Node.js/TypeScript): `decimal.js` or `bignumber.js`.
- **Rounding Specification**:
  - Line-level rounding: Compute intermediate calculations at 4 decimal places; apply `ROUND_HALF_UP` to 2 decimal places when computing Line Taxable Amount and Line VAT.
  - Total document reconciliation: Sum of rounded line VATs must reconcile with total invoice taxable base $\times 7\%$, with penny-adjustment applied to the highest line item if rounding variance occurs (per Revenue Department audit guidelines).

---

## 6. Comprehensive Features Discovered Table

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | Architecture | C4 System Context Model | High-level topology mapping 6 actor personas to WDS and 5 external enterprise platforms. | User credentials, role context, enterprise endpoints. | Context boundary diagrams, integration paths. | Connection refused, unauthorized actor. | ORIGINAL_REQUEST.md §R2 |
| 2 | Architecture | C4 Container Architecture | Container definition of Web SPA, Mobile App, API Gateway, 6 Core Services, DB, Redis, Kafka. | HTTP/WSS requests, API payloads, streaming events. | Rendered UI, serialized API responses, event logs. | 502 Bad Gateway, 504 Gateway Timeout. | ORIGINAL_REQUEST.md §R2 |
| 3 | Architecture | C4 Subsystem Components | Internal decomposition of Pricing, Inventory ATP, Credit Check, and Tax Invoicing modules. | Domain method calls, entity repositories, event buses. | Domain calculation models, reservation tokens. | Domain validation exceptions, optimistic lock errors. | ORIGINAL_REQUEST.md §R2 |
| 4 | Integration | I0a Merchandising Item Feed Sync | Daily full batch (100k items) and real-time delta catalog ingestion with taxonomy and UOM. | SFTP batch files (gzip), Kafka stream `erp.merchandising.item-updates`. | Upserted `catalog_items`, updated UOM matrices. | Invalid schema, missing tax code -> `item_feed_errors`. | ORIGINAL_REQUEST.md §R2(I0a) |
| 5 | Integration | I0a Item Checksum Hashing | Change-detection engine computing SHA-256 over normalized attributes to bypass redundant writes. | Raw SKU attributes, existing DB checksum. | Boolean `is_modified`, updated hash value. | Hash calculation failure -> log & force refresh. | R2 Architecture Deep-Dive |
| 6 | Integration | I0b Multi-Store Real-Time ATP Query | Sub-second inventory query aggregating On-Hand, Committed, and Inbound across 80+ branches. | SKU code, Branch IDs, required quantity. | Aggregated ATP by store, fulfillment latency. | Store edge timeout -> fallback to cached snapshot. | ORIGINAL_REQUEST.md §R2(I0b) |
| 7 | Integration | I0b Two-Phase Stock Reservation | Distributed reservation locking with 30-minute soft TTL and hard order commitment. | Branch ID, SKU, quantity, reservation token. | Soft reservation confirmation, expiry timestamp. | Stock insufficient (`409 Conflict`), Redlock failure. | ORIGINAL_REQUEST.md §R2(I0b) |
| 8 | Integration | I0c CRM Customer Master Sync | Inbound sync of customer profile, 13-digit Tax ID, Head Office/Branch code, and wholesale tiers. | CRM Webhook / REST payload with customer metadata. | Upserted `customer_master`, pricing tier mapping. | Invalid Thai Tax ID modulo 11 -> `422 Unprocessable`. | ORIGINAL_REQUEST.md §R2(I0c) |
| 9 | Integration | I0d Store POS Cashier Settlement | Direct store collection integration, split tender (Cash/Card/PromptPay), and cashier notification. | Store Branch ID, Order ID, tender amounts. | POS receipt number, settlement confirmation event. | Payment declined, amount mismatch -> abort release. | ORIGINAL_REQUEST.md §R2(I0d) |
| 10 | Integration | I0e GL/Finance AR Sub-Ledger Sync | Real-time double-entry journal posting of revenue, AR, and Output VAT to ERP GL. | Posted invoice details, account codes, tax point. | GL Journal Voucher reference, posting timestamp. | Unbalanced debit/credit -> outbox dead-letter alert. | ORIGINAL_REQUEST.md §R2(I0e) |
| 11 | Integration | I0e Nightly Financial Reconciliation | Batch verification comparing daily WDS tax/invoice register against ERP GL balances at 23:59:59. | Daily ledger entries, ERP batch summary. | Reconciliation report, delta variance list. | Discrepancy > 0.00 THB -> trigger P1 finance alert. | R2 Financial Architecture |
| 12 | Master Data | Maker-Checker Approval Workflow | Dual-control protocol for sensitive changes (price lists, credit limits, customer tier, matrix). | Maker change proposal, Checker approve/reject action. | Entity state update, approval audit record. | Self-approval prohibited (`403 Forbidden`). | ORIGINAL_REQUEST.md §R2(E01) |
| 13 | Master Data | Granular Role-Based Access Control | Permission matrix matching 9 user roles to explicit `resource:action:scope` rules. | Bearer JWT, requested URI, HTTP verb, tenant ID. | Access granted (`200`) or denied (`403 Forbidden`). | Role permission missing -> immediate security log. | ORIGINAL_REQUEST.md §R2(E13) |
| 14 | Master Data | Immutable Chained Audit Trail | Tamper-evident ledger capturing pre/post image snapshots with SHA-256 HMAC chaining. | Entity mutation event, actor metadata, client IP. | Persisted audit record with verification hash. | Tamper detected on verification -> security breach flag. | ORIGINAL_REQUEST.md §R2(E01) |
| 15 | Pricing | Tiered Wholesale Base Pricing | Resolves base SKU price according to customer's tier (Contractor, Project, Govt, General). | SKU Code, Customer Tier ID. | Tiered Base Unit Price (`NUMERIC(18, 4)`). | Tier not configured -> fallback to Default Tier. | ORIGINAL_REQUEST.md §R2(E02) |
| 16 | Pricing | Stepped & All-Units Volume Breaks | Volume-based tiered discounting supporting step brackets or whole-order reached discount. | Line Quantity, SKU Volume Rule. | Total volume discount deduction. | Quantity zero or negative -> validation error. | ORIGINAL_REQUEST.md §R2(E02) |
| 17 | Pricing | Zone Freight Surcharge Engine | Geographic logistics fee calculation based on Postal Code, Truck Category, and Remote Surcharges. | Delivery Postal Code, Total Weight, Truck Type. | Freight surcharge amount (`NUMERIC(18, 4)`). | Postal code outside service zone -> manual freight flag. | ORIGINAL_REQUEST.md §R2(E02) |
| 18 | Pricing | Floor Price & Margin Guard | Intercepts quote if net unit price falls below Moving Average Cost $\times$ (1 + Min Margin). | Calculated Net Price, SKU Floor Price. | Approval requirement flag (`REQUIRES_VP_APPROVAL`). | Order blocked if submitted without floor override. | ORIGINAL_REQUEST.md §R2(E02) |
| 19 | Pricing | Delegation of Financial Authority | Validates user manual discount percentage against authorized role cap (3%, 5%, 8%, 15%). | User Role, Requested Discount %. | Validation pass or escalation requirement. | Exceeds user authority -> escalation workflow initiated. | ORIGINAL_REQUEST.md §R2(E02) |
| 20 | Pricing | Effective-Dated VAT Resolution | Resolves applicable Output VAT rate (default 7.0000%) based on transaction tax-point date. | Tax Point Date, SKU Tax Category. | Effective VAT rate (`NUMERIC(8, 4)`), Tax Exemption flag. | Date out of range -> fatal tax configuration error. | ORIGINAL_REQUEST.md §R2(E02) |
| 21 | Credit Control | Dynamic Exposure Calculation | Computes real-time exposure: Unpaid AR + Committed Orders + In-flight Cart + Uncleared PDC. | Customer ID, pending orders, PDC register. | Total Exposure Amount (`NUMERIC(18, 2)`), Margin. | Customer not found -> `404 Not Found`. | ORIGINAL_REQUEST.md §R2(E03) |
| 22 | Credit Control | Automated Hard/Soft Credit Blocking | Triggers soft block (>90% limit / 1-15d overdue) or hard block (>100% limit / >30d overdue). | Total Exposure, Approved Limit, Overdue Invoices. | Account Status (`ACTIVE`, `SOFT_BLOCKED`, `HARD_BLOCKED`). | Hard blocked account -> order rejected at submission. | ORIGINAL_REQUEST.md §R2(E03) |
| 23 | Credit Control | Cheque Register & Lifecycle Tracker | Full status lifecycle management of Post-Dated Cheques from Receipt to Clearing or Bounce. | Cheque details, maturity date, drawer bank. | Lifecycle status (`RECEIVED` ... `HONORED`/`BOUNCED`). | Invalid Thai bank code -> rejected cheque entry. | ORIGINAL_REQUEST.md §R2(E03) |
| 24 | Credit Control | Bounced Cheque Account Freeze | Immediate automated lockdown of credit terms, halting of dispatches, and transition to CBD. | Bounced cheque notification event from bank. | Account status `CREDIT_FROZEN`, dispatches revoked. | Failure to freeze -> critical audit notification. | ORIGINAL_REQUEST.md §R2(E03) |
| 25 | Credit Control | Multi-Sig Exception Release Workflow | Dual-authorization override (Credit Manager + Finance Director) generating 24-hr release tokens. | Order ID, Risk justification, collateral proof. | Signed 24-hour `CreditReleaseToken`. | Single-signature attempt -> rejected release request. | ORIGINAL_REQUEST.md §R2(E03) |
| 26 | Inventory | FEFO Perishable Lot Allocation | Prioritizes earliest expiring lots for cement/chemicals while preserving full intact pallets. | SKU Code, Required Qty, Store Branch ID. | List of allocated `(lot_number, allocated_qty)`. | Expiry date < minimum threshold -> lot skipped. | ORIGINAL_REQUEST.md §R2(E07) |
| 27 | Inventory | Multi-Store ATP Aggregation | Computes available-to-promise across single branch, regional cluster, and central CDC. | SKU Code, Customer Location, Delivery Preference. | Optimal fulfillment plan (Store Pickup vs Delivery). | No store has sufficient stock -> backorder option. | ORIGINAL_REQUEST.md §R2(E04) |
| 28 | Inventory | Optimistic Lock Stock Contention | Uses Redis distributed locks and DB version checks to prevent overselling on parallel orders. | Branch ID, SKU Code, Reservation Qty. | Stock decremented, reservation record persisted. | Version mismatch / lock timeout -> retry or `409`. | ORIGINAL_REQUEST.md §R2(E04) |
| 29 | Inventory | Soft Reservation Auto-Expiry Worker | Background cron worker scanning and reclaiming expired soft reservations every 60 seconds. | Soft reservation table, current UTC timestamp. | Restored ATP quantities, updated reservation status. | Worker failure -> dead-man alert to DevOps. | R2 Architecture Deep-Dive |
| 30 | Tax Invoicing | Revenue Dept Mandatory Data Header | Generates compliant Tax Invoice header with Seller/Buyer 13-digit Tax ID, Branch, and Address. | Customer Tax Data, Branch Tax Data, Order Details. | RD-compliant document header structure. | Missing 13-digit Tax ID -> document generation blocked. | ORIGINAL_REQUEST.md §R2(E10) |
| 31 | Tax Invoicing | Strictly Sequential Invoice Numbering | Unbroken sequential number generator partitioned by Branch, Buddhist Year, and Month. | Branch Code, Issue Date (Asia/Bangkok). | Formatted Invoice Number (e.g. `INV-00012-2569-09-000142`). | Gap or duplicate sequence detected -> transaction rollback. | ORIGINAL_REQUEST.md §R2(E10) |
| 32 | Tax Invoicing | Immutable Document Post Trigger | Enforces write-once legal status preventing any UPDATE or DELETE after posting. | SQL statement on `tax_invoices` where status = `POSTED`. | Execution blocked with SQL Exception. | Attempted mutation logged to security incident log. | ORIGINAL_REQUEST.md §R2(E10) |
| 33 | Tax Invoicing | Credit Note (CN) Generator | Generates RD-compliant Credit Notes referencing original invoice with legal reason codes. | Original Invoice ID, Return Qty / Price Delta, Reason. | Formatted Credit Note with VAT reduction. | Reason code invalid -> rejection of CN request. | ORIGINAL_REQUEST.md §R2(E10) |
| 34 | Tax Invoicing | Electronic Tax Invoice (e-Tax XML/PDF) | Compiles ETDA-compliant UN/CEFACT XML and embeds in digital-signed PDF/A-3 (PAdES). | Posted Tax Invoice entity, Private PKI Key. | Signed PDF/A-3 binary, submitted e-Tax XML. | Digital signature failure -> fallback to physical queue. | ORIGINAL_REQUEST.md §R2(E10) |
| 35 | Security | OWASP Top 10 Defense Engine | Enforces ABAC, TLS 1.3, parameterized queries, rate limits, and secure headers. | All inbound network traffic and API calls. | Sanitized request execution or blocked response. | Security violation -> blocked with `403`/`400` + alert. | ORIGINAL_REQUEST.md §R2(NFR) |
| 36 | Security | Masked Synthetic Data Pipeline | Sanitizes production PII (Thai IDs, names, phones, financial records) for non-prod environments. | Production database dump snapshot. | Sanitized synthetic database with preserved relations. | Unmasked PII detected in test DB -> gate failure. | ORIGINAL_REQUEST.md §R2(NFR) |
| 37 | NFR | Royal Institute Thai Collation | Implements `th-TH-x-icu` collation ensuring pre-posed vowels (เ, แ, โ, ใ, ไ) sort under consonant. | Thai strings (Product names, Customer names). | Correctly sorted result sets per Thai standard. | Incorrect ASCII sort order avoided. | ORIGINAL_REQUEST.md §R2(NFR) |
| 38 | NFR | UTC Storage & Asia/Bangkok Presentation | Stores all timestamps in UTC `TIMESTAMPTZ` and renders in `Asia/Bangkok` (UTC+7). | Inbound UTC timestamps, UI presentation requests. | Standardized UTC storage, localized display string. | Localized time written without offset -> rejected. | ORIGINAL_REQUEST.md §R2(NFR) |
| 39 | NFR | Strict Decimal Precision Engine | Eliminates IEEE 754 floats; mandates `NUMERIC(18,4)` for money and `NUMERIC(14,4)` for stock. | Financial calculations, currency rounding. | Exact arbitrary-precision decimals. | Float data type detected in schema -> CI gate fail. | ORIGINAL_REQUEST.md §R2(NFR) |
| 40 | NFR | Banker's Rounding Reconciliation | Line-level `ROUND_HALF_UP` with document-level reconciliation against total taxable base $\times 7\%$. | Line tax amounts, document grand total. | Reconciled total VAT matching RD audit tolerance. | Rounding discrepancy > 0.01 THB -> penny adjust rule. | R2 Financial Architecture |

---

## 7. Edge Cases & Resilience Matrix

| # | Feature | Input / Boundary Condition | Observed / Mandated System Behavior |
|---|---------|----------------------------|-------------------------------------|
| 1 | I0a Merchandising Sync | SFTP stream contains 100k items, but 12 items have malformed UOM ratios (e.g. `null` or 0 bags/pallet). | Staging ingestion isolates the 12 malformed items into `merchandising_feed_errors` with error code `ERR-UOM-INVALID`; remaining 99,988 valid items are successfully upserted into production catalog. Alert sent to Merchandising Operations. |
| 2 | I0a Item Checksum | Merchandising ERP re-sends all 100k items nightly, but only 450 items have modified prices or descriptions. | SHA-256 hash comparison matches 99,550 items; system performs zero DB updates on unchanged records, completing the sync within 14 seconds instead of 12 minutes. |
| 3 | I0b Stock Contention | Two sales reps click "Confirm Order" at the exact same millisecond for 400 bags of cement, with only 500 bags available at Bangna branch. | Redis distributed lock serializes the requests. First transaction successfully reserves 400 bags (remaining: 100). Second transaction detects available (100) < requested (400), rejects with `409 Conflict: Insufficient Branch Stock`, and prompts for CDC drop-ship option. |
| 4 | I0b Reservation Expiry | A sales rep soft-reserves 1,000 bags of cement for a quote; contractor does not confirm payment within 30 minutes. | Scheduled background worker detects `soft_reservation` row where `expires_at < NOW() AND status = 'ACTIVE'`; marks reservation as `EXPIRED` and atomically returns 1,000 bags to `available_qty`. |
| 5 | I0c Customer Master | Inbound CRM customer sync has 13-digit Thai Tax ID `1234567890123` with invalid Modulo 11 checksum. | WDS validation engine rejects record with `422 Unprocessable Entity`; customer creation is halted, and validation error is routed to CRM Data Quality Queue. |
| 6 | I0c Head Office vs Branch | Contractor has 1 Head Office and 14 job-site branch tax entities (`00001` to `00014`), all sharing a single parent credit limit. | WDS establishes credit hierarchy: Credit Limit evaluated at Parent Legal Entity level, while Tax Invoices and Delivery Slips bind to the specific 5-digit Branch Code. |
| 7 | I0d POS Split Tender | Direct sales customer arrives at store to collect 150,000 THB order; pays 50,000 THB cash, 50,000 THB credit card, and 50,000 THB via QR PromptPay. | WDS POS adapter accepts multi-tender settlement payload; validates `Sum(Tenders) == Order_Total`; updates order to `PAID_SETTLED`, prints single unified Tax Invoice, and releases dispatch gate. |
| 8 | I0e GL Posting Failure | Network partition between WDS and SAP GL ERP during end-of-day invoice batch posting. | WDS Transactional Outbox pattern retains failed postings in `outbox_events` with exponential backoff retry (up to 5 attempts); local invoice records remain immutable; once network recovers, outbox worker drains queue without data loss. |
| 9 | Pricing Floor Price | Sales rep attempts to sell steel rebar at 18.50 THB/kg (Moving Average Cost is 19.20 THB/kg) by stacking volume discount and manual discount. | Pricing Engine halts submission; displays error `FLOOR_PRICE_BREACH: Selling price below minimum margin floor (19.20 THB)`. System routes quote to Commercial VP for mandatory electronic sign-off. |
| 10 | Pricing Freight Zone | Customer requests delivery to a remote island site (Koh Chang) requiring ferry transport with a 10-wheel truck. | Freight engine detects Island Zone code; applies standard mainland distance rate + Island Ferry Truck Surcharge (3,500 THB); warns dispatcher that 10-wheel vehicles require advance ferry booking. |
| 11 | Credit Hard Blocking | Contractor with 5,000,000 THB credit limit has 4,800,000 THB unpaid AR and 150,000 THB in unpresented cheques; attempts to submit new order for 100,000 THB. | Exposure calculation yields $4,800,000 + 150,000 + 100,000 = 5,050,000 \text{ THB} > 5,000,000 \text{ THB}$. System triggers Hard Block; order moves to `CREDIT_HOLD`. |
| 12 | Credit Bounced Cheque | Bank notifies Thai Watsadu at 11:30 that a 750,000 THB post-dated cheque for Customer XYZ bounced due to "Insufficient Funds". | Automated Bounced Cheque handler immediately updates customer status to `CREDIT_FROZEN`; active pick-lists at 3 branches are cancelled within 2 seconds; order dispatch locks engaged; notification sent to Legal and Finance Director. |
| 13 | Credit Release Expiry | Finance Director grants an emergency 24-hour credit release token for a delayed project; contractor does not submit order within 24 hours. | At $T+24\text{h}01\text{s}$, the cryptographic `CreditReleaseToken` expires; subsequent checkout attempt fails with `TOKEN_EXPIRED: Re-approval required by Finance Director`. |
| 14 | Inventory FEFO Picking | Warehouse has Lot A (100 bags, expires in 12 days) and Lot B (500 bags, expires in 75 days). Customer requires 150 bags. | Minimum customer shelf-life rule flags Lot A as unusable (must have >= 30 days remaining for construction delivery); FEFO engine bypasses Lot A and allocates 150 bags from Lot B; flags Lot A for store markdown/liquidation. |
| 15 | Tax Invoice Immutability | A developer or database administrator runs `UPDATE tax_invoices SET total_amount = 50000 WHERE id = 1204` directly via SQL client on a posted invoice. | PostgreSQL database trigger intercepts command and throws `ERR-RD-TAX-001: Posted Tax Invoices are legally immutable per Thai Revenue Code Section 86/4`; transaction is aborted and logged to Security Incident register. |
| 16 | Tax Credit Note Rounding | Original invoice had 3 items with fractional satangs. Credit Note is issued for 1 returned item. | Credit Note calculation isolates the exact line-item tax and taxable base from the original invoice lines, preventing cumulative rounding drift. Resulting CN VAT exactly matches the original line Output VAT. |
| 17 | Thai Alphabetical Collation | Product catalog search for cement products containing "เสาเข็ม", "แผ่นพื้น", and "กาวซีเมนต์". | Collation engine correctly sorts "กาวซีเมนต์" first (consonant ก), then "เสาเข็ม" (consonant ส with leading vowel เ), then "แผ่นพื้น" (consonant ผ with leading vowel แ). |
| 18 | Midnight UTC vs BKK Tax Point | Customer confirms and pays for order at 23:45 Asia/Bangkok on 2026-09-30 (which is 16:45 UTC on 2026-09-30). | System correctly records UTC timestamp `2026-09-30T16:45:00Z` but assigns the tax invoice sequence to September 2569 (`INV-XXXXX-2569-09-XXXXXX`) based on `Asia/Bangkok` timezone, ensuring it falls within September's ภ.พ.30 VAT return. |
| 19 | Floating Point Arithmetic Trap | Total calculation of 1,000 items priced at 0.10 THB + 0.20 THB. | Pure `NUMERIC(18,4)` math computes exact `300.0000 THB`. Floating-point binary representation artifact (`300.00000000000006`) is completely eliminated. |
| 20 | Non-Prod Masking Validation | QA team restores production backup to UAT database. | Automated masking pipeline executes immediately; transforms all 13-digit Thai Citizen IDs to valid synthetic check-digit numbers, replaces company names, and wipes phone numbers. Staging environment never exposes live PII. |

---

## 8. Architectural Risk Analysis & Mitigation Strategies

| Risk ID | Domain | Risk Description | Severity | Impact | Mitigation Strategy |
|---------|--------|------------------|----------|--------|---------------------|
| **ARC-R01** | Inventory | Store edge network outage leaves store branch disconnected from central ATP. | High | Store cannot verify central reservations; risk of local cashier double-selling stock. | Store edge runs localized offline buffer with safe allocation quota (max 20% of local stock without central ping). As soon as connection restores, local journal syncs back. |
| **ARC-R02** | Pricing | Malicious or rogue sales rep exploits discount matrix combination to sell below cost. | Critical | Significant gross margin erosion. | Hard database-level constraint and floor price check engine in isolated microservice; bypass is physically impossible without VP cryptographic signature. |
| **ARC-R03** | Credit | Delay in bank reporting bounced cheques leads to further dispatches under false terms. | High | Inability to recover goods; bad debt write-off. | Automated daily bank statement scraping via direct Open Banking API / Host-to-Host SFTP at 08:00, 11:30, and 14:30 Asia/Bangkok. |
| **ARC-R04** | Tax & Legal | Sequential tax invoice number gap caused by database transaction rollback. | Critical | Thai Revenue Department fine and revocation of electronic tax issuing license. | Number generator decoupled from entity creation: pre-allocation sequence table with transactional lock (`SELECT FOR UPDATE`), or sequence assigned only at final commit state. |
| **ARC-R05** | Performance | Heavy 100k Merchandising full sync locks catalog tables during peak morning sales hours. | Medium | API latency spikes on search and quoting during business hours. | Mandatory scheduling of full sync at 01:00 UTC (08:00 BKK is avoided; run at 02:00 BKK). Staging table pattern (`stg_items` -> `items` atomic table swap or partition swap). |

---

## 9. Conclusion & Next Steps

This specification establishes the authoritative architectural blueprint for R2: System Architecture & High-Level Design for the Thai Watsadu WDS platform. It satisfies all functional requirements across the 12 Epics, formalizes the contracts for enterprise interfaces I0a through I0e, details the exact business algorithms for core domains, and defines the non-negotiable security and NFR standards.

**Immediate Handover to Implementation & Review Teams**:
1. Sr. Dev team (`explorer_dev_p0_3`) to build DDL schemas, OpenAPI specs, and test suites adhering to the decimal precision, UTC timestamp, and collation rules defined herein.
2. PM team (`spec_miner_pm_p0_1`) to align Sprint Breakdown (S0–S12) and Drop List milestones against these architectural components.
3. Sentinel / Forensic Auditor to enforce zero floating-point arithmetic and strict maker-checker compliance.
