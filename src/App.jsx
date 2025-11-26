import { useState, useEffect } from 'react'
import { supabase } from './lib/supabaseClient'
import Auth from './components/Auth'
import CardGrid from './components/CardGrid'

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950 text-white">
        Loading...
      </div>
    )
  }

  return (
    <div>
      {!session ? <Auth /> : <CardGrid session={session} />}
    </div>
  )
}

export default App
