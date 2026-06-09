/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cake: {
          50:  '#fff7f4',
          100: '#ffe4d6',
          200: '#ffc4a8',
          500: '#e7825a',
          700: '#a14d2b',
        },
      },
    },
  },
  plugins: [],
};
