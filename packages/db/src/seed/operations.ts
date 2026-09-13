export const seedSiteVisits = [
  {
    purpose: 'สำรวจโครงสร้างหลังคาโรงงานและวัดระยะแนวติดตั้งฉนวนกันความร้อน',
    status: 'scheduled',
    scope: {
      areas: ['หลังคาอาคาร A (1,200 ตร.ม.)', 'หลังคาอาคาร B (1,200 ตร.ม.)'],
      measurements: ['ความสูงสันหลังคา 8.5 ม.', 'ระยะห่างแป 1.0 ม.'],
      notes: 'ต้องการรถกระเช้าและอุปกรณ์เซฟตี้ทำงานบนที่สูง',
    },
  },
  {
    purpose: 'สำรวจพื้นที่หน้างานเตรียมจัดส่งและลงปูนซีเมนต์ถุง 1,000 ถุง',
    status: 'done',
    scope: {
      areas: ['ลานจอดพักสินค้าด้านหน้าโครงการ'],
      measurements: ['ความกว้างทางเข้า 4.2 ม. (รถ 6 ล้อเข้าได้สะดวก)'],
      notes: 'มีพื้นที่กองเก็บมุงผ้าใบกันฝนเรียบร้อย',
    },
  },
]

export const seedFollowUps = [
  {
    channel: 'phone',
    status: 'open',
    note: 'โทรติดตามผลการตรวจรับใบเสนอราคา QT-202609-0001 กับฝ่ายจัดซื้อ (คุณสมหมาย)',
    dueAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // Overdue by 2 days
  },
  {
    channel: 'line',
    status: 'open',
    note: 'ส่งแบบประเมินผลสำรวจหน้างานและแผนงานติดตั้งฉนวนให้ลูกค้าดูทางไลน์',
    dueAt: new Date(Date.now() + 4 * 60 * 60 * 1000), // Today
  },
  {
    channel: 'phone',
    status: 'open',
    note: 'โทรยืนยันเวลาที่รถขนส่ง 10 ล้อจะนำปูนเข้าหน้างานโครงการหมู่บ้านจัดสรร',
    dueAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // This week
  },
]

export const seedDeliveries = [
  {
    vehicle: 'รถบรรทุก 10 ล้อ (ทะเบียน 70-1234 กทม)',
    trackingNo: 'DEL-202609-001',
    status: 'shipped',
    scheduledDate: new Date(),
    driverNote: 'คนขับ: นายสมหมาย มั่นคง (089-111-2222) ออกเดินทางจาก CDC วังน้อย 08:30 น.',
  },
  {
    vehicle: 'รถกระบะ 4 ล้อตู้ทึบ (ทะเบียน 1ฒผ-5678 กทม)',
    trackingNo: 'DEL-202609-002',
    status: 'scheduled',
    scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
    driverNote: 'ส่งสินค้าอุปกรณ์ช่างและซิลิโคน สาขาบางนา',
  },
]
