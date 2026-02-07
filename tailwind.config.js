/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#106EBE',
        'ribbon-bg': '#f3f2f1',
        'ribbon-border': '#edebe9',
        'ribbon-hover': '#e1dfdd',
        'text-slate': '#323130',
        'text-gray': '#605e5c',
      },
    },
  },
  plugins: [],
}

