-- ==============================================================================
-- Thai Watsadu WDS - Migration 001: Core Platform & Master Data
-- Requirements: E13 (Platform & Security), E01 (Master Data), E03 (Credit Control)
-- Zero-Float Standard: NUMERIC(18,4) for all currency and stock quantities
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Immutable Audit Log Table
CREATE TABLE IF NOT EXISTS audit_event_logs (
    event_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    aggregate_type VARCHAR(64) NOT NULL,
    aggregate_id VARCHAR(128) NOT NULL,
    event_type VARCHAR(64) NOT NULL,
    performed_by_user_id VARCHAR(64) NOT NULL,
    performed_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    old_state_json JSONB,
    newState_json JSONB NOT NULL,
    sha256_hash VARCHAR(64) NOT NULL,
    previous_event_hash VARCHAR(64)
);

CREATE INDEX IF NOT EXISTS idx_audit_event_logs_aggregate ON audit_event_logs (aggregate_type, aggregate_id);
CREATE INDEX IF NOT EXISTS idx_audit_event_logs_performed_at ON audit_event_logs (performed_at);

-- 2. Maker-Checker Staging Table for Master Data Governance
CREATE TABLE IF NOT EXISTS pending_changes (
    change_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type VARCHAR(64) NOT NULL,
    entity_key VARCHAR(128) NOT NULL,
    action_type VARCHAR(16) NOT NULL CHECK (action_type IN ('CREATE', 'UPDATE', 'DELETE')),
    payload_json JSONB NOT NULL,
    maker_user_id VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    checker_user_id VARCHAR(64),
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    reviewed_at TIMESTAMPTZ,
    rejection_reason TEXT,
    CONSTRAINT chk_maker_checker_distinct CHECK (maker_user_id <> checker_user_id)
);

CREATE INDEX IF NOT EXISTS idx_pending_changes_status ON pending_changes (status, entity_type);

-- 3. Branch Master
CREATE TABLE IF NOT EXISTS branches (
    branch_code VARCHAR(10) PRIMARY KEY,
    branch_name_th VARCHAR(255) NOT NULL,
    branch_name_en VARCHAR(255) NOT NULL,
    zone_code VARCHAR(32) NOT NULL,
    is_pilot BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    tax_branch_number VARCHAR(10) NOT NULL DEFAULT '00000',
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- 4. Product Catalog (100k SKU capable)
CREATE TABLE IF NOT EXISTS products (
    sku_code VARCHAR(32) PRIMARY KEY,
    barcode VARCHAR(64),
    name_th VARCHAR(500) NOT NULL,
    name_en VARCHAR(500) NOT NULL,
    category_code VARCHAR(32) NOT NULL,
    base_uom_code VARCHAR(16) NOT NULL,
    cost_floor_price NUMERIC(18,4) NOT NULL CHECK (cost_floor_price >= 0),
    retail_standard_price NUMERIC(18,4) NOT NULL CHECK (retail_standard_price >= cost_floor_price),
    is_cement_product BOOLEAN NOT NULL DEFAULT FALSE,
    shelf_life_days INT,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- 5. Customer Profile & Credit Control (E03)
CREATE TABLE IF NOT EXISTS customer_profiles (
    customer_code VARCHAR(32) PRIMARY KEY,
    customer_name_th VARCHAR(500) NOT NULL,
    tax_id VARCHAR(20) NOT NULL,
    branch_number VARCHAR(10) NOT NULL DEFAULT '00000',
    address_th TEXT NOT NULL,
    credit_term_days INT NOT NULL DEFAULT 30,
    approved_credit_limit NUMERIC(18,4) NOT NULL DEFAULT 0.0000 CHECK (approved_credit_limit >= 0),
    current_ar_balance NUMERIC(18,4) NOT NULL DEFAULT 0.0000,
    pending_order_exposure NUMERIC(18,4) NOT NULL DEFAULT 0.0000,
    unmatured_pdc_amount NUMERIC(18,4) NOT NULL DEFAULT 0.0000,
    overdue_30_days_amount NUMERIC(18,4) NOT NULL DEFAULT 0.0000,
    is_credit_blocked BOOLEAN NOT NULL DEFAULT FALSE,
    credit_block_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- 6. Effective-Dated VAT Configuration Table (FR-FI-014)
CREATE TABLE IF NOT EXISTS vat_tax_rates (
    rate_id SERIAL PRIMARY KEY,
    effective_from_date DATE NOT NULL,
    effective_to_date DATE NOT NULL,
    vat_rate_percent NUMERIC(8,4) NOT NULL,
    statutory_reference VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT chk_vat_date_range CHECK (effective_to_date >= effective_from_date)
);
