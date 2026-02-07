'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Calendar, Clock, Plus, Trophy, Target, TrendingUp, Bookmark, CheckCircle2 } from 'lucide-react'
import { api } from '@/lib/api'
import { ScheduleCard } from '@/components/schedule/ScheduleCard'

export default function DashboardPage() {
    const { data: schedules, isLoading } = useQuery({
        queryKey: ['schedules'],
        queryFn: api.getSchedules,
    })

    const { data: bookmarks } = useQuery({
        queryKey: ['bookmarks'],
        queryFn: api.getBookmarks,
    })

    // Calculate stats
    const activeSchedules = schedules?.items?.filter((s: any) => s.status === 'active') || []
    const completedSchedules = schedules?.items?.filter((s: any) => s.status === 'completed') || []
    const totalHours = schedules?.items?.reduce((sum: number, s: any) => sum + (s.total_hours || 0), 0) || 0
    const totalSessions = schedules?.items?.reduce((sum: number, s: any) => sum + (s.sessions?.length || 0), 0) || 0

    // Calculate overall progress
    const completedSessions = schedules?.items?.reduce((sum: number, s: any) => {
        const sessions = s.sessions || []
        return sum + sessions.filter((sess: any) => new Date(sess.end_time) < new Date()).length
    }, 0) || 0

    const progressPercent = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0

    return (
        <div className="min-h-screen px-4 py-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-4xl font-bold mb-2">
                            Your <span className="gradient-text">Dashboard</span>
                        </h1>
                        <p className="text-gray-400 text-lg">
                            Track your hackathon schedules and stay on top of deadlines
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Link href="/saved" className="btn-secondary inline-flex items-center gap-2">
                            <Bookmark size={18} />
                            Saved ({bookmarks?.length || 0})
                        </Link>
                        <Link href="/discover" className="btn-primary inline-flex items-center gap-2">
                            <Plus size={20} />
                            New Schedule
                        </Link>
                    </div>
                </div>

                {/* Progress Overview */}
                <div className="card mb-8 bg-gradient-to-r from-primary-500/10 to-accent-500/10 border-primary-500/20">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold mb-2">Overall Progress</h3>
                            <div className="flex items-center gap-4">
                                <div className="flex-1 h-3 bg-white/10 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-primary-500 to-accent-500 transition-all duration-500"
                                        style={{ width: `${progressPercent}%` }}
                                    />
                                </div>
                                <span className="text-2xl font-bold text-primary-400">{progressPercent}%</span>
                            </div>
                            <p className="text-sm text-gray-400 mt-2">
                                {completedSessions} of {totalSessions} sessions completed
                            </p>
                        </div>
                        <div className="flex gap-6 text-center">
                            <div>
                                <div className="text-3xl font-bold text-green-400">{completedSchedules.length}</div>
                                <div className="text-xs text-gray-400">Completed</div>
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-primary-400">{activeSchedules.length}</div>
                                <div className="text-xs text-gray-400">Active</div>
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-yellow-400">{Math.round(totalHours)}h</div>
                                <div className="text-xs text-gray-400">Planned</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <StatCard
                        label="Active Schedules"
                        value={activeSchedules.length}
                        icon={<Calendar className="w-5 h-5" />}
                        color="primary"
                    />
                    <StatCard
                        label="Total Sessions"
                        value={totalSessions}
                        icon={<Target className="w-5 h-5" />}
                        color="accent"
                    />
                    <StatCard
                        label="Hours Planned"
                        value={`${Math.round(totalHours)}h`}
                        icon={<Clock className="w-5 h-5" />}
                        color="yellow"
                    />
                    <StatCard
                        label="Bookmarked"
                        value={bookmarks?.length || 0}
                        icon={<Bookmark className="w-5 h-5" />}
                        color="green"
                    />
                </div>

                {/* Schedules */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-semibold">Your Schedules</h2>
                    </div>

                    {isLoading ? (
                        <div className="space-y-4">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="card animate-pulse">
                                    <div className="flex gap-4">
                                        <div className="w-20 h-20 bg-white/10 rounded-lg" />
                                        <div className="flex-1">
                                            <div className="h-6 bg-white/10 rounded mb-2 w-1/3" />
                                            <div className="h-4 bg-white/10 rounded w-1/2" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : schedules?.items?.length ? (
                        <div className="space-y-4">
                            {schedules.items.map((schedule: any) => (
                                <ScheduleCard key={schedule.id} schedule={schedule} />
                            ))}
                        </div>
                    ) : (
                        <div className="card text-center py-12">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                                <Calendar className="w-8 h-8 text-gray-500" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">No schedules yet</h3>
                            <p className="text-gray-400 mb-6">
                                Start by discovering a hackathon and creating your first schedule.
                            </p>
                            <Link href="/discover" className="btn-primary inline-flex items-center gap-2">
                                <Plus size={18} />
                                Create Your First Schedule
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function StatCard({
    label,
    value,
    icon,
    color = 'primary'
}: {
    label: string
    value: string | number
    icon: React.ReactNode
    color?: 'primary' | 'accent' | 'yellow' | 'green'
}) {
    const colors = {
        primary: 'text-primary-400',
        accent: 'text-accent-400',
        yellow: 'text-yellow-400',
        green: 'text-green-400',
    }

    return (
        <div className="card hover:scale-[1.02] transition-transform">
            <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">{label}</span>
                <div className={colors[color]}>{icon}</div>
            </div>
            <p className="text-3xl font-bold">{value}</p>
        </div>
    )
}
