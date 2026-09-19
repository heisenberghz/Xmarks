/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0b0c0e',
        panel: '#121316',
        card: '#16171c',
        cardHover: '#1c1d24',
        border: 'rgba(255, 255, 255, 0.08)',
        borderHover: 'rgba(255, 255, 255, 0.16)',
        accent: {
          DEFAULT: '#5e6ad2',
          hover: '#6f7be2',
          subtle: 'rgba(94, 106, 210, 0.12)',
        },
        muted: '#8a8f98',
        foreground: '#f3f4f6',
        danger: '#f87171',
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
        'card': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.04), 0 1px 3px 0 rgba(0, 0, 0, 0.4)',
        'card-hover': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.08), 0 8px 24px -4px rgba(0, 0, 0, 0.6)',
      },
    },
  },
  plugins: [],
};
