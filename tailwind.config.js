/** @type {import('tailwindcss').Config} */

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        primary: {
          50: '#e8f0fe',
          100: '#c5d6f9',
          200: '#9cbcf4',
          300: '#73a2ef',
          400: '#5790eb',
          500: '#3b7ee7',
          600: '#3576e4',
          700: '#2d6ae0',
          800: '#265fdc',
          900: '#194dd5',
        },
        accent: {
          50: '#fff3e8',
          100: '#ffe0c5',
          200: '#ffcb9c',
          300: '#ffb673',
          400: '#ffa657',
          500: '#ff963b',
          600: '#ff8e35',
          700: '#ff832d',
          800: '#ff7926',
          900: '#ff6719',
        },
      },
      fontFamily: {
        display: ['Rajdhani', 'Noto Sans SC', 'sans-serif'],
        sans: ['Noto Sans SC', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
