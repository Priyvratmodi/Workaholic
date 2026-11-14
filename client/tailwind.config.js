/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#1D2125',
        column: '#22272B',
        card: '#2C333A',
        'card-hover': '#333B44',
        border: '#38414A',
        primary: {
          DEFAULT: '#579DFF',
          hover: '#85B8FF',
          container: '#579DFF',
        },
        surface: {
          DEFAULT: '#101418',
          dim: '#101418',
          bright: '#363a3e',
          container: '#1c2024',
          'container-low': '#181c20',
          'container-high': '#262a2e',
          'container-highest': '#313539',
          'container-lowest': '#0b0f12',
        },
        'on-surface': {
          DEFAULT: '#e0e3e8',
          variant: '#c1c6d4',
        },
        accent: {
          success: '#4BCE97',
          warning: '#F5CD47',
          danger: '#F87168',
          purple: '#9F8FEF',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '8px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        full: '9999px',
      },
    },
  },
  plugins: [],
};
