/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Helvetica Neue"', 'Helvetica', 'Arial', 'sans-serif'],
      },
      colors: {
        avenue: {
          dark:    '#0D2E3F',
          green:   '#1B4332',
          muted:   '#71717A',
          border:  '#E4E4E7',
          surface: '#F9F9F9',
          light:   '#F4F4F5',
        },
      },
      boxShadow: {
        subtle: '0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.04)',
        card:   '0 2px 8px 0 rgba(0,0,0,0.06)',
      },
    },
  },
  plugins: [],
}
