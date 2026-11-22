// Dependency-free tests for the eligibility engine. Run with: node src/lib/eligibility.test.js
import { evaluateRule, evaluateScheme, evaluateAll, LABELS, CAVEAT } from "./eligibility.js";

let failures = 0;

function check(name, condition) {
  if (condition) {
    console.log("PASS " + name);
  } else {
    failures += 1;
    console.log("FAIL " + name);
  }
}

// Shared fixture fields: every rule used for pass/fail/unknown is a current, mandatory, non-informational rule.
const fixture = {
  verification_status: "verified-2026-27",
  academic_year: "2026-27",
  jurisdiction: "Rajasthan",
  issuing_authority: "test fixture",
  source_url: "https://example.test/fixture",
  source_page: "p1",
  source_date: "2026-01-01",
  mandatory: true,
  informational: false,
};

function variant(rule, overrides) {
  return { ...rule, ...overrides };
}

const eqRule = { ...fixture, id: "t-eq", field: "state", op: "eq", value: "Rajasthan", label: "State is Rajasthan", note: "test" };
const inRule = { ...fixture, id: "t-in", field: "category", op: "in", value: ["sc", "st"], label: "Category in list", note: "test" };
const lteRule = { ...fixture, id: "t-lte", field: "annual_family_income", op: "lte", value: 250000, label: "Income at or below limit", note: "test" };
const gteRule = { ...fixture, id: "t-gte", field: "annual_family_income", op: "gte", value: 1000, label: "Income at or above floor", note: "test" };

const profile = { state: "Rajasthan", category: "sc", annual_family_income: 100000 };

// Rule pass
check("rule pass eq", evaluateRule(eqRule, profile).status === "pass");
check("rule pass in", evaluateRule(inRule, profile).status === "pass");
check("rule pass lte", evaluateRule(lteRule, profile).status === "pass");
check("rule pass gte", evaluateRule(gteRule, profile).status === "pass");

// Rule fail
check("rule fail eq", evaluateRule(eqRule, { state: "Goa" }).status === "fail");
check("rule fail lte", evaluateRule(lteRule, { annual_family_income: 300000 }).status === "fail");

// Rule unknown
const missingResult = evaluateRule(eqRule, {});
check("rule unknown missing field", missingResult.status === "unknown" && missingResult.missing === "state");
check("rule unknown non-numeric income for lte", evaluateRule(lteRule, { annual_family_income: "abc" }).status === "unknown");

// Scheme-level results
const schemeAllPass = { id: "s-pass", name: "Pass Scheme", eligibility: [eqRule, inRule, lteRule], eligibility_complete: true };
const schemeFail = { id: "s-fail", name: "Fail Scheme", eligibility: [eqRule, lteRule] };
const schemeUnknown = { id: "s-unknown", name: "Unknown Scheme", eligibility: [eqRule, lteRule] };
const schemeNoRules = { id: "s-none", name: "No Rules Scheme", eligibility: [] };

check("scheme likely_eligible", evaluateScheme(schemeAllPass, profile).result === "likely_eligible");
check(
  "scheme likely_not_eligible",
  evaluateScheme(schemeFail, { state: "Goa", annual_family_income: 900000 }).result === "likely_not_eligible"
);
const unknownResult = evaluateScheme(schemeUnknown, { annual_family_income: 100000 });
check("scheme possibly_eligible", unknownResult.result === "possibly_eligible");
check("scheme missing_fields lists state", unknownResult.missing_fields.includes("state"));
check(
  "scheme with no rules is incomplete_unverified",
  evaluateScheme(schemeNoRules, profile).result === "incomplete_unverified"
);

// E1: no eligibility array at all
check(
  "E1 empty eligibility is incomplete_unverified",
  evaluateScheme({ id: "s-e1", name: "E1", eligibility: [] }, profile).result === "incomplete_unverified" &&
    evaluateScheme({ id: "s-e1b", name: "E1b" }, profile).result === "incomplete_unverified"
);

// E2: every rule informational, any status
const e2Scheme = {
  id: "s-e2",
  name: "E2",
  eligibility: [
    variant(eqRule, { informational: true }),
    variant(lteRule, { informational: true }),
  ],
};
check(
  "E2 all informational is incomplete_unverified",
  evaluateScheme(e2Scheme, { state: "Goa", annual_family_income: 900000 }).result === "incomplete_unverified"
);

