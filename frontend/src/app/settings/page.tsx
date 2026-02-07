'use client'

import { useState, useEffect, useRef } from 'react'
import { Calendar, Check, Loader2, Camera, User } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuthStore } from '@/lib/auth'

export default function SettingsPage() {
    const { user, token, initialize } = useAuthStore()
    const [isConnecting, setIsConnecting] = useState(false)
    const [calendarConnected, setCalendarConnected] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Check connection status and avatar on mount
    useEffect(() => {
        const loadUserData = async () => {
            if (!token) return
            try {
                const userData = await api.getMe()
                setCalendarConnected(userData.google_calendar_connected)
                setAvatarUrl(userData.picture_url)
            } catch (error) {
                console.error('Failed to load user data')
            }
        }
        loadUserData()
    }, [token])

    const connectGoogleCalendar = async () => {
        setIsConnecting(true)
        try {
            const { url } = await api.getGoogleAuthUrl()
            window.location.href = url
        } catch (error) {
            alert('Failed to connect Google Calendar')
            setIsConnecting(false)
        }
    }

    const handleAvatarClick = () => {
        fileInputRef.current?.click()
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('File too large. Maximum size is 5MB.')
            return
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file.')
            return
        }

        setIsUploading(true)
        try {
            const result = await api.uploadAvatar(file)
            // Add timestamp to force refresh
            setAvatarUrl(result.picture_url + '?t=' + Date.now())
            // Refresh auth store to update navbar
            await initialize()
            alert('Profile photo updated!')
        } catch (error: any) {
            alert(error.response?.data?.detail || 'Failed to upload photo')
        } finally {
            setIsUploading(false)
        }
    }

    const getAvatarSrc = () => {
        if (!avatarUrl) return null
        // If it's an absolute URL (from Google), use directly
        if (avatarUrl.startsWith('http')) return avatarUrl
        // Otherwise, it's a relative URL from our API
        return `http://localhost:8000${avatarUrl}`
    }

    return (
        <div className="min-h-screen px-4 py-8">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-4xl font-bold mb-2">
                    <span className="gradient-text">Settings</span>
                </h1>
                <p className="text-gray-400 text-lg mb-8">
                    Customize your preferences and availability
                </p>

                {/* Profile Section */}
                <section className="card mb-6">
                    <h2 className="text-xl font-semibold mb-4">Profile</h2>
                    <div className="flex flex-col md:flex-row gap-6">
                        {/* Avatar Upload */}
                        <div className="flex flex-col items-center">
                            <div
                                onClick={handleAvatarClick}
                                className="relative w-24 h-24 rounded-full overflow-hidden cursor-pointer group"
                            >
                                {avatarUrl ? (
                                    <img
                                        src={getAvatarSrc() || undefined}
                                        alt="Profile"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-primary-500/20 flex items-center justify-center">
                                        <User size={36} className="text-primary-400" />
                                    </div>
                                )}
                                {/* Overlay on hover */}
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    {isUploading ? (
                                        <Loader2 className="animate-spin text-white" size={24} />
                                    ) : (
                                        <Camera className="text-white" size={24} />
                                    )}
                                </div>
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                            <p className="text-xs text-gray-500 mt-2">Click to change</p>
                        </div>

                        {/* Profile Fields */}
                        <div className="flex-1 space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Name</label>
                                <input
                                    type="text"
                                    defaultValue={user?.name || ''}
                                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary-500"
                                    placeholder="Your name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Timezone</label>
                                <select className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary-500">
                                    <option value="UTC">UTC</option>
                                    <option value="America/New_York">Eastern Time</option>
                                    <option value="America/Los_Angeles">Pacific Time</option>
                                    <option value="Asia/Kolkata">India (IST)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Work Hours Per Day</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="12"
                                    defaultValue="4"
                                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary-500"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Calendar Integration */}
                <section className="card mb-6">
                    <h2 className="text-xl font-semibold mb-4">Calendar Integration</h2>
                    <p className="text-gray-400 mb-4">
                        Connect your Google Calendar to automatically sync your schedules.
                    </p>

                    {calendarConnected ? (
                        <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                                <Check className="text-green-400" size={20} />
                            </div>
                            <div>
                                <div className="font-medium text-green-400">Google Calendar Connected</div>
                                <div className="text-sm text-gray-400">
                                    Your schedules will sync automatically
                                </div>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={connectGoogleCalendar}
                            disabled={isConnecting}
                            className="btn-primary flex items-center gap-2"
                        >
                            {isConnecting ? (
                                <>
                                    <Loader2 className="animate-spin" size={18} />
                                    Connecting...
                                </>
                            ) : (
                                <>
                                    <Calendar size={18} />
                                    Connect Google Calendar
                                </>
                            )}
                        </button>
                    )}

                    <p className="text-xs text-gray-500 mt-3">
                        Note: You'll be redirected to Google to authorize calendar access.
                        This allows HackathonOS to add events to your calendar.
                    </p>
                </section>

                {/* Availability */}
                <section className="card">
                    <h2 className="text-xl font-semibold mb-4">Availability</h2>
                    <p className="text-gray-400 mb-4">
                        Set your weekly availability for scheduling work sessions.
                    </p>
                    <div className="space-y-2">
                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day, i) => (
                            <div key={day} className="flex items-center gap-4 p-3 bg-white/5 rounded-lg">
                                <span className="w-24 text-sm">{day}</span>
                                <input
                                    type="time"
                                    defaultValue="09:00"
                                    className="px-2 py-1 bg-white/10 border border-white/10 rounded text-white text-sm"
                                />
                                <span className="text-gray-400">to</span>
                                <input
                                    type="time"
                                    defaultValue="17:00"
                                    className="px-2 py-1 bg-white/10 border border-white/10 rounded text-white text-sm"
                                />
                                <label className="flex items-center gap-2 ml-auto">
                                    <input type="checkbox" defaultChecked={i < 5} className="rounded" />
                                    <span className="text-sm text-gray-400">Available</span>
                                </label>
                            </div>
                        ))}
                    </div>
                    <button className="btn-primary mt-4">
                        Save Availability
                    </button>
                </section>
            </div>
        </div>
    )
}
