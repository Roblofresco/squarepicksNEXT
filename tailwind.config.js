/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3F0C44',
          50: '#F9E6FA',
          100: '#F0C6F2',
          200: '#E2A7E5',
          300: '#D388D8',
          400: '#C569CB',
          500: '#B64ABE',
          600: '#9A3CA1',
          700: '#7E2E84',
          800: '#621F67',
          900: '#3F0C44',
        },
        secondary: {
          DEFAULT: '#1F2937',
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
        },
        accent: {
          DEFAULT: '#F59E0B',
          50: '#FFFAF0',
          100: '#FEECCD',
          200: '#FCD9AA',
          300: '#FAC787',
          400: '#F8B464',
          500: '#F59E0B',
          600: '#D48806',
          700: '#B37105',
          800: '#925A04',
          900: '#714403',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}