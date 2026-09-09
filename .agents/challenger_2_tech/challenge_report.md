# Challenge Report: Technical DDL, API Contracts & Immutability Adversarial Verification

```
Agent Role        : Challenger 2 (Technical DDL & API Contract Adversarial Verifier)
Target Deliverables: docs/02_system_architecture_high_level_design.md
                    docs/03_technical_specifications_implementation_guidelines.md
Authoritative Scope: ORIGINAL_REQUEST.md (R1, R2, R3, Acceptance Criteria)
Verification Date : 2026-09-09
Overall Verdict   : REQUEST_CHANGES
```

---

## Challenge Summary

**Overall Risk Assessment**: **HIGH**

While the technical architecture and specifications in `docs/02` and `docs/03` demonstrate exceptional depth and high engineering rigor, adversarial testing identified critical security bypasses, statutory gaps under the Thai Revenue Code, API contract ambiguities, and git linter regex flaws that must be remediated prior to production implementation.

| Challenge ID | Severity | Category | Target Location | Summary Description |
| :--- | :--- | :--- | :--- | :--- |
| **CHAL-01** | **CRITICAL** | Security / Immutability | `docs/03` §2.7 (line 823) | **Transition-State Mutation Bypass**: `trg_prevent_posted_tax_invoice_mutation()` only checks `OLD.is_posted = TRUE`. Allows simultaneous alteration of financial totals during the transition from unposted to posted. |
| **CHAL-02** | **CRITICAL** | Security / Integrity | `docs/03` §2.4.6 (line 703) | **Unprotected Child Records**: `tax_invoice_items` lacks any immutability trigger; line items can be updated/deleted on posted invoices without error. |
| **CHAL-03** | **HIGH** | Regulatory / DDL Gap | `docs/03` §2.4 | **Missing Credit Note DDL**: Trigger error directs users to issue Credit Notes under Section 86/10, but `credit_notes` and `credit_note_items` tables are completely missing from DDL. |
| **CHAL-04** | **HIGH** | Typing / Precision | `docs/03` §3 (lines 887, 894, 998) | **JSON Floating-Point Leak**: API request payloads use unquoted JSON numbers for fractional quantities and distances, violating the absolute ban on IEEE 754 floats. |
| **CHAL-05** | **MEDIUM** | Code Quality / NFR | `docs/02` §4.5 (lines 1127, 1135) | **Float Ingestion in Go Code**: `ReconcileDocumentVAT` utilizes `decimal.NewFromFloat(0.07)`, directly ingesting IEEE 754 float literals. |
| **CHAL-06** | **HIGH** | API Contract / Governance| `docs/03` §3.3 | **Missing Floor Override Governance Field**: `POST /api/v1/orders` lacks a field to supply the approved `makerCheckerRequestId` when orders breach floor prices. |
| **CHAL-07** | **HIGH** | Engineering Standards | `docs/03` §4.1, §4.2 | **Husky Commit Regex False Positives**: Regex permits uppercase start, trailing periods, and messages exceeding 72 characters, directly violating Rule 4 of the specification. |
| **CHAL-08** | **MEDIUM** | Architectural Drift | `docs/02` vs `docs/03` | **Trigger Column Name Mismatch**: `docs/02` trigger references `OLD.status = 'POSTED'` whereas `docs/03` defines `is_posted BOOLEAN`, causing PostgreSQL runtime crash. |

---

## Detailed Challenges & Vulnerability Analysis

### [CRITICAL] Challenge 1: Transition-State Mutation Bypass in `trg_tax_invoice_immutable`

