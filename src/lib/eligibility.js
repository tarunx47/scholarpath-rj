// Deterministic eligibility engine. Pure functions only: no AI, no network.
// Percentages and scores are intentionally not produced.

export const LABELS = {
  likely_eligible: "Likely eligible",
  possibly_eligible: "Possibly eligible (missing information)",
  likely_not_eligible: "Likely not eligible",
};

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

  if (!Array.isArray(scheme.eligibility) || scheme.eligibility.length === 0) {
    return {
      scheme_id,
      scheme_name,
      result: "possibly_eligible",
      label: LABELS.possibly_eligible,
      rules: [],
      reasons: ["No structured eligibility rules are available for this scheme."],
      missing_fields: [],
    };
  }

  const rules = scheme.eligibility.map((rule) => evaluateRule(rule, profile || {}));
  const reasons = rules.map((r) => r.reason);
  const missing_fields = [
    ...new Set(rules.filter((r) => r.missing).map((r) => r.missing)),
  ];

  let result;
  if (rules.some((r) => r.status === "fail")) {
    result = "likely_not_eligible";
  } else if (rules.some((r) => r.status === "unknown")) {
    result = "possibly_eligible";
  } else {
    result = "likely_eligible";
  }

  return {
    scheme_id,
    scheme_name,
    result,
    label: LABELS[result],
    rules,
    reasons,
    missing_fields,
  };
}

export function evaluateAll(schemes, profile) {
  return schemes.map((s) => evaluateScheme(s, profile));
}
