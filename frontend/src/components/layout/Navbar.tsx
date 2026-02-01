'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Calendar, Compass, LayoutDashboard, Settings, LogIn } from 'lucide-react'

export function Navbar() {
    const pathname = usePathname()

    const navItems = [
        { href: '/discover', label: 'Discover', icon: Compass },
        { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/settings', label: 'Settings', icon: Settings },
    ]

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

                    {/* Auth Button */}
                    <div className="flex items-center gap-4">
                        <Link
                            href="/auth/login"
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all"
                        >
                            <LogIn size={18} />
                            <span className="hidden sm:inline">Sign In</span>
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    )
}
