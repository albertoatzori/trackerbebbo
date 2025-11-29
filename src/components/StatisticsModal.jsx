import { X, TrendingUp, ShoppingBag, PieChart, Layers } from 'lucide-react'
import { useMemo } from 'react'

export default function StatisticsModal({ isOpen, onClose, userCards }) {
    if (!isOpen) return null

    const stats = useMemo(() => {
        let totalSpent = 0
        let boughtCount = 0
        const acquisitionCounts = {
            sbustata: 0,
            comprata: 0,
            scambiata: 0,
            regalata: 0
        }
        const setCounts = {}
        let totalCards = 0

        Object.values(userCards).forEach(card => {
            // Skip if explicitly missing
            if (card.status === 'missing') return

            // Check if effectively owned
            const isOwned = card.status === 'owned' || (!card.status && card.image_urls?.length > 0)

            if (card.image_urls && card.image_urls.length > 0) {
                // Iterate through each card instance (image)
                card.image_urls.forEach(url => {
                    const metadata = card.card_metadata?.[url] || {}
                    const type = metadata.type
                    const validTypes = ['sbustata', 'comprata', 'scambiata', 'regalata']
                    const hasValidLabel = validTypes.includes(type)

                    // Count physical card ONLY if it's owned AND has a valid label
                    if (isOwned && hasValidLabel) {
                        totalCards++

                        // Acquisition Stats - only count if valid type
                        if (acquisitionCounts[type] !== undefined) {
                            acquisitionCounts[type]++
                        }
                    }

                    // Financial Stats
                    if (type === 'comprata' && metadata.price) {
                        const price = parseFloat(metadata.price)
                        if (!isNaN(price)) {
                            totalSpent += price
                            boughtCount++
                        }
                    }

                    // Set Stats
                    if (metadata.expansionSet) {
                        const set = metadata.expansionSet.trim()
                        if (set) {
                            setCounts[set] = (setCounts[set] || 0) + 1
                        }
                    }
                })
            }
        })

        const avgCost = boughtCount > 0 ? totalSpent / boughtCount : 0

        // Sort sets by count
        const topSets = Object.entries(setCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)

        return {
            totalSpent,
            avgCost,
            acquisitionCounts,
            topSets,
            totalCards
        }
    }, [userCards])

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
                        <TrendingUp className="w-6 h-6 text-red-500" />
                        Statistiche Collezione
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

                    {/* Financial Stats */}
                    <section>
                        <h3 className="text-sm font-medium text-neutral-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <ShoppingBag className="w-4 h-4" />
                            Analisi Finanziaria
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-neutral-800/50 p-4 rounded-xl border border-neutral-800">
                                <div className="text-2xl font-bold text-white">€{stats.totalSpent.toFixed(2)}</div>
                                <div className="text-xs text-neutral-400 mt-1">Totale Speso</div>
                            </div>
                            <div className="bg-neutral-800/50 p-4 rounded-xl border border-neutral-800">
                                <div className="text-2xl font-bold text-white">€{stats.avgCost.toFixed(2)}</div>
                                <div className="text-xs text-neutral-400 mt-1">Costo Medio (per carta comprata)</div>
                            </div>
                        </div>
                    </section>

                    {/* Acquisition Stats */}
                    <section>
                        <h3 className="text-sm font-medium text-neutral-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <PieChart className="w-4 h-4" />
                            Metodo di Acquisizione
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {Object.entries(stats.acquisitionCounts).map(([type, count]) => (
                                <div key={type} className="bg-neutral-800/30 p-3 rounded-lg border border-neutral-800 text-center">
                                    <div className="text-xl font-bold text-white">{count}</div>
                                    <div className="text-xs text-neutral-400 capitalize mt-1">{type}</div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Set Stats */}
                    {stats.topSets.length > 0 && (
                        <section>
                            <h3 className="text-sm font-medium text-neutral-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Layers className="w-4 h-4" />
                                Top Set Espansioni
                            </h3>
                            <div className="space-y-2">
                                {stats.topSets.map(([set, count], idx) => (
                                    <div key={set} className="flex items-center justify-between p-3 bg-neutral-800/30 rounded-lg border border-neutral-800">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-mono text-neutral-500 w-4">{idx + 1}</span>
                                            <span className="text-sm font-medium text-white">{set}</span>
                                        </div>
                                        <span className="text-sm font-bold text-red-400">{count}</span>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* General Stats */}
                    <section>
                        <div className="bg-gradient-to-br from-red-900/20 to-neutral-900 p-4 rounded-xl border border-red-500/20 flex items-center justify-between">
                            <div>
                                <div className="text-sm text-red-200">Carte Totali Fisiche</div>
                                <div className="text-xs text-red-300/60">Include doppioni e varianti</div>
                            </div>
                            <div className="text-3xl font-bold text-red-500">{stats.totalCards}</div>
                        </div>
                    </section>

                </div>
            </div>
        </div>
    )
}
