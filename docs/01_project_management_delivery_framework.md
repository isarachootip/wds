# Thai Watsadu Wholesale & Direct Sales (WDS) System — Release 1
## Deliverable 01: Project Management & Delivery Architecture Framework

---

### Executive Metadata
- **Document Identifier**: `TW-WDS-R1-DOC-01-PM-DELIVERY-FRAMEWORK`
- **Document Version**: `1.0.0 (Production / Authoritative Baseline)`
- **Scope Baseline**: SRS v1.1 (409 Total System Requirements; Release 1 Scope: 249 Requirements)
- **Target Delivery Horizon**: 26 Weeks (6 Calendar Months) | 13 Sprints (S0 to S12, 2-Week Cadence)
- **Engineering Resource Pool**: 9 In-House Engineers (Cross-functional Scrum Unit)
- **Workload Sizing Baseline**: 440 Delivered Story Points (SP) + 40 SP Contingency Buffer = 480 SP Gross Capacity
- **Statutory Authority**: Revenue Department of Thailand (RD) / Electronic Transactions Development Agency (ETDA)
- **Corporate Entity**: CRC Thai Watsadu Company Limited (Central Retail Corporation)
- **Confidentiality**: Strictly Confidential — For Internal Project Team & Steering Committee Distribution Only

---

## Document Overview & Executive Summary

The Wholesale & Direct Sales (WDS) System represents an enterprise-critical digital transformation initiative for Thai Watsadu (ไทวัสดุ), enabling high-velocity, commercially governed B2B transactions across an extensive network of 80+ retail mega-stores and regional Distribution Centers (DCs). 

This document defines the authoritative, production-grade **Project Management & Delivery Architecture Framework** for **Release 1 (R1)**. Built to satisfy the uncompromising operational demands of commercial contractor sales, this framework details the mathematical capacity model, sprint-by-sprint engineering execution roadmap, verifiable demo criteria, five formal governance stage-gates (CP1–CP5), an automated 20-item scope reduction protocol (§2.3 Drop List), a rigorous risk mitigation matrix (P01–P09), a cross-functional RACI decision authority matrix, and weekly metric scorecards.

---

