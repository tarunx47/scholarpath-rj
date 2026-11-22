// Dependency-free tests for the eligibility engine. Run with: node src/lib/eligibility.test.js
import { evaluateRule, evaluateScheme } from "./eligibility.js";

let failures = 0;

function check(name, condition) {
  if (condition) {
    console.log("PASS " + name);
  } else {
    failures += 1;
    console.log("FAIL " + name);
  }
}

const eqRule = { id: "t-eq", field: "state", op: "eq", value: "Rajasthan", label: "State is Rajasthan", note: "test" };
const inRule = { id: "t-in", field: "category", op: "in", value: ["sc", "st"], label: "Category in list", note: "test" };
const lteRule = { id: "t-lte", field: "annual_family_income", op: "lte", value: 250000, label: "Income at or below limit", note: "test" };
const gteRule = { id: "t-gte", field: "annual_family_income", op: "gte", value: 1000, label: "Income at or above floor", note: "test" };

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
const schemeAllPass = { id: "s-pass", name: "Pass Scheme", eligibility: [eqRule, inRule, lteRule] };
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
  "scheme with no rules is possibly_eligible",
  evaluateScheme(schemeNoRules, profile).result === "possibly_eligible"
);

// Unsupported operator: must not reject the applicant
const unsupportedNeRule = { id: "t-ne", field: "state", op: "ne", value: "Rajasthan", label: "x", note: "test" };
const unsupportedAnyRule = { id: "t-any", field: "category", op: "any", value: ["a"], label: "x", note: "test" };
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
