// Dependency-free tests for scheme data shape. Run with: node src/data/schemes.test.js
import { readFileSync } from "node:fs";
import { ALLOWED_STATUSES } from "../lib/verification.js";

let failures = 0;

function check(name, condition) {
  if (condition) {
    console.log("PASS " + name);
  } else {
    failures += 1;
    console.log("FAIL " + name);
  }
}

const schemes = JSON.parse(readFileSync(new URL("./schemes.json", import.meta.url), "utf8"));
check("schemes.json is a non-empty array", Array.isArray(schemes) && schemes.length > 0);

const REQUIRED_RULE_PROVENANCE_KEYS = ["source_url", "source_page", "source_date", "academic_year", "verification_status"];
const EXISTING_RULE_KEYS = ["id", "field", "op", "value", "label", "note"];

for (const scheme of schemes) {
  const id = scheme.id;

  check(`${id}: required_documents is an array`, Array.isArray(scheme.required_documents));
  check(`${id}: required_documents is empty`, Array.isArray(scheme.required_documents) && scheme.required_documents.length === 0);
  check(`${id}: application_steps is an array`, Array.isArray(scheme.application_steps));
  check(`${id}: application_steps is empty`, Array.isArray(scheme.application_steps) && scheme.application_steps.length === 0);

  check(
    `${id}: scheme verification_status is allowed`,
    ALLOWED_STATUSES.includes(scheme.verification_status)
  );
  check(
    `${id}: scheme verification_status is not unverified-sample`,
    scheme.verification_status !== "unverified-sample"
  );

  const rules = Array.isArray(scheme.eligibility) ? scheme.eligibility : [];
  check(`${id}: eligibility is an array`, Array.isArray(scheme.eligibility));

  for (const rule of rules) {
    const ruleId = `${id}/${rule.id}`;

    for (const key of REQUIRED_RULE_PROVENANCE_KEYS) {
      check(`${ruleId}: rule has key ${key}`, key in rule);
    }

    check(
      `${ruleId}: rule verification_status is allowed`,
      ALLOWED_STATUSES.includes(rule.verification_status)
    );
    check(
      `${ruleId}: rule verification_status is not unverified-sample`,
      rule.verification_status !== "unverified-sample"
    );

    for (const key of EXISTING_RULE_KEYS) {
      check(`${ruleId}: rule keeps existing field ${key}`, key in rule);
    }
  }
}

if (failures > 0) {
  process.exitCode = 1;
}
