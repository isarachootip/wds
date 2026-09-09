"""
Empirical API Contract Audit: OpenAPI 3.0 & Data Contract Verification
Evaluates endpoints in docs/03 §3:
1. Dynamic Pricing Calculation (POST /api/v1/pricing/calculate)
2. Order Submission & Validation (POST /api/v1/orders)
3. Real-Time Credit Check (POST /api/v1/credit/check)
4. Stock Reservation / ATP Commitment (POST /api/v1/inventory/reserve)
5. Tax Invoice Generation & Posting (POST /api/v1/tax-invoices/post)
"""

API_ENDPOINTS_AUDIT = [
    {
        "endpoint": "POST /api/v1/pricing/calculate",
        "doc_section": "docs/03 §3.2",
        "findings": [
            {
                "category": "Data Type Inconsistency",
                "issue": "Payload uses unquoted JSON numbers: 'deliveryDistanceKm': 28.50 and 'quantity': 250.0000.",
                "risk": "Violates §2.2 'Absolute Ban on Floats'. Standard JSON parsers deserialize unquoted numbers to IEEE 754 float64.",
                "severity": "HIGH",
                "remedy": "Enforce string decimals: '28.50' and '250.0000'."
            },
            {
                "category": "Missing Business Field",
                "issue": "Missing 'manualDiscountPerUnit' or discretionary discount request field in PricingLineInput DTO.",
                "risk": "Sales Rep cannot request floor-checked discretionary discounts via API despite engine support in §4.6.1 line 1416.",
                "severity": "MEDIUM",
                "remedy": "Add optional 'manualDiscountPerUnitThb': string to item schema."
            },
            {
                "category": "Missing Schema Constraints & Error Models",
                "issue": "No OpenAPI 3.0 schema component definition; no RFC 7807 error models defined for invalid postal code/distance or unknown SKU.",
                "severity": "HIGH",
                "remedy": "Provide complete OpenAPI component schemas with regex, minimum, maximum, and RFC 7807 400/422 responses."
            }
        ]
    },
    {
        "endpoint": "POST /api/v1/orders",
        "doc_section": "docs/03 §3.3",
        "findings": [
            {
                "category": "Missing Governance Field",
                "issue": "Missing 'makerCheckerRequestId' / 'floorOverrideApprover' link in order submission.",
                "risk": "When order has items below floor price (requires_floor_override = true in DDL), the API payload lacks an approval ID field to link the approved request.",
                "severity": "HIGH",
                "remedy": "Add optional 'floorOverrideRequestId': UUID to request schema."
            },
            {
                "category": "Data Type Inconsistency",
                "issue": "Payload mixes string amounts ('expectedTotalPayableThb': '61311.00', 'unitNetPriceThb': '155.0000') with raw float numbers ('quantity': 250.0000).",
                "risk": "Precision loss for fractional quantities (e.g. 14.2500 m3 ready-mix concrete).",
                "severity": "HIGH",
                "remedy": "Mandate string representations for all inventory quantities."
            },
            {
                "category": "Missing Error Models",
                "issue": "No schema for 409 Conflict (reservation expired) or 422 Unprocessable Entity (credit limit breached, unapproved floor breach).",
                "severity": "HIGH",
                "remedy": "Define RFC 7807 schemas for HTTP 400, 409, 422, 500."
            }
        ]
    },
    {
        "endpoint": "POST /api/v1/credit/check",
        "doc_section": "docs/03 §3.4",
        "findings": [
            {
                "category": "Data Type Inconsistency",
                "issue": "Response returns unquoted float: 'utilizationPercentage': 42.26.",
                "risk": "Floating-point representation in financial risk response.",
                "severity": "LOW",
                "remedy": "Format as string '42.26' or integer basis points (4226 bps)."
            },
            {
                "category": "Missing Business Field",
                "issue": "Response returns 'temporaryCreditLimitThb': '0.00' without temporary limit expiry timestamp ('tempLimitExpiry').",
                "risk": "Client cannot determine if temporary limit is actively expiring or valid.",
                "severity": "MEDIUM",
                "remedy": "Add 'tempLimitExpiry': ISO-8601 string."
            }
        ]
    },
    {
        "endpoint": "POST /api/v1/inventory/reserve",
        "doc_section": "docs/03 §3.5",
        "findings": [
            {
                "category": "Contract Ambiguity",
                "issue": "Contract does not specify behavior or response schema for partial allocation failure.",
                "risk": "If 1 of 5 items cannot be reserved, does API reject atomically (409) or return partial reservation? Schema only shows 200 OK with fullyAllocated = true.",
                "severity": "HIGH",
                "remedy": "Define atomic rollback policy and 409 InsufficientStockProblem response schema."
            },
            {
                "category": "Data Type Inconsistency",
                "issue": "Request uses unquoted number 'requestedQuantity': 250.0000.",
                "severity": "MEDIUM",
                "remedy": "Use string decimal."
            }
        ]
    },
    {
        "endpoint": "POST /api/v1/tax-invoices/post",
        "doc_section": "docs/03 §3.6",
        "findings": [
            {
                "category": "Missing Regulatory Business Fields",
                "issue": "Request lacks 'invoiceType' (Full Sec 86/4 vs Abbreviated Sec 86/6) and 'buyerBranchCode' / 'customerPoNumber' overrides.",
                "risk": "Enterprise B2B invoicing requires explicit project PO numbers and billing branch code targeting.",
                "severity": "HIGH",
                "remedy": "Add optional 'buyerBranchCode': string (5 digits), 'customerPoNumber': string, and 'invoiceType': enum."
            },
            {
                "category": "Missing Error Models",
                "issue": "Missing error models for 409 Conflict (Order already invoiced), 422 Unprocessable (Order not delivered), 502 Bad Gateway (PKI signing failure).",
                "severity": "HIGH",
                "remedy": "Provide complete RFC 7807 error definitions."
            }
        ]
    }
]

def print_contract_audit():
    print("================================================================================")
    print("EMPIRICAL API CONTRACT & OPENAPI SCHEMA AUDIT SUMMARY")
    print("================================================================================\n")
    for item in API_ENDPOINTS_AUDIT:
        print(f"Endpoint: {item['endpoint']} ({item['doc_section']})")
        for finding in item['findings']:
            print(f"  [{finding['severity']}] {finding['category']}: {finding['issue']}")
            print(f"    Remedy: {finding['remedy']}")
        print()

if __name__ == "__main__":
    print_contract_audit()
