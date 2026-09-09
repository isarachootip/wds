# Handoff Report — Challenger 1 (PM & Domain Logic Adversarial Verifier)

```
Document Identifier : TW-WDS-HANDOFF-CHALLENGER-1
Working Directory   : c:\atgv\wds\.agents\challenger_1_pm_sa
Review Target       : Deliverable 01 (PM Framework) & Deliverable 02 (System Architecture HLD)
Review Date         : 2026-09-09
Explicit Verdict    : REQUEST_CHANGES
Overall Risk Level  : CRITICAL
```

---

## 1. Observation

### 1.1 PM Capacity & Velocity Model
- **File**: `c:\atgv\wds\docs\01_project_management_delivery_framework.md`
- **Lines 120–127**:
  > "Gross Team Capacity: $9 \text{ Engineers} \times 10 \text{ Days} \times 8 \text{ Hours/Day} = 720 \text{ Gross Hours per Sprint}$."
  > "Net Productive Capacity = $720 \times 0.70 = 504 \text{ Productive Engineering Hours / Sprint}$"
  > "Sprint Velocity Baseline = $\frac{504 \text{ Hours}}{12 \text{ Hours/SP}} = 42 \text{ Story Points / Sprint}$ *(Conservative operational target budgeted at 40 SP / Sprint)*."
- **Lines 93–100 & 106–117**: Team headcount breakdown specifies:
  * 1 Dev Lead / Principal Architect
  * 4 Backend Engineers (BE1, BE2, BE3, BE4)
  * 2 Frontend Engineers (FE1, FE2)
  * 1 QA Automation Lead ("Automated Test Harnesses, E2E Regression, Statutory RD Verification")
  * 1 DevOps / Platform Engineer ("CI/CD Pipelines, Neon DB, Redis Clusters, Kafka, Docker/K8s infra")
- **Lines 133–139**:
  > "Sprint S1 to S11 (11 Core Sprints): $11 \text{ Sprints} \times 40 \text{ SP/Sprint} = 440 \text{ Productive Delivery Story Points}$"
  > "Reserve Buffer = $480 \text{ Planned Capacity} - 440 \text{ Scope Sizing} = 40 \text{ Story Points (9.1\% Buffer)}$"

### 1.2 Scope Baseline vs. 20-Item Drop List Protocol
- **File**: `c:\atgv\wds\docs\01_project_management_delivery_framework.md`
- **Lines 82–83**:
  > "Release 1.1 & 2.0 (Deferred Scope): 160 non-critical requirements (e.g., Native iOS/Android apps, predictive machine learning demand forecasting, IoT weighbridge automation, customer self-service return portals) deferred to subsequent phases."
- **Lines 674–678**: Drop List Priority Matrix enumerates:
  * Drop #1: "Native Mobile Apps for B2B Contractors (iOS/Android) — 8 SP"
  * Drop #2: "Predictive Demand Forecasting & AI Replenishment — 8 SP"
  * Drop #4: "IoT Automated Weighbridge Hardware Integration — 7 SP"
  * Drop #5: "Customer Self-Service Return Portal — 7 SP"
- **Lines 199–211 & 674–693**: Drop items scheduled in early sprints:
  * Drop #7: E02 Automated Competitor Price Scraping (9 SP) $\to$ Epic E02 is scheduled in S2–S3
  * Drop #10: E03 Real-Time NCB API Scoring (8 SP) $\to$ Epic E03 is scheduled in S3–S4
  * Drop #12: E07 Blind Receiving Barcode Scanner (7 SP) $\to$ Epic E07 is scheduled in S4–S5
  * Drop #14: E01 Vendor Self-Registration Portal (7 SP) $\to$ Epic E01 is scheduled in S1–S2
  * Drop #18: E02 Complex Cross-Category Bundle Rules (9 SP) $\to$ Epic E02 is scheduled in S2–S3
  * Drop #19: E03 Automated Cheque OCR & MICR (7 SP) $\to$ Epic E03 is scheduled in S3–S4
  * Sunk SP scheduled in past sprints prior to CP3 (end of S5): $9 + 8 + 7 + 7 + 9 + 7 = 47 \text{ SP}$.

