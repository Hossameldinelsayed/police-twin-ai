import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      colors: {
        // Deep command-center inks
        ink: {
          950: '#04060C',
          900: '#070B14',
          850: '#0A0F1C',
          800: '#0E1424',
          750: '#131B2E',
          700: '#1A2438',
          600: '#243049',
          500: '#33425F',
        },
        // Primary "command" cyan
        command: {
          50: '#E6FBFF',
          100: '#C7F5FF',
          200: '#8DEBFF',
          300: '#4FDDFF',
          400: '#1FC8F5',
          500: '#06AEDB',
          600: '#048CB4',
          700: '#076E8E',
          800: '#0B5A73',
          900: '#0E4A60',
        },
        // AI / cognitive accent (violet)
        cognition: {
          300: '#C4B5FD',
          400: '#A78BFA',
          500: '#8B5CF6',
          600: '#7C3AED',
        },
        // Semantic risk scale
        risk: {
          low: '#10B981',
          guarded: '#3BC9A0',
          elevated: '#F4C152',
          high: '#F97316',
          severe: '#EF4444',
          critical: '#DC2626',
        },
        status: {
          ok: '#10B981',
          warn: '#F4C152',
          crit: '#EF4444',
          offline: '#64748B',
          info: '#38BDF8',
        },
      },
      backgroundImage: {
        'grid-faint':
          'linear-gradient(to right, rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.035) 1px, transparent 1px)',
        'radial-glow':
          'radial-gradient(circle at 50% 0%, rgba(6,174,219,0.16), transparent 60%)',
        'command-sheen':
          'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0) 45%)',
      },
      backgroundSize: {
        grid: '40px 40px',
      },
      boxShadow: {
        glass:
          '0 1px 0 0 rgba(255,255,255,0.05) inset, 0 8px 40px -12px rgba(0,0,0,0.7)',
        glow: '0 0 0 1px rgba(6,174,219,0.25), 0 0 28px -4px rgba(6,174,219,0.45)',
        'glow-violet':
          '0 0 0 1px rgba(139,92,246,0.25), 0 0 28px -4px rgba(139,92,246,0.45)',
        'glow-red':
          '0 0 0 1px rgba(239,68,68,0.3), 0 0 26px -4px rgba(239,68,68,0.5)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
      keyframes: {
        'pulse-ring': {
          '0%': { transform: 'scale(0.8)', opacity: '0.7' },
          '80%, 100%': { transform: 'scale(2.2)', opacity: '0' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        sweep: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'pulse-ring': 'pulse-ring 2.4s cubic-bezier(0.4,0,0.2,1) infinite',
        shimmer: 'shimmer 2.5s infinite',
        'float-slow': 'float-slow 6s ease-in-out infinite',
        sweep: 'sweep 8s linear infinite',
        'fade-in-up': 'fade-in-up 0.5s ease-out both',
      },
    },
  },
  plugins: [],
};

export default config;
