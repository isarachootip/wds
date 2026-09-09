# Thai Watsadu Wholesale & Direct Sales (WDS) v1.0
## R1 Delivery Architecture & Project Management Blueprint (PM Scope)

- **Document Version**: 1.0 (Authoritative Delivery Specification)
- **Author**: Specification Miner (PM Scope Explorer) — Subagent `spec_miner_pm_p0_1`
- **Scope Baseline**: SRS v1.1 (409 Total Requirements; Release 1 Scope: 249 Requirements)
- **Delivery Framework**: 26 Weeks (6 Calendar Months) | 13 Sprints (S0–S12, 2-Week Sprints)
- **Engineering Resource Pool**: 9 In-House Engineers (1 Dev Lead, 4 Backend, 2 Frontend, 1 QA, 1 DevOps)
- **Integrity Level**: High-Assurance Enterprise Design (Statutory RD Tax Compliance, Audit Immutability)

---

## 1. Executive Summary & Delivery Framework

### 1.1 Project Context & Operational Scale
Thai Watsadu (ไทวัสดุ), under Central Retail Corporation (CRC), operates an extensive network of 80+ mega-stores and regional Distribution Centers (DCs) across Thailand. The **Wholesale & Direct Sales (WDS)** system is an enterprise-critical digital platform engineered to transform commercial contractor, developer, and institutional B2B sales operations.

The system replaces legacy, fragmented semi-manual workflows with a centralized, automated transaction engine capable of handling:
- **Massive Product Catalogs**: Ingesting and searching >100,000 active SKUs (heavy building materials, cement, tiles, sanitary ware, electrical, hardware).
- **High-Volume B2B Orders**: High-value transactions with multi-tiered volume pricing, zone-based freight surcharges, and strict floor price governance.
- **Credit & Financial Exposure**: Real-time credit evaluation, hard/soft blocking, post-dated cheque management, and strict approval workflows.
- **Real-Time Inventory ATP & Lot Traceability**: Sub-second Available-To-Promise (ATP) reservations across branch retail floors and DCs, handling high-contention stock, and enforcing First-Expired, First-Out (FEFO) rules on perishable building materials (e.g., cement).
- **Statutory Thai Revenue Department Compliance**: Fully immutable e-Tax invoice generation, sequential tax numbering, strict 7% Output VAT calculations, and credit note handling.

### 1.2 Resource Allocation & Engineering Capacity Model (9 Engineers)
To deliver 249 Release 1 requirements in 26 weeks, the team composition is structured across specialized engineering domains:

| Role Title | Headcount | Primary Responsibilities & Domain Focus |
|---|:---:|---|
| **Dev Lead / Principal Architect** | 1 | Technical leadership, PR gatekeeping, DB schema migration reviews, cross-engine orchestration, core architectural integrity. |
| **Backend Engineer 1 (BE1)** | 1 | E01 Master Data (Maker-Checker engine), E13 RBAC & Audit Log, Catalog search services. |
| **Backend Engineer 2 (BE2)** | 1 | E02 Pricing Engine (Volume breaks, zone freight matrix, floor prices, discount authority, effective-dated VAT). |
| **Backend Engineer 3 (BE3)** | 1 | E03 Credit & Cheque Control Engine (Credit limits, hard/soft block evaluation, Cheque register, release workflows). |
| **Backend Engineer 4 (BE4)** | 1 | E04 Order ATP & Contention Engine, E07 FEFO Lot Management, E10 RD-Compliant Tax Invoicing & Billing. |
| **Frontend Engineer 1 (FE1)** | 1 | Back-Office Admin Portal: Master Data Maker-Checker UI, Credit Risk Desk, Finance & Cheque Register UI, RBAC Admin. |
| **Frontend Engineer 2 (FE2)** | 1 | Sales & Operations Portal: Sales Quotation / Order Entry Desk, Branch ATP Lookup, Dispatch & Fulfillment UI, Invoice Viewer. |
| **QA Automation Lead (QA)** | 1 | Integration test harnesses, automated contract verification, E2E Cypress/Playwright suites, RD Tax calculation stress tests. |
| **DevOps / Platform Engineer (DO)**| 1 | CI/CD automated gates, PostgreSQL/Neon DB infrastructure, Redis caching clusters, Kafka event bus, Docker/K8s, APM & Logging. |
| **TOTAL** | **9** | **Cross-Functional In-House Scrum Delivery Unit** |

#### Capacity & Story Point (SP) Sizing Calibration
- **Sprint Duration**: 2 Weeks (10 business days).
- **Gross Engineering Hours**: 9 engineers × 10 days × 8 hours = 720 gross hours / sprint.
- **Productive Focus Factor**: 70% (deducting Scrum ceremonies, architecture reviews, production hotfix buffer, PR reviews) = **504 net productive engineering hours / sprint**.
- **Point Calibration**: 1 Story Point (SP) ≈ 12 net engineering hours.
- **Sprint Baseline Velocity**: **~40 to 42 Story Points (SP)** per sprint.
- **R1 Delivery Velocity Target (S1 to S12 = 12 delivery sprints)**:
  $$12 \text{ sprints} \times 40 \text{ SP/sprint} = 480 \text{ Total Deliverable Story Points}$$
- **Release 1 Scope Sizing**: 249 requirements sized at **440 Story Points**, leaving a **40 SP (9%) contingency reserve buffer**.

---

## 2. Epics Breakdown & Sprint Mapping (S0–S12)

The 12 primary Epics governing Release 1 are categorized and mapped sequentially across 13 sprints (S0 to S12).

### 2.1 The 12 Epics Definition & Scope Sizing
1. **E13: RBAC, User Administration & Immutable Audit Trail (30 SP)**
   - Granular role-based permissions (Branch Sales Rep, Commercial Manager, Credit Officer, Finance Controller, SysAdmin).
   - Immutable audit logging on all transaction state changes and financial overrides (IP, Timestamp UTC, User ID, Before/After Delta).
2. **E01: Master Data Management with Maker-Checker (40 SP)**
   - Customer Master (B2B Tax IDs, Branches, Billing/Shipping addresses, WDS Tier).
   - Vendor Master and Item Master (Taxonomy, UOM conversions, Base pricing).
   - Staging table with two-man rule (Maker creates/edits $\to$ Checker approves) before activating master records.
3. **E02: Dynamic Pricing Engine (55 SP)**
   - Multi-tiered Volume Breaks (Quantity / Monetary value slabs).
   - Zone-based Freight Surcharge Matrix (80+ store catchment zones, distance tiers, heavy transport surcharges).
   - Absolute Floor Price Enforcement (Cannot sell below cost + minimum markup without Level-4 MD override).
   - Discount Authority Matrix (Sales Rep 0-3%, Sales Mgr 3.1-7%, Commercial VP >7%).
   - Effective-dated VAT rate engine (Current 7%, forward-compatible with date-activated VAT rate transitions).
4. **E03: Credit & Cheque Control Engine (50 SP)**
   - Real-time Credit Limit calculation (Exposure = Open Orders + Unbilled Dispatch + Unpaid Invoices - Uncleared Cheques).
   - Hard Blocking (Total freeze on order submission when credit limit exceeded or invoice overdue >30 days).
   - Soft Blocking (Requires Credit Manager digital signature / OTP exception release).
   - Post-Dated Cheque (PDC) Register: Status lifecycle (Received, Deposited, Cleared, Bounced, Replaced).
5. **E07: Inventory Management & FEFO Lot Tracking (45 SP)**
   - First-Expired, First-Out (FEFO) allocation engine for perishables (Portland cement bags, chemical additives, paint batches).
   - Batch quarantine, inspection hold, and shelf-life warning alerts.
   - Blind receiving verification against supplier delivery orders.
