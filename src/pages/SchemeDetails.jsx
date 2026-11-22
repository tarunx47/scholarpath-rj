import { loadSchemes } from '../lib/dataLoader.js'
import { evaluateScheme } from '../lib/eligibility.js'
import helplines from '../data/helplines.json'

const PROFILE_KEY = 'scholarpath.profile'
const UNVERIFIED_STATUS = 'unverified-sample'

export const APPROVAL_NOTE =
  'Likely eligible does not mean approved. Final decision rests with the concerned department.'

export const LABEL_CLASS = {
  likely_eligible: 'bg-green-100 text-green-900',
  possibly_eligible: 'bg-amber-100 text-amber-900',
  likely_not_eligible: 'bg-gray-200 text-gray-800',
}

export const RULE_CLASS = {
  pass: 'bg-green-50 text-green-800 border-green-300',
  fail: 'bg-red-50 text-red-800 border-red-300',
  unknown: 'bg-amber-50 text-amber-900 border-amber-300',
}

export const RULE_SYMBOL = { pass: '✓', fail: '✗', unknown: '?' }

// Friendly names for profile keys shown to the student. Display-only mapping.
const FIELD_LABELS = {
  state: 'State',
  category: 'Category',
  annual_family_income: 'Family income',
  course_level: 'Course level',
  gender: 'Gender',
  is_pwd: 'Disability status',
  institution_type: 'Institution type',
}

export function friendlyFieldName(key) {
  if (Object.prototype.hasOwnProperty.call(FIELD_LABELS, key)) return FIELD_LABELS[key]
  const spaced = String(key).replace(/_/g, ' ').trim()
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}

export function readStoredProfile() {
  try {
    return JSON.parse(sessionStorage.getItem(PROFILE_KEY))
  } catch {
    return null
  }
}

export default function SchemeDetails({ schemeId, onBack }) {
  const profile = readStoredProfile()
  const scheme = loadSchemes().find((s) => s.id === schemeId)

  if (!scheme) {
    return (
      <section className="p-4 sm:p-6 max-w-2xl mx-auto">
        <p className="mb-4">This scholarship could not be found.</p>
        <button type="button" onClick={onBack} className="px-4 py-2 rounded border">
          Back to results
        </button>
      </section>
    )
  }

  const result = evaluateScheme(scheme, profile || {})
  const helpline = scheme.helpline_id
    ? helplines.find((h) => h.id === scheme.helpline_id)
    : undefined
  const isUnverified = scheme.verification_status === UNVERIFIED_STATUS
  const verificationText =
    scheme.verification_status === 'verified'
      ? 'Verified'
      : isUnverified
        ? 'Sample, unverified'
        : 'Check the official source'

  return (
    <section className="p-4 sm:p-6 max-w-2xl mx-auto">
      {isUnverified && (
        <span className="inline-block mb-2 text-xs font-medium px-2 py-0.5 rounded bg-amber-100 text-amber-900">
          Sample, unverified
        </span>
      )}
      <h1 className="text-2xl font-bold">{scheme.name}</h1>
      <p className="text-sm text-gray-600 mb-2">{scheme.department}</p>
      <p className={`inline-block text-xs font-medium px-2 py-1 rounded ${LABEL_CLASS[result.result]}`}>
        {result.label}
      </p>

      {scheme.description && <p className="text-sm mt-4">{scheme.description}</p>}

      <h2 className="font-semibold mt-6 mb-2">Why this result</h2>
      {result.rules.length > 0 ? (
        <ul className="space-y-2">
          {result.rules.map((rule) => (
            <li key={rule.rule_id} className={`text-sm border rounded px-3 py-2 ${RULE_CLASS[rule.status]}`}>
              <span aria-hidden="true">{RULE_SYMBOL[rule.status]}</span> {rule.reason}
              {rule.note && <span className="block text-xs mt-1 opacity-80">{rule.note}</span>}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm">{result.reasons.join(' ')}</p>
      )}

      <h2 className="font-semibold mt-6 mb-2">Missing information</h2>
      {result.missing_fields.length > 0 ? (
        <p className="text-sm">{result.missing_fields.map(friendlyFieldName).join(', ')}</p>
      ) : (
        <p className="text-sm">No missing information.</p>
      )}

      <h2 className="font-semibold mt-6 mb-2">Deadline</h2>
      {scheme.deadline ? (
        <p className="text-sm">
          Deadline: {scheme.deadline}
          {scheme.deadline_source ? ` (source: ${scheme.deadline_source})` : ''}
        </p>
      ) : (
        <p className="text-sm">Check the official notice.</p>
      )}

      <h2 className="font-semibold mt-6 mb-2">Official source and helpdesk</h2>
      {scheme.official_url && (
        <p className="text-sm">
          <a href={scheme.official_url} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">
            Official source
          </a>
        </p>
      )}
      <p className="text-sm">
        Helpdesk: {helpline ? `${helpline.name || scheme.department}. Check the official source for contact details.` : 'Check the official source'}
      </p>

      <h2 className="font-semibold mt-6 mb-2">Verification</h2>
      <p className="text-sm">Status: {verificationText}</p>
      {scheme.last_verified && <p className="text-sm">Last verified: {scheme.last_verified}</p>}

      <p className="text-sm text-gray-600 mt-6">{APPROVAL_NOTE}</p>

      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <button type="button" onClick={onBack} className="px-4 py-2 rounded border">
          Back to results
        </button>
      </div>
    </section>
  )
}
