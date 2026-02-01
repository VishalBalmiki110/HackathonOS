'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Calendar, Clock, Plus, ChevronRight } from 'lucide-react'
import { api } from '@/lib/api'
import { ScheduleCard } from '@/components/schedule/ScheduleCard'

export default function DashboardPage() {
    const { data: schedules, isLoading } = useQuery({
        queryKey: ['schedules'],
        queryFn: api.getSchedules,
    })

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
                    <Link href="/discover" className="btn-primary inline-flex items-center gap-2">
                        <Plus size={20} />
                        New Schedule
                    </Link>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <StatCard
                        label="Active Schedules"
                        value={schedules?.items?.filter((s: any) => s.status === 'active').length || 0}
                        icon={<Calendar className="w-5 h-5" />}
                    />
                    <StatCard
                        label="Upcoming Sessions"
                        value="--"
                        icon={<Clock className="w-5 h-5" />}
                    />
                    <StatCard
                        label="Hours Planned"
                        value={schedules?.items?.reduce((sum: number, s: any) => sum + (s.total_hours || 0), 0).toFixed(0) || 0}
                        icon={<Clock className="w-5 h-5" />}
                    />
                    <StatCard
                        label="Completed"
                        value={schedules?.items?.filter((s: any) => s.status === 'completed').length || 0}
                        icon={<Calendar className="w-5 h-5" />}
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

function StatCard({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
    return (
        <div className="card">
            <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">{label}</span>
                <div className="text-primary-400">{icon}</div>
            </div>
            <p className="text-3xl font-bold">{value}</p>
        </div>
    )
}