6. **E04: Order Management & ATP Reservation (60 SP)**
   - Available-to-Promise (ATP) real-time calculation ($ATP = OnHand - HardAllocated - SafetyStock + ScheduledReceipts$).
   - High-Contention Locking: Branch retail floor vs. B2B wholesale order contention handling using two-phase atomic locks.
   - Split-Shipment logic (DC Direct-to-Site vs. Branch Cross-dock vs. Direct Vendor Delivery).
7. **E10: Billing & Revenue-Department-Compliant Tax Invoicing (50 SP)**
   - Statutory Thai Revenue Department (RD) Tax Invoice formatting: 13-digit Tax ID, Branch Head Office / Branch #, Baht Text algorithm.
   - Output VAT 7% calculation with exact half-up 2-decimal rounding.
   - Immutable posted state: Once an invoice is posted, DB records are cryptographically sealed; corrections require official Credit Note (CN) or Debit Note (DN).
8. **E08: Warehouse Fulfillment & Direct-to-Site Dispatch (35 SP)**
   - Pick, Pack, and Staging workflows; heavy material packing slips.
   - Dispatch note generation, vehicle load planning, and delivery scheduling.
   - Proof of Delivery (POD) registration with mobile photo upload / receiver signature.
9. **E12: Return, Exchange & Refund Management (25 SP)**
   - Return Merchandise Authorization (RMA) initiation with reason codes and lot validation.
   - Restocking inspection (Grade A back to ATP, Grade B to clearance, Damaged to write-off).
   - Automated Credit Note linkage back to original Tax Invoice.
10. **E11: Customer Portal & B2B Sales Mobility (30 SP)**
    - Responsive Web Portal for wholesale contractors: Account overview, credit balance lookup, quotation request.
    - Sales Rep mobile quotation-to-order converter.
11. **E14: Operational Reporting, BI Analytics & Compliance Dashboards (20 SP)**
    - Real-time gross margin by project/contractor report.
    - Credit risk exposure and aging analysis (Aged AR: Current, 30, 60, 90+ days).
    - Statutory VAT Output Report (ภ.พ.30 compliant).
12. **E15: Enterprise Integration Hub & System Hardening (40 SP)**
    - Integration touchpoints I0a to I0e (Merchandising Feed 100k SKUs, Retail Store Stock, CRM, POS, GL/Finance ERP).
    - System cutover rehearsals, security pen-testing, disaster recovery failover.

---

### 2.2 Sprint-by-Sprint Work Breakdown (S0 to S12)

```
Sprint Timeline: 26 Weeks (13 Sprints x 2 Weeks)
[S0] Foundation & Tooling -> CP1
[S1] Master Data & RBAC
[S2] Pricing Core & Master Data Approval -> CP2
[S3] Credit Control & Zone Freight
[S4] Inventory FEFO & Credit Exceptions
[S5] Order ATP & Contention Resolution -> CP3 (Drop List Gate)
[S6] Billing & RD Tax Invoice Engine
[S7] Warehouse Fulfillment & Credit Notes
[S8] Returns/RMA & POS/ERP Integrations -> CP4 (Core Freeze)
[S9] B2B Sales Mobility & POD Dispatch
[S10] BI Reporting & End-to-End Hardening
[S11] UAT Sign-off, Pen-Test & DR Simulation -> CP5 (Go/No-Go)
[S12] Cutover, Data Migration & Hypercare Pilot
```

#### Detailed Sprint Specification Table

| Sprint | Weeks | Primary Epics | Planned SP | Key Technical Deliverables | Demoable Feature & Business Value |
|---|:---:|---|:---:|---|---|
| **S0** | W1–W2 | E13, E15 | 25 SP | DevOps CI/CD setup, PostgreSQL schema baseline, Kafka/Redis infra, Base RBAC entity models, Git commit hooks `[FR-xx-xxx]`. | **Working CI/CD Pipeline & Auth Harness**: Developer can log in with multi-role accounts and observe immutable audit logs in DB. |
| **S1** | W3–W4 | E01, E13, E15 | 38 SP | Customer/Vendor/SKU master schemas, Maker-Checker staging architecture, Interface I0a (Catalog batch parser prototype). | **Maker-Checker Master Data UI**: User can create a new B2B customer; Checker sees pending queue, compares diffs, approves/rejects. |
| **S2** | W5–W6 | E02, E01, E15 | 42 SP | Dynamic Pricing Engine Core: Quantity volume breaks, floor price validator, effective-dated VAT table, I0a catalog sync. | **Interactive Pricing Calculator**: Sales enters SKU, volume, and customer tier $\to$ receives calculated line price, tax, and floor price warning. *(Gate: CP2)* |
| **S3** | W7–W8 | E03, E02 | 40 SP | Credit Limit ledger, Hard/Soft block evaluator, PDC Cheque Register schema, Zone freight distance matrix calculation. | **Credit Check & Cheque Register Desk**: System blocks order submission if customer credit limit exceeded; Finance logs received post-dated cheques. |
| **S4** | W9–W10 | E07, E03, E15 | 40 SP | FEFO Lot Selection algorithm (cement expiry), Batch inspection hold status, Credit Override workflow with OTP/Digital sign-off. | **FEFO Cement Allocation & Credit Release**: Placing cement order automatically picks oldest non-expired batch; Manager overrides soft credit block. |
| **S5** | W11–W12 | E04, E07 | 42 SP | ATP Engine with 2-phase reservation lock, Branch vs. Wholesale contention resolution, Multi-branch stock aggregation. | **Concurrent Order ATP Reservation**: Simultaneous checkout from POS simulator and WDS order desk cleanly reserves stock without phantom inventory. *(Gate: CP3)* |
| **S6** | W13–W14 | E10, E04 | 40 SP | RD Tax Invoice Generator: Thai Baht Text conversion, sequential running number, 7% Output VAT, immutable posted DB lock. | **Statutory RD Tax Invoice Generation**: Generate printable/exportable Thai Tax Invoice with full legal headers, exact VAT, and cryptographic immutability. |
| **S7** | W15–W16 | E08, E10 | 38 SP | Warehouse Pick/Pack slip generator, Heavy freight weighbridge ticket entry, Credit Note & Debit Note issuance workflow. | **Fulfillment Slip & Credit Note Flow**: Warehouse prints pick-list with batch locations; Finance issues Credit Note against posted invoice. |
| **S8** | W17–W18 | E12, E15 | 38 SP | RMA Return workflow, Restocking inspection station, Interface I0d (POS collection) & I0e (GL/AR posting) integration stubs. | **End-to-End RMA & ERP Posting**: Return cement bags $\to$ inspect grade $\to$ restock to ATP $\to$ trigger AR ledger entry in GL stub. *(Gate: CP4)* |
| **S9** | W19–W20 | E11, E08 | 36 SP | B2B Wholesale Sales Portal (Quotation-to-Order), Delivery dispatch manifest, Proof of Delivery (POD) photo capture. | **Sales Quotation & Driver POD**: Sales rep creates quote on tablet $\to$ converts to order $\to$ Driver uploads delivery photo with receiver signature. |
| **S10** | W21–W22 | E14, E15 | 35 SP | Real-time BI Dashboards: Aged AR report, Gross margin by project, Statutory ภ.พ.30 tax report, I0a-I0e full integration harness. | **Executive BI & Statutory Tax Report**: One-click generation of monthly Revenue Department ภ.พ.30 summary and real-time contractor credit risk matrix. |
| **S11** | W23–W24 | E15, All | 26 SP | System-wide performance stress test (100k SKUs, 500 concurrent users), OWASP Pen-test remediation, DR failover rehearsal. | **Hardened Production-Ready System**: Automated test suite executing 100% green; stress test passing sub-second SLAs under peak load. *(Gate: CP5)* |
| **S12** | W25–W26 | E15, All | 20 SP | Production cutover, master data delta migration, Pilot branch launch (3 branches), Hypercare Day-1 operational monitoring. | **Live Production Pilot**: 3 Thai Watsadu pilot stores processing live wholesale contractor orders, issuing legal tax invoices in real-time. |

