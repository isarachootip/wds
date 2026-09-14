export const seedSiteVisits = [
  {
    customerCode: 'C002',
    purpose: 'สำรวจโครงสร้างหลังคาโรงงานและวัดระยะแนวติดตั้งฉนวนกันความร้อน',
    status: 'done',
    scope: {
      areas: ['หลังคาอาคาร A (1,200 ตร.ม.)', 'หลังคาอาคาร B (1,200 ตร.ม.)'],
      measurements: ['ความสูงสันหลังคา 8.5 ม.', 'ระยะห่างแป 1.0 ม.'],
      notes: 'ใช้รถกระเช้าและติดตั้งตาข่ายเซฟตี้ทำงานบนที่สูงเรียบร้อย',
    },
  },
  {
    customerCode: 'C009',
    purpose: 'สำรวจแนววางท่อระบายน้ำ คสล. และจุดเชื่อมต่อบ่อพักน้ำโครงการ',
    status: 'scheduled',
    scope: {
      areas: ['ถนนเมนหลัก โครงการบางใหญ่ (ความยาว 450 ม.)'],
      measurements: ['ระดับความลึกบ่อพัก 1.8 ม.'],
      notes: 'นัดหมายวิศวกรโครงการวันพุธ 10:00 น. นำตัวอย่างฝาท่อเหล็กหล่อไปแสดง',
    },
  },
  {
    customerCode: 'C010',
    purpose: 'วัดพื้นที่และประเมินปริมาณกระเบื้องเซรามิค SCG Excella พลาซ่าพิษณุโลก',
    status: 'scheduled',
    scope: {
      areas: ['อาคารพาณิชย์โซนหน้า 1,600 ตร.ม.'],
      measurements: ['ความลาดเอียงหลังคา 35 องศา'],
      notes: 'ทีมช่างศูนย์บริการไทวัสดุพิษณุโลกนัดเข้าหน้างาน',
    },
  },
  {
    customerCode: 'C013',
    purpose: 'สำรวจพื้นที่หน้างานและทดสอบการรับน้ำหนักดินสำหรับงานปรับลาดจอดรถ',
    status: 'done',
    scope: {
      areas: ['ลานจอดรถด้านข้าง 3,500 ตร.ม.'],
      measurements: ['ความหนาชั้นหินคลุก 25 ซม.'],
      notes: 'รถ 10 ล้อสามารถเข้าลงหินคลุกและบดอัดได้สะดวก',
    },
  },
  {
    customerCode: 'C020',
    purpose: 'สำรวจหลังคาเมทัลชีทเพื่อวางโครงรับแผงโซลาร์เซลล์',
    status: 'done',
    scope: {
      areas: ['หลังคาโรงเก็บของ 800 ตร.ม.'],
      measurements: ['ทิศใต้ รับแดดได้ 6 ชม./วัน'],
      notes: 'สำรวจเสร็จสิ้น แต่ลูกค้ายกเลิกเนื่องจากตัดงบประมาณ',
    },
  },
]

export const seedFollowUps = [
  {
    customerCode: 'C007',
    channel: 'phone',
    status: 'open',
    note: 'โทรติดตามผลการพิจารณาใบเสนอราคา QT-202609-0007 กับฝ่ายจัดซื้อ (คุณสุรชัย)',
    dueAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // Overdue by 2 days
  },
  {
    customerCode: 'C008',
    channel: 'phone',
    status: 'open',
    note: 'โทรสรุปเงื่อนไขส่วนลดพิเศษ 3% งานเมทัลชีทคลังสินค้าบางนา หลังได้รับอนุมัติจาก Sales Manager',
    dueAt: new Date(Date.now() + 4 * 60 * 60 * 1000), // Today
  },
  {
    customerCode: 'C011',
    channel: 'line',
    status: 'open',
    note: 'ส่งใบเทียบราคากลุ่มเหล็กรูปพรรณและตารางค่าขนส่งไปเชียงใหม่-ลำปาง ทาง LINE OA',
    dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
  },
  {
    customerCode: 'C014',
    channel: 'line',
    status: 'open',
    note: 'ติดต่อคุณสมชาย สอบถามเฉดสี TOA และคำนวณจำนวนถังสีสำหรับบ้านเดี่ยว 2 ชั้น',
    dueAt: new Date(Date.now() + 6 * 60 * 60 * 1000), // Today
  },
  {
    customerCode: 'C015',
    channel: 'phone',
    status: 'open',
    note: 'โทรสอบถามสเปคถังเก็บน้ำ DOS และปั๊มน้ำ 15 ชุด เพื่อจัดเตรียมใบเสนอราคาโครงการบางบัวทอง',
    dueAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
  },
  {
    customerCode: 'C016',
    channel: 'phone',
    status: 'open',
    note: 'โทรคอนเฟิร์มสเปคคอนกรีต 280 ksc และวันนัดเทพื้นกับผู้รับเหมาแหลมฉบัง',
    dueAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
  },
]

