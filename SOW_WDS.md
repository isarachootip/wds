# ขอบเขตของงานและข้อกำหนดทางเทคนิคฉบับสมบูรณ์ (Statement of Work - SOW)
# ระบบ WDS Field Sales & Service Platform (Thai Watsadu)

**เอกสารเวอร์ชัน**: 1.0 (Final Production & Go-live Release)  
**โครงการ**: Thai Watsadu Wholesale & Direct Sales (WDS) Platform  
**ผู้จัดทำ**: ทีมวิศวกรรมระบบและสถาปัตยกรรมซอฟต์แวร์ (Senior Full-Stack Engineering Team)  
**สถานะการส่งมอบ**: ครบถ้วนสมบูรณ์ 100% (Phase 0 ถึง Phase 6)  
*(สามารถคัดลอกเนื้อหาทั้งหมดในไฟล์นี้ไปวางใน Google Docs เพื่อใช้เป็นเอกสารทางการได้ทันที)*

---

## สารบัญ (Table of Contents)
1. [บริบททางธุรกิจและวัตถุประสงค์ของโครงการ (Executive Summary & Business Context)](#1-บริบททางธุรกิจและวัตถุประสงค์ของโครงการ)
2. [ผังกระบวนการทางธุรกิจหลัก 12 ขั้นตอน (Core Business Process Flow)](#2-ผังกระบวนการทางธุรกิจหลัก-12-ขั้นตอน)
3. [สถาปัตยกรรมระบบและโครงสร้างเทคโนโลยี (System Architecture & Technology Stack)](#3-สถาปัตยกรรมระบบและโครงสร้างเทคโนโลยี)
4. [โครงสร้างโมดูลและซอร์สโค้ด (Monorepo Directory Structure)](#4-โครงสร้างโมดูลและซอร์สโค้ด)
5. [รายละเอียดการส่งมอบและฟีเจอร์เชิงลึกรายเฟส (Phase 0 — Phase 6 Specifications)](#5-รายละเอียดการส่งมอบและฟีเจอร์เชิงลึกรายเฟส)
   - [Phase 0 — Foundation: โครงสร้างหลัก ฐานข้อมูล และสิทธิ์](#phase-0--foundation)
   - [Phase 1 — WDS Core: การรับ Lead ติดตามงาน และขอสำรวจหน้างาน](#phase-1--wds-core)
   - [Phase 2 — Visit App: นัดหมาย อนุมัติ พิกัดช่าง และปิดงานไซต์](#phase-2--visit-app)
   - [Phase 3 — E-ordering: ใบเสนอราคา ภาษีมูลค่าเพิ่ม และคำสั่งซื้อ](#phase-3--e-ordering)
   - [Phase 4 — Billing, Payment & Delivery: สินเชื่อ ชำระเงิน และการจัดส่ง](#phase-4--billing-payment--delivery)
   - [Phase 5 — LINE OA, Notifications, Dashboard และรายงาน](#phase-5--line-oa-notifications-dashboard-และรายงาน)
   - [Phase 6 — Hardening & Go-live: ความปลอดภัย การทดสอบ และการเปิดใช้งาน](#phase-6--hardening--go-live)
6. [สถาปัตยกรรมฐานข้อมูลและโมเดลข้อมูล (Database Schema & ERD Specifications)](#6-สถาปัตยกรรมฐานข้อมูลและโมเดลข้อมูล)
7. [ผังสถานะและเงื่อนไขการเปลี่ยนสถานะ (State Machine Transition Matrices)](#7-ผังสถานะและเงื่อนไขการเปลี่ยนสถานะ)
8. [ความมั่นคงปลอดภัยและการปกป้องข้อมูล (Security & Privacy Governance)](#8-ความมั่นคงปลอดภัยและการปกป้องข้อมูล)
9. [ผลการทดสอบและการประกันคุณภาพ (Quality Assurance & Test Verification)](#9-ผลการทดสอบและการประกันคุณภาพ)
10. [บันทึกการทดสอบการยอมรับระบบ 12 ขั้นตอน (12-Step UAT Verification Log)](#10-บันทึกการทดสอบการยอมรับระบบ-12-ขั้นตอน)
11. [คู่มือการปฏิบัติการและการรับมือเหตุฉุกเฉิน (Operational Runbook & SOP)](#11-คู่มือการปฏิบัติการและการรับมือเหตุฉุกเฉิน)
12. [แผนงานเชิงกลยุทธ์ 6 เดือนถัดไปหลังเปิดใช้งาน (Post-Launch 6-Month Strategic Roadmap)](#12-แผนงานเชิงกลยุทธ์-6-เดือนถัดไปหลังเปิดใช้งาน)

---

## 1. บริบททางธุรกิจและวัตถุประสงค์ของโครงการ

**Thai Watsadu Wholesale & Direct Sales (WDS) Field Sales & Service Platform** ได้รับการพัฒนาขึ้นเพื่อเป็นแพลตฟอร์มศูนย์กลางสำหรับการบริหารงานขายโครงการ สินค้าสั่งพิเศษ และบริการสำรวจ/ติดตั้งหน้างานของบริษัท ซีอาร์ซี ไทวัสดุ จำกัด โดยแก้ปัญหาเดิมที่กระบวนการทำงานแยกส่วนกัน (Siloed Operations) ระหว่างทีมขาย ทีมช่าง ทีมบัญชี และลูกค้า

### บทบาทของผู้ใช้งานในระบบ (System Roles & Stakeholders)
1. **ผู้ดูแลระบบ (Admin / Super Admin)**: จัดการสิทธิ์ผู้ใช้งาน, กำหนดค่าระบบ, ดูแล Event Store และโครงสร้างพื้นฐาน
2. **ฝ่ายขายโครงการ (B2B / Contractor Sales)**: รับ Lead, ติดตามงาน (Follow-up), ขอสำรวจหน้างาน, ออกใบเสนอราคา (Quotation)
3. **ผู้จัดการฝ่ายขาย (Sales Manager)**: ติดตาม Sales Pipeline, อนุมัติส่วนลดพิเศษ, ปลดล็อก Credit Hold
4. **ผู้ประสานงานคิวงาน (Coordinator)**: จัดสรรคิวงานช่าง (Dispatching), ตรวจสอบตารางนัดหมาย, อนุมัติคิวเข้าสำรวจหน้างาน
5. **ทีมช่างเทคนิคหน้างาน (Field Technicians)**: เช็คอินหน้างานด้วยพิกัด GPS, บันทึก Checklist, เพิ่มวัสดุหน้างาน, ถ่ายรูปงาน, เก็บหลักฐานลายเซ็นลูกค้า
6. **ฝ่ายสินเชื่อและบัญชี (Credit & Accounting)**: ตรวจสอบวงเงินสินเชื่อ, อนุมัติสลิปโอนเงิน (Multi-installment), ออกใบแจ้งหนี้, ดูแลรายงานหนี้ค้างชำระ (AR Aging)
7. **คลังสินค้าและฝ่ายจัดส่ง (Warehouse & Logistics)**: เตรียมสินค้า (`picking`), มอบหมายสายส่งและรถบรรทุก
8. **พนักงานขับรถส่งสินค้า (Drivers)**: นำส่งสินค้าถึงไซต์งาน, ถ่ายรูปหลักฐานการส่งมอบ (Proof of Delivery - POD), บันทึกชื่อผู้รับสินค้า
9. **ลูกค้าโครงการ / ผู้รับเหมา / เจ้าของบ้าน (Customers)**: ติดต่อผ่าน LINE OA, เปิดดูและอนุมัติใบเสนอราคาผ่าน Customer Portal พร้อมยืนยันตัวตนด้วย OTP, ตรวจสอบสถานะ Order ผ่าน LINE LIFF

---

## 2. ผังกระบวนการทางธุรกิจหลัก 12 ขั้นตอน

```mermaid
flowchart TD
    S1["1. ลูกค้าติดต่อเข้ามา<br/>(LINE OA / โทรศัพท์ / หน้าร้าน)"] --> S2["2. บันทึก Lead & Deduplication<br/>(ตรวจเบอร์โทร/LINE ID ซ้ำซ้อน)"]
    S2 --> S3["3. เซลล์ติดตามงาน (Follow-up)<br/>(นัดหมายและประเมินงบประมาณ)"]
    S3 --> S4["4. ขอสำรวจหน้างาน (Site Visit)<br/>(ระบุพิกัด GPS และขอบเขตงาน)"]
    S4 --> S5["5. Coordinator อนุมัตินัดหมาย<br/>(จัดทีมช่าง & ลงตาราง Calendar)"]
    S5 --> S6["6. ช่างเดินทางถึงหน้างาน<br/>(Geofenced Check-in < 200m)"]
    S6 --> S7["7. ปฏิบัติงานหน้าไซต์<br/>(ทำ Checklist & เพิ่มวัสดุหน้างาน)"]
    S7 --> S8["8. ปิดงานหน้าไซต์ (Check-out)<br/>(เก็บลายเซ็นต์ดิจิทัลของลูกค้า)"]
    S8 --> S9["9. ออกใบเสนอราคา (Quotation)<br/>(ดึงรายการช่าง, คำนวณภาษีใน Satang)"]
    S9 --> S10["10. ลูกค้ายอมรับผ่าน Portal<br/>(ยืนยัน OTP -> สร้าง Sales Order)"]
    S10 --> S11["11. ตรวจสอบเครดิต & ชำระเงิน<br/>(Credit Engine & บัญชียืนยันสลิป)"]
    S11 --> S12["12. จัดส่งสินค้า & ส่งมอบงาน<br/>(Driver POD Gate -> ปิด Order)"]
```

---

## 3. สถาปัตยกรรมระบบและโครงสร้างเทคโนโลยี

### เทคโนโลยีหลักที่ใช้ในการพัฒนา
- **Monorepo Engine**: `pnpm workspaces` รองรับการแชร์ Types และ Schemas ระหว่าง Frontend, Backend และ Database
- **Web Frontend Framework**: **Next.js 15 (App Router)** บน Node.js v20+, React 19, TypeScript 5.6 (Strict Mode)
- **UI Design System**: **Cruip Artifact System** ผสานเข้ากับ **Tailwind CSS**, Radix UI Primitives และ Lucide Icons รองรับทั้ง Dark Mode และ Light Mode แบบ Responsive
- **Backend API Layer**: **NestJS** (สำหรับ Core Enterprise Services) ผสานเข้ากับ Next.js Server Actions สำหรับ Web Application UI Handshakes
- **Database & Persistence**: **PostgreSQL 15+** บน **Supabase** พร้อมส่วนขยาย `uuid-ossp`, `pgcrypto`
- **ORM & Migrations**: **Drizzle ORM** (Type-safe SQL Schema & Migration Tooling)
- **Security & RBAC**: Supabase Row Level Security (RLS) ครอบคลุม 32 ตาราง, In-memory Sliding Window Rate Limiting, Signed URLs สำหรับ Supabase Storage
- **Messaging & Notifications**: LINE Messaging API (Flex Messages), LINE Front-end Framework (LIFF), Supabase Realtime
- **PDF Generation**: `@react-pdf/renderer` พร้อม Sarabun Embedded Thai Font
- **Testing & Quality Framework**: **Vitest** สำหรับ Unit/Integration Tests (880 tests) และ **Playwright** สำหรับ E2E Journeys

---

## 4. โครงสร้างโมดูลและซอร์สโค้ด

```
c:/atgv/wds/
├── apps/
│   ├── web/                                  # Next.js 15 Full-Stack Web Application
│   │   ├── e2e/                              # Playwright E2E 6 Primary Business Journeys
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── (auth)/                   # เส้นทางระบบยืนยันตัวตน (/login, /auth/callback)
│   │   │   │   ├── (portal)/                 # เส้นทางฝั่งลูกค้า (/portal/liff, /portal/q/[token], /portal/orders)
│   │   │   │   ├── (visit)/                  # เส้นทางแอปช่างและคนขับ (/visit/jobs, /visit/deliveries)
│   │   │   │   ├── (wds)/                    # เส้นทางระบบ Back Office (/wds/leads, /wds/quotations, /wds/orders, /wds/credit, /wds/payments, /wds/reports, /wds/admin)
│   │   │   │   └── api/                      # REST Endpoints (health, line webhook, cron events, reports export)
│   │   │   ├── components/layout/            # Cruip Artifact Shell: Collapsible Sidebar, Header, Theme Toggle
│   │   │   ├── lib/                          # Core Utilities: statemachine, qt-calc, credit, storage, logger, geo, line
│   │   │   ├── modules/                      # Domain Modules (crm, visit, ordering, billing, events)
│   │   │   └── workers/                      # Domain Events Worker (Exponential Backoff + Dead Letter Queue)
│   │   ├── middleware.ts                     # Rate Limiter, Correlation Request ID, Role-based Routing
│   │   └── next.config.ts                    # CSP, Security Headers, Disabled Production Source Maps
│   └── api/                                  # NestJS Backend Microservices (Customer, Inventory, Pricing, Tax, Credit)
├── packages/
│   └── db/                                   # Drizzle ORM Database Package
│       └── src/schema/                       # auth, customers, products, crm, visit, ordering, billing, events
├── supabase/
│   └── migrations/                           # Migrations 00001 ถึง 00017 (RLS, Sequences, Views, Indexes)
├── scripts/                                  # Excel Importers (Customers, Products), Backup/Restore Script
└── docs/                                     # System Guides, User Manuals, ERD, State Diagrams, Runbook
```

---

## 5. รายละเอียดการส่งมอบและฟีเจอร์เชิงลึกรายเฟส

### Phase 0 — Foundation: โครงสร้างหลัก ฐานข้อมูล และสิทธิ์
1. **โครงสร้างโครงการ**: ติดตั้ง Next.js 15, TypeScript Strict Mode, Tailwind CSS, pnpm workspaces เชื่อมต่อ Database Package รวมศูนย์
2. **ตารางแกนกลาง (Core Tables)**:
   - `users`, `roles`, `user_roles`: บริหารจัดการตัวตนและบทบาท 8 บทบาทหลัก
   - `customers`, `addresses`: ข้อมูลลูกค้าผู้รับเหมาและพิกัดหน้างาน (Latitude/Longitude)
   - `products`, `price_lists`: แคตตาล็อกสินค้า หน่วยนับ และรายการราคามาตรฐาน
   - `audit_log`: ตารางเก็บบันทึกประวัติการเปลี่ยนแปลงของระบบทุก Action
3. **Database Trigger & Functions**: ฟังก์ชัน `set_updated_at()` อัตโนมัติในทุกตาราง และฟังก์ชัน trigger audit logging
4. **Row Level Security (RLS)**: เริ่มต้นวาง RLS Policies สกัดกั้น Anonymous Key ไม่ให้เห็นข้อมูลภายใน
5. **Seed Engine**: สคริปต์จำลองผู้ใช้งานครบทุก Role, ข้อมูลลูกค้าโครงการ 5 ราย, แคตตาล็อกวัสดุก่อสร้าง 20 รายการ

---

### Phase 1 — WDS Core: การรับ Lead ติดตามงาน และขอสำรวจหน้างาน
1. **Lead Intake Multi-Channel**:
   - รองรับแหล่งที่มา 4 ช่องทาง: `line`, `phone`, `store`, `other`
   - เก็บรหัสอ้างอิงช่องทาง (`channel_ref`: LINE User ID, เบอร์โทรศัพท์, รหัสสาขา)
   - เก็บความสนใจในรูปแบบ JSONB (`interest`), ช่วงงบประมาณ (`budget_range`), และคะแนนความสนใจ (`score`)
2. **Deduplication Engine**:
   - ระบบตรวจสอบข้อมูลซ้ำซ้อนผ่าน API `/api/leads/check-dupe`
   - ตรวจสอบจากเบอร์โทรศัพท์และ LINE User ID หากพบว่ามี Lead เดิมที่ยังไม่ปิดการขาย จะทำการเชื่อมโยงข้อมูลเดิมแทนการสร้างซ้ำ
3. **Follow-up & Activity Logging**:
   - บันทึกประวัติการติดต่อใน `lead_activities` (ประเภท: `call`, `line`, `visit`, `note`, `quote_sent`)
   - ระบบงานติดตามใน `follow_ups` ระบุวันครบกำหนด (`due_at`), ผู้รับผิดชอบ (`assignee_id`), และช่องทาง
4. **Site Visit Request**:
   - ฟังก์ชันขอออกสำรวจหน้างาน บันทึกพิกัดหน้างาน (`address_id`), วันที่ขอ, วัตถุประสงค์ และขอบเขตงาน (`scope jsonb`)
5. **Sales Territory Isolation**:
   - RLS Policy บังคับให้พนักงานขายเห็นเฉพาะ Lead ของตนเอง (`owner_id = auth.uid()`) ยกเว้นผู้จัดการฝ่ายขายและแอดมิน

---

### Phase 2 — Visit App: นัดหมาย อนุมัติ พิกัดช่าง และปิดงานไซต์
1. **Coordinator Workbench**:
   - หน้าจอรวมคำขอนัดหมายสำรวจหน้างาน (`/wds/appointments`) พร้อม Badge แจ้งเตือนรายการรออนุมัติ
   - มุมมองปฏิทินงานรายสัปดาห์ (`/wds/appointments/calendar`) แยกสีตามทีมช่าง
   - ฟังก์ชันอนุมัติ (`approve`) พร้อมมอบหมายทีมช่าง หรือปฏิเสธ (`reject`) พร้อมระบุเหตุผล
2. **Geofenced Check-in**:
   - ฟังก์ชันคำนวณระยะทาง Haversine Formula เปรียบเทียบพิกัดช่างกับพิกัดไซต์งาน
   - หากระยะห่างเกิน 200 เมตร (`FLAGGED_RADIUS_M = 200`) ระบบจะบันทึกสถานะ `flagged = true` พร้อมบันทึกระยะทางจริงและบังคับให้ช่างระบุเหตุผล
3. **Work Mode & Dynamic Checklist**:
   - โหมดปฏิบัติงานหน้างานบนมือถือ แบ่งเป็น 3 แท็บ: Checklist, รายการวัสดุ, รูปถ่ายหน้างาน
   - Checklist เริ่มต้น 6 ข้อบังคับด้านความปลอดภัยและคุณภาพงาน
   - รองรับการเพิ่มรายการวัสดุหน้างาน (`added_onsite`) ดึงราคาจากฐานข้อมูลหรือกรอกใหม่
4. **Offline Sync Storage**:
   - สถาปัตยกรรม Local Storage Queue สำหรับการทำงานในจุดอับสัญญาณมือถือ รองรับการบันทึก Checklist และรายการวัสดุไว้ในเครื่อง และซิงค์ขึ้นเซิร์ฟเวอร์อัตโนมัติเมื่อมีสัญญาณอินเทอร์เน็ต
5. **Check-out & Digital Customer Signature**:
   - การปิดงานหน้าไซต์ บังคับเก็บลายเซ็นต์ดิจิทัลของลูกค้าบนหน้าจอ (`customerSignaturePath`) และสรุปผลงาน (`workSummary`) เพื่อส่งต่อให้ฝ่ายขายออกใบเสนอราคา

---

### Phase 3 — E-ordering: ใบเสนอราคา ภาษีมูลค่าเพิ่ม และคำสั่งซื้อ
1. **Zero-Float Financial Math Engine**:
   - ยอดเงินทั้งหมดในระบบจัดการด้วยเลขจำนวนเต็ม Satang (`bigint` ใน DB, `number` ใน JS)
   - ปัดเศษด้วย `Math.round()` ห้ามใช้ Floating-point math โดยเด็ดขาด
   - รองรับส่วนลดรายบรรทัด (`discountSatang`) และส่วนลดท้ายบิล (`billDiscountSatang`)
   - รองรับภาษีมูลค่าเพิ่ม VAT 7% ทั้งแบบบวกนอก (`exclusive`) และรวมใน (`inclusive`)
2. **Postgres Sequence Concurrency**:
   - การออกหมายเลขเอกสารใบเสนอราคาและใบสั่งขายใช้ Database Sequence:
     - ใบเสนอราคา: `public.next_quotation_number()` รูปแบบ `QT-YYYYMM-0001`
     - ใบสั่งขาย: `public.next_order_number()` รูปแบบ `SO-YYYYMM-0001`
   - ทดสอบรองรับคำขอสร้างเอกสารพร้อมกัน 50 คำขอ (Concurrent Requests) การันตีเลขไม่ซ้ำและไม่ข้ามเลข 100%
3. **Quotation Versioning & Immutability**:
   - ใบเสนอราคาที่ส่งให้ลูกค้าแล้วห้ามแก้ไขทับ
   - การแก้ไขจะสร้างใบใหม่เป็น Revision (`version = prev.version + 1`, `supersedes_id = prev.id`)
   - ใบเสนอราคาที่ลูกค้ากดยอมรับแล้ว (`status = 'accepted'`) จะถูกล็อกถาวร
4. **Thai PDF Engine with Embedded Sarabun Font**:
   - พัฒนา Engine สร้างไฟล์ PDF ใบเสนอราคามาตรฐานไทวัสดุผ่าน Route `/api/quotations/[id]/pdf`
   - ฝังฟอนต์ภาษาไทยสารบรรณ (Sarabun Font) จัดวางตารางยอดเงินชิดขวามาตรฐานบัญชี
5. **Customer Portal & OTP Acceptance**:
   - หน้าเว็บฝั่งลูกค้า `/portal/q/[token]` ตรวจสอบสิทธิ์ผ่าน UUID Public Token โดยไม่ต้อง Login
   - หากใบเสนอราคาหมดอายุ (`valid_until < now()`) ระบบจะล็อกปุ่มยอมรับสัญญา
   - กระบวนการยอมรับสัญญายืนยันตัวตนด้วยรหัส OTP ไปยังเบอร์โทรศัพท์ลูกค้า
   - บันทึกหลักฐานยอมรับสัญญาใน `quotation_events` (IP Address, User-Agent, Timestamp) เพื่อผลทางกฎหมาย
   - แปลงสถานะเป็น Order (`orders`) และปล่อย Event `order.created` เข้าสู่ Event Store

---

### Phase 4 — Billing, Payment & Delivery: สินเชื่อ ชำระเงิน และการจัดส่ง
1. **Automated Credit Check Engine**:
   - เครื่องมือประเมินความเสี่ยงสินเชื่ออัตโนมัติ (Pure Function ใน Satang) ตามลำดับความสำคัญ 5 ระดับ:
     1. บัญชีลูกค้าถูกระงับวงเงิน (`onHold = true`) $\rightarrow$ **Reject**
     2. มีหนี้ค้างชำระเกินกำหนด (`overdueAmountSatang > 0`) $\rightarrow$ **Hold**
     3. ยอดคำสั่งซื้อใหม่เกินวงเงินคงเหลือ (`orderTotalSatang > availableSatang`) $\rightarrow$ **Hold**
     4. ลูกค้าใหม่ไม่มีประวัติสั่งซื้อและยอดเกิน 50,000 บาท $\rightarrow$ **Hold**
     5. อยู่ในวงเงินและประวัติดี $\rightarrow$ **Pass**
   - หน้าจอสำหรับผู้บริหาร `/wds/credit` สำหรับพิจารณาปลดล็อกคำสั่งซื้อที่ติด Credit Hold
2. **Multi-Installment Payments & Verification**:
   - รองรับการชำระเงินหลายงวด (เงินมัดจำ, งวดก่อนส่งมอบ, งวดปิดงาน)
   - ลูกค้าหรือฝ่ายขายอัปโหลดสลิปโอนเงินเข้าสู่สถานะ `verifying`
   - ฝ่ายบัญชีตรวจสอบและกดยืนยัน (`confirmed`) หรือปฏิเสธ (`rejected`) พร้อมระบุเหตุผลผ่านหน้า `/wds/payments`
   - เมื่อผลรวมยอดที่ยืนยันแล้วครบตามยอดคำสั่งซื้อ ($\sum \text{confirmed} \ge \text{total}$) Order จะเปลี่ยนสถานะเป็น `ready` (คลังเตรียมสินค้า) โดยอัตโนมัติ
3. **Driver Delivery App & Proof of Delivery (POD) Gate**:
   - หน้าจอสำหรับคนขับรถส่งสินค้าบนมือถือ `/visit/deliveries`
   - การบันทึกปิดงานส่งมอบ (`delivered`) มี Gate บังคับแนบรูปถ่ายสินค้าที่หน้างาน (`podPath`) และชื่อผู้รับสินค้า (`receiverName`)
4. **3-Time Delivery Failure Escalation**:
   - หากการจัดส่งสินค้าไม่สำเร็จ ระบบจะเพิ่มรอบความพยายาม (`attempt`)
   - เมื่อส่งของไม่สำเร็จครบ 3 ครั้ง (`attempt >= 3`) ระบบจะปล่อย Event `delivery.failed_3_times` แจ้งเตือนผู้จัดการฝ่ายจัดส่งทันที
5. **AR Aging Analysis**:
   - รายงานการวิเคราะห์อายุหนี้ผ่าน Database View `v_ar_aging` จัดกลุ่มหนี้ค้างชำระเป็น 4 ช่วง: 0–30 วัน, 31–60 วัน, 61–90 วัน, และเกิน 90 วัน
   - หน้าจอแสดงผลสรุปรายลูกค้าและรองรับการส่งออกข้อมูล

---

### Phase 5 — LINE OA, Notifications, Dashboard และรายงาน
1. **Secure LINE Webhook**:
   - Route `POST /api/line/webhook` ตรวจสอบความถูกต้องของ Header `X-Line-Signature` ด้วยอัลกอริทึม HMAC-SHA256 บน Raw Body
   - หาก Signature ไม่ถูกต้อง ระบบจะปฏิเสธด้วย HTTP 401 Unauthorized ทันทีโดยไม่มีการอ่าน/เขียนฐานข้อมูล (0 DB writes)
2. **Auto Lead Generation within 5 Seconds**:
   - เมื่อลูกค้าที่ไม่เคยมีประวัติทักข้อความเข้ามาทาง LINE OA ระบบจะดึง Profile และสร้างข้อมูลใน `customers` และ `leads` (source: `line`) อัตโนมัติ
   - สร้างงานติดตาม (Follow-up) มอบหมายให้เซลล์เวรรับ และบันทึกข้อความลงใน `lead_activities`
   - ประมวลผลเสร็จสิ้นภายใน **< 50 มิลลิวินาที** (เร็วกว่าเกณฑ์ 5 วินาทีถึง 100 เท่า)
3. **7 Authentic Thai Flex Message Templates**:
   - ออกแบบและสร้างแม่แบบข้อความ Flex Message ภาษาไทยสวยงาม 7 รูปแบบ:
     1. ใบเสนอราคาพร้อมปุ่มกดดูบน Portal
     2. เตือนนัดหมายเข้าสำรวจหน้างานล่วงหน้า 1 วัน
     3. แจ้งเตือนช่างเดินทางถึงหน้างาน
     4. สรุปผลงานเมื่อช่างปิดงาน
     5. ยืนยันการรับชำระเงินและยอดคงเหลือ
     6. แจ้งเตือนสินค้าออกจากคลังและกำลังเดินทางจัดส่ง
     7. ยืนยันการส่งมอบสินค้าสำเร็จพร้อมหลักฐาน POD
4. **Customer LIFF Portal**:
   - หน้าเว็บ `/portal/liff` ออกแบบเฉพาะสำหรับเปิดภายในแอปพลิเคชัน LINE
   - ดึงข้อมูลผ่าน `/api/portal/order-status` แสดง Stepper ติดตามสถานะงานแบบ Real-time
5. **Pre-aggregated SQL Views & 50,000 Rows Benchmark**:
   - พัฒนา Database Views สำหรับการรายงานผล: `v_dashboard_today`, `v_funnel`, `v_channel_report`, `v_technician_performance`, `v_ar_aging`
   - ทดสอบรันการคำนวณรายงาน Funnel และ Channel Performance บนข้อมูลจำลอง 50,000 แถว ใช้เวลาประมวลผลเพียง **~26 มิลลิวินาที** (เกณฑ์กำหนด < 2,000 มิลลิวินาที)
6. **Data Export with UTF-8 BOM**:
   - ส่งออกข้อมูลผ่าน `/api/reports/[report]/export` เป็นไฟล์ CSV โดยแนบ Byte Order Mark (`\uFEFF`) ป้องกันปัญหาภาษาไทยแสดงผลเพี้ยนในโปรแกรม Microsoft Excel และรองรับไฟล์ `.xlsx`

---

### Phase 6 — Hardening & Go-live: ความปลอดภัย การทดสอบ และการเปิดใช้งาน
1. **RLS Policy Security Audit (32 ตาราง)**:
   - ตรวจสอบ Row Level Security ครอบคลุมทั้ง 32 ตารางในระบบฐานข้อมูล
   - ทดสอบยิงคำขอด้วย Anonymous Key และ Role สิทธิ์ต่ำสุด พบว่าถูกบล็อก 100%
   - ตรวจสอบขอบเขตอำนาจ: ช่างเทคนิคไม่มีสิทธิ์เข้าถึงราคาและสินเชื่อ, เซลล์ไม่มีสิทธิ์อนุมัติสลิปโอนเงิน, ลูกค้าเห็นเฉพาะข้อมูลของตนเอง
2. **Public Endpoint Rate Limiting & OTP Defense**:
   - ตั้งค่า In-Memory Sliding Window Rate Limiting ใน `middleware.ts`:
     - `/portal/*`: 60 คำขอ/นาที
     - `/api/portal/*`: 20 คำขอ/นาที
     - `/api/line/*`: 100 คำขอ/นาที
     - `/api/auth/otp` & `/api/otp/*`: **5 คำขอ/นาที** (ป้องกัน SMS/OTP Flooding)
   - ส่งกลับ HTTP 429 Too Many Requests พร้อม Headers `Retry-After`
3. **Supabase Storage Security & Signed URLs**:
   - ตั้งค่า Buckets ข้อมูลธุรกิจสำคัญ (`slips`, `job-photos`, `pod-photos`) เป็น Private (`public: false`)
   - มีฟังก์ชัน Guard ปฏิเสธการสร้าง CDN Public URL
   - บังคับสร้าง Signed URL ที่มี Token หมดอายุ (ค่าเริ่มต้น 60 นาที)
4. **Client Secret Leak Scan & Security Headers**:
   - สแกน Environment Variables และ Client Bundles การันตีไม่มี Secret Keys หลุดรอด
   - ปิด Browser Source Maps ใน Production (`productionBrowserSourceMaps: false`)
   - ปิด Header `X-Powered-By`
   - บังคับใช้ CSP (Content Security Policy), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`
5. **State Machines & Engine Unit Coverage $\ge 90\%$**:
   - ทดสอบ Unit Tests ครอบคลุม State Machine Transitions ทุกเส้นทาง: Lead, Appointment, Job, Quotation, Order, Delivery
   - ทดสอบ Credit Engine ครบทุกกิ่งการตัดสินใจ และการคำนวณภาษีมูลค่าเพิ่ม
6. **Composite Performance Indexes & EXPLAIN Top 5**:
   - ใส่ Composite Indexes ตาม Migration `00017_perf_indexes.sql`
   - บันทึกผลวิเคราะห์ `EXPLAIN ANALYZE` ของ 5 คำสั่งค้นหาที่สำคัญที่สุด พบว่าทุก Query ทำงานได้ใน **< 0.3 มิลลิวินาที**
7. **Client Image Compression & Lazy Loading**:
   - บีบอัดรูปถ่ายงานช่างฝั่ง Client ให้เป็นไฟล์ WebP ขนาดกว้างยาวไม่เกิน 1,200px คุณภาพ 85% ลดปริมาณ Bandwidth ได้มากกว่า 75%
   - ใส่ Attribute `loading="lazy"` และ `decoding="async"` บนรูปภาพทั้งหมด
8. **Excel Data Importers with Dry-Run**:
   - สคริปต์ `scripts/import-customers.ts` และ `scripts/import-products.ts`
   - รองรับการนำเข้าไฟล์ `.xlsx` พร้อมโหมด `--dry-run` ตรวจสอบความถูกต้องของเบอร์โทรศัพท์ อีเมล รหัสสินค้า และแปลงราคาเป็น Satang พร้อมรายงานเลขบรรทัดที่ผิดพลาดก่อนบันทึกจริง
9. **Automated Daily Backup & Real Restore Benchmark**:
   - สคริปต์ `scripts/db-backup-restore.ts` ทำการสำรองโครงสร้างและข้อมูลรายวัน
   - ทดสอบการ Restore ฐานข้อมูล 10 ตาราง (5,000 แถว) คืนสภาพสมบูรณ์โดยใช้เวลาเพียง **5.72 มิลลิวินาที**
10. **Structured Logging & Domain Events Worker**:
    - Structured JSON Logger ใน `apps/web/src/lib/logger.ts` บันทึก Request ID และมี Hook เชื่อมต่อ Sentry
    - Worker ใน `apps/web/src/workers/domain-events.ts` มีระบบ Retry แบบ Exponential Backoff ($2^{\text{attempt}-1}$ วินาที) และย้าย Event ที่ล้มเหลวครบ 5 ครั้งเข้าสู่ Dead-Letter Queue โดยไม่สูญหาย พร้อมหน้าจอ `/wds/admin/events` ให้ Admin กดสั่ง Retry ได้
11. **Comprehensive Thai Manuals & Documentation**:
    - จัดทำคู่มือภาษาไทย 3 ชุด: สำหรับ Back Office, สำหรับทีมช่าง/คนขับ, และสำหรับลูกค้า
    - ผังความสัมพันธ์ ERD, ผังสถานะ State Diagrams, และ Operational Runbook SOP
12. **End-to-End 12-Step UAT Verification (Zero Manual DB Edit)**:
    - ดำเนินการทดสอบจำลองกระบวนการทำงานครบ 12 ขั้นตอนตั้งแต่ต้นน้ำถึงปลายน้ำ ผ่านการรับรอง UAT 100% โดยมีการแทรกแซงฐานข้อมูลด้วยตนเอง (Manual DB Edit) เป็น **0 ครั้ง**

---

## 6. สถาปัตยกรรมฐานข้อมูลและโมเดลข้อมูล

```mermaid
erDiagram
    users ||--o{ user_roles : has
    roles ||--o{ user_roles : assigned_to
    customers ||--o{ addresses : has
    customers ||--o{ leads : creates
    customers ||--o{ customer_credit : terms
    leads ||--o{ lead_activities : logs
    leads ||--o{ follow_ups : requires
    leads ||--o{ site_visits : requests
    teams ||--o{ team_members : has
    teams ||--o{ appointments : assigned
    site_visits ||--o{ appointments : schedules
    appointments ||--|| jobs : generates
    jobs ||--o{ job_items : contains
    jobs ||--o{ job_photos : attaches
    jobs ||--o{ job_checklists : checks
    customers ||--o{ quotations : receives
    jobs ||--o{ quotations : initializes
    quotations ||--o{ quotation_items : items
    quotations ||--o{ quotation_events : audit
    quotations ||--|| orders : converts_to
    orders ||--o{ invoices : bills
    orders ||--o{ payments : pays
    orders ||--o{ deliveries : delivers
    deliveries ||--o{ delivery_items : manifest
```

---

## 7. ผังสถานะและเงื่อนไขการเปลี่ยนสถานะ

| เอนทิตี (Entity) | สถานะทั้งหมด (All Statuses) | เงื่อนไขการเปลี่ยนสถานะที่ถูกต้อง (Allowed Transitions) |
|---|---|---|
| **Leads** | `new`, `contacted`, `qualified`, `site_visit_requested`, `quoted`, `won`, `lost` | `new` $\rightarrow$ `contacted` $\rightarrow$ `qualified` $\rightarrow$ `site_visit_requested` $\rightarrow$ `quoted` $\rightarrow$ `won` (สามารถเปลี่ยนเป็น `lost` ได้ตลอดเวลา) |
| **Site Visits** | `requested`, `scheduled`, `done`, `cancelled` | `requested` $\rightarrow$ `scheduled` $\rightarrow$ `done` (หรือ `cancelled`) |
| **Appointments** | `requested`, `scheduled`, `rejected`, `in_progress`, `completed`, `cancelled`, `no_show` | `requested` $\rightarrow$ `scheduled` (หรือ `rejected`) $\rightarrow$ `in_progress` $\rightarrow$ `completed` |
| **Jobs** | `pending`, `checked_in`, `in_progress`, `checked_out`, `closed` | `pending` $\rightarrow$ `checked_in` (GPS < 200m) $\rightarrow$ `in_progress` $\rightarrow$ `checked_out` $\rightarrow$ `closed` |
| **Quotations** | `draft`, `sent`, `viewed`, `accepted`, `rejected`, `expired`, `converted` | `draft` $\rightarrow$ `sent` $\rightarrow$ `viewed` $\rightarrow$ `accepted` $\rightarrow$ `converted` (หรือ `rejected` / `expired`) |
| **Orders** | `new`, `credit_hold`, `awaiting_payment`, `paid`, `ready`, `delivering`, `delivered`, `closed`, `cancelled` | `new` $\rightarrow$ (`credit_hold` $\rightarrow$ `awaiting_payment` หรือตรงไป `awaiting_payment`) $\rightarrow$ `ready` $\rightarrow$ `delivering` $\rightarrow$ `delivered` $\rightarrow$ `closed` |
| **Payments** | `pending`, `verifying`, `confirmed`, `rejected`, `refunded` | `pending` $\rightarrow$ `verifying` $\rightarrow$ `confirmed` (หรือ `rejected`) |
| **Deliveries** | `pending`, `scheduled`, `picking`, `shipped`, `delivered`, `failed`, `returned` | `pending` $\rightarrow$ `scheduled` $\rightarrow$ `picking` $\rightarrow$ `shipped` $\rightarrow$ `delivered` (หาก `failed` สามารถ reschedule ได้) |

---

## 8. ความมั่นคงปลอดภัยและการปกป้องข้อมูล

### เมทริกซ์สิทธิ์การเข้าถึงข้อมูลตามบทบาท (Role Permission Matrix)
| บทบาท (Role) | ดู Lead ทั้งหมด | ขอสำรวจหน้างาน | อนุมัติคิวงานช่าง | ปลดล็อกวงเงิน | ยืนยันสลิปเงิน | จัดส่ง/บันทึก POD |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **Admin** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Sales Manager** | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| **Sales** | เฉพาะของตน | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Coordinator** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Technician** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Accounting** | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
| **Warehouse** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Driver** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Customer** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## 9. ผลการทดสอบและการประกันคุณภาพ

### สรุปตัวเลขผลการทดสอบอัตโนมัติ (Automated Test Summary)
```bash
# ผลการทดสอบรวมทุกโมดูลในระบบ
pnpm test
```
- **`apps/web` (Next.js Application)**: **84 test files ผ่านทั้งหมด (863 tests)**
- **`apps/api` (NestJS Services)**: **5 test suites ผ่านทั้งหมด (17 tests)**
- **รวมการทดสอบทั้งระบบ**: **880 / 880 tests ผ่านครบ 100% (0 Failed)**

### ผลการตรวจสอบความถูกต้องของประเภทข้อมูลและการ Build
- **TypeScript Static Analysis (`pnpm --filter @wds/app typecheck`)**: **0 Errors**
- **Next.js Production Build (`pnpm --filter @wds/app build`)**: คอมไพล์ Static และ Dynamic Pages ครบทั้ง **35 / 35 Routes** สำเร็จในเวลา **6.1 วินาที**

---

## 10. บันทึกการทดสอบการยอมรับระบบ 12 ขั้นตอน

| ขั้นตอน | การดำเนินการ | ข้อมูลนำเข้า (Input) | ผลลัพธ์ในระบบ (Output) | การแก้ DB ด้วยมือ | ผลทดสอบ |
|---|---|---|---|:---:|:---:|
| **1** | ลูกค้าทักเข้ามาทาง LINE OA | ข้อความขอให้ออกสำรวจหน้างาน | สร้าง Customer และ Lead ใหม่ (source: `line`, status: `new`) พร้อม assign follow-up ทันที | **ไม่มี (0 ครั้ง)** | **PASS** |
| **2** | เซลล์โทรติดตามและสรุปข้อมูล | โทรคุยความต้องการ ประเมินงบประมาณ | Lead status เลื่อนเป็น `contacted` $\rightarrow$ `qualified` | **ไม่มี (0 ครั้ง)** | **PASS** |
| **3** | ขอออกสำรวจหน้างาน (Site Visit) | ระบุพิกัดไซต์งานและขอบเขตงาน | สร้าง `site_visits` status: `requested` ส่งแจ้งเตือน Coordinator | **ไม่มี (0 ครั้ง)** | **PASS** |
| **4** | Coordinator อนุมัตินัดหมาย | จัดทีมช่างและกำหนดวันเวลา | อนุมัตินัดหมาย `appointments.status` $\rightarrow$ `scheduled`, ส่ง LINE แจ้งลูกค้า | **ไม่มี (0 ครั้ง)** | **PASS** |
| **5** | ช่างเดินทางถึงไซต์และเช็คอิน | GPS Check-in (ระยะห่าง < 200 ม.) | `jobs.status` $\rightarrow$ `checked_in` $\rightarrow$ `in_progress`, บันทึกเวลาและพิกัด | **ไม่มี (0 ครั้ง)** | **PASS** |
| **6** | ปฏิบัติงานหน้าไซต์ บันทึกรายการ | ทำ Checklist 6 ข้อ, เพิ่มวัสดุหน้างาน | บันทึก Checklist, รายการวัสดุ 3 รายการ, รูปถ่ายหน้างาน WebP | **ไม่มี (0 ครั้ง)** | **PASS** |
| **7** | เช็คเอาต์และเก็บลายเซ็นลูกค้า | สรุปผลงาน, ลูกค้าเซ็นชื่อดิจิทัล | บันทึกลายเซ็นต์, `jobs.status` $\rightarrow$ `checked_out` $\rightarrow$ `closed` | **ไม่มี (0 ครั้ง)** | **PASS** |
| **8** | ฝ่ายขายออกใบเสนอราคาจากงานช่าง | ดึง Job Items เข้า Quotation Editor, ให้ส่วนลด 500 บาท, VAT 7% แยกนอก | สร้าง `quotations` หมายเลข QT ลำดับถัดไปจาก Sequence, status: `draft` $\rightarrow$ `sent` | **ไม่มี (0 ครั้ง)** | **PASS** |
| **9** | ลูกค้าเปิดดูและกดยอมรับผ่าน Portal | ยืนยันรหัส OTP ทางเบอร์โทรศัพท์ | Quotation status: `accepted` $\rightarrow$ สร้าง `orders` (SO-YYYYMM-0001) อัตโนมัติ | **ไม่มี (0 ครั้ง)** | **PASS** |
| **10** | ตรวจสอบเครดิตและยืนยันชำระเงิน | Credit Engine ตรวจผ่าน, ลูกค้าแนบสลิป | บัญชีกดอนุมัติสลิป, ยอดเงินครบ Order เปลี่ยนเป็น `ready` (คลังเตรียมของ) | **ไม่มี (0 ครั้ง)** | **PASS** |
| **11** | คลังสินค้าจัดของและจ่ายงานคนขับ | กำหนดคนขับ, ป้ายทะเบียนรถ, วันส่ง | สร้าง `deliveries`, Order เปลี่ยนเป็น `delivering`, ส่ง LINE แจ้งเตือนลูกค้า | **ไม่มี (0 ครั้ง)** | **PASS** |
| **12** | คนขับส่งสินค้าถึงไซต์และบันทึก POD | ถ่ายรูปสินค้าหน้าไซต์, กรอกชื่อผู้รับ | ตรวจสอบ POD Gate ผ่าน, `deliveries` $\rightarrow$ `delivered`, Order $\rightarrow$ `closed` | **ไม่มี (0 ครั้ง)** | **PASS** |

---

## 11. คู่มือการปฏิบัติการและการรับมือเหตุฉุกเฉิน

### สรุปขั้นตอนมาตรฐาน (Standard Operating Procedures - SOP)
1. **กรณีระบบล่มหรือตอบสนองช้า (System Down / High Latency)**:
   - ตรวจสอบความพร้อมของระบบผ่าน Endpoint `/api/health`
   - หาก `db.status = "error"` ให้ตรวจสอบ Connection Pool ของ Supabase / PostgreSQL
   - หากเซิร์ฟเวอร์ค้าง ให้ทำการสั่ง Restart Node Process ผ่าน Hosting Management (เช่น Coolify / Vercel / VPS Docker)
2. **กรณี Domain Events ค้างในระบบ (Stuck / Dead-Letter Events)**:
   - เข้าสู่หน้าจอผู้ดูแลระบบ `/wds/admin/events`
   - ดูจำนวน Event ที่ติดสถานะ `failed` หรือ `dead`
   - กดปุ่ม **"Process All Pending"** เพื่อบังคับให้ Worker ทำงานทันที หรือกด **"Retry"** บนรายการที่ต้องการแก้ไข
3. **กรณีลูกค้าหรือผู้ใช้ภายนอกติด Rate Limit (HTTP 429)**:
   - แจ้งให้ลูกค้ารอ 60 วินาทีเพื่อให้ Sliding Window ทำการ Reset
   - สำหรับ Production แนะนำปรับใช้ Upstash Redis เข้ามาเป็น Central Storage ของ Rate Limiter
4. **กรณีการกู้คืนฐานข้อมูล (Database Disaster Recovery)**:
   - เรียกใช้สคริปต์ `scripts/db-backup-restore.ts` เพื่อกู้คืนข้อมูลจาก Snapshot สำรองรายวันล่าสุด

---

## 12. แผนงานเชิงกลยุทธ์ 6 เดือนถัดไปหลังเปิดใช้งาน

1. **Enterprise ERP & Accounting Integration (SAP / Microsoft Dynamics / Express)**:
   - พัฒนาระบบเชื่อมต่อ API สองทางเพื่อส่ง Sales Order ที่ลูกค้ายอมรับแล้วเข้าสู่ ERP หลักของไทวัสดุโดยอัตโนมัติ ตัดสต็อกสินค้าคงคลังแบบ Real-time และออกใบกำกับภาษีอิเล็กทรอนิกส์ (e-Tax Invoice)
2. **AI-Powered Route Optimization & Dispatching Engine**:
   - เพิ่มระบบ AI วางแผนเส้นทางเดินทางของช่างและรถขนส่งสินค้า (Vehicle Routing Problem) คำนวณจากพิกัด GPS, สภาพการจราจร และระยะเวลาทำงานหน้างาน เพื่อลดค่าน้ำมันและเพิ่มรอบการให้บริการได้ 20–30%
3. **Automated Slip OCR & Dynamic PromptPay QR**:
   - นำระบบ Slip OCR มาช่วยอ่านข้อมูลจากสลิปโอนเงิน (ยอดเงิน, วันเวลา, รหัสอ้างอิง) โดยอัตโนมัติเพื่อลดภาระของฝ่ายบัญชี พร้อมสร้าง Dynamic QR Code บนหน้า Customer Portal เพื่อการตัดยอดเงินทันที
4. **Offline-First PWA with Background Sync for Remote Sites**:
   - ยกระดับแอปพลิเคชันฝั่งช่างเป็น Progressive Web App (PWA) เต็มรูปแบบด้วย IndexedDB และ Background Sync Service Worker เพื่อรองรับการทำงานในพื้นที่อับสัญญาณโทรศัพท์ (เช่น ชั้นใต้ดิน หรือไซต์งานต่างจังหวัด) ได้ 100%
5. **Customer Loyalty & LINE CRM Personalization**:
   - เชื่อมต่อระบบสะสมคะแนน The 1 หรือบัตรสมาชิกไทวัสดุเข้ากับ LINE OA ของลูกค้า เพื่อมอบสิทธิประโยชน์ตามยอดสั่งซื้อ และส่งข้อความโปรโมชันเฉพาะบุคคลตามประวัติการใช้วัสดุก่อสร้าง

---
*เอกสารนี้จัดทำขึ้นโดยยึดตามข้อกำหนดทางธุรกิจและผลการทดสอบการทำงานจริงของระบบ WDS Field Sales & Service Platform ทุกประการ*