# Table of Contents
1. [Executive Summary & Delivery Model](#1-executive-summary--delivery-model)
   - 1.1 [Project Context & Strategic Objectives](#11-project-context--strategic-objectives)
   - 1.2 [Scope Baseline & Release 1 Boundaries](#12-scope-baseline--release-1-boundaries)
   - 1.3 [Engineering Capacity Model (9 In-House Engineers)](#13-engineering-capacity-model-9-in-house-engineers)
   - 1.4 [Capacity Calibration, Velocity Baseline & Buffer Economics](#14-capacity-calibration-velocity-baseline--buffer-economics)
   - 1.5 [Dual-Track Agile Scrum Delivery Model](#15-dual-track-agile-scrum-delivery-model)
2. [Sprint-by-Sprint Breakdown (S0–S12) & 12 Epics Mapping](#2-sprint-by-sprint-breakdown-s0s12--12-epics-mapping)
   - 2.1 [The 12 Release 1 Epics Definition & Sizing](#21-the-12-release-1-epics-definition--sizing)
   - 2.2 [Master Delivery Roadmap & Epic Distribution](#22-master-delivery-roadmap--epic-distribution)
   - 2.3 [Granular Sprint Specifications (S0 through S12)](#23-granular-sprint-specifications-s0-through-s12)
   - 2.4 [End-to-End Epic Traceability Matrix](#24-end-to-end-epic-traceability-matrix)
3. [Sprint Deliverables & Verifiable Demo Criteria](#3-sprint-deliverables--verifiable-demo-criteria)
   - 3.1 [Live Demonstration Policy & Execution Protocol](#31-live-demonstration-policy--execution-protocol)
   - 3.2 [Granular Sprint Demonstration Specifications (S0 to S12)](#32-granular-sprint-demonstration-specifications-s0-to-s12)
4. [Governance Checkpoints (CP1 to CP5)](#4-governance-checkpoints-cp1-to-cp5)
   - 4.1 [Stage-Gate Governance Architecture](#41-stage-gate-governance-architecture)
   - 4.2 [Comprehensive Checkpoint Gate Specifications](#42-comprehensive-checkpoint-gate-specifications)
   - 4.3 [Checkpoint Audit Scoring & Remediation Protocol](#43-checkpoint-audit-scoring--remediation-protocol)
5. [The 20-Item Drop List Protocol (§2.3)](#5-the-20-item-drop-list-protocol-23)
   - 5.1 [Trigger Criteria & Invocation Governance](#51-trigger-criteria--invocation-governance)
   - 5.2 [Scope Realignment Council (SRC) Operating Rules](#52-scope-realignment-council-src-operating-rules)
   - 5.3 [The 20-Item Scope Reduction Priority Matrix](#53-the-20-item-scope-reduction-priority-matrix)
   - 5.4 [Capacity Shedding Tiers & Schedule Recovery Dynamics](#54-capacity-shedding-tiers--schedule-recovery-dynamics)
   - 5.5 [Inviolate Statutory Core Protection Guarantee](#55-inviolate-statutory-core-protection-guarantee)
6. [Comprehensive Risk Management Matrix (P01 to P09)](#6-comprehensive-risk-management-matrix-p01-to-p09)
   - 6.1 [Risk Management Methodology & Severity Scoring](#61-risk-management-methodology--severity-scoring)
   - 6.2 [Deep-Dive Risk Profiles & Action Plans (P01–P09)](#62-deep-dive-risk-profiles--action-plans-p01p09)
   - 6.3 [Key Risk Indicators (KRIs) & Early Warning Dashboard](#63-key-risk-indicators-kris--early-warning-dashboard)
7. [RACI Decision Matrix](#7-raci-decision-matrix)
   - 7.1 [Governance Stakeholders & Role Taxonomy](#71-governance-stakeholders--role-taxonomy)
   - 7.2 [The 14 Governance Activities RACI Matrix](#72-the-14-governance-activities-raci-matrix)
   - 7.3 [Deadlock Resolution & Escalation Procedures](#73-deadlock-resolution--escalation-procedures)
8. [Project Governance Cadence & 5 Weekly Core Metrics](#8-project-governance-cadence--5-weekly-core-metrics)
   - 8.1 [Operational Agile Governance Cadence](#81-operational-agile-governance-cadence)
   - 8.2 [The 5 Weekly Core Project Metrics](#82-the-5-weekly-core-project-metrics)
   - 8.3 [Weekly Executive Scorecard Reporting Template](#83-weekly-executive-scorecard-reporting-template)

---

# 1. Executive Summary & Delivery Model

### 1.1 Project Context & Strategic Objectives
Thai Watsadu (ไทวัสดุ), the flagship home improvement and building materials retail subsidiary of Central Retail Corporation (CRC), commands an extensive physical network comprising over 80 mega-stores and regional Distribution Centers across Thailand. While Thai Watsadu's retail point-of-sale infrastructure excels in high-volume B2C walk-in retail, commercial contractor, property developer, and institutional B2B sales demand a fundamentally specialized wholesale transaction engine.

The **Wholesale & Direct Sales (WDS)** system is an enterprise platform engineered to centralize, automate, and govern commercial B2B transactions. The strategic imperatives governing the WDS Release 1 platform include:
1. **Catalog Scalability**: Real-time searching and dynamic quoting across $>100,000$ active SKUs, handling complex Units of Measure (UOM) conversions (e.g., pieces to cartons, pallets to truckloads, bags to metric tons).
2. **Pricing Governance**: Eliminating margin leakage by enforcing tiered volume discount curves, geographic zone freight matrices, customer tier baselines, and absolute cost-floor price controls.
3. **Credit & Liquidity Protection**: Mitigating bad debt through real-time available credit validation, automated hard-stops on delinquent accounts ($>30$ days overdue), and rigorous tracking of Post-Dated Cheques (PDC).
4. **Inventory Contention & Traceability**: Enabling sub-second Available-To-Promise (ATP) reservations, eliminating race-condition double bookings between store retail counters and direct wholesale orders, and enforcing First-Expired, First-Out (FEFO) picking for perishables like Portland cement.
5. **Statutory Tax Compliance**: Generating legally binding, unalterable Electronic Tax Invoices conforming to Thai Revenue Department (กรมสรรพากร) standards, featuring continuous sequential numbering, precise 7% Output VAT rounding, and exact Thai Baht Text transcription.

### 1.2 Scope Baseline & Release 1 Boundaries
The WDS System Requirements Specification (SRS v1.1) enumerates **409 discrete functional and non-functional requirements**. To balance business imperatives with technical stability and risk, executive leadership has established a phased rollout strategy with strict scope baseline consistency:

- **Release 1 (R1 Scope Baseline)**: **249 prioritized requirements** sized at exactly **440 Story Points (SP)** representing the critical B2B wholesale transaction spine across 12 Core Epics (E13, E01, E02, E03, E07, E04, E10, E08, E12, E11, E14, E15). This committed scope incorporates the active Sprints S6–S11 backlog containing 20 pre-identified non-critical operational features (totaling 152 SP) eligible for structured scope shedding under the Drop List Protocol at Checkpoint CP3 without attempting to retroactively drop past S1–S5 work.
- **Release 1.1 & Release 2.0 (Upfront Deferred Scope)**: **160 non-critical requirements** deferred upfront during project initiation (e.g., consumer marketplace syndication, automated warehouse robotic picking, third-party vendor self-onboarding portal, and AI generative quote authoring), which are completely excluded from the 440 SP delivery baseline.
- **Delivery Timebox**: 26 calendar weeks (6 operational months), divided into 13 two-week sprints ($S0$ through $S12$).
- **Go-Live Milestone**: Week 26 Cutover with a 3-Branch Pilot Launch (Bangna, Bang Bua Thong, Rattanathibet) and Regional Distribution Center (Wang Noi CDC) direct-to-site dispatch.

### 1.3 Engineering Capacity Model (9 In-House Engineers)
Release 1 is executed by an internal, highly specialized cross-functional engineering unit comprising 9 full-time equivalents (FTEs). To avoid agile capacity anti-patterns and ensure strict delivery governance, the team structure formally distinguishes between **Feature Coding Capacity (6.5 FTE)** and **Supporting/Governance Capacity (2.5 FTE)**:

```
+----------------------------------------------------------------------------------------------------+
|                                RECALIBRATED 9-FTE RESOURCE ALLOCATION                              |
+----------------------------------------------------------------------------------------------------+
| A. FEATURE CODING CAPACITY (6.5 FTE)                                                               |
|   - 1 Dev Lead / Architect      : 0.5 Coding FTE (50% Architecture, PR Reviews, SteerCo, ARB)     |
|   - 4 Backend Engineers (BE1–4) : 4.0 Coding FTE (Master Data, Pricing, Credit, Inventory, Tax)    |
|   - 2 Frontend Engineers (FE1–2): 2.0 Coding FTE (Admin/Finance Portals, Sales Desk/Ops Portals)   |
|                                                                                                    |
| B. SUPPORTING & PLATFORM CAPACITY (2.5 FTE)                                                        |
|   - 1 QA Automation Lead        : 1.0 Supporting FTE (Playwright, E2E, Mock Services, RD Vectors)  |
|   - 1 DevOps / Platform Lead    : 1.0 Supporting FTE (CI/CD Gates, Neon DB, Redis/Kafka, K8s infra)|
|   - Dev Lead Governance         : 0.5 Governance FTE (Scrum Ceremonies, Technical Risk Management) |
+----------------------------------------------------------------------------------------------------+
```

#### Detailed Role Allocation & Capacity Classification

| Role Title | Headcount | Coding FTE | Supporting FTE | Core Domain Responsibilities | Skill Profile & Tooling Stack |
|---|:---:|:---:|:---:|---|---|
| **Dev Lead / Principal Architect** | 1 | 0.5 | 0.5 | Technical architecture governance, cross-engine orchestration, DB migration reviews, PR approvals (0.5 Coding FTE); SteerCo, ARB governance, Scrum rituals, technical risk management (0.5 Governance FTE). | TypeScript/Node.js, PostgreSQL, Distributed Systems, High-Concurrency Locking. |
| **Backend Engineer 1 (BE1)** | 1 | 1.0 | 0.0 | **E01 Master Data, E13 Security/Audit & E12 Returns**: Customer/Vendor/SKU master schemas, Maker-Checker staging workflow, immutable audit log triggers, catalog sync I0a, RMA restock transactions. | NestJS/TypeScript, PostgreSQL triggers, JSONB diffing, Search Indexing, Prisma. |
| **Backend Engineer 2 (BE2)** | 1 | 1.0 | 0.0 | **E02 Dynamic Pricing Engine & E11 Direct Ship**: Tiered volume breaks, zone freight matrix calculation, floor price guardrails, discount authorization limits, effective-dated VAT, direct supplier EDI. | NestJS, Decimal.js, High-throughput calculation pipelines, Redis caching. |
| **Backend Engineer 3 (BE3)** | 1 | 1.0 | 0.0 | **E03 Credit & Cheque Control & E14 Reporting**: Real-time credit limit headroom engine, hard/soft blocking, aging AR analysis, Post-Dated Cheque (PDC) lifecycle ledger, ภ.พ.30 tax extract engine. | NestJS, Distributed Transactions, State Machines, Financial Ledgering, SQL OLAP. |
| **Backend Engineer 4 (BE4)** | 1 | 1.0 | 0.0 | **E04 Order ATP, E07 Inventory FEFO, E10 Tax & E08 Fulfillment**: Two-phase inventory locks, FEFO cement lot allocation, statutory Thai RD e-Tax invoice generation, Baht Text algorithm, warehouse pick/pack terminal engine. | NestJS, Redis Distributed Locks (Redlock), PostgreSQL `SELECT FOR UPDATE`, PDF/XML generation. |
| **Frontend Engineer 1 (FE1)** | 1 | 1.0 | 0.0 | **Back-Office Admin, Governance & Finance Portals**: Maker-Checker approval desk, RBAC administration, Credit risk management console, PDC Cheque Register, Statutory Tax Invoice viewer & reprint station, RMA desk, ภ.พ.30 VAT summary grid. | React / Next.js 14, Tailwind CSS, TanStack Table, React Hook Form, Zustand, Enterprise Admin UI. |
| **Frontend Engineer 2 (FE2)** | 1 | 1.0 | 0.0 | **Sales Desk, Branch Operations & Logistics Portals**: Fast-entry Sales Quotation/Order desk, real-time ATP lookup, pricing simulator, FEFO lot inspector, warehouse pick/pack staging console, Gate Pass viewer, responsive mobile web portal, Driver POD e-sign. | React / Next.js 14, Zustand, Responsive Mobile Web, HTML5 Canvas, Barcode scanner integration. |
| **QA Automation Lead (QA)** | 1 | 0.0 | 1.0 | Automated integration test harnesses, mock service virtualizers (I0a–I0e), Playwright/Cypress E2E test suites, RD Tax calculation precision verification, k6 concurrency load testing. | TypeScript, Playwright, Jest, Supertest, Postman/Newman, k6 Performance Testing. |
| **DevOps / Platform Lead (DO)** | 1 | 0.0 | 1.0 | CI/CD automation pipelines, Neon PostgreSQL cloud DB, Redis cache clusters, Kafka event streaming brokers, Docker/Kubernetes container orchestration, APM & logging (Prometheus/Grafana/Loki). | GitHub Actions, Terraform, Kubernetes, Helm, Prometheus/Grafana, ELK/Loki. |
| **TOTAL** | **9** | **6.5** | **2.5** | **Dedicated Cross-Functional In-House Delivery Unit** | — |

### 1.4 Capacity Calibration, Velocity Baseline & Buffer Economics

#### 1.4.1 Mathematical Capacity Model
- **Sprint Duration**: 2 Calendar Weeks (10 Business Days).
- **Gross Team Capacity**: $9 \text{ Engineers} \times 10 \text{ Days} \times 8 \text{ Hours/Day} = 720 \text{ Gross Hours per Sprint}$.
- **Gross Feature Coding Hours**: $6.5 \text{ Coding FTE} \times 80 \text{ Gross Hours} = 520 \text{ Gross Coding Hours per Sprint}$.
- **Focus Factor Calibration**: An enterprise focus factor of **70% (0.70)** is applied to account for backlog refinement, architectural spikes, sprint rituals (planning, daily standups, review, retro), pull request turnarounds, and CI/CD triage:
  $$\text{Net Productive Coding Hours} = 520 \times 0.70 = 364 \text{ Net Coding Hours / Sprint}$$
- **Supporting Capacity Hours**: Non-coding platform and quality activities are executed within the supporting capacity pool:
  $$\text{Net Supporting Capacity} = (1.0 \text{ QA} + 1.0 \text{ DevOps} + 0.5 \text{ Dev Lead Gov}) \times 80 \times 0.70 = 140 \text{ Net Supporting Hours / Sprint}$$
  $$\text{Total Net Engineering Hours (Team)} = 364 \text{ Coding} + 140 \text{ Supporting} = 504 \text{ Net Hours / Sprint}$$
- **Story Point Baseline Calibration**: The sizing baseline calibrates **$1 \text{ Story Point (SP)} \approx 9.1 \text{ Net Coding Hours}$** (derived from $\frac{364 \text{ Net Coding Hours}}{40 \text{ SP}}$):
  $$\text{Sprint Velocity Baseline} = \frac{364 \text{ Net Coding Hours}}{9.1 \text{ Hours / SP}} = 40.0 \text{ Story Points / Sprint}$$

#### 1.4.2 Total Delivery Budget & Contingency Economics
- **Total Available Sprints**: 13 Sprints ($S0$ through $S12$).
- **Sprint S0 (Platform Tooling & Foundations)**: Dedicated strictly to foundational architecture, CI/CD pipeline automation, base entity schemas, and developer tooling (Budgeted at 25 SP, executed primarily by DevOps, Dev Lead, with initial schema scaffolding by BE).
- **Sprints S1 to S11 (11 Core Delivery Sprints)**: Dedicated to functional epic development and hardening:
  $$11 \text{ Sprints} \times 40 \text{ SP/Sprint} = 440 \text{ Delivered Functional Story Points}$$
- **Sprint S12 (Final Sprint)**: Dedicated to live cutover, production data delta migration, and branch pilot hypercare (Budgeted at 20 SP).
- **Gross Engineering Delivery Ceiling**: $25 + 440 + 20 = 485 \text{ Total Story Points}$.
- **Release 1 Scope Sizing**: The 249 functional and non-functional requirements are sized at exactly **440 Story Points**.
- **Contingency Buffer Reserve**:
  $$\text{Reserve Buffer} = 480 \text{ Planned Operational Capacity} - 440 \text{ Scope Sizing} = 40 \text{ Story Points (9.1% Buffer)}$$
  This 40 SP reserve provides an operational cushion against unforeseen integration complexities with Thai Watsadu's legacy ERP (SAP S/4HANA) and merchandising feeds.

```
+----------------------------------------------------------------------------------------------------+
|                                    CAPACITY & BUFFER ALLOCATION                                    |
+----------------------------------------------------------------------------------------------------+
| [S0: 25 SP] Foundation & Infrastructure Setup (Platform/DevOps/Lead)                              |
| [S1 to S11: 440 SP Planned Velocity] ------------------------------> [440 SP Scope Delivered]     |
| [Contingency Buffer Reserve: 40 SP] -------------------------------> [Absorbs Variance / Spill]    |
| [S12: 20 SP] Production Cutover, Master Data Delta & Pilot Launch (Cutover Team)                   |
| TOTAL CAPACITY: 485 SP  |  BASELINE SCOPE: 440 SP  |  SAFETY BUFFER: 40 SP (9.1%)                  |
+----------------------------------------------------------------------------------------------------+
```

#### 1.4.3 Frontend vs. Backend Capacity Calibration & 12 Epics Distribution
In an enterprise B2B wholesale transaction platform, the architectural profile is backend-intensive (statutory tax algorithms, credit exposure ledgers, multi-lock Redis ATP, FEFO cement lot sorting, and Revenue Department compliance). The engineering workload reflects an approximate **68% Backend / 32% Frontend** ratio.

- **Backend Coding Capacity (4.5 FTE: 4 BE + 0.5 Dev Lead)**:
  $$\text{Net Backend Hours} = 4.5 \text{ FTE} \times 80 \times 0.70 = 252 \text{ Net Hours / Sprint}$$
  $$\text{Backend Velocity} = \frac{252 \text{ Hours}}{9.1 \text{ Hours/SP}} \approx 27.7 \text{ SP / Sprint} \implies 11 \text{ Sprints} \times 27.7 \approx \mathbf{305 \text{ SP Total}}$$
- **Frontend Coding Capacity (2.0 FTE: FE1 + FE2)**:
  $$\text{Net Frontend Hours} = 2.0 \text{ FTE} \times 80 \times 0.70 = 112 \text{ Net Hours / Sprint}$$
  $$\text{Frontend Velocity} = \frac{112 \text{ Hours}}{9.1 \text{ Hours/SP}} \approx 12.3 \text{ SP / Sprint} \implies 11 \text{ Sprints} \times 12.3 \approx \mathbf{135 \text{ SP Total}}$$
- **Capacity Alignment**:
  $$\mathbf{305 \text{ BE SP}} + \mathbf{135 \text{ FE SP}} = \mathbf{440 \text{ SP Delivered}}$$
  This balanced calibration eliminates frontend delivery bottlenecks and ensures UI implementation perfectly paces backend API readiness.

The table below delineates the exact capacity distribution of the **2 Frontend Engineers (FE1 and FE2)** alongside Backend Leads across all 12 Core Epics:

| Epic ID | Epic Title & Domain Focus | Total SP | Backend SP (Lead) | Frontend SP (Lead) | Specific Frontend Deliverable Scope & UI Components | Sprints |
|:---:|---|:---:|:---:|:---:|---|:---:|
| **E13** | Security, RBAC & Immutable Audit Trail | **30 SP** | **25 SP** (BE1/Lead) | **5 SP** (FE1) | Back-office RBAC user/role administration console, permission assignment matrix, and audit event inspection viewer. | S0, S1 |
| **E01** | Master Data Management & Maker-Checker | **40 SP** | **25 SP** (BE1) | **15 SP** (FE1) | Maker-Checker staging queue, customer/vendor profile forms with 13-digit Thai Tax ID validation, and visual side-by-side JSON diff viewer. | S1, S2 |
| **E02** | Dynamic Pricing & Zone Freight Engine | **55 SP** | **40 SP** (BE2) | **15 SP** (FE2) | Interactive pricing calculator desk, tiered volume simulation tool, freight zone lookup, and floor price warning banners. | S2, S3 |
| **E03** | Real-Time Credit Headroom & Cheque Control | **50 SP** | **35 SP** (BE3) | **15 SP** (FE1) | Credit risk controller desk, real-time exposure gauge, PDC Cheque Register lifecycle modal, and soft-block override workflow UI. | S3, S4 |
| **E07** | Inventory FEFO & Perishable Lot Control | **45 SP** | **33 SP** (BE4) | **12 SP** (FE2) | Cement lot shelf-life inspector, batch expiration countdown dashboard, and warehouse quarantine hold station. | S4, S5 |
| **E04** | Order Management & High-Contention ATP | **60 SP** | **42 SP** (BE4/Lead) | **18 SP** (FE2) | High-velocity Sales Order entry desk, keyboard-optimized SKU lines, real-time ATP reservation check, and manual split-dispatch selector. | S5, S6 |
| **E10** | Revenue Dept Tax Invoice & Billing Engine | **50 SP** | **35 SP** (BE4) | **15 SP** (FE1) | Statutory Tax Invoice viewer, PDF/A-3 preview with Thai Baht Text transcription, invoice reprint logging station, and tax register UI. | S6, S7 |
| **E08** | Warehouse Fulfillment & Dispatch Console | **35 SP** | **23 SP** (BE4) | **12 SP** (FE2) | Warehouse staging bay pick/pack terminal, bin-sequence pick slip viewer, Gate Pass barcode console, and weighbridge weight logger. | S7, S9 |
| **E12** | Return, Restocking & Credit Note Engine | **25 SP** | **17 SP** (BE1) | **8 SP** (FE1) | Store RMA customer service desk, return reason checklist, inspection grading sign-off modal (Grade A/B/Damage), and Credit Note preview. | S8 |
| **E11** | Direct Ship Integration & B2B Sales Mobility | **30 SP** | **18 SP** (BE2) | **12 SP** (FE2) | Responsive mobile web portal for field sales reps (quotations & customer credit check) and driver Proof of Delivery (POD) signature canvas. | S9 |
| **E14** | Operational Reporting & ภ.พ.30 Dashboards | **20 SP** | **12 SP** (BE3) | **8 SP** (FE1) | Statutory monthly ภ.พ.30 VAT report grid, real-time AR Aging matrix dashboard, and executive CSV/PDF export interface. | S10 |
| **E15** | Integration, Hardening & Cutover Support | **—** *(40 SP Buffer)*| Cross-Engine | Cross-Engine | Defect triage UI fixes, cross-browser compatibility tuning (Chrome/Safari), and pilot store user acceptance testing (UAT) sign-off. | S0,S8,S11,S12 |
| **TOTAL**| **Delivered Functional Story Points** | **440 SP** | **305 SP** | **135 SP** | **FE1: 66 SP (Finance/Admin) \| FE2: 69 SP (Sales/Operations)** | **S1–S11** |

### 1.5 Dual-Track Agile Scrum Delivery Model
To ensure developers never face ambiguous specifications or blocking UX dependencies, WDS operates on a **Dual-Track Agile Scrum** framework:
1. **Discovery Track (Sprint $N+1$)**: The Product Owner (PO), Solution Architect (SA), and Lead PM refine user stories, construct OpenAPI contract schemas, finalize wireframes, and validate interface payloads with external enterprise teams one full sprint ahead of development.
2. **Delivery Track (Sprint $N$)**: The engineering unit focuses exclusively on groomed, validated user stories that satisfy the strict **Definition of Ready (DoR)**.
3. **Continuous Integration & Automated Testing**: Every pull request undergoes automated linting, security vulnerability scanning, and unit/integration testing with strict code coverage enforcement ($\ge 80\%$ on core calculation modules).

---

# 2. Sprint-by-Sprint Breakdown (S0–S12) & 12 Epics Mapping

### 2.1 The 12 Release 1 Epics Definition & Sizing

The 249 Release 1 requirements are organized into 12 core epics. Each epic represents a critical structural component of the WDS architecture:

```
+-----+-------------------------------------------------------+-----------+-----------+-----------+-------------------------+
| Epic| Epic Name & Strategic Focus                           | Total SP  | BE SP     | FE SP     | Primary Engineering Lead|
+-----+-------------------------------------------------------+-----------+-----------+-----------+-------------------------+
| E13 | Security, RBAC & Immutable Audit Delta Trail          | 30 SP     | 25 SP     | 5 SP      | BE1 / FE1 / Dev Lead    |
| E01 | Master Data Management with Maker-Checker Engine      | 40 SP     | 25 SP     | 15 SP     | BE1 / FE1               |
| E02 | Dynamic Pricing & Zone Freight Surcharge Engine       | 55 SP     | 40 SP     | 15 SP     | BE2 / FE2               |
| E03 | Real-Time Credit Headroom & Cheque Control Engine     | 50 SP     | 35 SP     | 15 SP     | BE3 / FE1               |
| E07 | Inventory FEFO Allocation & Perishable Lot Control    | 45 SP     | 33 SP     | 12 SP     | BE4 / FE2               |
| E04 | Order Management & High-Contention ATP Engine         | 60 SP     | 42 SP     | 18 SP     | BE4 / FE2 / Dev Lead    |
| E10 | Billing & Thai Revenue Department Tax Invoice Engine  | 50 SP     | 35 SP     | 15 SP     | BE4 / FE1               |
| E08 | Warehouse Fulfillment & Direct-to-Site Dispatch       | 35 SP     | 23 SP     | 12 SP     | BE4 / FE2               |
| E12 | Returns, Restocking Inspection & Credit Note Engine   | 25 SP     | 17 SP     | 8 SP      | BE1 / FE1               |
| E11 | Direct Ship Integration & B2B Sales Mobility          | 30 SP     | 18 SP     | 12 SP     | BE2 / FE2               |
| E14 | Operational Reporting, BI Analytics & ภ.พ.30 Summary  | 20 SP     | 12 SP     | 8 SP      | BE3 / FE1               |
| E15 | Cross-Cutting Hardening, Integration & Pilot Cutover   | [Buffer]  | [Platform]| [Platform]| Dev Lead / DevOps / QA  |
+-----+-------------------------------------------------------+-----------+-----------+-----------+-------------------------+
|     | TOTAL FUNCTIONAL SCOPE (S1–S11)                       | 440 SP    | 305 SP    | 135 SP    | Full Delivery Unit      |
+-----+-------------------------------------------------------+-----------+-----------+-----------+-------------------------+
```
*(Note: Epic E15 represents the 40 SP operational reserve buffer and cross-cutting infrastructure, tooling, and cutover activities spanning S0 [25 SP], S8/S11 [QA Hardening], and S12 [20 SP Cutover/Pilot], executed by the 2.5 Supporting/Governance FTE platform pool).*

### 2.2 Master Delivery Roadmap & Epic Distribution

The delivery roadmap spans 26 weeks across 13 sprints, strategically phased to establish core transaction engines before layering fulfillment, reporting, and mobility:

```
26-WEEK / 13-SPRINT TIMELINE ROADMAP
Week:   01  03  05  07  09  11  13  15  17  19  21  23  25  26
Sprint: [S0][S1][S2][S3][S4][S5][S6][S7][S8][S9][S10][S11][S12]
Gates:   ▲       ▲           ▲           ▲             ▲     ★ Go-Live
        CP1     CP2         CP3         CP4           CP5
        
Epic Allocation:
E13 Security/Audit  [S0][S1]
E01 Master Data         [S1][S2]
E02 Pricing Engine          [S2][S3]
E03 Credit/Cheque               [S3][S4]
E07 Inventory/FEFO                  [S4][S5]
E04 Order / ATP                         [S5][S6]
E10 Tax Invoicing                           [S6][S7]
E08 Fulfillment                                 [S7]    [S9]
E12 Returns/RMA                                     [S8]
E11 Direct Ship/Mobile                                  [S9]
E14 Reporting/BI                                            [S10]
E15 Integration/UAT [S0]    [S2]    [S4]        [S8]    [S10][S11][S12]
```

### 2.3 Granular Sprint Specifications (S0 through S12)

#### Sprint 0 (Weeks 1–2): Foundation, Tooling Baseline & Security Core
- **Target Velocity**: 25 SP
- **Epics Covered**: E13 (Security/Audit), E15 (Integration/Hardening)
- **Primary Objectives**:
  - Provision multi-environment cloud infrastructure: Development, Staging, UAT, and Production on Neon PostgreSQL, Redis cluster, and Kafka event streaming brokers.
  - Implement automated CI/CD pipelines in GitHub Actions with mandatory automated gates: ESLint, TypeScript compilation, Prettier, SonarQube static analysis, and Git commit hook enforcing bracketed requirement IDs (e.g., `[FR-E13-001]`).
  - Construct base database schema migration harness using Prisma/Kysely with strict column naming conventions, UTC timestamp triggers, and UUIDv7 primary keys.
  - Establish base Role-Based Access Control (RBAC) data models and JWT authentication framework with bcrypt password hashing and token revocation lists.
  - Deploy immutable audit log tables with PostgreSQL row-level security triggers preventing `UPDATE` and `DELETE` operations.

#### Sprint 1 (Weeks 3–4): Master Data & Maker-Checker Staging Engine
- **Target Velocity**: 38 SP
- **Epics Covered**: E01 (Master Data), E13 (Security/Audit), E15 (Integration)
- **Primary Objectives**:
  - Architect Master Data schemas: Customer Master (13-digit Thai Tax ID, Branch Code 00000=Head Office, legal billing/shipping addresses, WDS Tier assignment), Vendor Master, and Item Master.
  - Implement two-man rule **Maker-Checker engine**: Draft master changes are written to staging tables (`master_staging`); Checker reviews unified visual diff and signs off with cryptographic user stamping. System hard-rejects self-approval.
  - Construct catalog batch parser prototype for Interface I0a (Merchandising Feed, 100,000 active SKUs), handling multi-level category taxonomy, packaging hierarchies, and UOM conversions.
  - Deliver Back-Office Admin UI (FE1) for Maker-Checker queue, customer profile registration, and tax ID validation against checksum rules.

#### Sprint 2 (Weeks 5–6): Dynamic Pricing Engine Core & Catalog Ingestion
- **Target Velocity**: 42 SP *(Checkpoint CP2 Milestone)*
- **Epics Covered**: E02 (Pricing Engine), E01 (Master Data), E15 (Integration)
- **Primary Objectives**:
  - Develop Dynamic Pricing Engine: Tiered volume breaks (quantity-based and order-value slabs), customer trade tier discounts (Tier 1 Contractor, Tier 2 Project Developer, Tier 3 Institutional).
  - Implement Absolute Floor Price Guardrail: Engine evaluates unit cost + minimum mandatory margin; any proposed price falling below floor is rejected with a hard validation error requiring Level-4 Executive override.
  - Implement Effective-Dated Tax Engine: Configurable VAT rate table evaluated against the binding tax point date of the transaction (defaulting to current statutory 7.00% VAT).
  - Ingest 100,000 SKU catalog feed via I0a batch worker into PostgreSQL with Redis caching for instant pricing lookups.
  - Deliver Interactive Pricing Calculator UI (FE2) for sales representatives to simulate line-item quotes with real-time tax and margin previews.

#### Sprint 3 (Weeks 7–8): Credit Headroom Engine & Zone Freight Matrix
- **Target Velocity**: 40 SP
- **Epics Covered**: E03 (Credit/Cheque Control), E02 (Pricing Engine)
- **Primary Objectives**:
  - Architect Credit Ledger & Headroom Engine: Real-time calculation of credit exposure ($\text{Exposure} = \text{Open Orders} + \text{Unbilled Dispatches} + \text{Unpaid Invoices} - \text{Cleared Cheques}$).
  - Implement Hard Credit Blocking: Automated freeze on quotation-to-order conversion when credit limit is exceeded by even 0.01 THB or when an existing invoice is delinquent $>30$ days.
  - Construct Post-Dated Cheque (PDC) Register: Multi-state cheque lifecycle management (`RECEIVED`, `DEPOSITED`, `CLEARED`, `BOUNCED`, `REPLACED`).
  - Develop Zone-Based Freight Matrix: Calculation of delivery fees across 80+ store catchment zones, incorporating distance radii, flat-bed heavy truck surcharges, and crane offloading fees.
  - Deliver Credit Risk Desk UI (FE1) for credit controllers to monitor exposure, log received cheques, and initiate credit review workflows.

#### Sprint 4 (Weeks 9–10): Inventory FEFO Engine & Credit Exception Overrides
- **Target Velocity**: 40 SP
- **Epics Covered**: E07 (Inventory/FEFO), E03 (Credit/Cheque Control), E15 (Integration)
- **Primary Objectives**:
  - Develop First-Expired, First-Out (FEFO) Lot Allocation Engine for perishable building supplies (e.g., Portland Type 1 cement bags, chemical sealants, tile grouts).
  - Enforce batch shelf-life safety rules: Cement batches with $<15$ days remaining shelf-life are automatically excluded from ATP and placed on "Inspection Hold / Quarantine".
  - Construct Credit Exception Override Workflow: Soft-blocked orders can be temporarily released through a multi-tiered approval hierarchy requiring manager digital sign-off with OTP verification.
  - Implement Interface I0b (Retail Store Stock) sync worker to pull on-hand balances across retail store ERP and regional DCs.
  - Deliver FEFO Lot Inspector & Credit Release Portal (FE1/FE2) displaying expiring inventory batches and pending manager override queues.

#### Sprint 5 (Weeks 11–12): Order Management, ATP Engine & Contention Resolution
- **Target Velocity**: 42 SP *(Checkpoint CP3 Gate & Drop List Trigger)*
- **Epics Covered**: E04 (Order Management), E07 (Inventory/FEFO)
- **Primary Objectives**:
  - Implement Available-to-Promise (ATP) Engine: Sub-second calculation incorporating store floor stock, safety stock buffers, and incoming purchase orders.
  - Construct High-Contention Locking: Two-phase atomic reservation using Redis distributed mutex locks paired with PostgreSQL `SELECT ... FOR UPDATE` row locks, preventing race condition double-selling between walk-in retail POS customers and wholesale sales reps.
  - Implement Split-Shipment logic: Automated splitting of order lines between Store Cross-Dock, Regional DC Direct-to-Site, and Direct Vendor Delivery.
  - Build Sales Order Desk UI (FE2) supporting rapid SKU line entry, keyboard shortcuts, live ATP validation, and order submission.

#### Sprint 6 (Weeks 13–14): Statutory Tax Invoicing & Thai Revenue Dept Engine
- **Target Velocity**: 40 SP
- **Epics Covered**: E10 (Tax Invoicing), E04 (Order Management)
- **Primary Objectives**:
  - Construct Thai Revenue Department Statutory Tax Invoice Generator: Continuous sequential tax invoice numbering with zero gaps, formatted per branch code (e.g., `INV-BKK01-202609-00042`).
  - Implement precision Output VAT Engine: Half-up rounding at 2 decimal places (`ROUND_HALF_UP`) with satang accuracy; integration of standard Thai Baht Text transcription algorithm verified against Revenue Department test vectors.
  - Implement Document Immutability Engine: Posted tax invoices are locked cryptographically; database update triggers block any direct modification of line items, quantities, prices, or tax totals.
  - Generate statutory PDF/A-3 and XML formats compliant with Thailand e-Tax Invoice standards.
  - Deliver Invoice Viewer & Print Station UI (FE1/FE2) for branch cashiers and accounting officers.

#### Sprint 7 (Weeks 15–16): Warehouse Fulfillment, Dispatch & Financial Credit Notes
- **Target Velocity**: 38 SP
- **Epics Covered**: E08 (Fulfillment), E10 (Tax Invoicing)
- **Primary Objectives**:
  - Develop Warehouse Pick, Pack, and Staging Engine: Automated generation of heavy material pick-lists sorted by warehouse bin location and heavy goods staging bays.
  - Implement Delivery Order (DO) and Gate Pass generation with weighbridge gross/tare weight recording to verify bulk material tonnage (e.g., sand, gravel, rebar).
  - Construct Statutory Credit Note (CN) and Debit Note (DN) Engine: Formal downward or upward adjustment documents linked back to the original immutable tax invoice with statutory reason codes.
  - Deliver Warehouse Dispatch Station UI (FE2) and Financial Adjustment Desk (FE1).

#### Sprint 8 (Weeks 17–18): Return Merchandise Authorization (RMA) & ERP/POS Stubs
- **Target Velocity**: 38 SP *(Checkpoint CP4 Core Feature Freeze)*
- **Epics Covered**: E12 (Return/Refund), E15 (Integration/Hardening)
- **Primary Objectives**:
  - Develop Return Merchandise Authorization (RMA) workflow: Verification against original delivery lot, return reason validation, and branch inspection grading (Grade A $\to$ Restock to ATP; Grade B $\to$ Clearance; Damaged $\to$ Write-off).
  - Implement automated restocking transactions restoring Grade A returned inventory back to available ATP inventory.
  - Build Integration Test Harness & Production Stubs for Interface I0d (POS Cashier Collections) and Interface I0e (General Ledger & AR Financial ERP Posting).
  - Deliver RMA Return Processing UI (FE1/FE2) for store customer service desks.

#### Sprint 9 (Weeks 19–20): Direct Ship Integration, Sales Mobility & Proof of Delivery
- **Target Velocity**: 36 SP
- **Epics Covered**: E11 (Direct Ship / B2B Mobility), E08 (Fulfillment)
- **Primary Objectives**:
  - Develop Direct Ship Integration (Interface I11): Electronic purchase order transmission directly to industrial suppliers (e.g., Siam Cement Group / SCG) for direct-to-jobsite delivery.
  - Build Responsive Mobile B2B Sales Portal (FE2): Optimized for tablets and smartphones, enabling commercial sales representatives to generate quotes and check customer credit headroom while on job sites.
  - Implement Driver Proof of Delivery (POD) mobile module: Capture delivery photos, receiver signature, and GPS coordinates upon truck unloading.
  - Deliver Direct-to-Site Dispatch Tracking Dashboard (FE2).

#### Sprint 10 (Weeks 21–22): Operational BI Reporting & Statutory ภ.พ.30 Dashboards
- **Target Velocity**: 35 SP
- **Epics Covered**: E14 (Reporting/BI), E15 (Integration)
- **Primary Objectives**:
  - Develop Statutory Monthly VAT Output Report (รายงานภาษีขาย ภ.พ.30): Fully reconciled against general ledger postings, categorized by store branch code, with tax base and VAT breakout.
  - Build Real-Time Accounts Receivable Aging Matrix: Categorizing customer balances into Current, 1–30 Days, 31–60 Days, 61–90 Days, and $>90$ Days Overdue.
  - Develop Commercial Profitability Engine: Real-time calculation of gross margin by project, contractor, SKU category, and sales representative.
  - Deliver Executive BI & Compliance Dashboard (FE1) with CSV/Excel/PDF export capabilities.

#### Sprint 11 (Weeks 23–24): UAT Hardening, OWASP Pen-Test & Concurrency Stress
- **Target Velocity**: 26 SP *(Checkpoint CP5 Production Go/No-Go)*
- **Epics Covered**: E15 (Hardening, Security, Performance)
- **Primary Objectives**:
  - Execute end-to-end Enterprise Concurrency Stress Testing: Simulate 500 concurrent sales reps and retail POS terminals competing for high-velocity stock, verifying sub-second ATP response times.
  - Conduct full OWASP Top 10 Security Penetration Testing and vulnerability remediation; audit encryption of sensitive contractor PII (Tax IDs, banking records) at rest and in transit.
  - Rehearse Disaster Recovery (DR) and High Availability Failover: Verify Recovery Time Objective ($\text{RTO} < 15 \text{ minutes}$) and Recovery Point Objective ($\text{RPO} < 1 \text{ minute}$) on database clusters.
  - Formal UAT Execution: Complete 100% of business acceptance test scripts with Commercial Wholesale and Finance stakeholders.

#### Sprint 12 (Weeks 25–26): Production Cutover, Delta Migration & 3-Branch Pilot Launch
- **Target Velocity**: 20 SP
- **Epics Covered**: E15 (Cutover & Hypercare)
- **Primary Objectives**:
  - Execute Master Data delta migration: Final ETL sync of 100,000 active SKUs, vendor tables, customer profiles, opening credit balances, and physical inventory stock counts.
  - Conduct Production Cutover dry run and final cutover window deployment; establish 24/7 hypercare bridge with engineering team.
  - Launch Live Pilot in 3 selected Thai Watsadu pilot stores (e.g., Bangna, Bang Bua Thong, Rattanathibet) and Central Distribution Center for direct contractor orders.
  - Hand over system documentation, operational runbooks, and Tier-2 support procedures to Thai Watsadu IT Operations.

---

### 2.4 End-to-End Epic Traceability Matrix

| Epic ID | Epic Description | Planned SP | Primary Sprints | Architectural Components | Verification Artifact |
|:---:|---|:---:|:---:|---|---|
| **E13** | Security, RBAC & Immutable Audit Trail | 30 SP | S0, S1 | JWT Auth, RBAC Middleware, DB Trigger Audit Ledger | Zero audit bypass; full diff capture |
| **E01** | Master Data Management & Maker-Checker | 40 SP | S1, S2 | Staging DB, Approval State Machine, I0a Catalog Parser | 100k SKU parsed; Maker $\ne$ Checker |
| **E02** | Dynamic Pricing & Zone Freight Engine | 55 SP | S2, S3 | Volume Break Algorithm, Freight Matrix, Floor Validator | Zero floor breaches; exact 7% VAT |
| **E03** | Credit Headroom & Cheque Control Engine| 50 SP | S3, S4 | Real-time Exposure Ledger, PDC Register, Block Rules | Hard stop at 100.01%; PDC lifecycle |
| **E07** | Inventory FEFO & Perishable Lot Control | 45 SP | S4, S5 | FEFO Allocation Service, Shelf-life Expiry Quarantine | Oldest batch chosen; $<15$d isolated |
| **E04** | Order Management & High-Contention ATP | 60 SP | S5, S6 | Redis Mutex, PostgreSQL Row Lock, Split Dispatch | Zero overselling under race condition |
| **E10** | Revenue Dept Tax Invoice & Billing Engine| 50 SP | S6, S7 | Tax Sequence Gen, Baht Text Transcriber, PDF/A | Immutable posted invoice; ภ.พ.30 match |
| **E08** | Warehouse Fulfillment & Dispatch | 35 SP | S7, S9 | Pick/Pack Slip Generator, Weighbridge, Mobile POD | Verified tare/gross; POD photo logged |
| **E12** | Return, Restocking & Credit Note Engine | 25 SP | S8 | RMA Workflow, Grading Restock, Statutory CN | Restock to ATP; linked CN issued |
| **E11** | Direct Ship & B2B Sales Mobility | 30 SP | S9 | Direct Supplier EDI/API, Responsive Sales Web App | Quote-to-order converted on tablet |
| **E14** | Reporting, BI & Compliance Dashboards | 20 SP | S10 | AR Aging View, Margin Calculator, ภ.พ.30 Exporter | Real-time margin; aged AR accuracy |
| **E15** | System Integration, Hardening & Cutover | [40 SP Buffer] | S0,S8,S11,S12| I0a-I0e Connectors, DR Clusters, Cutover Runbook | Pen-test green; 3-store pilot live |
| **TOTAL**| **Delivered Functional Scope (S1–S11)** | **440 SP**| **S1–S11** | **305 BE SP + 135 FE SP** | **440 Delivered SP / 485 Gross Ceiling** |

---

# 3. Sprint Deliverables & Verifiable Demo Criteria

### 3.1 Live Demonstration Philosophy & Execution Protocol
Sprint reviews at Thai Watsadu are conducted under a strict **Zero-Slide Policy**:
- Presentations using static slide decks or Figma design mockups are strictly prohibited.
- All demonstrations must execute live on the integrated Staging environment using real product catalogs, active database connections, and realistic contractor profiles.
- Every sprint demo is governed by binary **Pass/Fail Criteria**. A user story is marked "Complete" only when its acceptance scenario passes cleanly in the live environment before the Product Owner and Commercial Stakeholders.

### 3.2 Granular Sprint Demonstration Specifications (S0 to S12)

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

#### Detailed Sprint Demo Profiles

##### Sprint 0: Automated Pipeline & Security Audit Trail Demo
- **Business Scenario**: DevOps engineer pushes a commit missing the mandatory `[FR-xx-xxx]` ticket tag; developer attempts unauthorized modification of an audit log entry.
- **Live Execution Path**:
  1. Trigger Git push with commit message `fix bug in auth`. System rejects push immediately via pre-receive hook.
  2. Commit with message `[FR-E13-001] Implement user auth middleware`. CI/CD pipeline triggers, executes linting, runs test suite, and completes green build.
  3. Direct SQL `UPDATE` executed against `audit_log` table as database administrator.
- **Pass/Fail Criteria**:
  - **PASS**: Git hook blocks non-compliant commit. Database trigger throws `42501 Insufficient Privilege: Audit logs are append-only and immutable`.
  - **FAIL**: Any push without bracketed requirement ID succeeds; direct SQL update modifies an audit record.

##### Sprint 1: Master Data Maker-Checker Two-Man Rule Demo
- **Business Scenario**: Sales representative creates a new commercial contractor account with a 500,000 THB credit limit; creator attempts to approve their own submission; checker inspects and approves.
- **Live Execution Path**:
  1. User `sales_rep_01` fills out B2B Customer Onboarding form with 13-digit Thai Tax ID.
  2. User `sales_rep_01` navigates to Maker-Checker Queue and clicks "Approve".
  3. User `checker_manager_01` logs in, views side-by-side diff highlighting modified credit limit and tax ID, and clicks "Approve".
- **Pass/Fail Criteria**:
  - **PASS**: Self-approval attempt returns `403 Forbidden: Maker and Checker cannot be identical`. Approved record is instantly copied to active customer table with full audit attribution.
  - **FAIL**: Self-approval succeeds, or active customer master is updated prior to Checker approval.

##### Sprint 2: Volume Break & Floor Price Boundary Demo
- **Business Scenario**: Sales agent enters quote for 2,500 bags of Portland Cement with tiered volume pricing; agent attempts to manually discount unit price below base cost + minimum margin.
- **Live Execution Path**:
  1. Add 2,500 bags of SKU `CEM-PORT-01` (Tier 1: 1–499 bags @ 140 THB; Tier 2: 500–1,999 bags @ 132 THB; Tier 3: $\ge 2,000$ bags @ 125 THB).
  2. Verify system automatically prices line item at 125 THB/bag + 7% VAT.
  3. Sales agent overrides unit price to 105.00 THB (Cost is 108.00 THB; Floor price is 112.00 THB).
- **Pass/Fail Criteria**:
  - **PASS**: Volume break applies automatically. Manual price of 105.00 THB triggers hard block: `Price Violation: Price 105.00 THB is below floor price 112.00 THB. Requires Level-4 Executive Authorization`.
  - **FAIL**: Line item accepted below floor price, or volume discount fails to evaluate tier boundary.

##### Sprint 3: Credit Hard-Stop & Post-Dated Cheque Lifecycle Demo
- **Business Scenario**: Contractor with 1,000,000 THB credit limit and 950,000 THB current exposure attempts to place an order for 60,000 THB; contractor provides 100,000 THB post-dated cheque.
- **Live Execution Path**:
  1. Submit order for 60,000 THB ($950k + 60k = 1.01M > 1.00M$).
  2. Finance logs received post-dated cheque for 100,000 THB (Status: `RECEIVED`).
  3. Cheque status transitioned to `CLEARED` by treasury officer.
  4. Resubmit the 60,000 THB order.
- **Pass/Fail Criteria**:
  - **PASS**: Step 1 hard-rejects checkout with exact overage details (`Credit Limit Exceeded: Headroom is 50,000 THB, Order value is 60,000 THB`). Step 2 maintains hard-stop until cheque clears. Step 4 approves order cleanly.
  - **FAIL**: Order converts while credit limit is breached, or uncleared cheque prematurely replenishes credit line.

##### Sprint 4: FEFO Cement Lot Allocation & Manager Credit Release Demo
- **Business Scenario**: Two pallets of Portland cement exist in warehouse (Lot A expiring in 20 days; Lot B expiring in 60 days); sales order placed for 1 pallet; customer soft-blocked on 5-day overdue invoice.
- **Live Execution Path**:
  1. System processes warehouse allocation for 1 pallet of cement.
  2. Order submission triggers soft credit block due to overdue invoice.
  3. Commercial Manager opens Credit Desk, reviews customer history, and authorizes 48-hour temporary exception release with OTP.
- **Pass/Fail Criteria**:
  - **PASS**: Engine automatically allocates Lot A (earliest expiry) and generates pick-list with Lot A batch ID. Soft block holds order until manager enters valid OTP, logging full justification.
  - **FAIL**: Engine allocates Lot B (violating FEFO), or soft block releases without OTP digital signature.

##### Sprint 5: High-Contention Multi-Branch ATP Race Condition Demo
- **Business Scenario**: Branch Bangna has exactly 100 rolls of structural wire mesh remaining; two automated agents concurrently attempt to purchase 80 rolls each at the exact same millisecond.
- **Live Execution Path**:
  1. Initialize stock balance at 100 units in branch warehouse.
  2. Fire two parallel checkout requests via automated test script (Agent 1 requesting 80 units; Agent 2 requesting 80 units) with synchronized timestamps.
- **Pass/Fail Criteria**:
  - **PASS**: First request acquires atomic distributed lock, successfully reserves 80 units (leaving 20 units ATP). Second request immediately fails with `409 Conflict: Insufficient Available Stock (Requested: 80, Available: 20)`. No overselling occurs.
  - **FAIL**: Both requests succeed, driving physical inventory balance to $-60$ units.

##### Sprint 6: Statutory Thai RD Tax Invoice & Baht Text Demo
- **Business Scenario**: Complete order fulfillment and generate official Revenue Department compliant e-Tax Invoice for a contractor order totaling 107,000.00 THB (Net 100,000.00 THB + 7% VAT 7,000.00 THB).
- **Live Execution Path**:
  1. Trigger invoice posting in system.
  2. Inspect generated sequential invoice number, branch tax ID, output VAT calculation, and Thai Baht Text transcription.
  3. Attempt database `UPDATE` on line-item total of posted invoice.
- **Pass/Fail Criteria**:
  - **PASS**: Invoice number follows continuous sequence without gaps. Thai Baht Text transcribes exactly: `หนึ่งแสนเจ็ดพันบาทถ้วน`. Document is permanently locked; DB update throws immutability constraint violation.
  - **FAIL**: Thai Baht Text contains spelling or phonetic error; posted invoice permits in-place data edits.

##### Sprint 7: Warehouse Pick-Pack & Financial Credit Note Demo
- **Business Scenario**: Warehouse picks bulk steel rebar; truck weighed on weighbridge; customer subsequently reports 5 bundles damaged in transit; finance issues Credit Note.
- **Live Execution Path**:
  1. Warehouse operator completes picking ticket; weighbridge operator records tare and gross truck weights.
  2. Generate official Delivery Order (DO) and Gate Pass.
  3. Finance initiates Credit Note for 5 damaged bundles referencing original invoice number.
- **Pass/Fail Criteria**:
  - **PASS**: Gate pass links tare/gross weights and validates payload weight against theoretical material density. Credit Note generates legal sequential CN document, adjusts customer AR ledger downward, and credits Output VAT account.
  - **FAIL**: Gate pass generates without weight validation, or Credit Note fails to link back to original tax invoice.

##### Sprint 8: RMA Restocking & GL ERP Financial Sync Demo
- **Business Scenario**: Contractor returns 50 unused bags of tile adhesive in original packaging; warehouse inspection grades items as Grade A; system processes return and posts to GL.
- **Live Execution Path**:
  1. Customer service initiates RMA ticket referencing original delivery order.
  2. Receiving clerk inspects goods and assigns "Grade A — Resellable".
  3. System triggers inventory restocking and dispatches financial transaction to Interface I0e (GL ERP stub).
- **Pass/Fail Criteria**:
  - **PASS**: On-hand ATP balance immediately increments by 50 units. Interface I0e stub receives valid double-entry accounting payload (Debit Inventory, Credit Cost of Goods Sold; Debit Output VAT, Credit Accounts Receivable).
  - **FAIL**: Returned inventory remains uncredited in ATP, or GL journal payload fails schema validation.

##### Sprint 9: B2B Contractor Portal & Driver Proof of Delivery Demo
- **Business Scenario**: Commercial contractor logs into responsive web portal on tablet, reviews project pricing, requests quote; driver delivers goods to construction site and captures POD.
- **Live Execution Path**:
  1. Contractor logs into B2B Portal, selects 10 pallets of masonry blocks, and clicks "Request Formal Quotation".
  2. Sales rep approves quotation on mobile phone, converting to active order.
  3. Delivery driver accesses mobile web app, captures photograph of unloaded pallets on jobsite, captures receiver's digital signature, and records GPS location.
- **Pass/Fail Criteria**:
  - **PASS**: Quote-to-order converts in $<2$ seconds. POD record uploads photo with embedded GPS metadata and updates delivery status to `DELIVERED`.
  - **FAIL**: Portal fails on mobile viewport; driver POD fails to capture GPS coordinates or image proof.

##### Sprint 10: Revenue Department ภ.พ.30 & Credit Risk BI Demo
- **Business Scenario**: Finance Director generates monthly Revenue Department VAT Return (ภ.พ.30) summary and audits contractor accounts receivable aging matrix.
- **Live Execution Path**:
  1. Open Financial BI Console and select tax period for prior calendar month.
  2. Execute automated reconciliation between WDS Tax Invoice ledger and GL ERP tax balances.
  3. View Accounts Receivable Aging Matrix.
- **Pass/Fail Criteria**:
  - **PASS**: Form ภ.พ.30 tax base, exempt transactions, and 7% Output VAT totals reconcile with 100% zero-satang variance against posted invoices. AR aging breaks down accounts into 30/60/90-day buckets matching accounting sub-ledger.
  - **FAIL**: Discrepancy between tax report and posted invoices; AR aging fails to flag delinquent accounts.

##### Sprint 11: 500-User Stress Test & Disaster Recovery Drill Demo
- **Business Scenario**: Load test harness simulates 500 concurrent sales reps and retail POS terminals during peak morning trade; platform engineer initiates database master instance termination.
- **Live Execution Path**:
  1. Execute k6 performance test script simulating 500 concurrent users executing price lookups, ATP queries, and order reservations.
  2. While system is under full load, DevOps injects simulated database failure by terminating primary PostgreSQL instance.
- **Pass/Fail Criteria**:
  - **PASS**: Under normal 500-user load, $p99$ response latency remains $<800\text{ms}$ with zero 5xx server errors. Upon DB termination, automated failover to standby replica completes in $<45$ seconds with zero data loss ($\text{RPO} = 0$).
  - **FAIL**: Latency exceeds 2,000ms under load; failover takes $>60$ seconds or corrupts in-flight transactions.

##### Sprint 12: Production Cutover & First Live Contractor Order Demo
- **Business Scenario**: Final production cutover in 3 pilot stores; store sales rep creates and completes live commercial order for an enrolled contractor.
- **Live Execution Path**:
  1. Contractor visits commercial sales desk at Bangna pilot store.
  2. Sales rep creates order for 200 bags of cement and 50 steel rebars.
  3. System validates real-time credit headroom, allocates stock, issues gate pass, and prints official Thai Revenue Department Tax Invoice.
- **Pass/Fail Criteria**:
  - **PASS**: Live transaction completes end-to-end in $<60$ seconds. Real physical inventory deducted; legal tax invoice printed and verified by store controller.
  - **FAIL**: System throws unhandled exception; order hangs; invoice number sequence breaks.

---

# 4. Governance Checkpoints (CP1 to CP5)

### 4.1 Stage-Gate Governance Architecture
To safeguard delivery against scope creep, architectural drift, and compliance failure, the 26-week timeline is fortified with **Five Governance Stage-Gates (CP1 to CP5)**. Each checkpoint acts as a mandatory review gate where project health, architectural compliance, and delivery velocity are audited before granting authorization to proceed:

```
[Project Start W0]
       │
       ▼
    [ CP1 ] End S0 (W2)  ──> Architecture & Tooling Baseline Gate
       │
       ▼
    [ CP2 ] End S2 (W6)  ──> Master Data & Pricing Foundation Gate
       │
       ▼
    [ CP3 ] End S5 (W12) ──> MID-TERM REALITY GATE: Velocity Check (<85% triggers Drop List §2.3)
       │
       ▼
    [ CP4 ] End S8 (W18) ──> Operational Core Freeze Gate
       │
       ▼
    [ CP5 ] End S11 (W24)──> Release Candidate, Statutory Compliance & Pen-Test Gate
       │
       ▼
[ Live Cutover W26 ]
```

### 4.2 Comprehensive Checkpoint Gate Specifications

#### Checkpoint 1 (CP1): Architecture & Tooling Baseline Gate
- **Milestone Timing**: End of Sprint 0 (Week 2).
- **Mandatory Gate Criteria**:
  1. Complete provisioning of Development, Staging, and UAT environments on Neon PostgreSQL, Redis, and Kafka.
  2. Automated CI/CD pipeline fully operational with blocking gates for linting, type-checking, and unit tests.
  3. Git pre-receive hooks enforce bracketed requirement IDs `[FR-xx-xxx]` on 100% of commits.
  4. Base database migration framework deployed with UTC timestamp enforcement and immutable audit log tables.
- **Deliverable Evidence**: Working CI/CD pipeline execution logs; clean SonarQube static scan (zero Blocker/Critical issues); database migration script verification.
- **Action on Failure**: 3-day sprint freeze; platform engineer and dev lead paired to unblock infrastructure before Sprint 1 functional coding commences.

#### Checkpoint 2 (CP2): Master Data & Pricing Foundation Gate
- **Milestone Timing**: End of Sprint 2 (Week 6).
- **Mandatory Gate Criteria**:
  1. Master Data Maker-Checker engine operating cleanly with enforced two-man separation of duties.
  2. Dynamic Pricing Engine successfully calculating volume tier breaks, customer trade discounts, and zone freight.
  3. Absolute Floor Price Guardrail hard-rejecting below-cost pricing attempts.
  4. Interface I0a batch parser successfully ingesting 100,000 SKU catalog feed within the nightly processing window ($<4$ hours).
- **Deliverable Evidence**: Automated pricing unit test suite with 100% boundary scenario coverage; Maker-Checker audit log proof; catalog ingestion performance report.
- **Action on Failure**: Reassign Backend Engineer 3 to reinforce pricing calculation engine; postpone secondary admin UI screens.

#### Checkpoint 3 (CP3): Mid-Term Velocity & Reality Check Gate (Drop List Trigger)
- **Milestone Timing**: End of Sprint 5 (Week 12) — The Mid-Project Fulcrum.
- **Mandatory Gate Criteria**:
  1. **Cumulative Velocity Threshold**: Team must have completed $\ge 85\%$ of cumulative planned story points ($\ge 160$ delivered SP out of 190 SP planned across S0–S5).
  2. Functional integration of core transaction spine: Customer Master $\to$ Dynamic Pricing $\to$ Real-Time Credit Headroom $\to$ FEFO Inventory Allocation $\to$ High-Contention ATP Reservation.
  3. Zero active Severity-1 (Blocker) defects in the staging environment.
- **Deliverable Evidence**: Jira/Linear cumulative burn-up velocity audit report; live end-to-end integration demo of multi-line commercial order checkout under contention.
- **Action on Failure**: **MANDATORY INVOCATION OF THE 20-ITEM DROP LIST PROTOCOL (§2.3)**. The Scope Realignment Council convenes within 24 hours to shed secondary scope.

#### Checkpoint 4 (CP4): Operational Core Freeze Gate
- **Milestone Timing**: End of Sprint 8 (Week 18).
- **Mandatory Gate Criteria**:
  1. **Core Feature Freeze**: Architectural and business logic lock on the core transaction engines (Pricing, Credit, ATP, Tax Invoicing, Returns). No new functional scope or schema modifications permitted.
  2. Revenue Department compliant Tax Invoice generator operating with exact Thai Baht Text transcription and immutable posted states.
  3. External integration stubs for Interface I0d (POS Collections) and Interface I0e (GL/AR ERP) verified and passing end-to-end integration contracts.
- **Deliverable Evidence**: Core schema freeze commit tag; formal tax invoice audit certification signed by Thai Watsadu Finance/Tax Controller; integration contract verification report.
- **Action on Failure**: All feature development halted; entire 9-person engineering team pivots to defect elimination, integration stability, and performance optimization.

#### Checkpoint 5 (CP5): Release Candidate, Statutory Compliance & Pen-Test Gate
- **Milestone Timing**: End of Sprint 11 (Week 24) — Production Go/No-Go Decision.
- **Mandatory Gate Criteria**:
  1. 100% of Release 1 critical test scenarios executed with $\ge 98\%$ first-time pass rate; zero active Sev-1 or Sev-2 defects.
  2. Formal Business UAT Sign-off executed by VP Wholesale, Head of Store Operations, and Chief Financial Officer.
  3. Independent OWASP Top 10 Security Penetration Test passed with zero Critical or High vulnerabilities.
  4. Disaster Recovery drill verified: Database failover completes in $<45$ seconds with zero data loss ($\text{RPO} = 0, \text{RTO} < 15 \text{ mins}$).
  5. Concurrency stress test verified: System maintains $p99$ response times $<800\text{ms}$ under 500 concurrent active users.
- **Deliverable Evidence**: Signed UAT acceptance document; third-party penetration test clearance certificate; DR failover simulation video and metrics log; performance test sign-off.
- **Action on Failure**: Escalate to Executive Steering Committee; evaluate 2-week cutover postponement utilizing project contingency reserve, or release with approved operational guardrails.

---

### 4.3 Checkpoint Audit Scoring & Remediation Protocol

Checkpoints are audited using an objective, weighted 100-point scoring model across four health dimensions:

```
+----------------------------------------------------------------------------------------------------+
|                                    CHECKPOINT SCORING BREAKDOWN                                    |
+----------------------------------------------------------------------------------------------------+
| 1. Functional Scope Delivery (Jira/Linear SP Verification)               : 30 Points               |
| 2. Architectural & Code Quality (SonarQube, Test Coverage >=80%)          : 25 Points               |
| 3. Statutory & Security Compliance (RD Tax Standards, OWASP Zero High)    : 25 Points               |
| 4. Operational Stability & Performance (p99 < 800ms, Zero Sev-1 Defects) : 20 Points               |
+----------------------------------------------------------------------------------------------------+
| PASS THRESHOLD: >= 85 Points  |  CONDITIONAL PASS: 75 - 84 Points  |  HARD FAIL: < 75 Points       |
+----------------------------------------------------------------------------------------------------+
```

#### Remediation Protocol
- **Score $\ge 85$ (Green Pass)**: Formal sign-off granted; next sprint phase commences as scheduled.
- **Score 75–84 (Amber Conditional Pass)**: Project continues with a mandatory **Remediation Action Plan (RAP)**. The Dev Lead and PM must resolve identified gaps within 5 business days without impacting sprint delivery.
- **Score $<75$ (Red Hard Fail)**: Automatic escalation to the Executive Steering Committee. Sprint progression is frozen, and scope reduction or resource reallocations are executed immediately.

---

# 5. The 20-Item Drop List Protocol (§2.3)

### 5.1 Trigger Criteria & Invocation Governance
The **Drop List Protocol (§2.3)** is Thai Watsadu's formal scope-governance circuit breaker. It is engineered to mathematically guarantee that the core B2B wholesale transaction engine launches on time by Week 26 under fixed headcount (9 engineers), regardless of upstream delays or estimation variances.

#### Activation Trigger Event
The protocol is evaluated formally at **Checkpoint 3 (CP3, End of Sprint 5 / Week 12)**:
$$\text{Cumulative Velocity Realization} = \frac{\text{Delivered SP (S0 to S5)}}{\text{Planned SP (S0 to S5)}} \times 100\%$$
- **Planned Cumulative Scope (S0 to S5)**: 190 Story Points (S0: 25 SP platform tooling + S1–S5: 165 delivered feature SP baseline).
- **Trigger Threshold**: If cumulative delivered story points are **$< 85\%$ of planned scope ($< 160$ SP delivered)**, the Drop List Protocol is **AUTOMATICALLY ACTIVATED**.
- **Secondary Trigger**: If any external legacy system dependency (Interface I0b Store Stock, I0d POS, or I0e SAP ERP) is delayed by $>2$ weeks, threatening downstream integration timelines.

#### Scope Baseline Consistency & Temporal Realignment Principle
A fundamental tenet of agile delivery governance is that **past sprints cannot be retroactively dropped to recover future calendar capacity**. When CP3 is evaluated at the end of Sprint 5:
1. **Zero Sunk-Scope Fallacy**: Sprints S0 through S5 are chronologically completed. Any attempt to drop features scheduled in S1–S5 saves zero engineering hours for future delivery.
2. **Strict S6–S11 Future Realignment**: All 20 pre-approved Drop List items are situated **strictly in future Sprints S6 through S11** (Epics E04, E08, E10, E11, E12, E14, E15).
3. **Active Backlog Integrity**: The 20 drop items represent **152 Story Points (34.5% of the total 440 SP Release 1 scope)** out of the 240 SP scheduled across S6–S11 ($6 \text{ Sprints} \times 40 \text{ SP} = 240 \text{ SP}$). Every item is a genuine component of the committed Release 1 scope, and shedding it post-CP3 directly recovers future engineering capacity without disrupting past deliverables.

### 5.2 Scope Realignment Council (SRC) Operating Rules
1. **Convening Mandate**: Within 24 hours of CP3 audit completion, the PM convenes the **Scope Realignment Council (SRC)**, comprising:
   - Project Manager (Chair)
   - Product Owner
   - Solution Architect
   - Dev Lead / Principal Architect
   - VP Commercial Wholesale
2. **Deficit Sizing**: The Council calculates the exact capacity deficit:
   $$\Delta SP = 190 \text{ Planned SP} - \text{Delivered SP (S0 to S5)}$$
3. **Shedding Target**: To account for ongoing recovery friction and technical debt triage, the Council must shed scope equal to the deficit plus a 15 SP safety buffer:
   $$\text{Target Scope Reduction} = \Delta SP + 15 \text{ SP}$$
4. **Execution Discipline**: Scope is shed strictly in sequential order, starting at **Drop Item #1** and proceeding down the list until the target reduction is satisfied. Arbitrary or selective picking of features is strictly prohibited.
5. **Operational Workaround Requirement**: Every dropped feature must be paired with an approved, tested **Manual / Operational Fallback Workaround** to ensure business continuity across Thai Watsadu's 80+ store branches and central DC.

### 5.3 The Authoritative 20-Item Scope Reduction Priority Matrix

The table below enumerates all 20 non-critical features pre-approved for deferral, situated strictly in Sprints S6–S11, totaling **152 Story Points (34.5% of total R1 scope)**:

| Drop # | Epic | Sprint | Feature Name & Detailed Scope Description | Justification for Deferral | Saved SP | Validated Operational / Manual Fallback Workaround | Target Release |
|:---:|:---:|:---:|---|---|:---:|---|:---:|
| **1** | E11 | S9 | **Sales Rep Offline Quoting Mode (IndexedDB Sync)** | Client-side IndexedDB conflict resolution and multi-master sync complexity; field sales reps operate in store commercial catchment areas with reliable 4G/5G cellular coverage. | **8 SP** | Field sales representatives access live responsive mobile web portal connected via cellular data or smartphone Wi-Fi hotspot; offline sync disabled. | R1.1 |
| **2** | E11 | S9 | **Driver Digital Sign-on-Glass (e-Sign) & Photo Upload** | Mobile device camera/canvas hardware tuning, touch sensitivity cross-browser testing, and offline sync overhead can be safely deferred post-pilot. | **7 SP** | Delivery driver captures physical customer signature on tri-copy printed Delivery Order (DO) paper slip at job site; signed paper copy is returned to store logistics desk for manual scanning and archiving. | R1.1 |
| **3** | E11 | S9 | **Real-Time Delivery Truck GPS Telematics & Map** | Vehicle IoT GPS telematics streaming, carrier telemetry hardware bridges, and WebSocket broker infrastructure overhead. | **8 SP** | Store transport dispatcher coordinates with driver via mobile phone for location status; dispatcher manually updates transit milestone (`DEPARTED`, `EN_ROUTE`, `DELIVERED`) directly in web dispatch UI. | R1.1 |
| **4** | E11 | S9 | **Automated Customer SMS Delivery ETA Alert Webhook** | Third-party SMS gateway integration, telecommunication carrier SLA dependencies, and localized message template management overhead. | **6 SP** | Store customer service desk notifies contractor purchasing contact via official LINE Official Account (LINE OA) or direct telephone call upon vehicle dispatch. | R1.1 |
| **5** | E11 | S9 | **Contractor Quick-Reorder Barcode Scanner in Web** | WebRTC camera barcode decoding across variable mobile device browsers and camera resolutions creates high QA test matrix burden. | **7 SP** | Contractor types 6-to-8 digit SKU code into quick-add search input or selects "Duplicate Order" from their historical invoice archive on the B2B web portal. | R1.1 |
| **6** | E08 | S7 | **Automated Gate Pass License Plate Camera Bridge** | Physical DC gate OCR camera serial integration is highly vulnerable to outdoor lighting, dirt/rain variances, and site wiring delays. | **7 SP** | Security gate guard visually cross-checks truck registration plate against printed Gate Pass document, scans 1D Gate Pass barcode with handheld USB scanner, and manually types plate number into gate log. | R1.1 |
| **7** | E08 | S7 | **Warehouse 2D Staging Bay Heatmap & Bin Optimizer** | High frontend 2D canvas rendering and real-time spatial bin coordinates; standard sequential bin picking slips provide 100% operational fulfillment. | **8 SP** | Warehouse pickers fulfill orders using printed pick-lists pre-sorted by warehouse aisle and bin location; staging bay assignments are written on physical bay markers. | R2.0 |
| **8** | E08 | S9 | **Multi-Stop Dynamic Route Optimization (VRP Engine)** | Combinatorial Vehicle Routing Problem (VRP) algorithms, road network topology graphs, and commercial map engine licensing overhead. | **9 SP** | Fleet logistics supervisor manually clusters delivery destinations into delivery runs using static regional district delivery zone maps. | R1.1 |
| **9** | E08 | S7 | **Automated Pallet Packing Slip 2D Consolidation** | Bundling multi-pallet manifests into single 2D DataMatrix barcode requires specialized high-density barcode scanner terminal apps. | **6 SP** | Forklift operators attach individual standard 1D Code-128 pallet barcode labels to each pallet; shipping manifest lists all constituent pallet IDs line by line. | R1.1 |
| **10** | E12 | S8 | **Cross-Branch Multi-Store Return & Restock Routing** | Intricate inter-store inventory transfer accounting, multi-company stock cross-clearing, and inter-branch tax debit/credit notes. | **8 SP** | Return policy strictly enforced: Returned building materials are accepted exclusively at the original issuing store branch or the Central Distribution Center (Wang Noi CDC). | R1.1 |
| **11** | E12 | S8 | **Automated Grade-B Clearance Repricing Rules** | Dynamic clearance price discounting engine based on algorithmic inspection grade formulas and depreciation curves. | **7 SP** | Branch store warehouse manager manually inspects returned goods and applies authorized manual markdown price in store POS/WDS clearance register. | R1.1 |
| **12** | E12 | S8 | **Restocking Fee Automated Policy Override Matrix** | Intricate multi-tier return fee deduction rules based on customer loyalty tier, elapsed days, and packaging condition. | **7 SP** | Customer service clerk manually selects a standard 10% restocking fee checkbox during RMA creation form entry; fee waivers require branch manager digital sign-off. | R1.1 |
| **13** | E10 | S6 | **Automated SMS/Email e-Tax Invoice Distribution** | External email queuing, SMS gateway integration, and authenticated automated PDF attachment distribution services. | **6 SP** | Cashier prints physical paper tax invoice at store counter bearing the statutory Revenue Department e-Tax endorsement watermark: *"เอกสารนี้ได้จัดทำและส่งข้อมูลให้แก่กรมสรรพากรด้วยวิธีทางอิเล็กทรอนิกส์"* (conforming strictly to RD Regulation TIS 1102-2559 and Section 86/4, preserving buyer's input tax credit), or manually emails digitally signed PDF to contractor billing contact. | R1.1 |
| **14** | E10 | S6 | **Multi-Currency Billing & FX Valuation Engine** | Thai Watsadu domestic wholesale is 99.8% THB denominated; multi-currency ledgering and daily BOT FX rate sync create unnecessary operational overhead. | **6 SP** | System locked strictly to Thai Baht (THB); rare institutional foreign currency contracts are invoiced manually via legacy SAP ERP. | R2.0 |
| **15** | E10 | S7 | **Automated Batch PDF/A-3 Compression Packager** | Complex zip archive bundling with cryptographic manifest signing and monthly tax archive compaction. | **7 SP** | Database stores individual signed PDF/A-3 invoice blobs in S3 storage; monthly audit extracts for statutory compliance are generated via scheduled backend CLI extraction script. | R1.1 |
| **16** | E14 | S10| **Real-Time Margin & Profitability Heatmap by KAM** | High OLAP query aggregation overhead on transactional database; requires complex analytical caching and BI cube tuning. | **8 SP** | Commercial finance exports weekly sales transaction ledger to Microsoft Excel and runs pre-configured PowerBI margin models. | R2.0 |
| **17** | E14 | S10| **Interactive Executive BI Drill-down Simulation Cube** | Complex client-side charting, multidimensional slicing/dicing, and predictive sales forecasting visualizations. | **8 SP** | Executive leadership utilizes scheduled weekly tabular CSV/PDF reports emailed automatically every Monday at 07:00 AM. | R2.0 |
| **18** | E14 | S10| **Automated ภ.พ.30 Discrepancy Reconciliation Alert Bot** | Automated background bot continuously flagging deltas between subledger invoice lines and General Ledger tax accounts. | **7 SP** | Senior tax accountant executes manual monthly reconciliation SQL query script matching `tax_invoices` subledger with General Ledger Output VAT account 213100 prior to filing monthly ภ.พ.30 return. | R1.1 |
| **19** | E04 | S6 | **Multi-Warehouse Automated Split-Order Combinatorial**| Dynamic integer programming solver automatically splitting line items across 80 retail stores and regional DCs based on cost optimization. | **10 SP** | Order desk sales representative manually selects fulfillment source (Local Store vs. Central DC) per order line item at quotation creation; system generates separate quotations per fulfillment branch entity to maintain legal branch tax numbering and single credit reservation lock. | R1.1 |
| **20** | E15 | S8 | **Automated Legacy POS Settlement Reconciliation Replayer**| Automated distributed compensating saga replayer recovering from legacy store POS network dropouts and partial sync failures. | **8 SP** | POS batch reconciliation exceptions are directed to an error queue; store IT support reviews failure log and triggers manual batch replay via administrative button. | R1.1 |
| **TOTAL**| — | **S6–S11** | **ALL 20 DROP ITEMS SITUATED AFTER CHECKPOINT CP3** | — | **152 SP** | **100% COVERED BY VERIFIED MANUAL WORKAROUNDS** | — |

---

### 5.4 Capacity Shedding Tiers & Schedule Recovery Dynamics

The Drop List is organized into four cumulative recovery tiers, allowing the Scope Realignment Council to shed only the precise volume of work necessary to recover the project schedule:

```
+----------------------------------------------------------------------------------------------------+
|                                    CUMULATIVE DROP LIST CAPACITY RECOVERY                          |
+----------------------------------------------------------------------------------------------------+
| Tier 1: Drops #1 to #5   (Mobile UI & Field Comms: S9, E11)      ---> Saves  36 SP (~1 Sprint)     |
| Tier 2: Drops #6 to #10  (DC Logistics & RMA Routing: S7-S9)     ---> Saves  38 SP (Cumulative 74) |
| Tier 3: Drops #11 to #15 (Secondary Tax, FX & RMA: S6-S8)        ---> Saves  33 SP (Cumulative 107)|
| Tier 4: Drops #16 to #20 (BI Analytics, Split Order: S6-S10)     ---> Saves  41 SP (Cumulative 152)|
+----------------------------------------------------------------------------------------------------+
| MAXIMUM RECOVERABLE CAPACITY POST-CP3                            ---> Saves 152 SP (34.5% Scope)   |
+----------------------------------------------------------------------------------------------------+
```

- **Tier 1 Activation (Deficit 15–35 SP)**: Drops Items 1–5 (S9, Epic E11), recovering **36 Story Points**. Eliminates client-side offline sync, camera WebRTC decoding, and telematics streaming while preserving full responsive mobile ordering capabilities.
- **Tier 2 Activation (Deficit 36–70 SP)**: Drops Items 1–10 (S7–S9, Epics E08, E11, E12), recovering **74 Story Points (Cumulative)**. Eliminates DC gate camera integrations, route optimization solvers, and cross-branch return routing without impacting basic pick/pack fulfillment or store-level RMA processing.
- **Tier 3 Activation (Deficit 71–105 SP)**: Drops Items 1–15 (S6–S8, Epics E10, E12), recovering **107 Story Points (Cumulative)**. Eliminates multi-currency accounting, automated RMA markdown curves, and secondary tax distribution queues while preserving core legal e-Tax generation and basic return restocking.
- **Tier 4 Full Invocation (Severe Deficit >105 SP)**: Drops all 20 items (S6–S10, Epics E04, E14, E15), recovering **152 Story Points (Cumulative)**. Strips the platform down to its pure commercial wholesale transaction core, replacing algorithmic order splitting with manual quotation line assignment and automated BI cubes with standard weekly CSV extracts.

### 5.5 Inviolate Statutory Core Protection Guarantee

The governance framework establishes an inviolable architectural boundary: **The Statutory Core Engine is 100% Protected and CANNOT be dropped under any circumstances**.

Regardless of velocity deficits or escalation pressures, the following core functional domains are legally protected from scope reduction:
1. **E02 Dynamic Pricing Engine**: Volume tier breaks, zone freight matrix calculation, customer trade tier baselines, and absolute cost-floor price guardrails.
2. **E03 Credit & Cheque Control**: Real-time credit exposure tracking, hard blocking at credit limits, and manual cheque logging.
3. **E04 / E07 Inventory ATP & FEFO**: Sub-second stock reservation with Redis Redlock and PostgreSQL row-level locks, and cement lot expiry validation.
4. **E10 Statutory Thai Revenue Department Tax Invoicing**: Unalterable posted invoices, gapless continuous sequential numbering per branch tax entity, exact 7% Output VAT rounding, and certified Thai Baht Text transcription conforming to Thai Revenue Code Sections 86/4, 86/5, 86/9, and 86/10.

---

# 6. Comprehensive Risk Management Matrix (P01 to P09)

### 6.1 Risk Management Methodology & Severity Scoring
WDS risk management utilizes a quantitative failure-mode evaluation model. Risks are scored based on **Probability (0.1 to 1.0)** and **Business Impact (1 to 5)**:
$$\text{Risk Severity Score} = \text{Probability} \times \text{Impact}$$
- **Critical (Score 3.5 – 5.0)**: Catastrophic threat to statutory legality, commercial liquidity, or delivery timeline. Requires active executive steering oversight and daily engineering mitigation.
- **High (Score 2.5 – 3.4)**: Severe operational or architectural risk. Requires automated guardrails, architectural isolation, and weekly KRI monitoring.
- **Medium (Score 1.5 – 2.4)**: Manageable operational friction mitigated through operational procedures and standard runbooks.

```
+-----+---------------------------------------------+-------------+------------+--------------------+
| ID  | Risk Description                            | Probability | Impact     | Risk Score & Level |
+-----+---------------------------------------------+-------------+------------+--------------------+
| P01 | Revenue Dept Tax Audit Failure              | Low (0.2)   | Critical(5)| High (1.0 - Catast)|
| P02 | Inventory Contention (Retail vs B2B Direct) | High (0.8)  | High (4)   | High (3.2 - Severe)|
| P03 | Credit Overrun & Bad Debt                   | Medium(0.5) | Critical(5)| High (2.5 - Severe)|
| P04 | Legacy Merchandising Feed I0a Sync Bottleneck| High (0.8)  | High (4)   | High (3.2 - Severe)|
| P05 | Bounced Cheque Goods Delivery Risk          | Medium(0.5) | High (4)   | Medium (2.0 - High)|
| P06 | Key Engineer Attrition in 9-Person Team     | Medium(0.4) | High (4)   | Medium (1.6 - High)|
| P07 | High Concurrency Pricing Engine Degradation | Medium(0.5) | High (4)   | Medium (2.0 - High)|
| P08 | In-Flight Document Tampering / Non-Repudiat | Low (0.2)   | Critical(5)| High (1.0 - Catast)|
| P09 | Branch Stock Shrinkage / Lot Expiry Spoilage| High (0.7)  | Medium (3) | Medium (2.1 - High)|
+-----+---------------------------------------------+-------------+------------+--------------------+
```

---

### 6.2 Deep-Dive Risk Profiles & Action Plans (P01–P09)

#### P01: Revenue Department Tax Audit Failure
- **Category**: Statutory, Fiscal Legality & Financial Penalties.
- **Threat Description**: Generation of non-compliant e-Tax invoices (e.g., gaps in sequential numbering, incorrect satang rounding on 7% Output VAT, erroneous Thai Baht Text, or post-issuance document alteration). Under Thai Revenue Code Section 86, tax invoicing violations carry severe financial fines (up to 200% penalty) and revocation of electronic tax issuing licenses.
- **Warning Triggers**:
  - Detection of missing sequence numbers in `tax_invoice_ledger`.
  - Discrepancy $>0.00$ THB between line-item VAT sum and total invoice VAT.
  - Test assertions failing on Thai Baht Text transcription.
- **Preventive Actions**:
  1. Implement atomic database sequence generators isolated from transactional rollbacks to guarantee continuous numbering without gaps.
  2. Enforce standard Thai Revenue Department calculation rules: line-item computation at 4-decimal precision, rounded to 2 decimals using `ROUND_HALF_UP` on final invoice summation.
  3. Deploy standard Thai Baht Text transcribing algorithm verified against official Revenue Department test vectors.
  4. Cryptographically seal posted invoices: Database trigger rejects direct `UPDATE` or `DELETE` on posted tax documents.
- **Contingency Protocol**:
  - If a sequencing gap is detected, halt automated tax posting immediately.
  - Switch to pre-printed physical tax forms with manual book registration.
  - Deploy hotfix patch within 24 hours to reconcile sequence gaps and submit formal explanation letter to the Revenue Department.
- **Accountable Owner**: Dev Lead & Finance/Tax Controller.

#### P02: Inventory Contention between Retail & B2B Direct Sales
- **Category**: Transactional Integrity, Inventory Control & Customer Fulfillment.
- **Threat Description**: Simultaneous stock allocation attempts between high-volume B2B wholesale orders and walk-in retail POS customers across 80+ stores lead to race conditions, phantom inventory sales, and fulfillment failures on heavy structural materials (e.g., cement, steel rebar).
- **Warning Triggers**:
  - Negative physical inventory balances recorded in store warehouse ledgers.
  - Two-phase lock wait times exceeding 1,500ms.
  - Fulfillment rejection rate $>0.5\%$ at branch dispatch bays.
- **Preventive Actions**:
  1. Implement Two-Phase Distributed Locking: Redis distributed mutex locks paired with PostgreSQL `SELECT ... FOR UPDATE` row locks on warehouse SKU balance records.
  2. Inventory Pool Segregation: Allocate dedicated Wholesale Safety Stock buffers for high-velocity items, preventing walk-in retail POS from exhausting committed wholesale inventory.
  3. 15-Minute Reservation TTL: Temporary order reservations expire and release back to ATP automatically if checkout is not completed within 15 minutes.
- **Contingency Protocol**:
  - In the event of an oversell race condition, system immediately marks order as "Fulfillment Exception".
  - Automated routing triggers an emergency cross-dock transfer from the nearest regional DC or sister branch within 24 hours.
  - Commercial sales rep notified to offer contractor priority delivery with waived freight surcharge.
- **Accountable Owner**: Backend Engineer 4 (ATP Lead) & Head of Supply Chain.

#### P03: Credit Overrun & Bad Debt
- **Category**: Commercial Credit Risk & Corporate Liquidity.
- **Threat Description**: Commercial contractors placing orders exceeding authorized credit limits due to caching latency or unauthorized sales rep overrides; delayed detection of delinquent accounts leading to unrecoverable accounts receivable bad debt.
- **Warning Triggers**:
  - Customer outstanding exposure exceeding credit limit by $>0.01$ THB.
  - Invoices remaining unpaid $>30$ days past payment term due date.
  - Soft credit block overrides executed without Level-3 manager digital signature.
- **Preventive Actions**:
  1. Real-Time Headroom Calculation: Order submission strictly calculates exposure against the live database ledger without caching balances in Redis or application memory.
  2. Automated Aging Hard-Stop: Any invoice overdue by $>30$ days automatically places an immediate, system-wide hard credit block on the customer, preventing further quotation conversions.
  3. Multi-Tiered Override Authority: Credit limit extensions $>50,000$ THB require dual digital signatures (Commercial Director + Finance Director) with SMS OTP verification.
- **Contingency Protocol**:
  - Instantly freeze all pending dispatch orders and active deliveries across the entire store network for any customer exceeding credit limit without authorization.
  - Legal collections workflow initiated automatically for accounts delinquent $>45$ days.
- **Accountable Owner**: Backend Engineer 3 (Credit Lead) & Credit Control Director.

#### P04: Legacy Merchandising Feed I0a Sync Bottleneck
- **Category**: Data Engineering, Batch Processing & System Integration.
- **Threat Description**: Nightly ingestion of the 100,000 SKU merchandising catalog feed exceeds the 4-hour batch processing window, running into morning branch operating hours (past 07:00 AM) and locking product master tables during peak trade.
- **Warning Triggers**:
  - Batch ingestion processing duration exceeding 3.5 hours.
  - Database connection pool utilization $>80\%$ during nightly batch execution.
  - CPU utilization on database master instance $>85\%$ during feed sync.
- **Preventive Actions**:
  1. Micro-Batching with Bulk Copy: Ingest records in chunks of 500 SKUs utilizing PostgreSQL `COPY` protocol rather than iterative `INSERT` statements.
  2. Hash-Based Delta Sync: Compute MD5 hash of incoming SKU payloads; skip database writes for unmodified items, reducing update volume by $>90\%$.
  3. Decouple Search & Pricing: Stage updates in background shadow tables and swap active pointers atomically in $<100\text{ms}$.
- **Contingency Protocol**:
  - If feed sync exceeds 06:30 AM, automatically abort remaining batch processing.
  - Fall back to previous day's catalog cache for morning store operations.
  - Resume delta processing for remaining items during off-peak afternoon window (14:00–16:00).
- **Accountable Owner**: Backend Engineer 1 (Master Data Lead) & Database Administrator.

#### P05: Bounced Cheque Goods Delivery Risk
- **Category**: Financial Treasury & Asset Protection.
- **Threat Description**: Delivery of high-value building materials against unverified or dishonored Post-Dated Cheques (PDC); dispatching goods from warehouse before cheque clearing verification results in total loss of delivered assets.
- **Warning Triggers**:
  - Dispatch Gate Pass generation attempted against an order secured by an uncleared cheque.
  - Cheque marked "Dishonored / Bounced" in treasury bank clearing report.
  - Cheques unbanked $>14$ days past maturity date.
- **Preventive Actions**:
  1. Strict PDC Status Lifecycle: Cheques must transition from `RECEIVED` to `DEPOSITED` to `CLEARED` before credit headroom is released.
  2. Gate Pass Lock: Warehouse dispatch terminal physically prohibits Gate Pass generation for cheque-secured orders until bank clearing confirmation is logged in the system.
  3. Bank Clearing Webhook / Daily Reconciliation: Treasury officers perform daily morning bank reconciliation before warehouse picking waves begin.
- **Contingency Protocol**:
  - Upon receiving bank notice of a bounced cheque, system immediately executes an automated network-wide credit freeze on the contractor account.
  - All trucks currently en route to the contractor's jobsites are recalled immediately via transport dispatch.
- **Accountable Owner**: Backend Engineer 3 (Credit/Cheque Lead) & Treasury Manager.

#### P06: Key Engineer Attrition in 9-Person Team
- **Category**: Human Capital, Institutional Knowledge & Delivery Schedule.
- **Threat Description**: Resignation or extended medical leave of critical engineers (e.g., Dev Lead, Pricing Architect, or ATP Lead) in a lean 9-person team, causing loss of architectural knowledge and severe delivery delays.
- **Warning Triggers**:
  - High individual overtime hours ($>15$ hours/week) sustained across two consecutive sprints.
  - Single engineer authoring $>70\%$ of commits within a specific domain epic.
  - Delays in pull request reviews due to lack of secondary reviewers.
- **Preventive Actions**:
  1. Mandatory Pair Programming & Cross-Review: Every pull request must be reviewed and approved by at least two engineers.
  2. Comprehensive Documentation Standards: Every engine must maintain exhaustive architectural specifications, OpenAPI contracts, and inline docstrings.
  3. Domain Buddy System: Assign secondary shadow engineers (e.g., BE2 shadows BE4 on ATP locking; BE1 shadows BE3 on credit ledger).
- **Contingency Protocol**:
  - If a key engineer departs, immediately reallocate the designated shadow engineer as primary.
  - Invoke the **20-Item Drop List Protocol (§2.3)** to shed secondary scope and stabilize workload.
  - Engage Thai Watsadu enterprise platform architects to backfill core leadership responsibilities.
- **Accountable Owner**: Project Manager & Dev Lead.

#### P07: High Concurrency Pricing Engine Degradation
- **Category**: System Performance, Compute Scalability & User Experience.
- **Threat Description**: High concurrent quotation requests during peak morning contractor trade (08:00–10:30 AM) cause calculation latency to spike beyond 2,000ms, locking sales desk terminals and degrading store checkout efficiency.
- **Warning Triggers**:
  - Pricing calculation API $p95$ response latency $>500\text{ms}$.
  - Redis cache hit ratio for price rules dropping below $95\%$.
  - Application CPU utilization exceeding $75\%$ on pricing microservices.
- **Preventive Actions**:
  1. Multi-Tiered In-Memory Caching: Pre-compile and cache customer trade discount curves and volume break matrices in Redis with 1-hour TTL.
  2. Pure Function Calculation Design: Pricing engine designed with zero external I/O during line-item math, executing calculations entirely in memory using optimized decimal math libraries.
  3. Horizontal Microservice Auto-Scaling: Configure Kubernetes Horizontal Pod Autoscaler (HPA) to scale pricing service pods from 2 to 6 instances based on CPU and request queue depth.
- **Contingency Protocol**:
  - If pricing latency exceeds 1,500ms, enable "Degraded Mode": Cache freight calculations by postal zone rather than exact distance matrix.
  - Alert DevOps engineer to manually scale pricing pod replicas and recycle active Redis connection pools.
- **Accountable Owner**: Backend Engineer 2 (Pricing Lead) & Platform Engineer.

#### P08: In-Flight Document Tampering / Non-Repudiation
- **Category**: Cyber Security, Internal Fraud & Data Integrity.
- **Threat Description**: Malicious or unauthorized alteration of approved sales quotes, prices, line discounts, or customer credit limits while transactions are in-flight or post-issuance; repudiation of commercial terms by sales personnel.
- **Warning Triggers**:
  - Checksum / hash mismatch detected on quote-to-order conversion.
  - Audit log trigger detecting modifications bypassing application API layer.
  - High volume of price override requests originating from a single store IP address.
- **Preventive Actions**:
  1. Cryptographic HMAC Document Sealing: Approved quotations are digitally signed with an HMAC SHA-256 signature incorporating customer ID, SKU lines, quantities, unit prices, and approval timestamp.
  2. Immutable Database Audit Trail: Every state transition and data modification captures before/after JSONB deltas, originating IP, user ID, and timestamp in append-only tables.
  3. Separation of Duties: Sales reps cannot modify approved quote lines during order checkout; any change invalidates the cryptographic signature and requires re-approval.
- **Contingency Protocol**:
  - System automatically rejects any order submission where the HMAC payload checksum fails verification.
  - Offending user account is locked immediately, and security alert dispatched to Corporate Internal Audit and Security Officer.
- **Accountable Owner**: Security & Compliance Officer & Dev Lead.

#### P09: Branch Stock Shrinkage / Lot Expiry Spoilage
- **Category**: Warehouse Operations, Asset Spoilage & Financial Write-Offs.
- **Threat Description**: Perishable building supplies (specifically Portland cement bags, specialty adhesives, and chemical additives) expire in branch storage yards due to failure of picking crews to adhere to FEFO guidelines, causing inventory write-offs and contractor delivery complaints.
- **Warning Triggers**:
  - Inventory batches with $<30$ days remaining shelf-life exceeding 5% of total stock.
  - Warehouse pickers scanning different lot numbers than specified on the FEFO pick-list.
  - Contractor returns initiated under reason code "Near-Expiry / Hardened Cement".
- **Preventive Actions**:
  1. Automated FEFO Allocation: Engine strictly assigns the oldest valid batch on picking tickets; picking UI forces operator to scan batch barcode before confirming pick.
  2. Automated 15-Day Quarantine Hold: System automatically shifts any cement batch with $<15$ days remaining shelf-life to "Inspection Hold", removing it from sellable ATP inventory.
  3. Shelf-Life Aging Dashboard: Branch operations dashboard highlights aging lots in amber (30 days) and red (15 days), prompting commercial clearance promotions.
- **Contingency Protocol**:
  - Quarantined inventory is immediately evaluated by store operations for rapid commercial markdown or supplier return-to-vendor (RTV) claims.
  - Any customer delivered expired product receives immediate same-day replacement plus a 10% credit concession.
- **Accountable Owner**: Backend Engineer 4 (Inventory Lead) & Branch Operations Lead.

---

### 6.3 Key Risk Indicators (KRIs) & Early Warning Dashboard

The project tracks nine Key Risk Indicators (KRIs) corresponding to P01–P09, audited weekly by the Project Manager:

```
+-----+-----------------------------------+--------------------+--------------------+--------------------+
| Risk| Key Risk Indicator (KRI)          | Green (Healthy)    | Amber (Warning)    | Red (Critical Act) |
+-----+-----------------------------------+--------------------+--------------------+--------------------+
| P01 | Tax Numbering Gaps / Rounding Diff| 0 Gaps / 0.00 THB  | N/A                | >= 1 Gap / Round >0|
| P02 | ATP Contention Failures / Oversell| 0 Oversells / <0.1%| 0.1% - 0.5% Lock   | > 0.5% / Negative  |
| P03 | Unhedged Credit Overage / Delinq  | 0 Overages / 0 >30d| Overage < 0.01%    | Overage > 0.01%    |
| P04 | Catalog Ingestion Window (I0a)    | < 3.0 Hours        | 3.0 - 4.0 Hours    | > 4.0 Hours / Fail |
| P05 | Uncleared Cheque Gate Pass Blocks | 0 Unauthorized Pass| N/A                | >= 1 Gate Pass Fail|
| P06 | Engineer Overtime / Single Contrib| < 10 hrs / < 50%   | 10-15 hrs / 50-70% | > 15 hrs / > 70%   |
| P07 | Pricing Calculation Latency (p95) | < 250ms            | 250ms - 500ms      | > 500ms            |
| P08 | Audit Bypass / Signature Mismatch | 0 Mismatches       | N/A                | >= 1 Mismatch/Alert|
| P09 | Cement Lots Expiring in <15 Days  | 0 Sellable Expired | 1% - 3% Yard Stock | > 3% / Exp Delivered|
+-----+-----------------------------------+--------------------+--------------------+--------------------+
```

---

# 7. RACI Decision Matrix

### 7.1 Governance Stakeholders & Role Taxonomy
Clear decision rights are essential to maintain delivery velocity across 9 engineers and enterprise corporate stakeholders. The RACI framework defines governance authority across 14 critical project activities:

- **R = Responsible**: The execution lead who performs the work to deliver the activity.
- **A = Accountable**: The single individual with ultimate decision authority and veto power (**Strictly one "A" per activity**).
- **C = Consulted**: Domain experts whose inputs and feedback are formally solicited prior to execution.
- **I = Informed**: Stakeholders kept notified of progress, decisions, and outcomes.

#### Stakeholder Roles
1. **BIZ**: Commercial Stakeholders (VP Wholesale / Head of Branch Operations / Retail Director)
2. **PO**: Product Owner (Thai Watsadu Digital PMO Lead)
3. **PM**: Project Manager (Delivery Architect / Scrum Master)
4. **SA**: Solution Architect (Enterprise Architecture Lead)
5. **DL**: Dev Lead (Principal Engineer / Technical Delivery Lead)
6. **QA**: QA Automation Lead
7. **SEC**: Security & Compliance Officer (CISO / Data Protection Officer / Internal Tax Auditor)

---

### 7.2 The 14 Governance Activities RACI Matrix

```
+----+---------------------------------------------------+-----+-----+-----+-----+-----+-----+-----+
| ID | Key Decision / Governance Activity                | BIZ | PO  | PM  | SA  | DL  | QA  | SEC |
+----+---------------------------------------------------+-----+-----+-----+-----+-----+-----+-----+
| 01 | Scope Baseline & Formal Change Control Approval   |  A  |  R  |  C  |  C  |  C  |  I  |  I  |
| 02 | Sprint Backlog Prioritization & User Story Accept |  C  |  A  |  R  |  C  |  C  |  C  |  I  |
| 03 | Tech Stack Selection & Architecture Standards     |  I  |  C  |  I  |  A  |  R  |  C  |  C  |
| 04 | Database Schema Migrations & Data Type Approvals  |  I  |  I  |  I  |  C  |  A  |  C  |  I  |
| 05 | Drop List Activation at Checkpoint 3 (CP3 Gate)   |  A  |  R  |  R  |  C  |  C  |  I  |  I  |
| 06 | Master Data Maker-Checker Override Policy Approval|  A  |  C  |  I  |  I  |  I  |  I  |  C  |
| 07 | Credit Hard-Stop Exception Override Authority     |  A  |  C  |  I  |  I  |  I  |  I  |  C  |
| 08 | Revenue Dept Tax Invoice Format & Legal Sign-off  |  C  |  A  |  I  |  C  |  R  |  C  |  C  |
| 09 | External Interface Contract Freeze (I0a to I0e)   |  I  |  C  |  C  |  A  |  R  |  C  |  I  |
| 10 | Non-Production Synthetic Data Masking Approval    |  I  |  I  |  I  |  C  |  R  |  C  |  A  |
| 11 | Security Vulnerability Pen-Test Remediation Sign  |  I  |  I  |  C  |  C  |  R  |  C  |  A  |
| 12 | Governance Checkpoint Gates Sign-off (CP1 to CP5) |  C  |  A  |  R  |  C  |  C  |  C  |  C  |
| 13 | Production Cutover Go/No-Go Final Authorization   |  A  |  R  |  R  |  C  |  C  |  C  |  C  |
| 14 | Production Sev-1 Emergency Patch Release Approval |  I  |  C  |  I  |  C  |  A  |  C  |  C  |
+----+---------------------------------------------------+-----+-----+-----+-----+-----+-----+-----+
```

#### Operational Governance Principles
1. **Single Point of Accountability**: Every activity possesses exactly one Accountable ("A") owner. Co-accountability is forbidden.
2. **Engineering Integrity Mandate**: Technical architecture and database schema migrations (Activities 03, 04, 14) are strictly held by engineering leadership (SA and Dev Lead). Commercial stakeholders cannot overrule technical architectural standards.
3. **Statutory Non-Negotiables**: Tax Invoicing and Non-Prod PII Masking (Activities 08, 10, 11) require mandatory sign-off from the Security Officer and Finance/Tax Controller.

---

### 7.3 Deadlock Resolution & Escalation Procedures

If a governance deadlock occurs between business and engineering stakeholders, the following structured escalation hierarchy is enforced:

```
[Level 1: Operational Working Group]
PM, PO, SA, Dev Lead
Timeframe: 24 Hours to resolve at team level
       │ (Unresolved)
       ▼
[Level 2: Project Steering Committee]
Commercial VP, Digital PMO Director, Principal Architect, CISO
Timeframe: 48 Hours to deliver binding majority vote
       │ (Deadlock)
       ▼
[Level 3: Executive Board]
Chief Executive Officer (CEO) / Chief Information Officer (CIO) Thai Watsadu
Timeframe: Final, binding executive determination within 24 Hours
```

---

# 8. Project Governance Cadence & 5 Weekly Core Metrics

### 8.1 Operational Agile Governance Cadence

To maintain synchronization across the 9 engineers and business leadership, WDS operates on a disciplined delivery cadence:

| Governance Ritual | Frequency & Timing | Required Attendees | Purpose, Objective & Verifiable Output |
|---|---|---|---|
| **Daily Standup** | Daily (Mon–Fri), 09:15–09:30 (15 min) | Full 9-person Engineering Team, PM, PO | Three standard questions: Yesterday's output, today's commit plan, blockers. Output: Daily Blocker Board updated in Linear/Jira. |
| **Bi-Weekly Sprint Planning** | Alternate Mondays, 09:00–12:00 (3 hrs) | Full Engineering Team, PM, PO, SA | Review Definition of Ready (DoR); break epics into technical subtasks; lock Sprint Commitment story points. |
| **Bi-Weekly Backlog Refinement** | Mid-Sprint Wednesdays, 14:00–16:00 (2 hrs) | Dev Lead, BE/FE Leads, PO, SA, PM | Groom user stories for Sprint $N+1$; validate OpenAPI schemas; estimate story points using Planning Poker. |
| **Bi-Weekly Sprint Demo & Review** | Alternate Fridays, 14:00–15:30 (1.5 hrs) | Full Team, Business Stakeholders, Commercial VP | Live, zero-slide software demonstration against verifiable pass/fail criteria. Output: Formal user story sign-off by PO. |
| **Bi-Weekly Sprint Retrospective** | Alternate Fridays, 15:45–16:45 (1 hr) | Full 9-person Engineering Team, PM | Candid assessment: What worked, what failed, technical debt. Output: Max 3 actionable improvement items for next sprint. |
| **Architecture Review Board (ARB)**| Alternate Tuesdays, 15:00–16:00 (1 hr) | SA, Dev Lead, DevOps, Security Officer | Audit proposed database migrations, review cross-service API contracts, audit non-prod synthetic data compliance. |
| **Weekly Project SteerCo** | Weekly Thursdays, 10:00–11:00 (1 hr) | PM, PO, SA, Commercial VP, Finance Director | Review 5 Weekly Core Metrics, EVM schedule/cost variances, unblock inter-departmental dependencies. |

---

### 8.2 The 5 Weekly Core Project Metrics

Every Monday morning at 08:30 AM, the Project Manager publishes the **Executive WDS Project Health Scorecard** tracking five quantitative engineering and governance metrics:

```
+---------------------------------------------------------------------------------------------------+
|                                    5 WEEKLY CORE PROJECT METRICS                                  |
+---+-----------------------------------+--------------------+------------------+-------------------+
| # | Metric Name                       | Target Benchmark   | Warning Threshold| Red Alarm / Action|
+---+-----------------------------------+--------------------+------------------+-------------------+
| 1 | Velocity Realization Index        | >= 40 SP / Sprint  | 34 - 39 SP       | < 34 SP (CP3 Drop)|
| 2 | Defect Density & DRE Rate         | < 0.5 defects/SP   | 0.5 - 0.9 def/SP | >= 1.0 or Sev-1>0 |
| 3 | Interface Health & SLA Index      | 100% Green / <1.0s | Latency 1.0-2.0s | Failed Mock / >2s |
| 4 | Automated Core Test Coverage      | >= 80% on Engines  | 70% - 79%        | < 70% (Blocks PR) |
| 5 | Earned Value Schedule (SPI & CPI) | SPI >= 1.00        | 0.90 - 0.99      | SPI < 0.90        |
+---+-----------------------------------+--------------------+------------------+-------------------+
```

#### Metric 1: Velocity Realization Index (VRI)
- **Mathematical Formula**:
  $$\text{Velocity Realization Index (VRI)} = \frac{\text{Actual Delivered Story Points in Sprint}}{\text{Committed Story Points at Sprint Planning}} \times 100\%$$
  $$\text{Cumulative Burn-Up Velocity} = \sum_{s=0}^{N} \text{Delivered SP}_s$$
- **Benchmark Target**: $\text{VRI} \ge 95\%$ (Targeting 40 to 42 delivered SP per sprint); Cumulative Burn-Up tracking within 95% of target curve.
- **Warning Threshold**: $\text{VRI}$ between $85\%$ and $94\%$ (34 to 39 SP delivered). PM flags sprint in Amber; reviews backlog grooming.
- **Red Threshold & Action**: $\text{VRI} < 85\%$ ($< 34\text{ SP}$). Triggers mandatory sprint post-mortem. If cumulative velocity at Sprint 5 (CP3) is $<85\%$ ($<160\text{ SP}$ delivered), **immediately invoke the 20-Item Drop List Protocol (§2.3)**.

#### Metric 2: Defect Density & Defect Removal Efficiency (DRE)
- **Mathematical Formula**:
  $$\text{Defect Density} = \frac{\text{Total Defects Found in Sprint}}{\text{Delivered Story Points in Sprint}}$$
  $$\text{Defect Removal Efficiency (DRE)} = \frac{\text{Defects Detected Prior to Staging/UAT}}{\text{Internal QA Defects} + \text{UAT Escaped Defects}} \times 100\%$$
- **Benchmark Target**: Defect Density $< 0.5$ defects/SP; $\text{DRE} \ge 90\%$; **Zero active Severity-1 (Blocker) defects**.
- **Warning Threshold**: Defect Density $0.5$ to $0.9$ defects/SP; $\text{DRE}$ $80\% - 89\%$. QA initiates targeted exploratory testing on flagged modules.
- **Red Threshold & Action**: Defect Density $\ge 1.0$ defects/SP, or **any Sev-1 defect remaining open $>24$ hours**. All new feature coding in the sprint is frozen to execute a team-wide **"Swarm & Fix"**.

#### Metric 3: Integration Interface SLA Index (Interfaces I0a through I0e)
- **Mathematical Formula**:
  $$\text{Interface Health Index} = \frac{\sum \text{Weight}_i \times \text{HealthScore}_i}{\sum \text{Weight}_i} \times 100\%$$
  Tracking latency ($p95$), availability, and contract schema compliance for:
  - **I0a**: Merchandising Item Master Feed (100k SKUs)
  - **I0b**: Retail Store Stock API
  - **I0c**: Corporate CRM & B2B Customer Feed
  - **I0d**: POS Cashier Collection Terminal
  - **I0e**: General Ledger & AR Financial ERP
- **Benchmark Target**: 100% green integration contract tests; $p95$ response time $<1,000\text{ms}$; zero contract breaking changes.
- **Warning Threshold**: Any interface latency between $1,000\text{ms}$ and $2,000\text{ms}$; mock test failure resolved within 48 hours.
- **Red Threshold & Action**: Any interface failing or unresponsive $>2,000\text{ms}$ for two consecutive weeks. PM escalates to SteerCo to issue formal vendor notice to legacy ERP maintainers.

#### Metric 4: Automated Core Test Coverage & Quality Score
- **Mathematical Formula**:
  $$\text{Core Test Coverage} = \frac{\text{Executed Branches / Statements}}{\text{Total Branches / Statements across Core Engines}} \times 100\%$$
  Measured strictly across the four core engines:
  - E02 Dynamic Pricing Engine
  - E03 Credit & Cheque Control Engine
  - E04 / E07 Inventory ATP & FEFO Engine
  - E10 Statutory Tax Invoicing Engine
- **Benchmark Target**: Code statement coverage $\ge 85\%$; Branch coverage $\ge 80\%$; SonarQube Quality Gate = Green (Zero Blocker/Critical issues).
- **Warning Threshold**: Branch coverage between $70\%$ and $79\%$.
- **Red Threshold & Action**: Branch coverage $< 70\%$ on any core calculation module. **Automated CI/CD gate immediately blocks pull request merging** until test suite is reinforced.

#### Metric 5: Earned Value Management (SPI & CPI)
- **Mathematical Formula**:
  $$\text{Schedule Performance Index (SPI)} = \frac{\text{Earned Value (EV)}}{\text{Planned Value (PV)}} = \frac{\text{Cumulative Delivered SP}}{\text{Cumulative Planned SP}}$$
  $$\text{Cost Performance Index (CPI)} = \frac{\text{Earned Value (EV)}}{\text{Actual Cost (AC)}} = \frac{\text{Delivered SP} \times \text{Budgeted Cost/SP}}{\text{Actual Expended Engineering Hours} \times \text{Blended Hourly Rate}}$$
- **Benchmark Target**: $\text{SPI} \ge 1.00$ and $\text{CPI} \ge 1.00$.
- **Warning Threshold**: $\text{SPI}$ between $0.90$ and $0.99$, or $\text{CPI}$ between $0.90$ and $0.99$. PM formulates schedule recovery plan.
- **Red Threshold & Action**: $\text{SPI} < 0.90$ for two consecutive reporting cycles. PM presents emergency scope-shedding proposal via the Drop List Protocol to the Executive Steering Committee.

---

### 8.3 Weekly Executive Scorecard Reporting Template

The weekly report distributed to the Steering Committee utilizes this standardized format:

```markdown
# Thai Watsadu WDS — Weekly Executive Delivery Scorecard
**Reporting Date**: [YYYY-MM-DD] | **Reporting Cycle**: Week [WW] of 26 | **Current Sprint**: Sprint [S0-S12]
**Project Health Summary**: [ GREEN | AMBER | RED ]

## 1. Executive Summary & Critical Highlights
- Current Milestone: [Milestone Name] (Target: Week [WW])
- Next Governance Gate: Checkpoint [CP1–CP5] in [X] Sprints
- Overall Executive Status: [On Schedule | At Risk | Exception State]

## 2. 5 Weekly Core Metrics Status
| Metric Name                       | Actual Value  | Target Benchmark | Status  | 3-Week Trend |
|---|:---:|:---:|:---:|:---:|
| 1. Velocity Realization Index     | [XX.X]%       | >= 95% (40 SP)   | [G/A/R] | [▲ / ▶ / ▼]  |
| 2. Defect Density & DRE           | [X.XX] def/SP | < 0.5 def/SP     | [G/A/R] | [▲ / ▶ / ▼]  |
| 3. Interface Health Index         | [XX.X]%       | 100% Green       | [G/A/R] | [▲ / ▶ / ▼]  |
| 4. Automated Core Test Coverage   | [XX.X]%       | >= 80% Branches  | [G/A/R] | [▲ / ▶ / ▼]  |
| 5. Earned Value (SPI / CPI)       | SPI: [X.XX]   | SPI >= 1.00      | [G/A/R] | [▲ / ▶ / ▼]  |

## 3. Burn-Up & Schedule Progress
- Cumulative Planned Scope : [XXX] SP
- Cumulative Delivered Scope: [XXX] SP (Variance: [+/-XX] SP)
- Contingency Reserve Pool  : [40] SP Available (Consumed: [X] SP)

## 4. Key Risks & Blocker Escalation
- Active Sev-1 / Sev-2 Bugs: [X] Blocker, [X] Critical
- Top Risk in Focus        : [P01–P09 Description] (Status: [Monitoring | Mitigating])
- SteerCo Actions Required : [Action item for commercial/executive leadership]
```

---

## 9. Conclusion & Operational Commitment

This Project Management & Delivery Architecture Framework establishes the definitive execution blueprint for the Thai Watsadu Wholesale & Direct Sales (WDS) Release 1 system. By rigorously binding a realistic engineering capacity model (9 in-house engineers delivering 440 SP + 40 SP buffer) to verifiable sprint demonstration criteria, five formal governance stage-gates, an automated 20-item scope recovery circuit breaker, and continuous quantitative metric monitoring, the project leadership provides unconditional assurance that the WDS transaction engine will deploy with high quality, statutory compliance, and operational stability within the fixed 26-week timebox.