// E3: only a failing informational historical rule
const e3Scheme = {
  id: "s-e3",
  name: "E3",
  eligibility: [
    variant(eqRule, { informational: true, verification_status: "historical", academic_year: "2025-26" }),
  ],
};
check(
  "E3 only failing informational historical is incomplete_unverified",
  evaluateScheme(e3Scheme, { state: "Goa" }).result === "incomplete_unverified"
);

// E4: current mandatory fail plus applicable unverified passing rule
const e4Scheme = {
  id: "s-e4",
  name: "E4",
  eligibility: [eqRule, variant(inRule, { verification_status: "proposed" })],
};
check(
  "E4 current mandatory fail is likely_not_eligible",
  evaluateScheme(e4Scheme, { state: "Goa", category: "sc" }).result === "likely_not_eligible"
);

// E5: failing applicable unverified rule plus passing current rule
const e5Scheme = {
  id: "s-e5",
  name: "E5",
  eligibility: [variant(eqRule, { verification_status: "unverified", academic_year: "2025-26" }), inRule],
};
const e5Result = evaluateScheme(e5Scheme, { state: "Goa", category: "sc" });
check("E5 failing unverified rule is possibly_eligible", e5Result.result === "possibly_eligible");
check("E5 failing unverified rule is not likely_not_eligible", e5Result.result !== "likely_not_eligible");

// E6: failing applicable proposed rule plus passing current rule
const e6Scheme = {
  id: "s-e6",
  name: "E6",
  eligibility: [variant(eqRule, { verification_status: "proposed" }), inRule],
};
check(
  "E6 failing proposed rule is possibly_eligible",
  evaluateScheme(e6Scheme, { state: "Goa", category: "sc" }).result === "possibly_eligible"
);

// E7: current non-mandatory fail, other current rules pass, eligibility_complete true
const e7Scheme = {
  id: "s-e7",
  name: "E7",
  eligibility: [eqRule, inRule, variant(lteRule, { mandatory: false })],
  eligibility_complete: true,
};
const e7Result = evaluateScheme(e7Scheme, { state: "Rajasthan", category: "sc", annual_family_income: 300000 });
check("E7 non-mandatory current fail is possibly_eligible", e7Result.result === "possibly_eligible");
check("E7 non_mandatory_failures recorded", e7Result.non_mandatory_failures.length > 0);

// E8: current passing rule plus applicable unverified rule
const e8Scheme = {
  id: "s-e8",
  name: "E8",
  eligibility: [eqRule, variant(lteRule, { verification_status: "proposed" })],
};
const e8Result = evaluateScheme(e8Scheme, profile);
check("E8 current pass plus unverified is possibly_eligible", e8Result.result === "possibly_eligible");
check("E8 caveat is CAVEAT", e8Result.caveat === CAVEAT);

// E9: as E8, but the unverified rule is informational and eligibility_complete is true
const e9Scheme = {
  id: "s-e9",
  name: "E9",
  eligibility: [eqRule, variant(lteRule, { verification_status: "proposed", informational: true })],
  eligibility_complete: true,
};
const e9Result = evaluateScheme(e9Scheme, profile);
check("E9 informational unverified leaves likely_eligible", e9Result.result === "likely_eligible");
check("E9 caveat is null", e9Result.caveat === null);

// E10: all applicable current rules pass, eligibility_complete true
const e10Result = evaluateScheme(schemeAllPass, profile);
check("E10 all current pass and complete is likely_eligible", e10Result.result === "likely_eligible");
check("E10 caveat is null", e10Result.caveat === null);

// E11: three passing current rules, no eligibility_complete
const e11Scheme = { id: "s-e11", name: "E11", eligibility: [eqRule, inRule, lteRule] };
check(
  "E11 without eligibility_complete is not likely_eligible",
  evaluateScheme(e11Scheme, profile).result !== "likely_eligible"
);

