import { useState, useRef, useEffect } from 'react'
import { X, Upload, Image as ImageIcon, Check, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { compressImage } from '../utils/imageCompression'

export default function PokemonModal({ pokemon, onClose, userCard, onUpdate, session }) {
    const [uploading, setUploading] = useState(false)
    const [imageToDelete, setImageToDelete] = useState(null)
    const fileInputRef = useRef(null)

    if (!pokemon) return null

    useEffect(() => {
        const originalStyle = window.getComputedStyle(document.body).overflow
        document.body.style.overflow = 'hidden'
        return () => {
            document.body.style.overflow = originalStyle
        }
    }, [])

    const handleUpload = async (event) => {
        try {
            setUploading(true)
            if (!event.target.files || event.target.files.length === 0) {
                throw new Error('You must select an image to upload.')
            }

            const originalFile = event.target.files[0]
            const compressedFile = await compressImage(originalFile, {
                maxWidth: 1200,
                quality: 0.7
            })

            const file = compressedFile
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

    const confirmDelete = (index) => {
        setImageToDelete(index)
    }

    const cancelDelete = () => {
        setImageToDelete(null)
    }

    const deleteImage = async (index) => {
        console.log('deleteImage called with index:', index)
        setImageToDelete(null) // Clear confirmation state

        try {
            const urlToDelete = userCard.image_urls[index]
            console.log('urlToDelete:', urlToDelete)

            let bucketName = 'Carte'
            let path = ''

            // Extract path based on bucket name
            if (urlToDelete.includes('/Carte/')) {
                path = urlToDelete.split('/Carte/')[1]
            } else if (urlToDelete.includes('/pokemon-cards/')) {
                bucketName = 'pokemon-cards'
                path = urlToDelete.split('/pokemon-cards/')[1]
            } else {
                console.warn("Could not parse bucket from URL, attempting to delete from DB only:", urlToDelete)
            }

            // Clean path (remove leading slash if present)
            if (path && path.startsWith('/')) {
                path = path.substring(1)
            }

            console.log('Deleting from bucket:', bucketName, 'path:', path)

            // Only attempt storage deletion if we identified the path
            if (path) {
                // Remove from Storage
                const { data, error: storageError } = await supabase.storage
                    .from(bucketName)
                    .remove([path])

                if (storageError) {
                    console.error('Storage delete error:', storageError)
                    // Continue to remove from DB even if storage fails (orphan cleanup)
                } else {
                    console.log('Storage delete success:', data)
                }
            }

            // Update Database
            const newUrls = userCard.image_urls.filter((_, i) => i !== index)
            let newCoverIndex = userCard.cover_image_index

            // Adjust cover index
            if (index === userCard.cover_image_index) {
                newCoverIndex = 0
            } else if (index < userCard.cover_image_index) {
                newCoverIndex -= 1
            }

            // Safety check for empty array
            if (newUrls.length === 0) {
                newCoverIndex = 0
            }

            const updates = {
                ...userCard,
                user_id: session.user.id,
                pokemon_id: pokemon.id,
                image_urls: newUrls,
                cover_image_index: newCoverIndex,
                updated_at: new Date(),
            }

            console.log('Updating DB with:', updates)

            let { error: dbError } = await supabase
                .from('cards')
                .upsert(updates, { onConflict: 'user_id, pokemon_id' })

            if (dbError) {
                console.error('DB Error:', dbError)
                throw dbError
            }

            console.log('DB Update successful')
            onUpdate()

        } catch (error) {
            console.error('Catch block error:', error)
            alert('Error deleting image: ' + error.message)
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
                        <img
                            src={pokemon.sprites.front_default}
                            alt={pokemon.name}
                            className="w-12 h-12 pixelated object-contain"
                        />
                        <span className="text-neutral-500 text-lg font-mono">#{String(pokemon.id).padStart(3, '0')}</span>
                        {pokemon.name}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-neutral-800 rounded-full transition-colors">
                        <X className="w-6 h-6 text-neutral-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1">
                    <div className="flex flex-col gap-8">
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
                                    <div className="grid grid-cols-2 gap-3">
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
                                                    <div className="absolute top-2 right-2 bg-red-500 rounded-full p-1 shadow-md z-10">
                                                        <Check className="w-3 h-3 text-white" />
                                                    </div>
                                                )}

                                                {imageToDelete === idx ? (
                                                    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-2 z-20 backdrop-blur-sm animate-in fade-in duration-200 rounded-[10px]">
                                                        <p className="text-white text-xs font-medium">Delete?</p>
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    deleteImage(idx)
                                                                }}
                                                                className="bg-red-600 hover:bg-red-700 text-white p-1.5 rounded-full transition-colors"
                                                            >
                                                                <Check className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    cancelDelete()
                                                                }}
                                                                className="bg-neutral-600 hover:bg-neutral-500 text-white p-1.5 rounded-full transition-colors"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            confirmDelete(idx)
                                                        }}
                                                        className="absolute top-2 left-2 bg-black/50 hover:bg-red-600 rounded-full p-1.5 transition-colors z-10"
                                                        title="Delete image"
                                                    >
                                                        <Trash2 className="w-3 h-3 text-white" />
                                                    </button>
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
                                    disabled={uploading || (userCard?.image_urls?.length >= 4)}
                                />
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading || (userCard?.image_urls?.length >= 4)}
                                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full justify-center"
                                >
                                    {uploading ? (
                                        <span className="animate-pulse">Uploading...</span>
                                    ) : (
                                        <>
                                            <Upload className="w-4 h-4" />
                                            Upload Card Photo ({userCard?.image_urls?.length || 0}/4)
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
