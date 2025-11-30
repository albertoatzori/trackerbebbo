import { useState, useEffect } from 'react'
import { Search, Grid, Image as ImageIcon, ZoomIn, ZoomOut, Menu, AlertTriangle, ArrowLeft } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import PokemonModal from './PokemonModal'
import PokemonModalReadOnly from './PokemonModalReadOnly'
import Sidebar from './Sidebar'
import MissingCardsModal from './MissingCardsModal'
import StatisticsModal from './StatisticsModal'
import { supabase } from '../lib/supabaseClient'

export default function CardGrid({ session, targetUserId = null, readOnly = false, onBack, onExploreUsers }) {
    const [pokemonList, setPokemonList] = useState([])
    const [userCards, setUserCards] = useState({})
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [showCards, setShowCards] = useState(true)
    const [selectedPokemon, setSelectedPokemon] = useState(null)
    const [filterOwned, setFilterOwned] = useState('all')
    const [gridColumns, setGridColumns] = useState(3)
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    const [showMissingModal, setShowMissingModal] = useState(false)
    const [missingCards, setMissingCards] = useState([])
    const [showStatsModal, setShowStatsModal] = useState(false)
    const [targetUserProfile, setTargetUserProfile] = useState(null)

    useEffect(() => {
        fetchData()
        if (targetUserId) {
            fetchTargetUserProfile()
        }
    }, [targetUserId])

    const fetchTargetUserProfile = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', targetUserId)
                .single()

            if (!error && data) {
                setTargetUserProfile(data)
            }
        } catch (error) {
            console.error('Error fetching target user profile:', error)
        }
    }

    const fetchData = async () => {
        try {
            setLoading(true)
            const res = await fetch('https://pokeapi.co/api/v2/pokemon?limit=151')
            const data = await res.json()

            const enhancedList = data.results.map((p, index) => ({
                ...p,
                id: index + 1,
                sprites: {
                    front_default: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${index + 1}.png`
                }
            }))
            setPokemonList(enhancedList)
            fetchUserCards()
        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchUserCards = async () => {
        const userIdToFetch = targetUserId || session.user.id
        const { data, error } = await supabase
            .from('cards')
            .select('*')
            .eq('user_id', userIdToFetch)

        if (error) {
            console.error('Error fetching cards:', error)
        } else {
            const cardMap = {}
            data.forEach(card => {
                cardMap[card.pokemon_id] = card
            })
            setUserCards(cardMap)
        }
    }

    const filteredPokemon = pokemonList.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || String(p.id).includes(searchTerm)
        const userCard = userCards[p.id]
        const isOwned = userCard?.status === 'owned' || (!userCard?.status && userCard?.image_urls?.length > 0) // Fallback for old records

        if (filterOwned === 'owned' && !isOwned) return false
        if (filterOwned === 'missing' && isOwned) return false

        return matchesSearch
    })

    const stats = {
        total: 151,
        owned: Object.values(userCards).filter(c => c.status === 'owned' || (!c.status && c.image_urls?.length > 0)).length,
        percentage: Math.round((Object.values(userCards).filter(c => c.status === 'owned' || (!c.status && c.image_urls?.length > 0)).length / 151) * 100)
    }

    const handleExportMissing = () => {
        const missing = pokemonList.filter(p => {
            const userCard = userCards[p.id]
            const isOwned = userCard?.status === 'owned' || (!userCard?.status && userCard?.image_urls?.length > 0)
            return !isOwned
        })
        setMissingCards(missing)
        setShowMissingModal(true)
        setIsSidebarOpen(false)
    }

    const handleShowStats = () => {
        setShowStatsModal(true)
        setIsSidebarOpen(false)
    }

    return (
        <div className="min-h-screen bg-neutral-950 text-white pb-20">
            {/* Material App Bar */}
            <div className="sticky top-0 z-40 bg-neutral-900/95 backdrop-blur-lg border-b border-neutral-800 shadow-xl">
                <div className="max-w-7xl mx-auto px-4 py-2 space-y-2">
                    {/* Top Row */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {readOnly && onBack ? (
                                <button
                                    onClick={onBack}
                                    className="p-2 -ml-2 text-neutral-400 hover:text-white rounded-full hover:bg-neutral-800 transition-colors"
                                >
                                    <ArrowLeft className="w-6 h-6" />
                                </button>
                            ) : (
                                <button
                                    onClick={() => setIsSidebarOpen(true)}
                                    className="p-2 -ml-2 text-neutral-400 hover:text-white rounded-full hover:bg-neutral-800 transition-colors"
                                >
                                    <Menu className="w-6 h-6" />
                                </button>
                            )}

                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg">
                                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <circle cx="12" cy="12" r="3" />
                                    <circle cx="12" cy="12" r="6" fill="none" stroke="currentColor" strokeWidth="2" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-white">
                                    {readOnly && targetUserProfile
                                        ? `Collezione di ${targetUserProfile.display_name || targetUserProfile.email?.split('@')[0]}`
                                        : 'Kanto Tracker'
                                    }
                                </h1>
                                <p className="text-xs text-neutral-400">Pokémon Collection</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-2xl font-bold text-white">{stats.percentage}%</div>
                            <div className="text-xs text-neutral-400">{stats.owned} / {stats.total}</div>
                        </div>
                    </div>

                    {/* Search and Toggle */}
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                            <input
                                type="text"
                                placeholder="Search Pokémon..."
                                className="w-full pl-12 pr-4 py-3 bg-neutral-800 border border-neutral-700 rounded-full text-white placeholder-neutral-500 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={() => setShowCards(!showCards)}
                            className={`p-3 rounded-full transition-all ${showCards
                                ? 'bg-red-600 text-white shadow-lg'
                                : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white'
                                }`}
                        >
                            {showCards ? <ImageIcon className="w-5 h-5" /> : <Grid className="w-5 h-5" />}
                        </button>
                    </div>

                    {/* Filters and Slider Row */}
                    <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 scrollbar-hide">
                        <div className="flex gap-1.5 shrink-0">
                            {['all', 'owned', 'missing'].map(filter => (
                                <button
                                    key={filter}
                                    onClick={() => setFilterOwned(filter)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize whitespace-nowrap transition-all ${filterOwned === filter
                                        ? 'bg-red-600 text-white shadow-lg'
                                        : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white'
                                        }`}
                                >
                                    {filter}
                                </button>
                            ))}
                        </div>

                        {/* Column Slider */}
                        <div className="flex items-center gap-2 px-2 border-l border-neutral-800 pl-4 flex-1 min-w-0">
                            <button
                                onClick={() => setGridColumns(Math.min(3, gridColumns + 1))}
                                className="text-neutral-500 hover:text-white transition-colors focus:outline-none"
                            >
                                <ZoomOut className="w-4 h-4" />
                            </button>
                            <input
                                type="range"
                                min="1"
                                max="3"
                                step="1"
                                value={4 - gridColumns}
                                onChange={(e) => setGridColumns(4 - parseInt(e.target.value))}
                                className="w-full min-w-[2rem] h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-red-600"
                            />
                            <button
                                onClick={() => setGridColumns(Math.max(1, gridColumns - 1))}
                                className="text-neutral-500 hover:text-white transition-colors focus:outline-none"
                            >
                                <ZoomIn className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Grid */}
            <div className="max-w-7xl mx-auto p-4">
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-600 border-t-transparent"></div>
                    </div>
                ) : (
                    <div className={`grid gap-4 ${gridColumns === 1 ? 'grid-cols-1 max-w-md mx-auto' :
                        gridColumns === 2 ? 'grid-cols-2' :
                            'grid-cols-3'
                        }`}>
                        {filteredPokemon.map(pokemon => {
                            const userCard = userCards[pokemon.id]
                            const isOwned = userCard?.status === 'owned' || (!userCard?.status && userCard?.image_urls?.length > 0)
                            const fixSupabaseUrl = (url) => {
                                if (!url) return url
                                // Fix URLs for both 'Carte' and old 'pokemon-cards' bucket names
                                if (url.includes('/storage/v1/object/Carte/') && !url.includes('/public/')) {
                                    return url.replace('/object/Carte/', '/object/public/Carte/')
                                }
                                if (url.includes('/storage/v1/object/pokemon-cards/') && !url.includes('/public/')) {
                                    return url.replace('/object/pokemon-cards/', '/object/public/pokemon-cards/')
                                }
                                return url
                            }

                            const displayImage = (showCards && userCard?.image_urls?.length > 0)
                                ? fixSupabaseUrl(userCard.image_urls[userCard.cover_image_index || 0])
                                : pokemon.sprites.front_default

                            return (
                                <div
                                    key={pokemon.id}
                                    onClick={() => setSelectedPokemon(pokemon)}
                                    className={`relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 ${isOwned
                                        ? 'bg-neutral-900 ring-2 ring-red-500 shadow-lg shadow-red-500/20 hover:shadow-xl hover:shadow-red-500/30 hover:-translate-y-1'
                                        : 'bg-neutral-900/50 hover:bg-neutral-900 hover:shadow-lg hover:-translate-y-0.5'
                                        }`}
                                >
                                    <div className="absolute top-2 left-2 z-10 px-2 py-0.5 bg-black/60 backdrop-blur-sm rounded-full">
                                        <span className="text-[10px] font-mono text-white/80">
                                            #{String(pokemon.id).padStart(3, '0')}
                                        </span>
                                    </div>

                                    {(() => {
                                        if (!isOwned) return null

                                        const hasSingleImage = userCard?.image_urls?.length === 1
                                        const singleImageUrl = userCard?.image_urls?.[0]
                                        const hasMetadata = userCard?.card_metadata?.[singleImageUrl]?.type

                                        if (hasSingleImage && !hasMetadata) {
                                            return (
                                                <div className="absolute top-2 right-2 z-10 bg-yellow-500 rounded-full p-1 shadow-lg animate-pulse">
                                                    <AlertTriangle className="w-3 h-3 text-black" />
                                                </div>
                                            )
                                        }
                                        return null
                                    })()}

                                    <div className="absolute inset-0 flex items-center justify-center p-4">
                                        <img
                                            src={displayImage}
                                            alt={pokemon.name}
                                            className={`w-full h-full object-contain transition-all duration-300 ${!showCards || !isOwned ? 'pixelated opacity-80' : ''
                                                }`}
                                            loading="lazy"
                                        />
                                    </div>

                                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-3 pt-8">
                                        <p className="text-sm font-medium capitalize truncate text-white">
                                            {pokemon.name}
                                        </p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Modals */}
            <AnimatePresence>
                {selectedPokemon && (
                    readOnly ? (
                        <PokemonModalReadOnly
                            pokemon={selectedPokemon}
                            onClose={() => setSelectedPokemon(null)}
                            userCard={userCards[selectedPokemon.id]}
                        />
                    ) : (
                        <PokemonModal
                            pokemon={selectedPokemon}
                            onClose={() => setSelectedPokemon(null)}
                            userCard={userCards[selectedPokemon.id]}
                            onUpdate={fetchUserCards}
                            session={session}
                        />
                    )
                )}
            </AnimatePresence>

            <Sidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                onExportMissing={handleExportMissing}
                onShowStats={handleShowStats}
                onExploreUsers={onExploreUsers}
            />

            <MissingCardsModal
                isOpen={showMissingModal}
                onClose={() => setShowMissingModal(false)}
                missingCards={missingCards}
            />

            <StatisticsModal
                isOpen={showStatsModal}
                onClose={() => setShowStatsModal(false)}
                userCards={userCards}
            />
        </div>
    )
}
