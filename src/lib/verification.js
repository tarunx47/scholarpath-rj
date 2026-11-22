// Verification-status helpers. Pure and dependency-free.

export const ALLOWED_STATUSES = ['verified-2026-27', 'historical', 'proposed', 'unverified'];

export const CURRENT_ACADEMIC_YEAR = '2026-27';

export const TONE_CLASS = {
  green: 'bg-green-100 text-green-900',
  amber: 'bg-amber-100 text-amber-900',
  gray: 'bg-gray-200 text-gray-800',
};

// A record counts as currently verified only when both its status and its academic year match exactly.
export function isCurrentlyVerified(record) {
  return !!record && record.verification_status === 'verified-2026-27' && record.academic_year === CURRENT_ACADEMIC_YEAR;
}

// Fail closed: anything that is not an allowed status is treated as 'unverified'.
export function getVerificationInfo(status, academicYear) {
  const known = typeof status === 'string' && ALLOWED_STATUSES.includes(status);
  const effective = known ? status : 'unverified';

  let label;
  let tone;
  let isCurrentlyVerified = false;
  let isHistorical = false;
  let isWarning = false;

  switch (effective) {
    case 'verified-2026-27':
      if (academicYear === CURRENT_ACADEMIC_YEAR) {
        label = 'Verified for 2026-27';
        tone = 'green';
        isCurrentlyVerified = true;
      } else {
        label = 'Not verified for 2026-27';
        tone = 'amber';
        isWarning = true;
        isCurrentlyVerified = false;
      }
      break;
    case 'historical':
      label =
        typeof academicYear === 'string' && academicYear.trim() !== ''
          ? `Historical (${academicYear})`
          : 'Historical';
      tone = 'gray';
      isHistorical = true;
      break;
    case 'proposed':
      label = 'Proposed – not yet verified';
      tone = 'amber';
      isWarning = true;
      break;
    case 'unverified':
    default:
      label = 'Unverified';
      tone = 'amber';
      isWarning = true;
      break;
  }

  return {
    status: effective,
    label,
    tone,
    className: TONE_CLASS[tone],
    isCurrentlyVerified,
    isHistorical,
    isWarning,
  };
}

// Section-level status across a list of records.
export function getSectionStatus(items) {
  if (!Array.isArray(items) || items.length === 0) return 'empty';
  if (items.every(isCurrentlyVerified)) return 'verified';
  if (items.every(i => i && i.verification_status === 'historical')) return 'historical_only';
  if (items.some(isCurrentlyVerified)) return 'partial';
  return 'unverified';
}

// Scheme-level status across a map of section name -> section status.
export function getSchemeDisplayStatus(sections) {
  const values = Object.values(sections || {});
  if (values.length > 0 && values.every(v => v === 'verified')) return 'fully_verified_2026_27';
  if (values.some(v => v === 'verified')) return 'partly_verified';
  return 'not_yet_verified';
}
