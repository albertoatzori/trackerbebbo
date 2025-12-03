import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Dices, RefreshCw, Sparkles } from 'lucide-react'

export default function GamblingModal({ isOpen, onClose, missingCards, session }) {
    const [gameState, setGameState] = useState('idle') // idle, animating, result
    const [currentPokemon, setCurrentPokemon] = useState(null)
    const [targetPokemon, setTargetPokemon] = useState(null)
    const [foundCard, setFoundCard] = useState(null)
    const [searchingCard, setSearchingCard] = useState(false)
    const [cardError, setCardError] = useState(null)
    const [warningMessage, setWarningMessage] = useState(null)
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
            setWarningMessage(null)

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
        setWarningMessage(null)

        try {
            let searchName = pokemonData.name;
            // Fix for Mr. Mime
            if (searchName === 'Mr-Mime') {
                searchName = 'Mr. Mime';
            }
            // Fix for Farfetch'd
            if (searchName === 'Farfetchd') {
                searchName = "Farfetch'd";
            }

            console.log(`🔍 TCGDex - Searching for: ${searchName}`)

            // 1. Search for cards by name
            const searchResponse = await fetch(`https://api.tcgdex.net/v2/en/cards?name=${encodeURIComponent(searchName)}`)

            if (!searchResponse.ok) {
                throw new Error(`TCGDex Search Error: ${searchResponse.status}`)
            }

            const searchResult = await searchResponse.json()

            // TCGDex returns an array of cards directly or an object with data? 
            let cards = Array.isArray(searchResult) ? searchResult : (searchResult.cards || [])

            // Filter out unwanted cards
            cards = cards.filter(card => {
                const nameLower = card.name.toLowerCase();
                const searchLower = searchName.toLowerCase();

                // 0. Strict Name Check (Word Boundary)
                const escapedSearch = searchLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const wordRegex = new RegExp(`\\b${escapedSearch}\\b`, 'i');

                if (!wordRegex.test(nameLower)) {
                    return false;
                }

                // Filter specific names
                if (nameLower.includes('mega') || nameLower.includes('galarian') || nameLower.includes('alolan') || nameLower.includes('hisuian') || nameLower.includes('paldean')) {
                    return false;
                }

                // Filter Porygon evolutions if searching for Porygon
                if (searchName.toLowerCase() === 'porygon') {
                    if (nameLower.includes('porygon-z') || nameLower.includes('porygon2')) {
                        return false;
                    }
                }

                return true;
            });

            if (cards.length === 0) {
                console.warn("🔍 TCGDex - No cards found.")
                setCardError("Non esiste una full art!")
                return
            }

            // 2. Fetch details for ALL filtered cards in parallel
            // We limit to 200 to be safe, but we want "all" cards.
            const candidates = cards.slice(0, 200);

            const detailPromises = candidates.map(async (cardSummary) => {
                if (!cardSummary.id) return null;
                try {
                    const res = await fetch(`https://api.tcgdex.net/v2/en/cards/${cardSummary.id}`);
                    if (!res.ok) return null;
                    return await res.json();
                } catch (err) {
                    console.warn(`Error fetching details for ${cardSummary.id}`, err);
                    return null;
                }
            });

            const detailsResults = await Promise.all(detailPromises);
            const validDetails = detailsResults.filter(d => d !== null);

            // 3. Classify cards by Pools
            let poolIllustration = [] // "Illustration rare"
            let poolSpecialIllustration = [] // "Special illustration rare"
            let poolNone = [] // "None"
            let poolUltraRare = [] // "Ultra rare"
            let poolOthers = [] // Everything else

            const excludedRarities = ["Crown", "Four Diamond", "One Diamond", "One Shiny", "One Star", "Three Diamond", "Three Star", "Two Diamond", "Two Shiny", "Two Star"]

            for (const cardDetail of validDetails) {
                // Check if it's a Trainer card
                if (cardDetail.category === 'Trainer' || cardDetail.supertype === 'Trainer') {
                    continue;
                }

                // Check Set Name for Promos-A, Promos-B, etc.
                const setName = cardDetail.set?.name || "";
                if (/Promos-[A-Z]/.test(setName)) {
                    continue;
                }

                // Construct image URL
                const imageUrl = cardDetail.image ? `${cardDetail.image}/high.webp` : null
                if (!imageUrl) continue

                const validCard = {
                    ...cardDetail,
                    images: { large: imageUrl },
                    rarity: cardDetail.rarity
                }

                const rarity = cardDetail.rarity

                if (excludedRarities.includes(rarity)) continue

                if (rarity === "Illustration rare") {
                    poolIllustration.push(validCard)
                } else if (rarity === "Special illustration rare") {
                    poolSpecialIllustration.push(validCard)
                } else if (rarity === "None") {
                    poolNone.push(validCard)
                } else if (rarity === "Ultra rare") {
                    poolUltraRare.push(validCard)
                } else {
                    poolOthers.push(validCard)
                }
            }

            let bestCard = null
            let bestTier = 0

            // 4. Selection Logic

            // Priority 1: Illustration rare OR Special illustration rare
            if (poolIllustration.length > 0 || poolSpecialIllustration.length > 0) {
                bestTier = 3

                if (poolIllustration.length > 0 && poolSpecialIllustration.length > 0) {
                    // 50% / 50% probability
                    if (Math.random() < 0.5) {
                        bestCard = poolIllustration[Math.floor(Math.random() * poolIllustration.length)]
                    } else {
                        bestCard = poolSpecialIllustration[Math.floor(Math.random() * poolSpecialIllustration.length)]
                    }
                } else if (poolIllustration.length > 0) {
                    bestCard = poolIllustration[Math.floor(Math.random() * poolIllustration.length)]
                } else {
                    bestCard = poolSpecialIllustration[Math.floor(Math.random() * poolSpecialIllustration.length)]
                }
            }
            // Priority 2: None OR Ultra rare
            else if (poolNone.length > 0 || poolUltraRare.length > 0) {
                bestTier = 2

                if (poolNone.length > 0 && poolUltraRare.length > 0) {
                    // 25% None / 75% Ultra rare
                    if (Math.random() < 0.25) {
                        bestCard = poolNone[Math.floor(Math.random() * poolNone.length)]
                    } else {
                        bestCard = poolUltraRare[Math.floor(Math.random() * poolUltraRare.length)]
                    }
                } else if (poolNone.length > 0) {
                    bestCard = poolNone[Math.floor(Math.random() * poolNone.length)]
                } else {
                    bestCard = poolUltraRare[Math.floor(Math.random() * poolUltraRare.length)]
                }
            }
            // Priority 3: Others
            else if (poolOthers.length > 0) {
                bestTier = 1
                bestCard = poolOthers[Math.floor(Math.random() * poolOthers.length)]
            }

            if (bestCard) {
                setFoundCard(bestCard)

                // Set warning message based on tier found
                if (bestTier < 3) {
                    setWarningMessage("Non esistono Illustration rare o Special illustration rare, ti propongo questa carta che probabilmente farà schifo:")
                }
            } else {
                console.warn("🔍 TCGDex - No valid cards found after checks.")
                setCardError("Non ho trovato nessuna carta valida!")
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
            const isVip = session?.user?.email === 'atzoalbo.94@gmail.com'
            const maxDuration = isVip ? 1000 : 3000 // 1 second for VIP, 3 seconds for others

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

        const isVip = session?.user?.email === 'atzoalbo.94@gmail.com'
        if (hasPlayedToday && !isVip) return

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
                            {gameState === 'idle' && (!hasPlayedToday || session?.user?.email === 'atzoalbo.94@gmail.com') && "Pronto a sborsare?"}
                            {gameState === 'idle' && hasPlayedToday && session?.user?.email !== 'atzoalbo.94@gmail.com' && "Torna domani!"}
                            {gameState === 'animating' && "Estraendo..."}
                            {gameState === 'winner_reveal' && "Hai trovato!"}
                            {gameState === 'result' && foundCard && !warningMessage && "Oggi compra questa carta e torna domani!"}
                            {gameState === 'result' && warningMessage && warningMessage}
                            {gameState === 'result' && cardError && "Oggi si risparmia!"}
                        </h2>
                        <p className="text-neutral-400 text-sm">
                            {gameState === 'idle' && (!hasPlayedToday || session?.user?.email === 'atzoalbo.94@gmail.com') && `Hai ${missingCards.length} Pokémon mancanti. Vediamo chi esce!`}
                            {gameState === 'idle' && hasPlayedToday && session?.user?.email !== 'atzoalbo.94@gmail.com' && "Per oggi hai già usato la funzione Gambling, torna domani."}
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
                        {gameState === 'idle' && (!hasPlayedToday || session?.user?.email === 'atzoalbo.94@gmail.com') && (
                            <button
                                onClick={handleStart}
                                disabled={missingCards.length === 0}
                                className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg transform transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Vai!
                            </button>
                        )}

                        {gameState === 'result' && session?.user?.email === 'atzoalbo.94@gmail.com' && (
                            <button
                                onClick={handleStart}
                                className="w-full py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-xl shadow-lg transform transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                <RefreshCw className="w-5 h-5" />
                                Riprova
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
