"""
Empirical Adversarial Test Harness: PostgreSQL Trigger & Tax Invoice Immutability
Tests and documents attack vectors against trg_tax_invoice_immutable
from docs/03 §2.7 and docs/02 §3.5.
"""

# Attack Vector Scenarios against trg_tax_invoice_immutable

ATTACK_VECTORS = [
    {
        "vector_id": "VEC-IMM-01",
        "name": "Transition-State Mutation Bypass (Time-of-Check / Time-of-Posting Flaw)",
        "sql_attack": """
-- Scenario: Invoice exists in draft/unposted state (is_posted = FALSE).
-- An attacker or errant script posts the invoice and simultaneously alters legal/financial amounts.
UPDATE tax_invoices
SET is_posted = TRUE,
    grand_total_thb = 1.00,
    customer_tax_id = '9999999999999',
    output_vat_thb = 0.07,
    net_taxable_amount_thb = 0.93
WHERE invoice_id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
  AND is_posted = FALSE;
        """,
        "trigger_behavior": "Trigger checks 'IF OLD.is_posted = TRUE'. Because OLD.is_posted is FALSE at time of statement execution, condition evaluates to FALSE. Trigger returns NEW.",
        "outcome": "BYPASS SUCCESSFUL: Record is persisted with is_posted = TRUE and forged financials. Revenue Dept legal audit trail corrupted.",
        "severity": "CRITICAL",
        "recommended_fix": "Add guard: IF NEW.is_posted = TRUE AND OLD.is_posted = FALSE, forbid modifying any financial or legal identity columns (grand_total_thb, customer_tax_id, net_taxable_amount_thb, etc.) except posting metadata (posting_timestamp, digital_signature_hash, e_tax_status)."
    },
    {
        "vector_id": "VEC-IMM-02",
        "name": "Direct Child Line Item Tampering (No Trigger on tax_invoice_items)",
        "sql_attack": """
-- Scenario: Invoice header is POSTED (is_posted = TRUE).
-- Attacker directly mutates line items in tax_invoice_items table.
UPDATE tax_invoice_items
SET quantity = 9999.0000,
    unit_price_thb = 0.0100,
    net_line_amount_thb = 99.99
WHERE invoice_id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

-- Or complete erasure of itemized records:
DELETE FROM tax_invoice_items
WHERE invoice_id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
        """,
        "trigger_behavior": "Trigger trg_tax_invoice_immutable is attached ONLY to 'tax_invoices'. Zero triggers exist on 'tax_invoice_items'.",
        "outcome": "BYPASS SUCCESSFUL: Child line items can be freely updated or deleted after invoice posting, violating Thai Revenue Code Sec 86/4 itemization mandates.",
        "severity": "CRITICAL",
        "recommended_fix": "Implement trg_tax_invoice_items_immutable BEFORE UPDATE OR DELETE ON tax_invoice_items that joins to tax_invoices to check is_posted = TRUE, or checks a denormalized is_posted flag."
    },
    {
        "vector_id": "VEC-IMM-03",
        "name": "Schema Inconsistency Crash (OLD.is_posted vs OLD.status)",
        "sql_attack": """
-- docs/02 §3.5 Trigger definition:
CREATE OR REPLACE FUNCTION trg_prevent_posted_tax_invoice_mutation()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status = 'POSTED' THEN  -- Fails! No 'status' column in docs/03 DDL!
        RAISE EXCEPTION '...';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
        """,
        "trigger_behavior": "PostgreSQL throws runtime exception 42703 (undefined_column) when attempting to execute the docs/02 trigger on the docs/03 schema.",
        "outcome": "RUNTIME CRASH: Architectural divergence between HLD (docs/02) and Technical Spec (docs/03).",
        "severity": "HIGH",
        "recommended_fix": "Standardize on is_posted BOOLEAN and e_tax_status across both docs/02 and docs/03."
    },
    {
        "vector_id": "VEC-IMM-04",
        "name": "Dead Code / Impossible Cancellation Path on tax_invoices",
        "sql_attack": """
-- In docs/03 DDL, tax_invoices has columns:
-- is_cancelled BOOLEAN NOT NULL DEFAULT FALSE,
-- cancelled_reason VARCHAR(255)

-- Attempt to cancel a posted invoice:
UPDATE tax_invoices
SET is_cancelled = TRUE,
    cancelled_reason = 'Wrong contractor tax ID'
WHERE invoice_id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
        """,
        "trigger_behavior": "Trigger unconditionally blocks ANY update when OLD.is_posted = TRUE, including updating is_cancelled.",
        "outcome": "OPERATIONAL DEADLOCK: If developers attempt to implement an 'Invoice Void' feature using is_cancelled, it will always fail. Under Thai law, posted invoices must NEVER be cancelled via update; they require a Section 86/10 Credit Note.",
        "severity": "MEDIUM",
        "recommended_fix": "Remove is_cancelled and cancelled_reason columns from tax_invoices to eliminate invalid design temptation. Mandate credit_notes table."
    },
    {
        "vector_id": "VEC-IMM-05",
        "name": "Missing Credit Note DDL (Statutory Gap)",
        "sql_attack": """
-- Query for credit note table:
SELECT to_regclass('credit_notes'); -- Returns NULL!
SELECT to_regclass('credit_note_items'); -- Returns NULL!
        """,
        "trigger_behavior": "Trigger error message explicitly directs: 'Cancelling requires an official Credit Note.' However, zero DDL exists in docs/03 for credit_notes.",
        "outcome": "SPECIFICATION DEFECT: The database schema cannot support the required adjustment path promised by the trigger and mandated by Thai Revenue Code Section 86/10.",
        "severity": "HIGH",
        "recommended_fix": "Provide full DDL schema for credit_notes and credit_note_items with statutory reason codes."
    },
    {
        "vector_id": "VEC-IMM-06",
        "name": "TRUNCATE / Partition Level Deletion Bypass",
        "sql_attack": """
-- Attacker with table write access truncates partition:
TRUNCATE tax_invoices_2026;
        """,
        "trigger_behavior": "PostgreSQL BEFORE UPDATE OR DELETE triggers do NOT intercept TRUNCATE statements.",
        "outcome": "BYPASS SUCCESSFUL: Partition data wiped out without trigger invocation.",
        "severity": "HIGH",
        "recommended_fix": "Add BEFORE TRUNCATE trigger or REVOKE TRUNCATE privilege from application roles."
    }
]

def print_audit():
    print("================================================================================")
    print("EMPIRICAL ADVERSARIAL AUDIT: trg_tax_invoice_immutable VULNERABILITY ANALYSIS")
    print("================================================================================\n")
    for vec in ATTACK_VECTORS:
        print(f"[{vec['severity']}] {vec['vector_id']}: {vec['name']}")
        print(f"  Trigger Mechanism: {vec['trigger_behavior']}")
        print(f"  Outcome: {vec['outcome']}")
        print(f"  Fix: {vec['recommended_fix']}\n")

if __name__ == "__main__":
    print_audit()
