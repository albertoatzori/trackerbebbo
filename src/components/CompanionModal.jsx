import { motion } from 'framer-motion'
import { X } from 'lucide-react'

// Import GIFs
import blastoise from '../assets/poke-anim/blastoise.gif'
import charizard from '../assets/poke-anim/charizard.gif'
import dragonite from '../assets/poke-anim/dragonite.gif'
import eevee from '../assets/poke-anim/eevee.gif'
import gengar from '../assets/poke-anim/gengar.gif'
import mew from '../assets/poke-anim/mew.gif'
import mewtwo from '../assets/poke-anim/mewtwo.gif'
import pikachu from '../assets/poke-anim/pikachu.gif'
import snorlax from '../assets/poke-anim/snorlax.gif'
import venusaur from '../assets/poke-anim/venusaur.gif'

const COMPANIONS = [
    { id: 'blastoise', name: 'Blastoise', src: blastoise },
    { id: 'charizard', name: 'Charizard', src: charizard },
    { id: 'dragonite', name: 'Dragonite', src: dragonite },
    { id: 'eevee', name: 'Eevee', src: eevee },
    { id: 'gengar', name: 'Gengar', src: gengar },
    { id: 'mew', name: 'Mew', src: mew },
    { id: 'mewtwo', name: 'Mewtwo', src: mewtwo },
    { id: 'pikachu', name: 'Pikachu', src: pikachu },
    { id: 'snorlax', name: 'Snorlax', src: snorlax },
    { id: 'venusaur', name: 'Venusaur', src: venusaur },
]

export default function CompanionModal({ isOpen, onClose, onSelect, currentCompanion }) {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-neutral-900 rounded-2xl border border-neutral-800 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]"
            >
                <div className="p-4 border-b border-neutral-800 flex justify-between items-center bg-neutral-900">
                    <h3 className="text-xl font-bold text-white">Scegli il tuo Compagno</h3>
                    <button
                        onClick={onClose}
                        className="text-neutral-400 hover:text-white transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        <div
                            onClick={() => {
                                onSelect(null)
                                onClose()
                            }}
                            className={`group relative p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col items-center gap-3 ${!currentCompanion
                                    ? 'bg-neutral-800 border-red-500 shadow-lg shadow-red-500/20'
                                    : 'bg-neutral-900/50 border-neutral-800 hover:bg-neutral-800 hover:border-neutral-700'
                                }`}
                        >
                            <div className="relative w-20 h-20 flex items-center justify-center">
                                <span className="text-4xl">🚫</span>
                            </div>
                            <span className={`text-sm font-medium ${!currentCompanion ? 'text-white' : 'text-neutral-400 group-hover:text-white'
                                }`}>
                                Nessuno
                            </span>
                        </div>
                        {COMPANIONS.map((companion) => (
                            <div
                                key={companion.id}
                                onClick={() => {
                                    onSelect(companion.id)
                                    onClose()
                                }}
                                className={`group relative p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col items-center gap-3 ${currentCompanion === companion.id
                                    ? 'bg-neutral-800 border-red-500 shadow-lg shadow-red-500/20'
                                    : 'bg-neutral-900/50 border-neutral-800 hover:bg-neutral-800 hover:border-neutral-700'
                                    }`}
                            >
                                <div className="relative w-20 h-20 flex items-center justify-center">
                                    <img
                                        src={companion.src}
                                        alt={companion.name}
                                        className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform duration-300"
                                    />
                                </div>
                                <span className={`text-sm font-medium ${currentCompanion === companion.id ? 'text-white' : 'text-neutral-400 group-hover:text-white'
                                    }`}>
                                    {companion.name}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </motion.div>
        </div>
    )
}

export { COMPANIONS }
