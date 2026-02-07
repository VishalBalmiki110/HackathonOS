'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Calendar, Compass, LayoutDashboard, Settings, LogIn, LogOut, User, Sun, Moon, Bookmark, Users, Bell } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAuthStore } from '@/lib/auth'
import { useTheme } from '@/components/ThemeProvider'

export function Navbar() {
    const pathname = usePathname()
    const router = useRouter()
    const { token, user, isLoading, initialize, logout } = useAuthStore()
    const { theme, toggleTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        initialize()
    }, [initialize])

    const navItems = [
        { href: '/discover', label: 'Discover', icon: Compass },
        { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/teams', label: 'Teams', icon: Users },
        { href: '/saved', label: 'Saved', icon: Bookmark },
        { href: '/notifications', label: 'Alerts', icon: Bell },
        { href: '/settings', label: 'Settings', icon: Settings },
    ]

    const handleLogout = () => {
        logout()
        router.push('/')
    }

    const isLoggedIn = mounted && token && user

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 glass-dark">
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center transition-transform group-hover:scale-110">
                            <Calendar className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-bold text-xl">HackathonOS</span>
                    </Link>

                    {/* Navigation Links */}
                    <div className="hidden md:flex items-center gap-1">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${isActive
                                        ? 'bg-white/10 text-white'
                                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    <item.icon size={18} />
                                    <span>{item.label}</span>
                                </Link>
                            )
                        })}
                    </div>

                    {/* Right Section */}
                    <div className="flex items-center gap-2">
                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                        >
                            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                        </button>

                        {/* Auth Section */}
                        {isLoading && !mounted ? (
                            <div className="w-24 h-10 bg-white/10 rounded-lg animate-pulse" />
                        ) : isLoggedIn ? (
                            <div className="flex items-center gap-3">
                                {/* User Info */}
                                <div className="flex items-center gap-2">
                                    {user.picture_url ? (
                                        <img
                                            src={user.picture_url.startsWith('http') ? user.picture_url : `http://localhost:8000${user.picture_url}`}
                                            alt={user.name || 'User'}
                                            className="w-8 h-8 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center">
                                            <User size={16} className="text-primary-400" />
                                        </div>
                                    )}
                                    <span className="hidden sm:inline text-sm text-gray-300">
                                        {user.name || user.email}
                                    </span>
                                </div>
                                {/* Logout Button */}
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                                    title="Sign Out"
                                >
                                    <LogOut size={18} />
                                </button>
                            </div>
                        ) : (
                            <Link
                                href="/auth/login"
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all"
                            >
                                <LogIn size={18} />
                                <span className="hidden sm:inline">Sign In</span>
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    )
}
