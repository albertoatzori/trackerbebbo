import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Image as ImageIcon } from 'lucide-react'

export default function PokemonModalReadOnly({ pokemon, onClose, userCard }) {
    if (!pokemon) return null

    useEffect(() => {
        const originalStyle = window.getComputedStyle(document.body).overflow
        document.body.style.overflow = 'hidden'
        return () => {
            document.body.style.overflow = originalStyle
        }
    }, [])

    const fixSupabaseUrl = (url) => {
        if (!url) return url
        if (url.includes('/storage/v1/object/Carte/') && !url.includes('/public/')) {
            return url.replace('/object/Carte/', '/object/public/Carte/')
        }
        if (url.includes('/storage/v1/object/pokemon-cards/') && !url.includes('/public/')) {
            return url.replace('/object/pokemon-cards/', '/object/public/pokemon-cards/')
        }
        return url
    }

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 p-4 backdrop-blur-sm">


            <div className="relative w-full max-w-2xl bg-neutral-900 rounded-[28px] border border-neutral-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-center p-4 border-b border-neutral-800 bg-neutral-900">
                    <h2 className="text-xl font-bold text-white capitalize flex items-center gap-3">
                        <span className="text-neutral-500 text-base font-mono">#{String(pokemon.id).padStart(3, '0')}</span>
                        {pokemon.name}
                        <img
                            src={pokemon.sprites.front_default}
                            alt={pokemon.name}
                            className="w-10 h-10 pixelated object-contain"
                        />
                    </h2>
                </div>

                {/* Content */}
                <div className="p-4 md:p-6 overflow-y-auto flex-1">
                    <div className="flex flex-col gap-8">
                        <div className="flex-1 space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                    <ImageIcon className="w-5 h-5 text-red-500" />
                                    User Cards
                                </h3>

                                {userCard?.image_urls?.length > 0 ? (
                                    <div className="grid grid-cols-1 gap-4 w-full">
                                        {userCard.image_urls.map((url, idx) => (
                                            <div
                                                key={url}
                                                className="relative aspect-[63/88] w-full rounded-[18px] overflow-hidden bg-neutral-900 border border-neutral-800"
                                            >
                                                <img
                                                    src={fixSupabaseUrl(url)}
                                                    alt="Card"
                                                    className="w-[100%] h-full object-contain mx-auto block"
                                                />

                                                {/* Google Search Icon */}
                                                <div className="absolute top-2 right-2 z-40">
                                                    {userCard.card_metadata?.[url]?.cardNumber ? (
                                                        <a
                                                            href={`https://www.google.com/search?q=${encodeURIComponent(pokemon.name)}+${encodeURIComponent(userCard.card_metadata[url].cardNumber)}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="bg-white rounded-full p-1.5 shadow-md hover:scale-110 transition-transform block"
                                                            title="Search on Google"
                                                        >
                                                            <svg viewBox="0 0 24 24" className="w-4 h-4" xmlns="http://www.w3.org/2000/svg">
                                                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                                            </svg>
                                                        </a>
                                                    ) : (
                                                        <div
                                                            className="bg-neutral-700 rounded-full p-1.5 shadow-md cursor-not-allowed opacity-50"
                                                            title="Add Card Number to enable search"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <svg viewBox="0 0 24 24" className="w-4 h-4 grayscale" xmlns="http://www.w3.org/2000/svg">
                                                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#9CA3AF" />
                                                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#9CA3AF" />
                                                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#9CA3AF" />
                                                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#9CA3AF" />
                                                            </svg>
                                                        </div>
                                                    )}
                                                </div>

                                                {(userCard.card_metadata?.[url]?.type || userCard.card_metadata?.[url]?.expansionSet) && (
                                                    <div className="absolute bottom-2 left-2 right-2 p-4 z-10 flex flex-col justify-center"
                                                        style={{
                                                            backgroundImage: "url('/info-frame.png')",
                                                            backgroundSize: '100% 100%',
                                                            backgroundRepeat: 'no-repeat',
                                                            imageRendering: 'pixelated'
                                                        }}
                                                    >
                                                        <div className="flex items-center justify-between gap-2 px-2">
                                                            <span className="capitalize font-bold text-black text-xs truncate font-mono tracking-tighter">
                                                                {userCard.card_metadata[url].type}
                                                            </span>
                                                            {userCard.card_metadata[url].type === 'comprata' && userCard.card_metadata[url].price && (
                                                                <span className="text-black font-bold font-mono text-xs">
                                                                    Prezzo: €{userCard.card_metadata[url].price}
                                                                </span>
                                                            )}
                                                            {userCard.card_metadata[url].type === 'scambiata' && userCard.card_metadata[url].personName && (
                                                                <span className="text-black font-bold font-mono text-xs">
                                                                    Scambista: {userCard.card_metadata[url].personName}
                                                                </span>
                                                            )}
                                                            {userCard.card_metadata[url].type === 'regalata' && userCard.card_metadata[url].personName && (
                                                                <span className="text-black font-bold font-mono text-xs">
                                                                    Benefattore: {userCard.card_metadata[url].personName}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {userCard.card_metadata[url].expansionSet && (
                                                            <div className="text-black font-bold truncate text-[10px] mt-0.5 px-2 font-mono tracking-tighter">
                                                                Set: {userCard.card_metadata[url].expansionSet}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-gray-500 italic text-sm border border-dashed border-gray-700 rounded-lg p-8 text-center">
                                        No cards uploaded yet.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <button
                onClick={onClose}
                className="mt-4 p-2 bg-neutral-800 hover:bg-neutral-700 rounded-full transition-colors shadow-lg border border-neutral-700 group"
            >
                <X className="w-6 h-6 text-neutral-400 group-hover:text-white transition-colors" />
            </button>
        </div>
    )
}
