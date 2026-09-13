export const seedQuotations = [
  {
    number: 'QT-202609-0001',
    status: 'sent',
    subtotalSatang: 48500000,
    billDiscountSatang: 1500000,
    vatRate: 7,
    vatMode: 'exclusive',
    vatAmountSatang: 3290000,
    totalSatang: 50290000, // 502,900.00 บาท
    terms: 'เครดิตเทอม 30 วัน จัดส่งฟรีถึงหน้างานเมื่อสั่งซื้อครบตามจำนวนที่กำหนด',
    note: 'เสนอราคาโครงการทาวน์โฮม สุขุมวิท 71',
    items: [
      { description: 'ปูนซีเมนต์ SCG ตราช้าง ถุง 50 กก.', qty: 1000, unit: 'ถุง', unitPriceSatang: 19500, discountSatang: 1000000, amountSatang: 18500000 },
      { description: 'เหล็กข้ออ้อย DB12 ยาว 12 ม.', qty: 1000, unit: 'เส้น', unitPriceSatang: 18500, discountSatang: 500000, amountSatang: 18000000 },
      { description: 'อิฐมวลเบา SCG ขนาด 7.5x20x60 ซม.', qty: 6667, unit: 'ก้อน', unitPriceSatang: 1800, discountSatang: 0, amountSatang: 12000000 },
    ],
  },
  {
    number: 'QT-202609-0002',
    status: 'accepted',
    subtotalSatang: 125000000,
    billDiscountSatang: 5000000,
    vatRate: 7,
    vatMode: 'exclusive',
    vatAmountSatang: 8400000,
    totalSatang: 128400000, // 1,284,000.00 บาท
    terms: 'เครดิตเทอม 45 วัน วงเงินพิเศษ Corporate Partner',
    note: 'จัดซื้อวัสดุโครงสร้างประจำเดือน ก.ย. 2026',
    items: [
      { description: 'เหล็กข้ออ้อย DB16 ยาว 12 ม.', qty: 2500, unit: 'เส้น', unitPriceSatang: 32000, discountSatang: 3000000, amountSatang: 77000000 },
      { description: 'ปูนซีเมนต์ SCG ตราช้าง ถุง 50 กก.', qty: 2500, unit: 'ถุง', unitPriceSatang: 19500, discountSatang: 2000000, amountSatang: 46750000 },
      { description: 'ทรายหยาบ', qty: 30, unit: 'ลูกบาศก์เมตร', unitPriceSatang: 45000, discountSatang: 0, amountSatang: 1250000 },
    ],
  },
  {
    number: 'QT-202609-0003',
    status: 'draft',
    subtotalSatang: 8900000,
    billDiscountSatang: 0,
    vatRate: 7,
    vatMode: 'exclusive',
    vatAmountSatang: 623000,
    totalSatang: 9523000, // 95,230.00 บาท
    terms: 'ชำระเงินมัดจำ 50% ก่อนเริ่มจัดส่ง',
    note: 'งานซ่อมบำรุงหลังคาและฉนวนกันความร้อน',
    items: [
      { description: 'กระเบื้องหลังคาลอนคู่ SCG รุ่น Fiber Cement', qty: 1000, unit: 'แผ่น', unitPriceSatang: 5500, discountSatang: 0, amountSatang: 5500000 },
      { description: 'ฉนวนกันความร้อนแผ่น 2 นิ้ว ขนาด 1.2x2.4 ม.', qty: 80, unit: 'แผ่น', unitPriceSatang: 35000, discountSatang: 0, amountSatang: 2800000 },
      { description: 'ซิลิโคนยาแนวกันน้ำ GE ขนาด 280 มล.', qty: 67, unit: 'หลอด', unitPriceSatang: 8900, discountSatang: 0, amountSatang: 600000 },
    ],
  },
]

export const seedOrders = [
  {
    number: 'SO-202609-0001',
    status: 'paid',
    totalSatang: 128400000,
    creditCheckResult: 'pass',
    creditUsedPct: 45,
    note: 'ผ่านการตรวจสอบวงเงินเครดิตแล้ว จัดส่งจากศูนย์ CDC01',
  },
  {
    number: 'SO-202609-0002',
    status: 'awaiting_payment',
    totalSatang: 50290000,
    creditCheckResult: 'pass',
    creditUsedPct: 60,
    note: 'ลูกค้ายื่นสลิปโอนเงินแล้ว อยู่ระหว่างตรวจสอบบัญชี',
  },
]
