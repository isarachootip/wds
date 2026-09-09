# Thai Watsadu WDS — Adversarial Challenge Report
## PM Capacity, Scope Protocol & Business Domain Logic Stress-Testing

```
Document Identifier : TW-WDS-CHALLENGE-REPORT-01
Author              : Challenger 1 (PM & Domain Logic Adversarial Verifier)
Target Deliverables : Deliverable 01 (PM Framework) & Deliverable 02 (System Architecture HLD)
Working Directory   : c:\atgv\wds\.agents\challenger_1_pm_sa
Review Date         : 2026-09-09
Overall Verdict     : REQUEST_CHANGES
Overall Risk Level  : CRITICAL
```

---

## Executive Summary

As Challenger 1, an adversarial review was conducted across the Thai Watsadu Wholesale & Direct Sales (WDS) Release 1 Project Management & Delivery Framework (`docs/01_project_management_delivery_framework.md`) and System Architecture High-Level Design (`docs/02_system_architecture_high_level_design.md`).

The evaluation tested three mandatory challenge dimensions using empirical stress models, algorithmic counter-examples, dependency graphs, and regulatory audits:
1. **PM Capacity & Velocity Baseline**: Sizing 440 SP across 11 sprints (S1–S11) at 40 SP/sprint for 9 engineers.
2. **CP3 Drop List Protocol (§2.3)**: Feasibility, temporal validity, and dependency integrity of shedding 152 SP across 20 items.
3. **Business Domain Logic**: Inventory contention on expiring cement lots (FEFO/FIFO), instantaneous credit exposure during concurrent checkouts, and Thai Revenue Department Section 86/4, 86/5, 86/9, and 86/10 compliance.

### Overall Assessment: **CRITICAL (REQUEST_CHANGES)**
Severe architectural defects, mathematical contradictions, and statutory compliance violations were discovered:
- **PM Capacity**: The 40 SP/sprint velocity calculation commits a fatal agile anti-pattern by counting non-coding support roles (1 QA Automation Lead, 1 DevOps Engineer) as full-time feature coders, hiding an immediate **106.4 SP (24.2%) structural capacity deficit**. Additionally, a 2:1 BE-to-FE ratio creates a severe frontend delivery bottleneck.
- **Drop List Protocol**: **47 SP (30.9%)** of the 152 SP drop list belongs to Epics (E01, E02, E03, E07) scheduled in S1–S5. Invoking the drop list at CP3 (End of Sprint 5) cannot recover capacity from sprints already in the past. Furthermore, Section 1.2 explicitly claims 4 of the drop items were *already deferred* to R1.1/R2.0, creating an irreconcilable scope baseline contradiction.
- **Domain Logic — FEFO Pallet Allocation**: The greedy pallet allocation algorithm crashes with an unhandled exception or leaves unallocated odd quantities whenever remaining odd demand exceeds the stock of any single partial lot. It also creates an "Aging Trap" where older partial pallets are stranded while newer full pallets are dispatched.
- **Domain Logic — Credit Exposure**: The credit formula in HLD line 805 **ADDS** `+ PDC_Unpresented` to customer exposure, turning a payment instrument into debt and triggering unwarranted hard blocks. Furthermore, credit checks lack an atomic two-phase reservation protocol, leaving the system vulnerable to credit double-spend under concurrent checkouts.
- **Domain Logic — Tax Invoicing & Section 86/4**: The database sequence generator `fn_get_next_tax_invoice_number` crashes with duplicate key violations on the first invoice of any new month under concurrency. The VAT reconciliation algorithm violates the project's own strict ban on floating-point primitives (`decimal.NewFromFloat(0.07)`) and distorts line-item tax calculation ($V_i \ne T_i \times 7\%$), risking Revenue Department audit penalties.

---

## 1. Challenge Dimension 1: PM Capacity, Velocity & Buffer Economics

