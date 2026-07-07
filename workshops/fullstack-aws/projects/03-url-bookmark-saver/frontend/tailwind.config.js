/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        zinc: {
          925: '#111113',
          950: '#09090b',
        },
      },
      animation: {
        'fade-in':     'fadeIn 0.25s ease-out',
        'fade-up':     'fadeUp 0.4s ease-out',
        'slide-in':    'slideIn 0.3s ease-out',
        'skeleton':    'skeleton 1.6s ease-in-out infinite',
        'glow-pulse':  'glowPulse 4s ease-in-out infinite',
        'spin-slow':   'spin 3s linear infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0', transform: 'scale(0.97)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          from: { opacity: '0', transform: 'translateY(-10px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        skeleton: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.35' },
        },
        glowPulse: {
          '0%, 100%': { opacity: '0.6', transform: 'scale(1)' },
          '50%':      { opacity: '1',   transform: 'scale(1.08)' },
        },
      },
      backgroundImage: {
        'hero-gradient': 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(99,102,241,0.25) 0%, transparent 60%)',
        'card-shine':    'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 50%)',
      },
    },
  },
  plugins: [],
};