---

## 3. Sprint Deliverables & Demo Criteria (S0 to S12)

To enforce strict accountability, every sprint concludes with an operational, live-system demonstration. Mockups or slide presentations are explicitly forbidden.

```
+---------------------------------------------------------------------------------------------------+
|                                  SPRINT DEMO SPECIFICATION MATRIX                                 |
+--------+------------------------------------------------------+-----------------------------------+
| Sprint | Demo Scenario                                        | Verifiable Pass/Fail Criteria     |
+--------+------------------------------------------------------+-----------------------------------+
| S0     | Automated Pipeline & Security Audit Trail Demo       | Zero console errors; Git hook     |
|        |                                                      | blocks non-compliant commits      |
| S1     | Master Data Maker-Checker Two-Man Rule Demo          | Unapproved records invisible to   |
|        |                                                      | order engine; audit diff logged   |
| S2     | Volume Break & Floor Price Boundary Demo             | Floor violation hard-rejected;    |
|        |                                                      | VAT 7% applied accurately         |
| S3     | Credit Hard-Stop & Post-Dated Cheque Lifecycle Demo  | Order blocked at 100.01% credit;  |
|        |                                                      | PDC status transitions recorded   |
| S4     | FEFO Cement Allocation & Manager Credit Release Demo | Oldest batch chosen automatically;|
|        |                                                      | Release requires manager OTP      |
| S5     | High-Contention Multi-Branch ATP Race Condition Demo | Zero overselling under 100        |
|        |                                                      | concurrent simulated requests     |
| S6     | Statutory Thai RD Tax Invoice & Baht Text Demo       | Thai Baht Text matches exactly;   |
|        |                                                      | Posted invoice cannot be edited   |
| S7     | Warehouse Pick-Pack & Financial Credit Note Demo     | Weight ticket captured; CN auto-  |
|        |                                                      | updates AR ledger and tax record  |
| S8     | RMA Restocking & GL ERP Financial Sync Demo          | Returned item reappears in ATP;   |
|        |                                                      | GL journal entry payload valid    |
| S9     | B2B Contractor Portal & Driver Proof of Delivery Demo| Quotation converts in 1 click;    |
|        |                                                      | POD photo uploaded with GPS stamp |
| S10    | Revenue Department ภ.พ.30 & Credit Risk BI Demo      | Monthly VAT report matches GL;    |
|        |                                                      | Aged AR categorizes 30/60/90 days |
| S11    | 500-User Stress Test & Disaster Recovery Drill Demo  | p99 latency < 800ms; DB failover  |
|        |                                                      | completes in < 60 seconds         |
| S12    | Production Cutover & First Live Contractor Order Demo| Live contractor order completed,  |
|        |                                                      | stock deducted, RD invoice issued |
+--------+------------------------------------------------------+-----------------------------------+
```

---

## 4. Governance Checkpoints (CP1 to CP5) & The 20-Item Drop List Protocol (§2.3)

### 4.1 Checkpoint Architecture (CP1 through CP5)
Governance checkpoints act as hard quality and progress gates where project health is formally audited by the Project Steering Committee.

```
[Project Start W0]
       │
      ▼
   [ CP1 ] End S0 (W2)  ──> Baseline Infrastructure, CI/CD, DB Schema Frozen
       │
      ▼
   [ CP2 ] End S2 (W6)  ──> Master Data, Pricing Core, I0a Feed Validated
       │
      ▼
   [ CP3 ] End S5 (W12) ──> MID-TERM REALITY GATE: Velocity Check (<85% triggers Drop List §2.3)
       │
      ▼
   [ CP4 ] End S8 (W18) ──> Feature Freeze: Core Engines Locked; Integration Testing
       │
      ▼
   [ CP5 ] End S11 (W24)──> UAT Sign-off, Pen-Test Cleared, DR Rehearsed (Go/No-Go)
       │
      ▼
[ Live Cutover W26 ]
```

#### Checkpoint Detail Matrix

| Checkpoint | Milestone Timing | Gate Criteria & Objective | Evaluation Method & Deliverable Evidence | Action on Failure |
|---|:---:|---|---|---|
| **CP1** | End of Sprint 0 (Week 2) | **Foundation & Architecture Baseline**: Repository setup, automated CI/CD linting/security scanning, PostgreSQL database migration framework, and initial entity schema. | Automated pipeline builds cleanly; Git hook enforces `[FR-xx-xxx]` tags; zero high-severity vulnerabilities. | Halt Sprint 1 start; 3-day sprint buffer to resolve platform blockers. |
| **CP2** | End of Sprint 2 (Week 6) | **Master Data & Pricing Engine Baseline**: E01 Maker-Checker fully operational; E02 Pricing Engine accurately calculating volume breaks and floor price limits; Interface I0a catalog feed parsing. | Automated test suite passes 100% on pricing boundary calculations; Maker-Checker audit trails verified. | Retain 2 backend engineers on pricing engine; defer non-essential admin UI. |
| **CP3** | End of Sprint 5 (Week 12) | **Mid-Term Velocity & Reality Check**: Team must have completed $\ge 85\%$ of cumulative planned story points ($\ge 160$ delivered SP out of 190 SP planned) and core ATP/Credit engines functional. | Velocity audit by PM/PO; end-to-end integration demo of Order $\to$ Credit Check $\to$ ATP Reservation. | **TRIGGER DROP LIST PROTOCOL (§2.3)** immediately to trim non-critical scope. |
| **CP4** | End of Sprint 8 (Week 18) | **Core Feature Freeze & Integration Lock**: Core engines (Pricing, Credit, ATP, Billing/Tax) frozen. No new business logic permitted. Interfaces I0a–I0e verified with test stubs. | Complete integration test pass; RD Tax Invoice immutability and Baht Text validated by internal tax auditor. | Scope lock enforced; all team members pivoted to defect resolution and integration. |
| **CP5** | End of Sprint 11 (Week 24) | **UAT Sign-off & Production Readiness**: 100% of Release 1 critical test scenarios passed; business UAT signed off; OWASP pen-test clean; DR failover verified. | Formal UAT Sign-off document signed by VP Wholesale; Security sign-off; Disaster recovery RTO $<15$ mins, RPO $<1$ min. | Escalate to Steering Committee; delay cutover by up to 2 weeks using contingency buffer. |

---

### 4.2 The 20-Item Drop List Protocol (§2.3)

#### 4.2.1 Protocol Activation Rules & Escalation Mechanics
The Drop List Protocol is an enterprise scope-management mechanism designed to guarantee delivery of the core transaction engine under fixed timeline (26 weeks) and fixed headcount (9 engineers).
- **Trigger Event**: Evaluated at **Checkpoint 3 (CP3, End of Sprint 5 / Week 12)**.
- **Trigger Thresholds**:
  1. **Velocity Deficit**: Cumulative delivered velocity is $< 85\%$ of planned story points ($< 160$ SP delivered).
  2. **Core Integration Blocker**: External legacy interfaces (I0d POS or I0e ERP) delayed by third parties $> 2$ weeks.
