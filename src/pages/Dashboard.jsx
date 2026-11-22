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
    <section className="sp-container bg-[#faf7f2] text-[#18212b] p-4 sm:p-6 md:p-8 mx-auto">
      <header className="mb-8 max-w-3xl">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#18212b] leading-tight mb-3">
          Your scholarships
        </h1>
        <p className="text-base text-[#5a6573] leading-relaxed max-w-prose">{APPROVAL_NOTE}</p>
      </header>

      <div
        role="tablist"
        className="flex flex-wrap gap-1 mb-8 p-1.5 rounded-2xl bg-[#f1ebdf] w-fit max-w-full"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`min-h-11 px-5 py-2 rounded-xl border text-sm font-semibold transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1f6353] ${
              tab === t.id
                ? 'bg-white text-[#0c2a24] border-[#d5e9e2] shadow-md'
                : 'bg-transparent text-[#5a6573] border-transparent hover:text-[#18212b] hover:bg-white/60'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="text-base text-[#5a6573]">{EMPTY_TEXT[tab]}</p>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {visible.map(({ scheme, result: r }) => {
            const isSaved = saved.includes(scheme.id)
            const isApplied = applied.includes(scheme.id)
            const eligibilityStatus = eligibilitySectionStatus(scheme, r)
            const chipRules = r.rules
              .filter((rule) => rule.informational !== true && rule.current === true)
              .slice(0, 3)
            const deadlineKnown = present(scheme.deadline) && present(scheme.deadline_source)
            return (
              <li
                key={scheme.id}
                className="sp-card flex flex-col rounded-2xl border border-[#d5e9e2] bg-white p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <h2 className="font-serif text-xl font-semibold text-[#18212b] leading-snug">{scheme.name}</h2>
                <p className="text-sm text-gray-600">{present(scheme.department) ? scheme.department : 'Not yet available'}</p>
                <p className={`sp-chip inline-block self-start mt-4 text-xs font-semibold px-3 py-1 rounded-full border ${LABEL_CLASS[r.result]}`}>
                  {r.label}
                </p>
                <p className="text-sm text-[#18212b] mt-2">{eligibilityStatusText(eligibilityStatus)}</p>

                {chipRules.length > 0 && (
                  <ul className="flex flex-wrap gap-2 mt-3">
                    {chipRules.map((rule) => (
                      <li
                        key={rule.rule_id}
                        className={`sp-chip text-xs border rounded-full px-2.5 py-1 ${RULE_CLASS[rule.status]}`}
                      >
                        <span aria-hidden="true">{RULE_SYMBOL[rule.status]}</span> {rule.reason}
                      </li>
                    ))}
                  </ul>
                )}

                {r.missing_fields.length > 0 && (
                  <p className="text-sm text-[#4a2f00] bg-[#fdf6e3] border border-[#f0d78f] rounded-lg px-3 py-2 mt-3">
                    Missing: {r.missing_fields.map(friendlyFieldName).join(', ')}
                  </p>
                )}

                <div className="mt-4 pt-4 border-t border-[#f1ebdf] space-y-1">
                  <p className="text-xs text-[#5a6573]">
                    {deadlineKnown ? `Deadline: ${scheme.deadline}` : 'Check the official notice.'}
                  </p>
                  <p className="text-xs text-[#5a6573]">Last verified: {scheme.last_verified || 'Not yet available'}</p>
                </div>

                <div className="flex flex-wrap gap-2 mt-auto pt-5">
                  <button
                    type="button"
                    onClick={() => onOpenScheme(scheme.id)}
                    className="sp-btn-primary min-h-11 px-4 py-2 rounded-xl bg-[#1f6353] text-white text-sm font-semibold hover:bg-[#184f43] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1f6353]"
                  >
                    View details
                  </button>
                  <button
                    type="button"
                    aria-pressed={isSaved}
                    onClick={() => toggleSaved(scheme.id)}
                    className="sp-btn-secondary min-h-11 px-4 py-2 rounded-xl border border-[#d5e9e2] bg-white text-[#18212b] text-sm font-semibold hover:bg-[#f1ebdf] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1f6353]"
                  >
                    {isSaved ? 'Saved' : 'Save'}
                  </button>
                  <button
                    type="button"
                    aria-pressed={isApplied}
                    onClick={() => toggleApplied(scheme.id)}
                    className="sp-btn-secondary min-h-11 px-4 py-2 rounded-xl border border-[#d5e9e2] bg-white text-[#18212b] text-sm font-semibold hover:bg-[#f1ebdf] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1f6353]"
                  >
                    {isApplied ? 'Marked as applied' : 'Mark as applied'}
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mt-10 pt-6 border-t border-[#e6dfd1]">
        <button
          type="button"
          onClick={onEditProfile}
          className="sp-btn-secondary min-h-11 px-5 py-2 rounded-xl border border-[#d5e9e2] bg-white text-[#18212b] font-semibold hover:bg-[#f1ebdf] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1f6353]"
        >
          Edit profile
        </button>
        <button
          type="button"
          onClick={onBack}
          className="sp-btn-secondary min-h-11 px-5 py-2 rounded-xl border border-[#d5e9e2] bg-white text-[#18212b] font-semibold hover:bg-[#f1ebdf] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1f6353]"
        >
          Back
        </button>
      </div>
    </section>
  )
}

