'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

type Theme = 'dark' | 'light'

interface ThemeContextType {
    theme: Theme
    toggleTheme: () => void
    setTheme: (theme: Theme) => void
}

// Default context value for SSR and before mount
const defaultContext: ThemeContextType = {
    theme: 'dark',
    toggleTheme: () => { },
    setTheme: () => { },
}

const ThemeContext = createContext<ThemeContextType>(defaultContext)

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setThemeState] = useState<Theme>('dark')
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        // Get stored theme or system preference
        const stored = localStorage.getItem('theme') as Theme | null
        if (stored) {
            setThemeState(stored)
        } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
            setThemeState('light')
        }
        setMounted(true)
    }, [])

    useEffect(() => {
        if (mounted) {
            document.documentElement.setAttribute('data-theme', theme)
            localStorage.setItem('theme', theme)
        }
    }, [theme, mounted])

    const toggleTheme = () => {
        setThemeState(prev => prev === 'dark' ? 'light' : 'dark')
    }

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme)
    }

    // Always provide the context - use default values before mount
    const value: ThemeContextType = mounted
        ? { theme, toggleTheme, setTheme }
        : defaultContext

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    )
}

export function useTheme() {
    return useContext(ThemeContext)
}
