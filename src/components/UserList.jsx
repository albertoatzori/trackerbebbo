import { useState, useEffect } from 'react'
import { Search, User, ChevronRight, ArrowLeft } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'

export default function UserList({ onSelectUser, onBack }) {
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        fetchUsers()
    }, [])

    const fetchUsers = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('email')

            if (error) throw error
            setUsers(data)
        } catch (error) {
            console.error('Error fetching users:', error)
        } finally {
            setLoading(false)
        }
    }

    const filteredUsers = users.filter(user =>
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.display_name?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="min-h-screen bg-neutral-950 text-white p-4">
            <div className="max-w-2xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-2 bg-neutral-900 rounded-full hover:bg-neutral-800 transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-2xl font-bold">Esplora Utenti</h1>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                    <input
                        type="text"
                        placeholder="Cerca utente per email..."
                        className="w-full pl-12 pr-4 py-3 bg-neutral-900 border border-neutral-800 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* User List */}
                <div className="space-y-2">
                    {loading ? (
                        <div className="flex justify-center py-10">
                            <div className="animate-spin rounded-full h-8 w-8 border-2 border-red-600 border-t-transparent"></div>
                        </div>
                    ) : filteredUsers.length > 0 ? (
                        filteredUsers.map(user => (
                            <button
                                key={user.id}
                                onClick={() => onSelectUser(user)}
                                className="w-full flex items-center justify-between p-4 bg-neutral-900 border border-neutral-800 rounded-xl hover:border-neutral-700 hover:bg-neutral-800/50 transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center group-hover:bg-neutral-700 transition-colors">
                                        <User className="w-5 h-5 text-neutral-400 group-hover:text-white" />
                                    </div>
                                    <div className="text-left">
                                        <div className="font-medium text-white">
                                            {user.email?.split('@')[0]}
                                        </div>
                                        {user.display_name && (
                                            <div className="text-sm text-neutral-500">
                                                {user.display_name}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-neutral-600 group-hover:text-white transition-colors" />
                            </button>
                        ))
                    ) : (
                        <div className="text-center py-10 text-neutral-500">
                            Nessun utente trovato
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