export const seedDeliveries = [
  {
    customerCode: 'C001',
    orderNumber: 'SO-202609-0001',
    vehicle: 'รถบรรทุก 10 ล้อ (ทะเบียน 70-1234 กทม)',
    trackingNo: 'DEL-202609-001',
    status: 'delivered',
    scheduledDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    driverNote: 'คนขับ: นายสมหมาย มั่นคง ส่งมอบปูนและเหล็กข้ออ้อยถึงไซต์สุขุมวิท 71 มีลายเซ็นโฟร์แมนตรวจรับแล้ว',
  },
  {
    customerCode: 'C002',
    orderNumber: 'SO-202609-0002',
    vehicle: 'รถ 6 ล้อตู้ทึบ (ทะเบียน 82-4567 สป)',
    trackingNo: 'DEL-202609-002',
    status: 'delivered',
    scheduledDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    driverNote: 'ส่งมอบกระเบื้องลอนคู่และฉนวนโรงงานกิ่งแก้ว ครบ 2,500 แผ่น ช่างรับมอบเรียบร้อย',
  },
  {
    customerCode: 'C003',
    orderNumber: 'SO-202609-0003',
    vehicle: 'รถเทรลเลอร์ 18 ล้อ (ทะเบียน 71-8899 นบ)',
    trackingNo: 'DEL-202609-003',
    status: 'shipped',
    scheduledDate: new Date(),
    driverNote: 'ออกจาก CDC วังน้อย 09:15 น. กำลังเดินทางไปไซต์งานราชพฤกษ์ คาดว่าถึง 14:00 น.',
  },
  {
    customerCode: 'C004',
    orderNumber: 'SO-202609-0004',
    vehicle: 'รถบรรทุก 10 ล้อ (ทะเบียน 70-5544 กทม)',
    trackingNo: 'DEL-202609-004',
    status: 'scheduled',
    scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
    driverNote: 'นัดหมายส่งเหล็ก DB20 ล็อตฐานราก คอนโดเจริญนคร เวลา 08:00 น. ก่อนเวลาห้ามรถใหญ่เข้าเมือง',
  },
  {
    customerCode: 'C005',
    orderNumber: 'SO-202609-0005',
    vehicle: 'รถ 6 ล้อคอกสูง (ทะเบียน 83-1122 กทม)',
    trackingNo: 'DEL-202609-005',
    status: 'delivered',
    scheduledDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    driverNote: 'ส่งมอบกระเบื้องแกรนิตโต้และสุขภัณฑ์ COTTO โครงการอนันดา พระราม 9 เรียบร้อย',
  },
  {
    customerCode: 'C006',
    orderNumber: 'SO-202609-0006',
    vehicle: 'รถกระบะ 4 ล้อตู้ทึบ (ทะเบียน 1ฒผ-5678 กทม)',
    trackingNo: 'DEL-202609-006',
    status: 'delivered',
    scheduledDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    driverNote: 'ขนส่งแผ่นยิปซั่มขึ้นลิฟต์บริการ อาคารสาทรสแควร์ ชั้น 28 เรียบร้อย',
  },
]