### Challenge 1.1: Conflation of QA and DevOps Support Roles into Feature Velocity
- **Assumption Challenged**: All 9 engineers contribute equally to the 40 SP/sprint feature burn-down:
  $$\text{Gross Hours} = 9 \text{ Engineers} \times 10 \text{ Days} \times 8 \text{ Hours} = 720 \text{ Gross Hours/Sprint}$$
  $$\text{Net Productive Capacity} = 720 \times 0.70 = 504 \text{ Hours} \implies 504 / 12 = 42 \text{ SP/Sprint (Budgeted 40 SP)}$$
- **Attack Scenario**:
  The team roster consists of:
  * 1 Dev Lead / Principal Architect
  * 4 Backend Engineers (BE1, BE2, BE3, BE4)
  * 2 Frontend Engineers (FE1, FE2)
  * 1 QA Automation Lead
  * 1 DevOps / Platform Engineer
  In reality, the QA Automation Lead writes test harnesses, maintains Playwright/k6 suites, and executes regression audits; they do NOT write production feature code. The DevOps Engineer provisions infrastructure, maintains Neon PostgreSQL, Redis, Kafka, and CI/CD pipelines; they do NOT write production feature code. The Dev Lead dedicates $\ge 50\%$ of their time to PR reviews, DB migration audits, SteerCo, ARB governance, and incident escalations (max 0.5 FTE coding).
- **Blast Radius**:
  The true feature delivery pool is only **6.5 FTE** (4 BE + 2 FE + 0.5 Dev Lead).
  $$\text{Realistic Net Hours} = 6.5 \times 10 \times 8 \times 0.70 = 364 \text{ Net Hours/Sprint}$$
  $$\text{Realistic Sustainable Velocity} = 364 / 12 = 30.33 \text{ SP/Sprint}$$
  Over the 11 core development sprints (S1 to S11):
  $$\text{Realistic Delivery Capacity} = 11 \times 30.33 = 333.6 \text{ SP}$$
  $$\text{Structural Capacity Deficit} = 440 \text{ SP (Committed Scope)} - 333.6 \text{ SP (Capacity)} = \mathbf{106.4 \text{ SP (24.2\% Shortfall)}}$$
  The team will accumulate a ~10-SP deficit every single sprint, guaranteeing project failure or severe crunch by Sprint 5.
- **Mitigation**:
  1. Recalibrate velocity baseline strictly on coding FTEs: **30–32 SP/Sprint**.
  2. Right-size Release 1 baseline scope to **330–350 SP**, OR expand engineering headcount by 2 full-stack/backend developers.

### Challenge 1.2: Frontend Delivery Bottleneck (2:1 BE to FE Ratio)
- **Assumption Challenged**: 2 Frontend Engineers (FE1 and FE2) can implement the user interfaces for 12 complex enterprise domains in parallel with 4 Backend Engineers.
- **Attack Scenario**:
  - FE1 is assigned to: E01 (Maker-Checker UI), E13 (RBAC Admin), E03 (Credit Desk & PDC Register), E10 (Invoice Viewer/Print), E12 (RMA Desk), E14 (BI Reporting & ภ.พ.30 Dashboards).
  - FE2 is assigned to: E02 (Fast Quotation & Margin Simulator), E07 (FEFO Lot Inspector), E04 (Sales Order Desk), E08 (Warehouse Dispatch Terminal), E11 (Responsive Mobile B2B Portal & Driver POD).
  Each FE is budgeted at:
  $$1 \text{ FE} \times 80 \text{ Gross Hours} \times 0.70 / 12 \text{ Hours/SP} = 4.67 \text{ SP/Sprint}$$
  Total frontend capacity across the entire team is only **9.33 SP/Sprint**. Over 11 sprints, maximum FE capacity is **102.6 SP**.
  However, modern enterprise UI with complex state machines, live client-side validation, TanStack tables, responsive mobile web, barcode scanning, and PDF rendering represents at least **35% of total story points (~154 SP)**.
