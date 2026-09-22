export interface KmArticle {
  id: string
  title: string
  category: 'core' | 'sales' | 'operations' | 'ordering' | 'billing' | 'logistics' | 'analytics' | 'faq'
  categoryLabel: string
  roles: string[]
  readTime: string
  summary: string
  isFeatured?: boolean
  actionLink?: {
    label: string
    href: string
  }
  sections: {
    heading: string
    content: string
    codeSnippet?: string
    alert?: {
      type: 'info' | 'warning' | 'tip' | 'success'
      text: string
    }
  }[]
  faqs?: {
    q: string
    a: string
  }[]
}

export interface KmCategory {
  id: string
  label: string
  iconName: string
  description: string
}

export interface LifecycleStep {
  step: number
  title: string
  role: string
  description: string
  route: string
  badge: string
}

export const KM_CATEGORIES: KmCategory[] = [
  { id: 'all', label: 'ทั้งหมด (All)', iconName: 'BookOpen', description: 'รวมคลังความรู้และคู่มือระบบทั้งหมด' },
  { id: 'core', label: 'แนวคิดหลัก (Core)', iconName: 'Sparkles', description: 'โครงสร้าง CRM, ความแตกต่าง ลูกค้า vs ลีด vs Pipeline' },
  { id: 'sales', label: 'งานขาย & CRM', iconName: 'Users', description: 'การจัดการลูกค้า, ลีด, Follow-up และ Sales Pipeline' },
  { id: 'operations', label: 'สำรวจ & ช่าง', iconName: 'MapPin', description: 'นัดหมายสำรวจหน้างาน, Geofence Check-in, Checklist' },
  { id: 'ordering', label: 'ใบเสนอราคา & ออเดอร์', iconName: 'FileText', description: 'Zero-Float Calculation, PDF ภาษาไทย, OTP LINE' },
  { id: 'billing', label: 'สินเชื่อ & ชำระเงิน', iconName: 'ShieldCheck', description: 'Credit Hold, Manager Override, ตรวจสอบสลิป' },
  { id: 'logistics', label: 'จัดส่ง & ติดตั้ง', iconName: 'Truck', description: 'จัดรถส่งของ, POD Photo Gate, จัดการส่งล้มเหลว' },
  { id: 'analytics', label: 'รายงาน & ระบบ', iconName: 'BarChart3', description: 'Dashboard, Funnel, AR Aging, UTF-8 BOM Excel' },
  { id: 'faq', label: 'คำถามที่พบบ่อย (FAQ)', iconName: 'HelpCircle', description: 'รวมคำถามที่พบบ่อยและการแก้ปัญหาเบื้องต้น' },
]

