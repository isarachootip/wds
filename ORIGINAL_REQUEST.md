# Original User Request

## Initial Request — 2026-09-09T03:17:57Z

ชวนทีม PM, SA, และ Sr. Dev ร่วมกันออกแบบระบบ Wholesale & Direct Sales (WDS) สำหรับไทวัสดุ ตามเอกสารแผนพัฒนาระบบ WDS v1.0 (SRS v1.1 มี 409 ข้อกำหนด, Release 1 มี 249 ข้อกำหนด ในกรอบเวลา 26 สัปดาห์ / 6 เดือน พร้อมทีมพัฒนาภายใน 9 คน) โดยจัดทำพิมพ์เขียวการออกแบบและเอกสารสถาปัตยกรรมระบบอย่างสมบูรณ์

Working directory: c:\atgv\wds
Integrity mode: development

## Requirements

### R1. Project Management & Delivery Architecture (PM Role)
จัดทำแผนบริหารจัดการโครงการและกรอบการส่งมอบงาน R1 (26 สัปดาห์ S0–S12) สำหรับทีม In-house 9 Engineers:
- Sprint Breakdown ละเอียดตั้งแต่ S0 ถึง S12 ที่แมปตรงกับ 12 Epics หลัก (E13, E01, E02, E03, E07, E04, E10, E08, E12, E11, E14, E15) พร้อม Deliverables ที่ Demo ได้ในแต่ละ Sprint
- กลไกควบคุมและจุดตรวจสำคัญ (CP1–CP5) และระเบียบปฏิบัติการตัดงานตาม Drop List 20 ลำดับ (§2.3) เมื่อ Velocity ต่ำกว่าเกณฑ์ที่ CP3 (Sprint 5)
- แผนบริหารความเสี่ยงเฉพาะด้าน (P01–P09), ตาราง RACI สำหรับการตัดสินใจสำคัญ, และพิธีกรรมการกำกับดูแล (Governance & 5 Weekly Metrics)

### R2. System Architecture & High-Level Design (SA Role)
ออกแบบสถาปัตยกรรมระบบรวมและ Data Flow ตามข้อกำหนดและมาตรฐานวิศวกรรม:
- สถาปัตยกรรมระบบ (System Architecture & Component Diagrams) และ Integration Architecture กับระบบภายนอก (Interfaces I0a–I0e: Merchandising Item Feed 100k items, Retail Stock, CRM, POS, GL/Finance)
- การออกแบบโมดูลหลักและโดเมนธุรกิจ (Core Domains):
  * E01/E13: Master Data (Maker-Checker), RBAC & Immutable Audit Log
  * E02: Pricing Engine (Volume Breaks, Zone Freight, Floor Price, Discount Authority, Effective-dated VAT Config)
  * E03: Credit & Cheque Control Engine (Credit Limit, Credit Blocking, Cheque Register, Release Workflow)
  * E07/E04: Inventory Management (FEFO Cement Lots, ATP, Branch Stock Reservation/Contention Handling)
  * E10: Billing & Revenue-Department-Compliant Tax Invoice (Immutability after posting, Output VAT, Credit Note)
- แนวนโยบายด้านความปลอดภัยและ NFRs (OWASP Top 10, Masked Synthetic Data ใน Non-Prod, Collation/Sort ภาษาไทย, UTC/Asia-Bangkok, Decimal Precision Rule)

### R3. Technical Specifications & Implementation Guidelines (Sr. Dev Role)
จัดทำพิมพ์เขียวทางเทคนิคและคู่มือการพัฒนาสำหรับทีม Backend / Frontend / DevOps:
- สถาปัตยกรรมทางเทคโนโลยี (Tech Stack Recommendations) ที่เหมาะสมสำหรับ Enterprise Scale (Backend, Frontend, Database, Caching, Message Queue)
- Data Model & Database Schema Specifications (ER Diagrams, DDL Schemas, Foreign Keys, Indexing, Decimal Types สำหรับเงินและสต๊อก)
- API Specifications & Data Contracts (OpenAPI/RESTful Specs ตัวอย่างสำหรับ Pricing Calculation, Order Submission, Credit Check, Inventory Commitment, Tax Invoicing)
- มาตรฐานวิศวกรรมและการทดสอบ (Engineering Standards): Commit Convention with bracketed Req ID `[FR-xx-xxx]`, Definition of Ready / Done, CI/CD Automated Gates, และ Unit Test Suite (>=80% coverage on Pricing, Credit, Inventory, Tax)

