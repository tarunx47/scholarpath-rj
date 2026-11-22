import { useState } from 'react'
import Home from './pages/Home.jsx'
import Profile from './pages/Profile.jsx'
import Dashboard from './pages/Dashboard.jsx'
import SchemeDetails from './pages/SchemeDetails.jsx'
import Footer from './components/Footer.jsx'

const PROFILE_KEY = 'scholarpath.profile'

export default function App() {
  const [view, setView] = useState('home')
  const [profile, setProfile] = useState(null)
  const [schemeId, setSchemeId] = useState(null)
  const [profileReturnView, setProfileReturnView] = useState('home')

  function saveAndShow(p) {
    setProfile(p)
    sessionStorage.setItem(PROFILE_KEY, JSON.stringify(p))
    setView('results')
  }

  let content
  if (view === 'profile') {
    content = <Profile onSubmit={saveAndShow} onBack={() => setView(profileReturnView)} />
  } else if (view === 'results') {
    content = (
      <Dashboard
        onOpenScheme={(id) => {
          setSchemeId(id)
          setView('details')
        }}
        onEditProfile={() => {
          setProfileReturnView('results')
          setView('profile')
        }}
        onBack={() => setView('home')}
      />
    )
  } else if (view === 'details') {
    content = <SchemeDetails schemeId={schemeId} onBack={() => setView('results')} />
  } else {
    content = (
      <Home
        onStart={() => {
          setProfileReturnView('home')
          setView('profile')
        }}
        onTry={saveAndShow}
      />
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