- **Assumption Challenged**: The PostgreSQL trigger `trg_tax_invoice_immutable` guarantees that posted tax invoices cannot be altered or forged.
- **Attack Scenario**:
  The trigger function in `docs/03` §2.7 states:
  ```sql
  CREATE OR REPLACE FUNCTION trg_prevent_posted_tax_invoice_mutation()
  RETURNS TRIGGER AS $$
  BEGIN
      -- If the record was already marked as POSTED, reject any UPDATE or DELETE
      IF OLD.is_posted = TRUE THEN
          RAISE EXCEPTION 'REVENUE DEPARTMENT SECURITY VIOLATION: Tax Invoice % has already been posted and is legally immutable. Cancelling requires an official Credit Note.', OLD.invoice_number
          USING ERRCODE = '27000';
      END IF;
      RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;
  ```
  An invoice is inserted in a draft state with `is_posted = FALSE`. When the invoice is posted, an attacker or defective script executes:
  ```sql
  UPDATE tax_invoices
  SET is_posted = TRUE,
      grand_total_thb = 1.00,
      customer_tax_id = '9999999999999',
      output_vat_thb = 0.07,
      net_taxable_amount_thb = 0.93
  WHERE invoice_id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
    AND is_posted = FALSE;
  ```
  Because `OLD.is_posted` is `FALSE` when the UPDATE executes, the trigger condition `IF OLD.is_posted = TRUE` evaluates to `FALSE`. The trigger executes `RETURN NEW` without raising an exception.
- **Blast Radius**: The record is committed with `is_posted = TRUE` and completely fraudulent financial amounts and tax ID. The Thai Revenue Department legal audit trail is irrevocably corrupted.
- **Mitigation**:
  Enforce transition-state column freezing. If `NEW.is_posted = TRUE` and `OLD.is_posted = FALSE`, explicitly forbid mutations to any legal or financial columns:
  ```sql
  CREATE OR REPLACE FUNCTION trg_prevent_posted_tax_invoice_mutation()
  RETURNS TRIGGER AS $$
  BEGIN
      -- Block any mutation if already posted
      IF OLD.is_posted = TRUE THEN
          RAISE EXCEPTION 'REVENUE DEPARTMENT SECURITY VIOLATION: Tax Invoice % has already been posted and is legally immutable. Cancelling requires an official Credit Note.', OLD.invoice_number
          USING ERRCODE = '27000';
      END IF;

      -- Block financial/legal alterations during the posting transition
      IF NEW.is_posted = TRUE AND OLD.is_posted = FALSE THEN
          IF NEW.grand_total_thb <> OLD.grand_total_thb OR
             NEW.net_taxable_amount_thb <> OLD.net_taxable_amount_thb OR
             NEW.output_vat_thb <> OLD.output_vat_thb OR
             NEW.customer_tax_id <> OLD.customer_tax_id OR
             NEW.customer_branch_code <> OLD.customer_branch_code OR
             NEW.seller_tax_id <> OLD.seller_tax_id THEN
              RAISE EXCEPTION 'SECURITY VIOLATION: Financial and legal identity fields cannot be modified during invoice posting transition.'
              USING ERRCODE = '27002';
          END IF;
      END IF;

      RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;
  ```

---

### [CRITICAL] Challenge 2: Unprotected Child Records (`tax_invoice_items`)

- **Assumption Challenged**: Tax invoice data integrity is secured by attaching `trg_tax_invoice_immutable` to `tax_invoices`.
- **Attack Scenario**:
  The trigger `trg_tax_invoice_immutable` is attached strictly to the header table `tax_invoices` (`BEFORE UPDATE OR DELETE ON tax_invoices`).
  The child table `tax_invoice_items` (lines 703–720) has **NO TRIGGERS WHATSOEVER**.
  An authenticated attacker or backend bug can execute:
  ```sql
  UPDATE tax_invoice_items
  SET quantity = 9999.0000, unit_price_thb = 0.0100, net_line_amount_thb = 99.99
  WHERE invoice_id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

  DELETE FROM tax_invoice_items
  WHERE invoice_id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
  ```
  PostgreSQL executes the statements without warning. The header shows 61,311.00 THB, while child items are deleted or modified.
