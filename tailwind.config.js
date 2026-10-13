/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // TattooGo MK visual contract (dark luxury)
        canvas: '#0a0a0a',
        surface: '#121212',
        elevated: '#171717',
        card: '#141414',
        line: '#262626',
        lineSoft: '#1f1f1f',
        ink: '#fafafa',
        subtle: '#a1a1aa',
        muted: '#71717a',
        accent: {
          DEFAULT: '#F97316',
          soft: '#FB923C',
          strong: '#EA580C',
          glow: 'rgba(249, 115, 22, 0.14)',
        },
        success: '#22c55e',
        danger: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6',
      },
      borderRadius: {
        xl: '16px',
        '2xl': '20px',
        '3xl': '28px',
      },
      fontFamily: {
        sans: ['System'],
        mono: ['monospace'],
      },
    },
  },
  plugins: [],
};
