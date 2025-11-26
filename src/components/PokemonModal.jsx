import { useState, useRef } from 'react'
import { X, Upload, Image as ImageIcon, Check } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'

export default function PokemonModal({ pokemon, onClose, userCard, onUpdate, session }) {
    const [uploading, setUploading] = useState(false)
    const fileInputRef = useRef(null)

    if (!pokemon) return null

    const handleUpload = async (event) => {
        try {
            setUploading(true)
            if (!event.target.files || event.target.files.length === 0) {
                throw new Error('You must select an image to upload.')
            }

            const file = event.target.files[0]
            const fileExt = file.name.split('.').pop()
            const fileName = `${pokemon.id}-${Math.random()}.${fileExt}`
            const filePath = `${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('Carte')
                .upload(filePath, file)

            if (uploadError) {
                throw uploadError
            }

            // Construct public URL manually to ensure correct format
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
            const publicUrl = `${supabaseUrl}/storage/v1/object/public/Carte/${filePath}`

            // Update database
            const currentUrls = userCard?.image_urls || []
            const newUrls = [...currentUrls, publicUrl]

            const updates = {
                user_id: session.user.id,
                pokemon_id: pokemon.id,
                image_urls: newUrls,
                cover_image_index: userCard?.cover_image_index ?? 0,
                status: userCard?.status || 'owned', // Default to owned on upload if not set
                updated_at: new Date(),
            }

            let { error } = await supabase
                .from('cards')
                .upsert(updates, { onConflict: 'user_id, pokemon_id' })

            if (error) throw error

            onUpdate()
        } catch (error) {
            alert(error.message)
        } finally {
            setUploading(false)
        }
    }

    const setCoverImage = async (index) => {
        try {
            const fullUpdates = {
                ...userCard,
                user_id: session.user.id,
                pokemon_id: pokemon.id,
                cover_image_index: index,
                status: userCard?.status || 'owned',
                updated_at: new Date()
            }

            let { error: updateError } = await supabase
                .from('cards')
                .upsert(fullUpdates, { onConflict: 'user_id, pokemon_id' })

            if (updateError) throw updateError
            onUpdate()

        } catch (error) {
            alert(error.message)
        }
    }

    const toggleStatus = async (newStatus) => {
        try {
            const fullUpdates = {
                ...userCard,
                user_id: session.user.id,
                pokemon_id: pokemon.id,
                status: newStatus,
                // Preserve other fields if they exist, or initialize them
                image_urls: userCard?.image_urls || [],
                cover_image_index: userCard?.cover_image_index ?? 0,
                updated_at: new Date()
            }

            let { error: updateError } = await supabase
                .from('cards')
                .upsert(fullUpdates, { onConflict: 'user_id, pokemon_id' })

            if (updateError) throw updateError
            onUpdate()
        } catch (error) {
            alert(error.message)
        }
    }

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

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
            <div className="relative w-full max-w-2xl bg-neutral-900 rounded-[28px] border border-neutral-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-neutral-800 bg-neutral-900">
                    <h2 className="text-2xl font-bold text-white capitalize flex items-center gap-3">
                        <span className="text-neutral-500 text-lg font-mono">#{String(pokemon.id).padStart(3, '0')}</span>
                        {pokemon.name}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-neutral-800 rounded-full transition-colors">
                        <X className="w-6 h-6 text-neutral-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1">
                    <div className="flex flex-col md:flex-row gap-8">
                        {/* Main Sprite/Image */}
                        <div className="flex-shrink-0 flex justify-center bg-neutral-800/30 rounded-2xl p-4">
                            <img
                                src={pokemon.sprites.front_default}
                                alt={pokemon.name}
                                className="w-48 h-48 pixelated object-contain drop-shadow-xl"
                            />
                        </div>

                        {/* Details & Upload */}
                        <div className="flex-1 space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                    <ImageIcon className="w-5 h-5 text-red-500" />
                                    Your Cards
                                </h3>

                                {/* Status Toggle */}
                                <div className="flex bg-neutral-800 p-1 rounded-lg mb-4">
                                    <button
                                        onClick={() => toggleStatus('owned')}
                                        className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${userCard?.status === 'owned' || (!userCard?.status && userCard?.image_urls?.length > 0)
                                            ? 'bg-red-600 text-white shadow-lg'
                                            : 'text-neutral-400 hover:text-white'
                                            }`}
                                    >
                                        Owned
                                    </button>
                                    <button
                                        onClick={() => toggleStatus('missing')}
                                        className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${userCard?.status === 'missing'
                                            ? 'bg-neutral-700 text-white shadow-lg'
                                            : 'text-neutral-400 hover:text-white'
                                            }`}
                                    >
                                        Missing
                                    </button>
                                </div>

                                {userCard?.image_urls?.length > 0 ? (
                                    <div className="grid grid-cols-3 gap-3">
                                        {userCard.image_urls.map((url, idx) => (
                                            <div
                                                key={idx}
                                                className={`relative aspect-[2/3] rounded-xl overflow-hidden border-2 cursor-pointer group transition-all ${userCard.cover_image_index === idx
                                                    ? 'border-red-500 shadow-lg shadow-red-500/20'
                                                    : 'border-transparent hover:border-neutral-600'
                                                    }`}
                                                onClick={() => setCoverImage(idx)}
                                            >
                                                <img
                                                    src={fixSupabaseUrl(url)}
                                                    alt="Card"
                                                    className="w-full h-full object-cover"
                                                />
                                                {userCard.cover_image_index === idx && (
                                                    <div className="absolute top-2 right-2 bg-red-500 rounded-full p-1 shadow-md">
                                                        <Check className="w-3 h-3 text-white" />
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-gray-500 italic text-sm border border-dashed border-gray-700 rounded-lg p-4 text-center">
                                        No cards uploaded yet.
                                    </div>
                                )}
                            </div>

                            {/* Upload Button */}
                            <div>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleUpload}
                                    accept="image/*"
                                    className="hidden"
                                    disabled={uploading || (userCard?.image_urls?.length >= 5)}
                                />
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading || (userCard?.image_urls?.length >= 5)}
                                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full justify-center"
                                >
                                    {uploading ? (
                                        <span className="animate-pulse">Uploading...</span>
                                    ) : (
                                        <>
                                            <Upload className="w-4 h-4" />
                                            Upload Card Photo ({userCard?.image_urls?.length || 0}/5)
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
