# คู่มือสถาปัตยกรรมและการพัฒนาระบบฉบับสมบูรณ์ (Phase 0 — Phase 6)
# WDS Field Sales & Service Platform (Thai Watsadu)

> เอกสารฉบับนี้รวบรวมบริบททางธุรกิจ ข้อกำหนดทางเทคนิค และรายละเอียดการพัฒนาระบบครบถ้วนทุก Phase (Phase 0 ถึง Phase 6) สำหรับระบบ **Thai Watsadu Wholesale & Direct Sales (WDS)**

สามารถดูเนื้อหาฉบับสมบูรณ์พร้อมไดอะแกรมและตารางเปรียบเทียบได้ที่:
👉 [`docs/WDS_SYSTEM_GUIDE_PHASE_0_TO_6.md`](docs/WDS_SYSTEM_GUIDE_PHASE_0_TO_6.md)

---

## 📌 สรุปสาระสำคัญของแต่ละ Phase

- **บริบทธุรกิจ (Business Context)**: ระบบบริหารงานขายโครงการและบริการติดตั้งหน้างาน ครอบคลุมเส้นทางการทำงาน 12 ขั้นตอน จาก Lead $\rightarrow$ Site Visit $\rightarrow$ Quotation $\rightarrow$ Order $\rightarrow$ Payment $\rightarrow$ Delivery & POD.
- **Phase 0 — Foundation**: โครงสร้าง Monorepo (`pnpm workspaces`), Next.js 15, NestJS, Supabase + PostgreSQL, Drizzle ORM, ตารางแกนกลาง 8 ตาราง, ระบบ RLS และ Audit Log.
- **Phase 1 — WDS Core**: Lead Intake จาก LINE/โทรศัพท์/หน้าร้าน, Deduplication Engine, Follow-up Activities, Site Visit Request, และการแยกสิทธิ์ทีมขายตามพื้นที่ (Sales Isolation).
- **Phase 2 — Visit App**: แอปพลิเคชันมือถือสำหรับช่างและคนจัดคิวงาน, Coordinator Approval Workbench, Geofenced Check-in (<200m), Work Mode Checklist & Added-onsite Items, Offline Sync, ลายเซ็นต์ดิจิทัลของลูกค้า.
- **Phase 3 — E-ordering**: การคำนวณเงินในระดับ Satang Integer (Zero Float), การป้องกันเลขเอกสารข้าม/ชนกันด้วย Postgres Sequence, Quotation Versioning Immutability, Thai PDF Generation (Sarabun font), Customer Portal OTP Acceptance, SO creation & Domain Events.
- **Phase 4 — Billing, Payment & Delivery**: Credit Engine ตรวจสอบวงเงิน 8 กฎพร้อม Manager Override, Multi-installment Payments และการยืนยันสลิป, Driver App พร้อม Gate บังคับรูป POD, ระบบเตือนส่งสินค้าล้มเหลว 3 ครั้ง, AR Aging Bucketing (0-30, 31-60, 61-90, 90+ วัน).
- **Phase 5 — LINE OA, Notifications, Dashboard & Reports**: LINE Webhook HMAC-SHA256 ปลอดภัย 100% (0 DB writes on fail), สร้าง Lead อัตโนมัติใน < 50ms, 7 Thai Flex Messages, LIFF Portal, Pre-aggregated SQL Views คำนวณ 50,000 แถวใน ~26ms, ส่งออก Excel/CSV (UTF-8 BOM).
- **Phase 6 — Hardening & Go-live**: RLS Audit ครอบคลุม 32 ตาราง, Rate Limit ป้องกัน Flooding & OTP, Supabase Private Storage & Signed URLs มีวันหมดอายุ, Scan Client Secrets, State Machine & Credit Engine Unit Tests Coverage >=90%, 6 E2E Playwright Flows, Top 5 Queries EXPLAIN ANALYZE, สคริปต์ Excel Import (Dry-Run) และ Daily Backup/Restore จับเวลาได้ 5.72ms, Structured Logging with Request ID, Domain Events Retry & Dead-letter UI, คู่มือภาษาไทย 3 ชุด, และ UAT 12 ขั้นตอนผ่าน 100% (Manual DB Edits = 0).

---

## 🏆 ตัวชี้วัดคุณภาพระบบ (Quality Metrics)
- **Automated Tests**: **880 / 880 tests passed (100% Pass Rate)**
- **TypeScript Typecheck**: **0 errors (Exit code 0)**
- **Next.js Production Build**: **35 / 35 routes compiled & optimized cleanly (Exit code 0)**
- **UAT 12 Steps**: **12/12 ผ่านฉลุยโดยไม่ต้องแก้ DB ด้วยมือแม้แต่ครั้งเดียว**
