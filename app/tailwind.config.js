/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#090a0d',
        panel: '#101216',
        card: '#14161c',
        cardHover: '#181b22',
        border: 'rgba(255, 255, 255, 0.08)',
        borderHover: 'rgba(255, 255, 255, 0.16)',
        accent: {
          DEFAULT: '#14B8A6',
          hover: '#2DD4BF',
          subtle: 'rgba(20, 184, 166, 0.12)',
        },
        muted: '#8b929e',
        foreground: '#f0f2f5',
        danger: '#F43F5E',
      },
      borderRadius: {
        DEFAULT: '8px',
        sm: '6px',
        md: '8px',
        lg: '12px',
        xl: '16px',
      },
      fontFamily: {
        sans: ['"Inter Variable"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'card': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.05), 0 1px 3px 0 rgba(0, 0, 0, 0.4)',
        'card-hover': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.08), 0 8px 24px -4px rgba(0, 0, 0, 0.5)',
      },
    },
  },
  plugins: [],
};
