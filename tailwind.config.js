/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: {
          primary: '#0a0e1b',
          secondary: '#1f2937',
        },
        text: {
          primary: '#eeeeee',
          secondary: '#64748b',
        },
        accent: {
          1: '#1bb0f2',
          2: '#5855e4',
          3: '#d43dae',
          4: '#5c5ddb',
        },
      },
      backgroundImage: {
        'gradient-accent1-accent4': 'linear-gradient(to right, #1bb0f2, #5c5ddb)',
        'gradient-accent2-accent3': 'linear-gradient(to right, #5855e4, #d43dae)',
      },
      fontFamily: {
        sans: ['Epilogue', 'sans-serif'],
        second: ['"Big Shoulders Stencil Text"', 'sans-serif'],
      },
      keyframes: {
        tumble: {
          '0%': { transform: 'translateX(-150%) rotate(-90deg)', opacity: '0' },
          '25%': { opacity: '1' },
          '75%': { transform: 'translateX(150%) rotate(270deg)', opacity: '1' },
          '100%': { transform: 'translateX(200%) rotate(360deg)', opacity: '0' },
        }
      },
      animation: {
        tumble: 'tumble 2.5s ease-in-out infinite',
        'tumble-delay-1': 'tumble 2.5s 0.2s ease-in-out infinite',
        'tumble-delay-2': 'tumble 2.5s 0.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
} 