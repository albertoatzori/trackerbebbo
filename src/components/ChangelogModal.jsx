import { X, History, Calendar, GitCommit } from 'lucide-react'
import { useEffect, useRef } from 'react'
import changelogData from '../data/changelog.json'

export default function ChangelogModal({ isOpen, onClose }) {
    const isBackNavigation = useRef(false)
    const pushedState = useRef(false)

    useEffect(() => {
        if (isOpen) {
            isBackNavigation.current = false
            pushedState.current = false
            document.body.style.overflow = 'hidden'

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
                document.body.style.overflow = 'unset'

                // If closed manually (not by back button), remove the history state we pushed
                if (!isBackNavigation.current && pushedState.current) {
                    window.history.back()
                }
            }
        }
    }, [isOpen])

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            />

            <div className="relative w-full max-w-2xl bg-neutral-900 rounded-2xl border border-neutral-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-4 border-b border-neutral-800 flex items-center justify-between shrink-0 bg-neutral-900">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <History className="w-6 h-6 text-red-500" />
                        Changelog
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-neutral-400 hover:text-white rounded-full hover:bg-neutral-800 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto space-y-8">
                    {changelogData.map((entry, index) => (
                        <div key={index} className="relative pl-8 border-l border-neutral-800 last:border-0">
                            {/* Timeline Dot */}
                            <div className="absolute left-[-5px] top-0 w-2.5 h-2.5 rounded-full bg-red-500 ring-4 ring-neutral-900" />

                            <div className="mb-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="text-sm font-mono text-neutral-500 flex items-center gap-1.5">
                                        <Calendar className="w-3 h-3" />
                                        {entry.date}
                                    </span>
                                </div>

                                {entry.title && (
                                    <h3 className="text-lg font-bold text-white mb-3">
                                        {entry.title}
                                    </h3>
                                )}

                                <ul className="space-y-3">
                                    {entry.changes.map((change, changeIndex) => (
                                        <li key={changeIndex} className="flex items-start gap-3 text-neutral-300 text-sm leading-relaxed group">
                                            <GitCommit className="w-4 h-4 text-neutral-600 mt-0.5 shrink-0 group-hover:text-red-500 transition-colors" />
                                            <span>{change}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
