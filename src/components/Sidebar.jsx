import { X, Download, LogOut, TrendingUp, Users, Dices, History } from 'lucide-react'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function Sidebar({ isOpen, onClose, onExportMissing, onShowStats, onExploreUsers, onGambling, onShowChangelog }) {
    const [isVisible, setIsVisible] = useState(false)
    const [currentUserEmail, setCurrentUserEmail] = useState(null)

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true)
        } else {
            const timer = setTimeout(() => setIsVisible(false), 300) // Match transition duration
            return () => clearTimeout(timer)
        }
    }, [isOpen])

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) {
                setCurrentUserEmail(user.email)
            }
        })
    }, [])

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        onClose()
    }

    if (!isVisible && !isOpen) return null

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'
                    }`}
                onClick={onClose}
            />

            {/* Sidebar */}
            <div
                className={`fixed top-0 left-0 h-full w-80 bg-neutral-900 border-r border-neutral-800 z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                <div className="p-4 border-b border-neutral-800 flex items-center justify-between shrink-0">
                    <h2 className="text-xl font-bold text-white">Menu</h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-neutral-400 hover:text-white rounded-full hover:bg-neutral-800 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-4 flex-1 flex flex-col">
                    <div className="space-y-2">
                        <button
                            onClick={onShowStats}
                            className="w-full flex items-center gap-3 px-4 py-3 text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-xl transition-all group"
                        >
                            <div className="p-2 bg-neutral-800 group-hover:bg-neutral-700 rounded-lg transition-colors">
                                <TrendingUp className="w-5 h-5" />
                            </div>
                            <span className="font-medium">Statistiche</span>
                        </button>

                        <button
                            onClick={onGambling}
                            className="w-full flex items-center gap-3 px-4 py-3 text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-xl transition-all group"
                        >
                            <div className="p-2 bg-neutral-800 group-hover:bg-neutral-700 rounded-lg transition-colors">
                                <Dices className="w-5 h-5 text-purple-400 group-hover:text-purple-300" />
                            </div>
                            <span className="font-medium">Gambling</span>
                        </button>

                        <button
                            onClick={onShowChangelog}
                            className="w-full flex items-center gap-3 px-4 py-3 text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-xl transition-all group"
                        >
                            <div className="p-2 bg-neutral-800 group-hover:bg-neutral-700 rounded-lg transition-colors">
                                <History className="w-5 h-5" />
                            </div>
                            <span className="font-medium">Changelog</span>
                        </button>

                        <button
                            onClick={onExportMissing}
                            className="w-full flex items-center gap-3 px-4 py-3 text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-xl transition-all group"
                        >
                            <div className="p-2 bg-neutral-800 group-hover:bg-neutral-700 rounded-lg transition-colors">
                                <Download className="w-5 h-5" />
                            </div>
                            <span className="font-medium">Lista Mancanti</span>
                        </button>

                        {/* Explore Users Button - Only for specific email */}
                        {currentUserEmail === 'atzoalbo.94@gmail.com' && (
                            <button
                                onClick={onExploreUsers}
                                className="w-full flex items-center gap-3 px-4 py-3 text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-xl transition-all group"
                            >
                                <div className="p-2 bg-neutral-800 group-hover:bg-neutral-700 rounded-lg transition-colors">
                                    <Users className="w-5 h-5" />
                                </div>
                                <span className="font-medium">Esplora Utenti</span>
                            </button>
                        )}
                    </div>

                    <div className="mt-auto pt-4 border-t border-neutral-800">
                        <button
                            onClick={handleSignOut}
                            className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all group"
                        >
                            <div className="p-2 bg-red-500/10 group-hover:bg-red-500/20 rounded-lg transition-colors">
                                <LogOut className="w-5 h-5" />
                            </div>
                            <span className="font-medium">Esci</span>
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}
