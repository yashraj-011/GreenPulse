/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
  colors: {
    primary: {
      50: '#E6FFF4',   // mint tint
      100: '#C6F7E2',
      500: '#16A34A',  // green button
      600: '#15803D'
    },
    skysoft: {
      50: '#ECFEFF',
      100: '#E0F2FE'
    },
    lilac: {
      50: '#F5F3FF',
      100: '#EDE9FE'
    },
    peach: {
      50: '#FFF7ED',
      100: '#FFE4D5'
    }
  }
}
  },
  plugins: []
};
