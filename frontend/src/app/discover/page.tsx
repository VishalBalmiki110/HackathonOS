'use client'

import { useState, useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Loader2 } from 'lucide-react'
import { api } from '@/lib/api'
import { HackathonCard } from '@/components/hackathon/HackathonCard'

export default function DiscoverPage() {
    const [search, setSearch] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')
    const [platform, setPlatform] = useState('')
    const [mode, setMode] = useState('')
    const [page, setPage] = useState(1)
    const [loadedPages, setLoadedPages] = useState<Record<number, any[]>>({})

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search)
        }, 300)
        return () => clearTimeout(timer)
    }, [search])

    // Reset when filters change
    useEffect(() => {
        setPage(1)
        setLoadedPages({})
    }, [debouncedSearch, platform, mode])

    const { data, isLoading, isFetching } = useQuery({
        queryKey: ['hackathons', { search: debouncedSearch, platform, mode, page }],
        queryFn: () => api.getHackathons({ search: debouncedSearch, platform, mode, page }),
        staleTime: 1000 * 60 * 5, // 5 minutes
    })

    // Store loaded pages
    useEffect(() => {
        if (data?.items) {
            setLoadedPages(prev => ({
                ...prev,
                [page]: data.items
            }))
        }
    }, [data, page])

    // Combine all loaded pages
    const allHackathons = useMemo(() => {
        const result: any[] = []
        for (let i = 1; i <= page; i++) {
            if (loadedPages[i]) {
                result.push(...loadedPages[i])
            }
        }
        return result
    }, [loadedPages, page])

    const platforms = ['devpost', 'dorahacks', 'mlh', 'unstop']
    const modes = ['online', 'in-person', 'hybrid']
    const hasMore = data && page < data.total_pages

    // Show loading only on initial load
    const showLoading = isLoading && page === 1 && Object.keys(loadedPages).length === 0

    return (
        <div className="min-h-screen px-4 py-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold mb-2">
                        Discover <span className="gradient-text">Hackathons</span>
                    </h1>
                    <p className="text-gray-400 text-lg">
                        Find your next challenge from hackathons across the web
                    </p>
                </div>

                {/* Filters */}
                <div className="glass rounded-xl p-4 mb-8">
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Search */}
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search hackathons..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary-500 transition-colors"
                            />
                        </div>

                        {/* Platform Filter */}
                        <select
                            value={platform}
                            onChange={(e) => setPlatform(e.target.value)}
                            className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary-500 cursor-pointer"
                        >
                            <option value="">All Platforms</option>
                            {platforms.map((p) => (
                                <option key={p} value={p} className="bg-gray-900">
                                    {p.charAt(0).toUpperCase() + p.slice(1)}
                                </option>
                            ))}
                        </select>

                        {/* Mode Filter */}
                        <select
                            value={mode}
                            onChange={(e) => setMode(e.target.value)}
                            className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary-500 cursor-pointer"
                        >
                            <option value="">All Modes</option>
                            {modes.map((m) => (
                                <option key={m} value={m} className="bg-gray-900">
                                    {m.charAt(0).toUpperCase() + m.slice(1)}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Results */}
                {showLoading ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="card animate-pulse">
                                <div className="h-40 bg-white/10 rounded-lg mb-4" />
                                <div className="h-6 bg-white/10 rounded mb-2 w-3/4" />
                                <div className="h-4 bg-white/10 rounded w-1/2" />
                            </div>
                        ))}
                    </div>
                ) : allHackathons.length > 0 ? (
                    <>
                        <p className="text-gray-400 mb-4">
                            Showing {allHackathons.length} of {data?.total ?? allHackathons.length} hackathon{(data?.total ?? allHackathons.length) !== 1 ? 's' : ''}
                        </p>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {allHackathons.map((hackathon: any) => (
                                <HackathonCard key={hackathon.id} hackathon={hackathon} />
                            ))}
                        </div>

                        {/* Load More Button */}
                        {hasMore && (
                            <div className="text-center mt-8">
                                <button
                                    onClick={() => setPage(p => p + 1)}
                                    disabled={isFetching}
                                    className="btn-primary inline-flex items-center gap-2"
                                >
                                    {isFetching ? (
                                        <>
                                            <Loader2 className="animate-spin" size={18} />
                                            Loading...
                                        </>
                                    ) : (
                                        <>Load More Hackathons</>
                                    )}
                                </button>
                            </div>
                        )}
                    </>
                ) : data?.total === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-white/5 flex items-center justify-center">
                            <Search className="w-10 h-10 text-gray-500" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">No hackathons found</h3>
                        <p className="text-gray-400">
                            Try adjusting your filters or check back later for new hackathons.
                        </p>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="card animate-pulse">
                                <div className="h-40 bg-white/10 rounded-lg mb-4" />
                                <div className="h-6 bg-white/10 rounded mb-2 w-3/4" />
                                <div className="h-4 bg-white/10 rounded w-1/2" />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
