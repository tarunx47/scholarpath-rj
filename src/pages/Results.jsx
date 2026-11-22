import { useState } from 'react'
import { loadSchemes } from '../lib/dataLoader.js'
import { evaluateAll } from '../lib/eligibility.js'

const PROFILE_KEY = 'scholarpath.profile'

function readProfile() {
  try {
    return JSON.parse(sessionStorage.getItem(PROFILE_KEY))
  } catch {
    return null
  }
}

export default function Results({ onEditProfile, onBack }) {
  const [profile] = useState(readProfile)

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

  const schemes = loadSchemes()
  const results = evaluateAll(schemes, profile)

  return (
    <section className="p-4 sm:p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Eligibility results</h1>
      <p className="text-sm text-gray-600 mb-4">
        Eligibility guidance is not government approval. Check the official source.
      </p>

      <ul className="space-y-4">
        {results.map((r) => (
          <li key={r.scheme_name} className="border rounded p-4">
            <h2 className="font-semibold">{r.scheme_name}</h2>
            <p className="text-sm font-medium mt-1">{r.label}</p>
            {r.reasons?.length > 0 && (
              <ul className="list-disc list-inside text-sm mt-2">
                {r.reasons.map((reason, i) => (
                  <li key={i}>{reason}</li>
                ))}
              </ul>
            )}
            {r.missing_fields?.length > 0 && (
              <p className="text-sm mt-2">Missing: {r.missing_fields.join(', ')}</p>
            )}
          </li>
        ))}
      </ul>

      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <button type="button" onClick={onBack} className="px-4 py-2 rounded border">
          Back
        </button>
      </div>
    </section>
  )
}
