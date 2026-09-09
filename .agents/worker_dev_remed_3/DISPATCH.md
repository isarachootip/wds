## 2026-09-09T03:37:17Z
You are the Sr. Dev Remediation Worker for the Thai Watsadu WDS system design.
Your working directory is: c:\atgv\wds\.agents\worker_dev_remed_3
You MUST read the authoritative user request at: c:\atgv\wds\ORIGINAL_REQUEST.md
You MUST read the remediation blueprint at: c:\atgv\wds\.agents\explorer_remediation_p1\remediation_plan.md (especially Section 3: Document 03 Remediation Plan).

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

WRITE OWNERSHIP:
You EXCLUSIVELY own and MUST update the deliverable file at:
c:\atgv\wds\docs\03_technical_specifications_implementation_guidelines.md

Your mission:
Apply all Section 3 remediations from remediation_plan.md to c:\atgv\wds\docs\03_technical_specifications_implementation_guidelines.md:
1. Synchronize Roadmap Table (Section 6):
   - Update roadmap to individual sprints S0 through S12 strictly matching Doc 01.
2. Harden Tax Invoice Immutability Triggers:
   - Update `trg_prevent_posted_tax_invoice_mutation`: Check `IF OLD.is_posted = TRUE` AND during transition (`OLD.is_posted = FALSE AND NEW.is_posted = TRUE`) enforce that NO financial amounts, tax IDs, or branch codes are mutated in that statement.
   - Add `trg_tax_invoice_items_immutable` on `tax_invoice_items` that forbids UPDATE/DELETE when parent invoice has `is_posted = TRUE`.
3. Add Complete Production DDL for Credit Notes (Thai Revenue Code Section 86/10):
   - Add `credit_notes` table and `credit_note_items` table with foreign keys, statutory reason codes, `NUMERIC(18,4)` amounts, and immutability triggers.
4. Add Concurrency-Safe Gapless Sequence Generator DDL:
   - Implement `fn_get_next_tax_invoice_number` using `ON CONFLICT (branch_code, fiscal_year, fiscal_month) DO UPDATE` to prevent month-start duplicate key collisions.
5. Quote All Decimals in JSON API Contracts (Section 3):
   - In all request/response JSON payloads, represent quantities, unit prices, discounts, tax amounts, and distance as strings (e.g. `"quantity": "250.0000"`, `"deliveryDistanceKm": "28.50"`) to prevent Float64 precision loss in JSON parsers.
6. Add Governance Field to Order Submission API:
   - Add `floorOverrideRequestId` (UUID, optional) in `POST /api/v1/orders`.
7. Refine Husky Commit Linter Regex:
   - Update regex and commit-msg hook script to enforce 72-char limit, lowercase start, no trailing period, and support snake_case scopes:
     `^\[FR-[A-Z0-9]{2,4}-[0-9]{3,4}\] (feat|fix|refactor|test|chore|docs)(\([a-z0-9_-]+\))?: [a-z0-9][a-zA-Z0-9 _-]{1,70}[^.]$`

Ensure the file remains fully intact, highly detailed, and completely professional.
Write your handoff summary to c:\atgv\wds\.agents\worker_dev_remed_3\handoff.md and send a message upon completion.