### 1.3 FEFO Pallet Allocation Algorithm
- **File**: `c:\atgv\wds\docs\02_system_architecture_high_level_design.md`
- **Lines 855–876**: Algorithm `FEFO_Pallet_Allocation`:
  ```
  3. For each lot in candidate lots:
       pallet_size = SKU.units_per_pallet (e.g. 40 bags)
       full_pallets_available = FLOOR(lot.available_qty / pallet_size)
       If RequiredQuantity >= pallet_size AND full_pallets_available > 0:
           pallets_to_take = MIN(full_pallets_available, FLOOR(RequiredQuantity / pallet_size))
           qty_to_take = pallets_to_take * pallet_size
           Allocate(lot, qty_to_take)
           RequiredQuantity = RequiredQuantity - qty_to_take
           
  4. If RequiredQuantity > 0:
       // Satisfy remaining odd quantity from earliest expiring lot with available stock
       Select earliest lot with available_qty >= RequiredQuantity
       Allocate(lot, RequiredQuantity)
       RequiredQuantity = 0
  ```

### 1.4 Credit Exposure Calculus & Concurrency
- **File**: `c:\atgv\wds\docs\02_system_architecture_high_level_design.md`
- **Line 805**:
  > "$\text{TotalExposure} = \text{AR}_{\text{Unpaid}} + \text{Orders}_{\text{InFulfillment}} + \text{Cart}_{\text{CheckingOut}} + \mathbf{PDC_{\text{Unpresented}}} - \text{CreditNotes}_{\text{Unapplied}}$"
- **Lines 801–840 & 1002**: No data model or lifecycle state machine exists for `credit_reservations` or `Cart_CheckingOut` (unlike inventory which has `stock_reservations` with 30-min TTL and a Reaper Daemon).

### 1.5 Tax Invoicing Sequence Generator & Float Primitive Violation
- **File**: `c:\atgv\wds\docs\02_system_architecture_high_level_design.md`
- **Lines 933–944**:
  ```sql
  UPDATE tax_invoice_sequences
  SET last_assigned_sequence = last_assigned_sequence + 1
  WHERE branch_code = p_branch 
    AND fiscal_year_be = p_year_be 
    AND fiscal_month = p_month
  RETURNING last_assigned_sequence INTO v_next_seq;
  
  IF NOT FOUND THEN
      INSERT INTO tax_invoice_sequences (branch_code, fiscal_year_be, fiscal_month, last_assigned_sequence)
      VALUES (p_branch, p_year_be, p_month, 1)
      RETURNING 1 INTO v_next_seq;
  END IF;
  ```
- **Lines 1105–1106 & 1127**:
  > "Absolute Ban on Floating-Point Primitives: The use of IEEE 754 floating-point types (`float`, `double`, `Float32`, `Float64`) is strictly forbidden in financial, inventory, and tax calculation code."
  > `expectedTotalVAT := taxableTotal.Mul(decimal.NewFromFloat(0.07)).Round(2)`
- **Lines 1146–1150**:
  ```go
  diff := expectedTotalVAT.Sub(computedSumVAT)
  if !diff.IsZero() {
      // Adjust penny difference on the largest line item
      lines[maxLineIdx].VATAmount = lines[maxLineIdx].VATAmount.Add(diff)
  }
  ```

---

## 2. Logic Chain

1. **Capacity Deficit Inference**:
   - From Observation 1.1, the 40 SP/sprint model assumes 9 full-time feature coders.
   - However, 1 QA Lead and 1 DevOps engineer do not deliver feature story points, and the Dev Lead has $\ge 50\%$ overhead in reviews, SteerCo, and ARB governance.
   - True feature coding capacity is only 6.5 FTE. At 70% focus factor and 12 hrs/SP, sustainable velocity is $6.5 \times 80 \times 0.70 / 12 = 30.33 \text{ SP/sprint}$.
   - Over 11 development sprints, 6.5 FTE can deliver $11 \times 30.33 = 333.6 \text{ SP}$.
   - Sizing committed scope at 440 SP creates an immediate, structural **106.4 SP (24.2%) capacity deficit**.
   - Furthermore, with only 2 Frontend Engineers, maximum FE capacity is $2 \times 80 \times 0.70 / 12 = 9.33 \text{ SP/sprint}$ (102.6 SP total), creating a ~50 SP frontend overflow across 12 UI domains.

