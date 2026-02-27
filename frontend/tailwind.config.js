/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#19486A',
        secondary: '#3B82F6',
        accent: '#22D3EE',
        neutral: '#F3F4F6',
        surface: '#FFFFFF',
        success: '#10B981',
        warning: '#FBBF24',
        danger: '#EF4444',
      },
    },
  },
  plugins: [],
}