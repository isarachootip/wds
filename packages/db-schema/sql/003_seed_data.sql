-- ==============================================================================
-- Thai Watsadu WDS - Migration 003: Baseline Seed Data
-- ==============================================================================

-- 1. VAT Rates Configuration
INSERT INTO vat_tax_rates (effective_from_date, effective_to_date, vat_rate_percent, statutory_reference, is_active)
VALUES 
('2020-10-01', '2026-09-30', 7.0000, 'Royal Decree No. 780 (Thai Revenue Department 7% VAT)', TRUE),
('2026-10-01', '2099-12-31', 7.0000, 'Royal Decree Extension / Statutory Default', TRUE)
ON CONFLICT DO NOTHING;

-- 2. Pilot Branches
INSERT INTO branches (branch_code, branch_name_th, branch_name_en, zone_code, is_pilot, tax_branch_number)
VALUES
('00001', 'ไทวัสดุ สาขาบางนา', 'Thai Watsadu Bangna', 'BKK_EAST', TRUE, '00001'),
('00002', 'ไทวัสดุ สาขาบางบัวทอง', 'Thai Watsadu Bang Bua Thong', 'BKK_WEST', TRUE, '00002'),
('00003', 'ไทวัสดุ สาขารัตนาธิเบศร์', 'Thai Watsadu Rattanathibet', 'BKK_NORTH', TRUE, '00003'),
('CDC01', 'ศูนย์กระจายสินค้า วังน้อย CDC', 'Wang Noi Central Distribution Center', 'CENTRAL_CDC', TRUE, '00000')
ON CONFLICT (branch_code) DO NOTHING;

-- 3. Zone Freight Matrix
INSERT INTO zone_freight_rules (zone_code, truck_type_code, freight_fee_baht, is_active)
VALUES
('BKK_EAST', 'PICKUP_4W', 500.0000, TRUE),
('BKK_EAST', 'SIX_WHEEL_6W', 1200.0000, TRUE),
('BKK_EAST', 'TEN_WHEEL_10W', 2500.0000, TRUE),
('BKK_EAST', 'TRAILER_18W', 4000.0000, TRUE),
('BKK_WEST', 'PICKUP_4W', 500.0000, TRUE),
('BKK_WEST', 'SIX_WHEEL_6W', 1200.0000, TRUE),
('BKK_WEST', 'TEN_WHEEL_10W', 2500.0000, TRUE),
('BKK_WEST', 'TRAILER_18W', 4000.0000, TRUE)
ON CONFLICT (zone_code, truck_type_code) DO NOTHING;

-- 4. Sample Products (Portland Cement & Structural Steel)
INSERT INTO products (sku_code, barcode, name_th, name_en, category_code, base_uom_code, cost_floor_price, retail_standard_price, is_cement_product, shelf_life_days, status)
VALUES
('SKU-CEM-001', '8850123456001', 'ปูนซีเมนต์ปอร์ตแลนด์ ตราเสือ ปูนถุง 50 กก.', 'Tiger Portland Cement 50kg', 'CEMENT', 'BAG', 120.0000, 145.0000, TRUE, 90, 'ACTIVE'),
('SKU-CEM-002', '8850123456002', 'ปูนซีเมนต์ปอร์ตแลนด์ ตราช้าง โครงสร้าง 50 กก.', 'Elephant Portland Structural Cement 50kg', 'CEMENT', 'BAG', 135.0000, 160.0000, TRUE, 90, 'ACTIVE'),
('SKU-STL-001', '8850123456003', 'เหล็กเส้นกลม ผิวเรียบ RB9 มอก. ยาว 10 ม.', 'Round Steel Bar RB9 10m', 'STEEL', 'PIECE', 110.0000, 130.0000, FALSE, NULL, 'ACTIVE')
ON CONFLICT (sku_code) DO NOTHING;

-- 5. Volume Discount Rules
INSERT INTO volume_discount_rules (sku_code, min_quantity, discount_rate_percent, is_active)
VALUES
('SKU-CEM-001', 50.0000, 3.0000, TRUE),   -- 50-199 bags -> 3%
('SKU-CEM-001', 200.0000, 5.0000, TRUE),  -- 200-499 bags -> 5%
('SKU-CEM-001', 500.0000, 8.0000, TRUE)   -- >= 500 bags -> 8%
ON CONFLICT DO NOTHING;

-- 6. Sample B2B Customer Profile
INSERT INTO customer_profiles (customer_code, customer_name_th, tax_id, branch_number, address_th, credit_term_days, approved_credit_limit, current_ar_balance, pending_order_exposure, unmatured_pdc_amount, overdue_30_days_amount, is_credit_blocked)
VALUES
('CUST-B2B-001', 'บริษัท อิตาเลียน-ไทย คอนสตรัคชั่น จำกัด (มหาชน)', '0107537000959', '00000', '2034/132-161 อาคารอิตัลไทย ทาวเวอร์ ถ.เพชรบุรีตัดใหม่ แขวงบางกะปิ เขตห้วยขวาง กทม. 10310', 45, 5000000.0000, 1200000.0000, 350000.0000, 500000.0000, 0.0000, FALSE),
('CUST-B2B-002', 'ห้างหุ้นส่วนจำกัด บางนา โฮม บิลเดอร์', '0103558012345', '00000', '888 หมู่ 5 ถ.บางนา-ตราด ต.บางแก้ว อ.บางพลี จ.สมุทรปราการ 10540', 30, 500000.0000, 480000.0000, 50000.0000, 0.0000, 25000.0000, TRUE)
ON CONFLICT (customer_code) DO NOTHING;