// E12: current rule whose profile field is absent
const e12Result = evaluateScheme({ id: "s-e12", name: "E12", eligibility: [eqRule, lteRule] }, { state: "Rajasthan" });
check("E12 absent current field is possibly_eligible", e12Result.result === "possibly_eligible");
check("E12 absent field listed in missing_fields", e12Result.missing_fields.includes("annual_family_income"));

// E13: informational rule is shown with counted false and its field never appears in missing_fields
const e13Result = evaluateScheme(
  { id: "s-e13", name: "E13", eligibility: [eqRule, variant(inRule, { informational: true })] },
  { state: "Rajasthan" }
);
const e13Info = e13Result.rules.find((r) => r.rule_id === "t-in");
check("E13 informational rule appears in rules", e13Info !== undefined);
check("E13 informational rule has counted false", e13Info !== undefined && e13Info.counted === false);
check("E13 informational field not in missing_fields", !e13Result.missing_fields.includes("category"));

// E14: labels
check("E14 LABELS.possibly_eligible", LABELS.possibly_eligible === "Possibly eligible");
check("E14 LABELS.incomplete_unverified", LABELS.incomplete_unverified === "Eligibility not yet verified");

// E15: evaluateAll results carry label, reasons and missing_fields
const e15Results = evaluateAll([schemeAllPass, schemeUnknown, schemeNoRules], profile);
check(
  "E15 evaluateAll results have label, reasons and missing_fields",
  e15Results.every((r) => typeof r.label === "string" && Array.isArray(r.reasons) && Array.isArray(r.missing_fields))
);

// E16: caveat is non-null only when result is possibly_eligible
const e16Results = evaluateAll(
  [schemeAllPass, schemeFail, schemeUnknown, schemeNoRules, e5Scheme, e8Scheme, e9Scheme, e11Scheme, e7Scheme],
  { state: "Goa", category: "sc", annual_family_income: 300000 }
);
check(
  "E16 caveat non-null only for possibly_eligible",
  e16Results.every((r) => (r.caveat !== null) === (r.result === "possibly_eligible"))
);

// E17: verified for 2026-27 status but academic year 2025-26 is not current
const e17Scheme = {
  id: "s-e17",
  name: "E17",
  eligibility: [variant(eqRule, { academic_year: "2025-26" })],
};
check(
  "E17 wrong academic year is incomplete_unverified",
  evaluateScheme(e17Scheme, { state: "Rajasthan" }).result === "incomplete_unverified"
);

// Unsupported operator: must not reject the applicant
const unsupportedNeRule = { ...fixture, id: "t-ne", field: "state", op: "ne", value: "Rajasthan", label: "x", note: "test" };
const unsupportedAnyRule = { ...fixture, id: "t-any", field: "category", op: "any", value: ["a"], label: "x", note: "test" };
const unsupportedNeResult = evaluateRule(unsupportedNeRule, { state: "Rajasthan" });
check("rule unsupported op is unknown", unsupportedNeResult.status === "unknown");
check(
  "unsupported op reason says cannot check automatically",
  unsupportedNeResult.reason.includes("Cannot check automatically: x")
);
const unsupportedNeScheme = { id: "s-ne", name: "Unsupported ne Scheme", eligibility: [unsupportedNeRule] };
const unsupportedNeSchemeResult = evaluateScheme(unsupportedNeScheme, { state: "Rajasthan" });
check("scheme unsupported ne is possibly_eligible", unsupportedNeSchemeResult.result === "possibly_eligible");
check(
  "scheme unsupported ne reasons contain cannot check automatically",
  unsupportedNeSchemeResult.reasons.includes("Cannot check automatically: x")
);
const unsupportedAnyScheme = { id: "s-any", name: "Unsupported any Scheme", eligibility: [unsupportedAnyRule] };
check(
  "scheme unsupported any is possibly_eligible",
  evaluateScheme(unsupportedAnyScheme, { category: "sc" }).result === "possibly_eligible"
);
const unsupportedWithFailScheme = { id: "s-ne-fail", name: "Unsupported plus Fail Scheme", eligibility: [unsupportedNeRule, eqRule] };
check(
  "unsupported op plus real failure is likely_not_eligible",
  evaluateScheme(unsupportedWithFailScheme, { state: "Goa" }).result === "likely_not_eligible"
);

if (failures > 0) {
  process.exitCode = 1;
}
