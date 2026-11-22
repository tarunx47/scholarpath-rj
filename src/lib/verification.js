// Verification-status helpers. Pure and dependency-free.

export const ALLOWED_STATUSES = ['verified-2026-27', 'historical', 'proposed', 'unverified'];

export const TONE_CLASS = {
  green: 'bg-green-100 text-green-900',
  amber: 'bg-amber-100 text-amber-900',
  gray: 'bg-gray-200 text-gray-800',
};

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
      label = 'Verified for 2026-27';
      tone = 'green';
      isCurrentlyVerified = true;
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