2. **Drop List Invalidation Inference**:
   - From Observation 1.2, Drop Items 1, 2, 4, 5 are explicitly listed in Section 1.2 as part of the 160 deferred requirements already excluded from Release 1. If they were already excluded, dropping them in Section 5.3 recovers 0 SP from the 440 SP scope.
   - Furthermore, 47 SP of the Drop List (Items 7, 10, 12, 14, 18, 19) belongs to Epics E01, E02, E03, E07 scheduled in Sprints 1 to 5.
   - Because CP3 triggers at the *end of Sprint 5*, Sprints 1 to 5 are in the past. Sunk or omitted past work cannot recover future capacity for S6–S11. The true future recoverable capacity is at most $152 - 47 = 105 \text{ SP}$.

3. **Domain Logic Invalidation Inference (Inventory FEFO)**:
   - From Observation 1.3, Step 4 of `FEFO_Pallet_Allocation` requires `available_qty >= RequiredQuantity`.
   - If odd demand is 25 bags, and remaining lots have 15 bags and 15 bags, total stock is 30 bags (sufficient), but neither lot has $\ge 25$ bags. Step 4 returns `NULL` and crashes or fails to allocate.
   - Moreover, prioritizing full pallets in Step 3 skips older partial pallets, creating an "Aging Trap" that leads to cement spoilage.

4. **Domain Logic Invalidation Inference (Credit & Concurrency)**:
   - From Observation 1.4, adding `+ PDC_Unpresented` treats received cheques as debt. A customer with 850k AR and a 1M limit handing in a 200k cheque is calculated at 1,050k exposure, immediately triggering an erroneous hard block.
   - Additionally, the absence of a `credit_reservations` table and two-phase locking allows concurrent checkouts to read the same exposure balance and double-spend headroom.

5. **Statutory & Implementation Invalidation Inference (Tax Invoicing)**:
   - From Observation 1.5, `fn_get_next_tax_invoice_number` executes `UPDATE ... IF NOT FOUND THEN INSERT`. On the first day of a month under concurrent checkouts, both transactions get `NOT FOUND`, both attempt `INSERT`, and one crashes with a unique key violation.
   - Line 1127 violates the project's float ban by calling `decimal.NewFromFloat(0.07)`.
   - Modifying a single line's VAT in `ReconcileDocumentVAT` causes that line's stated VAT to mismatch $7\% \times \text{TaxableAmount}$, creating an audit non-compliance under Thai Revenue Code Section 86/4 (7).

---

## 3. Caveats

- **Scope of Assessment**: This review evaluated Deliverable 01 (PM Framework) and Deliverable 02 (System Architecture HLD). Deliverable 03 (Sr. Dev Technical Specifications & Schemas) was not yet formally submitted for review; its schema files should be audited to ensure these defects are not propagated.
- **Assumptions**: The focus factor of 70% and 12 hours/SP baseline from Deliverable 01 was accepted as authoritative for calculation purposes.
- **Alternative Interpretations Considered**: Considered whether `PDC_Unpresented` was meant to represent *bounced* cheques rather than received unpresented cheques; however, bounced cheques are handled separately by `BouncedChequeProtocolHandler` and line 812 ("$\ge 1$ bounced cheque within 90 days"). The mathematical addition of unpresented cheques remains a critical bug.

---

## 4. Conclusion

The deliverables cannot be approved in their current state due to critical capacity miscalculations, post-facto scope reduction fallacies, catastrophic domain logic errors (PDC sign bug, FEFO allocation crash), and statutory concurrency failures in tax invoice generation.

**Explicit Verdict**: **REQUEST_CHANGES**

---

## 5. Verification Method

To independently verify these findings:
1. **PM Velocity Audit**:
   - Inspect `01_project_management_delivery_framework.md` lines 93–117 and calculate: $(4 \text{ BE} + 2 \text{ FE} + 0.5 \text{ Dev Lead}) \times 80 \times 0.70 / 12 = 30.33 \text{ SP/sprint}$. Verify that $11 \times 30.33 = 333.6 \text{ SP} < 440 \text{ SP}$.
2. **Drop List Temporal Audit**:
   - Inspect `01_project_management_delivery_framework.md` Section 2.2 roadmap and verify that Drop Items 7, 10, 12, 14, 18, 19 (totaling 47 SP) belong to S1–S5.
3. **FEFO Algorithm Execution Trace**:
   - Execute a mental or coded dry-run of `FEFO_Pallet_Allocation` with demand = 65 bags and lots = [Lot A: 15, Lot B: 15, Lot C: 40]. Verify Step 4 condition `available_qty >= 25` returns no match.
4. **Tax Sequence Concurrency Proof**:
   - Inspect `02_system_architecture_high_level_design.md` lines 933–944 and trace two parallel executions entering with an empty month partition table.