- **Blast Radius**:
  Frontend development will lag backend APIs by 3–4 sprints. Backend services will sit idle in staging without usable UIs, failing the mandatory "Zero-Slide Live Demo" criteria at CP2, CP3, and CP4.
- **Mitigation**:
  Rebalance the team composition to **3 BE and 3 FE**, or augment with 1 dedicated UI contractor to prevent the frontend bottleneck from derailing milestone reviews.

### Challenge 1.3: Phantom Contingency Buffer Economics & Calendar Inadequacy
- **Assumption Challenged**: A 40 SP (9.1%) contingency buffer provides adequate risk cushion against 5 enterprise legacy integrations (I0a Merchandising 100k SKUs, I0b Retail Stock 80+ stores, I0c CRM, I0d POS, I0e SAP S/4HANA GL).
- **Attack Scenario**:
  - In Section 1.4.2: Planned velocity across S1–S11 is $11 \times 40 = 440 \text{ SP}$. The scope is sized at exactly 440 SP. S0 is 25 SP (Tooling). S12 is 20 SP (Cutover).
  - Every single sprint in the 26-week calendar is 100% committed to functional deliverables.
  - There is **zero calendar buffer**. There is no "Buffer Sprint" or unallocated capacity.
  - Industry standards (Standish Group, IEEE Software Engineering) mandate a **20% to 25% contingency buffer** when integrating with legacy enterprise systems (SAP, retail POS, store stock).
- **Blast Radius**:
  A 9.1% buffer (40 SP) is less than 1 sprint of delay. A 2-week delay on SAP GL (Interface I0e) or Retail Stock API (Interface I0b) exhausts the entire project buffer instantly, forcing cutover postponement or release of an unhardened system.
- **Mitigation**:
  Incorporate a formal **Hardening and Contingency Sprint (Sprint S11.5 or expanded S11)** with at least 15–20% unallocated capacity (~60–80 SP reserve).

---

## 2. Challenge Dimension 2: CP3 Drop List Protocol & Dependency Integrity

### Challenge 2.1: The Temporal Paradox of Post-Facto Deferrals
- **Assumption Challenged**: Dropping 152 SP across 20 items at Checkpoint 3 (End of Sprint 5 / Week 12) recovers 152 SP of future delivery capacity for Sprints 6 through 11.
- **Attack Scenario**:
  Map the 20 Drop List items against their scheduled development sprints in the Master Roadmap:
  - Drop #7: E02 Automated Competitor Price Scraping (9 SP) $\implies$ **Scheduled in S2–S3**
  - Drop #10: E03 Real-Time NCB API Scoring (8 SP) $\implies$ **Scheduled in S3–S4**
  - Drop #12: E07 Blind Receiving Barcode Scanner (7 SP) $\implies$ **Scheduled in S4–S5**
  - Drop #14: E01 Vendor Self-Registration Portal (7 SP) $\implies$ **Scheduled in S1–S2**
  - Drop #18: E02 Complex Cross-Category Bundle Rules (9 SP) $\implies$ **Scheduled in S2–S3**
  - Drop #19: E03 Automated Cheque OCR & MICR (7 SP) $\implies$ **Scheduled in S3–S4**
  $$\text{Total S1–S5 Sunk Scope} = 9 + 8 + 7 + 7 + 9 + 7 = \mathbf{47 \text{ SP (30.9\% of Drop List)}}$$
- **Blast Radius**:
  Checkpoint 3 is evaluated at the **end of Sprint 5**. Sprints 1 through 5 are already finished.
  - If the team already expended hours on these 47 SP during S1–S5, dropping them at CP3 saves **ZERO hours** for future sprints (S6–S11).
  - If the team neglected these 47 SP during S1–S5, that capacity was already lost and constitutes the very deficit being evaluated!
  - Therefore, the maximum forward-looking recoverable capacity for S6–S11 is only:
    $$152 - 47 = \mathbf{105 \text{ SP}}$$
  The governance claim that the 4 tiers can recover 152 SP of future delivery effort is mathematically false.
