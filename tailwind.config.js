/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          900: '#0b1220',
          800: '#111a2e',
          700: '#1c2740',
          600: '#2b3a5c',
        },
        accent: {
          DEFAULT: '#1d4ed8',
          fg: '#1e3a8a',
          soft: '#dbeafe',
        },
        state: {
          green: '#059669',
          yellow: '#d97706',
          red: '#dc2626',
          grey: '#64748b',
          unknown: '#7c3aed',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      fontVariantNumeric: ['tabular-nums'],
    },
  },
  plugins: [],
};
