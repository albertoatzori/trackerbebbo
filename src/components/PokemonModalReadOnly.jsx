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
            <button
                onClick={onClose}
                className="mb-4 p-2 bg-neutral-800 hover:bg-neutral-700 rounded-full transition-colors shadow-lg border border-neutral-700 group"
            >
                <X className="w-6 h-6 text-neutral-400 group-hover:text-white transition-colors" />
            </button>

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

                                                {userCard.card_metadata?.[url]?.type && (
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
                                                                    €{userCard.card_metadata[url].price}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {userCard.card_metadata[url].expansionSet && (
                                                            <div className="text-black font-bold truncate text-[10px] mt-0.5 px-2 font-mono tracking-tighter">
                                                                {userCard.card_metadata[url].expansionSet}
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
        </div>
    )
}
