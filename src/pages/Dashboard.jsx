import { useState } from 'react'
import { loadSchemes } from '../lib/dataLoader.js'
import { evaluateScheme } from '../lib/eligibility.js'

import {
  APPROVAL_NOTE,
  LABEL_CLASS,
  RULE_CLASS,
  RULE_SYMBOL,
  eligibilitySectionStatus,
  eligibilityStatusText,
  friendlyFieldName,
  readStoredProfile,
} from './SchemeDetails.jsx'

const SAVED_KEY = 'scholarpath.saved'
const APPLIED_KEY = 'scholarpath.applied'
const RESULT_RANK = {
  likely_eligible: 0,
  possibly_eligible: 1,
  incomplete_unverified: 2,
  likely_not_eligible: 3,
}
const UNKNOWN_RANK = 4

const TABS = [
  { id: 'recommended', label: 'Recommended' },
  { id: 'saved', label: 'Saved' },
  { id: 'applied', label: 'Applied' },
]

const EMPTY_TEXT = {
  recommended: 'No scholarships to show.',
  saved: 'No saved scholarships yet. Use Save on a card.',
  applied: 'No scholarships marked as applied yet.',
}

function rankOf(result) {
  return Object.prototype.hasOwnProperty.call(RESULT_RANK, result) ? RESULT_RANK[result] : UNKNOWN_RANK
}

function present(value) {
  return value !== null && value !== undefined
}

function readList(key) {
  try {
    const value = JSON.parse(sessionStorage.getItem(key))
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

function writeList(key, list) {
  sessionStorage.setItem(key, JSON.stringify(list))
}

export default function Dashboard({ onOpenScheme, onEditProfile, onBack }) {
  const [profile] = useState(readStoredProfile)
  const [tab, setTab] = useState('recommended')
  const [saved, setSaved] = useState(() => readList(SAVED_KEY))
  const [applied, setApplied] = useState(() => readList(APPLIED_KEY))

  if (!profile) {
    return (
      <section className="p-4 sm:p-6 max-w-2xl mx-auto">
        <p className="mb-4">No profile yet. Fill in the profile first.</p>
        <button
          type="button"
          onClick={onEditProfile}
          className="px-4 py-2 rounded bg-blue-600 text-white"
        >
          Fill profile
        </button>
      </section>
    )
  }

  const items = loadSchemes()
    .map((scheme) => ({ scheme, result: evaluateScheme(scheme, profile) }))
    .sort(
      (a, b) =>
        rankOf(a.result.result) - rankOf(b.result.result) ||
        String(a.scheme.name ?? '').localeCompare(String(b.scheme.name ?? '')),
    )

  const visible = items.filter(({ scheme }) => {
    if (tab === 'saved') return saved.includes(scheme.id)
    if (tab === 'applied') return applied.includes(scheme.id)
    return true
  })

  function toggleSaved(id) {
    const next = saved.includes(id) ? saved.filter((x) => x !== id) : [...saved, id]
    setSaved(next)
    writeList(SAVED_KEY, next)
  }

  function toggleApplied(id) {
    const next = applied.includes(id) ? applied.filter((x) => x !== id) : [...applied, id]
    setApplied(next)
    writeList(APPLIED_KEY, next)
  }

  return (
    <section className="p-4 sm:p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Your scholarships</h1>
      <p className="text-sm text-gray-600 mb-4">{APPROVAL_NOTE}</p>

      <div role="tablist" className="flex gap-2 mb-4">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-1.5 rounded border text-sm ${
              tab === t.id ? 'bg-blue-600 text-white border-blue-600' : 'bg-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="text-sm text-gray-600">{EMPTY_TEXT[tab]}</p>
      ) : (
        <ul className="space-y-4">
          {visible.map(({ scheme, result: r }) => {
            const isSaved = saved.includes(scheme.id)
            const isApplied = applied.includes(scheme.id)
            const eligibilityStatus = eligibilitySectionStatus(scheme, r)
            const chipRules = r.rules
              .filter((rule) => rule.informational !== true && rule.current === true)
              .slice(0, 3)
            const deadlineKnown = present(scheme.deadline) && present(scheme.deadline_source)
            return (
              <li key={scheme.id} className="border rounded p-4 bg-white">
                <h2 className="font-semibold">{scheme.name}</h2>
                <p className="text-sm text-gray-600">{present(scheme.department) ? scheme.department : 'Not yet available'}</p>
                <p className={`inline-block mt-2 text-xs font-medium px-2 py-1 rounded ${LABEL_CLASS[r.result]}`}>
                  {r.label}
                </p>
                <p className="text-xs text-gray-700 mt-2">{eligibilityStatusText(eligibilityStatus)}</p>

                {chipRules.length > 0 && (
                  <ul className="flex flex-wrap gap-2 mt-3">
                    {chipRules.map((rule) => (
                      <li
                        key={rule.rule_id}
                        className={`text-xs border rounded px-2 py-1 ${RULE_CLASS[rule.status]}`}
                      >
                        <span aria-hidden="true">{RULE_SYMBOL[rule.status]}</span> {rule.reason}
                      </li>
                    ))}
                  </ul>
                )}

                {r.missing_fields.length > 0 && (
                  <p className="text-sm mt-2">
                    Missing: {r.missing_fields.map(friendlyFieldName).join(', ')}
                  </p>
                )}

                <p className="text-xs text-gray-600 mt-2">
                  {deadlineKnown ? `Deadline: ${scheme.deadline}` : 'Check the official notice.'}
                </p>
                <p className="text-xs text-gray-600">Last verified: {scheme.last_verified || 'Not yet available'}</p>

                <div className="flex flex-wrap gap-2 mt-3">
                  <button
                    type="button"
                    onClick={() => onOpenScheme(scheme.id)}
                    className="px-3 py-1.5 rounded bg-blue-600 text-white text-sm"
                  >
                    View details
                  </button>
                  <button
                    type="button"
                    aria-pressed={isSaved}
                    onClick={() => toggleSaved(scheme.id)}
                    className="px-3 py-1.5 rounded border text-sm"
                  >
                    {isSaved ? 'Saved' : 'Save'}
                  </button>
                  <button
                    type="button"
                    aria-pressed={isApplied}
                    onClick={() => toggleApplied(scheme.id)}
                    className="px-3 py-1.5 rounded border text-sm"
                  >
                    {isApplied ? 'Marked as applied' : 'Mark as applied'}
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <p className="text-sm text-gray-600 mt-6">{APPROVAL_NOTE}</p>

      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <button type="button" onClick={onEditProfile} className="px-4 py-2 rounded border">
          Edit profile
        </button>
        <button type="button" onClick={onBack} className="px-4 py-2 rounded border">
          Back
        </button>
      </div>
    </section>
  )
}