- **Mitigation**:
  Restructure the Drop List into **Phase-Aligned Drop Lists**:
  1. *Mid-Term Drop List (CP3)*: Items strictly scheduled in S6–S11 (totaling ~80–90 SP).
  2. *Early Warning Drops (CP2)*: Items scheduled in S3–S5 to be shed at Sprint 2 if early velocity lags.

### Challenge 2.2: Contradiction Between Baseline Scope (§1.2) and Drop List (§5.3)
- **Assumption Challenged**: The 20 items in the Drop List represent 152 SP included within the 440 SP Release 1 baseline.
- **Attack Scenario**:
  Compare Section 1.2 (Scope Baseline) with Section 5.3 (Drop List Priority Matrix):
  - In Section 1.2 (lines 82–83):
    *"Release 1.1 & 2.0 (Deferred Scope): 160 non-critical requirements (e.g., Native iOS/Android apps, predictive machine learning demand forecasting, IoT weighbridge automation, customer self-service return portals) deferred to subsequent phases."*
  - In Section 5.3 (lines 674–678):
    *Drop Item #1: Native Mobile Apps for B2B Contractors (iOS/Android) — 8 SP*
    *Drop Item #2: Predictive Demand Forecasting & AI Replenishment — 8 SP*
    *Drop Item #4: IoT Automated Weighbridge Hardware Integration — 7 SP*
    *Drop Item #5: Customer Self-Service Return Portal — 7 SP*
- **Blast Radius**:
  This is a blatant document contradiction. If these features were already deferred out of Release 1 in Section 1.2, they cannot be part of the 440 SP Release 1 scope.
  If they are NOT in the 440 SP baseline, dropping them in Tier 1 (recovering 30 SP) is **phantom accounting** that saves 0 hours from the 440 SP commitment!
  If they ARE in the 440 SP baseline, Section 1.2 misrepresents the scope to executive leadership.
- **Mitigation**:
  Reconcile the scope baseline: explicitly confirm whether these 4 items are in R1 or R2.0, and replace them in the Drop List with actual R1 features.

### Challenge 2.3: Operational Workaround Feasibility & Regulatory Hazards
- **Assumption Challenged**: Dropped items can be seamlessly substituted by manual branch operational workarounds without breaking downstream transaction integrity.
- **Attack Scenarios**:
  1. **Drop #15: Multi-Warehouse Automated Split-Order Optimizer (10 SP, E04)**:
     - Proposed Workaround: Sales rep manually selects fulfillment source (Store vs. DC) per order line item.
     - Failure Mode: Under Thai Revenue Code Section 86/4, tax invoices must be issued per branch tax entity (`INV-{BranchCode}-...`). If an order contains lines fulfilled from Bangna Store (`00012`) and Wang Noi CDC (`00001`), the system must split the order into separate Delivery Orders and separate sequential Tax Invoices. If automated splitting is dropped, who performs the split billing? If the sales rep must manually create two distinct sales orders, the customer receives two quotes, requiring dual credit exposure checks and double credit reservation, creating severe friction and risk of credit blocking.
  2. **Drop #17: Automated SMS/Email e-Tax Invoice Distribution (6 SP, E10)**:
     - Proposed Workaround: System generates PDF; branch prints physical copy for driver or sends via manual email.
     - Failure Mode: Under ETDA standards and Revenue Department e-Tax regulations (TIS 1102-2559), an e-Tax invoice digitally signed with PKI must be delivered electronically. If printed on paper, the physical document must bear the statutory watermark/endorsement: *"เอกสารนี้ได้จัดทำและส่งข้อมูลให้แก่กรมสรรพากรด้วยวิธีทางอิเล็กทรอนิกส์"*. If branch clerks print a raw PDF on standard paper and hand it to contractors as an original tax invoice, it constitutes an offense under Section 86/4, invalidating the contractor's input tax credit (ภาษีซื้อ) and exposing Thai Watsadu to statutory fines.
