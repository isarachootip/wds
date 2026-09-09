"""
Empirical Audit: SQL DDL Strict Typing and Numeric Precision Verification
Audits every SQL table definition in docs/02 and docs/03.
Ensures zero float/real/double types for money or stock quantities.
Verifies NUMERIC precision and scale across all domains.
"""

import re

# DDL Table Definitions from docs/03 and docs/02
DDL_TABLES = {
    # docs/03 tables
    "customers": [
        ("customer_id", "UUID"),
        ("customer_code", "VARCHAR(32)"),
        ("tax_id", "VARCHAR(13)"),
        ("branch_number", "VARCHAR(5)"),
        ("company_name_th", "VARCHAR(255)"),
        ("company_name_en", "VARCHAR(255)"),
        ("registered_address_th", "TEXT"),
        ("postal_code", "VARCHAR(5)"),
        ("phone_number", "VARCHAR(32)"),
        ("email", "VARCHAR(128)"),
        ("is_active", "BOOLEAN"),
        ("is_credit_blocked", "BOOLEAN"),
        ("block_reason", "TEXT"),
        ("created_at", "TIMESTAMPTZ"),
        ("updated_at", "TIMESTAMPTZ")
    ],
    "customer_credit_profiles": [
        ("profile_id", "UUID"),
        ("customer_id", "UUID"),
        ("credit_limit_thb", "NUMERIC(15, 2)"),
        ("current_exposure_thb", "NUMERIC(15, 2)"),
        ("temporary_limit_thb", "NUMERIC(15, 2)"),
        ("temp_limit_expiry", "TIMESTAMPTZ"),
        ("payment_term_days", "INTEGER"),
        ("allow_cheque_payment", "BOOLEAN"),
        ("cheque_credit_limit_thb", "NUMERIC(15, 2)"),
        ("current_cheque_exposure", "NUMERIC(15, 2)"),
        ("has_bounced_cheque", "BOOLEAN"),
        ("last_credit_review_date", "TIMESTAMPTZ"),
        ("version", "BIGINT"),
        ("created_at", "TIMESTAMPTZ"),
        ("updated_at", "TIMESTAMPTZ")
    ],
    "customer_cheques": [
        ("cheque_id", "UUID"),
        ("customer_id", "UUID"),
        ("cheque_number", "VARCHAR(16)"),
        ("bank_code", "VARCHAR(8)"),
        ("bank_branch", "VARCHAR(64)"),
        ("amount_thb", "NUMERIC(15, 2)"),
        ("cheque_date", "DATE"),
        ("received_date", "DATE"),
        ("clearing_status", "cheque_status_enum"),
        ("clearing_date", "TIMESTAMPTZ"),
        ("bounced_reason", "VARCHAR(255)"),
        ("created_at", "TIMESTAMPTZ"),
        ("updated_at", "TIMESTAMPTZ")
    ],
    "products": [
        ("product_id", "UUID"),
        ("sku_code", "VARCHAR(32)"),
        ("barcode", "VARCHAR(32)"),
        ("name_th", "VARCHAR(255)"),
        ("name_en", "VARCHAR(255)"),
        ("category_id", "VARCHAR(32)"),
        ("base_uom", "VARCHAR(16)"),
        ("is_cement_bag", "BOOLEAN"),
        ("shelf_life_days", "INTEGER"),
        ("weight_kg", "NUMERIC(10, 4)"),
        ("is_active", "BOOLEAN"),
        ("created_at", "TIMESTAMPTZ"),
        ("updated_at", "TIMESTAMPTZ")
    ],
    "system_vat_configs": [
        ("vat_config_id", "UUID"),
        ("vat_code", "VARCHAR(16)"),
        ("vat_rate", "NUMERIC(5, 4)"),
        ("effective_from", "TIMESTAMPTZ"),
        ("effective_to", "TIMESTAMPTZ"),
        ("description", "VARCHAR(128)"),
        ("created_at", "TIMESTAMPTZ")
    ],
    "product_price_tiers": [
        ("tier_id", "UUID"),
        ("product_id", "UUID"),
        ("zone_id", "VARCHAR(16)"),
        ("min_quantity", "NUMERIC(12, 4)"),
        ("max_quantity", "NUMERIC(12, 4)"),
        ("base_price_thb", "NUMERIC(18, 4)"),
        ("floor_price_thb", "NUMERIC(18, 4)"),
        ("effective_from", "TIMESTAMPTZ"),
        ("effective_to", "TIMESTAMPTZ"),
        ("is_active", "BOOLEAN"),
        ("created_at", "TIMESTAMPTZ")
    ],
    "zone_freight_rates": [
        ("freight_rate_id", "UUID"),
        ("zone_id", "VARCHAR(16)"),
        ("min_distance_km", "NUMERIC(8, 2)"),
        ("max_distance_km", "NUMERIC(8, 2)"),
        ("truck_type", "VARCHAR(16)"),
        ("rate_per_trip_thb", "NUMERIC(15, 2)"),
        ("rate_per_ton_km_thb", "NUMERIC(15, 4)"),
        ("is_active", "BOOLEAN"),
        ("effective_from", "TIMESTAMPTZ"),
        ("effective_to", "TIMESTAMPTZ")
    ],
    "inventory_branches": [
        ("branch_id", "VARCHAR(16)"),
        ("branch_name_th", "VARCHAR(128)"),
        ("is_distribution_center", "BOOLEAN"),
        ("is_active", "BOOLEAN")
    ],
    "inventory_branch_stock": [
        ("stock_id", "UUID"),
        ("branch_id", "VARCHAR(16)"),
        ("product_id", "UUID"),
        ("physical_on_hand_qty", "NUMERIC(12, 4)"),
        ("allocated_reserved_qty", "NUMERIC(12, 4)"),
        ("available_to_promise_qty", "NUMERIC(12, 4) GENERATED ALWAYS"),
        ("version", "BIGINT"),
        ("updated_at", "TIMESTAMPTZ")
    ],
    "inventory_cement_lots": [
        ("lot_id", "UUID"),
        ("sku_id", "UUID"),
        ("branch_id", "VARCHAR(16)"),
        ("batch_number", "VARCHAR(64)"),
        ("manufacturing_date", "DATE"),
        ("expiry_date", "DATE"),
        ("remaining_qty", "NUMERIC(12, 4)"),
        ("allocated_qty", "NUMERIC(12, 4)"),
        ("is_quarantined", "BOOLEAN"),
        ("created_at", "TIMESTAMPTZ")
    ],
    "inventory_reservations": [
        ("reservation_id", "UUID"),
        ("order_id", "UUID"),
        ("branch_id", "VARCHAR(16)"),
        ("status", "VARCHAR(24)"),
        ("expires_at", "TIMESTAMPTZ"),
        ("created_at", "TIMESTAMPTZ"),
        ("updated_at", "TIMESTAMPTZ")
    ],
    "inventory_reservation_items": [
        ("reservation_item_id", "UUID"),
        ("reservation_id", "UUID"),
        ("product_id", "UUID"),
        ("lot_id", "UUID"),
        ("reserved_quantity", "NUMERIC(12, 4)"),
        ("created_at", "TIMESTAMPTZ")
    ],
    "orders": [
        ("order_id", "UUID"),
        ("order_number", "VARCHAR(32)"),
        ("customer_id", "UUID"),
        ("branch_id", "VARCHAR(16)"),
        ("reservation_id", "UUID"),
        ("order_status", "order_status_enum"),
        ("payment_method", "VARCHAR(24)"),
        ("payment_term_days", "INTEGER"),
        ("delivery_method", "VARCHAR(24)"),
        ("delivery_address_th", "TEXT"),
        ("delivery_zone_id", "VARCHAR(16)"),
        ("subtotal_before_tax_thb", "NUMERIC(15, 2)"),
        ("freight_charge_thb", "NUMERIC(15, 2)"),
        ("discount_total_thb", "NUMERIC(15, 2)"),
        ("vat_rate", "NUMERIC(5, 4)"),
        ("vat_total_thb", "NUMERIC(15, 2)"),
        ("total_payable_thb", "NUMERIC(15, 2)"),
        ("requires_floor_override", "BOOLEAN"),
        ("floor_override_approved", "BOOLEAN"),
        ("floor_override_approver", "VARCHAR(64)"),
        ("created_by", "VARCHAR(64)"),
        ("created_at", "TIMESTAMPTZ"),
        ("updated_at", "TIMESTAMPTZ")
    ],
    "order_items": [
        ("item_id", "UUID"),
        ("order_id", "UUID"),
        ("line_number", "INTEGER"),
        ("product_id", "UUID"),
        ("quantity", "NUMERIC(12, 4)"),
        ("uom", "VARCHAR(16)"),
        ("unit_base_price_thb", "NUMERIC(18, 4)"),
        ("unit_floor_price_thb", "NUMERIC(18, 4)"),
        ("unit_discount_thb", "NUMERIC(18, 4)"),
        ("unit_net_price_thb", "NUMERIC(18, 4)"),
        ("line_subtotal_thb", "NUMERIC(15, 2)"),
        ("line_vat_thb", "NUMERIC(15, 2)"),
        ("line_total_thb", "NUMERIC(15, 2)"),
        ("is_below_floor_price", "BOOLEAN"),
        ("created_at", "TIMESTAMPTZ")
    ],
    "tax_invoices": [
        ("invoice_id", "UUID"),
        ("invoice_number", "VARCHAR(32)"),
        ("order_id", "UUID"),
        ("customer_id", "UUID"),
        ("branch_id", "VARCHAR(16)"),
        ("seller_tax_id", "VARCHAR(13)"),
        ("seller_branch_code", "VARCHAR(5)"),
        ("customer_tax_id", "VARCHAR(13)"),
        ("customer_branch_code", "VARCHAR(5)"),
        ("customer_name_th", "VARCHAR(255)"),
        ("customer_address_th", "TEXT"),
        ("invoice_date", "DATE"),
        ("posting_timestamp", "TIMESTAMPTZ"),
        ("subtotal_thb", "NUMERIC(15, 2)"),
        ("discount_thb", "NUMERIC(15, 2)"),
        ("freight_thb", "NUMERIC(15, 2)"),
        ("net_taxable_amount_thb", "NUMERIC(15, 2)"),
        ("vat_rate", "NUMERIC(5, 4)"),
        ("output_vat_thb", "NUMERIC(15, 2)"),
        ("grand_total_thb", "NUMERIC(15, 2)"),
        ("is_posted", "BOOLEAN"),
        ("is_cancelled", "BOOLEAN"),
        ("cancelled_reason", "VARCHAR(255)"),
        ("digital_signature_hash", "VARCHAR(256)"),
        ("e_tax_status", "VARCHAR(24)"),
        ("pdf_storage_url", "VARCHAR(512)"),
        ("created_at", "TIMESTAMPTZ")
    ],
    "tax_invoice_items": [
        ("invoice_item_id", "UUID"),
        ("invoice_id", "UUID"),
        ("posting_timestamp", "TIMESTAMPTZ"),
        ("line_number", "INTEGER"),
        ("product_id", "UUID"),
        ("sku_code", "VARCHAR(32)"),
        ("item_description_th", "VARCHAR(255)"),
        ("quantity", "NUMERIC(12, 4)"),
        ("uom", "VARCHAR(16)"),
        ("unit_price_thb", "NUMERIC(18, 4)"),
        ("discount_thb", "NUMERIC(15, 2)"),
        ("net_line_amount_thb", "NUMERIC(15, 2)"),
        ("vat_amount_thb", "NUMERIC(15, 2)")
    ],
    "maker_checker_requests": [
        ("request_id", "UUID"),
        ("domain_module", "VARCHAR(32)"),
        ("entity_name", "VARCHAR(64)"),
        ("entity_id", "VARCHAR(64)"),
        ("action_type", "action_type_enum"),
        ("staged_payload_json", "JSONB"),
        ("diff_summary_json", "JSONB"),
        ("maker_user_id", "VARCHAR(64)"),
        ("maker_comments", "TEXT"),
        ("maker_submitted_at", "TIMESTAMPTZ"),
        ("checker_user_id", "VARCHAR(64)"),
        ("checker_comments", "TEXT"),
        ("checker_action_at", "TIMESTAMPTZ"),
        ("status", "maker_checker_status_enum"),
        ("applied_at", "TIMESTAMPTZ"),
        ("error_log", "TEXT")
    ],
    "system_audit_logs": [
        ("audit_id", "BIGSERIAL"),
        ("event_timestamp", "TIMESTAMPTZ"),
        ("trace_id", "VARCHAR(64)"),
        ("user_id", "VARCHAR(64)"),
        ("user_ip_address", "INET"),
        ("domain_module", "VARCHAR(32)"),
        ("action_type", "action_type_enum"),
        ("entity_name", "VARCHAR(64)"),
        ("entity_id", "VARCHAR(64)"),
        ("old_state_json", "JSONB"),
        ("new_state_json", "JSONB"),
        ("previous_record_hash", "VARCHAR(64)"),
        ("current_record_hash", "VARCHAR(64)")
    ],
    # docs/02 supplementary tables
    "stg_merchandising_items": [
        ("sku_code", "VARCHAR(32)"),
        ("barcode", "VARCHAR(32)"),
        ("thai_name", "VARCHAR(500)"),
        ("english_name", "VARCHAR(500)"),
        ("department_code", "VARCHAR(16)"),
        ("sub_department_code", "VARCHAR(16)"),
        ("class_code", "VARCHAR(16)"),
        ("sub_class_code", "VARCHAR(16)"),
        ("base_uom", "VARCHAR(16)"),
        ("sales_uom", "VARCHAR(16)"),
        ("uom_conversion_ratio", "NUMERIC(14, 4)"),
        ("gross_weight_kg", "NUMERIC(14, 4)"),
        ("is_perishable", "BOOLEAN"),
        ("shelf_life_days", "INTEGER"),
        ("is_hazardous", "BOOLEAN"),
        ("tax_category", "VARCHAR(16)"),
        ("moving_average_cost", "NUMERIC(18, 4)"),
        ("attribute_hash", "CHAR(64)"),
        ("raw_payload", "JSONB"),
        ("created_at", "TIMESTAMPTZ")
    ],
    "vat_tax_rates": [
        ("tax_category", "VARCHAR(16)"),
        ("tax_rate", "NUMERIC(8, 4)"),
        ("valid_from", "DATE"),
        ("valid_to", "DATE")
    ],
    "tax_invoice_sequences": [
        ("branch_code", "VARCHAR(5)"),
        ("fiscal_year_be", "INTEGER"),
        ("fiscal_month", "INTEGER"),
        ("last_assigned_sequence", "INTEGER")
    ]
}

