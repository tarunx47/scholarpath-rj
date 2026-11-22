import { useState } from 'react'
import { CATEGORY_OPTIONS } from '../lib/profileOptions.js'

const CATEGORIES = CATEGORY_OPTIONS
const COURSE_LEVELS = ['ug', 'pg', 'diploma']
const GENDERS = ['female', 'male', 'other', 'prefer-not-to-say']
const INSTITUTION_TYPES = ['govt', 'private', 'national_level']

const labelClass = 'block mb-1.5 text-sm font-semibold text-[#18212b]'
const inputClass =
  'w-full min-h-11 px-3 py-2 rounded-lg border border-[#d9d2c3] bg-white text-[#18212b] focus:outline-none focus:ring-2 focus:ring-[#1f6353] focus:border-[#1f6353]'
const sectionClass = 'rounded-2xl border border-[#e7e0d2] bg-white p-4 sm:p-6 shadow-sm'
const sectionNumberClass =
  'inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#f1ebdf] text-xs font-bold text-[#4a2f00] mb-3'
const actionButtonClass = 'min-h-11 px-5 py-2 rounded-lg font-semibold'


function readStoredProfile() {
  try {
    const raw = sessionStorage.getItem('scholarpath.profile')
    const parsed = raw ? JSON.parse(raw) : null
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

export default function Profile({ onSubmit, onBack }) {
  const [stored] = useState(readStoredProfile)
  const [state, setState] = useState(typeof stored.state === 'string' ? stored.state : 'Rajasthan')
  const [category, setCategory] = useState(stored.category ?? 'general')
  const [income, setIncome] = useState(
    typeof stored.annual_family_income === 'number' ? String(stored.annual_family_income) : ''
  )
  const [courseLevel, setCourseLevel] = useState(stored.course_level ?? 'ug')
  const [gender, setGender] = useState(stored.gender ?? 'female')
  const [isPwd, setIsPwd] = useState(stored.is_pwd === true)
  const [institutionType, setInstitutionType] = useState(stored.institution_type ?? '')

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
    <section className="sp-container max-w-3xl mx-auto px-4 py-6 sm:px-6 sm:py-10 bg-[#faf7f2] min-h-full">
      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#18212b] mb-2">Student profile</h1>
        <p className="text-sm sm:text-base text-[#5a6573] leading-relaxed max-w-prose">
          We do not ask for Aadhaar, phone number or address. Your answers stay in this browser session.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className={sectionClass}>
          <span aria-hidden="true" className={sectionNumberClass}>1</span>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
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
          </div>
        </div>

        <div className={sectionClass}>
          <span aria-hidden="true" className={sectionNumberClass}>2</span>
          <div className="grid gap-4 sm:grid-cols-2">
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

            <div className="sm:col-span-2">
              <label
                htmlFor="is_pwd"
                className={`flex items-center gap-3 min-h-11 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                  isPwd ? 'border-[#f0d78f] bg-[#fdf6e3] text-[#4a2f00]' : 'border-[#d9d2c3] bg-white text-[#18212b]'
                }`}
              >
                <input
                  id="is_pwd"
                  type="checkbox"
                  checked={isPwd}
                  onChange={(e) => setIsPwd(e.target.checked)}
                  className="h-5 w-5 shrink-0 accent-[#1f6353]"
                />
                <span className="text-sm font-semibold">Person with disability (PwD)</span>
              </label>
            </div>
          </div>
        </div>

        <div className={sectionClass}>
          <span aria-hidden="true" className={sectionNumberClass}>3</span>
          <div className="grid gap-4">
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
          </div>
        </div>

        <div className="sticky bottom-0 z-10 -mx-4 sm:mx-0 mt-2 border-t sm:border-t-0 border-[#e7e0d2] bg-[#faf7f2]/95 backdrop-blur px-4 py-3 sm:px-0 sm:py-0 sm:bg-transparent flex flex-col sm:flex-row sm:justify-end gap-3">
          <button type="submit" className={`sp-btn-primary ${actionButtonClass} w-full sm:w-auto bg-[#1f6353] hover:bg-[#184f43] text-white`}>
            See eligibility
          </button>
          {onBack && (
            <button type="button" onClick={onBack} className={`sp-btn-secondary ${actionButtonClass} w-full sm:w-auto border border-[#d9d2c3] bg-white text-[#18212b] hover:bg-[#f1ebdf]`}>
              Back
            </button>
          )}
        </div>
      </form>
    </section>
  )
}
