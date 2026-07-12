import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Theme tokens backed by CSS variables (see src/index.css).
        app:     'rgb(var(--bg) / <alpha-value>)',
        appAlt:  'rgb(var(--bg-alt) / <alpha-value>)',
        content: 'rgb(var(--content) / <alpha-value>)',
        muted:   'rgb(var(--muted) / <alpha-value>)',
        faint:   'rgb(var(--faint) / <alpha-value>)',
        line:    'rgb(var(--line) / <alpha-value>)',
        primary: {
          50:  '#eff6ff',
          100: '#dbeafe',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          900: '#1e3a8a',
        },
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'Inter', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':       { transform: 'translateY(-24px)' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(28px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        marquee: {
          to: { transform: 'translateX(-50%)' },
        },
        scrollDot: {
          '0%':       { opacity: '0', transform: 'translateY(0)' },
          '25%':      { opacity: '1' },
          '75%':      { opacity: '1' },
          '100%':     { opacity: '0', transform: 'translateY(0.65rem)' },
        },
        pingSlow: {
          '75%, 100%': { transform: 'scale(2.2)', opacity: '0' },
        },
        hueShift: {
          '0%, 100%': { filter: 'hue-rotate(0deg)' },
          '50%':      { filter: 'hue-rotate(30deg)' },
        },
      },
      animation: {
        float:          'float 6s ease-in-out infinite',
        'float-slow':   'float 9s ease-in-out infinite',
        blink:          'blink 1s step-end infinite',
        'fade-up':      'fadeUp 0.6s ease both',
        shimmer:        'shimmer 3s linear infinite',
        marquee:        'marquee 40s linear infinite',
        'scroll-dot':   'scrollDot 2s ease-in-out infinite',
        'ping-slow':    'pingSlow 2.4s cubic-bezier(0, 0, 0.2, 1) infinite',
        hue:            'hueShift 9s ease-in-out infinite',
      },
    },
  },
  plugins: [],
} satisfies Config
