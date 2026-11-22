// Dependency-free tests for verification-status handling. Run with: node src/lib/verification.test.js
import { getVerificationInfo, ALLOWED_STATUSES } from "./verification.js";

let failures = 0;

function check(name, condition) {
  if (condition) {
    console.log("PASS " + name);
  } else {
    failures += 1;
    console.log("FAIL " + name);
  }
}

// Each of the four allowed statuses
const verified = getVerificationInfo("verified-2026-27");
check("verified status is kept", verified.status === "verified-2026-27");
check("verified label is Verified for 2026-27", verified.label === "Verified for 2026-27");
check("verified is currently verified", verified.isCurrentlyVerified === true);
check("verified is not a warning", verified.isWarning === false);
check("verified is not historical", verified.isHistorical === false);

const historical = getVerificationInfo("historical", "2025-26");
check("historical status is kept", historical.status === "historical");
check("historical is never currently verified", historical.isCurrentlyVerified === false);
check("historical is historical", historical.isHistorical === true);
check("historical label does not contain Verified", !historical.label.includes("Verified"));
check("historical label includes academic year 2025-26", historical.label.includes("2025-26"));

const proposed = getVerificationInfo("proposed");
check("proposed status is kept", proposed.status === "proposed");
check("proposed is not currently verified", proposed.isCurrentlyVerified === false);
check("proposed is a warning", proposed.isWarning === true);
check("proposed label is not Verified", !proposed.label.includes("Verified"));

const unverified = getVerificationInfo("unverified");
check("unverified status is kept", unverified.status === "unverified");
check("unverified label contains Unverified", unverified.label.includes("Unverified"));
check("unverified is not currently verified", unverified.isCurrentlyVerified === false);
check("unverified is a warning", unverified.isWarning === true);

// Only verified-2026-27 yields isCurrentlyVerified true
const onlyVerified = ALLOWED_STATUSES.filter((s) => getVerificationInfo(s, "2025-26").isCurrentlyVerified);
check("only verified-2026-27 yields isCurrentlyVerified", onlyVerified.length === 1 && onlyVerified[0] === "verified-2026-27");

// Fail closed: unknown or missing status falls back to unverified
const unknownString = getVerificationInfo("verified");
check("unknown string falls back to unverified status", unknownString.status === "unverified");
check("unknown string is not currently verified", unknownString.isCurrentlyVerified === false);
check("unknown string label contains Unverified", unknownString.label.includes("Unverified"));
check("unknown string is a warning", unknownString.isWarning === true);

const unverifiedSample = getVerificationInfo("unverified-sample");
check("unverified-sample falls back to unverified", unverifiedSample.status === "unverified");

const undefinedStatus = getVerificationInfo(undefined);
check("undefined status falls back to unverified", undefinedStatus.status === "unverified");
check("undefined status is not currently verified", undefinedStatus.isCurrentlyVerified === false);
check("undefined status label contains Unverified", undefinedStatus.label.includes("Unverified"));
check("undefined status is a warning", undefinedStatus.isWarning === true);

const nullStatus = getVerificationInfo(null);
check("null status falls back to unverified", nullStatus.status === "unverified");
check("null status is not currently verified", nullStatus.isCurrentlyVerified === false);
check("null status label contains Unverified", nullStatus.label.includes("Unverified"));
check("null status is a warning", nullStatus.isWarning === true);

const missingStatus = getVerificationInfo();
check("missing status falls back to unverified", missingStatus.status === "unverified");
check("missing status is not currently verified", missingStatus.isCurrentlyVerified === false);
check("missing status label contains Unverified", missingStatus.label.includes("Unverified"));
check("missing status is a warning", missingStatus.isWarning === true);

if (failures > 0) {
  process.exitCode = 1;
}
