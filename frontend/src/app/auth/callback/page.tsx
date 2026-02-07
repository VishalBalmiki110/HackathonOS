'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuthStore } from '@/lib/auth'

export default function AuthCallbackPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { setToken, initialize } = useAuthStore()

    useEffect(() => {
        const token = searchParams.get('token')
        const error = searchParams.get('error')

        if (error) {
            alert(`Authentication failed: ${error}`)
            router.push('/auth/login')
            return
        }

        if (token) {
            // Store token and initialize auth
            setToken(token)

            // Wait a moment then initialize to get user data
            setTimeout(async () => {
                await initialize()
                router.push('/dashboard')
            }, 100)
        } else {
            router.push('/auth/login')
        }
    }, [searchParams, router, setToken, initialize])

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-400">Completing sign in...</p>
            </div>
        </div>
    )
}
