/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        thaiwatsadu: {
          red: '#D92D20',
          darkRed: '#B42318',
          blue: '#175CD3',
          dark: '#1D2939',
        },
      },
    },
  },
  plugins: [],
};