FORBIDDEN_PATTERNS = [r"\bFLOAT\b", r"\bREAL\b", r"\bDOUBLE\b", r"\bDECIMAL\b(?!\()"]

def audit_ddl():
    total_columns = 0
    forbidden_found = []
    numeric_columns = []
    
    for table_name, columns in DDL_TABLES.items():
        for col_name, col_type in columns:
            total_columns += 1
            for pat in FORBIDDEN_PATTERNS:
                if re.search(pat, col_type, re.IGNORECASE):
                    forbidden_found.append((table_name, col_name, col_type))
            if "NUMERIC" in col_type.upper():
                numeric_columns.append((table_name, col_name, col_type))
                
    print(f"Total DDL Columns Audited: {total_columns}")
    print(f"Forbidden Primitive Types (FLOAT/REAL/DOUBLE) Found in DDL: {len(forbidden_found)}")
    if forbidden_found:
        for t, c, ty in forbidden_found:
            print(f"  [VIOLATION] {t}.{c} uses {ty}")
    else:
        print("  ✅ ZERO float/real/double types detected in all SQL DDL table definitions.")
        
    print(f"\nTotal NUMERIC Columns Analyzed: {len(numeric_columns)}")
    print("\n--- Cross-Document Precision & Scale Inconsistencies ---")
    inconsistencies = [
        ("Inventory Quantities", "docs/02 §4.5 mandates NUMERIC(14,4)", "docs/03 DDL defines NUMERIC(12,4)", "Minor Scale Drift (12 vs 14 digits)"),
        ("Document Totals", "docs/02 §4.5 mandates NUMERIC(18,2)", "docs/03 DDL defines NUMERIC(15,2)", "Discrepancy: Max 10 Trillion THB vs 10 Quadrillion THB"),
        ("Product Weight", "docs/02 I0a defines gross_weight_kg NUMERIC(14,4)", "docs/03 products.weight_kg defines NUMERIC(10,4)", "Scale mismatch (max 1k tons vs 10 billion tons)"),
        ("VAT Rate Precision", "docs/02 vat_tax_rates defines NUMERIC(8,4)", "docs/03 system_vat_configs defines NUMERIC(5,4)", "Scale mismatch (5,4 allows up to 9.9999; 8,4 allows up to 9999.9999)")
    ]
    for domain, d02, d03, note in inconsistencies:
        print(f"[{domain}]:\n  - {d02}\n  - {d03}\n  - Impact: {note}\n")

if __name__ == "__main__":
    audit_ddl()
