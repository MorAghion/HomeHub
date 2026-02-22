/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // פלטת HomeHub המורחבת שלך
        'hh-taupe': {
          DEFAULT: '#8B7E74',
          light: '#A39A91',
          dark: '#6D6157',
        },
        'hh-cream': {
          DEFAULT: '#F5F5DC',
          light: '#FAFAED',
          dark: '#E8E8C8',
        },
        'hh-sage': {
          DEFAULT: '#8A9A8B',
          light: '#A8B5A9',
          dark: '#6C7E6D',
        },
        'hh-burgundy': '#630606', // הבורדו להדגשות
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}