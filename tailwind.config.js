/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Helvetica Neue"', 'Helvetica', 'Arial', 'sans-serif'],
      },
      colors: {
        avenue: {
          dark:    'rgb(var(--av-dark) / <alpha-value>)',
          muted:   'rgb(var(--av-muted) / <alpha-value>)',
          border:  'rgb(var(--av-border) / <alpha-value>)',
          surface: 'rgb(var(--av-surface) / <alpha-value>)',
          light:   'rgb(var(--av-light) / <alpha-value>)',
          bg:      'rgb(var(--av-bg) / <alpha-value>)',
        },
      },
      boxShadow: {
        subtle: '0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.04)',
        card:   '0 4px 16px 0 rgba(0,0,0,0.07)',
      },
    },
  },
  plugins: [],
}
