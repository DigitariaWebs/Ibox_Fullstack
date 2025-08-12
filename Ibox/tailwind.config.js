/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: "#2563EB",
        secondary: "#10B981",
        background: "#FFFFFF",
        surface: "#F3F4F6",
        textPrimary: "#111827",
        textSecondary: "#6B7280",
        error: "#EF4444",
        warning: "#F59E0B",
        info: "#3B82F6",
        success: "#22C55E",
      },
    },
  },
  plugins: [],
}