export const KM_LIFECYCLE_STEPS: LifecycleStep[] = [
  { step: 1, title: 'Lead Intake', role: 'Sales / Bot', description: 'รับข้อมูลลูกค้าจาก LINE OA (<50ms), โทรศัพท์, หรือหน้าร้านไทวัสดุ', route: '/wds/leads', badge: 'Lead' },
  { step: 2, title: 'Deduplication & Assign', role: 'System / Manager', description: 'ตรวจเบอร์/LINE ซ้ำซ้อน และมอบหมายพนักงานขายผู้รับผิดชอบ', route: '/wds/leads', badge: 'Dedupe' },
  { step: 3, title: 'Follow-up & Survey Request', role: 'Sales', description: 'ติดต่อลูกค้า ปักหมุด GPS ไซต์งาน และส่งคำขอสำรวจหน้างาน', route: '/wds/followups', badge: 'Survey Req' },
  { step: 4, title: 'Coordinator Approval', role: 'Coordinator', description: 'ตรวจสอบความพร้อม จัดสรรทีมช่างตามโซน และยืนยันคิวนัดหมาย', route: '/wds/appointments', badge: 'Approve' },
  { step: 5, title: 'Geofenced Check-in (<200m)', role: 'Technician', description: 'ช่างถึงหน้างาน เช็คอินพิกัด GPS พร้อมถ่ายรูปตรวจสอบความปลอดภัย', route: '/visit/dashboard', badge: 'Geofence' },
  { step: 6, title: 'Onsite Checklist & Signature', role: 'Technician & Customer', description: 'ทำรายการประเมิน เพิ่มวัสดุหน้างาน และให้ลูกค้าลงลายเซ็นต์ดิจิทัล', route: '/visit/jobs', badge: 'Sign-off' },
  { step: 7, title: 'Zero-Float Quotation (QT)', role: 'Sales / Coordinator', description: 'สร้างใบเสนอราคา คำนวณภาษีและส่วนลดระดับสตางค์ แม่นยำ 100%', route: '/wds/quotations/new', badge: 'Satang Math' },
  { step: 8, title: 'Customer OTP Acceptance', role: 'Customer', description: 'ส่ง Flex Message ผ่าน LINE ลูกค้าตรวจสอบและกดยืนยันด้วย OTP SMS', route: '/portal/orders', badge: 'LINE OTP' },
  { step: 9, title: 'Credit Engine Check', role: 'Accounting / Manager', description: 'ตรวจสอบวงเงิน 8 กฎ ปลดล็อก Credit Hold ด้วย Manager Override', route: '/wds/credit', badge: 'Dual-Control' },
  { step: 10, title: 'Multi-Installment Payment', role: 'Accounting', description: 'ลูกค้าแนบสลิปชำระเงิน ตรวจสอบและกดยืนยันยอดเงินครบถ้วน', route: '/wds/payments', badge: 'Slip Verified' },
  { step: 11, title: 'Warehouse Fulfillment', role: 'Warehouse', description: 'เบิกจ่ายสินค้าจากคลังไทวัสดุ จัดสรรรถและคนขับพร้อมออกใบส่งของ', route: '/wds/deliveries', badge: 'Ready' },
  { step: 12, title: 'Delivery & POD Photo Gate', role: 'Driver', description: 'คนขับส่งมอบสินค้า ถ่ายรูปหลักฐาน POD หน้างาน และปิดงานสำเร็จ', route: '/visit/deliveries', badge: 'Delivered' },
]

