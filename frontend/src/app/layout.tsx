import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { Navbar } from '@/components/layout/Navbar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'HackathonOS - Turn Deadlines into Execution Plans',
    description: 'Discover hackathons, plan your schedule, and ship on time. HackathonOS transforms hackathon deadlines into actionable execution plans.',
    keywords: ['hackathon', 'scheduling', 'calendar', 'productivity', 'developer'],
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <body className={inter.className}>
                <Providers>
                    <Navbar />
                    <main className="min-h-screen pt-16">
                        {children}
                    </main>
                </Providers>
            </body>
        </html>
    )
}
