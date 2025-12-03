import { useState, useEffect } from 'react'
import { supabase } from './lib/supabaseClient'
import Auth from './components/Auth'
import CardGrid from './components/CardGrid'
import UserList from './components/UserList'

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentView, setCurrentView] = useState('my-cards') // 'my-cards', 'user-list', 'user-cards'
  const [selectedUser, setSelectedUser] = useState(null)

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

  // Handle browser back/forward navigation
  useEffect(() => {
    // Check initial state on mount
    const initialState = window.history.state
    if (initialState) {
      if (initialState.view === 'user-list') {
        setCurrentView('user-list')
      } else if (initialState.view === 'user-cards') {
        setCurrentView('user-cards')
        if (initialState.user) {
          setSelectedUser(initialState.user)
        } else if (initialState.userId) {
          setSelectedUser({ id: initialState.userId })
        }
      }
    }

    const handlePopState = (event) => {
      const state = event.state
      if (!state) {
        setCurrentView('my-cards')
        setSelectedUser(null)
      } else if (state.view === 'user-list') {
        setCurrentView('user-list')
        setSelectedUser(null)
      } else if (state.view === 'user-cards') {
        setCurrentView('user-cards')
        if (state.userId) {
          setSelectedUser(state.user || { id: state.userId })
        }
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950 text-white">
        Loading...
      </div>
    )
  }

  if (!session) {
    return <Auth />
  }



  const handleExploreUsers = () => {
    const newState = { view: 'user-list' }
    window.history.pushState(newState, '', '#users')
    setCurrentView('user-list')
  }

  const handleSelectUser = (user) => {
    const newState = { view: 'user-cards', userId: user.id, user: user }
    window.history.pushState(newState, '', `#user/${user.id}`)
    setSelectedUser(user)
    setCurrentView('user-cards')
  }

  const handleBackToMyCards = () => {
    window.history.back()
  }

  const handleBackToUserList = () => {
    window.history.back()
  }

  // Inject navigation props into CardGrid
  if (currentView === 'my-cards') {
    return (
      <CardGrid
        session={session}
        onExploreUsers={handleExploreUsers} // Pass this down to Sidebar via CardGrid
      />
    )
  }

  if (currentView === 'user-list') {
    return (
      <UserList
        onSelectUser={handleSelectUser}
        onBack={handleBackToMyCards}
      />
    )
  }

  if (currentView === 'user-cards' && selectedUser) {
    return (
      <CardGrid
        session={session}
        targetUserId={selectedUser.id}
        readOnly={true}
        onBack={handleBackToUserList}
      />
    )
  }

  return <div>Error: Unknown view</div>
}

export default App