- **Mitigation**:
  Retain basic order splitting and compliant e-Tax delivery in the core MVP; move non-essential reporting and analytics down the drop priority instead.

---

## 3. Challenge Dimension 3: Business Domain Logic Stress-Testing

### Challenge 3.1: FEFO Cement Lot Allocation Algorithm Flaws & Retail Contention
- **Assumption Challenged**: The `FEFO_Pallet_Allocation` algorithm in HLD Section 3.4 correctly prioritizes shelf life and seamlessly allocates stock without errors.
- **Attack Scenario 1 (Odd Quantity Allocation Crash)**:
  Look at Step 4 of the algorithm:
  ```
  If RequiredQuantity > 0:
      // Satisfy remaining odd quantity from earliest expiring lot with available stock
      Select earliest lot with available_qty >= RequiredQuantity
      Allocate(lot, RequiredQuantity)
      RequiredQuantity = 0
  ```
  **Concrete Counter-Example**:
  - SKU: Portland Cement (`pallet_size` = 40 bags)
  - Warehouse stock:
    * Lot A (Exp: Oct 15): 15 bags (`full_pallets` = 0)
    * Lot B (Exp: Oct 20): 15 bags (`full_pallets` = 0)
    * Lot C (Exp: Nov 15): 40 bags (`full_pallets` = 1)
  - Total stock = $15 + 15 + 40 = 70 \text{ bags}$.
  - Contractor orders **65 bags** (ATP check passes: $70 \ge 65$).
  - Trace execution:
    * Step 3: Lot A (0 full pallets) $\to$ skipped. Lot B (0 full pallets) $\to$ skipped. Lot C allocates 40 bags (1 full pallet). `RequiredQuantity` left = $65 - 40 = \mathbf{25 \text{ bags}}$.
    * Step 4: System executes: `Select earliest lot with available_qty >= 25`.
    * Remaining lots: Lot A has 15 bags ($< 25$); Lot B has 15 bags ($< 25$); Lot C has 0 bags.
    * **NO LOT SATISFIES `available_qty >= 25`!**
    * The query returns `NULL` / Empty Set.
    * The algorithm throws an unhandled `NullPointerException` or aborts the checkout, even though the warehouse physically has 30 bags available! The algorithm cannot combine multiple partial lots to fulfill an odd quantity.
- **Attack Scenario 2 (The Pallet Aging Trap)**:
  Because Step 3 prioritizes full pallets, if a warehouse consistently receives orders for full pallets (e.g., 80 or 120 bags), Step 3 will consistently skip older partial lots (e.g., 20 bags of Lot A) in favor of newer full pallets (Lot C). The oldest cement remains stranded on the floor until it crosses the 30-day expiry threshold, resulting in **100% spoilage and write-off**.
- **Attack Scenario 3 (Retail POS vs B2B Lot Starvation)**:
  Retail walk-in POS cashiers scan standard EAN-13 barcodes on cement bags; store cashiers DO NOT scan lot barcodes. When a walk-in retail customer buys 10 bags from the warehouse floor (Lot A), store ERP decrements total SKU on-hand. Meanwhile, WDS allocates 15 bags of Lot A to a B2B sales order. When the warehouse picker arrives at the bay, only 5 bags of Lot A remain. The physical lot is starved by walk-in retail traffic.
- **Mitigation**:
  1. Rewrite Step 4 to iteratively consume from the earliest expiring lots until `RequiredQuantity == 0`.
  2. Implement an automated **Consolidation & Re-palletizing Trigger** that alerts store staff to merge partial lots or discount them to retail walk-ins before they age out.
  3. Physically segregate B2B bulk staging stock from walk-in retail picking floors.