- **Blast Radius**: Severe tax fraud and violation of Section 86/4 of the Thai Revenue Code (which mandates itemized description and pricing consistency on full tax invoices).
- **Mitigation**:
  Implement an immutability trigger directly on `tax_invoice_items`:
  ```sql
  CREATE OR REPLACE FUNCTION trg_prevent_posted_tax_invoice_item_mutation()
  RETURNS TRIGGER AS $$
  DECLARE
      v_is_posted BOOLEAN;
  BEGIN
      SELECT is_posted INTO v_is_posted
      FROM tax_invoices
      WHERE invoice_id = COALESCE(OLD.invoice_id, NEW.invoice_id)
        AND posting_timestamp = COALESCE(OLD.posting_timestamp, NEW.posting_timestamp);

      IF v_is_posted = TRUE THEN
          RAISE EXCEPTION 'REVENUE DEPARTMENT SECURITY VIOLATION: Cannot modify or delete items of a posted Tax Invoice.'
          USING ERRCODE = '27000';
      END IF;
      RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  CREATE TRIGGER trg_tax_invoice_items_immutable
  BEFORE INSERT OR UPDATE OR DELETE ON tax_invoice_items
  FOR EACH ROW EXECUTE FUNCTION trg_prevent_posted_tax_invoice_item_mutation();
  ```

---

### [HIGH] Challenge 3: Missing Credit Note DDL (Statutory Defect)

- **Assumption Challenged**: The system architecture provides complete DDL schemas for all Release 1 business domains specified in `ORIGINAL_REQUEST.md` (R2: E10, R3: Data Model).
- **Attack Scenario**:
  The trigger `trg_prevent_posted_tax_invoice_mutation` raises:
  `"Cancelling requires an official Credit Note."`
  Furthermore, `docs/02` §3.5 specifies:
  `"Credit Note Engine (Section 86/10 Compliance): Credit Notes require statutory reason codes..."`
  However, searching `docs/03` reveals **ZERO DDL statements** for `credit_notes` or `credit_note_items`.
- **Blast Radius**: When developers attempt to implement the Credit Note Engine (E12 / Sprint S7–S8), no database blueprint exists. Financial downward adjustments, damaged goods returns, and tax credits cannot be persisted legally.
- **Mitigation**:
  Add production DDL schemas for `credit_notes` and `credit_note_items` in `docs/03` §2.4:
  ```sql
  CREATE TYPE credit_note_reason_enum AS ENUM (
      'CN_REASON_RETURN',
      'CN_REASON_PRICE_ADJUST',
      'CN_REASON_COMMERCIAL_DISCOUNT',
      'CN_REASON_CALCULATION_ERROR'
  );

  CREATE TABLE credit_notes (
      credit_note_id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      credit_note_number      VARCHAR(32) NOT NULL UNIQUE,
      original_invoice_id     UUID NOT NULL,
      customer_id             UUID NOT NULL REFERENCES customers(customer_id),
      branch_id               VARCHAR(16) NOT NULL REFERENCES inventory_branches(branch_id),
      reason_code             credit_note_reason_enum NOT NULL,
      reason_description      VARCHAR(255) NOT NULL,
      original_gross_thb      NUMERIC(15, 2) NOT NULL,
      corrected_gross_thb     NUMERIC(15, 2) NOT NULL,
      difference_amount_thb   NUMERIC(15, 2) NOT NULL,
      vat_rate                NUMERIC(5, 4) NOT NULL DEFAULT 0.0700,
      vat_difference_thb      NUMERIC(15, 2) NOT NULL,
      total_credit_thb        NUMERIC(15, 2) NOT NULL,
      is_posted               BOOLEAN NOT NULL DEFAULT FALSE,
      posting_timestamp       TIMESTAMPTZ,
      created_by              VARCHAR(64) NOT NULL,
      created_at              TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT chk_cn_math CHECK (total_credit_thb = difference_amount_thb + vat_difference_thb)
  );

  CREATE TABLE credit_note_items (
      cn_item_id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      credit_note_id          UUID NOT NULL REFERENCES credit_notes(credit_note_id) ON DELETE CASCADE,
      product_id              UUID NOT NULL REFERENCES products(product_id),
      returned_quantity       NUMERIC(12, 4) NOT NULL DEFAULT 0.0000,
      unit_credit_price_thb   NUMERIC(18, 4) NOT NULL,
      line_credit_total_thb   NUMERIC(15, 2) NOT NULL
  );
  ```

---

