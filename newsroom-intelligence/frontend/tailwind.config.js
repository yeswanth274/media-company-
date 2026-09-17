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
          50: '#450A0A',
          100: '#7F1D1D',
          200: '#991B1B',
          300: '#B91C1C',
          400: '#DC2626',
          500: '#EF4444',
          600: '#DC2626',
          700: '#B91C1C',
          800: '#991B1B',
          900: '#7F1D1D',
          950: '#450A0A',
        },
        surface: '#121215',
        background: '#09090B',
        muted: '#A1A1AA',
        dark: '#FAFAFA',
        cardBorder: '#27272A',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
        serif: ['Newsreader', 'Merriweather', 'Georgia', 'serif'],
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.4), 0 1px 2px 0 rgba(0, 0, 0, 0.3)',
        'elevated': '0 4px 12px -1px rgba(0, 0, 0, 0.6), 0 2px 4px -1px rgba(0, 0, 0, 0.4)',
        'red-glow': '0 0 20px -3px rgba(220, 38, 38, 0.35)',
      }
    },
  },
  plugins: [],
}
