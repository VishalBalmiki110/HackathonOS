'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import Link from 'next/link'
import {
    Clock, Calendar, MapPin, Trophy, ExternalLink,
    ArrowLeft, Zap, CheckCircle, Play, AlertCircle, Target
} from 'lucide-react'
import { api } from '@/lib/api'
import { format } from 'date-fns'
import { useState, useEffect } from 'react'

export default function HackathonDetailPage() {
    const params = useParams()
    const router = useRouter()
    const hackathonId = params.id as string
    const [timeRemaining, setTimeRemaining] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })

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

    // Live countdown ticker
    useEffect(() => {
        if (!hackathon) return

        const updateCountdown = () => {
            const deadline = new Date(hackathon.submission_deadline)
            const now = new Date()
            const diff = deadline.getTime() - now.getTime()

            if (diff > 0) {
                const days = Math.floor(diff / (1000 * 60 * 60 * 24))
                const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
                const seconds = Math.floor((diff % (1000 * 60)) / 1000)
                setTimeRemaining({ days, hours, minutes, seconds })
            } else {
                setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0 })
            }
        }

        updateCountdown()
        const interval = setInterval(updateCountdown, 1000)
        return () => clearInterval(interval)
    }, [hackathon])

    if (isLoading) {
        return (
            <div className="min-h-screen px-4 py-8">
                <div className="max-w-6xl mx-auto">
                    <div className="card animate-pulse">
                        <div className="h-8 bg-surface-moderate rounded w-1/3 mb-4" />
                        <div className="h-4 bg-surface-moderate rounded w-2/3 mb-2" />
                        <div className="h-4 bg-surface-moderate rounded w-1/2" />
                    </div>
                </div>
            </div>
        )
    }

    if (error || !hackathon) {
        return (
            <div className="min-h-screen px-4 py-8">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="card">
                        <AlertCircle className="w-16 h-16 text-accent-danger mx-auto mb-4" />
                        <h1 className="text-2xl font-display font-bold mb-4">Hackathon not found</h1>
                        <p className="text-text-tertiary mb-6">This hackathon may have been removed or the link is incorrect.</p>
                        <Link href="/discover" className="btn btn-primary inline-flex items-center gap-2">
                            <ArrowLeft size={18} />
                            Back to Discover
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    const deadline = new Date(hackathon.submission_deadline)
    const daysLeft = Math.max(0, Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    const isUrgent = daysLeft <= 7
    const isCritical = daysLeft <= 3

    const platformColors: Record<string, string> = {
        devpost: 'platform-badge-devpost',
        mlh: 'platform-badge-mlh',
        unstop: 'platform-badge-unstop',
        dorahacks: 'platform-badge-dorahacks',
    }

    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <div className="relative overflow-hidden border-b border-border-subtle">
                <div className="absolute inset-0 bg-gradient-mesh opacity-40" />
                <div className="absolute inset-0 noise-texture" />
                {isUrgent && (
                    <div className="absolute inset-0 bg-gradient-to-br from-accent-danger/10 to-transparent" />
                )}

                <div className="relative max-w-6xl mx-auto px-4 py-8">
                    {/* Back Button */}
                    <Link
                        href="/discover"
                        className="inline-flex items-center gap-2 text-text-tertiary hover:text-accent-primary mb-6 transition-colors font-mono text-sm group"
                    >
                        <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
                        <span>Back to Discover</span>
                    </Link>

                    <div className="grid lg:grid-cols-3 gap-8">
                        {/* Main Info */}
                        <div className="lg:col-span-2">
                            {/* Badges */}
                            <div className="flex flex-wrap items-center gap-2 mb-4">
                                <span className={`px-3 py-1.5 rounded-md text-sm font-mono ${platformColors[hackathon.platform] || 'platform-badge-fallback'}`}>
                                    {hackathon.platform.toUpperCase()}
                                </span>
                                {hackathon.mode && (
                                    <span className="px-3 py-1.5 rounded-md text-sm mode-badge font-mono">
                                        {hackathon.mode}
                                    </span>
                                )}
                                {isUrgent && (
                                    <span className={`px-3 py-1.5 rounded-md text-sm font-mono ${isCritical ? 'urgency-critical' : 'urgency-warning'} border ${isCritical ? 'border-accent-danger bg-accent-danger/10' : 'border-accent-warning bg-accent-warning/10'}`}>
                                        {isCritical ? '🔥 CRITICAL' : '⚠️ URGENT'}
                                    </span>
                                )}
                            </div>

                            {/* Title */}
                            <h1 className="text-4xl md:text-5xl font-display font-bold mb-4 leading-tight">
                                {hackathon.name}
                            </h1>

                            {/* Description */}
                            {hackathon.description && (
                                <p className="text-xl text-text-secondary mb-6 leading-relaxed">
                                    {hackathon.description}
                                </p>
                            )}

                            {/* Tags */}
                            {hackathon.tags && hackathon.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-6">
                                    {hackathon.tags.map((tag: string) => (
                                        <span key={tag} className="px-3 py-1 rounded tag-badge text-sm">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Countdown Timer */}
                        <div className="lg:col-span-1">
                            <div className={`card-glass p-6 text-center ${isCritical ? 'border-accent-danger/50 animate-pulse-glow' : isUrgent ? 'border-accent-warning/50' : ''}`}>
                                <div className="text-sm font-mono text-text-tertiary uppercase tracking-wider mb-3">
                                    Time Remaining
                                </div>

                                <div className="grid grid-cols-4 gap-2 mb-4">
                                    <CountdownUnit value={timeRemaining.days} label="Days" />
                                    <CountdownUnit value={timeRemaining.hours} label="Hrs" />
                                    <CountdownUnit value={timeRemaining.minutes} label="Min" />
                                    <CountdownUnit value={timeRemaining.seconds} label="Sec" />
                                </div>

                                <div className="text-sm font-mono text-text-tertiary">
                                    Deadline: {format(deadline, 'MMM d, yyyy • h:mm a')}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 py-8">
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Key Details */}
                        <div className="card">
                            <h2 className="text-2xl font-display font-bold mb-6">Details</h2>

                            <div className="grid grid-cols-2 gap-4">
                                {hackathon.prize_pool && (
                                    <div className="p-4 bg-surface-subtle rounded-lg border border-border-subtle">
                                        <div className="flex items-center gap-2 text-accent-warning mb-2">
                                            <Trophy size={20} />
                                            <span className="font-display font-semibold">Prize Pool</span>
                                        </div>
                                        <div className="text-2xl font-display font-bold text-text-primary">
                                            {hackathon.prize_pool}
                                        </div>
                                    </div>
                                )}

                                {hackathon.location && (
                                    <div className="p-4 bg-surface-subtle rounded-lg border border-border-subtle">
                                        <div className="flex items-center gap-2 text-accent-info mb-2">
                                            <MapPin size={20} />
                                            <span className="font-display font-semibold">Location</span>
                                        </div>
                                        <div className="text-lg font-mono text-text-primary">
                                            {hackathon.location}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Phase Timeline */}
                        <div className="card">
                            <h2 className="text-2xl font-display font-bold mb-6">Execution Phases</h2>

                            <div className="relative space-y-6">
                                {/* Timeline line */}
                                <div className="absolute left-5 top-8 bottom-8 w-0.5 bg-gradient-to-b from-accent-warning via-accent-primary to-accent-success" />

                                <PhaseCard
                                    number={1}
                                    title="Preparation Phase"
                                    percentage="30%"
                                    description="Research, ideation, and planning. Understand the problem and design your solution."
                                    color="from-accent-warning to-accent-warning/80"
                                    icon={<Target size={20} />}
                                />

                                <PhaseCard
                                    number={2}
                                    title="Building Phase"
                                    percentage="60%"
                                    description="Development and implementation. Build your core features and iterate rapidly."
                                    color="from-accent-primary to-accent-primary/80"
                                    icon={<Zap size={20} />}
                                />

                                <PhaseCard
                                    number={3}
                                    title="Submission Phase"
                                    percentage="10%"
                                    description="Testing, documentation, and final submission. Polish and ship your project."
                                    color="from-accent-success to-accent-success/80"
                                    icon={<CheckCircle size={20} />}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* CTA Card */}
                        <div className="card-glass p-6">
                            <h3 className="text-xl font-display font-bold mb-4">Generate Your Plan</h3>
                            <p className="text-sm text-text-tertiary mb-6 font-mono">
                                Create a personalized execution schedule based on your availability and the deadline.
                            </p>

                            <div className="space-y-3">
                                <button
                                    onClick={() => createScheduleMutation.mutate()}
                                    disabled={createScheduleMutation.isPending}
                                    className="w-full btn btn-primary justify-center group"
                                >
                                    <Zap className={createScheduleMutation.isPending ? 'animate-spin' : ''} size={18} />
                                    <span>{createScheduleMutation.isPending ? 'Creating...' : 'Generate Plan'}</span>
                                </button>

                                <a
                                    href={hackathon.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full btn btn-secondary justify-center"
                                >
                                    <ExternalLink size={18} />
                                    <span>View on {hackathon.platform}</span>
                                </a>
                            </div>
                        </div>

                        {/* Info Card */}
                        <div className="card bg-accent-primary/5 border-accent-primary/20">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-lg bg-accent-primary/20 flex items-center justify-center flex-shrink-0 mt-1">
                                    <AlertCircle className="w-5 h-5 text-accent-primary" />
                                </div>
                                <div>
                                    <h4 className="font-display font-semibold mb-2 text-text-primary">How It Works</h4>
                                    <p className="text-sm text-text-tertiary leading-relaxed font-mono">
                                        HackathonOS breaks down the deadline into structured phases with realistic time allocations.
                                        Click "Generate Plan" to create your schedule.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
    return (
        <div className="bg-surface-moderate border border-border-subtle rounded-lg p-2">
            <div className="text-3xl font-display font-bold text-accent-primary font-mono leading-none mb-1">
                {String(value).padStart(2, '0')}
            </div>
            <div className="text-[10px] font-mono text-text-quaternary uppercase tracking-wider">
                {label}
            </div>
        </div>
    )
}

function PhaseCard({
    number,
    title,
    percentage,
    description,
    color,
    icon
}: {
    number: number
    title: string
    percentage: string
    description: string
    color: string
    icon: React.ReactNode
}) {
    return (
        <div className="relative flex items-start gap-4 pl-12">
            {/* Number badge */}
            <div className={`absolute left-0 w-10 h-10 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center text-white font-display font-bold border-4 border-bg-primary`}>
                {number}
            </div>

            {/* Content */}
            <div className="flex-1 pb-2">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <div className={`text-transparent bg-gradient-to-r ${color} bg-clip-text`}>
                            {icon}
                        </div>
                        <h3 className="font-display font-bold text-lg text-text-primary">{title}</h3>
                    </div>
                    <span className="text-sm font-mono font-semibold text-accent-primary">
                        {percentage}
                    </span>
                </div>
                <p className="text-sm text-text-tertiary leading-relaxed">
                    {description}
                </p>
            </div>
        </div>
    )
}
