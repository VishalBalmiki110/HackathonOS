'use client'

import { useState, useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Loader2, Filter, SlidersHorizontal, Zap } from 'lucide-react'
import { api } from '@/lib/api'
import { HackathonCard } from '@/components/hackathon/HackathonCard'

export default function DiscoverPage() {
    const [search, setSearch] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')
    const [platform, setPlatform] = useState('')
    const [mode, setMode] = useState('')
    const [page, setPage] = useState(1)
    const [loadedPages, setLoadedPages] = useState<Record<number, any[]>>({})
    const [showFilters, setShowFilters] = useState(true)

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

    const platforms = [
        { value: 'devpost', label: 'Devpost', color: 'from-blue-500 to-blue-600' },
        { value: 'dorahacks', label: 'DoraHacks', color: 'from-orange-500 to-orange-600' },
        { value: 'mlh', label: 'MLH', color: 'from-red-500 to-red-600' },
        { value: 'unstop', label: 'Unstop', color: 'from-purple-500 to-purple-600' },
    ]

    const modes = ['online', 'in-person', 'hybrid']
    const hasMore = data && page < data.total_pages

    // Show loading only on initial load
    const showLoading = isLoading && page === 1 && Object.keys(loadedPages).length === 0

    const activeFiltersCount = [platform, mode].filter(Boolean).length

    return (
        <div className="min-h-screen">
            {/* Hero Header */}
            <div className="relative overflow-hidden border-b border-border-subtle">
                <div className="absolute inset-0 bg-gradient-mesh opacity-40" />
                <div className="absolute inset-0 noise-texture" />

                <div className="relative max-w-7xl mx-auto px-4 py-12 md:py-16">
                    <div className="max-w-3xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-moderate border border-border-subtle mb-4 text-sm font-mono">
                            <Zap className="w-4 h-4 text-accent-primary" />
                            <span className="text-text-secondary">{data?.total || 0} Active Hackathons</span>
                        </div>

                        <h1 className="text-5xl md:text-6xl font-display font-bold mb-4 leading-tight">
                            Discover{' '}
                            <span className="bg-gradient-to-r from-accent-primary to-accent-secondary bg-clip-text text-transparent">
                                Hackathons
                            </span>
                        </h1>

                        <p className="text-xl text-text-secondary font-mono">
                            Find your next challenge from hackathons across the web
                        </p>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Filters Bar */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-moderate border border-border-subtle hover:bg-surface-strong transition-colors text-sm font-mono"
                        >
                            <SlidersHorizontal className="w-4 h-4" />
                            <span>Filters</span>
                            {activeFiltersCount > 0 && (
                                <span className="px-2 py-0.5 rounded-full bg-accent-primary text-bg-primary text-xs font-bold">
                                    {activeFiltersCount}
                                </span>
                            )}
                        </button>

                        {!showLoading && data && (
                            <div className="text-sm font-mono text-text-tertiary">
                                <span className="text-accent-primary font-bold">{allHackathons.length}</span>
                                {' '}of{' '}
                                <span className="text-text-secondary">{data.total}</span>
                                {' '}shown
                            </div>
                        )}
                    </div>

                    {/* Filter Panel */}
                    {showFilters && (
                        <div className="card-glass p-6 animate-fade-in-up">
                            <div className="grid md:grid-cols-12 gap-4">
                                {/* Search */}
                                <div className="md:col-span-6 relative">
                                    <label className="block text-sm font-mono text-text-tertiary mb-2">
                                        Search
                                    </label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-quaternary" size={18} />
                                        <input
                                            type="text"
                                            placeholder="Search by name, theme, or description..."
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 bg-surface-dim border border-border-subtle rounded-lg text-text-primary placeholder-text-quaternary focus:outline-none focus:border-accent-primary transition-colors font-mono text-sm"
                                        />
                                    </div>
                                </div>

                                {/* Platform Filter */}
                                <div className="md:col-span-3">
                                    <label className="block text-sm font-mono text-text-tertiary mb-2">
                                        Platform
                                    </label>
                                    <select
                                        value={platform}
                                        onChange={(e) => setPlatform(e.target.value)}
                                        className="w-full px-4 py-3 bg-surface-dim border border-border-subtle rounded-lg text-text-primary focus:outline-none focus:border-accent-primary cursor-pointer transition-colors font-mono text-sm"
                                    >
                                        <option value="">All Platforms</option>
                                        {platforms.map((p) => (
                                            <option key={p.value} value={p.value} className="bg-bg-elevated">
                                                {p.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Mode Filter */}
                                <div className="md:col-span-3">
                                    <label className="block text-sm font-mono text-text-tertiary mb-2">
                                        Mode
                                    </label>
                                    <select
                                        value={mode}
                                        onChange={(e) => setMode(e.target.value)}
                                        className="w-full px-4 py-3 bg-surface-dim border border-border-subtle rounded-lg text-text-primary focus:outline-none focus:border-accent-primary cursor-pointer transition-colors font-mono text-sm"
                                    >
                                        <option value="">All Modes</option>
                                        {modes.map((m) => (
                                            <option key={m} value={m} className="bg-bg-elevated">
                                                {m.charAt(0).toUpperCase() + m.slice(1)}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Active Filters */}
                            {activeFiltersCount > 0 && (
                                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border-subtle">
                                    <span className="text-sm font-mono text-text-tertiary">Active:</span>
                                    {platform && (
                                        <span className="px-3 py-1 rounded-full bg-accent-primary/20 text-accent-primary border border-accent-primary/30 text-sm font-mono">
                                            {platforms.find(p => p.value === platform)?.label}
                                        </span>
                                    )}
                                    {mode && (
                                        <span className="px-3 py-1 rounded-full bg-accent-secondary/20 text-accent-secondary border border-accent-secondary/30 text-sm font-mono">
                                            {mode}
                                        </span>
                                    )}
                                    <button
                                        onClick={() => {
                                            setPlatform('')
                                            setMode('')
                                        }}
                                        className="ml-auto text-sm text-text-tertiary hover:text-accent-danger transition-colors font-mono"
                                    >
                                        Clear all
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Results Grid */}
                {showLoading ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="card animate-pulse">
                                <div className="h-40 bg-surface-moderate rounded-lg mb-4" />
                                <div className="h-6 bg-surface-moderate rounded mb-2 w-3/4" />
                                <div className="h-4 bg-surface-moderate rounded w-1/2" />
                            </div>
                        ))}
                    </div>
                ) : allHackathons.length > 0 ? (
                    <>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
                            {allHackathons.map((hackathon: any) => (
                                <HackathonCard key={hackathon.id} hackathon={hackathon} />
                            ))}
                        </div>

                        {/* Load More Button */}
                        {hasMore && (
                            <div className="text-center mt-12">
                                <button
                                    onClick={() => setPage(p => p + 1)}
                                    disabled={isFetching}
                                    className="btn btn-secondary inline-flex items-center gap-2 text-base group disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isFetching ? (
                                        <>
                                            <Loader2 className="animate-spin" size={18} />
                                            <span>Loading...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Load More Hackathons</span>
                                            <div className="w-5 h-5 rounded-full bg-accent-primary/20 flex items-center justify-center text-accent-primary text-xs font-bold">
                                                {data.total - allHackathons.length}
                                            </div>
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </>
                ) : data?.total === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-surface-subtle border border-border-subtle flex items-center justify-center">
                            <Search className="w-12 h-12 text-text-quaternary" />
                        </div>
                        <h3 className="text-2xl font-display font-semibold mb-3 text-text-primary">
                            No hackathons found
                        </h3>
                        <p className="text-text-tertiary mb-6 max-w-md mx-auto font-mono">
                            Try adjusting your filters or check back later for new hackathons.
                        </p>
                        <button
                            onClick={() => {
                                setSearch('')
                                setPlatform('')
                                setMode('')
                            }}
                            className="btn btn-secondary"
                        >
                            Clear Filters
                        </button>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="card animate-pulse">
                                <div className="h-40 bg-surface-moderate rounded-lg mb-4" />
                                <div className="h-6 bg-surface-moderate rounded mb-2 w-3/4" />
                                <div className="h-4 bg-surface-moderate rounded w-1/2" />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
