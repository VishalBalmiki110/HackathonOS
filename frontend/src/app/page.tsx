'use client'

import Link from 'next/link'
import { Calendar, Clock, Target, Zap, ArrowRight, CheckCircle, Sparkles, TrendingUp } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function Home() {
    const [stats, setStats] = useState({ hackathons: 0, deadlines: 0, users: 0 })
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        // Animate counters
        const targetStats = { hackathons: 146, deadlines: 23, users: 1200 }
        const duration = 2000
        const steps = 60
        const interval = duration / steps

        let step = 0
        const timer = setInterval(() => {
            step++
            setStats({
                hackathons: Math.floor((targetStats.hackathons / steps) * step),
                deadlines: Math.floor((targetStats.deadlines / steps) * step),
                users: Math.floor((targetStats.users / steps) * step),
            })
            if (step >= steps) clearInterval(timer)
        }, interval)

        return () => clearInterval(timer)
    }, [])

    return (
        <div className="relative">
            {/* Hero Section - Command Center Aesthetic */}
            <section className="relative min-h-[95vh] flex items-center justify-center px-4 overflow-hidden">
                {/* Animated background grid */}
                <div className="absolute inset-0 bg-gradient-mesh opacity-60" />
                <div className="absolute inset-0 noise-texture" />

                {/* Radial glows */}
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-primary/20 rounded-full filter blur-[120px] animate-pulse-slow" />
                <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-accent-secondary/15 rounded-full filter blur-[100px] animate-pulse-slow" style={{ animationDelay: '1s' }} />

                <div className="relative z-10 max-w-6xl mx-auto text-center">
                    {/* Badge */}
                    <div className="animate-scale-in mb-8">
                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface-moderate border border-border-moderate text-sm font-mono text-text-secondary backdrop-blur-sm">
                            <Sparkles className="w-4 h-4 text-accent-primary" />
                            <span>Mission Control for Hackathon Success</span>
                        </span>
                    </div>

                    {/* Main Headline */}
                    <h1 className="text-6xl md:text-7xl lg:text-8xl font-display font-bold mb-6 leading-tight tracking-tight stagger-children">
                        <span className="block text-text-primary">Turn Deadlines Into</span>
                        <span className="block bg-gradient-to-r from-accent-primary via-accent-secondary to-accent-primary bg-clip-text text-transparent animate-pulse-glow">
                            Execution Plans
                        </span>
                    </h1>

                    {/* Subheadline */}
                    <p className="text-xl md:text-2xl text-text-secondary mb-12 max-w-3xl mx-auto leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                        Discover hackathons, generate intelligent schedules, and sync to your calendar.
                        <span className="block mt-2 text-text-tertiary text-lg font-mono">
                            Time is a first-class resource.
                        </span>
                    </p>

                    {/* CTAs */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
                        <Link
                            href="/discover"
                            className="btn btn-primary text-lg group"
                        >
                            <span>Explore Hackathons</span>
                            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                        </Link>
                        <Link
                            href="/dashboard"
                            className="btn btn-secondary text-lg"
                        >
                            View Dashboard
                        </Link>
                    </div>

                    {/* Live Stats Ticker */}
                    {mounted && (
                        <div className="inline-flex items-center gap-8 px-8 py-4 rounded-xl bg-surface-subtle border border-border-subtle backdrop-blur-md animate-fade-in-up" style={{ animationDelay: '0.7s' }}>
                            <StatItem label="Active Hackathons" value={stats.hackathons} />
                            <div className="w-px h-8 bg-border-subtle" />
                            <StatItem label="Upcoming Deadlines" value={stats.deadlines} />
                            <div className="w-px h-8 bg-border-subtle hidden md:block" />
                            <StatItem label="Builders" value={`${stats.users}+`} className="hidden md:flex" />
                        </div>
                    )}
                </div>

                {/* Scroll indicator */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
                    <div className="w-6 h-10 rounded-full border-2 border-border-moderate flex items-start justify-center p-2">
                        <div className="w-1 h-2 bg-accent-primary rounded-full" />
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-32 px-4 relative">
                <div className="max-w-7xl mx-auto">
                    {/* Section Header */}
                    <div className="text-center mb-20">
                        <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">
                            Everything You Need to{' '}
                            <span className="bg-gradient-to-r from-accent-primary to-accent-secondary bg-clip-text text-transparent">
                                Ship on Time
                            </span>
                        </h2>
                        <p className="text-text-tertiary text-xl max-w-3xl mx-auto font-mono">
                            Discovery → Planning → Execution, unified in one command center
                        </p>
                    </div>

                    {/* Feature Grid */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <FeatureCard
                            icon={<Target className="w-8 h-8" />}
                            title="Hackathon Discovery"
                            description="Aggregate from Devpost, MLH, Unstop, DoraHacks. Filter by theme, mode, and urgency."
                            delay={0}
                        />
                        <FeatureCard
                            icon={<Clock className="w-8 h-8" />}
                            title="Smart Scheduling"
                            description="Auto-generate work plans: 30% prep, 60% build, 10% polish. Based on your actual availability."
                            delay={50}
                        />
                        <FeatureCard
                            icon={<Calendar className="w-8 h-8" />}
                            title="Calendar Sync"
                            description="One-click Google Calendar sync or ICS export. Deadlines become calendar events."
                            delay={100}
                        />
                        <FeatureCard
                            icon={<Zap className="w-8 h-8" />}
                            title="Phase-Based Planning"
                            description="Break work into prep, build, and submission phases with realistic time buffers."
                            delay={150}
                        />
                        <FeatureCard
                            icon={<CheckCircle className="w-8 h-8" />}
                            title="Deadline Awareness"
                            description="Visual countdowns and urgency indicators. Always know exactly how much time remains."
                            delay={200}
                        />
                        <FeatureCard
                            icon={<TrendingUp className="w-8 h-8" />}
                            title="Team Collaboration"
                            description="Coordinate with teammates, share notes, manage checklists. Everyone stays aligned."
                            delay={250}
                        />
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="py-32 px-4 relative overflow-hidden">
                {/* Background accent */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent-secondary/5 to-transparent" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-4xl">
                    <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-border-moderate to-transparent" />
                    <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-border-moderate to-transparent" />
                </div>

                <div className="relative max-w-6xl mx-auto">
                    <div className="text-center mb-20">
                        <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">
                            How It Works
                        </h2>
                        <p className="text-text-tertiary text-xl font-mono">
                            From discovery to submission, three decisive steps
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <StepCard
                            number="01"
                            title="Discover"
                            description="Browse hackathons aggregated from multiple platforms. Filter by your interests and availability."
                        />
                        <StepCard
                            number="02"
                            title="Schedule"
                            description="Select a hackathon. Set your availability windows. Generate a realistic, phase-based work plan."
                        />
                        <StepCard
                            number="03"
                            title="Execute"
                            description="Sync to calendar. Follow the plan. Focus on building, not on planning or panic."
                        />
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-32 px-4">
                <div className="max-w-5xl mx-auto">
                    <div className="relative rounded-2xl p-12 md:p-16 text-center overflow-hidden border border-border-moderate bg-surface-subtle backdrop-blur-sm">
                        {/* Glow effects */}
                        <div className="absolute -top-24 -right-24 w-48 h-48 bg-accent-primary/30 rounded-full filter blur-[80px]" />
                        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-accent-secondary/30 rounded-full filter blur-[80px]" />

                        <div className="relative z-10">
                            <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">
                                Ready to Ship Your Next Project?
                            </h2>
                            <p className="text-text-secondary text-xl mb-10 max-w-2xl mx-auto font-mono">
                                Join builders who treat deadlines as opportunities, not obstacles.
                            </p>
                            <Link
                                href="/discover"
                                className="btn btn-primary text-lg inline-flex items-center gap-2 group"
                            >
                                <span>Get Started Free</span>
                                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-4 border-t border-border-subtle">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center">
                            <span className="font-display font-bold text-bg-primary">H</span>
                        </div>
                        <span className="font-display font-bold text-2xl">HackathonOS</span>
                    </div>
                    <p className="text-text-tertiary text-sm font-mono">
                        Built by developers who finish what they start.
                    </p>
                </div>
            </footer>
        </div>
    )
}

function StatItem({ label, value, className = '' }: { label: string; value: string | number; className?: string }) {
    return (
        <div className={`flex flex-col items-center ${className}`}>
            <div className="text-3xl font-display font-bold text-accent-primary font-mono">{value}</div>
            <div className="text-xs text-text-tertiary font-mono uppercase tracking-wider">{label}</div>
        </div>
    )
}

function FeatureCard({
    icon,
    title,
    description,
    delay = 0
}: {
    icon: React.ReactNode
    title: string
    description: string
    delay?: number
}) {
    return (
        <div
            className="card group animate-fade-in-up"
            style={{ animationDelay: `${delay}ms` }}
        >
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-accent-primary/20 to-accent-secondary/20 flex items-center justify-center text-accent-primary mb-5 group-hover:scale-110 transition-transform duration-300">
                {icon}
            </div>
            <h3 className="text-xl font-display font-semibold mb-3 text-text-primary">{title}</h3>
            <p className="text-text-tertiary leading-relaxed">{description}</p>
        </div>
    )
}

function StepCard({ number, title, description }: { number: string; title: string; description: string }) {
    return (
        <div className="relative group">
            <div className="card-glass p-8 text-center h-full">
                <div className="text-7xl font-display font-bold mb-6 bg-gradient-to-r from-accent-primary to-accent-secondary bg-clip-text text-transparent opacity-90">
                    {number}
                </div>
                <h3 className="text-2xl font-display font-semibold mb-4 text-text-primary">{title}</h3>
                <p className="text-text-tertiary leading-relaxed">{description}</p>
            </div>

            {/* Connection line (hidden on last card) */}
            <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-px bg-gradient-to-r from-border-moderate to-transparent group-last:hidden" />
        </div>
    )
}
