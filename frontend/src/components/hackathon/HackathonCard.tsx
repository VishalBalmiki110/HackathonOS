'use client'

import Link from 'next/link'
import { Clock, MapPin, Trophy, ExternalLink, Calendar, Bookmark, BookmarkCheck } from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useAuthStore } from '@/lib/auth'

interface Hackathon {
    id: string
    name: string
    platform: string
    url: string
    description?: string
    submission_deadline: string
    mode?: string
    tags?: string[]
    prize_pool?: string
    image_url?: string
    days_until_deadline?: number
}

export function HackathonCard({ hackathon }: { hackathon: Hackathon }) {
    const { token } = useAuthStore()
    const queryClient = useQueryClient()
    const [isBookmarked, setIsBookmarked] = useState(false)

    const deadline = new Date(hackathon.submission_deadline)
    const daysLeft = hackathon.days_until_deadline ??
        Math.max(0, Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))

    const urgencyColor = daysLeft <= 7 ? 'text-red-400' : daysLeft <= 14 ? 'text-yellow-400' : 'text-green-400'

    const platformColors: Record<string, string> = {
        devpost: 'platform-badge-devpost',
        mlh: 'platform-badge-mlh',
        unstop: 'platform-badge-unstop',
        dorahacks: 'platform-badge-dorahacks',
    }

    // Check bookmark status on mount
    useEffect(() => {
        if (token) {
            api.checkBookmark(hackathon.id)
                .then(({ bookmarked }) => setIsBookmarked(bookmarked))
                .catch(() => { })
        }
    }, [hackathon.id, token])

    // Bookmark mutation with cache invalidation
    const bookmarkMutation = useMutation({
        mutationFn: async (shouldBookmark: boolean) => {
            if (shouldBookmark) {
                return api.bookmarkHackathon(hackathon.id)
            } else {
                return api.unbookmarkHackathon(hackathon.id)
            }
        },
        onMutate: async (shouldBookmark) => {
            // Optimistic update
            setIsBookmarked(shouldBookmark)
        },
        onSuccess: () => {
            // Invalidate bookmarks query to refresh saved page
            queryClient.invalidateQueries({ queryKey: ['bookmarks'] })
        },
        onError: (error, shouldBookmark) => {
            // Revert optimistic update on error
            setIsBookmarked(!shouldBookmark)
            console.error('Failed to update bookmark:', error)
        },
    })

    const handleBookmark = async (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()

        if (!token) {
            alert('Please sign in to bookmark hackathons')
            return
        }

        bookmarkMutation.mutate(!isBookmarked)
    }

    return (
        <div className="card card-hover group relative">
            {/* Bookmark Button */}
            <button
                onClick={handleBookmark}
                disabled={bookmarkMutation.isPending}
                className={`absolute top-4 right-4 z-10 p-2 rounded-full transition-all ${isBookmarked
                    ? 'bg-primary-500/20 text-primary-400'
                    : 'bg-black/40 text-white/60 hover:text-white hover:bg-black/60'
                    } ${bookmarkMutation.isPending ? 'opacity-50' : ''}`}
                title={isBookmarked ? 'Remove bookmark' : 'Bookmark this hackathon'}
            >
                {isBookmarked ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
            </button>

            {/* Image */}
            {hackathon.image_url && (
                <div className="h-40 -mx-6 -mt-6 mb-4 overflow-hidden rounded-t-xl bg-white/5">
                    <img
                        src={hackathon.image_url}
                        alt={hackathon.name}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                </div>
            )}

            {/* Platform Badge */}
            <div className="flex items-center gap-2 mb-3">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${platformColors[hackathon.platform] || 'platform-badge-fallback'}`}>
                    {hackathon.platform.toUpperCase()}
                </span>
                {hackathon.mode && (
                    <span className="px-2 py-1 rounded-full text-xs font-medium mode-badge">
                        {hackathon.mode}
                    </span>
                )}
            </div>

            {/* Title */}
            <h3 className="text-xl font-semibold mb-2 line-clamp-2 group-hover:text-primary-400 transition-colors">
                {hackathon.name}
            </h3>

            {/* Description */}
            {hackathon.description && (
                <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                    {hackathon.description}
                </p>
            )}

            {/* Details */}
            <div className="space-y-2 mb-4">
                <div className={`flex items-center gap-2 ${urgencyColor}`}>
                    <Clock size={16} />
                    <span className="text-sm font-medium">
                        {daysLeft === 0 ? 'Ends today!' : `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`}
                    </span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                    <Calendar size={16} />
                    <span className="text-sm">
                        Deadline: {format(deadline, 'MMM d, yyyy')}
                    </span>
                </div>
                {hackathon.prize_pool && (
                    <div className="flex items-center gap-2 text-yellow-400">
                        <Trophy size={16} />
                        <span className="text-sm">{hackathon.prize_pool}</span>
                    </div>
                )}
            </div>

            {/* Tags */}
            {hackathon.tags && hackathon.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                    {hackathon.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="px-2 py-0.5 rounded tag-badge text-xs">
                            {tag}
                        </span>
                    ))}
                    {hackathon.tags.length > 3 && (
                        <span className="px-2 py-0.5 rounded tag-badge text-xs">
                            +{hackathon.tags.length - 3}
                        </span>
                    )}
                </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 pt-4 border-t border-white/10">
                <Link
                    href={`/hackathon/${hackathon.id}`}
                    className="flex-1 btn-primary text-center text-sm py-2"
                >
                    Schedule Now
                </Link>
                <a
                    href={hackathon.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                    title="View on platform"
                >
                    <ExternalLink size={18} />
                </a>
            </div>
        </div>
    )
}
