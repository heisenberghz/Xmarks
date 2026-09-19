/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0c0b0e',
        panel: '#121116',
        card: '#17161c',
        cardHover: '#1d1b24',
        border: 'rgba(245, 235, 220, 0.08)',
        borderHover: 'rgba(245, 158, 11, 0.28)',
        accent: {
          DEFAULT: '#F59E0B',
          hover: '#FBBF24',
          subtle: 'rgba(245, 158, 11, 0.12)',
        },
        sage: {
          DEFAULT: '#10B981',
          hover: '#34D399',
          subtle: 'rgba(16, 185, 129, 0.12)',
        },
        muted: '#9b948a',
        foreground: '#f5f2eb',
        danger: '#F43F5E',
      },
      borderRadius: {
        DEFAULT: '8px',
        sm: '6px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '20px',
      },
      fontFamily: {
        sans: ['"Inter Variable"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'card': 'inset 0 1px 0 0 rgba(255, 245, 230, 0.06), 0 2px 8px -2px rgba(0, 0, 0, 0.6)',
        'card-hover': 'inset 0 1px 0 0 rgba(245, 158, 11, 0.2), 0 12px 28px -6px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(245, 158, 11, 0.15)',
      },
    },
  },
  plugins: [],
};