## Acceptance Criteria

### Comprehensive System Design Package
- [ ] มีเอกสารสถาปัตยกรรมระบบ (Architecture Document) พร้อมแผนภาพแสดง Component, Data Flow และ Integration Map ครบถ้วน
- [ ] มี Data Dictionary / DB Schema ที่ระบุ Decimal Type สำหรับเงินและจำนวนสินค้า พร้อมการรองรับ Audit Log และ Maker-Checker
- [ ] มี API Specification ตัวอย่าง (Request/Response) สำหรับ Core Workflow: Price Calculation, Credit Check, Stock Commitment, Order to Invoice
- [ ] มีตาราง Sprint Mapping (S0–S12) และ Drop List Protocol ที่สอดคล้องกับกรอบเวลา 26 สัปดาห์และกำลังผลิต 9 Engineers
- [ ] มีข้อกำหนด NFR & Coding Standards (ห้ามใช้ Float, UTC Storage, Effective-dated Tax Rate, Immutable Posted Document, Commit Hook Regex)
- [ ] เอกสารทั้งหมดถูกจัดเก็บในโฟลเดอร์โครงการเป็นไฟล์ Markdown ที่มีโครงสร้างชัดเจนและพร้อมนำไปปฏิบัติงานจริงทันที

## Follow-up Request — 2026-09-11T06:17:28Z

วิเคราะห์และจัดทำข้อกำหนดขอบเขตงาน (Scope of Work - SOW), สถาปัตยกรรมระบบ (End-to-End System Architecture & Flexible Integration Blueprint), และพิมพ์เขียวทางเทคนิค (Technical Specifications & Data Contracts) สำหรับกระบวนการขายแบบ Omnichannel Lead to Delivery ครอบคลุม:
1. Omnichannel Inbound (Line, โทรศัพท์, หน้าร้าน) -> บันทึก Lead ใน WDS -> ติดตามลูกค้า (Follow up)
2. นัดหมายและสำรวจหน้างาน (Site Visit) -> ส่งต่องานเข้า Visit App -> จองวัน/นัดหมาย -> อนุมัติ (Approve) -> เข้าไซต์ (Site On) -> ปฏิบัติงาน (Work)
3. การแตกสายงานหลังปฏิบัติงานหน้าไซต์:
   - Branch A: เชื่อมต่อ E-ordering เพื่อออกใบเสนอราคา (Quotation: QT) ส่งมอบให้ลูกค้าพิจารณา
   - Branch B: เช็คเอาท์ปิดงาน (Check out) -> ส่งผลกลับ WDS -> ตรวจสอบวงเงินและเครดิตลูกค้า (Credit Limit & Blocking Check) -> รับชำระเงิน (Payment) -> วางแผนและจัดส่งสินค้า (Delivery)

Working directory: c:\atgv\wds
Integrity mode: development

## Requirements

### R1. Scope of Work (SOW), Business Process & Delivery Framework (PM Role)
วิเคราะห์และจัดทำกรอบการส่งมอบและเอกสารข้อกำหนดทางธุรกิจ:
- **Business Process Definition & State Machine:** วิเคราะห์ Flow การทำงานอย่างละเอียดตั้งแต่ Customer Touchpoint จนถึง Final Delivery พร้อม State Transition Diagram (Lead State, Site Visit State, Quotation State, Payment/Credit State, Delivery State)
- **RACI Matrix & Organizational Alignment:** กำหนดหน้าที่และความรับผิดชอบของ Sales, Site Engineer/Surveyor, Approver, Finance/Credit Officer, Warehouse & Logistics
- **SOW & WBS Breakdown:** แตกรายละเอียด Work Breakdown Structure (WBS) แยกตาม Component และ Integration Point
- **Phasing, Milestones & Sprint Plan:** วางแผนการส่งมอบงาน (Phased Roadmap / Sprint S0-S12) พร้อมการประเมิน Risk Management (P01-P09), Dependencies และ Change Management Protocol
- **Governance & Acceptance Protocol:** กำหนดเกณฑ์การตรวจรับงาน (Definition of Ready / Done), KPIs, และ Business Metrics