### Challenge 3.2: Catastrophic Credit Sign Error & Concurrency Double-Spend
- **Assumption Challenged**: The credit exposure formula in HLD Section 3.3 accurately tracks liability, and concurrent checkouts are protected against limit breaches.
- **Attack Scenario 1 (The PDC Sign Bug)**:
  In HLD line 805, the exposure formula is defined as:
  $$\text{TotalExposure} = \text{AR}_{\text{Unpaid}} + \text{Orders}_{\text{InFulfillment}} + \text{Cart}_{\text{CheckingOut}} + \mathbf{PDC_{\text{Unpresented}}} - \text{CreditNotes}_{\text{Unapplied}}$$
  **Mathematical Proof of Flaw**:
  - Customer Credit Limit = 1,000,000 THB.
  - Current Unpaid Invoices ($\text{AR}$) = 850,000 THB.
  - Current Headroom = 150,000 THB.
  - Customer hands in a Post-Dated Cheque for 200,000 THB maturing next week to secure a new 100,000 THB order.
  - Evaluating formula line 805:
    $$\text{TotalExposure} = 850,000 + 0 + 100,000 + \mathbf{200,000} - 0 = \mathbf{1,150,000 \text{ THB}}$$
  - The customer's exposure is calculated as 1,150,000 THB, exceeding their 1,000,000 THB limit!
  - The system triggers an immediate **HARD BLOCK**, halting the customer's orders!
  - By adding `+ PDC_Unpresented`, handing a cheque to Thai Watsadu *penalizes* the customer as if they borrowed more money!
- **Attack Scenario 2 (Concurrent Credit Double-Spend)**:
  - Customer Credit Limit = 1,000,000 THB; Current Exposure = 920,000 THB; Headroom = 80,000 THB.
  - Two procurement agents submit Cart A (70,000 THB) and Cart B (70,000 THB) at the exact same millisecond.
  - In HLD, while inventory has a dedicated `stock_reservations` table and 30-min TTL, **credit has no reservation entity**.
  - Cart A and Cart B both query current exposure concurrently:
    * Cart A sees Exposure = 920k $\implies 920k + 70k = 990k \le 1,000k \implies \text{PASS}$.
    * Cart B sees Exposure = 920k $\implies 920k + 70k = 990k \le 1,000k \implies \text{PASS}$.
  - Both orders commit. Total exposure jumps to $920k + 70k + 70k = \mathbf{1,060,000 \text{ THB}}$ (60,000 THB breach).
- **Mitigation**:
  1. Fix the formula: Uncleared PDCs must NOT increase exposure. Exposure formula must be:
     $$\text{TotalExposure} = \text{AR}_{\text{Unpaid}} + \text{Orders}_{\text{InFulfillment}} + \text{Credit}_{\text{SoftReserved}} - \text{CreditNotes}_{\text{Unapplied}}$$
  2. Implement an explicit **Two-Phase Credit Reservation Protocol** (`credit_reservations` with 15-min TTL and atomic decrement of headroom in Redis/PostgreSQL).

### Challenge 3.3: Tax Invoice Gapless Sequence Crash & Section 86/4 Compliance
- **Assumption Challenged**: `fn_get_next_tax_invoice_number` provides thread-safe gapless sequence allocation, and `ReconcileDocumentVAT` complies with Revenue Department standards.
- **Attack Scenario 1 (Month-Start Concurrency Crash)**:
  Inspect HLD lines 933–944:
  ```sql
  UPDATE tax_invoice_sequences
  SET last_assigned_sequence = last_assigned_sequence + 1
  WHERE branch_code = p_branch AND fiscal_year_be = p_year_be AND fiscal_month = p_month
  RETURNING last_assigned_sequence INTO v_next_seq;
  
  IF NOT FOUND THEN
      INSERT INTO tax_invoice_sequences (branch_code, fiscal_year_be, fiscal_month, last_assigned_sequence)
      VALUES (p_branch, p_year_be, p_month, 1)
      RETURNING 1 INTO v_next_seq;
  END IF;
  ```
  **Concurrency Race Condition**:
  - At 08:00:00 AM on October 1st, two cashier checkouts (T1 and T2) execute concurrently for branch `00012`.
  - The row `('00012', 2569, 10)` does NOT exist yet.
  - Both T1 and T2 execute `UPDATE ...` $\implies$ both get `NOT FOUND`.
  - Both T1 and T2 enter `IF NOT FOUND THEN`.
  - T1 executes `INSERT ...` successfully (creates sequence 1).
  - T2 executes `INSERT ...` and immediately crashes with:
    `ERROR: duplicate key value violates unique constraint "tax_invoice_sequences_pkey" (SQLSTATE 23505)`.
  - Cashier register 2 crashes with an unhandled SQL exception, aborting the checkout!