### [HIGH] Challenge 4: JSON Floating-Point Representation Leak in API Contracts

- **Assumption Challenged**: Floating-point representations are strictly prohibited across all DTO interfaces and application code (Tenet 1 & §2.2).
- **Attack Scenario**:
  In `docs/03` §3.2 (lines 887, 894, 901) and §3.3 (lines 998, 1005):
  ```json
  "deliveryDistanceKm": 28.50,
  "quantity": 250.0000,
  "quantity": 100.0000,
  "utilizationPercentage": 42.26
  ```
  These values are encoded as raw JSON unquoted numbers. When Fastify or browser clients invoke `JSON.parse()`, these values are parsed into standard JavaScript `Number` primitives (IEEE 754 double-precision floats).
  For fractional bulk materials (e.g., `14.2500` m³ concrete or `28.50` km distance), floating-point arithmetic drift occurs immediately upon parsing.
- **Blast Radius**: Breaches the core architecture mandate ("Strict Data Type & Precision Rules: Absolute Ban on Floats"). May cause penny rounding errors during freight calculation and quantity deductions.
- **Mitigation**:
  Format all decimal and quantity fields in OpenAPI contracts as quoted strings (`"250.0000"`, `"28.50"`), and define them with `type: string`, `format: decimal`, `pattern: ^[0-9]+(\.[0-9]{1,4})?$`.

---

### [HIGH] Challenge 5: Missing Governance Link in Order Submission (`POST /api/v1/orders`)

- **Assumption Challenged**: The order submission endpoint enforces floor price governance and connects to Maker-Checker staging (§2.5).
- **Attack Scenario**:
  In `orders` DDL (lines 624–626), the schema includes:
  `requires_floor_override BOOLEAN`, `floor_override_approved BOOLEAN`, `floor_override_approver VARCHAR(64)`.
  However, in `POST /api/v1/orders` request payload (§3.3 lines 984–1010), there is **no field** to supply an approved `makerCheckerRequestId` or `floorOverrideToken`.
- **Blast Radius**: When an order contains a line item below floor price, the API controller cannot correlate the request with an approved Maker-Checker staging request, resulting in either unapproved orders slipping through or validly approved orders being perpetually blocked.
- **Mitigation**:
  Add `floorOverrideRequestId?: string (UUID)` to the `POST /api/v1/orders` request schema.

---

### [HIGH] Challenge 6: Husky Commit Linter Regex False Positives & Spec Non-Conformance

- **Assumption Challenged**: The regex in `docs/03` §4.1 and §4.2 enforces the commit convention rules defined in Section 4.1.
- **Attack Scenario**:
  Section 4.1 specifies Rule 4:
  `"Subject: Imperative mood, present tense, lowercase start, no trailing period, maximum 72 characters."`
  The enforcement regex provided is:
  ```regex
  ^\[FR-[A-Z0-9]{2,4}-[0-9]{3,4}\] (feat|fix|refactor|test|chore|docs)(\([a-z0-9-]+\))?: .+$
  ```
  We tested this regex empirically (see `test_commit_regex.py`):
  1. **Uppercase Start**: `[FR-02-004] feat(pricing): Implement volume break` -> **PASSES** (Should fail per Rule 4).
  2. **Trailing Period**: `[FR-02-004] feat(pricing): implement volume break.` -> **PASSES** (Should fail per Rule 4).
  3. **Length > 72 Characters**: `[FR-02-004] feat(pricing): implement volume break tiered pricing engine with dynamic zone freight calculations and floor price boundary checks` (134 chars) -> **PASSES** (Should fail per Rule 4).
  4. **Snake_case Scope**: `[FR-02-004] feat(pricing_engine): implement volume break` -> **FAILS** (Rejects valid snake_case scopes because `_` is omitted from `[a-z0-9-]`).
  5. **Conventional Breaking Changes**: `[FR-02-004] feat(pricing)!: drop deprecated endpoint` -> **FAILS** (Rejects conventional commit `!` indicator).
