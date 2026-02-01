'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import Link from 'next/link'
import {
    Clock, Calendar, MapPin, Trophy, ExternalLink,
    ArrowLeft, Zap, CheckCircle, Play
} from 'lucide-react'
import { api } from '@/lib/api'
import { format } from 'date-fns'

export default function HackathonDetailPage() {
    const params = useParams()
    const router = useRouter()
    const hackathonId = params.id as string

    const { data: hackathon, isLoading, error } = useQuery({
        queryKey: ['hackathon', hackathonId],
        queryFn: () => api.getHackathon(hackathonId),
    })

    const createScheduleMutation = useMutation({
        mutationFn: () => api.createSchedule(hackathonId),
        onSuccess: (data) => {
            router.push(`/schedule/${data.id}`)
        },
        onError: (error: any) => {
            alert(error.response?.data?.detail || 'Failed to create schedule. Please log in first.')
        }
    })

    if (isLoading) {
        return (
            <div className="min-h-screen px-4 py-8">
                <div className="max-w-4xl mx-auto">
                    <div className="card animate-pulse">
                        <div className="h-8 bg-white/10 rounded w-1/3 mb-4" />
                        <div className="h-4 bg-white/10 rounded w-2/3 mb-2" />
                        <div className="h-4 bg-white/10 rounded w-1/2" />
                    </div>
                </div>
            </div>
        )
    }

    if (error || !hackathon) {
        return (
            <div className="min-h-screen px-4 py-8">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-2xl font-bold mb-4">Hackathon not found</h1>
                    <Link href="/discover" className="btn-primary">
                        Back to Discover
                    </Link>
                </div>
            </div>
        )
    }

    const deadline = new Date(hackathon.submission_deadline)
    const daysLeft = Math.max(0, Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    const urgencyColor = daysLeft <= 7 ? 'text-red-400' : daysLeft <= 14 ? 'text-yellow-400' : 'text-green-400'

    return (
        <div className="min-h-screen px-4 py-8">
            <div className="max-w-4xl mx-auto">
                {/* Back Button */}
                <Link
                    href="/discover"
                    className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
                >
                    <ArrowLeft size={18} />
                    Back to Discover
                </Link>

                {/* Header */}
                <div className="card mb-6">
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                        <span className="px-3 py-1 rounded-full text-sm font-medium bg-primary-500/20 text-primary-400">
                            {hackathon.platform.toUpperCase()}
                        </span>
                        {hackathon.mode && (
                            <span className="px-3 py-1 rounded-full text-sm font-medium bg-white/10 text-gray-300">
                                {hackathon.mode}
                            </span>
                        )}
                    </div>

                    <h1 className="text-3xl md:text-4xl font-bold mb-4">{hackathon.name}</h1>

                    {hackathon.description && (
                        <p className="text-gray-300 text-lg mb-6">{hackathon.description}</p>
                    )}

                    {/* Key Info */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="p-4 bg-white/5 rounded-lg">
                            <div className={`flex items-center gap-2 ${urgencyColor} mb-1`}>
                                <Clock size={18} />
                                <span className="font-semibold">{daysLeft} days</span>
                            </div>
                            <span className="text-sm text-gray-400">until deadline</span>
                        </div>

                        <div className="p-4 bg-white/5 rounded-lg">
                            <div className="flex items-center gap-2 text-white mb-1">
                                <Calendar size={18} />
                                <span className="font-semibold">{format(deadline, 'MMM d, yyyy')}</span>
                            </div>
                            <span className="text-sm text-gray-400">submission deadline</span>
                        </div>

                        {hackathon.prize_pool && (
                            <div className="p-4 bg-white/5 rounded-lg">
                                <div className="flex items-center gap-2 text-yellow-400 mb-1">
                                    <Trophy size={18} />
                                    <span className="font-semibold">{hackathon.prize_pool}</span>
                                </div>
                                <span className="text-sm text-gray-400">prize pool</span>
                            </div>
                        )}

                        {hackathon.location && (
                            <div className="p-4 bg-white/5 rounded-lg">
                                <div className="flex items-center gap-2 text-white mb-1">
                                    <MapPin size={18} />
                                    <span className="font-semibold">{hackathon.location}</span>
                                </div>
                                <span className="text-sm text-gray-400">location</span>
                            </div>
                        )}
                    </div>

                    {/* Tags */}
                    {hackathon.tags && hackathon.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-6">
                            {hackathon.tags.map((tag: string) => (
                                <span key={tag} className="px-3 py-1 rounded-full bg-white/5 text-gray-300 text-sm">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap gap-4">
                        <button
                            onClick={() => createScheduleMutation.mutate()}
                            disabled={createScheduleMutation.isPending}
                            className="btn-primary inline-flex items-center gap-2"
                        >
                            <Zap size={18} />
                            {createScheduleMutation.isPending ? 'Creating...' : 'Generate Execution Plan'}
                        </button>

                        <a
                            href={hackathon.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-secondary inline-flex items-center gap-2"
                        >
                            <ExternalLink size={18} />
                            View on {hackathon.platform}
                        </a>
                    </div>
                </div>

                {/* Scheduling Info */}
                <div className="card">
                    <h2 className="text-xl font-semibold mb-4">How HackathonOS Works</h2>

                    <div className="space-y-4">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                                <span className="text-yellow-400 font-bold">1</span>
                            </div>
                            <div>
                                <h3 className="font-semibold mb-1">Preparation Phase (30%)</h3>
                                <p className="text-gray-400 text-sm">Research, ideation, and planning. Understand the problem and design your solution.</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                                <span className="text-blue-400 font-bold">2</span>
                            </div>
                            <div>
                                <h3 className="font-semibold mb-1">Building Phase (60%)</h3>
                                <p className="text-gray-400 text-sm">Development and implementation. Build your core features and iterate.</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                                <span className="text-green-400 font-bold">3</span>
                            </div>
                            <div>
                                <h3 className="font-semibold mb-1">Submission Phase (10%)</h3>
                                <p className="text-gray-400 text-sm">Testing, documentation, and final submission. Polish and submit your project.</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 p-4 bg-primary-500/10 border border-primary-500/20 rounded-lg">
                        <p className="text-sm text-primary-300">
                            <strong>Tip:</strong> Click "Generate Execution Plan" to create a personalized schedule based on your availability and the hackathon deadline.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
