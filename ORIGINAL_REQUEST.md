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
