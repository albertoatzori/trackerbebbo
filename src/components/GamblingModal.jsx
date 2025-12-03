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
    const [hasPlayedToday, setHasPlayedToday] = useState(false)
    const animationRef = useRef(null)
    const isBackNavigation = useRef(false)
    const pushedState = useRef(false)

    useEffect(() => {
        if (isOpen) {
            isBackNavigation.current = false
            pushedState.current = false

            const handlePopState = () => {
                // User pressed back button
                isBackNavigation.current = true
                onClose()
            }

            // Delay adding listener to avoid Strict Mode double-mount issue
            const timer = setTimeout(() => {
                window.history.pushState(null, '', window.location.href)
                pushedState.current = true
                window.addEventListener('popstate', handlePopState)
            }, 50)

            return () => {
                clearTimeout(timer)
                window.removeEventListener('popstate', handlePopState)

                // If closed manually (not by back button), remove the history state we pushed
                if (!isBackNavigation.current && pushedState.current) {
                    window.history.back()
                }
            }
        }
    }, [isOpen])

    useEffect(() => {
        if (isOpen) {
            setGameState('idle')
            setCurrentPokemon(null)
            setTargetPokemon(null)
            setFoundCard(null)
            setSearchingCard(false)
            setCardError(null)

            // Check if user has played today
            const lastPlayed = localStorage.getItem('gambling_last_played')
            const today = new Date().toISOString().split('T')[0]
            if (lastPlayed === today) {
                setHasPlayedToday(true)
            } else {
                setHasPlayedToday(false)
            }
        }
    }, [isOpen])

    // Lock body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }
        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [isOpen])

    const fetchCard = async (pokemonData) => {
        setSearchingCard(true)
        setCardError(null)

        try {
            // TCGDex Rarities Filter
            const raritiesDB = [
                "None",
                "Ultra rare",
                "Illustration rare",
                "Special illustration rare",
            ]

            console.log(`🔍 TCGDex - Searching for: ${pokemonData.name}`)

            // 1. Search for cards by name
            const searchResponse = await fetch(`https://api.tcgdex.net/v2/en/cards?name=${encodeURIComponent(pokemonData.name)}`)

            if (!searchResponse.ok) {
                throw new Error(`TCGDex Search Error: ${searchResponse.status}`)
            }

            const searchResult = await searchResponse.json()

            // TCGDex returns an array of cards directly or an object with data? 
            // Documentation says it returns an array of cards for this endpoint usually, 
            // but let's handle if it's wrapped.
            const cards = Array.isArray(searchResult) ? searchResult : (searchResult.cards || [])

            console.log(`🔍 TCGDex - Found ${cards.length} potential cards`)

            if (cards.length === 0) {
                console.warn("🔍 TCGDex - No cards found.")
                setCardError("Non esiste una full art!")
                return
            }

            // 2. Shuffle cards to pick a random winner efficiently
            // We shuffle FIRST, then check details one by one until we find a match.
            // This avoids fetching details for ALL cards (which would be slow).
            const shuffledCards = cards.sort(() => 0.5 - Math.random())

            let validCard = null

            // 3. Iterate and check details
            for (const cardSummary of shuffledCards) {
                // Skip if it doesn't have an ID (shouldn't happen)
                if (!cardSummary.id) continue

                try {
                    // Fetch details
                    const detailResponse = await fetch(`https://api.tcgdex.net/v2/en/cards/${cardSummary.id}`)
                    if (!detailResponse.ok) continue

                    const cardDetail = await detailResponse.json()

                    // Check Rarity
                    // TCGDex rarity is an object or string? Usually string in 'rarity' field
                    // Let's log it to be sure during debug
                    // console.log(`🔍 Checking ${cardDetail.name} (${cardDetail.id}) - Rarity: ${cardDetail.rarity}`)

                    if (raritiesDB.includes(cardDetail.rarity)) {
                        // Special check for "None" rarity: must be from a "Promo" set
                        if (cardDetail.rarity === "None") {
                            const setName = cardDetail.set?.name?.toLowerCase() || ""
                            if (!setName.includes("promo")) {
                                continue // Skip this card
                            }
                        }

                        // Found a match!
                        console.log("🔍 TCGDex - MATCH FOUND!", cardDetail)

                        // Construct image URL: base + /high.webp
                        // TCGDex usually provides 'image' field with base url
                        const imageUrl = cardDetail.image ? `${cardDetail.image}/high.webp` : null

                        if (imageUrl) {
                            validCard = {
                                ...cardDetail,
                                images: { large: imageUrl }, // Map to our expected format
                                rarity: cardDetail.rarity
                            }
                            break // Stop searching
                        }
                    }
                } catch (err) {
                    console.warn(`Skipping card ${cardSummary.id} due to error`, err)
                }
            }

            if (validCard) {
                setFoundCard(validCard)
            } else {
                console.warn("🔍 TCGDex - No cards matched the rarity filter.")
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
                    // Animation finished, show the winner sprite first
                    setCurrentPokemon(targetPokemon)
                    setGameState('winner_reveal')

                    // Wait 2 seconds then show the card result
                    setTimeout(() => {
                        setGameState('result')
                    }, 2000)
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
        if (hasPlayedToday) return

        // Save today's date to localStorage
        const today = new Date().toISOString().split('T')[0]
        localStorage.setItem('gambling_last_played', today)
        setHasPlayedToday(true)

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
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-neutral-900 rounded-3xl border border-neutral-800 shadow-2xl w-full max-w-md overflow-hidden relative max-h-[85vh] overflow-y-auto"
            >
                <div className="p-6 flex flex-col items-center text-center space-y-4">

                    {/* Header / Title */}
                    <div className="space-y-2">
                        {gameState !== 'result' && (
                            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg mb-4">
                                <Dices className="w-8 h-8 text-white" />
                            </div>
                        )}
                        <h2 className={`font-bold text-white ${gameState === 'result' ? 'text-lg' : 'text-2xl'}`}>
                            {gameState === 'idle' && !hasPlayedToday && "Pronto a sborsare?"}
                            {gameState === 'idle' && hasPlayedToday && "Torna domani!"}
                            {gameState === 'animating' && "Estraendo..."}
                            {gameState === 'winner_reveal' && "Hai trovato!"}
                            {gameState === 'result' && foundCard && "Oggi compra questa carta e torna domani!"}
                            {gameState === 'result' && cardError && "Oggi si risparmia!"}
                        </h2>
                        <p className="text-neutral-400 text-sm">
                            {gameState === 'idle' && !hasPlayedToday && `Hai ${missingCards.length} Pokémon mancanti. Vediamo chi esce!`}
                            {gameState === 'idle' && hasPlayedToday && "Per oggi hai già usato la funzione Gambling, torna domani."}
                            {gameState === 'animating' && "Chi sarà?"}
                            {gameState === 'winner_reveal' && "Aggiungilo alla tua lista desideri!"}
                        </p>
                    </div>

                    {/* Main Content Area */}
                    <div className="relative flex flex-col items-center gap-6 w-full">

                        {/* Pokemon Sprite - Show only during animation or winner reveal */}
                        {(gameState === 'idle' || gameState === 'animating' || gameState === 'winner_reveal') && (
                            <div className="relative w-32 h-32 flex items-center justify-center bg-neutral-800/50 rounded-full border-4 border-neutral-800">
                                {gameState === 'idle' ? (
                                    <div className="text-6xl">❓</div>
                                ) : (
                                    currentPokemon && (
                                        <motion.div
                                            key={currentPokemon.id}
                                            initial={gameState === 'animating' ? { scale: 0.8, opacity: 0.5 } : { scale: 0, rotate: -180 }}
                                            animate={gameState === 'animating' ? { scale: 1, opacity: 1 } : { scale: 1.2, rotate: 0 }}
                                            transition={gameState === 'winner_reveal' ? { type: "spring", damping: 12 } : { duration: 0.1 }}
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
                        )}

                        {/* Winner Name - Show only during winner reveal */}
                        {gameState === 'winner_reveal' && currentPokemon && (
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

                        {/* Card Display Area - Show only in result state */}
                        {gameState === 'result' && (
                            <div className="w-full flex flex-col items-center gap-4">
                                {searchingCard ? (
                                    <div className="flex flex-col items-center gap-2 text-neutral-400 py-10">
                                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-500 border-t-transparent"></div>
                                        <span className="text-sm">Cercando una Full Art...</span>
                                    </div>
                                ) : foundCard ? (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.8, rotateY: 90 }}
                                        animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                                        transition={{ type: "spring", damping: 15 }}
                                        className="relative group perspective-1000 flex flex-col items-center gap-4 w-full"
                                    >
                                        {/* Shining Effect */}
                                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-3/4 bg-gradient-to-r from-yellow-400 via-purple-500 to-blue-500 rounded-xl opacity-50 blur-xl group-hover:opacity-75 transition duration-1000 animate-pulse -z-10"></div>

                                        <motion.img
                                            src={foundCard.images.large}
                                            alt={foundCard.name}
                                            className="relative w-auto h-auto max-h-[50vh] rounded-xl z-10 object-contain"
                                            animate={{
                                                boxShadow: [
                                                    "0 0 0px rgba(168, 85, 247, 0)",
                                                    "0 0 20px rgba(168, 85, 247, 0.6)",
                                                    "0 0 0px rgba(168, 85, 247, 0)"
                                                ]
                                            }}
                                            transition={{
                                                duration: 2,
                                                repeat: Infinity,
                                                ease: "easeInOut"
                                            }}
                                        />

                                        <div className="flex flex-col items-center gap-2 w-full">
                                            <div className="flex items-center gap-2 text-sm text-neutral-400 bg-neutral-800/50 px-3 py-1 rounded-full border border-neutral-700">
                                                <span className="font-medium text-white">{foundCard.rarity}</span>
                                                <span>•</span>
                                                <span>{foundCard.set.name}</span>
                                            </div>

                                            <a
                                                href={`https://www.google.com/search?q=${encodeURIComponent(foundCard.name)}+${foundCard.localId}%2F${foundCard.set.cardCount.official}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1 mt-1"
                                            >
                                                Cerca su Google ↗
                                            </a>
                                        </div>
                                    </motion.div>
                                ) : cardError ? (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="text-neutral-500 italic py-10"
                                    >
                                        {cardError}
                                    </motion.div>
                                ) : null}
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="w-full pt-2 flex justify-center">
                        {gameState === 'idle' && !hasPlayedToday && (
                            <button
                                onClick={handleStart}
                                disabled={missingCards.length === 0}
                                className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg transform transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Vai!
                            </button>
                        )}
                    </div>

                </div>
            </motion.div>

            {/* Bottom Close Button - Outside the card - Always visible */}
            <button
                onClick={onClose}
                className="mt-6 p-2 bg-neutral-800 hover:bg-neutral-700 rounded-full transition-colors shadow-lg border border-neutral-700 group"
            >
                <X className="w-6 h-6 text-neutral-400 group-hover:text-white transition-colors" />
            </button>
        </div>
    )
}
