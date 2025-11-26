import { useState, useEffect } from 'react'
import { Search, Filter, Grid, Image as ImageIcon } from 'lucide-react'
import PokemonModal from './PokemonModal'
import { supabase } from '../lib/supabaseClient'

export default function CardGrid({ session }) {
    const [pokemonList, setPokemonList] = useState([])
    const [userCards, setUserCards] = useState({})
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [showCards, setShowCards] = useState(false) // Global toggle
    const [selectedPokemon, setSelectedPokemon] = useState(null)
    const [filterOwned, setFilterOwned] = useState('all') // all, owned, missing

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            setLoading(true)
            // 1. Fetch 151 Pokemon
            const res = await fetch('https://pokeapi.co/api/v2/pokemon?limit=151')
            const data = await res.json()

            // Enhance with ID for easier lookup
            const enhancedList = data.results.map((p, index) => ({
                ...p,
                id: index + 1,
                sprites: {
                    front_default: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${index + 1}.png`
                }
            }))
            setPokemonList(enhancedList)

            // 2. Fetch User Cards
            fetchUserCards()

        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchUserCards = async () => {
        const { data, error } = await supabase
            .from('cards')
            .select('*')
            .eq('user_id', session.user.id)

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
        const isOwned = !!userCards[p.id]

        if (filterOwned === 'owned' && !isOwned) return false
        if (filterOwned === 'missing' && isOwned) return false

        return matchesSearch
    })

    const stats = {
        total: 151,
        owned: Object.keys(userCards).length,
        percentage: Math.round((Object.keys(userCards).length / 151) * 100)
    }

    return (
        <div className="min-h-screen bg-gray-950 text-gray-100 pb-20">
            {/* Sticky Header */}
            <div className="sticky top-0 z-40 bg-gray-900/90 backdrop-blur-md border-b border-gray-800 p-4 shadow-lg">
                <div className="max-w-7xl mx-auto space-y-4">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
                            Kanto Tracker
                        </h1>
                        <div className="text-xs font-mono text-gray-400">
                            {stats.owned} / {stats.total} ({stats.percentage}%)
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input
                                type="text"
                                placeholder="Search Pokémon..."
                                className="w-full pl-9 pr-4 py-2 bg-gray-800 rounded-lg border border-gray-700 focus:border-red-500 focus:outline-none text-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={() => setShowCards(!showCards)}
                            className={`p-2 rounded-lg border transition-colors ${showCards ? 'bg-red-500/10 border-red-500 text-red-500' : 'bg-gray-800 border-gray-700 text-gray-400'}`}
                        >
                            {showCards ? <ImageIcon className="w-5 h-5" /> : <Grid className="w-5 h-5" />}
                        </button>
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                        {['all', 'owned', 'missing'].map(filter => (
                            <button
                                key={filter}
                                onClick={() => setFilterOwned(filter)}
                                className={`px-3 py-1 rounded-full text-xs font-medium capitalize whitespace-nowrap transition-colors ${filterOwned === filter ? 'bg-white text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                            >
                                {filter}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Grid */}
            <div className="max-w-7xl mx-auto p-4">
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4">
                        {filteredPokemon.map(pokemon => {
                            const userCard = userCards[pokemon.id]
                            const isOwned = !!userCard
                            const displayImage = (showCards && isOwned && userCard.image_urls?.length > 0)
                                ? userCard.image_urls[userCard.cover_image_index || 0]
                                : pokemon.sprites.front_default

                            return (
                                <div
                                    key={pokemon.id}
                                    onClick={() => setSelectedPokemon(pokemon)}
                                    className={`relative aspect-square rounded-xl bg-gray-900 border transition-all cursor-pointer hover:scale-105 active:scale-95 overflow-hidden group ${isOwned ? 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.15)]' : 'border-gray-800 opacity-70 hover:opacity-100'}`}
                                >
                                    <div className="absolute top-1 left-2 text-[10px] font-mono text-gray-500 z-10">
                                        #{String(pokemon.id).padStart(3, '0')}
                                    </div>
                                    {isOwned && (
                                        <div className="absolute top-1 right-1 z-10">
                                            <div className="w-2 h-2 bg-red-500 rounded-full shadow-[0_0_5px_rgba(239,68,68,0.8)]"></div>
                                        </div>
                                    )}

                                    <div className="absolute inset-0 flex items-center justify-center p-2">
                                        <img
                                            src={displayImage}
                                            alt={pokemon.name}
                                            className={`w-full h-full object-contain transition-all duration-300 ${!showCards || !isOwned ? 'pixelated' : ''}`}
                                            loading="lazy"
                                        />
                                    </div>

                                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-2 pt-6">
                                        <div className="text-center text-xs font-medium capitalize truncate text-gray-300 group-hover:text-white">
                                            {pokemon.name}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Modal */}
            {selectedPokemon && (
                <PokemonModal
                    pokemon={selectedPokemon}
                    userCard={userCards[selectedPokemon.id]}
                    onClose={() => setSelectedPokemon(null)}
                    onUpdate={fetchUserCards}
                />
            )}
        </div>
    )
}
