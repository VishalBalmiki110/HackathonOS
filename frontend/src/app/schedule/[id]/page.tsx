'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import Link from 'next/link'
import {
    Clock, Calendar, ArrowLeft, Download, Trash2,
    Play, CheckCircle, RefreshCw, ExternalLink
} from 'lucide-react'
import { api } from '@/lib/api'
import { format } from 'date-fns'

export default function ScheduleDetailPage() {
    const params = useParams()
    const router = useRouter()
    const scheduleId = params.id as string

    const { data: schedule, isLoading, error, refetch } = useQuery({
        queryKey: ['schedule', scheduleId],
        queryFn: () => api.getSchedule(scheduleId),
    })

    const activateMutation = useMutation({
        mutationFn: () => api.activateSchedule(scheduleId),
        onSuccess: () => refetch(),
    })

    const syncMutation = useMutation({
        mutationFn: () => api.syncToCalendar(scheduleId),
        onSuccess: () => {
            alert('Schedule synced to Google Calendar!')
            refetch()
        },
        onError: (error: any) => {
            alert(error.response?.data?.detail || 'Failed to sync. Please connect Google Calendar first.')
        }
    })

    const exportIcs = async () => {
        try {
            const blob = await api.exportIcs(scheduleId)
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `hackathon-schedule-${scheduleId}.ics`
            a.click()
            window.URL.revokeObjectURL(url)
        } catch (error) {
            alert('Failed to export ICS file')
        }
    }

    if (isLoading) {
        return (
            <div className="min-h-screen px-4 py-8">
                <div className="max-w-5xl mx-auto">
                    <div className="card animate-pulse">
                        <div className="h-8 bg-white/10 rounded w-1/3 mb-4" />
                        <div className="h-4 bg-white/10 rounded w-2/3" />
                    </div>
                </div>
            </div>
        )
    }

    if (error || !schedule) {
        return (
            <div className="min-h-screen px-4 py-8">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-2xl font-bold mb-4">Schedule not found</h1>
                    <Link href="/dashboard" className="btn-primary">
                        Back to Dashboard
                    </Link>
                </div>
            </div>
        )
    }

    const statusColors: Record<string, string> = {
        draft: 'bg-yellow-500/20 text-yellow-400',
        active: 'bg-green-500/20 text-green-400',
        completed: 'bg-blue-500/20 text-blue-400',
        cancelled: 'bg-gray-500/20 text-gray-400',
    }

    const phaseColors: Record<string, { bg: string; border: string; text: string }> = {
        preparation: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-400' },
        building: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400' },
        submission: { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400' },
    }

    // Group sessions by date
    const sessionsByDate = schedule.sessions?.reduce((acc: Record<string, any[]>, session: any) => {
        const date = format(new Date(session.start_time), 'yyyy-MM-dd')
        if (!acc[date]) acc[date] = []
        acc[date].push(session)
        return acc
    }, {}) || {}

    return (
        <div className="min-h-screen px-4 py-8">
            <div className="max-w-5xl mx-auto">
                {/* Back Button */}
                <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
                >
                    <ArrowLeft size={18} />
                    Back to Dashboard
                </Link>

                {/* Header */}
                <div className="card mb-6">
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[schedule.status]}`}>
                            {schedule.status.toUpperCase()}
                        </span>
                        {schedule.calendar_synced && (
                            <span className="px-3 py-1 rounded-full text-sm font-medium bg-primary-500/20 text-primary-400">
                                📅 Synced to Calendar
                            </span>
                        )}
                    </div>

                    <h1 className="text-3xl font-bold mb-2">{schedule.hackathon?.name || 'Schedule'}</h1>

                    <div className="flex flex-wrap items-center gap-6 text-gray-400 mb-6">
                        <div className="flex items-center gap-2">
                            <Clock size={18} />
                            <span>{schedule.total_hours?.toFixed(1) || 0} total hours</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar size={18} />
                            <span>{schedule.sessions?.length || 0} sessions</span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-3">
                        {schedule.status === 'draft' && (
                            <button
                                onClick={() => activateMutation.mutate()}
                                disabled={activateMutation.isPending}
                                className="btn-primary inline-flex items-center gap-2"
                            >
                                <Play size={18} />
                                {activateMutation.isPending ? 'Activating...' : 'Activate Schedule'}
                            </button>
                        )}

                        <button
                            onClick={() => syncMutation.mutate()}
                            disabled={syncMutation.isPending}
                            className="btn-secondary inline-flex items-center gap-2"
                        >
                            <RefreshCw size={18} className={syncMutation.isPending ? 'animate-spin' : ''} />
                            {syncMutation.isPending ? 'Syncing...' : 'Sync to Google Calendar'}
                        </button>

                        <button
                            onClick={exportIcs}
                            className="btn-secondary inline-flex items-center gap-2"
                        >
                            <Download size={18} />
                            Export ICS
                        </button>
                    </div>
                </div>

                {/* Phase Summary */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    {['preparation', 'building', 'submission'].map((phase) => {
                        const sessions = schedule.sessions?.filter((s: any) => s.phase === phase) || []
                        const hours = sessions.reduce((sum: number, s: any) => {
                            const start = new Date(s.start_time)
                            const end = new Date(s.end_time)
                            return sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60)
                        }, 0)
                        const colors = phaseColors[phase]

                        return (
                            <div key={phase} className={`card ${colors.bg} ${colors.border} border`}>
                                <div className={`text-sm font-medium ${colors.text} uppercase mb-1`}>
                                    {phase}
                                </div>
                                <div className="text-2xl font-bold">{hours.toFixed(1)}h</div>
                                <div className="text-sm text-gray-400">{sessions.length} sessions</div>
                            </div>
                        )
                    })}
                </div>

                {/* Sessions Timeline */}
                <div className="card">
                    <h2 className="text-xl font-semibold mb-4">Session Timeline</h2>

                    {Object.keys(sessionsByDate).length === 0 ? (
                        <p className="text-gray-400">No sessions scheduled yet.</p>
                    ) : (
                        <div className="space-y-6">
                            {Object.entries(sessionsByDate).map(([date, sessions]) => (
                                <div key={date}>
                                    <h3 className="font-semibold text-gray-300 mb-3">
                                        {format(new Date(date), 'EEEE, MMMM d, yyyy')}
                                    </h3>
                                    <div className="space-y-2">
                                        {(sessions as any[]).map((session: any) => {
                                            const colors = phaseColors[session.phase] || phaseColors.building
                                            return (
                                                <div
                                                    key={session.id}
                                                    className={`p-4 rounded-lg ${colors.bg} ${colors.border} border-l-4`}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <span className={`text-sm font-medium ${colors.text} uppercase`}>
                                                                {session.phase}
                                                            </span>
                                                            <div className="font-semibold mt-1">
                                                                {session.title || `${session.phase.charAt(0).toUpperCase() + session.phase.slice(1)} Session`}
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="font-medium">
                                                                {format(new Date(session.start_time), 'h:mm a')} - {format(new Date(session.end_time), 'h:mm a')}
                                                            </div>
                                                            <div className="text-sm text-gray-400">
                                                                {((new Date(session.end_time).getTime() - new Date(session.start_time).getTime()) / (1000 * 60 * 60)).toFixed(1)}h
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {session.description && (
                                                        <p className="text-sm text-gray-400 mt-2">{session.description}</p>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
