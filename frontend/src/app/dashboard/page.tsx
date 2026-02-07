'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import {
    Calendar, Clock, Plus, Trophy, Target, TrendingUp, Bookmark,
    CheckCircle2, Zap, Activity, AlertCircle, ArrowRight
} from 'lucide-react'
import { api } from '@/lib/api'
import { ScheduleCard } from '@/components/schedule/ScheduleCard'
import { format, isToday, isTomorrow, addDays } from 'date-fns'

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

    // Get upcoming sessions (today + next 7 days)
    const upcomingSessions = schedules?.items?.flatMap((schedule: any) =>
        (schedule.sessions || []).map((session: any) => ({
            ...session,
            hackathonName: schedule.hackathon_name,
            scheduleId: schedule.id,
        }))
    ).filter((session: any) => {
        const sessionStart = new Date(session.start_time)
        const now = new Date()
        const weekFromNow = addDays(now, 7)
        return sessionStart >= now && sessionStart <= weekFromNow
    }).sort((a: any, b: any) =>
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    ).slice(0, 5) || []

    return (
        <div className="min-h-screen">
            {/* Hero Header */}
            <div className="relative overflow-hidden border-b border-border-subtle">
                <div className="absolute inset-0 bg-gradient-mesh opacity-40" />
                <div className="absolute inset-0 noise-texture" />

                <div className="relative max-w-7xl mx-auto px-4 py-12">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-moderate border border-border-subtle mb-4 text-sm font-mono">
                                <Activity className="w-4 h-4 text-accent-primary" />
                                <span className="text-text-secondary">Mission Control</span>
                            </div>

                            <h1 className="text-5xl md:text-6xl font-display font-bold mb-3 leading-tight">
                                Your{' '}
                                <span className="bg-gradient-to-r from-accent-primary to-accent-secondary bg-clip-text text-transparent">
                                    Dashboard
                                </span>
                            </h1>

                            <p className="text-xl text-text-secondary font-mono">
                                Track schedules, monitor deadlines, execute plans
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <Link href="/saved" className="btn btn-secondary inline-flex items-center gap-2">
                                <Bookmark size={18} />
                                <span>Saved ({bookmarks?.length || 0})</span>
                            </Link>
                            <Link href="/discover" className="btn btn-primary inline-flex items-center gap-2 group">
                                <Plus size={20} />
                                <span>New Schedule</span>
                                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Progress Overview */}
                <div className="card-glass p-6 mb-8 border-accent-primary/30">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div className="flex-1 w-full">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-lg font-display font-semibold text-text-primary">Overall Progress</h3>
                                <span className="text-3xl font-display font-bold text-accent-primary font-mono">{progressPercent}%</span>
                            </div>

                            <div className="h-4 bg-surface-moderate rounded-full overflow-hidden border border-border-subtle mb-2">
                                <div
                                    className="h-full bg-gradient-to-r from-accent-primary to-accent-secondary transition-all duration-500 relative overflow-hidden"
                                    style={{ width: `${progressPercent}%` }}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
                                </div>
                            </div>

                            <p className="text-sm text-text-tertiary font-mono">
                                {completedSessions} of {totalSessions} sessions completed
                            </p>
                        </div>

                        <div className="flex gap-8 text-center">
                            <div>
                                <div className="text-4xl font-display font-bold text-accent-success mb-1">{completedSchedules.length}</div>
                                <div className="text-xs text-text-quaternary uppercase tracking-wider font-mono">Completed</div>
                            </div>
                            <div>
                                <div className="text-4xl font-display font-bold text-accent-primary mb-1">{activeSchedules.length}</div>
                                <div className="text-xs text-text-quaternary uppercase tracking-wider font-mono">Active</div>
                            </div>
                            <div>
                                <div className="text-4xl font-display font-bold text-accent-warning mb-1">{Math.round(totalHours)}h</div>
                                <div className="text-xs text-text-quaternary uppercase tracking-wider font-mono">Planned</div>
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
                        color="from-accent-primary to-accent-primary/80"
                    />
                    <StatCard
                        label="Total Sessions"
                        value={totalSessions}
                        icon={<Target className="w-5 h-5" />}
                        color="from-accent-secondary to-accent-secondary/80"
                    />
                    <StatCard
                        label="Hours Planned"
                        value={`${Math.round(totalHours)}h`}
                        icon={<Clock className="w-5 h-5" />}
                        color="from-accent-warning to-accent-warning/80"
                    />
                    <StatCard
                        label="Bookmarked"
                        value={bookmarks?.length || 0}
                        icon={<Bookmark className="w-5 h-5" />}
                        color="from-accent-success to-accent-success/80"
                    />
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Main Content - Schedules */}
                    <div className="lg:col-span-2">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-display font-bold">Your Schedules</h2>
                            {schedules?.items?.length > 0 && (
                                <span className="text-sm font-mono text-text-tertiary">
                                    {schedules.items.length} total
                                </span>
                            )}
                        </div>

                        {isLoading ? (
                            <div className="space-y-4">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="card animate-pulse">
                                        <div className="flex gap-4">
                                            <div className="w-20 h-20 bg-surface-moderate rounded-lg" />
                                            <div className="flex-1">
                                                <div className="h-6 bg-surface-moderate rounded mb-2 w-1/3" />
                                                <div className="h-4 bg-surface-moderate rounded w-1/2" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : schedules?.items?.length ? (
                            <div className="space-y-4 stagger-children">
                                {schedules.items.map((schedule: any) => (
                                    <ScheduleCard key={schedule.id} schedule={schedule} />
                                ))}
                            </div>
                        ) : (
                            <div className="card text-center py-16">
                                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-surface-subtle border border-border-subtle flex items-center justify-center">
                                    <Calendar className="w-10 h-10 text-text-quaternary" />
                                </div>
                                <h3 className="text-2xl font-display font-semibold mb-3">No schedules yet</h3>
                                <p className="text-text-tertiary mb-6 max-w-md mx-auto font-mono">
                                    Start by discovering a hackathon and creating your first execution plan.
                                </p>
                                <Link href="/discover" className="btn btn-primary inline-flex items-center gap-2">
                                    <Plus size={18} />
                                    <span>Create Your First Schedule</span>
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Sidebar - Upcoming Sessions */}
                    <div className="lg:col-span-1">
                        <h2 className="text-2xl font-display font-bold mb-6">Upcoming Sessions</h2>

                        {upcomingSessions.length > 0 ? (
                            <div className="space-y-3">
                                {upcomingSessions.map((session: any, idx: number) => (
                                    <UpcomingSessionCard key={idx} session={session} />
                                ))}
                            </div>
                        ) : (
                            <div className="card text-center py-12">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-surface-subtle border border-border-subtle flex items-center justify-center">
                                    <Clock className="w-8 h-8 text-text-quaternary" />
                                </div>
                                <h3 className="text-lg font-display font-semibold mb-2">No upcoming sessions</h3>
                                <p className="text-sm text-text-tertiary font-mono">
                                    Create a schedule to see your sessions here.
                                </p>
                            </div>
                        )}

                        {/* Quick Tip */}
                        <div className="card bg-accent-primary/5 border-accent-primary/20 mt-6">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-lg bg-accent-primary/20 flex items-center justify-center flex-shrink-0">
                                    <Zap className="w-5 h-5 text-accent-primary" />
                                </div>
                                <div>
                                    <h4 className="font-display font-semibold mb-2 text-text-primary">Pro Tip</h4>
                                    <p className="text-sm text-text-tertiary leading-relaxed font-mono">
                                        Sync your schedules to Google Calendar to get reminders for each session.
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

function StatCard({
    label,
    value,
    icon,
    color
}: {
    label: string
    value: string | number
    icon: React.ReactNode
    color: string
}) {
    return (
        <div className="card group hover:scale-[1.02] transition-all">
            <div className="flex items-center justify-between mb-3">
                <span className="text-text-tertiary text-sm font-mono uppercase tracking-wider">{label}</span>
                <div className={`bg-gradient-to-br ${color} text-transparent bg-clip-text group-hover:scale-110 transition-transform`}>
                    {icon}
                </div>
            </div>
            <p className="text-4xl font-display font-bold text-text-primary">{value}</p>
        </div>
    )
}

function UpcomingSessionCard({ session }: { session: any }) {
    const startTime = new Date(session.start_time)
    const endTime = new Date(session.end_time)

    const timeLabel = isToday(startTime)
        ? 'Today'
        : isTomorrow(startTime)
            ? 'Tomorrow'
            : format(startTime, 'MMM d')

    const phaseColors: Record<string, string> = {
        preparation: 'from-accent-warning to-accent-warning/80',
        building: 'from-accent-primary to-accent-primary/80',
        submission: 'from-accent-success to-accent-success/80',
    }

    return (
        <Link href={`/schedule/${session.scheduleId}`}>
            <div className="card-glass p-4 hover:border-accent-primary/50 transition-all group cursor-pointer">
                <div className="flex items-start justify-between mb-2">
                    <div className={`px-2 py-1 rounded text-xs font-mono bg-gradient-to-r ${phaseColors[session.phase_type] || 'from-surface-moderate to-surface-moderate'}`}>
                        <span className="text-white font-semibold">{session.phase_type}</span>
                    </div>
                    <span className="text-xs font-mono text-text-quaternary">{timeLabel}</span>
                </div>

                <h4 className="font-display font-semibold text-sm mb-1 text-text-primary group-hover:text-accent-primary transition-colors line-clamp-1">
                    {session.hackathonName}
                </h4>

                <p className="text-xs text-text-tertiary mb-3 line-clamp-2">
                    {session.description}
                </p>

                <div className="flex items-center gap-2 text-xs font-mono text-text-quaternary">
                    <Clock className="w-3 h-3" />
                    <span>{format(startTime, 'h:mm a')} - {format(endTime, 'h:mm a')}</span>
                </div>
            </div>
        </Link>
    )
}
