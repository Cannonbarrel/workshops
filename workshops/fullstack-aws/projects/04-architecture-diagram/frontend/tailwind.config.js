/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './lib/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      animation: {
        'fade-up':    'fadeUp 0.4s ease-out',
        'fade-in':    'fadeIn 0.3s ease-out',
        'glow-pulse': 'glowPulse 4s ease-in-out infinite',
        'slide-in':   'slideIn 0.3s ease-out',
        'skeleton':   'skeleton 1.6s ease-in-out infinite',
      },
      keyframes: {
        fadeUp:    { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        fadeIn:    { from: { opacity: '0' }, to: { opacity: '1' } },
        glowPulse: { '0%,100%': { opacity: '0.5' }, '50%': { opacity: '1' } },
        slideIn:   { from: { opacity: '0', transform: 'translateY(-10px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        skeleton:  { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.4' } },
      },
    },
  },
  plugins: [],
};
