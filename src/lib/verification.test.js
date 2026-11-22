// Dependency-free tests for verification-status handling. Run with: node src/lib/verification.test.js
import { getVerificationInfo, ALLOWED_STATUSES, isCurrentlyVerified, getSectionStatus, getSchemeDisplayStatus } from "./verification.js";

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
const verified = getVerificationInfo("verified-2026-27", "2026-27");
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
const onlyVerified = ALLOWED_STATUSES.filter((s) => getVerificationInfo(s, "2026-27").isCurrentlyVerified);
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

// isCurrentlyVerified: requires exact status AND exact academic year
check("isCurrentlyVerified true for verified-2026-27 with 2026-27", isCurrentlyVerified({ verification_status: "verified-2026-27", academic_year: "2026-27" }) === true);
check("isCurrentlyVerified false for academic_year null", isCurrentlyVerified({ verification_status: "verified-2026-27", academic_year: null }) === false);
check("isCurrentlyVerified false for academic_year 2025-26", isCurrentlyVerified({ verification_status: "verified-2026-27", academic_year: "2025-26" }) === false);
check("isCurrentlyVerified false for academic_year with trailing space", isCurrentlyVerified({ verification_status: "verified-2026-27", academic_year: "2026-27 " }) === false);
check("isCurrentlyVerified false for uppercase status", isCurrentlyVerified({ verification_status: "VERIFIED-2026-27", academic_year: "2026-27" }) === false);
check("isCurrentlyVerified false for historical", isCurrentlyVerified({ verification_status: "historical", academic_year: "2026-27" }) === false);
check("isCurrentlyVerified false for proposed", isCurrentlyVerified({ verification_status: "proposed", academic_year: "2026-27" }) === false);
check("isCurrentlyVerified false for unverified", isCurrentlyVerified({ verification_status: "unverified", academic_year: "2026-27" }) === false);
check("isCurrentlyVerified false for missing status", isCurrentlyVerified({ academic_year: "2026-27" }) === false);
check("isCurrentlyVerified false for null status", isCurrentlyVerified({ verification_status: null, academic_year: "2026-27" }) === false);
check("isCurrentlyVerified false for unverified-sample", isCurrentlyVerified({ verification_status: "unverified-sample", academic_year: "2026-27" }) === false);

// getSectionStatus
check("getSectionStatus empty array is empty", getSectionStatus([]) === "empty");
check("getSectionStatus all current is verified", getSectionStatus([
  { verification_status: "verified-2026-27", academic_year: "2026-27" },
  { verification_status: "verified-2026-27", academic_year: "2026-27" },
]) === "verified");
check("getSectionStatus one current plus one unverified is partial", getSectionStatus([
  { verification_status: "verified-2026-27", academic_year: "2026-27" },
  { verification_status: "unverified", academic_year: "2026-27" },
]) === "partial");
check("getSectionStatus all historical is historical_only", getSectionStatus([
  { verification_status: "historical", academic_year: "2025-26" },
  { verification_status: "historical", academic_year: "2024-25" },
]) === "historical_only");
check("getSectionStatus all unverified is unverified", getSectionStatus([
  { verification_status: "unverified", academic_year: "2026-27" },
  { verification_status: "unverified", academic_year: "2026-27" },
]) === "unverified");

// getSchemeDisplayStatus
check("getSchemeDisplayStatus all verified is fully_verified_2026_27", getSchemeDisplayStatus({ a: "verified", b: "verified" }) === "fully_verified_2026_27");
check("getSchemeDisplayStatus verified plus empty is partly_verified", getSchemeDisplayStatus({ a: "verified", b: "empty" }) === "partly_verified");
check("getSchemeDisplayStatus only empty is not_yet_verified", getSchemeDisplayStatus({ a: "empty" }) === "not_yet_verified");

if (failures > 0) {
  process.exitCode = 1;
}
