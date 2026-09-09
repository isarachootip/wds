-- ==============================================================================
-- Thai Watsadu WDS - Migration 002: Pricing, Inventory FEFO, Orders & Partitioned Tax Invoices
-- Requirements: E02 (Pricing), E07 (Inventory/FEFO), E04 (Trade Order), E10 (Billing & Tax)
-- ==============================================================================

-- 1. Tiered Volume Discount Rules (E02)
CREATE TABLE IF NOT EXISTS volume_discount_rules (
    rule_id SERIAL PRIMARY KEY,
    sku_code VARCHAR(32) REFERENCES products(sku_code),
    min_quantity NUMERIC(14,4) NOT NULL CHECK (min_quantity > 0),
    discount_rate_percent NUMERIC(8,4) NOT NULL CHECK (discount_rate_percent >= 0 AND discount_rate_percent <= 100),
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- 2. Zone Freight Matrix (E02 / E08)
CREATE TABLE IF NOT EXISTS zone_freight_rules (
    rule_id SERIAL PRIMARY KEY,
    zone_code VARCHAR(32) NOT NULL,
    truck_type_code VARCHAR(32) NOT NULL,
    freight_fee_baht NUMERIC(18,4) NOT NULL CHECK (freight_fee_baht >= 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    UNIQUE (zone_code, truck_type_code)
);

-- 3. Inventory Stock & Cement Lots (E07 FEFO)
CREATE TABLE IF NOT EXISTS inventory_lots (
    lot_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku_code VARCHAR(32) NOT NULL REFERENCES products(sku_code),
    branch_code VARCHAR(10) NOT NULL REFERENCES branches(branch_code),
    location_code VARCHAR(32) NOT NULL,
    manufacture_date DATE NOT NULL,
    expiration_date DATE NOT NULL,
    quantity_on_hand NUMERIC(14,4) NOT NULL DEFAULT 0.0000 CHECK (quantity_on_hand >= 0),
    quantity_reserved NUMERIC(14,4) NOT NULL DEFAULT 0.0000 CHECK (quantity_reserved >= 0),
    is_full_pallet BOOLEAN NOT NULL DEFAULT TRUE,
    pallet_bag_count INT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    CONSTRAINT chk_lot_expiry CHECK (expiration_date >= manufacture_date),
    CONSTRAINT chk_lot_quantity CHECK (quantity_reserved <= quantity_on_hand)
);

CREATE INDEX IF NOT EXISTS idx_inventory_lots_fefo ON inventory_lots (sku_code, branch_code, expiration_date ASC);

-- 4. Trade Sales Orders (E04)
CREATE TABLE IF NOT EXISTS trade_sales_orders (
    order_id VARCHAR(64) PRIMARY KEY,
    customer_code VARCHAR(32) NOT NULL REFERENCES customer_profiles(customer_code),
    branch_code VARCHAR(10) NOT NULL REFERENCES branches(branch_code),
    delivery_zone_code VARCHAR(32) NOT NULL,
    order_status VARCHAR(32) NOT NULL DEFAULT 'DRAFT',
    subtotal_amount NUMERIC(18,4) NOT NULL DEFAULT 0.0000,
    freight_amount NUMERIC(18,4) NOT NULL DEFAULT 0.0000,
    discount_amount NUMERIC(18,4) NOT NULL DEFAULT 0.0000,
    taxable_amount NUMERIC(18,4) NOT NULL DEFAULT 0.0000,
    vat_amount NUMERIC(18,4) NOT NULL DEFAULT 0.0000,
    grand_total_amount NUMERIC(18,4) NOT NULL DEFAULT 0.0000,
    requires_approval BOOLEAN NOT NULL DEFAULT FALSE,
    approved_by_user_id VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- 5. Gapless Sequence Tracker for Tax Invoices
CREATE TABLE IF NOT EXISTS tax_invoice_sequences (
    branch_code VARCHAR(10) NOT NULL,
    period_yyyymm VARCHAR(6) NOT NULL,
    current_sequence_number BIGINT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    PRIMARY KEY (branch_code, period_yyyymm)
);

-- Gapless Sequence Generation Function
CREATE OR REPLACE FUNCTION fn_get_next_tax_invoice_number(p_branch_code VARCHAR(10), p_document_date DATE)
RETURNS VARCHAR AS $$
DECLARE
    v_yyyymm VARCHAR(6);
    v_next_seq BIGINT;
    v_result VARCHAR(64);
BEGIN
    v_yyyymm := to_char(p_document_date, 'YYYYMM');

    INSERT INTO tax_invoice_sequences (branch_code, period_yyyymm, current_sequence_number, updated_at)
    VALUES (p_branch_code, v_yyyymm, 1, clock_timestamp())
    ON CONFLICT (branch_code, period_yyyymm)
    DO UPDATE SET 
        current_sequence_number = tax_invoice_sequences.current_sequence_number + 1,
        updated_at = clock_timestamp()
    RETURNING current_sequence_number INTO v_next_seq;

    v_result := 'INV-' || p_branch_code || '-' || v_yyyymm || '-' || lpad(v_next_seq::TEXT, 6, '0');
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- 6. Partitioned Tax Invoices Table (E10)
CREATE TABLE IF NOT EXISTS tax_invoices (
    invoice_number VARCHAR(64) NOT NULL,
    order_id VARCHAR(64) NOT NULL,
    branch_code VARCHAR(10) NOT NULL,
    document_date DATE NOT NULL,
    seller_tax_id VARCHAR(20) NOT NULL,
    seller_branch_code VARCHAR(10) NOT NULL,
    buyer_customer_code VARCHAR(32) NOT NULL,
    buyer_tax_id VARCHAR(20) NOT NULL,
    buyer_name_th VARCHAR(500) NOT NULL,
    subtotal_amount NUMERIC(18,4) NOT NULL,
    discount_amount NUMERIC(18,4) NOT NULL DEFAULT 0.0000,
    taxable_amount NUMERIC(18,4) NOT NULL,
    vat_rate_percent NUMERIC(8,4) NOT NULL,
    vat_amount NUMERIC(18,4) NOT NULL,
    grand_total_amount NUMERIC(18,4) NOT NULL,
    is_posted BOOLEAN NOT NULL DEFAULT FALSE,
    posted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    PRIMARY KEY (invoice_number, document_date)
) PARTITION BY RANGE (document_date);

-- Create Partitions for Year 2026
CREATE TABLE IF NOT EXISTS tax_invoices_2026_09 PARTITION OF tax_invoices
    FOR VALUES FROM ('2026-09-01') TO ('2026-10-01');

CREATE TABLE IF NOT EXISTS tax_invoices_2026_10 PARTITION OF tax_invoices
    FOR VALUES FROM ('2026-10-01') TO ('2026-11-01');

CREATE TABLE IF NOT EXISTS tax_invoices_2026_11 PARTITION OF tax_invoices
    FOR VALUES FROM ('2026-11-01') TO ('2026-12-01');

CREATE TABLE IF NOT EXISTS tax_invoices_2026_12 PARTITION OF tax_invoices
    FOR VALUES FROM ('2026-12-01') TO ('2027-01-01');

-- Immutability Enforcement Trigger Function
CREATE OR REPLACE FUNCTION trg_tax_invoice_immutability()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.is_posted = TRUE THEN
        RAISE EXCEPTION 'Posted Tax Invoice % is legally immutable under Thai Revenue Code Section 86/4', OLD.invoice_number;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_tax_invoice_immutability_guard ON tax_invoices;
CREATE TRIGGER trg_tax_invoice_immutability_guard
    BEFORE UPDATE OR DELETE ON tax_invoices
    FOR EACH ROW
    EXECUTE FUNCTION trg_tax_invoice_immutability();
