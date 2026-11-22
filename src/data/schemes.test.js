// Dependency-free tests for scheme data shape. Run with: node src/data/schemes.test.js
import { readFileSync } from "node:fs";
import { ALLOWED_STATUSES } from "../lib/verification.js";
import { CATEGORY_OPTIONS } from "../lib/profileOptions.js";

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
const CURRENT_YEAR = "2026-27";
const CURRENT_STATUS = "verified-2026-27";
const SCHEME_JURISDICTIONS = [null, "Rajasthan", "Central"];

const isPresent = (v) => v !== null && v !== undefined;
const isPlainObject = (v) => typeof v === "object" && v !== null && !Array.isArray(v);
const asArray = (v) => (Array.isArray(v) ? v : []);
const hasProvenance = (item) =>
  isPresent(item.source_url) && isPresent(item.source_page) && isPresent(item.source_date);

for (const scheme of schemes) {
  const id = scheme.id;
  const rules = asArray(scheme.eligibility);
  const documents = asArray(scheme.required_documents);
  const steps = asArray(scheme.application_steps);
  const benefits = asArray(scheme.benefits);
  const provenance = scheme.identity_provenance;

  check(`${id}: required_documents is an array`, Array.isArray(scheme.required_documents));
  check(`${id}: required_documents is empty`, Array.isArray(scheme.required_documents) && scheme.required_documents.length === 0);
  check(`${id}: application_steps is an array`, Array.isArray(scheme.application_steps));
  check(`${id}: application_steps is empty`, Array.isArray(scheme.application_steps) && scheme.application_steps.length === 0);

  check(`${id}: scheme has no verification_status key`, ("verification_status" in scheme) === false);

  check(`${id}: identity_provenance is an object`, isPlainObject(provenance));
  check(
    `${id}: identity_provenance verification_status is allowed`,
    isPlainObject(provenance) && ALLOWED_STATUSES.includes(provenance.verification_status)
  );
  check(
    `${id}: scheme_jurisdiction is null, Rajasthan or Central`,
    SCHEME_JURISDICTIONS.includes(scheme.scheme_jurisdiction)
  );
  check(`${id}: eligibility_complete is a boolean`, typeof scheme.eligibility_complete === "boolean");

  check(`${id}: eligibility is an array`, Array.isArray(scheme.eligibility));

  // Ids must be unique within the scheme across rules, documents, steps and benefits.
  const seenIds = new Set();
  const allIds = [
    ...rules.map((r) => r.id),
    ...documents.map((d) => d.id),
    ...steps.map((s) => s.id),
    ...benefits.map((b) => b.id),
  ];
  for (const itemId of allIds) {
    check(`${id}/${itemId}: id is unique within scheme`, !seenIds.has(itemId));
    seenIds.add(itemId);
  }

  // Documents, steps and benefits are objects with a non-empty string id.
  for (const group of [documents, steps, benefits]) {
    for (const item of group) {
      check(
        `${id}: item is an object with a non-empty string id`,
        isPlainObject(item) && typeof item.id === "string" && item.id.length > 0
      );
    }
  }

  // Every item (rule, document, step, benefit, identity_provenance) carries a verification_status key.
  const items = [...rules, ...documents, ...steps, ...benefits, ...(isPlainObject(provenance) ? [provenance] : [])];
  for (const item of items) {
    const itemId = `${id}/${item.id ?? "identity_provenance"}`;
    check(`${itemId}: item has key verification_status`, "verification_status" in item);
    if (item.verification_status === CURRENT_STATUS) {
      check(
        `${itemId}: verified-2026-27 item has source_url, source_page, source_date and academic_year 2026-27`,
        hasProvenance(item) && item.academic_year === CURRENT_YEAR
      );
    }
    if (item.verification_status === "historical") {
      check(
        `${itemId}: historical item has a non-null academic_year`,
        isPresent(item.academic_year)
      );
    }
  }

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

    check(`${ruleId}: rule mandatory is a boolean`, typeof rule.mandatory === "boolean");
    check(`${ruleId}: rule informational is a boolean`, typeof rule.informational === "boolean");

    if (rule.field === "category") {
      const values = Array.isArray(rule.value) ? rule.value : [rule.value];
      check(
        `${ruleId}: every category value is in CATEGORY_OPTIONS`,
        values.every((v) => CATEGORY_OPTIONS.includes(v))
      );
    }
  }

  if (scheme.eligibility_complete === true) {
    const review = scheme.eligibility_review;
    check(
      `${id}: eligibility_review is an object with provenance and review_note`,
      isPlainObject(review) &&
        isPresent(review.source_url) &&
        isPresent(review.source_page) &&
        isPresent(review.source_date) &&
        isPresent(review.review_note)
    );
    check(
      `${id}: eligibility_review is ${CURRENT_YEAR} and ${CURRENT_STATUS}`,
      isPlainObject(review) && review.academic_year === CURRENT_YEAR && review.verification_status === CURRENT_STATUS
    );

    const applicable = rules.filter((r) => r.informational !== true);
    const isCurrent = (r) => r.verification_status === CURRENT_STATUS && r.academic_year === CURRENT_YEAR;

    check(`${id}: at least one applicable current rule exists`, applicable.some(isCurrent));
    check(`${id}: no applicable non-current rule exists`, applicable.every(isCurrent));

    for (const rule of applicable.filter(isCurrent)) {
      check(
        `${id}/${rule.id}: applicable current rule has full provenance, jurisdiction and issuing_authority`,
        hasProvenance(rule) &&
          isPresent(rule.jurisdiction) &&
          isPresent(rule.issuing_authority) &&
          rule.academic_year === CURRENT_YEAR &&
          rule.verification_status === CURRENT_STATUS
      );
    }
  }

  if (id.startsWith("sample-scheme")) {
    check(`${id}: placeholder eligibility is an empty array`, Array.isArray(scheme.eligibility) && scheme.eligibility.length === 0);
    check(`${id}: placeholder official_url is null`, scheme.official_url === null);
  }
}

if (failures > 0) {
  process.exitCode = 1;
}
