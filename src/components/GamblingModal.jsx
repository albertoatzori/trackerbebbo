import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Dices, RefreshCw, Sparkles } from 'lucide-react'

export default function GamblingModal({ isOpen, onClose, missingCards }) {
    const [gameState, setGameState] = useState('idle') // idle, animating, result
    const [currentPokemon, setCurrentPokemon] = useState(null)
    const [targetPokemon, setTargetPokemon] = useState(null)
    const [foundCard, setFoundCard] = useState(null)
    const [searchingCard, setSearchingCard] = useState(false)
    const [cardError, setCardError] = useState(null)
    const animationRef = useRef(null)

    useEffect(() => {
        if (isOpen) {
            setGameState('idle')
            setCurrentPokemon(null)
            setTargetPokemon(null)
            setFoundCard(null)
            setSearchingCard(false)
            setCardError(null)
        }
    }, [isOpen])

    const fetchCard = async (pokemonData) => {
        setSearchingCard(true)
        setCardError(null)

        try {
            // Reduced rarities list as requested by user to improve performance
            const rarities = [
                "Amazing Rare",
                "Promo",
                "Rare Holo",
                "Rare Holo EX",
                "Rare Holo GX",
                "Rare Holo LV.X",
                "Rare Holo Star",
                "Rare Holo V",
                "Rare Holo VMAX",
                "Rare Secret",
                "Rare Ultra"
            ]

            // Construct query with server-side filtering
            // Format: name:"charizard" (rarity:"Rare Holo" OR rarity:"Promo" ...)
            const rarityQuery = rarities.map(r => `rarity:"${r}"`).join(" OR ")
            const query = `name:"${pokemonData.name}" (${rarityQuery})`

            console.log("🔍 Gambling Debug - Query:", query)

            // Use proxy path. 
            // We still use a relatively high pageSize just in case, but the server-side filter should drastically reduce results.
            const response = await fetch(`/api/tcg/cards?q=${encodeURIComponent(query)}&pageSize=50&orderBy=-set.releaseDate`)

            console.log("🔍 Gambling Debug - Response Status:", response.status)

            if (response.status === 404) {
                console.warn("🔍 Gambling Debug - 404 Not Found (No cards match query)")
                setCardError("Non esiste una full art!")
                return
            }

            if (response.status === 504) {
                console.warn("🔍 Gambling Debug - 504 Gateway Timeout")
                setCardError("L'API ha impiegato troppo tempo. Riprova!")
                return
            }

            if (!response.ok) {
                const rawText = await response.text()
                console.error("🔍 Gambling Debug - Error Response:", rawText)
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            const result = await response.json()
            console.log("🔍 Gambling Debug - API Result Count:", result.data ? result.data.length : 0)

            if (result.data && result.data.length > 0) {
                // Since we filtered server-side, all returned cards are valid "hits".
                // We can just pick one random card from the result.
                const randomCard = result.data[Math.floor(Math.random() * result.data.length)]
                console.log("🔍 Gambling Debug - Selected Card:", randomCard)
                setFoundCard(randomCard)
            } else {
                console.warn("🔍 Gambling Debug - No cards found for this pokemon with specified rarities.")
                setCardError("Non esiste una full art!")
            }
        } catch (error) {
            console.error("Error fetching card:", error)
            setCardError("Errore nel recupero della carta")
        } finally {
            setSearchingCard(false)
        }
    }

    useEffect(() => {
        if (gameState === 'animating') {
            let speed = 50
            let duration = 0
            const maxDuration = 3000 // 3 seconds total animation

            const animate = () => {
                // Pick random pokemon from missing list for visual effect
                const random = missingCards[Math.floor(Math.random() * missingCards.length)]
                setCurrentPokemon(random)

                duration += speed

                // Slow down as we approach the end
                if (duration > 2000) speed += 20
                if (duration > 2500) speed += 50

                if (duration < maxDuration) {
                    animationRef.current = setTimeout(animate, speed)
                } else {
                    // Animation finished, show the winner
                    setCurrentPokemon(targetPokemon)
                    setGameState('result')
                }
            }

            animate()

            return () => {
                if (animationRef.current) clearTimeout(animationRef.current)
            }
        }
    }, [gameState, missingCards, targetPokemon])


    const handleStart = () => {
        if (missingCards.length === 0) return

        // 1. Decide winner immediately
        const winner = missingCards[Math.floor(Math.random() * missingCards.length)]
        setTargetPokemon(winner)

        // 2. Start animation
        setGameState('animating')
        setFoundCard(null)
        setCardError(null)

        // 3. Start fetching immediately (pre-fetch)
        fetchCard(winner)
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-neutral-900 rounded-3xl border border-neutral-800 shadow-2xl w-full max-w-md overflow-hidden relative"
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 bg-neutral-800/50 hover:bg-neutral-700 rounded-full transition-colors z-10"
                >
                    <X className="w-5 h-5 text-neutral-400 hover:text-white" />
                </button>

                <div className="p-8 flex flex-col items-center text-center space-y-6">

                    {/* Header / Title */}
                    <div className="space-y-2">
                        <div className="w-16 h-16 mx-auto bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg mb-4">
                            <Dices className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-white">
                            {gameState === 'idle' && "Tentiamo la fortuna?"}
                            {gameState === 'animating' && "Estraendo..."}
                            {gameState === 'result' && "Hai trovato!"}
                        </h2>
                        <p className="text-neutral-400 text-sm">
                            {gameState === 'idle' && `Hai ${missingCards.length} Pokémon mancanti. Vediamo chi esce!`}
                            {gameState === 'animating' && "Chi sarà?"}
                            {gameState === 'result' && "Aggiungilo alla tua lista desideri!"}
                        </p>
                    </div>

                    {/* Main Content Area */}
                    <div className="relative flex flex-col items-center gap-6">
                        {/* Pokemon Sprite */}
                        <div className="relative w-32 h-32 flex items-center justify-center bg-neutral-800/50 rounded-full border-4 border-neutral-800">
                            {gameState === 'idle' ? (
                                <div className="text-6xl">❓</div>
                            ) : (
                                currentPokemon && (
                                    <motion.div
                                        key={currentPokemon.id}
                                        initial={gameState === 'animating' ? { scale: 0.8, opacity: 0.5 } : { scale: 0, rotate: -180 }}
                                        animate={gameState === 'animating' ? { scale: 1, opacity: 1 } : { scale: 1.2, rotate: 0 }}
                                        transition={gameState === 'result' ? { type: "spring", damping: 12 } : { duration: 0.1 }}
                                    >
                                        <img
                                            src={currentPokemon.sprites.front_default}
                                            alt={currentPokemon.name}
                                            className="w-24 h-24 object-contain pixelated"
                                        />
                                    </motion.div>
                                )
                            )}
                        </div>

                        {/* Result Name */}
                        {gameState === 'result' && currentPokemon && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-neutral-800 px-4 py-2 rounded-xl"
                            >
                                <span className="text-xl font-bold text-white capitalize">
                                    {currentPokemon.name}
                                </span>
                                <span className="text-neutral-500 ml-2 font-mono">
                                    #{String(currentPokemon.id).padStart(3, '0')}
                                </span>
                            </motion.div>
                        )}

                        {/* Card Display Area */}
                        {gameState === 'result' && (
                            <div className="min-h-[300px] w-full flex items-center justify-center">
                                {searchingCard ? (
                                    <div className="flex flex-col items-center gap-2 text-neutral-400">
                                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-500 border-t-transparent"></div>
                                        <span className="text-sm">Cercando una Full Art...</span>
                                    </div>
                                ) : foundCard ? (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.8, rotateY: 90 }}
                                        animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                                        transition={{ type: "spring", damping: 15 }}
                                        className="relative group perspective-1000"
                                    >
                                        {/* Shining Effect */}
                                        <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 via-purple-500 to-blue-500 rounded-xl opacity-75 blur-lg group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse"></div>

                                        <img
                                            src={foundCard.images.large}
                                            alt={foundCard.name}
                                            className="relative w-64 rounded-xl shadow-2xl z-10"
                                        />

                                        <div className="absolute -bottom-8 left-0 right-0 text-center">
                                            <span className="text-xs text-neutral-400 bg-black/50 px-2 py-1 rounded-full">
                                                {foundCard.rarity}
                                            </span>
                                        </div>
                                    </motion.div>
                                ) : cardError ? (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="text-neutral-500 italic"
                                    >
                                        {cardError}
                                    </motion.div>
                                ) : null}
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="w-full pt-4">
                        {gameState === 'idle' && (
                            <button
                                onClick={handleStart}
                                disabled={missingCards.length === 0}
                                className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg transform transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Vai!
                            </button>
                        )}

                        {gameState === 'result' && (
                            <div className="flex gap-3">
                                <button
                                    onClick={onClose}
                                    className="flex-1 py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-medium rounded-xl transition-colors"
                                >
                                    Chiudi
                                </button>
                                <button
                                    onClick={handleStart}
                                    className="flex-1 py-3 bg-white hover:bg-neutral-200 text-black font-bold rounded-xl shadow-lg flex items-center justify-center gap-2"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Riprova
                                </button>
                            </div>
                        )}
                    </div>

                </div>
            </motion.div>
        </div>
    )
}
