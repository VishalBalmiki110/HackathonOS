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
        onMutate: async (shouldBookmark: boolean) => {
            // Optimistic update
            setIsBookmarked(shouldBookmark)
        },
        onSuccess: () => {
            // Invalidate bookmarks query to refresh saved page
            queryClient.invalidateQueries({ queryKey: ['bookmarks'] })
        },
        onError: (error: any, shouldBookmark: boolean) => {
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
        <div className={`card group relative overflow-hidden ${daysLeft <= 7 ? 'border-accent-danger/30' : ''}`}>
            {/* Urgency glow for critical deadlines */}
            {daysLeft <= 7 && (
                <div className="absolute inset-0 bg-gradient-to-br from-accent-danger/5 to-transparent pointer-events-none" />
            )}

            {/* Bookmark Button */}
            <button
                onClick={handleBookmark}
                disabled={bookmarkMutation.isPending}
                className={`absolute top-4 right-4 z-10 p-2.5 rounded-lg backdrop-blur-sm transition-all ${isBookmarked
                        ? 'bg-accent-primary/20 text-accent-primary border border-accent-primary/30'
                        : 'bg-surface-moderate border border-border-subtle text-text-tertiary hover:text-accent-primary hover:border-accent-primary/30'
                    } ${bookmarkMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={isBookmarked ? 'Remove bookmark' : 'Bookmark this hackathon'}
            >
                {isBookmarked ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
            </button>

            {/* Image */}
            {hackathon.image_url && (
                <div className="h-40 -mx-6 -mt-6 mb-5 overflow-hidden bg-surface-subtle relative">
                    <img
                        src={hackathon.image_url}
                        alt={hackathon.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-transparent to-transparent" />
                </div>
            )}

            {/* Platform & Mode Badges */}
            <div className="flex items-center gap-2 mb-4">
                <span className={`px-2.5 py-1 rounded-md text-xs ${platformColors[hackathon.platform] || 'platform-badge-fallback'}`}>
                    {hackathon.platform.toUpperCase()}
                </span>
                {hackathon.mode && (
                    <span className="px-2.5 py-1 rounded-md text-xs mode-badge">
                        {hackathon.mode}
                    </span>
                )}
            </div>

            {/* Title */}
            <h3 className="text-xl font-display font-bold mb-3 line-clamp-2 text-text-primary group-hover:text-accent-primary transition-colors">
                {hackathon.name}
            </h3>

            {/* Description */}
            {hackathon.description && (
                <p className="text-text-tertiary text-sm mb-4 line-clamp-2 leading-relaxed">
                    {hackathon.description}
                </p>
            )}

            {/* Countdown & Details */}
            <div className="space-y-2.5 mb-4">
                {/* Urgency countdown */}
                <div className={`flex items-center gap-2 font-mono text-sm ${daysLeft <= 3 ? 'urgency-critical' :
                        daysLeft <= 7 ? 'urgency-warning' :
                            'urgency-normal'
                    }`}>
                    <Clock size={16} />
                    <span className="font-semibold">
                        {daysLeft === 0 ? 'ENDS TODAY!' : `${daysLeft}d ${daysLeft <= 3 ? 'URGENT' : 'left'}`}
                    </span>
                </div>

                {/* Deadline date */}
                <div className="flex items-center gap-2 text-text-tertiary font-mono text-sm">
                    <Calendar size={16} />
                    <span>
                        {format(deadline, 'MMM d, yyyy')}
                    </span>
                </div>

                {/* Prize pool */}
                {hackathon.prize_pool && (
                    <div className="flex items-center gap-2 text-accent-warning font-mono text-sm">
                        <Trophy size={16} />
                        <span className="font-semibold">{hackathon.prize_pool}</span>
                    </div>
                )}
            </div>

            {/* Tags */}
            {hackathon.tags && hackathon.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-5">
                    {hackathon.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="px-2 py-1 rounded tag-badge text-xs">
                            {tag}
                        </span>
                    ))}
                    {hackathon.tags.length > 3 && (
                        <span className="px-2 py-1 rounded tag-badge text-xs font-mono">
                            +{hackathon.tags.length - 3}
                        </span>
                    )}
                </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 pt-5 border-t border-border-subtle">
                <Link
                    href={`/hackathon/${hackathon.id}`}
                    className="flex-1 text-center btn btn-primary text-sm py-2.5"
                >
                    <span>Schedule Now</span>
                </Link>
                <a
                    href={hackathon.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-lg bg-surface-moderate border border-border-subtle hover:bg-surface-strong hover:border-border-moderate transition-all"
                    title="View on platform"
                >
                    <ExternalLink size={18} className="text-text-tertiary" />
                </a>
            </div>
        </div>
    )
}
