/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0a0a0d",
        yellow: {
          primary: "#facc15",
          secondary: "#ffe27a",
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'flash': 'flash 2s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 8s ease-in-out infinite',
        'slow-rotate': 'slow-rotate 30s linear infinite',
        'typewriter': 'typewriter 2s steps(40) infinite',
        'fadeIn': 'fadeIn 0.6s ease-out forwards',
      },
      keyframes: {
        flash: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        'pulse-glow': {
          '0%, 100%': { 
            boxShadow: '0 0 20px rgba(250, 204, 21, 0.1)',
            transform: 'scale(1)',
          },
          '50%': { 
            boxShadow: '0 0 40px rgba(250, 204, 21, 0.2)',
            transform: 'scale(1.02)',
          },
        },
        'slow-rotate': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        typewriter: {
          '0%, 100%': { width: '0%' },
          '50%': { width: '100%' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}