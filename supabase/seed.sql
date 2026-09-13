-- Seed customers
INSERT INTO public.customers (code, name, tax_id, phone, email, credit_limit_satang, customer_group, status) VALUES
  ('C001', 'บริษัท วิวัฒน์ก่อสร้าง จำกัด', '0105560123456', '02-123-4567', 'info@wiwat-construction.co.th', 50000000, 'corporate', 'active'),
  ('C002', 'ห้างหุ้นส่วนจำกัด เจริญพัฒนา', '0103500234567', '02-234-5678', 'charoen.dev@gmail.com', 20000000, 'sme', 'active'),
  ('C003', 'บริษัท สยามคอนสตรัคชั่น จำกัด', '0105540345678', '02-345-6789', 'contact@siam-construction.com', 100000000, 'corporate', 'active'),
  ('C004', 'นายสมชาย ใจดี', '1234567890123', '081-234-5678', 'somchai.jaidee@gmail.com', 5000000, 'individual', 'active'),
  ('C005', 'บริษัท พิษณุโลก ดีเวลลอปเมนท์ จำกัด', '0565550456789', '055-456-7890', 'phitsanulok.dev@outlook.com', 30000000, 'corporate', 'active'),
  ('C006', 'ห้างหุ้นส่วนจำกัด นอร์ทเทิร์น บิลดิ้ง', '0503500567890', '053-567-8901', 'northern.building@gmail.com', 15000000, 'sme', 'active'),
  ('C007', 'บริษัท ทรีดี โปรเจกต์ จำกัด', '0105560678901', '02-678-9012', 'info@3d-project.co.th', 25000000, 'corporate', 'active'),
  ('C008', 'นางสาวมะลิ วงศ์สุวรรณ', '3101234567890', '089-789-0123', 'mali.wong@gmail.com', 3000000, 'individual', 'active'),
  ('C009', 'บริษัท เอสเอ็น คอนแทรคเตอร์ จำกัด', '0105550789012', '02-789-0123', 'sn.contractor@gmail.com', 40000000, 'corporate', 'active'),
  ('C010', 'บริษัท กรุงเทพพัฒนา อสังหาริมทรัพย์ จำกัด', '0105530890123', '02-890-1234', 'bkk.property@gmail.com', 200000000, 'corporate', 'active')
ON CONFLICT (code) DO NOTHING;

-- Seed addresses for C001
INSERT INTO public.addresses (customer_id, label, address_line1, district, province, postal_code, lat, lng, is_site, is_default)
SELECT id, 'สำนักงานใหญ่', '123 ถนนพหลโยธิน แขวงลาดยาว', 'จตุจักร', 'กรุงเทพมหานคร', '10900', 13.8199, 100.5516, false, true
FROM public.customers WHERE code = 'C001';

INSERT INTO public.addresses (customer_id, label, address_line1, district, province, postal_code, lat, lng, is_site, is_default)
SELECT id, 'หน้างานโครงการ A', '456 ซอยลาดพร้าว 71', 'ลาดพร้าว', 'กรุงเทพมหานคร', '10230', 13.7915, 100.6084, true, false
FROM public.customers WHERE code = 'C001';

INSERT INTO public.addresses (customer_id, label, address_line1, district, province, postal_code, lat, lng, is_site, is_default)
SELECT id, 'สำนักงาน', '789 ถนนสีลม แขวงสีลม', 'บางรัก', 'กรุงเทพมหานคร', '10500', 13.7217, 100.5274, false, true
FROM public.customers WHERE code = 'C003';

-- Seed products (15 items)
INSERT INTO public.products (sku, name, name_en, unit, base_price_satang, category, brand, status) VALUES
  ('P001', 'ปูนซีเมนต์ SCG ตราช้าง ถุง 50 กก.', 'SCG Cement 50kg Bag', 'ถุง', 19500, 'วัสดุก่อสร้าง', 'SCG', 'active'),
  ('P002', 'ทรายหยาบ', 'Coarse Sand', 'ลูกบาศก์เมตร', 45000, 'วัสดุก่อสร้าง', '-', 'active'),
  ('P003', 'หินคลุก', 'Gravel', 'ลูกบาศก์เมตร', 55000, 'วัสดุก่อสร้าง', '-', 'active'),
  ('P004', 'เหล็กเส้นกลม RB6 ยาว 10 ม.', 'Round Bar RB6 10m', 'เส้น', 8500, 'เหล็ก', 'มิลล์คอน', 'active'),
  ('P005', 'เหล็กข้ออ้อย DB12 ยาว 12 ม.', 'Deformed Bar DB12 12m', 'เส้น', 18500, 'เหล็ก', 'มิลล์คอน', 'active'),
  ('P006', 'เหล็กข้ออ้อย DB16 ยาว 12 ม.', 'Deformed Bar DB16 12m', 'เส้น', 32000, 'เหล็ก', 'มิลล์คอน', 'active'),
  ('P007', 'อิฐมวลเบา SCG ขนาด 7.5x20x60 ซม.', 'SCG Lightweight Block 7.5x20x60cm', 'ก้อน', 1800, 'วัสดุก่อสร้าง', 'SCG', 'active'),
  ('P008', 'กระเบื้องหลังคา SCG Fiber Cement ลอนคู่', 'SCG Fiber Cement Roof Tile', 'แผ่น', 5500, 'หลังคา', 'SCG', 'active'),
  ('P009', 'สีทาภายนอก TOA Super Shield ขนาด 18 ลิตร', 'TOA Super Shield Exterior Paint 18L', 'ถัง', 189000, 'สี', 'TOA', 'active'),
  ('P010', 'สีรองพื้นปูน TOA ขนาด 18 ลิตร', 'TOA Pliolite Primer 18L', 'ถัง', 89000, 'สี', 'TOA', 'active'),
  ('P011', 'ท่อ PVC ชั้น 8.5 ขนาด 4 นิ้ว ยาว 4 ม.', 'PVC Pipe Class 8.5 4inch 4m', 'ท่อน', 28500, 'ท่อและข้อต่อ', 'ท่อไทย', 'active'),
  ('P012', 'แผ่นไม้อัด 4x8 ฟุต หนา 12 มม.', 'Plywood 4x8ft 12mm', 'แผ่น', 42000, 'ไม้', '-', 'active'),
  ('P013', 'เหล็กกล่อง 2x4 นิ้ว หนา 2 มม. ยาว 6 ม.', 'Square Tube 2x4inch 2mm 6m', 'เส้น', 68000, 'เหล็ก', 'มิลล์คอน', 'active'),
  ('P014', 'ฉนวนกันความร้อนแผ่น 2 นิ้ว ขนาด 1.2x2.4 ม.', 'Thermal Insulation Board 2inch 1.2x2.4m', 'แผ่น', 35000, 'ฉนวน', 'K-FLEX', 'active'),
  ('P015', 'ซิลิโคนกันน้ำ GE ขนาด 280 มล.', 'GE Waterproof Silicone Sealant 280ml', 'หลอด', 8900, 'กาว/ซิลิโคน', 'GE', 'active')