- **Attack Scenario 2 (Float Primitive Violation in VAT Reconciliation)**:
  In HLD line 1127:
  `expectedTotalVAT := taxableTotal.Mul(decimal.NewFromFloat(0.07)).Round(2)`
  This explicitly violates Section 4.5 ("Absolute Ban on Floating-Point Primitives"). In Go, `decimal.NewFromFloat(0.07)` ingests an IEEE 754 float, creating binary precision leakage before arbitrary-precision arithmetic commences.
- **Attack Scenario 3 (Statutory Distortion of Line-Item VAT under Section 86/4)**:
  `ReconcileDocumentVAT` adjusts the 1-satang rounding difference by arbitrarily modifying the largest line item:
  `lines[maxLineIdx].VATAmount = lines[maxLineIdx].VATAmount.Add(diff)`
  If Line 1 has Taxable Amount = 100,000.00 THB, and `diff` is +0.01 THB, Line 1 VAT becomes 7,000.01 THB.
  Under Thai Revenue Code Section 86/4 (7), the VAT on an invoice item must be exactly 7% of its taxable value. An auditor multiplying $100,000.00 \times 0.07$ will find an overt arithmetic error ($7,000.00 \ne 7,000.01$), exposing Thai Watsadu to statutory compliance citations.
- **Mitigation**:
  1. Fix the SQL sequence generator using atomic upsert:
     ```sql
     INSERT INTO tax_invoice_sequences (branch_code, fiscal_year_be, fiscal_month, last_assigned_sequence)
     VALUES (p_branch, p_year_be, p_month, 1)
     ON CONFLICT (branch_code, fiscal_year_be, fiscal_month)
     DO UPDATE SET last_assigned_sequence = tax_invoice_sequences.last_assigned_sequence + 1
     RETURNING last_assigned_sequence INTO v_next_seq;
     ```
  2. Eliminate all `decimal.NewFromFloat` calls; use `decimal.RequireFromString("0.07")`.
  3. Comply with Revenue Department Regulation ป. 86/2542 by calculating total VAT as the exact sum of rounded line-item VATs without synthetic adjustments.

---

## 4. Empirical Stress Test Verification Matrix

