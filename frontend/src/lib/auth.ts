import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
    id: string
    email: string
    name?: string
    picture_url?: string
}

interface AuthState {
    token: string | null
    user: User | null
    isLoading: boolean
    setToken: (token: string) => void
    setUser: (user: User) => void
    logout: () => void
    initialize: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            token: null,
            user: null,
            isLoading: true,

            setToken: (token: string) => {
                localStorage.setItem('token', token)
                set({ token })
            },

            setUser: (user: User) => {
                set({ user })
            },

            logout: () => {
                localStorage.removeItem('token')
                set({ token: null, user: null })
            },

            initialize: async () => {
                const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
                if (!token) {
                    set({ isLoading: false })
                    return
                }

                set({ token })

                try {
                    const response = await fetch('http://localhost:8000/auth/me', {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                        },
                    })

                    if (response.ok) {
                        const user = await response.json()
                        set({ user, isLoading: false })
                    } else {
                        // Token is invalid, clear it
                        localStorage.removeItem('token')
                        set({ token: null, user: null, isLoading: false })
                    }
                } catch (error) {
                    set({ isLoading: false })
                }
            },
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({ token: state.token }),
        }
    )
)
