"""
Empirical Test Suite: Husky commit-msg Regex Linter
Pattern under test from docs/03 §4.1 (line 1244) & §4.2 (line 1273):
^\[FR-[A-Z0-9]{2,4}-[0-9]{3,4}\] (feat|fix|refactor|test|chore|docs)(\([a-z0-9-]+\))?: .+$
"""

import re
import sys

PATTERN = r"^\[FR-[A-Z0-9]{2,4}-[0-9]{3,4}\] (feat|fix|refactor|test|chore|docs)(\([a-z0-9-]+\))?: .+$"
regex = re.compile(PATTERN)

# 1. POSITIVE TEST CASES (Should match)
POSITIVE_TEST_CASES = [
    "[FR-02-004] feat(pricing): implement volume break tiered pricing engine",
    "[FR-07-012] fix(inventory): enforce FEFO sort order on cement batch allocation",
    "[FR-03-008] test(credit): add test cases for post-dated cheque clearing",
    "[FR-SYS-001] chore(ci): configure automated 5-gate pipeline in github actions",
    "[FR-10-001] docs(billing): document revenue department tax invoice sequence",
    "[FR-13-005] refactor(audit): optimize sha-256 hash chaining verification",
    "[FR-02-001] feat: add base pricing calculator without scope",
    "[FR-E02-001] feat(pricing): support epic code formatting",
    "[FR-BKK1-001] fix(store): handle regional branch override",
    "[FR-99-9999] test(perf): verify 4-digit requirement number"
]

# 2. NEGATIVE TEST CASES (Should reject)
NEGATIVE_TEST_CASES = [
    ("Missing requirement tag", "feat(pricing): add volume break engine"),
    ("Missing brackets around FR", "FR-02-004 feat(pricing): add volume break engine"),
    ("Lowercase 'fr' tag", "[fr-02-004] feat(pricing): add volume break engine"),
    ("Tag too short (1 char)", "[FR-2-004] feat(pricing): add volume break engine"),
    ("Tag too long (>4 chars)", "[FR-SYSTEM-001] chore(ci): configure pipeline"),
    ("Requirement number too short (<3 digits)", "[FR-02-04] feat(pricing): add volume break"),
    ("Requirement number too long (>4 digits)", "[FR-02-00004] feat(pricing): add volume break"),
    ("Disallowed type 'perf'", "[FR-02-004] perf(pricing): optimize tier lookup"),
    ("Disallowed type 'ci'", "[FR-SYS-001] ci: configure github actions"),
    ("Disallowed type 'style'", "[FR-01-001] style(ui): format table spacing"),
    ("Missing colon after type/scope", "[FR-02-004] feat(pricing) implement volume break"),
    ("Missing space after colon", "[FR-02-004] feat(pricing):implement volume break"),
    ("Empty commit message", ""),
    ("Only requirement tag", "[FR-02-004]"),
    ("Uppercase scope", "[FR-02-004] feat(PRICING): add volume break")
]

# 3. SPECIFICATION CONFLICTS / FALSE POSITIVES
# Rules from Section 4.1:
# Rule 4: "Subject: Imperative mood, present tense, lowercase start, no trailing period, maximum 72 characters."
SPEC_CONFLICT_CASES = [
    {
        "name": "Subject starts with UPPERCASE (Violates Rule 4: lowercase start)",
        "commit": "[FR-02-004] feat(pricing): Implement volume break tiered pricing",
        "expected_by_spec": False,
        "regex_result": bool(regex.match("[FR-02-004] feat(pricing): Implement volume break tiered pricing")),
        "flaw": "Regex uses '.+$' which allows uppercase initial characters."
    },
    {
        "name": "Subject ends with TRAILING PERIOD (Violates Rule 4: no trailing period)",
        "commit": "[FR-02-004] feat(pricing): implement volume break tiered pricing.",
        "expected_by_spec": False,
        "regex_result": bool(regex.match("[FR-02-004] feat(pricing): implement volume break tiered pricing.")),
        "flaw": "Regex uses '.+$' which permits trailing periods."
    },
    {
        "name": "Subject EXCEEDS 72 CHARACTERS (Violates Rule 4: maximum 72 characters)",
        "commit": "[FR-02-004] feat(pricing): implement volume break tiered pricing engine with dynamic zone freight calculations and floor price boundary checks",
        "length": len("[FR-02-004] feat(pricing): implement volume break tiered pricing engine with dynamic zone freight calculations and floor price boundary checks"),
        "expected_by_spec": False,
        "regex_result": bool(regex.match("[FR-02-004] feat(pricing): implement volume break tiered pricing engine with dynamic zone freight calculations and floor price boundary checks")),
        "flaw": "Regex has no length boundary constraint; commits over 72 characters are accepted."
    },
    {
        "name": "Scope contains UNDERSCORE (Standard snake_case module naming)",
        "commit": "[FR-02-004] feat(pricing_engine): implement volume break tiered pricing",
        "expected_by_spec": True,
        "regex_result": bool(regex.match("[FR-02-004] feat(pricing_engine): implement volume break tiered pricing")),
        "flaw": "Regex scope '[a-z0-9-]+' forbids underscores '_', rejecting snake_case scope names."
    },
    {
        "name": "Conventional Commit Breaking Change '!' indicator",
        "commit": "[FR-02-004] feat(pricing)!: drop deprecated legacy discount calculation endpoint",
        "expected_by_spec": True,
        "regex_result": bool(regex.match("[FR-02-004] feat(pricing)!: drop deprecated legacy discount calculation endpoint")),
        "flaw": "Regex does not accommodate the standard conventional commits '!' breaking change marker."
    }
]

def run_tests():
    passed_pos = 0
    for msg in POSITIVE_TEST_CASES:
        if regex.match(msg):
            passed_pos += 1
        else:
            print(f"FAILED POSITIVE: {msg}")

    passed_neg = 0
    for desc, msg in NEGATIVE_TEST_CASES:
        if not regex.match(msg):
            passed_neg += 1
        else:
            print(f"FAILED NEGATIVE (Accepted invalid): {desc} -> '{msg}'")

    print(f"Positive Test Cases Passed: {passed_pos}/{len(POSITIVE_TEST_CASES)}")
    print(f"Negative Test Cases Passed: {passed_neg}/{len(NEGATIVE_TEST_CASES)}")
    print("\n--- Specification Rule vs Regex Enforcement Analysis ---")
    for case in SPEC_CONFLICT_CASES:
        status = "BUG DETECTED (Mismatch)" if case["expected_by_spec"] != case["regex_result"] else "MATCH"
        print(f"[{status}] {case['name']}")
        print(f"  Commit: '{case['commit']}'")
        print(f"  Spec Expected: {case['expected_by_spec']} | Regex Result: {case['regex_result']}")
        print(f"  Vulnerability: {case['flaw']}\n")

if __name__ == "__main__":
    run_tests()
