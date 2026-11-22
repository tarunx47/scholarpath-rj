import { loadSchemes } from '../lib/dataLoader.js'
import sampleProfiles from '../data/sampleProfiles.json'

const schemes = loadSchemes()

export default function Home({ onStart, onTry } = {}) {
  return (
    <section className="p-6 max-w-2xl mx-auto">
      <h1>ScholarPath</h1>
      <p>Your scholarship journey, made simpler.</p>
      <p>Sample scheme loaded from data: {schemes[0].name}</p>
      <div className="flex flex-wrap gap-3 mt-4">
        <button type="button" onClick={() => onStart && onStart()} className="px-4 py-2 rounded bg-blue-600 text-white">
          Start profile
        </button>
        <button type="button" onClick={() => onTry && onTry(sampleProfiles.Rohit)} className="px-4 py-2 rounded border">
          Try as Rohit
        </button>
        <button type="button" onClick={() => onTry && onTry(sampleProfiles.Aman)} className="px-4 py-2 rounded border">
          Try as Aman
        </button>
      </div>
      <p className="text-xs text-gray-500 mt-2">Synthetic sample profiles for demonstration.</p>
    </section>
  )
}
