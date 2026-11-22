import Home from './pages/Home.jsx'
import Footer from './components/Footer.jsx'

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">
        <Home />
      </main>
      <Footer />
    </div>
  )
}
