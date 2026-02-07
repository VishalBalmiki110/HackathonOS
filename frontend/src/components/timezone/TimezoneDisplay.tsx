'use client'

import { useQuery } from '@tanstack/react-query'
import { Globe, Clock, AlertCircle, CheckCircle } from 'lucide-react'
import { api } from '@/lib/api'

interface TimezoneDisplayProps {
    hackathonTimezone?: string
    hackathonStart?: string
    hackathonEnd?: string
}

export function TimezoneDisplay({ hackathonTimezone, hackathonStart, hackathonEnd }: TimezoneDisplayProps) {
    // Get user's timezone
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone

    const { data: overlap } = useQuery({
        queryKey: ['timezone-overlap', userTimezone, hackathonTimezone, hackathonStart, hackathonEnd],
        queryFn: () => api.getTimezoneOverlap(userTimezone, hackathonTimezone!, hackathonStart!, hackathonEnd!),
        enabled: !!(hackathonTimezone && hackathonStart && hackathonEnd),
    })

    if (!hackathonTimezone) {
        return null
    }

    return (
        <div className="card bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20">
            <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <Globe className="text-blue-400" size={20} />
                </div>
                <div className="flex-1">
                    <h3 className="font-semibold flex items-center gap-2">
                        Timezone Intelligence
                        {overlap?.recommendation === 'optimal' ? (
                            <CheckCircle size={16} className="text-green-400" />
                        ) : (
                            <AlertCircle size={16} className="text-yellow-400" />
                        )}
                    </h3>

                    <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="text-gray-400">Your Timezone</p>
                            <p className="font-medium">{userTimezone}</p>
                        </div>
                        <div>
                            <p className="text-gray-400">Hackathon Timezone</p>
                            <p className="font-medium">{hackathonTimezone}</p>
                        </div>
                    </div>

                    {overlap && (
                        <>
                            <div className="mt-3 p-2 bg-white/5 rounded-lg">
                                <p className="text-sm text-gray-400">Time Difference</p>
                                <p className="font-medium">
                                    {overlap.offset_hours > 0 ? '+' : ''}{overlap.offset_hours} hours
                                </p>
                            </div>

                            <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-gray-400">Start in your time</p>
                                    <p className="font-medium">
                                        {new Date(overlap.user_start).toLocaleString(undefined, {
                                            weekday: 'short',
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-gray-400">End in your time</p>
                                    <p className="font-medium">
                                        {new Date(overlap.user_end).toLocaleString(undefined, {
                                            weekday: 'short',
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </p>
                                </div>
                            </div>

                            {overlap.recommendation === 'adjust_schedule' && (
                                <div className="mt-3 p-2 bg-yellow-500/10 rounded-lg flex items-start gap-2">
                                    <AlertCircle size={16} className="text-yellow-400 mt-0.5" />
                                    <p className="text-sm text-yellow-200">
                                        Some hackathon times may fall outside your preferred working hours.
                                        Consider adjusting your schedule accordingly.
                                    </p>
                                </div>
                            )}

                            {overlap.recommendation === 'optimal' && (
                                <div className="mt-3 p-2 bg-green-500/10 rounded-lg flex items-start gap-2">
                                    <CheckCircle size={16} className="text-green-400 mt-0.5" />
                                    <p className="text-sm text-green-200">
                                        Great! The hackathon times align well with your timezone.
                                    </p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

// Timezone selector component
export function TimezoneSelector({ value, onChange }: { value: string; onChange: (tz: string) => void }) {
    const { data } = useQuery({
        queryKey: ['timezones'],
        queryFn: api.getTimezones,
    })

    return (
        <div className="relative">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-primary-500 appearance-none"
            >
                <option value="">Select timezone</option>
                {data?.timezones?.map((tz: any) => (
                    <option key={tz.value} value={tz.value}>
                        {tz.label}
                    </option>
                ))}
            </select>
        </div>
    )
}
