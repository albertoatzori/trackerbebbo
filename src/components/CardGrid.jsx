import { useState, useEffect } from 'react'
import { Search, Grid, Image as ImageIcon, ZoomIn, ZoomOut, Menu, AlertTriangle, ArrowLeft, Filter, X, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import PokemonModal from './PokemonModal'
import PokemonModalReadOnly from './PokemonModalReadOnly'
import Sidebar from './Sidebar'
import MissingCardsModal from './MissingCardsModal'
import StatisticsModal from './StatisticsModal'
import GamblingModal from './GamblingModal'
import ChangelogModal from './ChangelogModal'
import CompanionModal, { COMPANIONS } from './CompanionModal'
import hoOhGif from '../assets/easter-egg/ho-oh.gif'
import sparklesGif from '../assets/easter-egg/sparkles.gif'
import pokeballLogo from '../assets/img/pokeball.png'
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
    const [showGamblingModal, setShowGamblingModal] = useState(false)
    const [showChangelogModal, setShowChangelogModal] = useState(false)
    const [targetUserProfile, setTargetUserProfile] = useState(null)
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
    const [advancedFilter, setAdvancedFilter] = useState(null)
    const [selectedPeople, setSelectedPeople] = useState([])
    const [showPersonSelector, setShowPersonSelector] = useState(false)

    const [tempSelectedPeople, setTempSelectedPeople] = useState([])
    const [showCompanionModal, setShowCompanionModal] = useState(false)
    const [selectedCompanionId, setSelectedCompanionId] = useState(() => localStorage.getItem('selectedCompanion') || null)
    const [showEasterEgg, setShowEasterEgg] = useState(false)



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

        if (advancedFilter) {

            // If advanced filter is active, only show cards that have at least one image matching the filter type
            if (!isOwned || !userCard.image_urls || userCard.image_urls.length === 0) return false

            const hasMatchingImage = userCard.image_urls.some(url => {
                const metadata = userCard.card_metadata?.[url]
                if (metadata?.type !== advancedFilter) return false

                // Sub-filter by person (only for scambiata/regalata)
                if ((advancedFilter === 'scambiata' || advancedFilter === 'regalata') && selectedPeople.length > 0) {
                    return selectedPeople.some(p => p.toLowerCase() === metadata.personName?.trim().toLowerCase())
                }
                return true
            })

            if (!hasMatchingImage) return false
        } else {
            if (filterOwned === 'owned' && !isOwned) return false
            if (filterOwned === 'missing' && isOwned) return false
        }

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

    const handleGambling = () => {
        const missing = pokemonList.filter(p => {
            const userCard = userCards[p.id]
            const isOwned = userCard?.status === 'owned' || (!userCard?.status && userCard?.image_urls?.length > 0)
            return !isOwned
        })
        setMissingCards(missing)
        setShowGamblingModal(true)
        setIsSidebarOpen(false)
    }

    const handleShowChangelog = () => {
        setShowChangelogModal(true)
        setIsSidebarOpen(false)
    }


    const capitalize = (str) => {
        if (!str) return ''
        return str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')
    }

    const handleCleanData = async () => {
        if (!confirm('Sei sicuro di voler pulire i dati? Questa operazione normalizzerà i nomi (es. ATZORI -> Atzori) e rimuoverà gli spazi extra.')) return

        try {
            setLoading(true)
            let updatedCount = 0

            for (const card of Object.values(userCards)) {
                if (!card.card_metadata) continue

                let needsUpdate = false
                const newMetadata = { ...card.card_metadata }

                Object.keys(newMetadata).forEach(url => {
                    const meta = newMetadata[url]
                    if (meta.personName) {
                        const normalized = capitalize(meta.personName.trim())
                        if (meta.personName !== normalized) {
                            meta.personName = normalized
                            needsUpdate = true
                        }
                    }
                    if (meta.expansionSet) {
                        const normalizedSet = meta.expansionSet.trim()
                        if (meta.expansionSet !== normalizedSet) {
                            meta.expansionSet = normalizedSet
                            needsUpdate = true
                        }
                    }
                })

                if (needsUpdate) {
                    const { error } = await supabase
                        .from('cards')
                        .update({ card_metadata: newMetadata })
                        .eq('user_id', session.user.id)
                        .eq('pokemon_id', card.pokemon_id)

                    if (error) {
                        console.error('Error updating card:', card.pokemon_id, error)
                    } else {
                        updatedCount++
                    }
                }
            }

            alert(`Pulizia completata! Aggiornate ${updatedCount} carte.`)
            fetchUserCards()

        } catch (error) {
            console.error('Error cleaning data:', error)
            alert('Errore durante la pulizia dei dati')
        } finally {
            setLoading(false)
        }
    }

    const getAvailablePeople = () => {
        if (advancedFilter !== 'scambiata' && advancedFilter !== 'regalata') return []

        const peopleMap = new Map() // Normalized -> Original (Title Case preferred)

        Object.values(userCards).forEach(card => {
            if (!card.image_urls) return
            card.image_urls.forEach(url => {
                const metadata = card.card_metadata?.[url]
                if (metadata?.type === advancedFilter && metadata?.personName) {
                    const cleanName = metadata.personName.trim()
                    const normalizedKey = cleanName.toLowerCase()

                    // We prefer the version that is already Title Cased if available, or we construct it
                    // Actually, let's just force Title Case for the list
                    const titleCased = capitalize(cleanName)
                    peopleMap.set(normalizedKey, titleCased)
                }
            })
        })
        return Array.from(peopleMap.values()).sort()
    }

    const availablePeople = getAvailablePeople()

    const handleOpenPersonSelector = () => {
        setTempSelectedPeople([...selectedPeople])
        setShowPersonSelector(true)
    }

    const handleTogglePerson = (person) => {
        if (tempSelectedPeople.includes(person)) {
            setTempSelectedPeople(tempSelectedPeople.filter(p => p !== person))
        } else {
            setTempSelectedPeople([...tempSelectedPeople, person])
        }
    }

    const handleSavePersonSelection = () => {
        setSelectedPeople(tempSelectedPeople)
        setShowPersonSelector(false)
    }

    const handleCompanionSelect = (id) => {
        setSelectedCompanionId(id)
        if (id) {
            localStorage.setItem('selectedCompanion', id)
        } else {
            localStorage.removeItem('selectedCompanion')
        }
    }

    const currentCompanion = COMPANIONS.find(c => c.id === selectedCompanionId)

    const handleStatFilterSelect = (filterType, personName = null) => {
        setShowStatsModal(false)
        setShowAdvancedFilters(true)
        setAdvancedFilter(filterType)
        if (personName) {
            setSelectedPeople([personName])
        } else {
            setSelectedPeople([])
        }
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

                            <div
                                className="w-10 h-10 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
                                onClick={() => setShowEasterEgg(true)}
                            >
                                <img src={pokeballLogo} alt="Logo" className="w-full h-full object-contain drop-shadow-md" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-xl font-bold text-white">
                                        {readOnly && targetUserProfile
                                            ? `Collezione di ${targetUserProfile.display_name || targetUserProfile.email?.split('@')[0]}`
                                            : 'Kanto Tracker'
                                        }
                                    </h1>
                                    {currentCompanion && !readOnly && (
                                        <div className="w-10 h-10 flex items-center justify-center">
                                            <img
                                                src={currentCompanion.src}
                                                alt={currentCompanion.name}
                                                className="w-full h-full object-contain drop-shadow-lg select-none"
                                            />
                                        </div>
                                    )}
                                </div>
                                <p className="text-xs text-neutral-400">Pokémon Collection</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-lg font-bold text-white">{stats.percentage}%</div>
                            <div className="text-[10px] text-neutral-400">{stats.owned} / {stats.total}</div>
                        </div>
                    </div>

                    {/* Search and Toggle */}
                    <div className="flex gap-2">
                        <div className="relative flex-1 flex gap-2">
                            <button
                                onClick={() => {
                                    setShowAdvancedFilters(!showAdvancedFilters)
                                    if (showAdvancedFilters) setAdvancedFilter(null) // Reset filter when closing
                                }}
                                className={`p-2.5 rounded-full transition-all shrink-0 ${showAdvancedFilters
                                    ? 'bg-red-600 text-white shadow-lg'
                                    : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white'
                                    }`}
                            >
                                <Filter className="w-5 h-5" />
                            </button>
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                                <input
                                    type="text"
                                    placeholder="Search Pokémon..."
                                    className="w-full pl-12 pr-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-full text-white placeholder-neutral-500 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <button
                            onClick={() => setShowCards(!showCards)}
                            className={`p-2.5 rounded-full transition-all ${showCards
                                ? 'bg-red-600 text-white shadow-lg'
                                : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white'
                                }`}
                        >
                            {showCards ? <ImageIcon className="w-5 h-5" /> : <Grid className="w-5 h-5" />}
                        </button>
                        <button
                            onClick={() => {
                                if (gridColumns === 3) setGridColumns(1)
                                else if (gridColumns === 1) setGridColumns(2)
                                else if (gridColumns === 2) setGridColumns(3)
                            }}
                            className="p-2.5 rounded-full bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white transition-all shadow-sm"
                        >
                            {gridColumns === 3 ? (
                                <ZoomIn className="w-5 h-5" />
                            ) : (
                                <ZoomOut className="w-5 h-5" />
                            )}
                        </button>
                    </div>

                    {/* Filters and Slider Row */}
                    <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 scrollbar-hide">
                        <div className="flex gap-1.5 shrink-0">
                            {showAdvancedFilters ? (
                                <>
                                    {['sbustata', 'comprata', 'scambiata', 'regalata'].map(filter => (
                                        <button
                                            key={filter}
                                            onClick={() => {
                                                setAdvancedFilter(advancedFilter === filter ? null : filter)
                                                setSelectedPeople([])
                                            }}
                                            className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize whitespace-nowrap transition-all ${advancedFilter === filter
                                                ? 'bg-red-600 text-white shadow-lg'
                                                : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white'
                                                }`}
                                        >
                                            {filter}
                                        </button>
                                    ))}
                                </>
                            ) : (
                                <>
                                    {['all', 'owned', 'missing'].map(filter => (
                                        <button
                                            key={filter}
                                            onClick={() => setFilterOwned(filter)}
                                            className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize whitespace-nowrap transition-all ${filterOwned === filter
                                                ? 'bg-red-600 text-white shadow-lg'
                                                : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white'
                                                }`}
                                        >
                                            {filter}
                                        </button>
                                    ))}
                                </>
                            )}
                        </div>


                    </div>

                    {/* Secondary Filter Bar (Scambiata/Regalata) */}
                    {
                        (advancedFilter === 'scambiata' || advancedFilter === 'regalata') && (
                            <div className="flex items-center gap-2 overflow-hidden py-1">
                                <div className="flex gap-1.5 shrink-0 pr-2 border-r border-neutral-800">
                                    <button
                                        onClick={() => setSelectedPeople([])}
                                        className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${selectedPeople.length === 0
                                            ? 'bg-white text-black'
                                            : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white'
                                            }`}
                                    >
                                        Tutti
                                    </button>
                                    <button
                                        onClick={handleOpenPersonSelector}
                                        className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${selectedPeople.length > 0 || showPersonSelector
                                            ? 'bg-white text-black'
                                            : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white'
                                            }`}
                                    >
                                        Personalizza {selectedPeople.length > 0 && `(${selectedPeople.length})`}
                                    </button>
                                </div>
                                <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
                                    {selectedPeople.map(person => (
                                        <span key={person} className="px-2 py-1 bg-neutral-800 text-white text-[10px] rounded-md whitespace-nowrap border border-neutral-700">
                                            {person}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )
                    }
                </div >
            </div >

            {/* Grid */}
            < div className="max-w-7xl mx-auto p-4" >
                {
                    loading ? (
                        <div className="flex justify-center py-20" >
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

                                // Calculate matching image for stats/filter
                                let matchingUrl = null
                                let metadata = null

                                if (isOwned && advancedFilter) {
                                    const cardMetadata = userCard?.card_metadata
                                    let matchFound = false

                                    // First check cover image
                                    let coverUrl = userCard.image_urls[userCard.cover_image_index || 0]
                                    let coverMetadata = cardMetadata?.[coverUrl]

                                    if (coverMetadata?.type === advancedFilter) {
                                        if (selectedPeople.length === 0 || selectedPeople.some(p => p.toLowerCase() === coverMetadata.personName?.trim().toLowerCase())) {
                                            matchingUrl = coverUrl
                                            metadata = coverMetadata
                                            matchFound = true
                                        }
                                    }

                                    // If cover doesn't match, find the first valid one
                                    if (!matchFound) {
                                        let foundUrl = userCard.image_urls.find(url => {
                                            const m = cardMetadata?.[url]
                                            if (m?.type !== advancedFilter) return false
                                            if (selectedPeople.length > 0 && (advancedFilter === 'scambiata' || advancedFilter === 'regalata')) {
                                                return selectedPeople.some(p => p.toLowerCase() === m.personName?.trim().toLowerCase())
                                            }
                                            return true
                                        })
                                        if (foundUrl) {
                                            matchingUrl = foundUrl
                                            metadata = cardMetadata?.[foundUrl]
                                        }
                                    }
                                }

                                const displayImage = (showCards && userCard?.image_urls?.length > 0)
                                    ? fixSupabaseUrl(matchingUrl || userCard.image_urls[userCard.cover_image_index || 0])
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
                                        <div className="absolute top-2 left-2 z-10 px-1.5 py-0.5 bg-black/60 backdrop-blur-sm rounded-full flex items-center gap-1.5 max-w-[calc(100%-16px)]">
                                            <span className="text-[10px] font-mono text-white/60">
                                                #{String(pokemon.id).padStart(3, '0')}
                                            </span>
                                            <span className="text-[10px] font-bold text-white capitalize truncate leading-tight pb-[1px]">
                                                {pokemon.name}
                                            </span>
                                        </div>

                                        {(() => {
                                            if (!isOwned) return null

                                            // Advanced Filter Info Badge
                                            if (advancedFilter && metadata) {
                                                let infoText = ''
                                                if (advancedFilter === 'comprata' && metadata.price) {
                                                    infoText = `€${metadata.price}`
                                                } else if ((advancedFilter === 'scambiata' || advancedFilter === 'regalata') && metadata.personName) {
                                                    infoText = metadata.personName
                                                }

                                                if (infoText) {
                                                    return (
                                                        <div className="absolute bottom-2 left-2 z-10 px-1.5 py-0.5 bg-red-600/90 backdrop-blur-sm rounded-full shadow-md max-w-[calc(100%-16px)]">
                                                            <span className="text-[10px] font-bold font-mono text-white truncate block leading-tight pb-[1px]">
                                                                {infoText}
                                                            </span>
                                                        </div>
                                                    )
                                                }
                                            }

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

                                    </div>
                                )
                            })}
                        </div>
                    )
                }
            </div >

            {/* Modals */}
            < AnimatePresence >
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
            </AnimatePresence >

            <Sidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                onExportMissing={handleExportMissing}
                onShowStats={handleShowStats}
                onExploreUsers={onExploreUsers}
                onGambling={handleGambling}
                onCleanData={handleCleanData}
                onShowChangelog={handleShowChangelog}
                onCompanion={() => {
                    setShowCompanionModal(true)
                    setIsSidebarOpen(false)
                }}
            />

            <CompanionModal
                isOpen={showCompanionModal}
                onClose={() => setShowCompanionModal(false)}
                onSelect={handleCompanionSelect}
                currentCompanion={selectedCompanionId}
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
                onSelectFilter={handleStatFilterSelect}
            />

            <GamblingModal
                isOpen={showGamblingModal}
                onClose={() => setShowGamblingModal(false)}
                missingCards={missingCards}
                session={session}
            />

            <ChangelogModal
                isOpen={showChangelogModal}
                onClose={() => setShowChangelogModal(false)}
            />

            {/* Person Selector Modal */}
            <AnimatePresence>
                {showPersonSelector && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-neutral-900 rounded-2xl border border-neutral-800 shadow-2xl w-full max-w-sm overflow-hidden flex flex-col max-h-[80vh]"
                        >
                            <div className="p-4 border-b border-neutral-800 flex justify-between items-center bg-neutral-900">
                                <h3 className="text-lg font-bold text-white">Seleziona Persone</h3>
                                <button
                                    onClick={() => setShowPersonSelector(false)}
                                    className="text-neutral-400 hover:text-white"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-2">
                                {availablePeople.length > 0 ? (
                                    <div className="space-y-1">
                                        {availablePeople.map(person => (
                                            <div
                                                key={person}
                                                onClick={() => handleTogglePerson(person)}
                                                className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors ${tempSelectedPeople.includes(person)
                                                    ? 'bg-neutral-800 border border-red-500/50'
                                                    : 'hover:bg-neutral-800 border border-transparent'
                                                    }`}
                                            >
                                                <span className="text-sm font-medium text-white">{person}</span>
                                                {tempSelectedPeople.includes(person) && (
                                                    <div className="bg-red-600 rounded-full p-1">
                                                        <Check className="w-3 h-3 text-white" />
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-neutral-500 text-sm">
                                        Nessuna persona trovata per questo filtro.
                                    </div>
                                )}
                            </div>

                            <div className="p-4 border-t border-neutral-800 bg-neutral-900 flex gap-2">
                                <button
                                    onClick={() => setShowPersonSelector(false)}
                                    className="flex-1 py-2 rounded-lg text-sm font-medium text-neutral-400 hover:text-white transition-colors"
                                >
                                    Chiudi
                                </button>
                                <button
                                    onClick={handleSavePersonSelection}
                                    className="flex-1 py-2 bg-white text-black rounded-lg text-sm font-bold hover:bg-neutral-200 transition-colors"
                                >
                                    Salva ({tempSelectedPeople.length})
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Easter Egg Animation */}
            <AnimatePresence>
                {showEasterEgg && (
                    <motion.div
                        initial={{ x: '100vw', top: '62.5%', scale: 0.5, rotate: 3 }}
                        animate={{ x: '-100vw', top: '37.5%', scale: 1, rotate: 3 }}
                        exit={{ x: '-100vw' }}
                        transition={{ duration: 4, ease: "linear" }}
                        onAnimationComplete={() => setShowEasterEgg(false)}
                        className="fixed left-0 z-[100] pointer-events-none w-64 h-64"
                    >
                        <div className="relative w-full h-full">
                            <img
                                src={hoOhGif}
                                alt="Ho-Oh"
                                className="absolute inset-0 w-full h-full object-contain z-20"
                            />
                            <img
                                src={sparklesGif}
                                alt="Sparkles"
                                className="absolute inset-0 w-full h-full object-contain z-10 scale-150 opacity-80 mix-blend-screen"
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div >
    )
}
