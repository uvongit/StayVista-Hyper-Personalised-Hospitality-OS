/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        surface: '#ffffff',
        background: '#f5f7fb',
        border: '#e2e8f0',
        primary: {
          DEFAULT: '#2563eb',
          dark: '#1d4ed8',
        },
        dark: {
          surface: '#111827',
          background: '#0f172a',
          border: '#1f2937',
          text: {
            primary: '#e2e8f0',
            secondary: '#cbd5f5',
            muted: '#94a3b8',
          },
        },
        success: '#16a34a',
        warning: '#f59e0b',
        danger: '#dc2626',
        info: '#0ea5e9',
        text: {
          primary: '#0f172a',
          secondary: '#475569',
          muted: '#94a3b8',
        },
      },
      boxShadow: {
        soft: '0 4px 12px rgba(15, 23, 42, 0.08)',
        medium: '0 18px 32px rgba(15, 23, 42, 0.12)',
      },
      borderRadius: {
        sm: '10px',
        md: '16px',
      },
      fontFamily: {
        sans: ['"General Sans"', 'Inter', 'Segoe UI', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Clash Display"', 'Inter', 'Segoe UI', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1.2', letterSpacing: '0.08em' }],
        sm: ['0.875rem', { lineHeight: '1.45' }],
        base: ['1rem', { lineHeight: '1.6' }],
        lg: ['1.125rem', { lineHeight: '1.5' }],
        xl: ['1.375rem', { lineHeight: '1.4' }],
        '2xl': ['1.75rem', { lineHeight: '1.3' }],
        '3xl': ['2.25rem', { lineHeight: '1.2' }],
        '4xl': ['2.75rem', { lineHeight: '1.15' }],
      },
      transitionTimingFunction: {
        smooth: '180ms ease-in-out',
      },
    },
  },
  plugins: [],
}

