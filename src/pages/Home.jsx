import { loadSchemes } from '../lib/dataLoader.js'

const schemes = loadSchemes()

export default function Home() {
  return (
    <section className="p-6 max-w-2xl mx-auto">
      <h1>ScholarPath</h1>
      <p>Your scholarship journey, made simpler.</p>
      <p>Sample scheme loaded from data: {schemes[0].name}</p>
    </section>
  )
}
