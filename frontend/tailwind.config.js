/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            fontFamily: {
                display: ['Space Grotesk', 'sans-serif'],
                body: ['Inter', 'system-ui', 'sans-serif'],
                mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
            },
            colors: {
                // Primary backgrounds
                bg: {
                    primary: 'var(--bg-primary)',
                    secondary: 'var(--bg-secondary)',
                    elevated: 'var(--bg-elevated)',
                    overlay: 'var(--bg-overlay)',
                },
                // Surface layers
                surface: {
                    dim: 'var(--surface-dim)',
                    subtle: 'var(--surface-subtle)',
                    moderate: 'var(--surface-moderate)',
                    strong: 'var(--surface-strong)',
                },
                // Accent colors
                accent: {
                    primary: 'var(--accent-primary)',
                    'primary-dim': 'var(--accent-primary-dim)',
                    secondary: 'var(--accent-secondary)',
                    'secondary-dim': 'var(--accent-secondary-dim)',
                    success: 'var(--accent-success)',
                    warning: 'var(--accent-warning)',
                    danger: 'var(--accent-danger)',
                    info: 'var(--accent-info)',
                },
                // Text colors
                text: {
                    primary: 'var(--text-primary)',
                    secondary: 'var(--text-secondary)',
                    tertiary: 'var(--text-tertiary)',
                    quaternary: 'var(--text-quaternary)',
                    muted: 'var(--text-muted)',
                },
                // Border colors
                border: {
                    subtle: 'var(--border-subtle)',
                    moderate: 'var(--border-moderate)',
                    strong: 'var(--border-strong)',
                    accent: 'var(--border-accent)',
                },
            },
            boxShadow: {
                'sm': 'var(--shadow-sm)',
                'DEFAULT': 'var(--shadow-md)',
                'md': 'var(--shadow-md)',
                'lg': 'var(--shadow-lg)',
                'xl': 'var(--shadow-xl)',
                'glow-primary': 'var(--glow-primary)',
                'glow-secondary': 'var(--glow-secondary)',
                'glow-danger': 'var(--glow-danger)',
            },
            borderRadius: {
                'sm': 'var(--radius-sm)',
                'DEFAULT': 'var(--radius-md)',
                'md': 'var(--radius-md)',
                'lg': 'var(--radius-lg)',
                'xl': 'var(--radius-xl)',
                'full': 'var(--radius-full)',
            },
            transitionDuration: {
                'fast': '150ms',
                'DEFAULT': '200ms',
                'slow': '300ms',
            },
            transitionTimingFunction: {
                'bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
            },
            animation: {
                'fade-in': 'fadeIn 0.5s ease-out',
                'fade-in-up': 'fadeInUp 0.4s ease-out forwards',
                'slide-up': 'slideUp 0.5s ease-out',
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
                'scale-in': 'scale-in 0.3s ease-out forwards',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                fadeInUp: {
                    '0%': {
                        opacity: '0',
                        transform: 'translateY(20px)',
                    },
                    '100%': {
                        opacity: '1',
                        transform: 'translateY(0)',
                    },
                },
                slideUp: {
                    '0%': { transform: 'translateY(20px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                'pulse-glow': {
                    '0%, 100%': {
                        boxShadow: 'var(--glow-primary)',
                    },
                    '50%': {
                        boxShadow: '0 0 30px rgba(0, 212, 255, 0.5)',
                    },
                },
                'scale-in': {
                    '0%': {
                        opacity: '0',
                        transform: 'scale(0.95)',
                    },
                    '100%': {
                        opacity: '1',
                        transform: 'scale(1)',
                    },
                },
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'hero-gradient': 'linear-gradient(135deg, #0ea5e9 0%, #d946ef 100%)',
                'gradient-mesh': `
                    radial-gradient(at 20% 30%, rgba(0, 212, 255, 0.1) 0px, transparent 50%),
                    radial-gradient(at 80% 70%, rgba(124, 58, 237, 0.1) 0px, transparent 50%),
                    radial-gradient(at 50% 50%, rgba(16, 185, 129, 0.05) 0px, transparent 50%)
                `,
            },
        },
    },
    plugins: [],
}
