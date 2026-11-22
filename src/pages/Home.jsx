import { loadSchemes } from '../lib/dataLoader.js'
import sampleProfiles from '../data/sampleProfiles.json'

const schemes = loadSchemes()

export default function Home({ onStart, onTry } = {}) {
  return (
    <section className="relative min-h-[calc(100vh-4rem)] bg-[#faf7f2] text-[#18212b] overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_20%,rgba(31,99,83,0.08),transparent_55%)]"
      />
      <div className="sp-container relative py-12 sm:py-16 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] gap-12 lg:gap-16 items-center">
          <div className="flex flex-col gap-6">
            <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.02] text-[#18212b]">ScholarPath</h1>
            <p className="text-lg sm:text-xl text-[#5a6573] leading-relaxed max-w-xl">Your scholarship journey, made simpler.</p>
            <p className="text-sm text-[#4a2f00] bg-[#fdf6e3] border border-[#f0d78f] rounded-lg px-4 py-3 max-w-xl">Sample scheme loaded from data: {schemes[0].name}</p>
            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 mt-2">
              <button type="button" onClick={() => onStart && onStart()} className="sp-btn-primary inline-flex items-center justify-center min-h-11 px-6 py-2.5 rounded-lg bg-[#1f6353] text-[#e6f2ee] font-semibold shadow-sm hover:bg-[#184f43] transition-colors">
                Start profile
              </button>
              <button type="button" onClick={() => onTry && onTry(sampleProfiles.Rohit)} className="sp-btn-secondary inline-flex items-center justify-center min-h-11 px-6 py-2.5 rounded-lg border border-[#d9d2c3] bg-white text-[#18212b] font-medium hover:bg-[#f1ebdf] transition-colors">
                Try as Rohit
              </button>
              <button type="button" onClick={() => onTry && onTry(sampleProfiles.Aman)} className="sp-btn-secondary inline-flex items-center justify-center min-h-11 px-6 py-2.5 rounded-lg border border-[#d9d2c3] bg-white text-[#18212b] font-medium hover:bg-[#f1ebdf] transition-colors">
                Try as Aman
              </button>
            </div>
            <p className="text-xs text-[#5a6573] mt-1">Synthetic sample profiles for demonstration.</p>
          </div>
          <div aria-hidden="true" className="rounded-2xl bg-[#0c2a24] text-[#e6f2ee] p-8 sm:p-10 shadow-lg flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <span className="h-10 w-10 rounded-full border-2 border-[#f0d78f]" />
              <span className="h-2 flex-1 rounded-full bg-[#1f6353]" />
            </div>
            <div className="flex flex-col gap-3">
              <span className="h-3 w-3/4 rounded-full bg-[#e6f2ee]/80" />
              <span className="h-3 w-full rounded-full bg-[#e6f2ee]/30" />
              <span className="h-3 w-5/6 rounded-full bg-[#e6f2ee]/30" />
            </div>
            <div className="grid grid-cols-3 gap-3 pt-2">
              <span className="h-16 rounded-lg bg-[#1f6353]" />
              <span className="h-16 rounded-lg bg-[#f1ebdf]/20" />
              <span className="h-16 rounded-lg bg-[#f0d78f]/80" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
