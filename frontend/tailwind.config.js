/** @type {import('tailwindcss').Config} */
export default {
  prefix: 'tw-',
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#f5f0ff',
          100: '#ede5ff',
          200: '#dccbff',
          300: '#c4a1ff',
          400: '#a66dff',
          500: '#8b3dff',
          DEFAULT: '#5B16A3',
          600: '#5B16A3',
          700: '#4a1185',
          800: '#3d0e6e',
          900: '#2d0a52',
          950: '#1a0630',
          dark: '#3F0E73',
        },
        accent: {
          DEFAULT: '#7A2BCB',
          light: '#9b5de5',
          dark: '#5a1f96',
        },
        surface: {
          DEFAULT: 'var(--surface-background)',
          secondary: 'var(--surface-secondary)',
          tertiary: 'var(--surface-tertiary)',
          card: 'var(--surface-card)',
          sidebar: 'var(--surface-sidebar)',
          overlay: 'var(--surface-overlay)',
        },
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0,0,0,0.04), 0 1px 2px -1px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 12px -2px rgba(0,0,0,0.08), 0 2px 6px -2px rgba(0,0,0,0.04)',
        'sidebar': '1px 0 0 0 rgba(0,0,0,0.05)',
        'header': '0 1px 0 0 rgba(0,0,0,0.05)',
        'dropdown': '0 8px 30px rgba(0,0,0,0.12)',
        'modal': '0 20px 60px -12px rgba(0,0,0,0.25)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translate3d(0, 0, 0)' },
          '50%': { transform: 'translate3d(0, -14px, 0)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '0.35', transform: 'scale(1)' },
          '50%': { opacity: '0.55', transform: 'scale(1.08)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          from: { opacity: '0', transform: 'translateY(-8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        float: 'float 8s ease-in-out infinite',
        'spin-slow': 'spin 20s linear infinite',
        'pulse-glow': 'pulse-glow 6s ease-in-out infinite',
        fadeIn: 'fadeIn 0.3s ease-out',
        slideUp: 'slideUp 0.3s ease-out',
        slideDown: 'slideDown 0.3s ease-out',
        scaleIn: 'scaleIn 0.2s ease-out',
        shimmer: 'shimmer 2s infinite linear',
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [],
};