ON CONFLICT (sku) DO NOTHING;

-- Seed Leads
INSERT INTO public.leads (customer_id, source, channel_ref, status, score, interest, budget_range_min_satang, budget_range_max_satang)
SELECT id, 'line', '@line_sukhumvit71', 'new', 85, '{"description": "โครงการทาวน์โฮม 8 ยูนิต สุขุมวิท 71"}'::jsonb, 50000000, 120000000
FROM public.customers WHERE code = 'C001'
ON CONFLICT DO NOTHING;

INSERT INTO public.leads (customer_id, source, channel_ref, status, score, interest, budget_range_min_satang, budget_range_max_satang)
SELECT id, 'store', 'BR-BANGNA-01', 'site_visit_requested', 95, '{"description": "ปรับปรุงหลังคาโรงงานและฉนวนกันความร้อน 2,400 ตร.ม."}'::jsonb, 30000000, 60000000
FROM public.customers WHERE code = 'C002'
ON CONFLICT DO NOTHING;

INSERT INTO public.leads (customer_id, source, channel_ref, status, score, interest, budget_range_min_satang, budget_range_max_satang)
SELECT id, 'phone', '081-987-6543', 'quoted', 90, '{"description": "งานโครงสร้างอาคารพาณิชย์ 4 ชั้น ราชพฤกษ์"}'::jsonb, 80000000, 150000000
FROM public.customers WHERE code = 'C003'
ON CONFLICT DO NOTHING;

INSERT INTO public.leads (customer_id, source, channel_ref, status, score, interest, budget_range_min_satang, budget_range_max_satang)
SELECT id, 'other', 'AE-DIRECT-04', 'won', 100, '{"description": "จัดซื้อประจำเดือน โครงการบ้านจัดสรร 50 หลัง"}'::jsonb, 200000000, 500000000
FROM public.customers WHERE code = 'C004'
ON CONFLICT DO NOTHING;

-- Seed Quotations
INSERT INTO public.quotations (number, customer_id, status, subtotal_satang, bill_discount_satang, vat_rate, vat_mode, vat_amount_satang, total_satang, terms, note)
SELECT 'QT-202609-0001', id, 'sent', 48500000, 1500000, 7, 'exclusive', 3290000, 50290000, 'เครดิตเทอม 30 วัน จัดส่งฟรีถึงหน้างาน', 'เสนอราคาโครงการทาวน์โฮม สุขุมวิท 71'
FROM public.customers WHERE code = 'C001'
ON CONFLICT (number) DO NOTHING;

INSERT INTO public.quotations (number, customer_id, status, subtotal_satang, bill_discount_satang, vat_rate, vat_mode, vat_amount_satang, total_satang, terms, note)
SELECT 'QT-202609-0002', id, 'accepted', 125000000, 5000000, 7, 'exclusive', 8400000, 128400000, 'เครดิตเทอม 45 วัน วงเงินพิเศษ Corporate Partner', 'จัดซื้อวัสดุโครงสร้างประจำเดือน ก.ย. 2026'
FROM public.customers WHERE code = 'C003'
ON CONFLICT (number) DO NOTHING;

-- Seed Orders
INSERT INTO public.orders (number, customer_id, status, total_satang, credit_check_result, credit_used_pct, note)
SELECT 'SO-202609-0001', id, 'paid', 128400000, 'pass', 45, 'ผ่านการตรวจสอบวงเงินเครดิตแล้ว จัดส่งจากศูนย์ CDC01'
FROM public.customers WHERE code = 'C003'
ON CONFLICT (number) DO NOTHING;

INSERT INTO public.orders (number, customer_id, status, total_satang, credit_check_result, credit_used_pct, note)
SELECT 'SO-202609-0002', id, 'awaiting_payment', 50290000, 'pass', 60, 'ลูกค้ายื่นสลิปโอนเงินแล้ว อยู่ระหว่างตรวจสอบบัญชี'
FROM public.customers WHERE code = 'C001'
ON CONFLICT (number) DO NOTHING;

