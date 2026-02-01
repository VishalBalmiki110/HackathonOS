'use client'

import Link from 'next/link'
import { Clock, Calendar, ChevronRight, Play, Download, Trash2 } from 'lucide-react'
import { format } from 'date-fns'

interface Schedule {
    id: string
    status: string
    total_hours?: number
    created_at: string
    hackathon: {
        id: string
        name: string
        platform: string
        submission_deadline: string
    }
    sessions: Array<{
        id: string
        phase: string
        start_time: string
        end_time: string
    }>
}

export function ScheduleCard({ schedule }: { schedule: Schedule }) {
    const deadline = new Date(schedule.hackathon.submission_deadline)
    const daysLeft = Math.max(0, Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))

    const statusColors: Record<string, string> = {
        draft: 'bg-yellow-500/20 text-yellow-400',
        active: 'bg-green-500/20 text-green-400',
        completed: 'bg-blue-500/20 text-blue-400',
        cancelled: 'bg-gray-500/20 text-gray-400',
    }

    const phaseStats = schedule.sessions?.reduce((acc, session) => {
        acc[session.phase] = (acc[session.phase] || 0) + 1
        return acc
    }, {} as Record<string, number>) || {}

    return (
        <div className="card group">
            <div className="flex flex-col md:flex-row gap-4">
                {/* Info */}
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[schedule.status]}`}>
                            {schedule.status.toUpperCase()}
                        </span>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-white/10 text-gray-300">
                            {schedule.hackathon.platform.toUpperCase()}
                        </span>
                    </div>

                    <h3 className="text-xl font-semibold mb-2 group-hover:text-primary-400 transition-colors">
                        {schedule.hackathon.name}
                    </h3>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                        <div className="flex items-center gap-1">
                            <Clock size={14} />
                            <span>{schedule.total_hours?.toFixed(1) || 0} hours planned</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Calendar size={14} />
                            <span>{schedule.sessions?.length || 0} sessions</span>
                        </div>
                        <div className={`flex items-center gap-1 ${daysLeft <= 7 ? 'text-red-400' : 'text-gray-400'}`}>
                            <span>{daysLeft} days until deadline</span>
                        </div>
                    </div>

                    {/* Phase breakdown */}
                    <div className="flex gap-2 mt-3">
                        {Object.entries(phaseStats).map(([phase, count]) => (
                            <div
                                key={phase}
                                className={`px-2 py-1 rounded text-xs phase-${phase}`}
                            >
                                {phase}: {count}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex md:flex-col items-center gap-2">
                    <Link
                        href={`/schedule/${schedule.id}`}
                        className="btn-primary py-2 px-4 text-sm flex items-center gap-1"
                    >
                        View
                        <ChevronRight size={16} />
                    </Link>
                    <button className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors" title="Export ICS">
                        <Download size={18} />
                    </button>
                </div>
            </div>
        </div>
    )
}
