/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        game: ['Rajdhani', 'Orbitron', 'sans-serif'],
        display: ['Orbitron', 'sans-serif'],
      },
      colors: {
        cyber: {
          gold: '#FFD700',
          blue: '#00D4FF',
          purple: '#8B5CF6',
          dark: '#0A0F1E',
          panel: 'rgba(0,10,40,0.85)',
        },
      },
      animation: {
        'pulse-glow': 'pulseGlow 1s ease-in-out infinite',
        'float-up': 'floatUp 1.2s ease-out forwards',
        'shake': 'shake 0.3s ease-in-out',
        'ko-fly': 'koFly 0.8s ease-in forwards',
        'aura': 'aura 0.6s ease-in-out infinite alternate',
        'win-streak': 'winStreak 0.5s ease-out',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 10px #FFD700, 0 0 20px #FFD700' },
          '50%': { boxShadow: '0 0 30px #FFD700, 0 0 60px #FF8C00' },
        },
        floatUp: {
          '0%': { opacity: 1, transform: 'translateY(0) scale(1)' },
          '100%': { opacity: 0, transform: 'translateY(-80px) scale(1.4)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-8px)' },
          '75%': { transform: 'translateX(8px)' },
        },
        koFly: {
          '0%': { transform: 'translateY(0) rotate(0deg)', opacity: 1 },
          '100%': { transform: 'translateY(-300px) rotate(720deg)', opacity: 0 },
        },
        aura: {
          '0%': { filter: 'drop-shadow(0 0 8px #FFD700)' },
          '100%': { filter: 'drop-shadow(0 0 24px #FF8C00) drop-shadow(0 0 48px #FFD700)' },
        },
        winStreak: {
          '0%': { transform: 'scale(1.5)', color: '#FFD700' },
          '100%': { transform: 'scale(1)', color: '#FF4444' },
        },
      },
    },
  },
  plugins: [],
};