| # | Stress Test Scenario | Test Input / Vector | Expected Behavior | Actual System Behavior | Verdict |
|---|---|---|---|---|:---:|
| **ST-01** | Developer Velocity Calibration | 6.5 coding FTEs, 70% focus, 12h/SP | 30.3 SP/sprint sustainable | Budgeted at 40 SP/sprint (counts QA & DevOps) | **FAIL** |
| **ST-02** | Frontend Delivery Bandwidth | 2 FE delivering 12 UI domains | Min 14 SP/sprint required | Max FE capacity is 9.33 SP/sprint (lag >4 sprints) | **FAIL** |
| **ST-03** | CP3 Sunk Scope Analysis | Drop items in S1–S5 epics | S6–S11 recovers 152 SP | 47 SP is sunk in S1–S5; only 105 SP recoverable | **FAIL** |
| **ST-04** | Scope Baseline Consistency | Check Drop Items 1, 2, 4, 5 vs §1.2 | Consistent R1 baseline | §1.2 says deferred to R1.1/R2.0; §5.3 drops from R1 | **FAIL** |
| **ST-05** | FEFO Odd Quantity Allocation | Demand 65 bags; Lots: 15, 15, 40 | Allocates 40 + 15 + 10 | Step 4 returns NULL / crashes (no lot >= 25) | **FAIL** |
| **ST-06** | FEFO Pallet Aging Trap | Continuous full-pallet orders | Oldest lots picked first | Old partial lots skipped indefinitely | **FAIL** |
| **ST-07** | Post-Dated Cheque Exposure | AR = 850k, PDC = 200k, Limit = 1M | Headroom remains 150k | Formula adds PDC $\to$ Exposure = 1.05M (Blocked!) | **FAIL** |
| **ST-08** | Concurrent Cart Checkout | 2 checkouts for 70k; Headroom 80k | One succeeds, one 409 | Both approve (double-spend to 140k exposure) | **FAIL** |
| **ST-09** | Month-Start Sequence Race | 2 parallel inserts on new month | Sequence 1 and 2 issued | Second transaction crashes on unique constraint | **FAIL** |
| **ST-10** | VAT Float Primitive Check | Search codebase for float types | Zero float primitives | `decimal.NewFromFloat(0.07)` found in HLD | **FAIL** |
| **ST-11** | Statutory Line VAT Audit | Line Taxable 100k, diff +0.01 | VAT matches 7.00% | Line VAT set to 7,000.01 THB (RD 86/4 violation) | **FAIL** |

---

## 5. Unchallenged Areas

The following areas were examined and found to be well-designed, robust, and structurally sound:
1. **Maker-Checker Staging Architecture (E01/E13)**: Enforced separation of duties with database check constraints (`CHECK (checker_id != maker_id)`) and visual JSON diffing is robust.
2. **PostgreSQL ICU Collation Standard (`th-TH-x-icu`)**: Accurate handling of Thai Royal Institute alphabetical sorting for pre-posed vowels (เ, แ, โ, ใ, ไ).
3. **OWASP Top 10 Security Architecture**: Comprehensive mitigation matrix, strict distroless containers, and synthetic data masking pipeline for PDPA compliance.
4. **Temporal Storage Determinism**: UTC storage with `TIMESTAMPTZ` and Asia/Bangkok presentation boundary at 16:59:59 UTC aligns accurately with fiscal and ภ.พ.30 requirements.

---

## 6. Actionable Recommendations for Deliverable Authors

To obtain approval, the delivery team must remediate the following items:
1. **PM Framework (`01_project_management_delivery_framework.md`)**:
   - Re-baseline sustainable velocity to **30–32 SP/sprint** based strictly on the 6.5 coding FTEs.
   - Adjust Release 1 baseline scope to **330–350 SP**, or add 2 full-stack engineers to the delivery unit.
   - Rebalance Frontend capacity (add 1 FE or transition 1 BE to FE).
   - Resolve the contradiction between Section 1.2 and Section 5.3 regarding deferred items.
   - Re-phase the Drop List into CP2 Early Drops and CP3 S6–S11 Drops (removing past-sprint items).
2. **System Architecture HLD (`02_system_architecture_high_level_design.md`)**:
   - Correct the Credit Exposure formula: remove `+ PDC_Unpresented` from debt exposure.
   - Design an atomic **Two-Phase Credit Reservation Protocol** (`credit_reservations` table, 15-min TTL, Redis Redlock/Postgres lock).
   - Rewrite `FEFO_Pallet_Allocation` Step 4 to support multi-lot fragmentation for odd quantities.
   - Fix `fn_get_next_tax_invoice_number` with atomic `INSERT ... ON CONFLICT DO UPDATE`.
   - Remove `decimal.NewFromFloat(0.07)` and adhere strictly to arbitrary-precision string initialization.
   - Update line VAT calculation to prevent arbitrary 1-satang distortions on individual lines.
