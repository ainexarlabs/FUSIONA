import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        fusiona: {
          red: '#E8382D',
          'red-dark': '#c22b22',
          black: '#101010',
          bg: '#f0eee9',
          card: '#FAFAF8',
          cream: '#FAF7F2',
        },
      },
      fontFamily: {
        sans: ['Manrope', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl2: '16px',
      },
    },
  },
  plugins: [],
} satisfies Config;
