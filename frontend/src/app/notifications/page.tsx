'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, BellOff, Check, CheckCheck, Trash2, Clock, Calendar, Users, AlertTriangle, LogIn } from 'lucide-react'
import { api } from '@/lib/api'
import { formatDistanceToNow } from 'date-fns'
import { useAuthStore } from '@/lib/auth'

export default function NotificationsPage() {
    const queryClient = useQueryClient()
    const { token, user } = useAuthStore()
    const isLoggedIn = !!token && !!user
    const [showUnreadOnly, setShowUnreadOnly] = useState(false)

    const { data, isLoading } = useQuery({
        queryKey: ['notifications', showUnreadOnly],
        queryFn: () => api.getNotifications(showUnreadOnly),
        enabled: isLoggedIn,
    })

    const markReadMutation = useMutation({
        mutationFn: api.markNotificationRead,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
    })

    const markAllReadMutation = useMutation({
        mutationFn: api.markAllNotificationsRead,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
    })

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'session_start':
            case 'session_end':
                return <Clock className="text-blue-400" size={18} />
            case 'deadline_reminder':
                return <AlertTriangle className="text-yellow-400" size={18} />
            case 'team_update':
                return <Users className="text-green-400" size={18} />
            case 'schedule_change':
                return <Calendar className="text-purple-400" size={18} />
            default:
                return <Bell className="text-gray-400" size={18} />
        }
    }

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'urgent': return 'border-l-red-500'
            case 'high': return 'border-l-orange-500'
            case 'medium': return 'border-l-blue-500'
            default: return 'border-l-gray-500'
        }
    }

    return (
        <div className="min-h-screen px-4 py-8">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-3">
                        <Bell className="text-primary-400" size={28} />
                        <h1 className="text-3xl font-bold">Notifications</h1>
                        {data?.unread_count > 0 && (
                            <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                                {data.unread_count}
                            </span>
                        )}
                    </div>
                    {isLoggedIn && (
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setShowUnreadOnly(!showUnreadOnly)}
                                className={`btn-secondary text-sm ${showUnreadOnly ? 'bg-primary-500/20' : ''}`}
                            >
                                {showUnreadOnly ? <BellOff size={16} /> : <Bell size={16} />}
                                {showUnreadOnly ? 'Show All' : 'Unread Only'}
                            </button>
                            {data?.unread_count > 0 && (
                                <button
                                    onClick={() => markAllReadMutation.mutate()}
                                    className="btn-primary text-sm"
                                >
                                    <CheckCheck size={16} />
                                    Mark All Read
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Content */}
                {!isLoggedIn ? (
                    <div className="text-center py-20">
                        <div className="w-16 h-16 rounded-full bg-primary-500/20 flex items-center justify-center mx-auto mb-4">
                            <LogIn className="text-primary-400" size={32} />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Sign in to view notifications</h3>
                        <p className="text-gray-400 mb-6">
                            Get alerts for deadlines, sessions, and team updates
                        </p>
                        <a
                            href="/auth/login"
                            className="btn-primary inline-flex items-center gap-2"
                            onClick={async (e) => {
                                e.preventDefault()
                                const data = await api.getGoogleAuthUrl()
                                window.location.href = data.auth_url
                            }}
                        >
                            <LogIn size={18} />
                            Sign in with Google
                        </a>
                    </div>
                ) : isLoading ? (
                    <div className="space-y-4">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="card animate-pulse">
                                <div className="h-4 bg-white/10 rounded w-3/4" />
                            </div>
                        ))}
                    </div>
                ) : data?.notifications?.length === 0 ? (
                    <div className="card text-center py-12">
                        <Bell className="mx-auto text-gray-600 mb-4" size={48} />
                        <h3 className="text-xl font-semibold mb-2">No notifications</h3>
                        <p className="text-gray-400">You're all caught up!</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {data?.notifications?.map((notification: any) => (
                            <div
                                key={notification.id}
                                className={`card border-l-4 ${getPriorityColor(notification.priority)} ${!notification.is_read ? 'bg-primary-500/5' : ''
                                    }`}
                            >
                                <div className="flex items-start gap-4">
                                    <div className="mt-1">
                                        {getTypeIcon(notification.type)}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h3 className={`font-medium ${!notification.is_read ? 'text-white' : 'text-gray-300'}`}>
                                                    {notification.title}
                                                </h3>
                                                {notification.message && (
                                                    <p className="text-gray-400 text-sm mt-1">
                                                        {notification.message}
                                                    </p>
                                                )}
                                            </div>
                                            {!notification.is_read && (
                                                <button
                                                    onClick={() => markReadMutation.mutate(notification.id)}
                                                    className="p-1 hover:bg-white/10 rounded"
                                                    title="Mark as read"
                                                >
                                                    <Check size={16} className="text-green-400" />
                                                </button>
                                            )}
                                        </div>
                                        <p className="text-gray-500 text-xs mt-2">
                                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
