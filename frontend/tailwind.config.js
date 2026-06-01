/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bitcoin-orange': '#F7931A',
        'bitcoin-dark':   '#0B0B0F',
        'bitcoin-card':   '#15151B',
      },
    },
  },
  plugins: [],
}
