/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f4f9',
          100: '#dce5f2',
          200: '#bdcfe7',
          300: '#91b1d8',
          400: '#5e8ec6',
          500: '#3b70b3',
          600: '#2c5798',
          700: '#1e3f73',
          800: '#18345e',
          900: '#0f2240',
          950: '#09152a',
        }
      }
    },
  },
  plugins: [],
}
