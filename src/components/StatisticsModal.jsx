import { X, TrendingUp, ShoppingBag, PieChart, Layers, Gift, Handshake } from 'lucide-react'
import { useMemo } from 'react'
import { useModalBack } from '../hooks/useModalBack'

export default function StatisticsModal({ isOpen, onClose, userCards = {}, onSelectFilter }) {
    useModalBack(isOpen, onClose)



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
        const donorCounts = {}
        const traderCounts = {}
        let totalCards = 0
        let uniqueOwned = 0
        const totalPokemon = 151

        try {
            if (!userCards) throw new Error('userCards is null')

            Object.values(userCards).forEach(card => {
                if (!card) return

                // Skip if explicitly missing
                if (card.status === 'missing') return

                // Check if effectively owned
                const isOwned = card.status === 'owned' || (!card.status && card.image_urls?.length > 0)

                if (isOwned) {
                    uniqueOwned++
                }

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

                        // Person Stats (Donors & Traders)
                        if (metadata.personName) {
                            const rawName = metadata.personName.trim()
                            if (rawName) {
                                const normalizedName = rawName.toLowerCase()
                                if (type === 'regalata') {
                                    donorCounts[normalizedName] = (donorCounts[normalizedName] || 0) + 1
                                } else if (type === 'scambiata') {
                                    traderCounts[normalizedName] = (traderCounts[normalizedName] || 0) + 1
                                }
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

            // Sort donors by count
            const topDonors = Object.entries(donorCounts)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)

            // Sort traders by count
            const topTraders = Object.entries(traderCounts)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)

            return {
                totalSpent,
                avgCost,
                acquisitionCounts,
                topSets,
                topDonors,
                topTraders,
                totalCards,
                uniqueOwned,
                totalPokemon
            }
        } catch (error) {
            console.error('Error calculating stats:', error)
            return {
                totalSpent: 0,
                avgCost: 0,
                acquisitionCounts: {
                    sbustata: 0,
                    comprata: 0,
                    scambiata: 0,
                    regalata: 0
                },
                topSets: [],
                topDonors: [],
                topTraders: [],
                totalCards: 0,
                uniqueOwned: 0,
                totalPokemon: 151
            }
        }
    }, [userCards])

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

                    {/* Collection Progress */}
                    <section>
                        <div className="bg-gradient-to-br from-neutral-800 to-neutral-900 p-5 rounded-2xl border border-neutral-800 shadow-xl relative overflow-hidden">
                            {/* Background decoration */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

                            <div className="relative z-10 space-y-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-sm font-medium text-neutral-400 uppercase tracking-wider mb-1">Progresso Kanto</h3>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-4xl font-bold text-white">{stats.uniqueOwned}</span>
                                            <span className="text-lg text-neutral-500 font-medium">/ {stats.totalPokemon}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-3xl font-bold text-red-500">
                                            {Math.round((stats.uniqueOwned / stats.totalPokemon) * 100)}%
                                        </div>
                                        <div className="text-xs text-neutral-500 font-medium mt-1">Completato</div>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="space-y-2">
                                    <div className="h-3 w-full bg-neutral-950 rounded-full overflow-hidden border border-neutral-800">
                                        <div
                                            className="h-full bg-gradient-to-r from-red-600 to-red-500 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(220,38,38,0.5)]"
                                            style={{ width: `${(stats.uniqueOwned / stats.totalPokemon) * 100}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Physical Cards Stat */}
                                <div className="pt-4 border-t border-neutral-800/50 flex items-center justify-between">
                                    <div>
                                        <div className="text-sm text-neutral-300 font-medium">Carte Totali Fisiche</div>
                                        <div className="text-xs text-neutral-500">Include doppioni e varianti</div>
                                    </div>
                                    <div className="text-2xl font-bold text-white">{stats.totalCards}</div>
                                </div>
                            </div>
                        </div>
                    </section>

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
                                <div className="text-xs text-neutral-400 mt-1">Costo Medio</div>
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
                                <button
                                    key={type}
                                    onClick={() => onSelectFilter?.(type)}
                                    className="bg-neutral-800/30 p-3 rounded-lg border border-neutral-800 text-center hover:bg-neutral-800 hover:border-red-500/50 transition-all cursor-pointer group"
                                >
                                    <div className="text-xl font-bold text-white group-hover:text-red-500 transition-colors">{count}</div>
                                    <div className="text-xs text-neutral-400 capitalize mt-1 group-hover:text-neutral-300">{type}</div>
                                </button>
                            ))}
                        </div>
                    </section>



                    {/* Donor Stats */}
                    {stats.topDonors.length > 0 && (
                        <section>
                            <h3 className="text-sm font-medium text-neutral-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Gift className="w-4 h-4" />
                                Top Donatori
                            </h3>
                            <div className="space-y-2">
                                {stats.topDonors.map(([name, count], idx) => (
                                    <button
                                        key={name}
                                        onClick={() => onSelectFilter?.('regalata', name)}
                                        className="w-full flex items-center justify-between p-3 bg-neutral-800/30 rounded-lg border border-neutral-800 hover:bg-neutral-800 hover:border-red-500/50 transition-all cursor-pointer group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-mono text-neutral-500 w-4 group-hover:text-red-500">{idx + 1}</span>
                                            <span className="text-sm font-medium text-white capitalize">{name}</span>
                                        </div>
                                        <span className="text-sm font-bold text-red-400">{count}</span>
                                    </button>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Trader Stats */}
                    {stats.topTraders.length > 0 && (
                        <section>
                            <h3 className="text-sm font-medium text-neutral-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Handshake className="w-4 h-4" />
                                Top Scambiatori
                            </h3>
                            <div className="space-y-2">
                                {stats.topTraders.map(([name, count], idx) => (
                                    <button
                                        key={name}
                                        onClick={() => onSelectFilter?.('scambiata', name)}
                                        className="w-full flex items-center justify-between p-3 bg-neutral-800/30 rounded-lg border border-neutral-800 hover:bg-neutral-800 hover:border-red-500/50 transition-all cursor-pointer group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-mono text-neutral-500 w-4 group-hover:text-red-500">{idx + 1}</span>
                                            <span className="text-sm font-medium text-white capitalize">{name}</span>
                                        </div>
                                        <span className="text-sm font-bold text-red-400">{count}</span>
                                    </button>
                                ))}
                            </div>
                        </section>
                    )}

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



                </div>
            </div>
        </div>
    )
}