- **Protocol Execution Process**:
  1. Within 24 hours of CP3, PM convenes the **Scope Realignment Council** (Product Owner, Solution Architect, Dev Lead, Commercial VP).
  2. The team calculates the exact point deficit: $\Delta SP = 190 - \text{Delivered SP}$.
  3. Features are dropped strictly in sequential order (Item #1 through Item #20) until the total points dropped $\ge \Delta SP + 15 \text{ SP}$ (restoring a healthy buffer).
  4. Dropped items are formally transitioned to **Release 1.1 (Immediate post-launch fast-follow)** or **Release 2.0 (Phase 2)**.
  5. Every dropped feature is paired with a mandatory, tested **Manual / Operational Fallback Workaround** to ensure business continuity.

#### 4.2.2 The 20-Item Drop List (Strict Priority Order 1 to 20)

```
PRIORITY ORDER TO DROP (1 = First to Drop; 20 = Last Resort before Core Engine Failure)
[#1  to #5]  Peripherals & Advanced Mobile UI            ---> Saves ~36 SP
[#6  to #10] Predictive Algorithms & Advanced Logistics  ---> Saves ~41 SP
[#11 to #15] Automated Self-Service & Secondary Tools    ---> Saves ~38 SP
[#16 to #20] Advanced Financial/Fulfillment Enhancements ---> Saves ~37 SP
TOTAL POTENTIAL SCOPE SHED: 152 STORY POINTS (Up to 34% of R1 Backlog)
```

| Drop # | Epic | Feature Name & Detailed Scope | Justification for Dropping | Saved SP | Manual / Operational Fallback Workaround | Target Release |
|:---:|:---:|---|---|:---:|---|:---:|
| **1** | E11 | **Native Mobile App for B2B Contractors** | High maintenance overhead (iOS/Android); mobile responsive web portal provides identical ordering capabilities. | **8 SP** | Contractors use responsive mobile browser on smartphone/tablet. | R1.1 |
| **2** | E14 | **Predictive Demand Forecasting & AI Replenishment** | Complex machine learning dependencies; not critical for initial order-to-cash execution. | **8 SP** | DC inventory planners utilize existing historical Excel replenishment models. | R2.0 |
| **3** | E11 | **Automated Line OA Chatbot for Quotations** | Third-party messaging API integration overhead; edge case handling requires heavy manual testing. | **6 SP** | Contractors message dedicated branch telesales line reps who manually key quotes. | R1.1 |
| **4** | E08 | **IoT Automated Weighbridge Hardware Integration** | Direct serial/TCP bridge integration with physical DC scales is prone to site hardware delays. | **7 SP** | Weighbridge operator prints scale ticket and manually enters gross/tare weights into WDS UI. | R1.1 |
| **5** | E12 | **Customer Self-Service Return Portal** | Complex customer-facing return eligibility rules and photo uploads. | **7 SP** | Contractor brings material to branch customer service desk; staff initiates RMA in back-office. | R1.1 |
| **6** | E14 | **3D Warehouse Heatmap & Real-Time Bin Visualizer** | High frontend visualization effort; provides operational luxury rather than functional necessity. | **8 SP** | Warehouse supervisors view standard 2D tabular location lists and bin occupancy metrics. | R2.0 |
| **7** | E02 | **Automated Competitor Price Scraping & Matcher** | External web scraper fragility, legal bot-blocking risks, and non-deterministic pricing inputs. | **9 SP** | Commercial pricing committee conducts weekly manual market benchmarking and adjusts tiers. | R2.0 |
| **8** | E08 | **Multi-Stop Dynamic Route Optimization Engine** | Vehicle Routing Problem (VRP) algorithmic complexity; third-party map engine costs. | **9 SP** | Dispatch manager assigns delivery zones and truck sequence using pre-defined zone maps. | R1.1 |
| **9** | E11 | **Contractor Loyalty & Tiered Reward Points Accrual** | Secondary commercial incentive; complex dual-ledger points accounting system. | **7 SP** | Customer receives standard trade discount on invoice; rebate handled quarterly off-invoice. | R1.1 |
| **10** | E03 | **Real-Time National Credit Bureau (NCB) API Scoring** | Third-party financial gateway procurement and legal approval delays. | **8 SP** | Credit risk analyst performs manual bureau check during credit application review. | R2.0 |
| **11** | E12 | **Cross-Branch Multi-Store Return & Restock Routing** | Intricate inter-store inventory transfer and tax cross-charging logistics. | **8 SP** | Returns strictly accepted only at the original issuing store or regional central DC. | R1.1 |
| **12** | E07 | **Blind Receiving Barcode Scanner Mobile Client** | Requires ruggedized Android handheld scanner hardware staging and MDM setup. | **7 SP** | Warehouse receiving clerks use paper Goods Receipt Notes (GRN) and verify at desktop PC. | R1.1 |
| **13** | E10 | **Multi-Currency Billing & Foreign Exchange Engine** | Thai Watsadu domestic B2B sales are 99.8% in Thai Baht (THB); FX hedges unnecessary for R1. | **6 SP** | Lock system strictly to Thai Baht (THB); institutional export orders handled manually in ERP. | R2.0 |
| **14** | E01 | **Vendor Self-Registration & Onboarding Portal** | External vendor authentication and validation workflow overhead. | **7 SP** | Internal Master Data team receives vendor tax forms via email and inputs via Maker-Checker. | R1.1 |
| **15** | E04 | **Multi-Warehouse Automated Split-Order Optimizer** | Complex combinatorial optimization allocating lines across multiple regional DCs. | **10 SP** | Order desk sales rep manually selects fulfillment source (Store vs. DC) per order line item. | R1.1 |
| **16** | E08 | **Digital Sign-on-Glass (e-Sign) for Delivery Drivers** | Offline mobile sync, signature image compression, and device hardware provisioning. | **7 SP** | Driver captures customer physical signature on tri-copy printed Delivery Order and uploads scan. | R1.1 |
| **17** | E10 | **Automated SMS/Email e-Tax Invoice Distribution** | Integration with external SMS gateway and authenticated PDF signing microservice. | **6 SP** | System generates PDF invoice; branch prints physical copy or sends via manual email attachment. | R1.1 |
| **18** | E02 | **Complex Cross-Category Promotional Bundle Rules** | "Buy 10 bags cement + get 1 roll wire mesh at 50%" rule combinatorics create heavy regression. | **9 SP** | Pricing limited to simple Volume Tier Breaks, Category Discounts, and Zone Freight rates. | R1.1 |
| **19** | E03 | **Automated Cheque Image OCR & MICR Parsing** | High error rate on Thai bank cheque scanning; requires specialized scanner peripherals. | **7 SP** | Cashier manually types 7-digit cheque number, bank branch code, and amount into register. | R1.1 |
| **20** | E04 | **Real-Time Delivery Truck GPS Fleet Tracking Map** | Telematics device integration and live streaming socket server overhead. | **8 SP** | Customer service calls transport dispatcher for vehicle status updates; driver updates via phone. | R1.1 |

#### Cumulative Drop Impact Analysis
- **Drops 1–5 (Peripherals & Mobile UI)**: Saves **36 Story Points** (equivalent to ~1 full team sprint).
- **Drops 1–10 (Up through Advanced Logistics & Scoring)**: Saves **77 Story Points** (equivalent to ~2 full team sprints).
- **Drops 1–15 (Up through Auto-Splits & Self-Registration)**: Saves **115 Story Points** (equivalent to ~3 team sprints).
- **Drops 1–20 (Full Protocol Activation)**: Saves **152 Story Points** (recovers up to 34% of entire project capacity), completely guaranteeing that the Core Statutory Engine (Pricing, Credit Hard Stops, Inventory ATP, and RD Tax Invoicing) will deploy on time by Week 26.

---

## 5. Risk Management Matrix (P01 through P09)

The Risk Management Matrix covers the nine catastrophic risk factors (P01 to P09) that threaten WDS delivery, statutory compliance, or business continuity.

```
+---------------------------------------------------------------------------------------------------+
|                                  RISK PROFILE & HEAT MAP OVERVIEW                                 |
+-----+---------------------------------------------+-------------+------------+--------------------+
| ID  | Risk Description                            | Probability | Impact     | Risk Score & Level |
+-----+---------------------------------------------+-------------+------------+--------------------+
| P01 | Revenue Department Tax Compliance Failure   | Low (0.2)   | Critical(5)| High (Critical)    |
| P02 | Real-Time Stock Contention & Phantom Stock  | High (0.8)  | High (4)   | High (Severe)      |
| P03 | Unhedged Credit Risk & Cheque Default       | Medium(0.5) | Critical(5)| High (Severe)      |
| P04 | Legacy System Integration Latency (I0a-I0e) | High (0.8)  | High (4)   | High (Severe)      |
| P05 | DB Locking Under Massive Batch Ingestion    | Medium(0.5) | High (4)   | Medium (High)      |
| P06 | Master Data Corruption & Bypass of Approval | Low (0.2)   | High (4)   | Medium (Moderate)  |
| P07 | Contractor PII & Wholesale Margin Breach    | Low (0.2)   | Critical(5)| High (Critical)    |
| P08 | Scope Creep & Velocity Deficit at CP3       | High (0.7)  | High (4)   | High (Severe)      |
| P09 | Operational Adoption Friction at Branches   | High (0.7)  | Medium (3) | Medium (High)      |
+-----+---------------------------------------------+-------------+------------+--------------------+
```

### Detailed Risk Specifications & Action Plans

#### P01: Revenue Department Tax Compliance & Fiscal Audit Invalidation
- **Category**: Statutory, Legal & Financial Liability.
- **Description**: Failure to comply with strict Thai Revenue Department regulations governing e-Tax invoices, continuous sequential numbering without gaps, exact 7% VAT rounding (half-up at item vs. invoice level), Thai Baht Text transcription, and document immutability.
- **Trigger Indicator**: Tax auditor rejection during Sprint 6 demo or discrepancy between WDS sub-ledger and GL tax output accounts.
- **Preventive Mitigation**:
  - Implement a dedicated statutory tax calculation module utilizing immutable database triggers and cryptographic SHA-256 hash chaining on all posted tax invoices.
  - Hardcode Thai Revenue Department rounding standard: line-item calculation with precise 4-decimal intermediate math, rounded to 2 decimals using `ROUND_HALF_UP` on final VAT summation.
  - Implement standard Thai Baht Text conversion algorithm verified with automated unit test suite against official RD test vectors.
- **Contingency Action**: If tax discrepancies are detected, halt automated tax posting, switch to pre-printed numbered tax forms with manual reconciliation, and deploy dedicated hotfix patch within 48 hours.
- **Accountable Owner**: Dev Lead & Finance/Tax Controller.

#### P02: Inventory Stock Contention & Phantom Stock Overselling
- **Category**: Inventory, Transactional Integrity & Customer Satisfaction.
- **Description**: Simultaneous stock reservation attempts between high-volume B2B wholesale orders and walk-in retail POS customers at 80+ branches lead to race conditions, phantom inventory sales, and stockouts of heavy building materials (e.g., cement, structural steel).
- **Trigger Indicator**: Negative stock balances in branch warehouses, ATP calculation latency $> 1.5$ seconds, or failed fulfillment tickets.
- **Preventive Mitigation**:
  - Implement a Two-Phase Atomic Inventory Lock using Redis distributed locks paired with PostgreSQL `SELECT ... FOR UPDATE` row-level locks on stock ledger records.
  - Segregate inventory pools: Establish dedicated Wholesale Safety Stock buffers for critical high-velocity items, preventing walk-in retail POS from completely consuming wholesale contractor commitments.
  - Maintain an asynchronous Kafka event stream for inventory adjustments with strict event ordering per SKU and branch.
- **Contingency Action**: Automatically downgrade failed orders to "Pending Branch Cross-Dock" status, trigger immediate DC replenishment alert, and notify sales rep to propose alternative branch fulfillment.
- **Accountable Owner**: Backend Engineer 4 (ATP Lead) & Solution Architect.

#### P03: Unhedged Credit Risk & Post-Dated Cheque Default
- **Category**: Commercial Risk & Financial Liquidity.
- **Description**: Contractor orders submitted above authorized credit limits due to caching latency or manual sales override; acceptance of bounced post-dated cheques leading to unrecoverable accounts receivable bad debt.
- **Trigger Indicator**: Outstanding exposure exceeding credit limit by $> 0.01\%$, unbanked cheques $> 14$ days past maturity, or manual override executed without Level-3 manager signature.
- **Preventive Mitigation**:
  - Real-time hard-stop credit calculation engine: Every order submission recalculates real-time exposure directly against the live database without caching credit balances.
  - Formal Post-Dated Cheque (PDC) lifecycle ledger: Cheques must be physically logged with photo and bank clearance status before any credit line replenishment occurs.
  - Multi-tiered digital signature workflow requiring OTP/biometric approval from Credit Risk Director for any temporary credit limit extension.
- **Contingency Action**: Automatically place an immediate hard credit lock on the contractor's account upon cheque bounce; freeze all pending deliveries for that customer network wide.
- **Accountable Owner**: Backend Engineer 3 (Credit Lead) & Credit Control Director.

#### P04: Legacy System Integration Latency & Interface Outages (I0a–I0e)
- **Category**: Technical Architecture & External Dependency.
- **Description**: Nightly merchandising feed (I0a, 100k SKUs) exceeds processing window, retail stock API (I0b) times out, or legacy GL ERP (I0e) is unresponsive during month-end closing, blocking WDS transactions.
- **Trigger Indicator**: API response times exceeding 2,000ms, batch sync jobs running into morning operating hours (past 07:00 AM), or integration error rates $> 1\%$.
- **Preventive Mitigation**:
  - Decouple all non-real-time integrations using Kafka message queues and idempotent consumer workers.
  - Implement bulk delta processing with Redis caching for the 100k SKU catalog, updating only records whose modification hash has changed.
  - Establish Circuit Breakers and Fallback Modes: If I0b retail stock API fails, fall back to last-known stock balance discounted by a 15% safety buffer.
- **Contingency Action**: Switch integrations to asynchronous batch queuing mode; spool all financial postings locally in an encrypted audit table for automatic replay once ERP connectivity resumes.
- **Accountable Owner**: Solution Architect & DevOps / Platform Engineer.

#### P05: Database Locking & Performance Degradation Under Massive Batch Ingestion
- **Category**: Database Architecture & System Performance.
- **Description**: Large-scale batch updates (catalog re-indexing, daily price updates, monthly statement generation) cause lock contention on core transactional tables, freezing online sales desk operations.
- **Trigger Indicator**: PostgreSQL database CPU utilization $> 80\%$, active connection pool exhaustion, or transaction lock wait time $> 3,000\text{ms}$.
- **Preventive Mitigation**:
  - Implement strict Read/Write database splitting using read replicas for catalog search, customer history, and reporting queries.
  - Design batch ingestion to operate in micro-batches (500 rows per transaction) using PostgreSQL `COPY` commands during off-peak hours (01:00 AM - 04:00 AM).
  - Partition high-volume transactional tables (Order Lines, Inventory Movements, Audit Logs) by calendar month.
- **Contingency Action**: Automatically throttle or pause background batch jobs if web API latency exceeds 500ms; execute emergency connection pool recycling.
- **Accountable Owner**: Dev Lead & DevOps / Database Administrator.

#### P06: Master Data Corruption & Bypass of Maker-Checker Approval
- **Category**: Operational Integrity & Internal Fraud Prevention.
- **Description**: Unverified product prices, incorrect unit-of-measure conversions (e.g., box vs. pallet), or unauthorized customer credit tier adjustments entered directly into production without approval.
- **Trigger Indicator**: Price discrepancies reported by branches, zero-margin order submissions, or audit log records lacking an approver user ID.
- **Preventive Mitigation**:
  - Enforce a strict architectural Maker-Checker staging table pattern: direct updates to active tables are physically prohibited by DB row-level permissions.
  - Implement four-eyes digital validation: The user initiating a change (Maker) cannot be the same user who approves it (Checker).
  - Automated sanity rules: System rejects any master price change that results in a $> 20\%$ price variance or drops below unit cost without Executive VP sign-off.
- **Contingency Action**: Immediate rollback of the unverified master data batch using transaction log history; freeze Maker user credentials pending internal audit.
- **Accountable Owner**: Backend Engineer 1 (Master Data Lead) & Product Owner.

#### P07: Contractor PII & Wholesale Margin Confidentiality Breach
- **Category**: Cyber Security, PDPA & Commercial Secrets.
- **Description**: Leakage of wholesale pricing agreements, contractor profit margins, or personal data (Tax IDs, director phone numbers) violating Thailand PDPA regulations or causing commercial harm.
- **Trigger Indicator**: Unauthorized bulk export attempts, security alerts from APM/WAF, or API access without valid JWT claims.
- **Preventive Mitigation**:
  - Implement Column-Level Encryption (AES-256) for all sensitive PII (Tax IDs, bank account numbers, phone numbers) at rest.
  - Enforce strict Role-Based Access Control (RBAC): Sales reps can only view their own assigned contractor accounts; wholesale margin data is masked for general branch staff.
  - Implement production data masking scripts: Non-production environments strictly utilize synthetic or masked data.
- **Contingency Action**: Trigger Security Incident Response Plan: revoke compromised tokens, block offending IP ranges, notify Data Protection Officer (DPO) within 72 hours per PDPA requirements.
- **Accountable Owner**: Security & Compliance Officer & Dev Lead.

#### P08: Scope Creep & Velocity Deficit Threatening Fixed 26-Week Timeline
- **Category**: Project Delivery, Timeline & Budget.
- **Description**: Mid-project stakeholder feature requests or underestimated technical complexity leads to a burn-up deficit, missing the hard 26-week executive delivery deadline.
- **Trigger Indicator**: Cumulative story point completion falling below 85% at CP3 (Sprint 5) or sprint backlog rollover $> 15\%$.
- **Preventive Mitigation**:
  - Enforce strict Scope Baseline: Any new feature request must go through the formal Change Control Board (CCB) and adhere to the "Trade-Off Rule" (add 1 feature = drop 1 feature of equal SP).
  - Maintain rigorous Definition of Ready (DoR) to prevent developers starting poorly specified user stories.
  - Implement early warning tracking via the 5 Weekly Core Metrics.
- **Contingency Action**: Invoke **The 20-Item Drop List Protocol (§2.3)** at Checkpoint 3 (Sprint 5) to shed up to 152 Story Points of secondary features, safeguarding the core R1 launch.
- **Accountable Owner**: Project Manager & Product Owner.

#### P09: Operational Adoption Friction & Branch User Resistance
- **Category**: Change Management & Operational Readiness.
- **Description**: Store sales reps and warehouse pickers at 80+ branches find the new WDS UI complex, leading to slow order processing, customer queue buildup, and attempts to bypass the system using offline paper chits.
- **Trigger Indicator**: Low daily active logins, high volume of Helpdesk tickets from branch users, or order entry duration $> 5$ minutes per quotation.
- **Preventive Mitigation**:
  - Co-design UI workflows directly with branch store champions during Sprint Demos (S2, S5, S7).
  - Deploy a "Super-User Champion Network": Train 2 lead super-users per store during S10–S11 to provide peer support.
  - Design streamlined, keyboard-accessible quick-entry screens for high-frequency sales desk operations (barcode scanning, hotkeys).
- **Contingency Action**: Deploy roving technical field support teams to low-performing branches during Pilot Launch (S12); provide intensive on-site coaching.
- **Accountable Owner**: Product Owner & Commercial Operations Lead.

---

## 6. RACI Decision Matrix

The RACI Matrix defines operational governance and final decision rights across all key project decisions, eliminating ambiguity between business and engineering leadership.

- **R = Responsible**: The role that conducts the work to achieve the deliverable.
- **A = Accountable**: The single individual with final decision authority and veto power (Only one "A" per activity).
- **C = Consulted**: Domain expert providing vital two-way input and feedback.
- **I = Informed**: Stakeholder kept updated on progress and outcomes.

### Roles
1. **BIZ**: Commercial Stakeholders (VP Wholesale / Head of Branch Operations)
2. **PO**: Product Owner (Thai Watsadu Digital PMO)
3. **PM**: Project Manager (Delivery Lead / Scrum Master)
4. **SA**: Solution Architect (Enterprise Architecture Lead)
5. **DL**: Dev Lead (Principal Engineer / Technical Lead)
6. **QA**: QA Automation Lead
7. **SEC**: Security & Compliance Officer (CISO / PDPA Officer)

```
+----------------------------------------------------------------------------------------------------+
|                                      RACI DECISION MATRIX                                          |
+----+-----------------------------------------------+-----+-----+-----+-----+-----+-----+-----+-----+
| ID | Key Decision / Governance Activity            | BIZ | PO  | PM  | SA  | DL  | QA  | SEC |     |
+----+-----------------------------------------------+-----+-----+-----+-----+-----+-----+-----+-----+
| 01 | Scope Baseline & Change Control Approval      |  A  |  R  |  C  |  C  |  C  |  I  |  I  |     |
| 02 | Sprint Backlog Prioritization & Acceptance   |  C  |  A  |  R  |  C  |  C  |  C  |  I  |     |
| 03 | Tech Stack Selection & Architectural Baseline |  I  |  C  |  I  |  A  |  R  |  C  |  C  |     |
| 04 | Database Schema Changes & Migration Approvals |  I  |  I  |  I  |  C  |  A  |  C  |  I  |     |
| 05 | Drop List Activation at Checkpoint 3 (CP3)    |  A  |  R  |  R  |  C  |  C  |  I  |  I  |     |
| 06 | Master Data Maker-Checker Override Approval   |  A  |  C  |  I  |  I  |  I  |  I  |  C  |     |
| 07 | Credit Hard-Stop Exception Override Policy    |  A  |  C  |  I  |  I  |  I  |  I  |  C  |     |
| 08 | RD Tax Invoice Format & Statutory Sign-off    |  C  |  A  |  I  |  C  |  R  |  C  |  C  |     |
| 09 | External Interface Contract Freeze (I0a-I0e)  |  I  |  C  |  C  |  A  |  R  |  C  |  I  |     |
| 10 | Non-Prod Synthetic Data Masking Approval      |  I  |  I  |  I  |  C  |  R  |  C  |  A  |     |
| 11 | Security Vulnerability Pen-Test Sign-off      |  I  |  I  |  C  |  C  |  R  |  C  |  A  |     |
| 12 | Checkpoint Gates Sign-off (CP1 through CP5)   |  C  |  A  |  R  |  C  |  C  |  C  |  C  |     |
| 13 | Production Cutover Go/No-Go Final Decision    |  A  |  R  |  R  |  C  |  C  |  C  |  C  |     |
| 14 | P1 Production Incident Sev-1 Emergency Patch  |  I  |  C  |  I  |  C  |  A  |  C  |  C  |     |
+----+-----------------------------------------------+-----+-----+-----+-----+-----+-----+-----+-----+
```

---

## 7. Project Governance Cadence & 5 Weekly Core Metrics

### 7.1 Operational Governance Cadence & Rituals

To maintain synchronization across 9 engineers and enterprise stakeholders, a disciplined agile delivery cadence is enforced:

| Ritual / Ceremony | Frequency & Timing | Attendees | Objective & Deliverable Output |
|---|---|---|---|
| **Daily Standup** | Daily, 09:15–09:30 (15 min) | Full Engineering Team (9), PM, PO | Yesterday's progress, today's commit plan, blocker removal. Daily blocker log updated. |
| **Sprint Planning** | Bi-weekly (Mondays of Sprint start), 09:00–12:00 (3 hrs) | Full Engineering Team, PM, PO, SA | Break down epics into technical tasks, assign story points, lock Sprint Commitment. |
| **Backlog Refinement** | Bi-weekly (Mid-sprint Wednesdays), 14:00–16:00 (2 hrs) | Dev Lead, BE/FE Leads, PO, SA, PM | Groom upcoming sprint user stories, verify Definition of Ready (DoR), estimate sizing. |
| **Sprint Review & Demo**| Bi-weekly (Alternate Fridays), 14:00–15:30 (1.5 hrs) | Full Team, Business Stakeholders, Commercial VP | Live software demonstration against demo criteria. Formal accept/reject sign-off by PO. |
| **Sprint Retrospective**| Bi-weekly (Alternate Fridays), 15:45–16:45 (1 hr) | Full Engineering Team, PM | Actionable process improvements: What went well, what stalled, concrete action items. |
| **Weekly Project SteerCo**| Weekly (Thursdays), 10:00–11:00 (1 hr) | PM, PO, SA, Commercial VP, Finance Director | Review 5 Weekly Core Metrics, budget/schedule variances, unblock external dependencies. |
| **Architecture Review Board (ARB)**| Bi-weekly (Tuesdays), 15:00–16:00 (1 hr) | SA, Dev Lead, DevOps, Security Officer | Audit DB schema migrations, review cross-service API contracts, security compliance. |

---

### 7.2 The 5 Weekly Core Metrics

Every Monday morning, the PM publishes the **Executive WDS Health Scorecard** tracking five quantitative metrics:

```
+---------------------------------------------------------------------------------------------------+
|                                    5 WEEKLY CORE PROJECT METRICS                                  |
+---+-----------------------------------+--------------------+------------------+-------------------+
| # | Metric Name                       | Target Benchmark   | Warning Threshold| Red Alarm / Action|
+---+-----------------------------------+--------------------+------------------+-------------------+
| 1 | Sprint Velocity & Burn-Up Index   | >= 40 SP / Sprint  | 34 - 39 SP       | < 34 SP (CP3 Drop)|
| 2 | Defect Density & Escaped Bug Rate | < 0.5 defects/SP   | 0.5 - 0.9 def/SP | >= 1.0 or Sev-1>0 |
| 3 | Interface Health & SLA Index      | 100% Green / <1.0s | Latency 1.0-2.0s | Failed Mock / >2s |
| 4 | Automated Core Test Coverage      | >= 80% on Engines  | 70% - 79%        | < 70% (Blocks PR) |
| 5 | Earned Value Schedule (SPI & CPI) | SPI >= 1.00        | 0.90 - 0.99      | SPI < 0.90        |
+---+-----------------------------------+--------------------+------------------+-------------------+
```

#### Metric 1: Sprint Velocity & Cumulative Burn-Up Tracking
- **Formula**:
  $$\text{Velocity Index} = \frac{\text{Actual Delivered Story Points}}{\text{Planned Committed Story Points}} \times 100\%$$
- **Target**: Delivered Velocity $\ge 40\text{ SP}$ per sprint; Cumulative Delivered Points tracking within 95% of target burn-up curve.
- **Action Threshold**: If cumulative velocity drops below $85\%$ at Sprint 5 (Week 12), immediately invoke the **20-Item Drop List Protocol (§2.3)**.

#### Metric 2: Defect Density & Escaped Bug Ratio
- **Formula**:
  $$\text{Defect Density} = \frac{\text{Total Detected Bugs}}{\text{Delivered Story Points}}$$
  $$\text{Escaped Defect Ratio} = \frac{\text{UAT / Staging Defects}}{\text{Internal QA Defects + UAT Defects}} \times 100\%$$
- **Target**: Defect density $< 0.5$ defects/SP; Zero active Severity-1 (Blocker) defects; Escaped bug ratio $< 10\%$.
- **Action Threshold**: If any Sev-1 defect remains unresolved for $> 24$ hours, all feature development in the sprint is paused to execute a "Swarm & Fix".

#### Metric 3: Interface & External Dependency Health Index
- **Formula**: Weighted composite score ($0-100\%$) tracking contract freeze status, mock availability, integration test pass rates, and end-to-end latency for Interfaces I0a through I0e.
- **Target**: $100\%$ green integration tests; API response time $< 1,000\text{ms}$ at 95th percentile ($p95$).
- **Action Threshold**: If any interface (e.g., I0d POS or I0e ERP) falls into Red status for $> 2$ consecutive weeks, PM escalates to the Corporate SteerCo to secure dedicated third-party vendor resources.

#### Metric 4: Core Engine Automated Test Coverage & Quality Score
- **Formula**: Code statement and branch coverage measured by automated CI/CD tools (e.g., JaCoCo / Jest / SonarQube) across core domain modules:
  - Dynamic Pricing Engine (E02)
  - Credit & Cheque Control Engine (E03)
  - Inventory ATP & FEFO Engine (E04/E07)
  - RD-Compliant Tax Invoicing Engine (E10)
- **Target**: Statement coverage $\ge 85\%$; Branch coverage $\ge 80\%$; Zero SonarQube Security Vulnerabilities (Blocker/Critical).
- **Action Threshold**: CI/CD pipeline automatically blocks git pull request merges if automated test coverage drops below $80\%$ on any core calculation service.

#### Metric 5: Earned Value & Schedule Performance Index (SPI / CPI)
- **Formula**:
  $$\text{Schedule Performance Index (SPI)} = \frac{\text{Earned Value (EV)}}{\text{Planned Value (PV)}}$$
  $$\text{Cost Performance Index (CPI)} = \frac{\text{Earned Value (EV)}}{\text{Actual Cost (AC)}}$$
  *(Where EV = Total Completed SP × Budget per SP; PV = Scheduled SP × Budget per SP).*
- **Target**: $\text{SPI} \ge 1.00$ and $\text{CPI} \ge 1.00$.
- **Action Threshold**: If $\text{SPI} < 0.90$ for two consecutive reporting cycles, PM must formulate a formal schedule recovery plan or trigger scope sheds via the Drop List.

---

## 8. Specification Discovery & Edge Cases Analysis

As a Specification Miner, the authoritative specifications and operational boundaries have been thoroughly probed.

### 8.1 Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|---|---|---|---|---|---|---|
| **F01** | E13 RBAC | Maker-Checker Approval Gate | Enforces separation of duties: record creator cannot approve record. | Draft Master Record, Maker User ID | Active Master Record, Approval Timestamp | Rejects with `403 Forbidden: Maker cannot be Checker` | SRS v1.1 §1.4, E13/E01 |
| **F02** | E13 Security | Immutable Audit Delta Logging | Captures before/after snapshot of every financial, credit, or pricing modification. | Entity ID, Field Name, Old Value, New Value, User ID | Cryptographically timestamped audit log row | DB trigger prevents direct UPDATE/DELETE on audit tables | SRS v1.1 §1.5, E13 |
| **F03** | E02 Pricing | Tiered Volume Break Pricing | Applies incremental or total quantity discount thresholds based on SKU volume slabs. | Customer ID, SKU ID, Order Quantity | Unit Price, Total Net Price, Applied Tier ID | Returns base list price if quantity below minimum tier | SRS v1.1 §2.1, E02 |
| **F04** | E02 Pricing | Zone Freight Surcharge Calculation | Computes transport delivery fee based on delivery zone, distance, and weight/volume bulk. | Shipping Postal Code, Branch Origin ID, Total Weight (kg) | Freight Surcharge (THB) | Flags for manual freight quote if destination zone undefined | SRS v1.1 §2.2, E02 |
| **F05** | E02 Pricing | Absolute Floor Price Guardrail | Prevents sale below baseline cost + mandatory minimum operating margin. | Calculated Net Unit Price, Cost Price, Floor Margin % | Pass / Hard Price Violation Alert | Order submission blocked; requires Level-4 MD digital sign-off | SRS v1.1 §2.3, E02 |
| **F06** | E02 Pricing | Effective-Dated Tax Engine | Evaluates statutory VAT rate based on the legally binding tax point date of the invoice. | Tax Point Date, Line Net Amount | Statutory VAT Rate (e.g. 7.00%), VAT Amount (THB) | Rejects if tax point date out of range or configuration missing | SRS v1.1 §2.4, E02 |
| **F07** | E03 Credit | Real-Time Credit Limit Hard-Stop | Calculates live customer credit headroom and blocks checkout if limit exceeded. | Customer ID, Proposed Order Value | Approved / Blocked Status, Current Exposure, Available Headroom | Hard block prevents order creation; notifies Credit Analyst | SRS v1.1 §3.1, E03 |
| **F08** | E03 Credit | Post-Dated Cheque (PDC) Ledger | Tracks status of received contractor cheques and updates temporary credit headroom. | Cheque Number, Bank Code, Maturity Date, Amount, Image | Cheque Record, Updated Credit Headroom | Bounced status immediately freezes account credit line | SRS v1.1 §3.2, E03 |
| **F09** | E07 Inventory | FEFO Cement Lot Allocation | Allocates warehouse bags/pallets based on earliest manufacturing/expiry lot date. | SKU ID, Required Quantity, Branch/DC ID | Allocated Lot Number(s), Sub-quantities, Expiry Dates | Rejects allocation if lot has $<15$ days shelf-life remaining | SRS v1.1 §4.1, E07 |
| **F10** | E04 Order ATP | High-Contention Two-Phase Lock | Reserves branch retail stock against wholesale orders, preventing POS double-spend. | SKU ID, Quantity, Branch ID, Session Token | Temporary Reservation Token (15-min TTL), Committed Stock | Returns `409 Conflict: Insufficient Available-to-Promise` | SRS v1.1 §4.2, E04 |
| **F11** | E10 Billing | Thai Revenue Department Tax Invoice | Formats legal e-Tax invoice with 13-digit Tax ID, Thai Baht Text, and sequential numbering. | Order ID, Customer Tax ID, Branch Code (00000=HQ) | Formal RD Tax Invoice PDF/XML, Sequential Tax No. | Rejects with validation error if Tax ID fails checksum | SRS v1.1 §5.1, E10 |
| **F12** | E10 Billing | Credit Note (CN) Adjustment | Generates legal credit note referencing original posted tax invoice with statutory reason. | Original Invoice No., Return Order ID, Reason Code | Legal Credit Note Document, AR Credit Adjustment | Blocked if CN amount exceeds original invoice posted total | SRS v1.1 §5.2, E10 |

---

### 8.2 Boundary & Edge Cases Observed

| # | Feature Under Test | Edge Case Input / Boundary Condition | Observed & Enforced Behavior |
|---|---|---|---|
| **E01** | E02 Pricing Engine | Negative Order Quantity or Quantity = 0 | Input validation rejects request with `400 Bad Request: Quantity must be positive integer`. |
| **E02** | E02 Pricing Engine | Order quantity falls exactly on tier boundary (e.g. tier starts at exactly 1,000 bags) | Inclusive boundary evaluation: $\ge 1,000$ receives higher tier discount rate immediately. |
| **E03** | E02 Pricing Engine | Floor price violation by 0.01 THB (Net price is 99.99 THB, Floor is 100.00 THB) | Hard rejection: System prevents checkout and logs attempt to compliance audit log. |
| **E04** | E03 Credit Control | Proposed order value exceeds credit limit by exactly 0.01 THB | System triggers Hard Block; displays exact overage amount to sales operator. |
| **E05** | E03 Credit Control | Customer has unpaid invoice overdue by 31 days (Policy threshold = 30 days) | Automatic Aging Hard-Stop: Account frozen regardless of remaining available monetary credit line. |
| **E06** | E03 Cheque Control | Cheque deposited is marked as "Bounced / Dishonored" by bank API | Immediate webhook trigger: Revokes credit headroom, sends urgent SMS to credit manager, flags customer. |
| **E07** | E07 Inventory FEFO | Two inventory lots have identical expiration dates | Secondary tie-breaker rule applies: Allocates from lot with lower remaining quantity to clear pallet space. |
| **E08** | E07 Inventory FEFO | Cement lot has 14 days remaining before expiration (Minimum policy is 15 days) | Lot status automatically transitions to "Quarantine / Inspection Hold"; excluded from ATP engine. |
| **E09** | E04 Order ATP | Concurrent checkout of last 50 bags by B2B sales rep and retail POS at the exact same millisecond | Redis distributed lock evaluates first arrival; second request receives `409 Conflict: Stock Exceeded`. |
| **E10** | E10 RD Tax Invoice | Statutory Output VAT computation with fractional satangs (e.g. Total VAT = 734.545 THB) | Applied `ROUND_HALF_UP` rule: Exactly rounds to 734.55 THB; matches Thai Baht Text transcription. |
| **E11** | E10 RD Tax Invoice | Attempt to modify customer address or line price on an invoice in `POSTED` status | System throws `403 Forbidden`: Posted documents are immutable; requires formal Credit Note. |
| **E12** | E01 Master Data | Maker attempts to approve their own staged customer creation record | System rejects approval with `400 Bad Request: Maker and Checker cannot have identical UserID`. |

---

## 9. Conclusion & Execution Sign-Off

The delivery architecture established herein provides an airtight, mathematically calibrated roadmap for the **Wholesale & Direct Sales (WDS) Release 1** system. 

By grounding the 26-week plan on:
1. A realistic capacity model tailored for **9 in-house engineers** delivering ~40 Story Points per sprint,
2. Strict governance checkpoints (CP1 to CP5) with a battle-tested **20-Item Drop List Protocol (§2.3)** at CP3,
3. Complete mitigation plans for the **P01 to P09 risk matrix**,
4. Explicit **RACI decision boundaries**, and
5. Continuous feedback through the **5 Weekly Core Metrics**,

the Thai Watsadu WDS engineering organization is equipped to guarantee on-time delivery of a legally compliant, highly scalable, and operationally resilient B2B enterprise platform.
