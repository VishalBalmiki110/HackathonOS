import Link from 'next/link'
import { Calendar, Clock, Target, Zap, ArrowRight, CheckCircle } from 'lucide-react'

export default function Home() {
    return (
        <div className="relative">
            {/* Hero Section */}
            <section className="relative min-h-[90vh] flex items-center justify-center px-4 overflow-hidden">
                {/* Background gradient orbs */}
                <div className="absolute top-20 left-10 w-72 h-72 bg-primary-500/30 rounded-full filter blur-[100px] animate-pulse-slow" />
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent-500/20 rounded-full filter blur-[120px] animate-pulse-slow" />

                <div className="relative z-10 max-w-5xl mx-auto text-center">
                    <div className="animate-fade-in">
                        <span className="inline-block px-4 py-1.5 mb-6 text-sm font-medium text-primary-300 bg-primary-500/10 rounded-full border border-primary-500/20">
                            🚀 Stop missing deadlines. Start shipping projects.
                        </span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-slide-up">
                        Turn Hackathon Deadlines into{' '}
                        <span className="gradient-text">Execution Plans</span>
                    </h1>

                    <p className="text-xl md:text-2xl text-gray-300 mb-10 max-w-3xl mx-auto animate-slide-up" style={{ animationDelay: '0.1s' }}>
                        Discover hackathons, generate smart schedules, and sync to your calendar.
                        HackathonOS treats time as a first-class resource.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up" style={{ animationDelay: '0.2s' }}>
                        <Link href="/discover" className="btn-primary inline-flex items-center gap-2 text-lg">
                            Explore Hackathons
                            <ArrowRight size={20} />
                        </Link>
                        <Link href="/dashboard" className="btn-secondary inline-flex items-center gap-2 text-lg">
                            View Dashboard
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-24 px-4">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">
                            Everything You Need to <span className="gradient-text">Ship on Time</span>
                        </h2>
                        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                            HackathonOS combines discovery, planning, and execution into one seamless workflow.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={<Target className="w-8 h-8" />}
                            title="Hackathon Discovery"
                            description="Aggregate hackathons from Devpost, MLH, Unstop, and more. Filter by theme, mode, and deadlines."
                        />
                        <FeatureCard
                            icon={<Clock className="w-8 h-8" />}
                            title="Smart Scheduling"
                            description="Auto-generate work schedules based on your availability. 30% prep, 60% build, 10% polish."
                        />
                        <FeatureCard
                            icon={<Calendar className="w-8 h-8" />}
                            title="Calendar Sync"
                            description="One-click sync to Google Calendar or export as ICS. Never miss a deadline again."
                        />
                        <FeatureCard
                            icon={<Zap className="w-8 h-8" />}
                            title="Phase-Based Planning"
                            description="Break down work into preparation, building, and submission phases with realistic buffers."
                        />
                        <FeatureCard
                            icon={<CheckCircle className="w-8 h-8" />}
                            title="Deadline Awareness"
                            description="Get reminders and visual countdowns. Always know exactly how much time you have left."
                        />
                        <FeatureCard
                            icon={<Zap className="w-8 h-8" />}
                            title="AI-Powered (Coming Soon)"
                            description="LLM-assisted scheduling, theme-based ideas, and automatic rescheduling."
                        />
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="py-24 px-4 relative">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary-500/5 to-transparent" />

                <div className="relative max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">
                            How It Works
                        </h2>
                        <p className="text-gray-400 text-lg">
                            From discovery to submission in three simple steps
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <StepCard
                            number="01"
                            title="Discover"
                            description="Browse upcoming hackathons aggregated from multiple platforms. Filter by your interests."
                        />
                        <StepCard
                            number="02"
                            title="Schedule"
                            description="Select a hackathon and set your availability. We'll generate a realistic work plan."
                        />
                        <StepCard
                            number="03"
                            title="Execute"
                            description="Sync to your calendar and follow the plan. Focus on building, not planning."
                        />
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 px-4">
                <div className="max-w-4xl mx-auto">
                    <div className="glass rounded-2xl p-12 text-center relative overflow-hidden">
                        <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary-500/30 rounded-full filter blur-[60px]" />
                        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-accent-500/30 rounded-full filter blur-[60px]" />

                        <div className="relative z-10">
                            <h2 className="text-3xl md:text-4xl font-bold mb-4">
                                Ready to Ship Your Next Project?
                            </h2>
                            <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
                                Join developers who use HackathonOS to turn ambition into action.
                            </p>
                            <Link href="/discover" className="btn-primary inline-flex items-center gap-2 text-lg">
                                Get Started Free
                                <ArrowRight size={20} />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-4 border-t border-white/10">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500" />
                        <span className="font-bold text-xl">HackathonOS</span>
                    </div>
                    <p className="text-gray-400 text-sm">
                        Built by developers who want to finish what they start.
                    </p>
                </div>
            </footer>
        </div>
    )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
    return (
        <div className="card card-hover">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-500/20 to-accent-500/20 flex items-center justify-center text-primary-400 mb-4">
                {icon}
            </div>
            <h3 className="text-xl font-semibold mb-2">{title}</h3>
            <p className="text-gray-400">{description}</p>
        </div>
    )
}

function StepCard({ number, title, description }: { number: string; title: string; description: string }) {
    return (
        <div className="card text-center">
            <div className="text-5xl font-bold gradient-text mb-4">{number}</div>
            <h3 className="text-xl font-semibold mb-2">{title}</h3>
            <p className="text-gray-400">{description}</p>
        </div>
    )
}
