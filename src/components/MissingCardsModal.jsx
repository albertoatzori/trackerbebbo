import { X, Copy, Check } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'

export default function MissingCardsModal({ isOpen, onClose, missingCards }) {
    const [copied, setCopied] = useState(false)
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

    if (!isOpen) return null

    const textContent = missingCards.map(p => `#${String(p.id).padStart(3, '0')} ${p.name.charAt(0).toUpperCase() + p.name.slice(1)}`).join('\n')

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(textContent)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (err) {
            console.error('Failed to copy:', err)
        }
    }

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            />

            <div className="relative w-full max-w-lg bg-neutral-900 rounded-2xl border border-neutral-800 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                {/* Header */}
                <div className="p-4 border-b border-neutral-800 flex items-center justify-between shrink-0 bg-neutral-900">
                    <h2 className="text-xl font-bold text-white">Carte Mancanti ({missingCards.length})</h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-neutral-400 hover:text-white rounded-full hover:bg-neutral-800 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 overflow-y-auto flex-1">
                    <div className="bg-neutral-950 rounded-xl p-4 font-mono text-sm text-neutral-300 whitespace-pre-wrap border border-neutral-800">
                        {textContent}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-neutral-800 bg-neutral-900 shrink-0">
                    <button
                        onClick={handleCopy}
                        className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all ${copied
                            ? 'bg-green-600 text-white shadow-lg shadow-green-600/20'
                            : 'bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-600/20'
                            }`}
                    >
                        {copied ? (
                            <>
                                <Check className="w-5 h-5" />
                                Copiato!
                            </>
                        ) : (
                            <>
                                <Copy className="w-5 h-5" />
                                Copia Lista
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}
