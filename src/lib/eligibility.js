// Deterministic eligibility engine. Pure functions only: no AI, no network.
// Percentages and scores are intentionally not produced.
import { isCurrentlyVerified } from "./verification.js";

export const LABELS = {
  likely_eligible: "Likely eligible",
  possibly_eligible: "Possibly eligible",
  likely_not_eligible: "Likely not eligible",
  incomplete_unverified: "Eligibility not yet verified",
};

export const CAVEAT = "Based on verified criteria only. Other eligibility conditions may apply.";

function isMissing(value) {
  return value === undefined || value === null || value === "";
}

export function evaluateRule(rule, profile) {
  const value = profile ? profile[rule.field] : undefined;
  const rule_id = rule.id;
  const note = rule.note || null;
  const label = rule.label;

  if (isMissing(value)) {
    return {
      rule_id,
      status: "unknown",
      reason: "Needs: " + label + " (not provided)",
      missing: rule.field,
      note,
    };
  }

  let passed = false;
  switch (rule.op) {
    case "eq":
      passed = value === rule.value;
      break;
    case "in":
      passed = Array.isArray(rule.value) && rule.value.includes(value);
      break;
    case "lte":
    case "gte": {
      if (typeof value !== "number" || Number.isNaN(value)) {
        return {
          rule_id,
          status: "unknown",
          reason: "Needs: " + label + " (valid number required)",
          missing: rule.field,
          note,
        };
      }
      passed = rule.op === "lte" ? value <= rule.value : value >= rule.value;
      break;
    }
    default:
      return {
        rule_id,
        status: "unknown",
        reason: "Cannot check automatically: " + label,
        missing: null,
        note,
      };
  }

  return passed
    ? { rule_id, status: "pass", reason: "Met: " + label, missing: null, note }
    : { rule_id, status: "fail", reason: "Not met: " + label, missing: null, note };
}

export function evaluateScheme(scheme, profile) {
  const scheme_id = scheme.id;
  const scheme_name = scheme.name;
  const sourceRules = Array.isArray(scheme.eligibility) ? scheme.eligibility : [];

  const evaluated = sourceRules.map((rule) => {
    const r = evaluateRule(rule, profile || {});
    r.informational = rule.informational === true;
    r.current = isCurrentlyVerified(rule);
    r.counted = r.informational !== true;
    return { r, mandatory: rule.mandatory === true };
  });

  const applicable = evaluated.filter((e) => e.r.informational !== true);
  const current = applicable.filter((e) => e.r.current);
  const nonCurrent = applicable.filter((e) => !e.r.current);
  const non_mandatory_failures = current
    .filter((e) => !e.mandatory && e.r.status === "fail")
    .map((e) => e.r.rule_id);

  let result;
  if (current.length === 0) {
    result = "incomplete_unverified";
  } else if (current.some((e) => e.mandatory && e.r.status === "fail")) {
    result = "likely_not_eligible";
  } else if (current.some((e) => e.r.status === "unknown")) {
    result = "possibly_eligible";
  } else if (non_mandatory_failures.length > 0) {
    result = "possibly_eligible";
  } else if (nonCurrent.length > 0) {
    result = "possibly_eligible";
  } else if (scheme.eligibility_complete !== true) {
    result = "possibly_eligible";
  } else {
    result = "likely_eligible";
  }

  const missing_fields = [
    ...new Set(
      current.filter((e) => e.r.status === "unknown" && e.r.missing).map((e) => e.r.missing)
    ),
  ];

  const evaluatedResults = evaluated.map((e) => e.r);
  const reasons =
    sourceRules.length === 0
      ? ["No verified eligibility criteria are available for this scheme."]
      : evaluated.filter((e) => e.r.counted).map((e) => e.r.reason);

  return {
    scheme_id,
    scheme_name,
    result,
    label: LABELS[result],
    rules: evaluatedResults,
    reasons,
    missing_fields,
    non_mandatory_failures,
    caveat: result === "possibly_eligible" ? CAVEAT : null,
  };
}

export function evaluateAll(schemes, profile) {
  return schemes.map((s) => evaluateScheme(s, profile));
}
