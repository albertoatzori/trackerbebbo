import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Upload, Image as ImageIcon, Check, Trash2, Edit2, RotateCcw } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { compressImage } from '../utils/imageCompression'

export default function PokemonModal({ pokemon, onClose, userCard, onUpdate, session, readOnly = false }) {
    const [uploading, setUploading] = useState(false)
    const [imageToDelete, setImageToDelete] = useState(null)
    const [editingImage, setEditingImage] = useState(null)
    const [editFormData, setEditFormData] = useState({
        type: 'sbustata',
        price: '',
        expansionSet: ''
    })
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
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
        if (readOnly) return
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

    const reorderImage = async (index) => {
        if (readOnly) return
        if (index === 0) return // Already at the top

        try {
            const currentUrls = [...(userCard?.image_urls || [])]
            const selectedUrl = currentUrls[index]

            // Remove from current position and add to start
            currentUrls.splice(index, 1)
            currentUrls.unshift(selectedUrl)

            const fullUpdates = {
                ...userCard,
                user_id: session.user.id,
                pokemon_id: pokemon.id,
                image_urls: currentUrls,
                cover_image_index: 0, // Always set to 0 as it's now the first image
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

    const setCoverImage = async (index) => {
        if (readOnly) return
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
        if (readOnly) return
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
        if (readOnly) return
        setImageToDelete(index)
    }

    const cancelDelete = () => {
        setImageToDelete(null)
    }

    const deleteImage = async (index) => {
        if (readOnly) return
        console.log('deleteImage called with index:', index)
        setImageToDelete(null) // Clear confirmation state
        setShowDeleteConfirm(false)
        setEditingImage(null)

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

            // Remove metadata for the deleted image
            const currentMetadata = userCard.card_metadata || {}
            const newMetadata = { ...currentMetadata }
            delete newMetadata[urlToDelete]

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
                card_metadata: newMetadata,
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

    const handleEditClick = (index) => {
        if (readOnly) return
        const url = userCard.image_urls[index]
        const metadata = userCard.card_metadata?.[url] || {}
        setEditFormData({
            type: metadata.type || '',
            price: metadata.price || '',
            expansionSet: metadata.expansionSet || ''
        })
        setEditingImage(index)
        setShowDeleteConfirm(false)
    }

    const resetForm = () => {
        setEditFormData({
            type: '',
            price: '',
            expansionSet: ''
        })
    }

    const handleSaveDetails = async () => {
        if (readOnly) return
        try {
            const url = userCard.image_urls[editingImage]
            const currentMetadata = userCard.card_metadata || {}

            const newMetadata = {
                ...currentMetadata,
                [url]: {
                    type: editFormData.type,
                    price: editFormData.price,
                    expansionSet: editFormData.expansionSet
                }
            }

            const updates = {
                ...userCard,
                user_id: session.user.id,
                pokemon_id: pokemon.id,
                status: 'owned',
                card_metadata: newMetadata,
                updated_at: new Date()
            }

            const { error } = await supabase
                .from('cards')
                .upsert(updates, { onConflict: 'user_id, pokemon_id' })

            if (error) throw error

            onUpdate()
            setEditingImage(null)
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
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
            {/* Close Button - Moved outside */}
            <button
                onClick={onClose}
                className="mb-4 p-2 bg-neutral-800 hover:bg-neutral-700 rounded-full transition-colors shadow-lg border border-neutral-700 group"
            >
                <X className="w-6 h-6 text-neutral-400 group-hover:text-white transition-colors" />
            </button>

            <div className="relative w-full max-w-2xl bg-neutral-900 rounded-[28px] border border-neutral-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">

                {/* Header */}
                <div className="flex items-center justify-center p-2 border-b border-neutral-800 bg-neutral-900">
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
                        {/* Details & Upload */}
                        <div className="flex-1 space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                    <ImageIcon className="w-5 h-5 text-red-500" />
                                    {readOnly ? 'User Cards' : 'Your Cards'}
                                </h3>

                                {/* Status Toggle - Only show if not readOnly */}
                                {!readOnly && (
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
                                )}

                                {userCard?.image_urls?.length > 0 ? (
                                    <div className="grid grid-cols-1 gap-3 w-full">
                                        <AnimatePresence>
                                            {userCard.image_urls.map((url, idx) => (
                                                <motion.div
                                                    layout={!readOnly}
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.8 }}
                                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                                    key={url}
                                                    className={`relative aspect-[2/3] group w-full ${!readOnly ? 'cursor-pointer' : ''}`}
                                                    onClick={() => !readOnly && reorderImage(idx)}
                                                >
                                                    {/* Border Overlay - Sibling to content */}
                                                    <div className={`absolute inset-0 z-30 pointer-events-none rounded-[16px] border-2 transition-colors ${idx === 0
                                                        ? 'border-red-500 shadow-lg shadow-red-500/20'
                                                        : 'border-transparent group-hover:border-neutral-600'
                                                        }`}
                                                    />

                                                    {/* Content Container - Handles clipping */}
                                                    <div className="relative w-full h-full rounded-[18px] overflow-hidden bg-neutral-900">
                                                        <img
                                                            src={fixSupabaseUrl(url)}
                                                            alt="Card"
                                                            className="w-full h-full object-cover"
                                                        />
                                                        {idx === 0 && (
                                                            <div className="absolute top-2 right-2 bg-red-500 rounded-full p-1 shadow-md z-10">
                                                                <Check className="w-3 h-3 text-white" />
                                                            </div>
                                                        )}

                                                        {!readOnly && (
                                                            <>
                                                                {imageToDelete === idx ? (
                                                                    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-2 z-20 backdrop-blur-sm">
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
                                                                            handleEditClick(idx)
                                                                        }}
                                                                        className="absolute top-2 left-2 bg-black/50 hover:bg-blue-600 rounded-full p-1.5 transition-colors z-10"
                                                                        title="Edit details"
                                                                    >
                                                                        <Edit2 className="w-3 h-3 text-white" />
                                                                    </button>
                                                                )}
                                                            </>
                                                        )}

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
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                    </div>
                                ) : (
                                    <div className="text-gray-500 italic text-sm border border-dashed border-gray-700 rounded-lg p-4 text-center">
                                        No cards uploaded yet.
                                    </div>
                                )}
                            </div>

                            {/* Upload Button - Only show if not readOnly */}
                            {!readOnly && (
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
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Modal Overlay - Only show if not readOnly */}
            {!readOnly && editingImage !== null && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-neutral-900 rounded-2xl border border-neutral-800 shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="p-4 border-b border-neutral-800 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <h3 className="text-lg font-bold text-white">Edit Card Details</h3>
                                <button
                                    onClick={resetForm}
                                    className="p-1.5 text-neutral-500 hover:text-white rounded-full hover:bg-neutral-800 transition-colors"
                                    title="Reset Info"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                </button>
                            </div>
                            <button
                                onClick={() => setEditingImage(null)}
                                className="text-neutral-400 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            {/* Acquisition Type */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-neutral-400">Acquisition Type</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {['sbustata', 'comprata', 'scambiata', 'regalata'].map((type) => (
                                        <button
                                            key={type}
                                            onClick={() => setEditFormData(prev => ({ ...prev, type }))}
                                            className={`p-2 rounded-lg text-sm font-medium capitalize transition-colors border ${editFormData.type === type
                                                ? 'bg-red-600 border-red-500 text-white'
                                                : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:bg-neutral-700'
                                                }`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Price Input (Conditional) */}
                            {editFormData.type === 'comprata' && (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-neutral-400">Price (€)</label>
                                    <input
                                        type="number"
                                        value={editFormData.price}
                                        onChange={(e) => setEditFormData(prev => ({ ...prev, price: e.target.value }))}
                                        placeholder="0.00"
                                        className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-2 text-white focus:outline-none focus:border-red-500"
                                    />
                                </div>
                            )}

                            {/* Expansion Set */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-neutral-400">Expansion Set</label>
                                <input
                                    type="text"
                                    value={editFormData.expansionSet}
                                    onChange={(e) => setEditFormData(prev => ({ ...prev, expansionSet: e.target.value }))}
                                    placeholder="Enter set name..."
                                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-2 text-white focus:outline-none focus:border-red-500"
                                />
                            </div>
                        </div>

                        <div className="p-4 border-t border-neutral-800 flex justify-between items-center bg-neutral-900">
                            {showDeleteConfirm ? (
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-white font-medium">Confirm delete?</span>
                                    <button
                                        onClick={() => deleteImage(editingImage)}
                                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                                    >
                                        Yes
                                    </button>
                                    <button
                                        onClick={() => setShowDeleteConfirm(false)}
                                        className="bg-neutral-700 hover:bg-neutral-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                                    >
                                        No
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="flex items-center gap-2 text-red-500 hover:text-red-400 font-medium text-sm px-2 py-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Delete Picture
                                </button>
                            )}

                            <button
                                onClick={handleSaveDetails}
                                className="bg-white text-black hover:bg-neutral-200 px-6 py-2 rounded-lg font-bold transition-colors"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
