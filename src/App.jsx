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
    setCurrentView('user-list')
  }

  const handleSelectUser = (user) => {
    setSelectedUser(user)
    setCurrentView('user-cards')
  }

  const handleBackToMyCards = () => {
    setCurrentView('my-cards')
    setSelectedUser(null)
  }

  const handleBackToUserList = () => {
    setCurrentView('user-list')
    setSelectedUser(null)
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
