import { useState, useRef } from 'react'
import { X, Upload, Image as ImageIcon, Check } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'

export default function PokemonModal({ pokemon, onClose, userCard, onUpdate }) {
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
                .from('pokemon-cards')
                .upload(filePath, file)

            if (uploadError) {
                throw uploadError
            }

            const { data: { publicUrl } } = supabase.storage
                .from('pokemon-cards')
                .getPublicUrl(filePath)

            // Update database
            const currentUrls = userCard?.image_urls || []
            const newUrls = [...currentUrls, publicUrl]

            const updates = {
                user_id: (await supabase.auth.getUser()).data.user.id,
                pokemon_id: pokemon.id,
                image_urls: newUrls,
                cover_image_index: userCard?.cover_image_index ?? 0,
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
                user_id: (await supabase.auth.getUser()).data.user.id,
                pokemon_id: pokemon.id,
                cover_image_index: index,
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

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
            <div className="relative w-full max-w-2xl bg-gray-900 rounded-xl border border-gray-700 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-gray-800/50">
                    <h2 className="text-2xl font-bold text-white capitalize flex items-center gap-2">
                        <span className="text-gray-500 text-lg">#{String(pokemon.id).padStart(3, '0')}</span>
                        {pokemon.name}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded-full transition-colors">
                        <X className="w-6 h-6 text-gray-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1">
                    <div className="flex flex-col md:flex-row gap-6">
                        {/* Main Sprite/Image */}
                        <div className="flex-shrink-0 flex justify-center">
                            <img
                                src={pokemon.sprites.front_default}
                                alt={pokemon.name}
                                className="w-48 h-48 pixelated object-contain drop-shadow-xl"
                            />
                        </div>

                        {/* Details & Upload */}
                        <div className="flex-1 space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-300 mb-2 flex items-center gap-2">
                                    <ImageIcon className="w-5 h-5" />
                                    Your Cards
                                </h3>

                                {userCard?.image_urls?.length > 0 ? (
                                    <div className="grid grid-cols-3 gap-2">
                                        {userCard.image_urls.map((url, idx) => (
                                            <div
                                                key={idx}
                                                className={`relative aspect-[2/3] rounded-lg overflow-hidden border-2 cursor-pointer group ${userCard.cover_image_index === idx ? 'border-red-500' : 'border-transparent hover:border-gray-500'}`}
                                                onClick={() => setCoverImage(idx)}
                                            >
                                                <img src={url} alt="Card" className="w-full h-full object-cover" />
                                                {userCard.cover_image_index === idx && (
                                                    <div className="absolute top-1 right-1 bg-red-500 rounded-full p-0.5">
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