### R2. Flexible Integration Architecture & System Blueprint (SA Role)
ออกแบบสถาปัตยกรรมระบบรวมและการเชื่อมโยงข้อมูลแบบ Flexible Integration Framework (รองรับทั้ง REST API / Webhooks สำหรับ 3rd-party/Existing apps และ Internal WDS Modules):
- **Component & Integration Architecture Diagram:** แสดงความสัมพันธ์ระหว่าง WDS Core, Visit App, E-ordering Platform, Omnichannel Gateway, และ ERP/Finance Backend
- **Core Workflow & Sequence Diagrams:**
  1. *Omnichannel Lead Ingestion Flow:* การรับและคัดกรอง Lead จาก Line OA, Call Center, และ Walk-in Store เข้าสู่ระบบ WDS
  2. *Site Visit Lifecycle & Dispatch Flow:* การ Push งานจาก WDS ไปยัง Visit App, การจองคิวช่าง, Approval Workflow, GPS Geo-fencing Check-in (Site On), Field Report/Work Logging, และ Check-out Closed Loop Callback
  3. *E-ordering Quotation Flow:* การแปลงข้อมูล Scope/BoQ จากหน้างานเข้าสู่ E-ordering Engine เพื่อคำนวณราคา (Volume Break, Tier Discount, Freight) และออกเอกสาร QT
  4. *Credit Control & Payment Gateway Flow:* กลไกตรวจสอบเครดิตลูกค้า (Credit Limit Check, Aging Debt, Temporary Credit Extension), Channel การชำระเงิน (Cash/Transfer/Credit/Cheque), และ Trigger ส่งต่องาน Delivery
  5. *Delivery Dispatch Flow:* การจองสต๊อก (ATP Reservation), จัดคิวรถขนส่ง และอัปเดตสถานะจัดส่ง
- **Resilience & Non-Functional Requirements (NFRs):** กลไก Offline-First Sync สำหรับ Mobile Visit App, Idempotency & Retry Strategy, Event-Driven Messaging (MQ/Webhooks), Security (RBAC, PII Masking, Audit Logs)

### R3. Technical Specifications, Data Contracts & API Specs (Sr. Dev Role)
จัดทำพิมพ์เขียวทางเทคนิคและสเปกข้อมูลอย่างละเอียดสำหรับทีมพัฒนา:
- **Domain Data Models & Database Schemas:** ER Diagram, DDL Specifications พร้อม Decimal Precision สำหรับราคา/ภาษี/ปริมาณสินค้า, Audit Trail Tables, และ State Change Enums
- **API Specifications & Data Contracts (OpenAPI/RESTful Standard):**
  1. Lead Management APIs (`/api/v1/leads/*`)
  2. Site Visit & Dispatch Integration APIs (`/api/v1/site-visits/*`, Webhook Events)
  3. E-ordering & Quotation Engine APIs (`/api/v1/quotations/*`)
  4. Credit Evaluation & Payment APIs (`/api/v1/credit/evaluate`, `/api/v1/payments/process`)
  5. Logistics & Delivery APIs (`/api/v1/deliveries/*`)
- **Engineering Standards & Test Strategy:** Unit Test Cases, Integration Test Scenarios (Happy path, Credit Limit Exceeded, Geo-location Mismatch, Concurrent Stock Booking), และ Codebase Structure Guidelines

## Acceptance Criteria

### Comprehensive SOW & Architecture Package
- [ ] มีเอกสาร SOW & Delivery Framework ใน `docs/` ที่ระบุ WBS, RACI Matrix, State Machine, และ Phased Roadmap อย่างครบถ้วน
- [ ] มีเอกสาร System Architecture Blueprint ใน `docs/` พร้อมแผนภาพ C4/Component Diagram, Sequence Diagrams ทุก Use Case, และ Flexible Integration Pattern
- [ ] มีเอกสาร Technical Specifications ใน `docs/` พร้อม Database Schema (DDL / Data Types), API Contracts (Request/Response JSON Schema), และ Engineering Guidelines
- [ ] เนื้อหาทั้งหมดสอดคล้องกับภาพกระบวนการทำงานและเอกสารมาตรฐาน WDS เดิมในระบบอย่างสมบูรณ์
- [ ] เอกสารทั้งหมดจัดเก็บในโครงสร้างไฟล์ Markdown ที่เป็นระเบียบ ชัดเจน และพร้อมนำไปใช้ปฏิบัติงานได้ทันที
