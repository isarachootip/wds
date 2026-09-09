-- ==============================================================================
-- Thai Watsadu WDS - Migration 004: Customer Onboarding, Geo-Pinning, Credit Applications & Sales Executives (AE)
-- Requirements: CRM & Master Data (E01), Credit Governance & Maker-Checker (E03), Sales Hierarchy (E13)
-- Zero-Float Standard: NUMERIC(18,4) for all currency values
-- ==============================================================================

-- 1. Sales Executives (AE) Master Table
CREATE TABLE IF NOT EXISTS sales_executives (
    ae_code VARCHAR(32) PRIMARY KEY,
    employee_id VARCHAR(32) NOT NULL UNIQUE,
    full_name_th VARCHAR(255) NOT NULL,
    full_name_en VARCHAR(255) NOT NULL,
    organization_type VARCHAR(32) NOT NULL CHECK (organization_type IN ('HEADQUARTERS', 'BRANCH_STORE')),
    assigned_branch_code VARCHAR(10) REFERENCES branches(branch_code),
    supervisor_ae_code VARCHAR(32) REFERENCES sales_executives(ae_code),
    max_discount_pct NUMERIC(5,2) NOT NULL DEFAULT 3.00 CHECK (max_discount_pct >= 0 AND max_discount_pct <= 15.00),
    role_title_th VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

CREATE INDEX IF NOT EXISTS idx_sales_executives_org ON sales_executives (organization_type, assigned_branch_code);

-- 2. Customer Delivery Sites with Geo-Pinning & Logistics Zone Mapping
CREATE TABLE IF NOT EXISTS customer_delivery_sites (
    site_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_code VARCHAR(32) NOT NULL REFERENCES customer_profiles(customer_code) ON DELETE CASCADE,
    site_name VARCHAR(255) NOT NULL,
    latitude NUMERIC(10, 7) NOT NULL CHECK (latitude >= -90.0 AND latitude <= 90.0),
    longitude NUMERIC(10, 7) NOT NULL CHECK (longitude >= -180.0 AND longitude <= 180.0),
    subdistrict VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    province VARCHAR(100) NOT NULL,
    postal_code VARCHAR(10) NOT NULL,
    zone_code VARCHAR(32) NOT NULL,
    contact_person VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(50) NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

CREATE INDEX IF NOT EXISTS idx_customer_delivery_sites_cust ON customer_delivery_sites (customer_code);
CREATE INDEX IF NOT EXISTS idx_customer_delivery_sites_zone ON customer_delivery_sites (zone_code);

-- 3. Credit Facility Applications (Dual-Control Maker-Checker)
CREATE TABLE IF NOT EXISTS credit_facility_applications (
    application_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_code VARCHAR(32) NOT NULL REFERENCES customer_profiles(customer_code) ON DELETE CASCADE,
    requested_credit_limit NUMERIC(18,4) NOT NULL CHECK (requested_credit_limit >= 0),
    approved_credit_limit NUMERIC(18,4) CHECK (approved_credit_limit >= 0),
    credit_term_days INT NOT NULL CHECK (credit_term_days IN (30, 45, 60, 90)),
    collateral_type VARCHAR(64) CHECK (collateral_type IN ('BANK_GUARANTEE', 'TITLE_DEED', 'DIRECTOR_PLEDGE', 'CLEAN_CREDIT')),
    collateral_value NUMERIC(18,4) DEFAULT 0.0000 CHECK (collateral_value >= 0),
    maker_user_id VARCHAR(64) NOT NULL,
    maker_name_th VARCHAR(255) NOT NULL,
    maker_submitted_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    checker_user_id VARCHAR(64),
    checker_name_th VARCHAR(255),
    checker_reviewed_at TIMESTAMPTZ,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    rejection_reason TEXT,
    notes TEXT,
    CONSTRAINT chk_credit_maker_checker_distinct CHECK (maker_user_id <> checker_user_id)
);

CREATE INDEX IF NOT EXISTS idx_credit_applications_status ON credit_facility_applications (status, customer_code);

-- 4. Seed Data for Sales Executives (Headquarters and Branch Desks)
INSERT INTO sales_executives (ae_code, employee_id, full_name_th, full_name_en, organization_type, assigned_branch_code, supervisor_ae_code, max_discount_pct, role_title_th, phone, email, is_active)
VALUES
    ('AE-HQ-VP-01', 'EMP-8001', 'นายวิชัย สุวรรณภูมิ (VP Commercial)', 'Wichai Suwarnabhumi', 'HEADQUARTERS', NULL, NULL, 15.00, 'รองกรรมการผู้จัดการฝ่ายขายโครงการพาณิชย์', '02-101-0001', 'wichai.su@thaiwatsadu.com', TRUE),
    ('AE-HQ-MGR-01', 'EMP-8002', 'นางสาวณิชาภา รัตนไพศาล (Key Account Mgr)', 'Nichapa Rattanapaisan', 'HEADQUARTERS', NULL, 'AE-HQ-VP-01', 8.00, 'ผู้จัดการฝ่ายขายลูกค้ารายใหญ่ส่วนกลาง', '02-101-0002', 'nichapa.ra@thaiwatsadu.com', TRUE),
    ('AE-HQ-001', 'EMP-9001', 'นายกิตติศักดิ์ พัฒนกิจ (Senior Key Account AE)', 'Kittisak Pattanakit', 'HEADQUARTERS', NULL, 'AE-HQ-MGR-01', 3.00, 'เจ้าหน้าที่บริหารงานขายโครงการส่วนกลาง', '081-444-1111', 'kittisak.pa@thaiwatsadu.com', TRUE),
    ('AE-BKK-001', 'EMP-9011', 'นายสมเกียรติ มั่นคง (Branch AE - บางนา)', 'Somkiat Mankhong', 'BRANCH_STORE', '00001', NULL, 3.00, 'เจ้าหน้าที่ฝ่ายขายตรงประจำสาขาบางนา', '089-222-3331', 'somkiat.ma@thaiwatsadu.com', TRUE),
    ('AE-BKK-002', 'EMP-9012', 'นางสาววรัญญา เลิศชัย (Branch AE - รังสิต)', 'Waranya Lertchai', 'BRANCH_STORE', '00002', NULL, 3.00, 'เจ้าหน้าที่ฝ่ายขายตรงประจำสาขารังสิต', '089-222-3332', 'waranya.le@thaiwatsadu.com', TRUE),
    ('AE-UPC-001', 'EMP-9021', 'นายธนพล เจริญทรัพย์ (Branch AE - ขอนแก่น)', 'Thanapol Charoensub', 'BRANCH_STORE', '00012', NULL, 3.00, 'เจ้าหน้าที่ฝ่ายขายตรงประจำสาขาขอนแก่น', '087-555-6661', 'thanapol.ch@thaiwatsadu.com', TRUE)
ON CONFLICT (ae_code) DO NOTHING;