- **Blast Radius**: Lowers automated git quality enforcement; non-conforming commit messages flood the git log while valid snake_case scopes are rejected.
- **Mitigation**:
  Update the regex pattern in §4.1 and §4.2 to:
  ```regex
  ^\[FR-[A-Z0-9]{2,4}-[0-9]{3,4}\] (feat|fix|refactor|test|chore|docs)(\([a-z0-9-_]+\))?!?: [a-z0-9][^.\n]{1,70}[^.\s\n]$
  ```
  And in the Husky bash script, enforce character count:
  ```bash
  if [ ${#COMMIT_MSG} -gt 100 ]; then ... exit 1; fi
  ```

---

### [MEDIUM] Challenge 7: Architectural Drift between HLD (`docs/02`) and Tech Spec (`docs/03`)

- **Assumption Challenged**: System architecture documents maintain unified column and table definitions.
- **Attack Scenario**:
  In `docs/02` §3.5 (line 958):
  ```sql
  IF OLD.status = 'POSTED' THEN ...
  ```
  In `docs/03` §2.4.6 (lines 682–686):
  The column is `is_posted BOOLEAN`, and there is NO `status` column on `tax_invoices`.
- **Blast Radius**: Copying the trigger from `docs/02` directly into PostgreSQL crashes with `ERROR: record "old" has no field "status"`.
- **Mitigation**:
  Align `docs/02` to use `IF OLD.is_posted = TRUE` and reference `is_posted BOOLEAN` consistently.

---

### [MEDIUM] Challenge 8: Float Ingestion in Go Code (`docs/02` §4.5)

- **Assumption Challenged**: Absolute ban on floating-point primitives in calculation code.
- **Attack Scenario**:
  In `docs/02` lines 1127 and 1135:
  ```go
  expectedTotalVAT := taxableTotal.Mul(decimal.NewFromFloat(0.07)).Round(2)
  lineVAT := lineTaxable.Mul(decimal.NewFromFloat(0.07)).Round(2)
  ```
  `decimal.NewFromFloat(0.07)` ingests an IEEE 754 float64 literal, which has infinite binary expansion (`0.070000000000000006661...`).
- **Blast Radius**: Direct contradiction of Architectural Tenet 1.
- **Mitigation**:
  Replace with string initialization:
  ```go
  expectedTotalVAT := taxableTotal.Mul(decimal.RequireFromString("0.07")).Round(2)
  ```

---

## Empirical Verification Test Harnesses

The following verification scripts were generated and placed in `c:\atgv\wds\.agents\challenger_2_tech\`:
1. `test_ddl_types.py`: Complete scanner of all 18 DDL tables, checking forbidden types and numeric precision.
2. `test_trigger_adversarial.py`: Adversarial execution harness for `trg_tax_invoice_immutable` failure modes.
3. `test_api_contracts.py`: Comprehensive audit matrix of OpenAPI request/response schemas.
4. `test_commit_regex.py`: Positive, negative, and false-positive test cases for the Husky commit linter regex.

---

## Summary of Required Remediations (For REQUEST_CHANGES)

To achieve full approval, the following remediations must be incorporated into `docs/02` and `docs/03`:
1. **Strengthen `trg_prevent_posted_tax_invoice_mutation`**:
   - Prevent financial/legal attribute modifications during the posting transition (`is_posted` from `FALSE` to `TRUE`).
   - Attach an immutability trigger `trg_tax_invoice_items_immutable` to `tax_invoice_items`.
2. **Add DDL for Credit Notes**:
   - Add `credit_notes` and `credit_note_items` table definitions in `docs/03` §2.4.
3. **Purge Float Primitives from API Contracts & Code**:
   - Change API request/response quantities and distances from unquoted JSON numbers to decimal strings in `docs/03` §3.
   - Replace `decimal.NewFromFloat(0.07)` with `decimal.RequireFromString("0.07")` in `docs/02` §4.5.
4. **Upgrade Husky Commit Hook Regex**:
   - Fix regex to reject uppercase starts, reject trailing periods, accommodate snake_case scopes, and enforce subject line limits.
5. **Add Maker-Checker Override Link to `POST /api/v1/orders`**:
   - Include `floorOverrideRequestId` in the order submission DTO.
