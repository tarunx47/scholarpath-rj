import { useState } from 'react'

const CATEGORIES = ['general', 'obc', 'sc', 'st', 'ebc', 'sbc', 'dnt', 'ews']
const COURSE_LEVELS = ['ug', 'pg', 'diploma']
const GENDERS = ['female', 'male', 'other', 'prefer-not-to-say']
const INSTITUTION_TYPES = ['govt', 'private']

const labelClass = 'block text-sm font-medium mb-1'
const inputClass = 'w-full border rounded px-3 py-2 text-base'

export default function Profile({ onSubmit, onBack }) {
  const [state, setState] = useState('')
  const [category, setCategory] = useState('general')
  const [income, setIncome] = useState('')
  const [courseLevel, setCourseLevel] = useState('ug')
  const [gender, setGender] = useState('female')
  const [isPwd, setIsPwd] = useState(false)
  const [institutionType, setInstitutionType] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    const profile = {
      state: state.trim(),
      category,
      course_level: courseLevel,
      gender,
      is_pwd: isPwd,
    }
    if (income !== '') {
      profile.annual_family_income = Number(income)
    }
    if (institutionType !== '') {
      profile.institution_type = institutionType
    }
    if (onSubmit) onSubmit(profile)
  }

  return (
    <section className="p-4 sm:p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Student profile</h1>
      <p className="text-sm text-gray-600 mb-4">
        We do not ask for Aadhaar, phone number or address. Your answers stay in this browser session.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="state" className={labelClass}>State</label>
          <input
            id="state"
            type="text"
            required
            value={state}
            onChange={(e) => setState(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="category" className={labelClass}>Category</label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={inputClass}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="income" className={labelClass}>Annual family income (optional)</label>
          <input
            id="income"
            type="number"
            min="0"
            inputMode="numeric"
            value={income}
            onChange={(e) => setIncome(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="course_level" className={labelClass}>Course level</label>
          <select
            id="course_level"
            value={courseLevel}
            onChange={(e) => setCourseLevel(e.target.value)}
            className={inputClass}
          >
            {COURSE_LEVELS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="gender" className={labelClass}>Gender</label>
          <select
            id="gender"
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className={inputClass}
          >
            {GENDERS.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <input
            id="is_pwd"
            type="checkbox"
            checked={isPwd}
            onChange={(e) => setIsPwd(e.target.checked)}
            className="h-5 w-5"
          />
          <label htmlFor="is_pwd" className="text-sm font-medium">Person with disability (PwD)</label>
        </div>

        <div>
          <label htmlFor="institution_type" className={labelClass}>Institution type (optional)</label>
          <select
            id="institution_type"
            value={institutionType}
            onChange={(e) => setInstitutionType(e.target.value)}
            className={inputClass}
          >
            <option value="">Not specified</option>
            {INSTITUTION_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white">
            See eligibility
          </button>
          {onBack && (
            <button type="button" onClick={onBack} className="px-4 py-2 rounded border">
              Back
            </button>
          )}
        </div>
      </form>
    </section>
  )
}
