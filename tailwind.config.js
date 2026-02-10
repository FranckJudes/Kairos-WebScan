/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#106EBE',
        'ribbon-bg': '#f3f2f1',
        'ribbon-border': '#edebe9',
        'ribbon-hover': '#e1dfdd',
        'text-slate': '#323130',
        'text-gray': '#605e5c',
        // Dark mode colors - camelCase pour correspondre aux classes utilisées
        'dark-bg': '#1a1a1a',
        'dark-bgSecondary': '#242424',
        'dark-bgTertiary': '#2d2d2d',
        'dark-border': '#3d3d3d',
        'dark-borderLight': '#4d4d4d',
        'dark-text': '#e8e8e8',
        'dark-textSecondary': '#a0a0a0',
        'dark-textTertiary': '#707070',
        'dark-hover': '#3a3a3a',
      },
    },
  },
  plugins: [],
}

