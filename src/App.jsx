import { useState } from 'react'
import Home from './pages/Home.jsx'
import Profile from './pages/Profile.jsx'
import Results from './pages/Results.jsx'
import Footer from './components/Footer.jsx'

const PROFILE_KEY = 'scholarpath.profile'

export default function App() {
  const [view, setView] = useState('home')
  const [profile, setProfile] = useState(null)

  function saveAndShow(p) {
    setProfile(p)
    sessionStorage.setItem(PROFILE_KEY, JSON.stringify(p))
    setView('results')
  }

  let content
  if (view === 'profile') {
    content = <Profile onSubmit={saveAndShow} onBack={() => setView('home')} />
  } else if (view === 'results') {
    content = <Results onEditProfile={() => setView('profile')} onBack={() => setView('home')} />
  } else {
    content = (
      <Home onStart={() => setView('profile')} onTry={saveAndShow} />
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">
        {content}
      </main>
      <Footer />
    </div>
  )
}