export const KM_ARTICLES: KmArticle[] = [
  {
    id: 'customer-lead-pipeline',
    title: 'ความแตกต่าง 3 ระดับ: ลูกค้า (Customer) vs ลีด (Lead) vs Sales Pipeline',
    category: 'core',
    categoryLabel: 'แนวคิดหลักของระบบ',
    roles: ['Sales', 'Coordinator', 'Sales Manager', 'Accounting'],
    readTime: '3 นาที',
    isFeatured: true,
    summary: 'ทำความเข้าใจโครงสร้าง CRM 1 Customer : N Leads ที่ขับเคลื่อนอยู่บน Sales Pipeline 7 ขั้นตอน เพื่อการทำงานที่ไม่สับสนและแม่นยำ',
    actionLink: {
      label: 'เปิดกระดาน Sales Pipeline',
      href: '/wds/pipeline',
    },
    sections: [
      {
        heading: '1. ภาพรวมโครงสร้าง 3 ระดับ (3-Tier CRM Architecture)',
        content: `ในระบบ Thai Watsadu WDS ข้อมูลฝั่งลูกค้าและงานขายถูกจัดหมวดหมู่อย่างเป็นระบบเพื่อรองรับลูกค้าธุรกิจ (B2B) และผู้รับเหมาที่มีหลายโปรเจกต์พร้อมกัน:
1. **ลูกค้า (Customer Master Data)**: ข้อมูลคู่ค้า/บริษัทถาวร เช่น บจก. สยามก่อสร้าง (Tax ID 13 หลัก, วงเงินสินเชื่อ, ไซต์งาน GPS, ยอดซื้อสะสม)
2. **ลีด (Leads / Opportunities)**: โอกาสทางการค้าหรือความต้องการสั่งซื้อเฉพาะงาน เช่น "ขอราคาเหล็กเส้น ไซต์บางนา" หรือ "ขอสำรวจงานฝ้า ไซต์รัชดา"
3. **กระดานการขาย (Sales Pipeline)**: กระดานแสดงขั้นตอนและภาพรวมการขายทั้งระบบ 7 ขั้นตอน เพื่อติดตามยอดเงินรวมและวิเคราะห์คอขวด`,
        codeSnippet: `┌────────────────────────────────────────────────────────────────────────┐
│ 🏢 1. ลูกค้า (Customer Master Data - /wds/customers)                   │
│  - นิติบุคคล/คู่ค้าถาวร (บจก. สยามก่อสร้าง, Tax ID: 0105558000123)     │
│  - วงเงินเครดิต 2,000,000 บาท, เครดิตเทอม 30 วัน, ไซต์งาน GPS หลายแห่ง │
└───────────────┬────────────────────────────────────────────────────────┘
                │ 1 ลูกค้า มีได้หลาย Lead (1 : N)
                ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 🎯 2. ลีด (Leads / Opportunities - /wds/leads)                         │
│  - โอกาสทางการขายเฉพาะโปรเจกต์ (เช่น ขอราคาเหล็กเส้น ไซต์บางนา)         │
│  - ระบุสินค้าที่สนใจ, งบประมาณ, ช่องทางติดต่อ, พนักงานขายผู้ดูแล        │
└───────────────┬────────────────────────────────────────────────────────┘
                │ ขับเคลื่อนอยู่บน
                ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 📊 3. กระดานการขาย (Sales Pipeline - /wds/pipeline)                    │
│  - กระดานรวม 7 ขั้นตอน (ใหม่ ➜ ติดต่อ ➜ นัดสำรวจ ➜ เสนอราคา ➜ ชนะ/แพ้)   │
│  - สลับมุมมอง Card View (Kanban) และ List View (Table) ได้             │
│  - คำนวณยอดเงินรวมแต่ละขั้นตอน (Stage Deal Totals)                     │
└────────────────────────────────────────────────────────────────────────┘`,
      },
      {
        heading: '2. ตารางเปรียบเทียบเชิงลึก 5 มิติ',
        content: `| มิติเปรียบเทียบ | 🏢 ลูกค้า (Customer) | 🎯 ลีด (Lead) | 📊 กระดานการขาย (Sales Pipeline) |
|---|---|---|---|
| **นิยาม** | ข้อมูลคู่ค้า/บริษัทถาวร (Master Data) | โอกาสทางการค้าเฉพาะโปรเจกต์ (Deal) | กระบวนการขายและภาพรวมทั้งทีม (Process) |
| **ขอบเขตข้อมูล** | ชื่อบริษัท, Tax ID 13 หลัก, วงเงินสินเชื่อ, ไซต์งาน GPS | สินค้าที่สนใจ, งบประมาณ, บันทึกการโทร Follow-up | นำ Lead ทั้งหมดมาจัดเรียงตาม 7 สถานะ พร้อมยอดเงินรวม |
| **วงจรชีวิต** | อยู่ถาวรตลอดไป ตราบใดที่เป็นคู่ค้า | จบลงเมื่อ "ชนะการขาย (Won)" หรือ "ยกเลิก (Lost)" | อัปเดตแบบ Real-time ตลอดเวลา |
| **ความสัมพันธ์** | 1 ลูกค้า มีได้หลาย Lead และหลาย Order | เกิดขึ้นภายใต้ลูกค้า 1 ราย หรือเป็นผู้สนใจใหม่ | เป็นกระดานรวมที่บรรจุ Lead ของทุกคน |
| **หน้าจอในระบบ** | /wds/customers (Customer 360°) | /wds/leads (Lead Intake & Detail) | /wds/pipeline (Kanban & List Switcher) |`,
        alert: {
          type: 'tip',
          text: 'ลูกค้า 1 รายสามารถเปิดหลาย Lead ได้พร้อมกันโดยไม่ทับซ้อนกัน เช่น ไซต์ก่อสร้างบางนา และไซต์ก่อสร้างพระราม 9 จะถูกติดตามแยกอิสระใน Pipeline!',
        },
      },
      {
        heading: '3. ตัวอย่างสถานการณ์จริงในการปฏิบัติงาน',
        content: `**สถานการณ์**: "บจก. ธนบุรีคอนสตรัคชั่น" เป็นลูกค้าเดิมในระบบ
1. มีความต้องการสั่งซื้อ "แผ่นยิปซัม 800 แผ่น สำหรับไซต์งานพระราม 2" $\rightarrow$ เซลล์เปิด **Lead ใหม่ (Lead #1)**
2. ต่อมาในสัปดาห์เดียวกัน ต้องการขอช่างสำรวจ "ระบบไฟและโครงฝ้า ไซต์งานบางใหญ่" $\rightarrow$ เซลล์เปิด **Lead ใหม่ (Lead #2)**
3. ทั้ง 2 Lead จะปรากฏบน **Sales Pipeline** ในขั้นตอนที่แตกต่างกัน (Lead #1 อยู่ในขั้น "ออกใบเสนอราคา", Lead #2 อยู่ในขั้น "นัดสำรวจหน้างาน")
4. เมื่อเปิดหน้า **Customer 360°** ของ บจก. ธนบุรีคอนสตรัคชั่น จะเห็นประวัติทั้ง 2 งาน และยอดซื้อสะสมรวมทั้งหมดอย่างครบถ้วน`,
      },
    ],
    faqs: [
      {
        q: 'ถ้าเป็นลูกค้าใหม่ที่ยังไม่เคยมีในระบบ ต้องสร้างลูกค้าก่อนหรือสร้าง Lead ก่อน?',
        a: 'สามารถกดสร้าง Lead ได้ทันที ระบบจะทำการสร้างโปรไฟล์ลูกค้าให้อัตโนมัติ หรือจะไปที่เมนู /wds/customers แล้วกด "+ เพิ่มลูกค้าใหม่" เพื่อกรอก Tax ID และวงเงินเครดิตให้ครบถ้วนก่อนก็ได้',
      },
      {
        q: 'เมื่อปิดการขายสำเร็จ (Won) ข้อมูล Lead จะหายไปหรือไม่?',
        a: 'ไม่หายครับ ข้อมูลจะถูกเปลี่ยนสถานะเป็น Won และบันทึกประวัติอยู่ในหน้า Customer 360° Profile ตลอดไป',
      },
    ],
  },
  {
    id: 'customer-master-hub',
    title: 'คู่มือการจัดการลูกค้าองค์กร (Customer 360° Profile & Credit Limit)',
    category: 'sales',
    categoryLabel: 'งานขาย & CRM',
    roles: ['Sales', 'Sales Manager', 'Accounting'],
    readTime: '4 นาที',
    summary: 'วิธีเพิ่มลูกค้าใหม่ (+ เพิ่มลูกค้าใหม่), กำหนด Tax ID 13 หลัก, ตั้งวงเงินเครดิต และดูประวัติสะสมใน Customer 360°',
    actionLink: {
      label: 'เปิดหน้าข้อมูลลูกค้า',
      href: '/wds/customers',
    },
    sections: [
      {
        heading: '1. การเปิดบัญชีลูกค้าใหม่ (+ เพิ่มลูกค้าใหม่)',
        content: `ไปที่เมนู **ลูกค้า (/wds/customers)** แล้วคลิกปุ่ม **"+ เพิ่มลูกค้าใหม่"**
- **ชื่อนิติบุคคล / ชื่อลูกค้า**: เช่น บริษัท สมาร์ท บิลเดอร์ จำกัด
- **เลขประจำตัวผู้เสียภาษี (Tax ID)**: 13 หลัก สำหรับออกใบกำกับภาษีเต็มรูป
- **เบอร์โทรศัพท์ และ ผู้ติดต่อหลัก**: สำหรับติดต่อประสานงาน
- **วงเงินสินเชื่อเริ่มต้น (Credit Limit)**: วงเงินเครดิตที่ผ่านการอนุมัติ (บาท)
- **เงื่อนไขการชำระเงิน (Credit Term)**: เช่น เงินสด (0 วัน), 30 วัน, 45 วัน, 60 วัน
- **ที่อยู่จดทะเบียนและไซต์งาน**: ที่อยู่หลักและพิกัดแผนที่สำหรับจัดส่งสินค้า`,
        alert: {
          type: 'info',
          text: 'ระบบมีระบบตรวจสอบ Tax ID 13 หลักเพื่อป้องกันการป้อนข้อมูลผิดพลาดหรือซ้ำซ้อนในฐานข้อมูล',
        },
      },
      {
        heading: '2. หน้าโปรไฟล์ลูกค้า Customer 360° View',
        content: `คลิกที่ชื่อลูกค้าในตารางเพื่อเข้าสู่หน้า Customer 360° (` + '`/wds/customers/[id]`' + `) ซึ่งรวบรวมข้อมูลรอบด้าน:
- **แถบสถานะเครดิต**: แสดงวงเงินอนุมัติ, ยอดที่ใช้ไป, วงเงินคงเหลือ และสถานะ Credit Hold
- **ประวัติการซื้อสะสม (Lifetime Value)**: สรุปยอดสั่งซื้อสำเร็จทั้งหมด
- **รายการลีด (Leads History)**: รายการงานขายทั้งหมดที่ผูกกับลูกค้ารายนี้
- **รายการใบเสนอราคาและคำสั่งซื้อ (Orders & Quotations)**: ประวัติเอกสารและสถานะการชำระ
- **รายการไซต์งานและพิกัด GPS (Delivery Sites)**: จุดส่งสินค้าทั้งหมดของลูกค้า`,
      },
    ],
  },
  {
    id: 'leads-intake-followup',
    title: 'คู่มือการรับลีดและติดตามงาน (Lead Intake, Deduplication & Follow-up)',
    category: 'sales',
    categoryLabel: 'งานขาย & CRM',
    roles: ['Sales', 'Coordinator'],
    readTime: '3 นาที',
    summary: 'การรับ Lead อัตโนมัติจาก LINE OA (<50ms), ระบบป้องกันข้อมูลซ้ำ, และการบันทึกการโทร/กิจกรรมติดตามผล',
    actionLink: {
      label: 'เปิดหน้ารายการลีด',
      href: '/wds/leads',
    },
    sections: [
      {
        heading: '1. ช่องทางการรับ Lead เข้าสู่ระบบ',
        content: `ระบบ WDS รองรับการรับข้อมูลผู้สนใจจากหลายช่องทาง:
1. **LINE Official Account (อัตโนมัติ)**: เมื่อลูกค้าทัก LINE OA ระบบจะสร้าง Customer และ Lead ให้ภายใน **< 50 มิลลิวินาที** พร้อมมอบหมายเซลล์เวร
2. **หน้าร้านไทวัสดุ (Store Walk-in)**: พนักงานหน้าร้านกดสร้าง Lead และระบุสาขา
3. **โทรศัพท์ / Direct Sales**: เซลล์กรอกข้อมูลความต้องการและงบประมาณ`,
      },
      {
        heading: '2. ระบบป้องกันข้อมูลซ้ำซ้อน (Deduplication Engine)',
        content: `ระบบจะตรวจสอบเบอร์โทรศัพท์และ LINE User ID หากพบว่ามีลูกค้าเดิมในระบบ จะทำการเชื่อมโยงข้อมูลเข้ากับบัญชีลูกค้าเดิมทันที เพื่อให้เห็นประวัติงานอย่างต่อเนื่อง`,
        alert: {
          type: 'tip',
          text: 'อย่าลืมบันทึกกิจกรรมทุกครั้งหลังโทรคุย เพื่อให้ระบบช่วยแจ้งเตือนวันนัดหมายถัดไปอัตโนมัติ',
        },
      },
    ],
  },
  {
    id: 'sales-pipeline-kanban-list',
    title: 'คู่มือการใช้งานกระดานการขาย (Sales Pipeline: Card vs List View)',
    category: 'sales',
    categoryLabel: 'งานขาย & CRM',
    roles: ['Sales', 'Sales Manager'],
    readTime: '4 นาที',
    summary: 'ความหมายของทั้ง 7 ขั้นตอนการขาย, วิธีสลับมุมมอง Card (Kanban) / List (Table), การคำนวณ Stage Deal Totals และตรวจจับคอขวด',
    actionLink: {
      label: 'เปิดกระดาน Sales Pipeline',
      href: '/wds/pipeline',
    },
    sections: [
      {
        heading: '1. โครงสร้าง 7 ขั้นตอนของ Sales Pipeline',
        content: `1. **ลีดใหม่ (New Lead)**: งานเพิ่งเข้ามารอติดต่อ
2. **ติดต่อแล้ว (Contacted)**: โทรสอบถามความต้องการและสเปกงานแล้ว
3. **นัดสำรวจหน้างาน (Site Survey Scheduled)**: ส่งคำขอหรืออยู่ระหว่างช่างเข้าตรวจหน้างาน
4. **ออกใบเสนอราคา (Quotation Sent)**: ส่งใบเสนอราคาให้ลูกค้าแล้ว
5. **รออนุมัติ / รอชำระเงิน (Pending Payment / Credit Check)**: รอลูกค้าโอนเงินมัดจำหรือตรวจเครดิต
6. **ปิดการขายสำเร็จ (Won 🎉)**: อนุมัติคำสั่งซื้อเรียบร้อย
7. **ยกเลิก / ไม่สำเร็จ (Lost ❌)**: ลูกค้ายกเลิกหรือปฏิเสธข้อเสนอ`,
      },
      {
        heading: '2. การสลับมุมมอง Card View และ List View',
        content: `บนหน้าจอ /wds/pipeline สามารถกดปุ่มสลับมุมมองได้ที่มุมขวาบน:
- **มุมมองการ์ด (Card View / Kanban)**: เหมาะสำหรับการลากวาง (Drag & Drop) เพื่อเปลี่ยนสถานะงานอย่างรวดเร็ว
- **มุมมองตาราง (List View / Table)**: เหมาะสำหรับการดูข้อมูลแถวเรียงชัดเจน กรองข้อมูลหลายเงื่อนไข และตรวจเช็ครายการจำนวนมาก`,
      },
    ],
  },
  {
    id: 'site-visit-field-service',
    title: 'คู่มือการนัดหมายและช่างสำรวจหน้างาน (Site Visit & Geofenced Check-in)',
    category: 'operations',
    categoryLabel: 'สำรวจ & ช่าง',
    roles: ['Coordinator', 'Technician'],
    readTime: '5 นาที',
    summary: 'การอนุมัติคิวงาน, การตรวจสอบพิกัด GPS Geofence (<200m), Checklist ความปลอดภัย, โหมด Offline Sync และลายเซ็นต์ดิจิทัล',
    actionLink: {
      label: 'เปิดหน้านัดหมายสำรวจ',
      href: '/wds/appointments',
    },
    sections: [
      {
        heading: '1. หน้าที่ของฝ่ายจัดคิว (Coordinator Workbench)',
        content: `1. ไปที่ **/wds/appointments** ตรวจสอบรายการในแท็บ "รออนุมัติ"
2. จัดสรรช่างเทคนิคตามพื้นที่และความชำนาญ
3. ตรวจสอบปฏิทินงานรวมที่ **/wds/appointments/calendar** เพื่อไม่ให้คิวงานซ้อนกัน
4. กดยืนยันนัดหมาย $\rightarrow$ ระบบจะส่ง LINE Flex Message แจ้งลูกค้าและช่างอัตโนมัติ`,
      },
      {
        heading: '2. การปฏิบัติงานของช่างผ่าน Field Service App (/visit)',
        content: `1. **Geofenced Check-in**: ช่างต้องอยู่ห่างจากจุดปักหมุดหน้างานไม่เกิน 200 เมตร จึงจะกดเริ่มงานได้
2. **Safety & Scope Checklist**: ทำรายการตรวจสอบความปลอดภัยและพื้นที่
3. **Added-onsite Items**: เพิ่มรายการวัสดุหรืออุปกรณ์ที่ต้องใช้เพิ่มเติมหน้างาน
4. **Digital Signature**: ให้ลูกค้าตรวจงานและเซ็นต์ชื่อบนหน้าจอมือถือเพื่อปิดงาน`,
        alert: {
          type: 'warning',
          text: 'หากจุดเช็คอินอยู่นอกรัศมี 200 เมตร ระบบจะติด Flag เตือนหัวหน้างานเพื่อตรวจสอบความโปร่งใส',
        },
      },
    ],
  },
  {
    id: 'quotation-zero-float-pdf',
    title: 'คู่มือการออกใบเสนอราคาและ Zero-Float Math (Quotations & LINE OTP)',
    category: 'ordering',
    categoryLabel: 'ใบเสนอราคา & สั่งซื้อ',
    roles: ['Sales', 'Coordinator'],
    readTime: '4 นาที',
    summary: 'การคำนวณเงินในระดับสตางค์ (Zero-Float), เอกสาร PDF ภาษาไทย Sarabun Font, การส่ง Flex Message และให้ลูกค้ายืนยัน OTP',
    actionLink: {
      label: 'เปิดหน้าใบเสนอราคา',
      href: '/wds/quotations',
    },
    sections: [
      {
        heading: '1. การคำนวณเงินแบบ Zero-Float Satang Integer',
        content: `ระบบ WDS คำนวณเงินทั้งหมดด้วยหน่วยสตางค์ (Integer) เพื่อป้องกันปัญหาทศนิยมปัดเศษคลาดเคลื่อน:
- \`subtotalSatang\` = ยอดรวมสินค้าก่อนลด
- \`discountSatang\` = ส่วนลดที่ได้รับ
- \`vatAmountSatang\` = ภาษีมูลค่าเพิ่ม 7%
- \`totalSatang\` = ยอดสุทธิที่ต้องชำระ`,
      },
      {
        heading: '2. การส่งใบเสนอราคาและการยืนยันผ่าน OTP',
        content: `1. กดปุ่ม **"ส่ง QT ให้ลูกค้า"** $\rightarrow$ ส่ง LINE Flex Message อัตโนมัติ
2. ลูกค้าเปิดลิงก์ ดู PDF ภาษาไทยมาตรฐาน (Sarabun Font)
3. ลูกค้ากด **"ยอมรับใบเสนอราคา"** $\rightarrow$ ระบบส่งรหัส OTP ทาง SMS เพื่อยืนยันตัวตน
4. เมื่อ OTP ถูกต้อง ระบบจะแปลงใบเสนอราคาเป็น **Order (คำสั่งซื้อ)** ทันที`,
      },
    ],
  },
  {
    id: 'credit-engine-dual-control',
    title: 'คู่มือระบบสินเชื่อและการตรวจสอบสลิป (Credit Dual-Control & Payments)',
    category: 'billing',
    categoryLabel: 'สินเชื่อ & ชำระเงิน',
    roles: ['Accounting', 'Sales Manager'],
    readTime: '5 นาที',
    summary: 'เงื่อนไข Credit Hold 8 กรณี, กฎการขอ Manager Override, การยืนยันสลิปชำระเงินหลายงวด และการปลดล็อก Order สู่คลังสินค้า',
    actionLink: {
      label: 'เปิดหน้า Credit Control',
      href: '/wds/credit',
    },
    sections: [
      {
        heading: '1. กฎการตรวจสอบเครดิตอัตโนมัติ (Credit Engine)',
        content: `คำสั่งซื้อจะถูกระงับเป็น **Credit Hold** อัตโนมัติในกรณีต่อไปนี้:
- ลูกค้าติดสถานะระงับสินเชื่อชั่วคราว (Account on Hold)
- มียอดหนี้ค้างชำระเกินกำหนด (Overdue AR Aging)
- ยอดสั่งซื้อเกินวงเงินเครดิตคงเหลือ
- ลูกค้าใหม่ที่มียอดสั่งซื้อครั้งแรกเกิน 50,000 บาท`,
      },
      {
        heading: '2. การขอ Manager Override และการยืนยันสลิป',
        content: `1. **Manager Override**: ผู้จัดการฝ่ายขายหรือฝ่ายบัญชีสามารถตรวจสอบเหตุผลและกดอนุมัติที่หน้า **/wds/credit**
2. **การตรวจสลิป (/wds/payments)**: ฝ่ายบัญชีตรวจสอบรูปภาพสลิปที่ลูกค้าแนบมา และกด "✅ ยืนยันรับชำระ"
3. เมื่อยอดเงินชำระครบถ้วน ระบบจะเปลี่ยนสถานะ Order เป็น **"คลังเตรียมจัดส่ง"** อัตโนมัติ`,
      },
    ],
  },
  {
    id: 'delivery-pod-logistics',
    title: 'คู่มือการจัดส่งสินค้าและหลักฐานการรับมอบ (Deliveries & POD Gate)',
    category: 'logistics',
    categoryLabel: 'จัดส่ง & ติดตั้ง',
    roles: ['Warehouse', 'Driver', 'Coordinator'],
    readTime: '4 นาที',
    summary: 'การจัดรถและคนขับ, การถ่ายรูป POD Gate บังคับก่อนปิดงาน, และระบบแจ้งเตือนกรณีจัดส่งล้มเหลว 3 ครั้ง',
    actionLink: {
      label: 'เปิดหน้าจัดการจัดส่ง',
      href: '/wds/deliveries',
    },
    sections: [
      {
        heading: '1. การจัดตารางส่งสินค้าและมอบหมายคนขับ',
        content: `1. ไปที่ **/wds/deliveries** เลือก Order ที่พร้อมส่ง
2. ระบุชื่อคนขับรถ, ทะเบียนรถ, และช่วงเวลานัดส่งมอบ
3. คนขับจะได้รับรายการงานบนมือถือทันที`,
      },
      {
        heading: '2. เงื่อนไข POD Gate บังคับก่อนปิดงาน',
        content: `คนขับรถจะไม่สามารถกดจบงาน "Delivered" ได้หากไม่ได้แนบหลักฐาน:
- รูปถ่ายสินค้าที่วางหน้างานจริง (Photo of Delivery)
- ชื่อ-นามสกุลของผู้รับสินค้าปลายทาง
- หากส่งของล้มเหลวครบ 3 ครั้ง ระบบจะแจ้งเตือนผู้บริหารทันที`,
      },
    ],
  },
  {
    id: 'executive-analytics-reports',
    title: 'คู่มือรายงานผู้บริหารและดัชนีชี้วัด (Analytics, SQL Views & Excel UTF-8 BOM)',
    category: 'analytics',
    categoryLabel: 'รายงาน & ระบบ',
    roles: ['Sales Manager', 'Admin', 'Accounting'],
    readTime: '3 นาที',
    summary: 'การดู Dashboard ยอดขายวันนี้, รายงาน Funnel Conversion, รายงานอายุลูกหนี้ AR Aging, และการ Export ภาษาไทยไม่เพี้ยน',
    actionLink: {
      label: 'เปิด Dashboard รายงาน',
      href: '/wds/dashboard',
    },
    sections: [
      {
        heading: '1. แดชบอร์ดสรุปผลงานประจำวัน (/wds/dashboard)',
        content: `แสดงดัชนีชี้วัด 4 กลุ่มหลัก:
- ยอดขายสุทธิและจำนวนคำสั่งซื้อวันนี้
- งานสำรวจหน้างานที่รออนุมัติ / งานช่างวันนี้
- คำสั่งซื้อที่รอชำระเงินและติด Credit Hold
- งานจัดส่งสินค้าที่กำลังเดินทางและส่งสำเร็จแล้ว`,
      },
      {
        heading: '2. รายงานขั้นสูงและการ Export ภาษาไทย',
        content: `ระบบมี Pre-aggregated SQL Views คำนวณเร็วระดับเสี้ยววินาที (<30ms สำหรับ 50,000 แถว):
- **/wds/reports/funnel**: อัตราการแปลงผล Lead $\rightarrow$ QT $\rightarrow$ Order
- **/wds/reports/ar-aging**: รายงานอายุลูกหนี้ 0-30, 31-60, 61-90, 90+ วัน
- ทุกรายงานส่งออก CSV พร้อม **UTF-8 BOM** เปิดใน Microsoft Excel ภาษาไทยไม่เป็นตัวเอเลี่ยน`,
      },
    ],
  },
  {
    id: 'faq-troubleshooting',
    title: 'รวมคำถามที่พบบ่อยและการแก้ปัญหาเบื้องต้น (FAQ & Troubleshooting)',
    category: 'faq',
    categoryLabel: 'คำถามที่พบบ่อย',
    roles: ['All Roles'],
    readTime: '4 นาที',
    summary: 'คำตอบสำหรับคำถามยอดฮิต เช่น Lead หายไปไหน, ทำไมติด Credit Hold, วิธีแก้เมื่อลูกค้าไม่ได้รับ LINE Flex Message',
    sections: [
      {
        heading: 'หมวดคำถามงานขาย & CRM',
        content: `**Q: Lead หายไปจากหน้าจอ?**
A: ให้ตรวจสอบตัวกรอง "สถานะ" หรือ "ช่วงวันที่" ที่มุมบนของหน้า /wds/leads อาจติด Filter อยู่

**Q: ลูกค้า 1 บริษัท สามารถเปิดกี่ Lead ก็ได้ใช่ไหม?**
A: ใช่ครับ สามารถเปิดกี่งานก็ได้ โดยประวัติทั้งหมดจะถูกรวบรวมอยู่ที่หน้า Customer 360° เดียวกัน`,
      },
      {
        heading: 'หมวดคำถามระบบ & ข้อความ',
        content: `**Q: ลูกค้าแจ้งว่าไม่ได้รับข้อความ LINE ใบเสนอราคา?**
A: ตรวจสอบว่าลูกค้าเคยกด Block บัญชี LINE Official Account หรือไม่ หากลูกค้าบล็อก ให้คัดลอก Direct Portal Link ส่งให้ลูกค้าทาง SMS หรือแชทแทน

**Q: ทำไม Order ถึงติดสถานะ Credit Hold ทั้งที่ไม่เคยมีหนี้ค้าง?**
A: อาจเป็นเพราะเป็นลูกค้าเปิดบัญชีใหม่และสั่งซื้อครั้งแรกยอดเกิน 50,000 บาท ซึ่งระบบตั้งกฎความปลอดภัยไว้ ฝ่ายบัญชีสามารถกด Override ปลดล็อกได้ทันที`,
      },
    ],
  },
]
