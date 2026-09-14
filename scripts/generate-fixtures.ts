import * as XLSX from 'xlsx'
import * as fs from 'fs'
import * as path from 'path'

const fixturesDir = path.resolve(__dirname, 'fixtures')
if (!fs.existsSync(fixturesDir)) {
  fs.mkdirSync(fixturesDir, { recursive: true })
}

// 1. Customer Sample Fixture
// Row 1: Header (name, phone, email, tax_id, line_ref)
// Valid rows + deliberate error rows for testing dry-run validation
const customerData = [
  ['name', 'phone', 'email', 'tax_id', 'line_ref'],
  ['บริษัท บิลเดอร์ กรุ๊ป จำกัด', '0812345678', 'contact@builder.co.th', '0105559001234', 'U_line_builder'],
  ['คุณสมชาย ช่างทอง', '0929998888', 'somchai@gmail.com', '', 'U_line_somchai'],
  ['หจก. ทรัพย์ทวี โฮม', '029876543', 'info@subtawee.com', '0105558004567', ''],
  // Error row 5: missing name
  ['', '0891112222', 'noname@test.com', '', ''],
  // Error row 6: invalid phone format
  ['นายทดสอบ ผิดเบอร์', '12345', 'wrongphone@test.com', '', ''],
  // Error row 7: invalid email format
  ['นายทดสอบ ผิดเมล', '0897776666', 'invalid-email-format', '', ''],
]

const wbCust = XLSX.utils.book_new()
const wsCust = XLSX.utils.aoa_to_sheet(customerData)
XLSX.utils.book_append_sheet(wbCust, wsCust, 'Customers')
XLSX.writeFile(wbCust, path.join(fixturesDir, 'sample-customers.xlsx'))

// 2. Product Sample Fixture
// Row 1: Header (code, name, unit, price_baht, category, description)
const productData = [
  ['code', 'name', 'unit', 'price_baht', 'category', 'description'],
  ['SKU-CMT-001', 'ปูนซีเมนต์ปอร์ตแลนด์ ตราช้าง 50 กก.', 'ถุง', '165', 'วัสดุก่อสร้าง', 'ปูนโครงสร้างมาตรฐาน'],
  ['SKU-STL-002', 'เหล็กเส้นกลม SR24 ขนาด 9 มม. ยาว 10 ม.', 'เส้น', '145', 'เหล็กและโลหะ', 'เหล็กมาตรฐาน มอก.'],
  ['SKU-COL-003', 'สว่านกระแทกไร้สาย 18V MAKITA', 'เครื่อง', '3890', 'เครื่องมือช่าง', 'พร้อมแบตเตอรี่ 2 ก้อน'],
  // Error row 5: missing code
  ['', 'กระเบื้องปูพื้นแกรนิตโต้ 60x60', 'กล่อง', '320', 'กระเบื้อง', ''],
  // Error row 6: invalid negative price
  ['SKU-ERR-005', 'ท่อ PVC ตราช้าง 2 นิ้ว', 'ท่อน', '-80', 'ประปา', ''],
]

const wbProd = XLSX.utils.book_new()
const wsProd = XLSX.utils.aoa_to_sheet(productData)
XLSX.utils.book_append_sheet(wbProd, wsProd, 'Products')
XLSX.writeFile(wbProd, path.join(fixturesDir, 'sample-products.xlsx'))

console.log('✅ Generated sample Excel fixtures in scripts/fixtures/')
