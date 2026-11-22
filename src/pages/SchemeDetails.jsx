import { useState } from 'react'
import { loadSchemes } from '../lib/dataLoader.js'
import { evaluateScheme } from '../lib/eligibility.js'
import { getVerificationInfo } from '../lib/verification.js'
import { readChecklist, setChecklistItem, getChecklistItem } from '../lib/checklist.js'
import helplines from '../data/helplines.json'

const PROFILE_KEY = 'scholarpath.profile'

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

// Normalise a document/step entry (string or object) into a record with a stable id.
function normaliseItems(list, kind) {
  if (!Array.isArray(list)) return []
  const prefix = kind === 'documents' ? 'doc' : 'step'
  return list.map((entry, index) => {
    const fallbackId = `${prefix}-${index}`
    if (typeof entry === 'string') {
      return {
        id: fallbackId,
        text: entry,
        verification_status: 'unverified',
        source_url: null,
        source_page: null,
        source_date: null,
        academic_year: null,
      }
    }
    const obj = entry !== null && typeof entry === 'object' ? entry : {}
    return {
      id: obj.id !== undefined && obj.id !== null && obj.id !== '' ? String(obj.id) : fallbackId,
      text: typeof obj.text === 'string' ? obj.text : '',
      verification_status: obj.verification_status ?? 'unverified',
      source_url: obj.source_url ?? null,
      source_page: obj.source_page ?? null,
      source_date: obj.source_date ?? null,
      academic_year: obj.academic_year ?? null,
    }
  })
}

function SourceLine({ record }) {
  const { source_url: url, source_page: page, source_date: date, academic_year: year } = record
  const parts = []
  if (!url && !page && !date) parts.push('Source not established')
  if (page) parts.push(page)
  if (url) {
    parts.push(
      <a key="url" href={url} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">
        Source link
      </a>,
    )
  }
  if (date) parts.push(`Source date: ${date}`)
  if (year) parts.push(`Academic year: ${year}`)
  return (
    <span className="block text-xs mt-1 opacity-80">
      {parts.map((part, i) => (
        <span key={i}>
          {i > 0 ? ' · ' : ''}
          {part}
        </span>
      ))}
    </span>
  )
}

// Verification label, warning line and source provenance for one record.
function RecordProvenance({ record }) {
  const info = getVerificationInfo(record.verification_status, record.academic_year)
  let label = info.label
  if (info.isHistorical) {
    label = record.academic_year ? `Historical – ${record.academic_year}` : 'Historical'
  }
  return (
    <>
      <span className={`block text-xs mt-1 ${info.isHistorical ? 'font-semibold' : 'opacity-80'}`}>{label}</span>
      {info.isWarning && (
        <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded mt-1 ${info.className}`}>
          Not currently verified
        </span>
      )}
      <SourceLine record={record} />
    </>
  )
}

export default function SchemeDetails({ schemeId, onBack }) {
  const profile = readStoredProfile()
  const scheme = loadSchemes().find((s) => s.id === schemeId)
  // Snapshot is only used to force a re-render; checked state is read via getChecklistItem.
  const [, setChecklist] = useState(readChecklist)

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
  const schemeInfo = getVerificationInfo(scheme.verification_status, scheme.academic_year)

  function toggleItem(kind, itemId, checked) {
    setChecklistItem(scheme.id, kind, itemId, checked)
    setChecklist(readChecklist())
  }

  function renderChecklist(kind, rawList, emptyText) {
    const items = normaliseItems(rawList, kind)
    if (items.length === 0) return <p className="text-sm">{emptyText}</p>
    const current = items.filter((item) => item.verification_status !== 'historical')
    const historical = items.filter((item) => item.verification_status === 'historical')
    const renderItem = (item) => (
      <li key={item.id} className="text-sm border rounded px-3 py-2">
        <label className="flex items-start gap-2">
          <input
            type="checkbox"
            className="mt-1"
            checked={getChecklistItem(scheme.id, kind, item.id)}
            onChange={(e) => toggleItem(kind, item.id, e.target.checked)}
          />
          <span>{item.text}</span>
        </label>
        <RecordProvenance record={item} />
      </li>
    )
    return (
      <>
        {current.length > 0 && <ul className="space-y-2">{current.map(renderItem)}</ul>}
        {historical.length > 0 && (
          <>
            <h3 className="text-sm font-medium mt-3 mb-1">Historical (not current)</h3>
            <ul className="space-y-2">{historical.map(renderItem)}</ul>
          </>
        )}
      </>
    )
  }

  return (
    <section className="p-4 sm:p-6 max-w-2xl mx-auto">
      <span className={`inline-block mb-2 text-xs font-medium px-2 py-0.5 rounded ${schemeInfo.className}`}>
        {schemeInfo.label}
      </span>
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
              <RecordProvenance record={rule} />

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

      <h2 className="font-semibold mt-6 mb-2">Required Documents</h2>
      {renderChecklist(
        'documents',
        scheme.required_documents,
        'No source-backed documents have been published for this scheme yet.',
      )}

      <h2 className="font-semibold mt-6 mb-2">Application Steps</h2>
      {renderChecklist(
        'steps',
        scheme.application_steps,
        'No source-backed application steps have been published for this scheme yet.',
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
      <p className="text-sm">Status: {schemeInfo.label}</p>
      {schemeInfo.isWarning && (
        <p className={`inline-block text-xs font-medium px-2 py-0.5 rounded mt-1 ${schemeInfo.className}`}>
          Not currently verified
        </p>
      )}
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
