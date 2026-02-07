'use client'

import { useQuery } from '@tanstack/react-query'
import { Bookmark, Loader2, LogIn } from 'lucide-react'
import { api } from '@/lib/api'
import { HackathonCard } from '@/components/hackathon/HackathonCard'
import { useAuthStore } from '@/lib/auth'

export default function SavedPage() {
    const { token, user } = useAuthStore()
    const isLoggedIn = !!token && !!user

    const { data: bookmarks, isLoading, error } = useQuery({
        queryKey: ['bookmarks'],
        queryFn: api.getBookmarks,
        enabled: isLoggedIn, // Only fetch if logged in
    })

    return (
        <div className="min-h-screen px-4 py-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center">
                        <Bookmark className="text-primary-400" size={24} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold">
                            <span className="gradient-text">Saved Hackathons</span>
                        </h1>
                        <p className="text-gray-400">
                            Your bookmarked hackathons in one place
                        </p>
                    </div>
                </div>

                {/* Content */}
                {!isLoggedIn ? (
                    <div className="text-center py-20">
                        <div className="w-16 h-16 rounded-full bg-primary-500/20 flex items-center justify-center mx-auto mb-4">
                            <LogIn className="text-primary-400" size={32} />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Sign in to view bookmarks</h3>
                        <p className="text-gray-400 mb-6">
                            Save your favorite hackathons by signing in with Google
                        </p>
                        <a
                            href="/auth/login"
                            className="btn-primary inline-flex items-center gap-2"
                            onClick={async (e) => {
                                e.preventDefault()
                                const data = await api.getGoogleAuthUrl()
                                window.location.href = data.auth_url
                            }}
                        >
                            <LogIn size={18} />
                            Sign in with Google
                        </a>
                    </div>
                ) : isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="animate-spin text-primary-400" size={40} />
                    </div>
                ) : error ? (
                    <div className="text-center py-20">
                        <p className="text-red-400">Failed to load bookmarks. Please try again.</p>
                    </div>
                ) : bookmarks?.length === 0 ? (
                    <div className="text-center py-20">
                        <Bookmark className="mx-auto text-gray-600 mb-4" size={48} />
                        <h3 className="text-xl font-semibold mb-2">No bookmarks yet</h3>
                        <p className="text-gray-400 mb-4">
                            Browse hackathons and click the bookmark icon to save them here
                        </p>
                        <a href="/discover" className="btn-primary inline-block">
                            Discover Hackathons
                        </a>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {bookmarks?.map((hackathon: any) => (
                            <HackathonCard key={hackathon.id} hackathon={hackathon} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
