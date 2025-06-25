/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Geist Variable", "Inter", "sans-serif"],
        mono: ["Geist Mono", "monospace"],
      },
      colors: {
        gray: {
          50: "#f9fafb",
          100: "#f3f4f6",
          300: "#d1d5db",
          400: "#9ca3af",
          600: "#4b5563",
        },
        green: {
          600: "#16a34a",
          700: "#15803d",
        },
        blue: {
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
        },
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};